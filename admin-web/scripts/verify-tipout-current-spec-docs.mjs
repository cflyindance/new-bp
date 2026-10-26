import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base='dist/TipOut/docs';
const names=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
const versions=['V4.38','V3.38','V2.36'];
const id='TIPOUT-SHIFT-DURATION-20261026-01';
const texts=names.map(name=>fs.readFileSync(path.join(base,name),'utf8'));
const manifest=JSON.parse(fs.readFileSync(base+'/assets/tips-current-spec-20261026/manifest.json','utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.documentId,id);assert.equal(manifest.baseline,'9df72cdf');
let links=0;
for(const [i,text]of texts.entries()){
 assert.doesNotMatch(text,/测试场景清单|取消分配|演示重置/,names[i]+' no test-only product operations');
 assert.doesNotMatch(text,/计提|tipClaims|order_tip_then_residual|residual\.receivers/,names[i]+' excludes out-of-scope allocation mode');
 assert.ok(text.startsWith('# '));assert.ok(text.includes('**'+versions[i]+'**'));assert.ok(text.includes(id));
 for(let j=0;j<3;j++)if(i!==j)assert.ok(text.includes(']('+names[j]+')'),names[i]+' paired link '+names[j]);
 const actualVersions=[...new Set(text.match(/\bV\d+\.\d+\b/g))].sort();assert.deepEqual(actualVersions,[...versions].sort(),names[i]+' only current versions');
 assert.doesNotMatch(text,/历史|旧版本|旧逻辑|上次维护|变更前|已确认待实现|待开发|待确认事项|UI-0[12]|\bQ\d{2}\b/,names[i]+' no timeline or proposed behavior');
 const headings=[...text.matchAll(/^## (\d+)\. /gm)].map(m=>Number(m[1]));assert.deepEqual(headings,Array.from({length:headings.length},(_,n)=>n+1),names[i]+' ordered sections');
 for(const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)){
  const url=match[1];if(url.startsWith('http')||url.startsWith('#'))continue;
  assert.ok(fs.existsSync(path.join(base,url.split('#')[0])),names[i]+': '+url);links++;
 }
}
for(const image of manifest.images)assert.equal(sha(fs.readFileSync(path.join(base,image.file))),image.sha256,image.file);
for(const [file,hash]of Object.entries(manifest.sourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')),hash,file+' current implementation evidence');
const personal=texts[2],engineer=texts[1],product=texts[0];
for(const page of ['日期分配汇总','员工分配汇总','员工每日考勤分配','当日小费分配明细','分配规则列表','新增／编辑分配规则'])assert.ok(personal.includes('. '+page),page);
for(const field of ['门店','今天','昨天','本周','上周','本月','上月','开始日期','结束日期','营业状态','发放状态','入池总金额','已分配总额','未分配总额','分配计入工时','贡献入池总额','小费池计算金额','员工贡献金额','老板补足金额','应扣金额','可扣余额','实际扣除','少扣金额','承担比例','员工权重','权重换算百分比','员工分配比例','角色分配比例','每日计入工时上限','按员工人数平均分担','自定义承担比例','确认已发放','重新确认分配','保存当前分配','重试失败日期','再分配'])assert.ok(personal.includes('| '+field+' |'),field+' individually defined');
for(const token of ['snapshotId','snapshotVersion','snapshotHash','allocationSource','onlyIfUnallocated','employeeShares','completedPaymentAt','occurredAt','Web Locks','tipout_allocation_results_v1','tipout_allocated'])assert.ok(engineer.includes(token),'engineering '+token);
for(const token of ['max(P,C)','C+E=D=ΣA+U','B−员工贡献+A','150/300/150','240/240/120','不实际投递','逐日','失败'])assert.ok(product.includes(token),'product '+token);
assert.ok(personal.includes('已完成／部分待分配／待分配'));assert.ok(product.includes('已完成／部分待分配／待分配'));
assert.ok(product.includes('成功后失败0、重试按钮隐藏'));assert.ok(personal.includes('全部任务结束且仍有失败时才显示'));
assert.ok(personal.includes('待补页面图片：班次设置'));assert.ok(personal.includes('待补页面图片：删除规则确认'));
const coverage=fs.readFileSync(base+'/小费管理逐操作覆盖清单.md','utf8');assert.ok(coverage.includes(id));assert.ok(coverage.includes('未覆盖的图像'));assert.doesNotMatch(coverage,/测试场景清单|取消分配|演示重置|计提|tipClaims|order_tip_then_residual|residual\.receivers/);
console.log('PASS current TipOut documents: current-only structure, paired versions, page fields, status/calculation contract, '+links+' valid references, '+manifest.images.length+' image hashes, source evidence and declared image gaps');
