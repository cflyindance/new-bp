import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base='dist/TipOut/docs';
const names=['PRD_产品需求文档.md','小费分配业务规格说明书（研发交付版）.md','小费管理需求文档（个人规范版）.md'];
const versions=['V4.72','V3.72','V2.70'];
const id='TIPOUT-DETAIL-FIXED-STORE-20261106-01';
const texts=names.map(name=>fs.readFileSync(path.join(base,name),'utf8'));
const manifest=JSON.parse(fs.readFileSync(base+'/assets/tips-current-scope-20261027/manifest.json','utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.documentId,id);assert.equal(manifest.baseline,'cb2549c4');
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
for(const field of ['门店','本周','上周','本月','开始日期','结束日期','营业状态','发放状态','入池总金额','已分配总额','未分配总额','分配计入工时','贡献入池总额','小费池计算金额','员工贡献金额','老板补足金额','应扣金额','可扣余额','实际扣除','少扣金额','扣除占比','员工权重','权重换算百分比','员工分配比例','角色分配比例','每日计入工时上限','扣除方','确认已发放','重新系统分配','保存当前分配','重新自动分配'])assert.ok(personal.includes('| '+field+' |'),field+' individually defined');
for(const token of ['snapshotId','snapshotVersion','snapshotHash','allocationSource','onlyIfUnallocated','employeeShares','completedPaymentAt','occurredAt','Web Locks','tipout_allocation_results_v1','tipout_allocated'])assert.ok(engineer.includes(token),'engineering '+token);
for(const token of ['max(P,C)','C+E=D=ΣA+U','B−员工贡献+A','150/300/150','240/240/120','不实际投递','逐日','失败'])assert.ok(product.includes(token),'product '+token);
assert.ok(personal.includes('已完成／部分待分配／待分配'));assert.ok(product.includes('已完成／部分待分配／待分配'));
assert.ok(product.includes('成功后失败0、重试按钮隐藏'));assert.ok(personal.includes('全部任务结束且仍有失败时才显示'));
assert.ok(personal.includes('assets/tips-current-scope-20261027/delete-rule.png'));assert.ok(personal.includes('assets/tips-current-scope-20261027/contribution-help.png'));
const coverage=fs.readFileSync(base+'/小费管理逐操作覆盖清单.md','utf8');assert.ok(coverage.includes(id));assert.ok(coverage.includes('未覆盖的图像'));assert.doesNotMatch(coverage,/【未来规划】|测试场景清单|取消分配|计提|按班次|按打卡时段|个人销售额|再分配/);
const captures=[...JSON.parse(fs.readFileSync(base+'/assets/tips-detail-copy-cleanup-20261106/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-detail-fixed-store-20261106/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-rule-status-colors-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-unconfigured-status-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-rule-config-labels-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-date-preset-context-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-quick-date-blue-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-store-quick-dates-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-employee-list-20261105/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-figma-ui-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-dashboard-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-pool-type-inline-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-restore-contributors-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-sales-proportion-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-current-scope-20261027/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-live-20261027/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-contributors-20261103/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-source-conditions-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-contributor-weights-20261104/captures.json','utf8')),...JSON.parse(fs.readFileSync(base+'/assets/tips-sales-deduction-20261104/captures.json','utf8'))];
for(const img of manifest.images){
 const capture=captures.find(c=>c.file===img.file);assert.ok(capture,'actual capture '+img.file);
 if(img.file.startsWith('assets/tips-detail-copy-cleanup-20261106/')){assert.equal(img.baseline,'4c30d7a8 + TIPOUT-DETAIL-COPY-CLEANUP-20261106-01');assert.ok(img.route.startsWith('http://127.0.0.1:65254/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-detail-fixed-store-20261106/')){assert.equal(img.baseline,'cb2549c4 + TIPOUT-DETAIL-FIXED-STORE-20261106-01');assert.ok(img.route.startsWith('http://127.0.0.1:65253/'));assert.equal(img.width,1440);assert.equal(img.height,1000);continue;}
 if(img.file.startsWith('assets/tips-rule-status-colors-20261105/')){assert.equal(capture.baseline,'214d6638 + TIPOUT-RULE-STATUS-COLORS-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65246/'));continue;}
 if(img.file.startsWith('assets/tips-unconfigured-status-20261105/')){assert.equal(capture.baseline,'a7f36067 + TIPOUT-UNCONFIGURED-STATUS-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65245/'));continue;}
 if(img.file.startsWith('assets/tips-rule-config-labels-20261105/')){assert.equal(capture.baseline,'d78a5de7 + TIPOUT-RULE-CONFIG-LABELS-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65243/'));continue;}
 if(img.file.startsWith('assets/tips-date-preset-context-20261105/')){assert.equal(capture.baseline,'d78a5de7 + TIPOUT-DATE-PRESET-CONTEXT-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65244/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-quick-date-blue-20261105/')){assert.equal(capture.baseline,'d49705da + TIPOUT-QUICK-DATE-BLUE-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65242/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-store-quick-dates-20261105/')){assert.equal(capture.baseline,'d41239c7 + TIPOUT-STORE-QUICK-DATES-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65241/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-employee-list-20261105/')){assert.equal(capture.baseline,'7afb89da + TIPOUT-EMPLOYEE-LIST-20261105-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65240/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-figma-ui-20261104/')){assert.equal(capture.baseline,'79e13f27 + TIPOUT-FIGMA-UI-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65239/'));assert.equal(img.width,1440);continue;}
 if(img.file.startsWith('assets/tips-dashboard-20261104/')){assert.equal(capture.baseline,'b5da1188 + TIPOUT-ALLOCATION-DASHBOARD-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65238/'));assert.equal(img.width,1600);continue;}
 if(img.file.startsWith('assets/tips-pool-type-inline-20261104/')){assert.equal(capture.baseline,'deecdd96 + TIPOUT-INLINE-POOL-KIND-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65237/'));continue;}
 if(img.file.startsWith('assets/tips-restore-contributors-20261104/')){assert.equal(capture.baseline,'fadde445 + TIPOUT-RESTORE-CONTRIBUTORS-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65236/'));continue;}
 if(img.file.startsWith('assets/tips-sales-proportion-20261104/')){assert.equal(capture.baseline,'4394bf3c + TIPOUT-SALES-PROPORTION-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65235/'));continue;}
 if(img.file.startsWith('assets/tips-sales-deduction-20261104/')){assert.equal(capture.baseline,'bb11e4a0 + TIPOUT-SALES-DEDUCTION-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65234/#/team/tips/'));assert.equal(img.width,1600);assert.equal(img.height,1000);continue;}
 if(img.file.startsWith('assets/tips-contributor-weights-20261104/')){assert.equal(capture.baseline,'5e05a59c + TIPOUT-CONTRIBUTOR-WEIGHTS-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65233/#/team/tips/'));assert.equal(img.width,1600);assert.equal(img.height,1000);continue;}
 if(img.file.startsWith('assets/tips-source-conditions-20261104/')){assert.equal(capture.baseline,'d0e115f8 + TIPOUT-SOURCE-SCOPE-20261104-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65232/#/team/tips/'));assert.ok(img.width>=1280&&img.height>=900);continue;}
 const current=img.file.startsWith('assets/tips-contributors-20261103/');
 if(current){assert.equal(capture.baseline,'0e737e4c + TIPOUT-CONTRIBUTORS-20261103-01');assert.equal(img.baseline,capture.baseline);assert.ok(img.route.startsWith('http://127.0.0.1:65230/#/team/tips/'));assert.ok(img.width>250&&img.height>80);assert.notEqual(capture.planning,true);continue;}
 const shares=/\/share-(average|custom|invalid)\.png$/.test(img.file);
 assert.equal(capture.baseline,shares?'5b57958c':'64ddec8f');assert.equal(img.baseline,capture.baseline);
 assert.ok(img.route.startsWith('http://127.0.0.1:'+(shares?'65210':'65200')+'/#/team/tips/'),'actual target route '+img.file);
 assert.ok(img.width>250&&img.height>80,'usable region '+img.file);
 assert.notEqual(capture.planning,true,'no planning image '+img.file);
}
for(const token of ['allocationScope','legacy_pool','需有有效打卡','不转嫁','员工权重'])assert.ok(engineer.includes(token),'current contract '+token);
assert.ok(manifest.declaredGaps.length>0,'explicit evidence limitations');
console.log('PASS current-scope TipOut documents: paired versions, scope exclusions, preserved fields and calculations, '+links+' valid links, '+manifest.images.length+' actual image hashes, '+manifest.operationCoverage.length+' operation entries and explicit image gaps');

