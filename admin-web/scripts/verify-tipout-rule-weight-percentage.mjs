import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const templatePath = 'src/team/tips/templates/rule-editor.html';
const programPath = 'src/team/tips/programs/rule-editor.js.txt';
const template = fs.readFileSync(templatePath, 'utf8');
const program = fs.readFileSync(programPath, 'utf8');

assert.match(template, />权重换算百分比</, '权重弹窗应包含换算百分比表头');
assert.match(program, /class="weight-percentage-value"/, '每一行应包含只读换算结果');
assert.match(program, /data-native-oninput="syncWeightPercentage\(this\)"/, '权重输入应实时联动换算结果');

const formatterMatch = program.match(/function formatWeightAsPercentage\(value\) \{[\s\S]*?\n    \}/);
assert.ok(formatterMatch, '应定义 formatWeightAsPercentage');
const context = {};
vm.runInNewContext(`${formatterMatch[0]}; this.formatWeightAsPercentage = formatWeightAsPercentage;`, context);

const cases = [
  [1, '100%'],
  [0.5, '50%'],
  [1.1, '110%'],
  [0, '0%'],
  [0.3333, '33.33%'],
  [0.125, '12.5%'],
  ['', '—'],
  ['not-a-number', '—'],
  [-0.1, '—'],
  [Infinity, '—'],
];
for (const [input, expected] of cases) {
  assert.equal(context.formatWeightAsPercentage(input), expected, `${String(input)} 应换算为 ${expected}`);
}

const saveMatch = program.match(/function saveWeight\(\) \{[\s\S]*?\n    \}/);
assert.ok(saveMatch, '应保留 saveWeight');
assert.match(saveMatch[0], /querySelector\('input\[type="number"\]'\)/, '保存仍应读取原始权重输入');
assert.doesNotMatch(saveMatch[0], /weightPercentage|weight-percentage-value/, '保存不得读取或持久化换算结果');
assert.doesNotMatch(program, /employeeWeights[^\n]*weightPercentage|weightPercentage[^\n]*employeeWeights/, 'employeeWeights 不得混入换算字段');

console.log('TipOut employee weight percentage verification passed.');
