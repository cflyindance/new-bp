import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const session='tips-shares-20261023';
const run=args=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{encoding:'utf8',maxBuffer:8*1024*1024});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} eval --stdin`],{encoding:'utf8',input:code,maxBuffer:8*1024*1024}));
const dir=path.resolve('dist/TipOut/docs/assets/tips-docs-current-20261023').replaceAll('\\','/');
fs.mkdirSync(dir,{recursive:true});
const records=[];
function shot(name,state){run(`screenshot ${dir}/${name}.png`);records.push({file:name+'.png',state,url:ev('location.href'),capturedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(fs.readFileSync(`${dir}/${name}.png`)).digest('hex')});}
function ui(code){return ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(!r)throw Error('TipOut root absent');${code}})()`);}
function route(hash,selector){ev(`location.hash=${JSON.stringify(hash)};true`);ev(`(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector(${JSON.stringify(selector)}))return true;await new Promise(x=>setTimeout(x,100));}throw Error('route not ready');})()`);}
run('open http://127.0.0.1:65122/');
const saved=ev('JSON.stringify({...localStorage})'),ss=ev('JSON.stringify({...sessionStorage})');
run('open http://127.0.0.1:65132/');
ev(`Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(JSON.parse(${JSON.stringify(ss)})).forEach(([k,v])=>sessionStorage.setItem(k,v));true`);run('reload');
if(ev('location.hash').includes('login'))run('find role button click --name 登录 --exact');
route('/team/tips/rules/editor?poolKind=tip','#contributorRulesGroup');
ui("r.querySelector('#ruleSectionBasic').scrollIntoView({block:'start'});return true;");shot('editor-top','新增规则默认／基础与分配分组，未保存');
ui("r.querySelector('input[name=distribution][value=hours]').click();r.querySelector('#distributionSection').scrollIntoView({block:'start'});r.querySelector('#workHoursSourceHelpToggle').open=true;return true;");shot('hours-clock','工时法＋仅打卡，标题帮助展开');
ui("r.querySelector('input[name=clockin][value=unrestricted]').click();return true;");shot('hours-unrestricted','工时法＋不限打卡／帮助展开');
ui("r.querySelector('input[name=clockin][value=time_window]').click();return true;");shot('hours-time-window','工时法＋在岗时段，只读时段工时');
ui("r.querySelector('input[name=distribution][value=average]').click();r.querySelector('#deductAddMenuBtn').click();r.querySelector('#deductAddOptionMenu [data-basis=sales_pct]').click();r.querySelector('#contributorRulesGroup').scrollIntoView({block:'end'});return true;");shot('contribution-no-role','无角色时不展示员工承担整行');
ui("r.querySelector('#allocationModeSection').open=true;r.querySelector('input[name=allocationMode][value=order_tip_then_residual]').click();r.querySelector('#allocationModeSection').scrollIntoView({block:'start'});return true;");shot('commission','计提模式：贡献分组隐藏');
// Subsequent commands may use this script's helpers without copying browser storage.
if(process.env.TIPOUT_CAPTURE_INITIAL_ONLY!=='1'){
 route('/team/tips/rules','#rulesTableBody');shot('rules','规则列表／隔离演示');
 ui("r.querySelector('[data-native-onclick=\"openAddRuleModal()\"]').click();return true;");shot('pool-type','新增规则／选择池类型');
 ui("r.querySelector('#poolTypeModal .modal-close').click();return true;");
 route('/team/tips/rules/editor?poolKind=tip&mode=edit&id=19','#contributorRulesGroup');
 ui("r.querySelector('#contributorRulesGroup').scrollIntoView({block:'end'});return true;");shot('contribution-configured','既有规则／有角色，展示承担摘要与修改入口');
 ui("r.querySelector('[id^=deduct-share-button-]').click();return true;");shot('share-custom','自定义员工承担／回填40/60');
 ui("const d=r.querySelector('#contributorSharesDrawer');d.querySelector('input[value=average]').click();d.querySelector('input[value=average]').dispatchEvent(new Event('change',{bubbles:true}));return true;");shot('share-average','平均分担／只读比例，不显示长说明');
 ui("const d=r.querySelector('#contributorSharesDrawer');d.querySelector('input[value=custom]').click();d.querySelector('input[value=custom]').dispatchEvent(new Event('change',{bubbles:true}));const inputs=[...d.querySelectorAll('input[type=number]')];inputs.forEach((e,i)=>{e.value=i?'50':'40';e.dispatchEvent(new Event('input',{bubbles:true}));});[...d.querySelectorAll('button')].find(e=>e.textContent==='确定').click();return true;");shot('share-invalid','自定义40+50合计90，确定后校验拒绝');
 ui("[...r.querySelectorAll('#contributorSharesDrawer button')].find(e=>e.textContent==='取消').click();return true;");shot('share-cancel','取消后抽屉关闭，原草稿40/60保留');
 const store=ev("JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.id===19).store");
 route('/team/tips/distribution','#dailySummaryList');shot('daily','日期汇总／隔离快照');
 route('/team/tips/distribution?view=employee','#employeeReconciliationList');shot('employees','员工汇总／隔离快照');
 route('/team/tips/details?date=2026-10-23&store='+encodeURIComponent(store)+'&from=summary&return=history','#detailRulesContainer');shot('detail','分配明细／已有确认快照');
 ui("r.querySelector('#detailActionBar').scrollIntoView({block:'end'});return true;");shot('detail-actions','已发放明细：操作不可用，非可编辑按钮图');
}
fs.writeFileSync(`${dir}/capture-manifest.json`,JSON.stringify({baseline:'e8d203b0ef36696f7882d9fd016affbf7cbd2648',origin:'http://127.0.0.1:65132',fixture:'复制既有专用员工承担验收夹具至独立本地端口，不含真实交易；未改用户会话',records},null,2));
