import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const runtime = fs.readFileSync(new URL('../src/team/payroll/payroll-legacy-runtime.ts', import.meta.url), 'utf8');
const legacy = fs.readFileSync(new URL('../src/team/payroll/legacy/payroll.js.txt', import.meta.url), 'utf8');
assert.match(runtime, /const PayrollDeclarationBridge = window\.PayrollDeclarationBridge;/, 'Declaration bridge must be bound in the isolated runtime');
const method = runtime.match(/async listPublishedTemplates\(\) \{([\s\S]*?)\n    \},/);
assert.ok(method, 'Employee language bridge must load published templates');
const families = [
  { familyId: 'zh', localeCode: 'zh-CN', languageDisplayName: '中文', scope: { organizationId: 'org' }, activeVersionId: 'v1' },
  { familyId: 'draft', scope: { organizationId: 'org' }, activeVersionId: 'v2' },
  { familyId: 'other-store', scope: { organizationId: 'org', storeId: 'other' }, activeVersionId: 'v3' },
  { familyId: 'other-org', scope: { organizationId: 'other' }, activeVersionId: 'v4' },
];
const versions = families.map((family, index) => ({ familyId: family.familyId, versionId: `v${index + 1}`, status: index === 1 ? 'draft' : 'published' }));
const list = vm.runInNewContext(`(async () => {${method[1]}})`, {
  context: { getScope: () => ({ brandId: 'org', storeId: 'store' }) },
  repository: { listTemplates: async () => ({ families, versions }) },
});
assert.deepEqual((await list()).map(item => item.familyId), ['zh']);
assert.match(legacy, /function refreshEmployeeDeclarationLanguages/);
assert.match(legacy, /PayrollDeclarationBridge\.listPublishedTemplates\(\)/);
assert.match(legacy, /option\.dataset\.familyId = family\.familyId/);
assert.match(legacy, /function showEmployeeEditModal[\s\S]*?refreshEmployeeDeclarationLanguages\(\)/);
assert.match(legacy, /declarationLocaleInput\.disabled/);
const uiSource = legacy.slice(legacy.indexOf('  let employeeDeclarationLanguageRequest ='), legacy.indexOf('  function renderManageForm()'));
const input = {
  options: [], selectedIndex: 0, disabled: false,
  get value() { return this.options[this.selectedIndex]?.value || ''; },
  get selectedOptions() { return this.options[this.selectedIndex] ? [this.options[this.selectedIndex]] : []; },
  appendChild(option) { this.options.push(option); },
  replaceChildren() { this.options = []; this.selectedIndex = 0; },
};
const hint = { textContent: '' };
let available = [families[0], { ...families[0], familyId: 'zh-store', scope: { organizationId: 'org', storeId: 'store' } }];
let reject = false;
const ui = vm.runInNewContext(`(() => {${uiSource}; return { refreshEmployeeDeclarationLanguages, selectEmployeeDeclarationPreference }; })()`, {
  $: selector => selector === '#field-declaration-locale' ? input : hint,
  document: { createElement: () => ({ dataset: {}, value: '', textContent: '', disabled: false }) },
  PayrollDeclarationBridge: { listPublishedTemplates: async () => { if (reject) throw Error('offline'); return available; } },
});
await ui.refreshEmployeeDeclarationLanguages();
assert.equal(input.options.length, 3);
assert.equal(input.options[0].textContent, '系统默认语言');
assert.equal(input.value, '', 'All unconfigured employees select system default');
ui.selectEmployeeDeclarationPreference({ defaultLocaleCode: 'zh-CN', defaultFamilyId: 'zh-store' });
await ui.refreshEmployeeDeclarationLanguages();
assert.equal(input.selectedOptions[0].dataset.familyId, 'zh-store', 'Same-language store template identity is retained');
reject = true;
await ui.refreshEmployeeDeclarationLanguages();
assert.equal(input.selectedOptions[0].dataset.familyId, 'zh-store');
assert.match(hint.textContent, /加载失败/);
assert.equal(input.disabled, false);
reject = false;
available = [];
await ui.refreshEmployeeDeclarationLanguages();
assert.equal(input.value, 'zh-CN', 'Unavailable saved language must not be silently cleared');
assert.equal(input.selectedOptions[0].disabled, true);
assert.match(hint.textContent, /暂无已发布模板/);
const amountFunction = legacy.match(/function getDeclarationAmounts\(emp\) \{([\s\S]*?)\n  \}/)[1];
const amounts = vm.runInNewContext(`(emp => {${amountFunction}})`, { fmtMoney: n => n == null ? '—' : Number(n).toFixed(2) });
assert.equal(amounts({ adjustments: { tips: 144 } }).svc, '$0.00', 'Default statement uses zero for absent service-charge amount in exports');
console.log('Declaration language options passed');
