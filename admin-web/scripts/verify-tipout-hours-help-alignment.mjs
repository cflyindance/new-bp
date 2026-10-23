import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('src/team/tips/templates/rule-editor.html','utf8');
assert.match(html,/<div class="form-section-title work-hours-config-heading"><span>分配工时设置<\/span>\s*<details[^>]*id="workHoursSourceHelpToggle"/);
assert.equal(html.split('id="workHoursSourceHelp"').length-1,1);assert.match(html,/id="workHoursEditableOptions">\s*<label/);
console.log('PASS hours help is adjacent to heading, unique content, not a separate options row');
