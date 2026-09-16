import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-summary-ui.js.txt', 'utf8'), context);
const ui = context.window.TipOutSummaryUi;

const row = ui.normalizeEmployeeHoursRow({
  dateKey: '2026-09-15', punchHours: 5, punchHoursValid: true,
  allocationHourEntries: [
    { poolId: 'P1', poolName: '前厅池', ruleId: 'R1', ruleName: '服务员', usesHours: true, hours: 6, hoursValid: true },
    { poolId: 'P1', poolName: '前厅池', ruleId: 'R2', ruleName: '平均', usesHours: false }
  ]
});
assert.equal(row.punchHours, 5);
assert.equal(row.allocationHourEntries[0].key, 'P1::R1');
assert.equal(ui.shouldHighlightAllocationHours(5, row.allocationHourEntries[0]), true);
assert.equal(ui.shouldHighlightAllocationHours(null, { usesHours: true, hours: 0, hoursValid: true }), true);
assert.equal(ui.shouldHighlightAllocationHours(5, { usesHours: true, hoursValid: false }), false);

const summaries = ui.aggregateAllocationHourEntries([
  row,
  { dateKey: '2026-09-16', punchHours: null, punchHoursValid: false, allocationHourEntries: [
    { poolId: 'P1', poolName: '前厅新名称', ruleId: 'R1', ruleName: '服务员新名称', usesHours: true, hours: 4, hoursValid: true },
    { poolId: 'P2', poolName: '酒吧池', ruleId: 'R1', ruleName: '服务员', usesHours: true, hoursValid: false }
  ] }
]);
assert.equal(summaries.length, 3);
assert.equal(summaries.find(x => x.key === 'P1::R1').totalHours, 10);
assert.match(summaries.find(x => x.key === 'P1::R1').display, /前厅新名称 · 服务员新名称 10 h/);
assert.equal(summaries.find(x => x.key === 'P2::R1').display.endsWith('—'), true);
assert.equal(ui.formatHoursCoverage(12, 2, 3), '12 h（2/3 天有记录）');
assert.equal(JSON.stringify(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'clock', originalPunchHours: 8, posEffectiveHours: 10 })), JSON.stringify({ hours: 10, hoursValid: true, source: 'pos-corrected' }));
assert.equal(JSON.stringify(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'clock', originalPunchHours: 8, posEffectiveHours: 10, maxHours: 5 })), JSON.stringify({ hours: 5, hoursValid: true, source: 'max-hours' }));
assert.equal(JSON.stringify(ui.resolveRuleAllocationHours({ usesHours: true, clockMode: 'noclock', manualHours: 4 })), JSON.stringify({ hours: 4, hoursValid: true, source: 'manual' }));
assert.equal(ui.summarizeAllocationHourValues([{ hours: 4, hoursValid: true }, { hours: 6, hoursValid: true }]).display, '多口径（2）');
assert.equal(ui.summarizeAllocationHourValues([{ hours: 8, hoursValid: true }, { hours: 8, hoursValid: true }]).display, '8 h');
assert.equal(ui.summarizeAllocationHourValues([{ hours: 0, hoursValid: true }, { hours: null, hoursValid: false }]).display, '0 h');
assert.equal(ui.formatHoursCoverage(0, 0, 3), '—');

console.log('TipOut employee hours contract verification passed.');
