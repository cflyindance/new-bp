import { createPayrollDeclarationRepository, type PayrollDeclarationRepository } from "./payroll-declaration-api";
import { isDeclarationBrowserDemo } from './payroll-declaration-browser';
import type { PayrollPageContext } from "./payroll-context";
import type { DeclarationTemplateFamily, DeclarationTemplateVersion } from "./payroll-declaration-types";
import { createDeclarationManagement } from './payroll-declaration-management';
import { validateDeclarationSource } from './payroll-declaration-engine';
import type { PayrollScopeSnapshot } from './payroll-types';
import type { PayrollRuntimeHandle } from './payroll-legacy-runtime';
import { createDeclarationAssignmentDialog } from './payroll-declaration-assignment-dialog';

export interface PayrollDeclarationSettingsHandle {
  open(): Promise<void>;
  close(): void;
  refresh(): Promise<void>;
  destroy(): void;
}

interface SettingsState {
  filters?: { storeId: string; scope: string; status: string };
  families: DeclarationTemplateFamily[];
  versions: DeclarationTemplateVersion[];
  selectedFamilyId: string | null;
  message: string;
  busy: boolean;
  editorOpen: boolean;
  stores: PayrollScopeSnapshot['stores'];
  draft: { languageDisplayName: string; localeCode: string; source: string; scopeMode: 'enterprise' | 'store'; storeId: string };
  newVersion: boolean;
  loadWarning: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function statusLabel(status: DeclarationTemplateVersion["status"] | "empty"): string {
  return status === "published" ? "已发布" : status === "draft" ? "草稿" : status === "retired" ? "已停用" : "未配置";
}

function applicableVersion(family: DeclarationTemplateFamily, versions: DeclarationTemplateVersion[]): DeclarationTemplateVersion | undefined {
  return versions.filter((version) => version.familyId === family.familyId).sort((a, b) => Number(b.version ?? 0) - Number(a.version ?? 0))[0];
}

function renderSettings(surface: HTMLElement, state: SettingsState): void {
  const selected = state.families.find((family) => family.familyId === state.selectedFamilyId) ?? null;
  const selectedVersion = selected ? applicableVersion(selected, state.versions) : undefined;
  const published = selectedVersion?.status === 'published' && !state.newVersion;
  const retired = selectedVersion?.status === 'retired';
  const draft = state.draft;
  const storeLabel = (id: string) => state.stores.find(store => store.id === id)?.labelZh || id;
  const filters = state.filters ?? { storeId: '', scope: '', status: '' };
  const rows = state.families.filter(family =>
    (!filters.storeId || !family.scope.storeId || family.scope.storeId === filters.storeId)
    && (!filters.scope || (family.scope.storeId ? 'store' : 'enterprise') === filters.scope)
    && (!filters.status || applicableVersion(family, state.versions)?.status === filters.status)
  ).map((family) => {
    const version = applicableVersion(family, state.versions);
    const assignable = state.versions.some(v => v.familyId === family.familyId && v.versionId === family.activeVersionId && v.status === 'published');
    const active = family.familyId === state.selectedFamilyId ? " is-active" : "";
    const scope = family.scope.storeId ? storeLabel(family.scope.storeId) : "全部门店";
    return `<tr class="payroll-declaration-table-row${active}">
      <td><button type="button" class="payroll-declaration-name" data-declaration-family="${escapeHtml(family.familyId)}" ${state.busy ? 'disabled' : ''}>${escapeHtml(family.languageDisplayName)}</button></td>
      <td>${family.scope.storeId ? '指定门店' : '企业通用'}</td>
      <td>${escapeHtml(scope)}</td>
      <td><span class="payroll-declaration-status" data-status="${escapeHtml(version?.status ?? 'empty')}">${statusLabel(version?.status ?? 'empty')}</span></td>
      <td><div class="payroll-declaration-content-preview" dir="auto">${escapeHtml(version?.source || '—')}</div></td>
      <td>${version?.status === 'draft' ? `<button type="button" class="btn" data-declaration-family="${escapeHtml(family.familyId)}" ${state.busy?'disabled':''}>修改</button> <button type="button" class="btn" data-declaration-delete-family="${escapeHtml(family.familyId)}" ${state.busy?'disabled':''}>删除</button>` : version?.status === 'retired' ? `<button type="button" class="btn" data-declaration-family="${escapeHtml(family.familyId)}" ${state.busy?'disabled':''}>查看</button>` : `<button type="button" class="btn" data-declaration-assign-family="${escapeHtml(family.familyId)}" ${state.busy || !assignable ? 'disabled' : ''}>选择员工</button>${version?.status === 'published' ? ` <button type="button" class="btn" data-declaration-retire-family="${escapeHtml(family.familyId)}" ${state.busy?'disabled':''}>停用</button>` : ''}`}${version?.status === 'draft' && assignable ? '<small class="payroll-declaration-action-note">详情可使用当前已发布版本选择员工</small>' : ''}</td>
    </tr>`;
  }).join("");
  surface.innerHTML = `
    <header class="payroll-declaration-settings-header">
      <div><p>薪资管理</p><h2>员工声明设置</h2></div>
      <button type="button" class="btn" data-declaration-close>返回薪资管理</button>
    </header>
    <div class="payroll-declaration-settings-toolbar">
      <div><strong>企业声明模板库</strong><p>${isDeclarationBrowserDemo() ? '演示模式：仅保存在当前浏览器，清除站点数据后会丢失，不同设备不共享。' : '维护员工确认时使用的已审核语言版本'}</p></div>
      <button type="button" class="btn btn-primary" data-declaration-new ${state.busy ? 'disabled' : ''}>新增语言模板</button>
    </div>
    ${state.loadWarning ? `<p role="status" class="payroll-declaration-settings-message">${escapeHtml(state.loadWarning)}</p>` : ''}
    <div class="payroll-declaration-settings-layout payroll-declaration-library">
      <div class="payroll-declaration-filters" role="group" aria-label="模板筛选">
        <label>门店<select data-declaration-filter="storeId" ${state.busy ? 'disabled' : ''}><option value="">全部门店</option>${state.stores.map(store=>`<option value="${escapeHtml(store.id)}" ${filters.storeId===store.id?'selected':''}>${escapeHtml(store.labelZh || store.id)}</option>`).join('')}</select></label>
        <label>模板范围<select data-declaration-filter="scope" ${state.busy ? 'disabled' : ''}>${[['','全部'],['enterprise','企业通用'],['store','指定门店']].map(([value,label])=>`<option value="${value}" ${filters.scope===value?'selected':''}>${label}</option>`).join('')}</select></label>
        <label>状态<select data-declaration-filter="status" ${state.busy ? 'disabled' : ''}>${[['','全部'],['draft','草稿'],['published','已发布'],['retired','已停用']].map(([value,label])=>`<option value="${value}" ${filters.status===value?'selected':''}>${label}</option>`).join('')}</select></label>
        <button type="button" class="btn" data-declaration-filter-reset ${state.busy?'disabled':''}>重置</button>
      </div>
      <div class="payroll-declaration-table-scroll" role="region" aria-label="声明模板表格滚动区域" tabindex="0">
        <table class="payroll-declaration-table" aria-label="声明模板列表">
          <colgroup><col style="width:16%"><col style="width:12%"><col style="width:18%"><col style="width:10%"><col style="width:30%"><col style="width:14%"></colgroup>
          <thead><tr><th scope="col">模板名称</th><th scope="col">模板范围</th><th scope="col">门店</th><th scope="col">状态</th><th scope="col">声明内容</th><th scope="col">操作</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6" class="payroll-declaration-empty">${state.busy ? '正在加载模板…' : state.families.length ? '暂无符合条件的模板' : '暂无模板'}</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    ${state.editorOpen ? `<div class="payroll-declaration-dialog-overlay">
      <section class="payroll-declaration-editor payroll-declaration-dialog" role="dialog" aria-modal="true" aria-labelledby="declaration-dialog-title">
        <header class="payroll-declaration-dialog-header"><h3 id="declaration-dialog-title">${selected ? "语言模板" : "新增语言模板"}</h3><button type="button" class="btn" data-declaration-editor-close>关闭</button></header>
        <div class="payroll-declaration-editor-grid">
          <label>语言名称<input data-declaration-language value="${escapeHtml(draft.languageDisplayName)}" ${selected || state.busy ? "disabled" : ""}></label>
          <label>语言代码<input data-declaration-locale value="${escapeHtml(draft.localeCode)}" placeholder="例如 es-US" ${selected || state.busy ? "disabled" : ""}></label>
          <label>模板范围<select data-declaration-scope ${selected || state.busy ? "disabled" : ""}><option value="enterprise" ${draft.scopeMode === 'enterprise' ? 'selected' : ''}>企业通用</option><option value="store" ${draft.scopeMode === 'store' ? 'selected' : ''}>指定门店</option></select></label>
          ${draft.scopeMode === 'store' ? `<label>适用门店<select data-declaration-store required ${selected || state.busy ? 'disabled' : ''}>
            <option value="">${state.stores.length ? '请选择门店' : '暂无可选择的门店'}</option>
            ${state.stores.map(store => `<option value="${escapeHtml(store.id)}" ${draft.storeId === store.id ? 'selected' : ''}>${escapeHtml(store.labelZh || store.id)}</option>`).join('')}
            ${selected?.scope.storeId && !state.stores.some(store => store.id === selected.scope.storeId) ? `<option selected value="${escapeHtml(selected.scope.storeId)}">${escapeHtml(selected.scope.storeId)}</option>` : ''}
          </select></label>` : '<label>适用门店<input value="全部门店" disabled></label>'}
          ${selected ? `<label>当前状态<input value="${escapeHtml(statusLabel(state.newVersion ? 'draft' : selectedVersion?.status ?? "empty"))}" disabled></label>` : ''}
        </div>
        <label class="payroll-declaration-source-label">声明正文<textarea data-declaration-source rows="10" ${published || retired || state.busy ? "disabled" : ""}>${escapeHtml(draft.source)}</textarea></label>
        <div class="payroll-declaration-variables" aria-label="可用变量">
          ${[
            ["employee_name", "员工姓名"],
            ["pay_period_start", "薪资周期开始日期"],
            ["pay_period_end", "薪资周期结束日期"],
            ["regular_hours", "正常工时"],
            ["overtime_hours", "加班工时"],
            ["total_hours", "总工时"],
            ["tips_amount", "小费金额（Tips）"],
            ["gratuity_amount", "服务费金额（Gratuity）"],
            ["store_name", "门店名称"],
            ["confirmation_date", "员工确认日期"],
          ].map(([name, label]) => `<button type="button" data-declaration-variable="${name}" title="点击插入：${label}" ${published || retired || state.busy ? "disabled" : ""}><span>${label}</span> <code>{{${name}}}</code></button>`).join("")}
        </div>
        <section class="payroll-declaration-preview"><h3>打印预览</h3><p dir="auto">${escapeHtml(draft.source || "输入声明正文后在此预览")}</p></section>
        <fieldset class="payroll-declaration-editor-actions" style="border:0;padding:0;margin:0" ${state.busy || (draft.scopeMode === 'store' && !state.stores.some(store => store.id === draft.storeId)) ? 'disabled' : ''}>
          ${!retired && selected && state.versions.some(v=>v.versionId===selected.activeVersionId && v.status==='published') ? '<button type="button" class="btn" data-declaration-assign>批量分配员工</button>' : ''}
          ${retired ? '' : published ? '<button type="button" class="btn" data-declaration-new-version>创建新版本</button><button type="button" class="btn" data-declaration-retire>停用</button>' : `<button type="button" class="btn" data-declaration-save>保存草稿</button><button type="button" class="btn btn-primary" data-declaration-publish>保存并发布</button>${selectedVersion?.status==='draft'?'<button type="button" class="btn" data-declaration-delete>删除草稿</button>':''}`}
        </fieldset>
        <p class="payroll-declaration-settings-message" aria-live="polite">${escapeHtml(state.message)}</p>
      </section>
    </div>` : `<p class="payroll-declaration-settings-message" aria-live="polite">${escapeHtml(state.message)}</p>`}`;
}

export function createPayrollDeclarationSettingsController(input: {
  shadowRoot: ShadowRoot;
  pageRoot: HTMLElement;
  context: PayrollPageContext;
  runtime?: PayrollRuntimeHandle;
  repository?: PayrollDeclarationRepository;
  repositoryFactory?: (organizationId: string, storeId?: string) => PayrollDeclarationRepository;
}): PayrollDeclarationSettingsHandle {
  const blankDraft = (): SettingsState['draft'] => ({ languageDisplayName: '', localeCode: '', source: '', scopeMode: 'enterprise', storeId: input.context.getScope().storeId || '' });
  const state: SettingsState = { families: [], versions: [], selectedFamilyId: null, message: "", busy: false, editorOpen: false, stores: [], draft: blankDraft(), newVersion: false, loadWarning: '' };
  const surface = document.createElement("dialog");
  surface.setAttribute("aria-label", "员工声明设置");
  surface.className = "payroll-declaration-settings-screen";
  surface.dataset.payrollDeclarationSettings = "";
  surface.hidden = true;
  input.pageRoot.append(surface);

  const actionHost = input.shadowRoot.querySelector<HTMLElement>(".payroll-workspace-actions") ?? input.pageRoot;
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "btn payroll-workspace-action-btn no-print";
  openButton.dataset.action = "open-declaration-settings";
  openButton.textContent = "员工声明设置";
  actionHost.prepend(openButton);

  let returnFocus: HTMLElement | null = null;
  let destroyed = false;
  let generation = 0;
  const manager = createDeclarationManagement(input.context, (organizationId, storeId) => input.repositoryFactory?.(organizationId, storeId)
    ?? input.repository
    ?? createPayrollDeclarationRepository({ organizationId, storeId, actorId: 'payroll-admin', permission: 'publish' }));
  const current = (token: number) => !destroyed && generation === token;
  const confirmAction = (message: string): Promise<boolean> => new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'payroll-declaration-assignment';
    dialog.style.width = 'min(480px, calc(100vw - 32px))';
    dialog.setAttribute('aria-label', '确认模板操作');
    dialog.innerHTML = `<h2>确认操作</h2><p>${escapeHtml(message)}</p><div style="display:flex;justify-content:flex-end;gap:12px"><button type="button" data-cancel>取消</button><button type="button" data-confirm>确认</button></div>`;
    let finished = false;
    const finish = (accepted: boolean) => { if (finished) return; finished = true; dialog.close(); dialog.remove(); unsubscribeConfirm(); resolve(accepted); };
    const unsubscribeConfirm = input.context.subscribeScopeChange(() => finish(false));
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
    dialog.querySelector('[data-cancel]')!.addEventListener('click', () => finish(false));
    dialog.querySelector('[data-confirm]')!.addEventListener('click', () => finish(true));
    input.pageRoot.append(dialog); dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-cancel]')!.focus();
  });
  const assignment = input.runtime ? createDeclarationAssignmentDialog(input.pageRoot, manager, input.runtime, input.context) : null;
  const selected = () => state.families.find((family) => family.familyId === state.selectedFamilyId) ?? null;
  const loadEditor = () => {
    const family = selected();
    const version = family ? applicableVersion(family, state.versions) : undefined;
    state.newVersion = false;
    state.draft = family ? { languageDisplayName: family.languageDisplayName, localeCode: family.localeCode, source: version?.source ?? '', scopeMode: family.scope.storeId ? 'store' : 'enterprise', storeId: family.scope.storeId ?? '' } : blankDraft();
  };

  const paint = () => { if (!destroyed) renderSettings(surface, state); };
  const reloadTemplates = async (token: number) => {
    const result = await manager.listTemplates();
    if (!current(token)) return;
    // Keep an open editor retryable when its store could not be reloaded.
    const editing = selected();
    if (editing && result.failedStores.length && !result.families.some(family => family.familyId === editing.familyId)) {
      result.families.push(editing);
      result.versions.push(...state.versions.filter(version => version.familyId === editing.familyId));
    }
    state.families = result.families; state.versions = result.versions;
    state.stores = manager.stores();
    state.loadWarning = result.failedStores.length ? `部分模板未加载：${result.failedStores.join('、')}，请重新打开设置重试。` : '';
    if (state.selectedFamilyId && !state.families.some(item => item.familyId === state.selectedFamilyId)) {
      state.selectedFamilyId = null; state.editorOpen = false;
    }
  };
  const refresh = async () => {
    const token = ++generation;
    state.stores = manager.stores();
    state.busy = true; state.message = "正在加载模板…"; paint();
    try {
      await reloadTemplates(token);
      if (!current(token)) return;
      state.message = "";
    } catch (error) { if (current(token)) state.message = error instanceof Error ? error.message : "模板加载失败"; }
    finally { if (current(token)) { state.busy = false; paint(); } }
  };
  const open = async () => {
    state.filters = { storeId: '', scope: '', status: '' };
    manager.invalidate();
    state.editorOpen = false; state.selectedFamilyId = null;
    returnFocus = input.shadowRoot.activeElement instanceof HTMLElement ? input.shadowRoot.activeElement : openButton;
    input.pageRoot.classList.add("payroll-declaration-settings-open"); surface.hidden = false; openButton.setAttribute("aria-expanded", "true");
    if (!surface.open) surface.showModal();
    await refresh(); surface.querySelector<HTMLElement>("[data-declaration-close]")?.focus();
  };
  const close = () => {
    generation++; manager.invalidate(); state.busy = false;
    surface.close();
    input.pageRoot.classList.remove("payroll-declaration-settings-open"); surface.hidden = true; openButton.setAttribute("aria-expanded", "false"); returnFocus?.focus();
  };
  const saveDraft = async (publish = false) => {
    if (state.busy) return;
    captureEditor();
    const { source, languageDisplayName, localeCode, scopeMode, storeId } = state.draft;
    if (!source.trim() || !languageDisplayName.trim() || !localeCode.trim()) { state.message = '请填写语言名称、语言代码和声明正文'; paint(); return; }
    if (validateDeclarationSource(source).length) { state.message = '声明正文仅支持纯文本和列表中的变量，请检查后重试'; paint(); return; }
    if (scopeMode === 'store' && !manager.stores().some(store => store.id === storeId)) { state.message = '请选择有权限的有效门店'; paint(); return; }
    let family = selected();
    const token = ++generation;
    let draftSaved = false;
    state.busy = true; paint();
    try {
      const repository = manager.repositoryFor(family ? family.scope.storeId : scopeMode === 'store' ? storeId : undefined);
      if (!family) {
        family = await repository.createFamily({ localeCode: localeCode.trim(), languageDisplayName: languageDisplayName.trim(), ...(scopeMode === 'store' ? { storeId } : {}) });
        if (!current(token)) return;
        state.families.push(family);
        state.selectedFamilyId = family.familyId;
      }
      const existingDraft = applicableVersion(family, state.versions);
      const version = existingDraft?.status === 'draft'
        ? await repository.updateDraft({ versionId: existingDraft.versionId, source, expectedFamilyRevision: Number(family.revision ?? 0) })
        : await repository.saveDraft({ familyId: family.familyId, source, variableSchemaVersion: "v1" });
      if (!current(token)) return;
      state.versions = state.versions.filter(v => v.versionId !== version.versionId);
      state.versions.push(version); state.newVersion = true; draftSaved = true;
      // updateDraft advances the family revision; creating a draft retains it.
      if (existingDraft?.status === 'draft') family.revision = Number(family.revision ?? 0) + 1;
      if (publish) {
        const result = await repository.publishVersion({ versionId: version.versionId, expectedFamilyRevision: Number(family.revision ?? 0) });
        if (!current(token)) return;
        state.families = state.families.map(f => f.familyId === result.family.familyId ? result.family : f);
        state.versions = state.versions.map(v => v.versionId === result.version.versionId ? result.version : v.familyId === result.family.familyId && v.status === 'published' ? { ...v, status: 'retired' } : v);
      }
      state.editorOpen = false; state.selectedFamilyId = null; state.newVersion = false;
      state.message = publish ? '模板已保存并发布' : '草稿已保存';
      try { await reloadTemplates(token); }
      catch (error) { if (current(token)) state.message += `，列表刷新失败：${error instanceof Error ? error.message : '请重新打开设置'}`; }
    } catch (error) {
      if (current(token)) state.message = `${publish && draftSaved ? '草稿已保存，但发布失败：' : '保存失败：'}${error instanceof Error ? error.message : '请重试'}`;
    }
    finally { if (current(token)) { state.busy = false; paint(); if (!state.editorOpen) surface.querySelector<HTMLElement>('[data-declaration-new]')?.focus(); } }
  };
  const retirePublished = async (family = selected()) => {
    const version = family ? state.versions.find((item) => item.versionId === family.activeVersionId && item.status === "published") : undefined;
    if (!family || !version) return;
    const beforeConfirm = generation;
    if (!await confirmAction(`确定停用“${family.languageDisplayName}”吗？停用后不能新分配，已关联员工可能提示模板不可用；历史已确认声明不变。`) || !current(beforeConfirm)) return;
    const token = ++generation;
    state.busy = true; paint();
    try {
      await manager.repositoryFor(family.scope.storeId).retireVersion({ versionId: version.versionId, expectedFamilyRevision: Number(family.revision ?? 0) });
      if (!current(token)) return;
      await reloadTemplates(token);
      if (current(token)) { loadEditor(); state.message = "模板已停用"; }
    } catch (error) { if (current(token)) state.message = error instanceof Error ? error.message : "模板停用失败"; }
    finally { if (current(token)) { state.busy = false; paint(); } }
  };

  const deleteDraftVersion = async (family: DeclarationTemplateFamily | null | undefined) => {
    const version = family ? applicableVersion(family, state.versions) : undefined;
    if (!family || !version || version.status !== 'draft' || state.busy) return;
    const beforeConfirm = generation;
    if (!await confirmAction(`确定删除“${family.languageDisplayName}”的草稿 V${version.version} 吗？仅删除该草稿，原已发布版本、员工关联及历史声明不变。`) || !current(beforeConfirm)) return;
    const token = ++generation;
    state.busy = true; paint();
    try {
      await manager.repositoryFor(family.scope.storeId).deleteDraft({ versionId: version.versionId, expectedFamilyRevision: Number(family.revision ?? 0) });
      if (!current(token)) return;
      if (state.selectedFamilyId === family.familyId) { state.editorOpen = false; state.selectedFamilyId = null; }
      await reloadTemplates(token);
      if (current(token)) state.message = '草稿已删除';
    } catch (error) { if (current(token)) state.message = error instanceof Error ? error.message : '删除失败'; }
    finally { if (current(token)) { state.busy = false; paint(); } }
  };
  const onClick = (event: Event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-declaration-assign]')) { const family = selected(); if (family && !state.busy) void assignment?.open(family); return; }
    if (state.busy) return;
    if (target.closest("[data-declaration-editor-close]")) { closeEditor(); return; }
    const deleteButton = target.closest<HTMLElement>('[data-declaration-delete-family], [data-declaration-delete]');
    if (deleteButton) { void deleteDraftVersion(deleteButton.dataset.declarationDeleteFamily ? state.families.find(f=>f.familyId===deleteButton.dataset.declarationDeleteFamily) : selected()); return; }
    const retireButton = target.closest<HTMLElement>('[data-declaration-retire-family]');
    if (retireButton) { void retirePublished(state.families.find(f=>f.familyId===retireButton.dataset.declarationRetireFamily)); return; }
    const rowAssignment = target.closest<HTMLElement>('[data-declaration-assign-family]');
    if (rowAssignment) {
      const family = state.families.find(f => f.familyId === rowAssignment.dataset.declarationAssignFamily);
      if (family && state.versions.some(v => v.familyId === family.familyId && v.versionId === family.activeVersionId && v.status === 'published')) void assignment?.open(family);
      return;
    }
    if (target.closest('[data-declaration-filter-reset]')) { state.filters = { storeId: '', scope: '', status: '' }; paint(); surface.querySelector<HTMLElement>('[data-declaration-filter-reset]')?.focus(); return; }
    if (target.closest("[data-declaration-close]")) { close(); return; }
    if (target.closest("[data-declaration-new]")) { state.selectedFamilyId = null; loadEditor(); state.editorOpen = true; state.message = ""; paint(); surface.querySelector<HTMLElement>("[data-declaration-language]")?.focus(); return; }
    const familyButton = target.closest<HTMLElement>("[data-declaration-family]");
    if (familyButton) { state.selectedFamilyId = familyButton.dataset.declarationFamily ?? null; loadEditor(); state.editorOpen = true; state.message = ""; paint(); surface.querySelector<HTMLElement>("[data-declaration-editor-close]")?.focus(); return; }
    const variableButton = target.closest<HTMLElement>("[data-declaration-variable]");
    if (variableButton) {
      const editor = surface.querySelector<HTMLTextAreaElement>("[data-declaration-source]");
      if (editor && !editor.disabled) { const token = `{{${variableButton.dataset.declarationVariable}}}`; editor.setRangeText(token, editor.selectionStart, editor.selectionEnd, "end"); captureEditor(); updatePreview(); editor.focus(); }
      return;
    }
    if (target.closest("[data-declaration-save]")) { void saveDraft(); return; }
    if (target.closest("[data-declaration-publish]")) { void saveDraft(true); return; }
    if (target.closest("[data-declaration-retire]")) { void retirePublished(); return; }
    if (target.closest("[data-declaration-new-version]")) {
      state.newVersion = true;
      state.message = "请编辑正文并保存为新版本"; paint();
      return;
    }
  };
  const closeEditor = () => {
    state.editorOpen = false; state.selectedFamilyId = null; state.message = ""; paint();
    surface.querySelector<HTMLElement>("[data-declaration-new]")?.focus();
  };
  const captureEditor = () => {
    if (!state.editorOpen) return;
    const value = (selector: string) => surface.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value;
    state.draft.languageDisplayName = value('[data-declaration-language]') ?? state.draft.languageDisplayName;
    state.draft.localeCode = value('[data-declaration-locale]') ?? state.draft.localeCode;
    state.draft.source = value('[data-declaration-source]') ?? state.draft.source;
    if (!selected()) {
      state.draft.scopeMode = value('[data-declaration-scope]') === 'store' ? 'store' : 'enterprise';
      state.draft.storeId = value('[data-declaration-store]') ?? state.draft.storeId;
    }
  };
  const updatePreview = () => {
    const preview = surface.querySelector('.payroll-declaration-preview p');
    if (preview) preview.textContent = state.draft.source || '输入声明正文后在此预览';
  };
  const onInput = () => { if (!state.busy) { captureEditor(); updatePreview(); } };
  const onChange = (event: Event) => {
    if (state.busy) return;
    const filter = event.target instanceof HTMLSelectElement ? event.target.dataset.declarationFilter : undefined;
    if (filter && ['storeId', 'scope', 'status'].includes(filter)) {
      state.filters = { storeId: '', scope: '', status: '', ...state.filters, [filter]: (event.target as HTMLSelectElement).value };
      paint(); surface.querySelector<HTMLElement>(`[data-declaration-filter="${filter}"]`)?.focus(); return;
    }
    captureEditor();
    if (event.target instanceof Element && event.target.matches('[data-declaration-scope], [data-declaration-store]')) {
      const selector = event.target.matches('[data-declaration-scope]') ? '[data-declaration-scope]' : '[data-declaration-store]';
      state.message = ''; paint(); surface.querySelector<HTMLElement>(selector)?.focus();
    }
  };
  const unsubscribe = input.context.subscribeScopeChange(() => {
    state.filters = { storeId: '', scope: '', status: '' };
    generation++; manager.invalidate(); state.busy = false;
    state.families = []; state.versions = []; state.selectedFamilyId = null; state.editorOpen = false; state.loadWarning = '';
    if (surface.open) void refresh();
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (!state.editorOpen) return;
    if (event.key === "Escape" && !state.busy) { event.preventDefault(); event.stopPropagation(); closeEditor(); return; }
    if (event.key !== "Tab") return;
    const controls = Array.from(surface.querySelectorAll<HTMLElement>('[role="dialog"] button:not(:disabled), [role="dialog"] input:not(:disabled), [role="dialog"] select:not(:disabled), [role="dialog"] textarea:not(:disabled)'));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && input.shadowRoot.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && input.shadowRoot.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  openButton.addEventListener("click", () => { void open(); });
  surface.addEventListener("click", onClick);
  surface.addEventListener('input', onInput);
  surface.addEventListener('change', onChange);
  surface.addEventListener("keydown", onKeyDown);
  surface.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (state.busy) return;
    if (state.editorOpen) closeEditor();
    else close();
  });

  return { open, close, refresh, destroy() { assignment?.destroy(); destroyed = true; generation++; manager.invalidate(); unsubscribe(); surface.removeEventListener("click", onClick); surface.removeEventListener('input', onInput); surface.removeEventListener('change', onChange); surface.removeEventListener("keydown", onKeyDown); surface.remove(); openButton.remove(); } };
}
