import assert from 'node:assert/strict';import fs from 'node:fs';
const html=fs.readFileSync('src/team/tips/templates/rule-editor.html','utf8'),js=fs.readFileSync('src/team/tips/programs/contributor-shares-editor.js.txt','utf8');
for(const text of ['以下比例分摊本条贡献规则计算出的应贡献金额。','按当天有效贡献员工人数平均分担；当前名单仅供预览。','确定仅更新本页规则草稿','再按P/C规则计算。此处为说明示例，不是当天金额。'])assert.ok(!(html+js).includes(text),'removed copy remains: '+text);
assert.match(js,/contributorSharesTotal'\).hidden=average/);assert.match(js,/合计：/);assert.match(js,/实际贡献70元/);assert.match(js,/实际贡献80元/);
console.log('PASS share copy: four requested texts removed, examples and custom total retained');
