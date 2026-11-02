import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const window = { __BUFFET_SCENARIO_TEST__: true, location: { search: '' } };
const document = { body: { getAttribute: () => 'test' }, getElementById: () => ({}) };
const context = vm.createContext({ window, document, URLSearchParams, console, Set });
for (const file of ['buffet-rule-policy.js', 'buffet-rule-profile.js', 'order-limit-flow.js']) {
  vm.runInContext(fs.readFileSync(`dist/Configuration center/assets/${file}`, 'utf8'), context);
}
const api = window.BuffetPeriodScenarioTestApi;
const draft = {
  schemaVersion: 4, buffetTemplateSelectionMode: 'preset_only', name: '验收规则',
  subject: 'order', targetType: 'dish', conditions: {}, enabledPeriods: [], periodPolicies: {},
  partyRanges: [{ min: 1, max: null }], roundRanges: [{ min: 1, max: null }],
};
assert.match(api.validateStep(1, draft), /请选择常用模板/);
const templates = window.ORDER_LIMIT_MODULE_PROFILE.periodTemplates.filter(t => !t.hidden && t.id !== 'custom');
assert.equal(templates.length, 9);
for (const template of templates) {
  const candidate = structuredClone(draft);
  api.applyBuffetTemplate(candidate, template.id);
  assert.equal(api.validateStep(1, candidate), null, template.id);
  const html = api.renderStepOne(candidate);
  assert.doesNotMatch(html, /data-buffet-template="custom"|<h4>自定义<\/h4>/);
  assert.equal((html.match(/data-choice-field="subject"[^>]* disabled/g) || []).length, 2);
  assert.doesNotMatch(html, /data-choice-field="targetType"[^>]* disabled/);
  assert.doesNotMatch(html, /data-period-select=/);
  assert.match(html, /模板已锁定周期/);
  assert.equal(api.buffetTemplateFieldLocked(candidate, 'subject'), true);
  assert.equal(api.buffetTemplateFieldLocked(candidate, 'targetType'), false);
  candidate.enabledPeriods = ['per_round', 'multi_round'];
  assert.match(api.validateStep(1, candidate), /模板预设/);
}
const current = structuredClone(draft);
api.applyBuffetTemplate(current, 'order-basic');
const before = JSON.stringify(current);
api.applyBuffetTemplate(current, 'custom');
assert.equal(JSON.stringify(current), before, 'cannot apply custom programmatically');
api.selectSingleBuffetPeriod(current, 'per_round');
assert.equal(JSON.stringify(current), before, 'cannot bypass locked period');
const old = structuredClone(draft);
delete old.buffetTemplateSelectionMode;
api.applyBuffetTemplate(old, 'custom');
assert.equal(old.buffetTemplateId, 'custom');
assert.equal(api.buffetTemplateFieldLocked(old, 'subject'), false);
assert.match(api.renderStepOne(old), /data-buffet-template="custom"/);
const custom = structuredClone(current);
custom.buffetTemplateId = 'custom';
assert.match(api.validateStep(1, custom), /请选择常用模板/);
console.log('verify-buffet-template-only: PASS (9 templates, rendering, guards, validation, legacy compatibility)');
