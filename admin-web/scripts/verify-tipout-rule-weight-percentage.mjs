import assert from 'node:assert/strict';
import fs from 'node:fs';

const templatePath = 'src/team/tips/templates/rule-editor.html';
const programPath = 'src/team/tips/programs/rule-editor.js.txt';
const template = fs.readFileSync(templatePath, 'utf8');
const program = fs.readFileSync(programPath, 'utf8');

const modal = template.slice(template.indexOf('id="weightModal"'), template.indexOf('id="shiftManageModal"'));
assert.doesNotMatch(modal, /权重换算百分比/);
assert.equal((modal.match(/<th /g) || []).length, 3, '权重弹框仅保留角色、员工姓名、员工权重');
assert.doesNotMatch(program, /weight-percentage-value|syncWeightPercentage|formatWeightAsPercentage/);

const saveMatch = program.match(/function saveWeight\(\) \{[\s\S]*?\n    \}/);
assert.ok(saveMatch, '应保留 saveWeight');
assert.match(saveMatch[0], /querySelector\('input\[type="number"\]'\)/, '保存仍应读取原始权重输入');
assert.doesNotMatch(saveMatch[0], /weightPercentage|weight-percentage-value/, '保存不得读取或持久化换算结果');
assert.doesNotMatch(program, /employeeWeights[^\n]*weightPercentage|weightPercentage[^\n]*employeeWeights/, 'employeeWeights 不得混入换算字段');

console.log('PASS employee weight modal has three columns; saves raw weights without display percentage.');