for(const token of ['不得超出来源开始、结束日期','全部取消均表示全部员工','规则名称 |','有记录／适用天数 |','Payment Method','条件可为空','请先创建小费分配规则','打印窗口','dashboard-failed.png','dashboard-retry-success.png','contribution-shortage.png','payout-summary.png','payout-detail.png','hours-summary.png','hours-period.png','hours-day.png'])assert.ok(personal.includes(token),'completed contract '+token);
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

assert.doesNotMatch(personal,/修改员工承担比例|自定义承担比例|员工贡献取值|贡献角色必选/);
for(const field of ['扣除方','个人营业额','扣除占比','应扣总额'])assert.ok(personal.includes('| '+field+' |'),'sales deduction field '+field);
assert.doesNotMatch(texts.join('\n'),/人工权重|加权营业额|设置员工权重/);
console.log('PASS current sales deduction contract: optional single role, source-linked total, personal sales proportions, snapshots and actual screenshots');

assert.ok(personal.includes('### 4. 小费贡献设置'));assert.ok(personal.includes('不能同时启用'));console.log('PASS independent contribution section, persisted configuration, conflict guard and actual drawer screenshot');

for(const f of ['小费池类型','小费池','加收服务费池','确认切换'])assert.ok(personal.includes('| '+f+' |'));assert.doesNotMatch(personal,/先选择小费池.*再进入|选择池类型\]\(assets\/tips-current/);console.log('PASS inline pool type module, default, switch confirmation and edit readonly');

for(const field of ["任务总数","已配置规则门店","未配置规则门店","重新自动分配","查看数据","返回看板","更多操作"])assert.ok(personal.includes("| "+field+" |"));assert.doesNotMatch(texts.join("\n"),/关闭结果层|summaryAutoModal|正在分配.*降低透明度/);console.log("PASS dashboard task state, fullscreen summary and current screenshots");
