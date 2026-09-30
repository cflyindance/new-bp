import type { DeclarationRepositoryScope, PayrollDeclarationRepository } from './payroll-declaration-api';
import { renderDeclarationText, stringifyDeclarationCanonicalPayload, validateDeclarationSource } from './payroll-declaration-engine';
import type { DeclarationSnapshot, DeclarationTemplateFamily, DeclarationTemplateVersion, DeclarationVariables, EmployeeDeclarationPreference, DeclarationPeriodOverride } from './payroll-declaration-types';

/** Explicit static-demo mode only; never fall back here after an HTTP failure. */
export function isDeclarationBrowserDemo(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io') ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname) && new URLSearchParams(window.location.search).get('payrollDeclarationDemo') === '1');
}

interface DemoData {
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  preferences: Record<string, EmployeeDeclarationPreference>;
  overrides: Record<string, DeclarationPeriodOverride>;
  snapshots: Record<string, DeclarationSnapshot>;
}

export function createBrowserDeclarationRepository(scope: DeclarationRepositoryScope): PayrollDeclarationRepository {
  const key = `menusifu.payroll.declaration.demo.v1:${encodeURIComponent(scope.organizationId)}`;
  const read = (): DemoData => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return { families: [], versions: [], preferences: {}, overrides: {}, snapshots: {} };
      const data = JSON.parse(raw);
      if (!Array.isArray(data.families) || !Array.isArray(data.versions) || !data.preferences || !data.overrides || !data.snapshots) throw new Error('schema');
      return data;
    } catch { throw new Error('无法读取浏览器中的演示数据，请检查浏览器存储设置；未覆盖原数据。'); }
  };
  const write = (data: DemoData) => {
    try { window.localStorage.setItem(key, JSON.stringify(data)); }
    catch { throw new Error('浏览器未能保存演示数据，请检查存储权限或剩余空间后重试。'); }
  };
  const authorize = (publish = false) => {
    if (!scope.organizationId || !scope.actorId || scope.permission === 'view' || (publish && scope.permission !== 'publish')) throw new Error('当前账号没有此操作权限');
  };
  const visible = (family: DeclarationTemplateFamily) => family.scope.organizationId === scope.organizationId && (!family.scope.storeId || family.scope.storeId === scope.storeId);
  const familyFor = (data: DemoData, id: string) => {
    const family = data.families.find(item => item.familyId === id && visible(item));
    if (!family) throw new Error('声明模板不存在或不属于当前门店');
    return family;
  };
  const id = () => crypto.randomUUID();
  const entryKey = (employee: string, period = '') => JSON.stringify([scope.storeId ?? '', employee, period]);
  const changeStatus = async (versionId: string, revision: number, publish: boolean) => {
    authorize(true);
    const data = read();
    const version = data.versions.find(item => item.versionId === versionId);
    if (!version) throw new Error('声明版本不存在');
    const family = familyFor(data, version.familyId);
    if ((family.revision ?? 0) !== revision) throw new Error('声明模板已被其他页面更新，请重新加载后再操作');
    if (publish ? version.status !== 'draft' : family.activeVersionId !== versionId) throw new Error('当前版本状态不允许此操作');
    const now = new Date().toISOString();
    if (publish) {
      data.versions.filter(item => item.familyId === family.familyId && item.status === 'published').forEach(item => { item.status = 'retired'; item.retiredAt = now; });
      version.status = 'published'; version.reviewedBy = scope.actorId; version.reviewedAt = now; version.publishedAt = now;
      family.activeVersionId = versionId;
    } else {
      version.status = 'retired'; version.retiredAt = now; family.activeVersionId = null;
    }
    family.revision = revision + 1;
    write(data);
    return { family, version };
  };
  return {
    async listTemplates() {
      const data = read(); const families = data.families.filter(visible);
      return { families, versions: data.versions.filter(item => families.some(family => family.familyId === item.familyId)) };
    },
    async createFamily(input) {
      authorize();
      if (!input.localeCode.trim() || !input.languageDisplayName.trim() || (input.storeId && input.storeId !== scope.storeId)) throw new Error('请填写语言名称、语言代码，并选择有效的门店范围');
      const data = read();
      const family: DeclarationTemplateFamily = { familyId: id(), scope: { organizationId: scope.organizationId, ...(input.storeId ? { storeId: input.storeId } : {}) }, localeCode: input.localeCode.trim(), languageDisplayName: input.languageDisplayName.trim(), activeVersionId: null, revision: 0 };
      data.families.push(family); write(data); return family;
    },
    async saveDraft(input) {
      authorize(); const data = read(); familyFor(data, input.familyId);
      if (!input.source.trim() || validateDeclarationSource(input.source).length) throw new Error('请填写有效的纯文本声明，且仅使用支持的变量');
      const version: DeclarationTemplateVersion = { ...input, versionId: id(), version: 1 + Math.max(0, ...data.versions.filter(item => item.familyId === input.familyId).map(item => item.version ?? 0)), status: 'draft', createdBy: scope.actorId, createdAt: new Date().toISOString() };
      data.versions.push(version); write(data); return version;
    },
    publishVersion: input => changeStatus(input.versionId, input.expectedFamilyRevision, true),
    retireVersion: input => changeStatus(input.versionId, input.expectedFamilyRevision, false),
    async saveEmployeePreference(input) {
      authorize(); const data = read();
      if (input.defaultFamilyId !== 'system-default') {
        const family = familyFor(data, input.defaultFamilyId);
        if (!data.versions.some(version => version.versionId === family.activeVersionId && version.familyId === family.familyId && version.status === 'published')) throw new Error('请先发布声明模板');
      } else if (input.defaultLocaleCode !== 'en-US') throw new Error('系统默认声明语言为 English');
      const preference = { ...input, updatedBy: scope.actorId, updatedAt: new Date().toISOString() };
      data.preferences[entryKey(input.employeeId)] = preference; write(data); return preference;
    },
    async savePeriodOverride(input) {
      authorize(); const data = read(); familyFor(data, input.familyId);
      data.overrides[entryKey(input.employeeId, input.periodId)] = input; write(data); return input;
    },
    async confirmDeclaration(input) {
      authorize(); const data = read();
      const published = (versionId: unknown) => {
        const version = data.versions.find(item => item.versionId === versionId && item.status === 'published');
        if (!version) throw new Error('请先发布声明模板');
        familyFor(data, version.familyId); return version;
      };
      const primary = published(input.primaryVersionId);
      const family = familyFor(data, primary.familyId);
      const english = input.printMode === 'bilingual-english' && !family.localeCode.toLowerCase().startsWith('en') ? published(input.englishVersionId) : null;
      const variables = input.variables as DeclarationVariables;
      if (!input.employeeId || !input.periodId || !variables) throw new Error('员工、周期和声明变量不能为空');
      const canonical = { localeCode: family.localeCode, printMode: english ? 'bilingual-english' as const : 'employee-only' as const, source: primary.source, variables, renderedText: renderDeclarationText(primary.source, variables), primaryVersionId: primary.versionId, englishVersionId: english?.versionId ?? null, englishSource: english?.source ?? null, renderedEnglishText: english ? renderDeclarationText(english.source, variables) : null };
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stringifyDeclarationCanonicalPayload(canonical)));
      const snapshot: DeclarationSnapshot = { ...canonical, snapshotId: id(), employeeId: String(input.employeeId), periodId: String(input.periodId), confirmedAt: new Date().toISOString(), lockedAt: null, hashAlgorithm: 'SHA-256(canonical-json-v1)', contentHash: Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('') };
      // Re-read after hashing so other local writes are not replaced by an old copy.
      const latest = read(); latest.snapshots[entryKey(snapshot.employeeId, snapshot.periodId)] = snapshot; write(latest); return snapshot;
    },
    async loadSnapshot(employeeId, periodId) { return read().snapshots[entryKey(employeeId, periodId)] ?? null; },
  };
}
