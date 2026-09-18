import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../dist/Configuration center/assets/order-limit-flow.js', import.meta.url), 'utf8');
const start = source.indexOf('  function renderV4PeriodSection(');
const end = source.indexOf('  function renderQuantitySceneDialog(', start);
assert.ok(start >= 0 && end > start);
const context = vm.createContext({
  quantityScenarioIndexes(draft, period) {
    const parties = draft.subject === 'party_size' ? draft.partyRanges.map((_, i) => i) : [0];
    const rounds = period === 'multi_round' ? draft.roundRanges.map((_, i) => i) : [0];
    return parties.flatMap(partyIndex => rounds.map(roundIndex => ({partyIndex, roundIndex})));
  },
  esc: String,
  formatRange: (range, unit) => `${range.min}${unit}`,
  v4PeriodValues: () => ({}),
  currentBuffetWorkbenchTargets: () => [],
  buffetWorkbenchTargetStatus: () => 'unconfigured',
  isBuffetComboDraft: () => false,
  v4ScenarioKey: (party, round) => `${party}:${round}`,
  hasConfiguredBoundCell: () => false,
});
vm.runInContext(source.slice(start, end), context);
const draft = {subject: 'party_size', partyRanges: [{min:1}, {min:2}, {min:3}], roundRanges: [{min:1}, {min:2}, {min:3}, {min:4}]};
const render = (subject, period) => context.renderV4PeriodSection({...draft, subject}, {}, period);
const count = (html, token) => html.split(token).length - 1;
const party = render('party_size', 'per_round');
assert.equal(count(party, 'class="olf-scene-grid"'), 1, '仅人数必须同一组横向卡片');
assert.equal(count(party, 'data-quantity-scene-open'), 3);
const round = render('order', 'multi_round');
assert.equal(count(round, 'class="olf-scene-grid"'), 1);
assert.equal(count(round, 'data-quantity-scene-open'), 4);
const both = render('party_size', 'multi_round');
assert.equal(count(both, 'class="olf-scene-grid"'), 3);
assert.equal(count(both, 'data-quantity-scene-open'), 12, '人数和轮次应生成笛卡尔组合');
for (let p = 0; p < 3; p++) for (let r = 0; r < 4; r++) {
  assert.ok(both.includes(`data-scene-party="${p}" data-scene-round="${r}"`));
}
console.log('verify-buffet-scene-cards: PASS');
