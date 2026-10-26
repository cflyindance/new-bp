import {execFileSync} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const session='tips-quick-dates-20261026';
const run=args=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{encoding:'utf8',maxBuffer:8*1024*1024});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} eval --stdin`],{encoding:'utf8',input:code,maxBuffer:8*1024*1024}));
const ui=code=>ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(!r)throw Error('TipOut root missing');${code}})()`);
const dir=path.resolve('dist/TipOut/docs/assets/tips-quick-dates-20261026').replaceAll('\\','/');fs.mkdirSync(dir,{recursive:true});const records=[];
const ledger=()=>ev("JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>/tipout.*(allocat|payout|date-state|manual-hours)/.test(k))))");
function shot(name,state){run('screenshot '+dir+'/'+name+'.png');records.push({file:name+'.png',state,url:ev('location.href'),range:ui("return [r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value];"),capturedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+name+'.png')).digest('hex')});}
run('set viewport 1500 950');run('open http://127.0.0.1:65134/#/team/tips/distribution');
// Reset only this dedicated test entry's query history so the default-state check is repeatable.
ev("history.replaceState({},'',location.href);true");run('reload');
ev("(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#dailySummaryList tr'))return true;await new Promise(x=>setTimeout(x,100));}throw Error('Log into isolated demo before running this test');})()");
assert.equal(ui("return r.querySelectorAll('#summaryDatePresets button[aria-pressed=true]').length;"),0);shot('default','默认最近一个月，无快捷项高亮');
ui("window.__quickDateTestClicks=[];r.addEventListener('click',e=>window.__quickDateTestClicks.push({id:e.target.id,preset:e.target.dataset?.datePreset}),true);return true;");
const before=ledger();
const ranges=ev("(()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth(),n=d.getDate(),w=(d.getDay()+6)%7;const key=t=>[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');return Object.fromEntries([['today',new Date(y,m,n),d],['yesterday',new Date(y,m,n-1),new Date(y,m,n-1)],['this-week',new Date(y,m,n-w),d],['last-week',new Date(y,m,n-w-7),new Date(y,m,n-w-1)],['this-month',new Date(y,m,1),d],['last-month',new Date(y,m-1,1),new Date(y,m,0)]].map(([k,s,e])=>[k,[key(s),key(e)]]));})()");
ui("const f=r.querySelector('#dateBusinessStatusFilter');f.value='open';f.dispatchEvent(new Event('change',{bubbles:true}));return true;");
for(const key of ['today','yesterday','this-week','last-week','this-month','last-month']){
 const range=ranges[key];
 const result=ui(`r.querySelector('[data-date-preset="${key}"]').click();return {range:[r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value],pressed:[...r.querySelectorAll('#summaryDatePresets button[aria-pressed=true]')].map(b=>b.dataset.datePreset),filter:r.querySelector('#dateBusinessStatusFilter').value,dates:[...r.querySelectorAll('#dailySummaryList tr[data-date]')].map(e=>e.dataset.date)};`);
 assert.deepEqual(result.range,range);assert.deepEqual(result.pressed,[key]);assert.equal(result.filter,'open');assert.ok(result.dates.every(d=>d>=range[0]&&d<=range[1]));shot(key,'日期汇总点击'+key+'；保留正常营业筛选');
}
const beforeSwitch=ui("return {range:[r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value],clicks:window.__quickDateTestClicks};");assert.deepEqual(beforeSwitch.range,ranges['last-month'],JSON.stringify(beforeSwitch));
const switchResult=ui("r.querySelector('#employeeReconciliationTab').click();return {range:[r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value],clicks:window.__quickDateTestClicks};");assert.deepEqual(switchResult.range,ranges['last-month'],JSON.stringify(switchResult));
ev(`(async()=>{for(let i=0;i<50;i++){const r=[...document.querySelectorAll('*')].find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#employeeReconciliationTab')?.getAttribute('aria-selected')==='true'&&r.querySelector('#dateStart').value==='${ranges['last-month'][0]}')return true;await new Promise(x=>setTimeout(x,100));}throw Error('employee view failed to preserve date range');})()`);
assert.deepEqual(ui("return [r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value];"),ranges['last-month']);
ui("r.querySelector('[data-date-preset=this-week]').click();return true;");shot('employee','员工视角点击本周，共用日期范围');
ui("const input=r.querySelector('#dateStart');input.value='';input.dispatchEvent(new Event('change',{bubbles:true}));return true;");
assert.equal(ui("return r.querySelectorAll('#summaryDatePresets button[aria-pressed=true]').length;"),0);assert.equal(ui("return r.querySelector('#summaryDateRangeError').hidden;"),false);shot('manual-invalid','清空日期清高亮，原查询结果保留');
ui("r.querySelector('[data-date-preset=last-week]').click();return true;");assert.equal(ui("return r.querySelector('#summaryDateRangeError').hidden;"),true);shot('recovered','点击上周修复日期错误');
ui("const input=r.querySelector('#dateEnd');input.dispatchEvent(new Event('change',{bubbles:true}));return true;");assert.equal(ui("return r.querySelectorAll('#summaryDatePresets button[aria-pressed=true]').length;"),0);shot('manual','手动修改日期后无快捷项高亮');
ui("r.querySelector('[data-date-preset=today]').focus();return true;");assert.equal(ui("return r.activeElement?.dataset.datePreset;"),'today');run('press Enter');assert.deepEqual(ui("return [r.querySelector('#dateStart').value,r.querySelector('#dateEnd').value];"),ranges.today);
assert.equal(ledger(),before,'query shortcuts must not mutate allocation/payout ledgers');
run('set viewport 390 844');shot('host-390','390px宿主固定侧栏占宽：已知全局布局限制，非移动端通过证据');
run('set viewport 900 950');shot('narrow','900px窗口：快捷区与日期在可用内容宽度内换行');
const bounds=ui("const p=r.querySelector('#summaryDatePresets').getBoundingClientRect(),d=r.querySelector('#dateRangeFilterField').getBoundingClientRect();return {p:{left:p.left,right:p.right,top:p.top,bottom:p.bottom},d:{left:d.left,right:d.right,top:d.top,bottom:d.bottom},width:innerWidth};");assert.ok(bounds.p.right<=bounds.width+1&&bounds.p.left>=0);assert.ok(bounds.d.top>=bounds.p.bottom-1);assert.ok(bounds.d.right<=bounds.width+1);
run('set viewport 1500 950');ui("r.querySelector('#dateTaskTab').click();r.querySelector('[data-date-preset=today]').click();return true;");
fs.writeFileSync(dir+'/capture-manifest.json',JSON.stringify({baseline:'470da97f81cb69114b234b3758737870abd0d755',branch:'codex/tips-quick-date-filters-20261026',status:'uncommitted feature preview',origin:'http://127.0.0.1:65134',fixture:'独立演示会话，仅查询；未进行分配、保存或发放',sourceHashes:Object.fromEntries(['src/team/tips/programs/distribution.js.txt','src/team/tips/templates/distribution.html','src/team/tips/legacy/tipout-summary-date-sort.js.txt','src/team/tips/tips-page.css'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),records},null,2));
console.log('PASS real browser: six shortcuts, retained filters, employee view, manual clear, invalid recovery, keyboard, narrow wrap and unchanged business ledgers; screenshots '+records.length);
