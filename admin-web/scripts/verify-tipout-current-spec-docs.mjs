import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base='dist/TipOut/docs';
const names=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
const versions=['V4.52','V3.52','V2.50'];
const id='TIPOUT-DOC-COMPLETION-20261027-01';
const texts=names.map(name=>fs.readFileSync(path.join(base,name),'utf8'));
const manifest=JSON.parse(fs.readFileSync(base+'/assets/tips-current-scope-20261027/manifest.json','utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.documentId,id);assert.equal(manifest.baseline,'64ddec8f');
let links=0;
for(const [i,text]of texts.entries()){
 assert.doesNotMatch(text,/【未来规划】|测试场景清单|取消分配|小费池计算模式|计提|按班次|按打卡时段|个人销售额|再分配|conditions\.weekdays|shiftWorkHours|tipClaims|order_tip_then_residual|time_window/,names[i]+' current delivery scope only');
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
const referencedImages = new Set(texts.flatMap(text=>[...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1])));
assert.deepEqual([...referencedImages].sort(),manifest.images.map(x=>x.file).sort(),'effective manifest only includes active referenced images');
assert.ok(manifest.operationCoverage.length>100,'individual operations retained');
for(const image of manifest.images)assert.equal(sha(fs.readFileSync(path.join(base,image.file))),image.sha256,image.file);
for(const [file,hash]of Object.entries(manifest.sourceHashes))assert.equal(sha(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')),hash,file+' current implementation evidence');
const personal=texts[2],engineer=texts[1],product=texts[0];
for(const page of ['日期分配汇总','员工分配汇总','员工每日考勤分配','当日小费分配明细','分配规则列表','新增／编辑分配规则'])assert.ok(personal.includes('. '+page),page);
for(const field of ['门店','今天','昨天','本周','上周','本月','上月','开始日期','结束日期','营业状态','发放状态','入池总金额','已分配总额','未分配总额','分配计入工时','贡献入池总额','小费池计算金额','员工贡献金额','老板补足金额','应扣金额','可扣余额','实际扣除','少扣金额','承担比例','员工权重','权重换算百分比','员工分配比例','角色分配比例','每日计入工时上限','按员工人数平均分担','自定义承担比例','确认已发放','重新确认分配','保存当前分配','重试失败日期'])assert.ok(personal.includes('| '+field+' |'),field+' individually defined');
for(const token of ['snapshotId','snapshotVersion','snapshotHash','allocationSource','onlyIfUnallocated','employeeShares','completedPaymentAt','occurredAt','Web Locks','tipout_allocation_results_v1','tipout_allocated'])assert.ok(engineer.includes(token),'engineering '+token);
for(const token of ['max(P,C)','C+E=D=ΣA+U','B−员工贡献+A','150/300/150','240/240/120','不实际投递','逐日','失败'])assert.ok(product.includes(token),'product '+token);
assert.ok(personal.includes('已完成／部分待分配／待分配'));assert.ok(product.includes('已完成／部分待分配／待分配'));
assert.ok(product.includes('成功后失败0、重试按钮隐藏'));assert.ok(personal.includes('全部任务结束且仍有失败时才显示'));
assert.ok(personal.includes('assets/tips-current-scope-20261027/delete-rule.png'));assert.ok(personal.includes('assets/tips-current-scope-20261027/contribution-help.png'));
const coverage=fs.readFileSync(base+'/小费管理逐操作覆盖清单.md','utf8');assert.ok(coverage.includes(id));assert.ok(coverage.includes('未覆盖的图像'));assert.doesNotMatch(coverage,/【未来规划】|测试场景清单|取消分配|计提|按班次|按打卡时段|个人销售额|再分配/);
const captures=[...JSON.parse(fs.readFileSync(base+'/assets/tips-current-scope-20261027/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-live-20261027/captures.json','utf8'))];
for(const img of manifest.images){
 const capture=captures.find(c=>c.file===img.file);assert.ok(capture,'actual capture '+img.file);
 assert.equal(capture.baseline,'64ddec8f');assert.equal(img.baseline,'64ddec8f');
 assert.ok(img.route.startsWith('http://127.0.0.1:65200/#/team/tips/'),'actual target route '+img.file);
 assert.ok(img.width>250&&img.height>80,'usable region '+img.file);
 assert.notEqual(capture.planning,true,'no planning image '+img.file);
}
for(const token of ['allocationScope','legacy_pool','需有有效打卡','不转嫁','员工承担'])assert.ok(engineer.includes(token),'current contract '+token);
assert.ok(manifest.declaredGaps.length>0,'explicit evidence limitations');
console.log('PASS current-scope TipOut documents: paired versions, scope exclusions, preserved fields and calculations, '+links+' valid links, '+manifest.images.length+' actual image hashes, '+manifest.operationCoverage.length+' operation entries and explicit image gaps');

for(const token of ['不得超出来源开始、结束日期','全部取消均表示全部员工','规则名称 |','有记录／适用天数 |','Payment Method','条件可为空','请先创建小费分配规则','打印窗口','auto-failed.png','auto-retry-success.png','contribution-shortage.png','payout-summary.png','payout-detail.png','hours-summary.png','hours-period.png','hours-day.png'])assert.ok(personal.includes(token),'completed contract '+token);
assert.doesNotMatch(personal,/待补页面图片：任务结束|待补页面图片：.*工时|待补页面图片：.*发放/);
for(const item of manifest.operationCoverage){assert.ok(personal.split(/\r?\n/)[item.line-1].includes('| '+item.operation+' |'),'operation line '+item.id);}
console.log('PASS completed gaps: date limits, filter scope, actual labels, PDF paths, source capability matrix and new actual UI states');

for(const name of ['sales-source','tips-source','manual-source','surcharge-source']){
 const img=manifest.images.find(x=>x.file.endsWith('/'+name+'.png'));
 assert.ok(img,'source drawer '+name);assert.equal(img.framing,'viewport-drawer');
 assert.equal(img.width,1600);assert.equal(img.height,1000);
 const cap=captures.find(x=>x.file===img.file);assert.equal(cap.framing,'viewport-drawer');
}
console.log('PASS source drawers: full viewport, backdrop and editor context retained for all four source types');
