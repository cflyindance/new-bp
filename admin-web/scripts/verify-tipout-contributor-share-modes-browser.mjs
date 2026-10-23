import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import path from 'node:path';
const session='tips-shares-20261023';
const run=args=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{encoding:'utf8'});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} eval --stdin`],{encoding:'utf8',input:code,maxBuffer:4*1024*1024}));
run('open http://127.0.0.1:65122/');
const saved=ev('JSON.stringify({...localStorage})'),ss=ev('JSON.stringify({...sessionStorage})');
run('open http://127.0.0.1:65124/');
ev(`Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(JSON.parse(${JSON.stringify(ss)})).forEach(([k,v])=>sessionStorage.setItem(k,v));true`);
run('reload');
if(ev('location.hash').includes('login'))run('find role button click --name 登录 --exact');
if(ev('location.hash').includes('m-platform')){run('find role button click --name Demo视角切换');run('find role button click --name 门店版 --exact');}
ev("location.hash='/team/tips/rules/editor?poolKind=tip&mode=edit&id=19';true");
const prep=`let r;for(let i=0;i<80;i++){r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('[id^="deduct-share-button-"]'))break;await new Promise(x=>setTimeout(x,100));}`;
let result=ev(`(async()=>{${prep}r.querySelector('[id^="deduct-share-button-"]').click();const d=r.querySelector('#contributorSharesDrawer');return {mode:d.querySelector('input[name=contributorShareMode]:checked').value,rows:d.querySelectorAll('tbody tr').length};})()`);
assert.equal(result.mode,'custom');assert.equal(result.rows,2);
// Browser UI event path, not direct runtime calls.
ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;const d=r.querySelector('#contributorSharesDrawer');d.querySelector('input[value=average]').click();d.querySelector('input[value=average]').dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
const asset=path.resolve('dist/TipOut/docs/assets/tips-contributor-share-modes-20261023').replaceAll('\\','/');
run('screenshot '+asset+'/average.png');
result=ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;const d=r.querySelector('#contributorSharesDrawer');const readOnly=[...d.querySelectorAll('input[type=number]')].every(e=>e.disabled);[...d.querySelectorAll('button')].find(e=>e.textContent==='确定').click();return {readOnly,summary:r.querySelector('[id^="deduct-share-summary-"]').textContent};})()`);
assert.equal(result.readOnly,true);assert.match(result.summary,/平均/);
// Save full rule, verify persisted average has no frozen employee list.
ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;[...r.querySelectorAll('button')].find(e=>e.textContent==='保存规则').click();return true;})()`);
result=ev(`(async()=>{for(let i=0;i<40;i++){let s=JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.id===19).deductConfig.salesPct.employeeShares;if(s.mode==='average')return s;await new Promise(x=>setTimeout(x,100));}throw Error('average not persisted');})()`);
assert.equal(result.mode,'average');assert.equal(result.employees,undefined);
ev(`(async()=>{for(let i=0;i<50;i++){if(!location.hash.includes('/editor'))return true;await new Promise(x=>setTimeout(x,100));}throw Error('save did not finish navigating');})()`);
ev("location.hash='/team/tips/rules/editor?poolKind=tip&mode=edit&id=19';true");
result=ev(`(async()=>{${prep}r.querySelector('[id^="deduct-share-button-"]').click();const d=r.querySelector('#contributorSharesDrawer');const restored=d.querySelector('input[name=contributorShareMode]:checked').value;d.querySelector('input[value=custom]').click();d.querySelector('input[value=custom]').dispatchEvent(new Event('change',{bubbles:true}));const inputs=[...d.querySelectorAll('input[type=number]')];inputs.forEach((e,i)=>{e.value=i?'60':'40';e.dispatchEvent(new Event('input',{bubbles:true}));});return {restored,total:d.querySelector('#contributorSharesTotal').textContent};})()`);
assert.equal(result.restored,'average');assert.match(result.total,/100.00%/);
run('screenshot '+asset+'/custom.png');
ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;const d=r.querySelector('#contributorSharesDrawer');[...d.querySelectorAll('button')].find(e=>e.textContent==='取消').click();return true;})()`);
result=ev(`JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.id===19).deductConfig.salesPct.employeeShares.mode`);assert.equal(result,'average');
// Confirm and persist custom through the same page controls.
ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;r.querySelector('[id^="deduct-share-button-"]').click();const d=r.querySelector('#contributorSharesDrawer');d.querySelector('input[value=custom]').click();d.querySelector('input[value=custom]').dispatchEvent(new Event('change',{bubbles:true}));[...d.querySelectorAll('input[type=number]')].forEach((e,i)=>{e.value=i?'60':'40';e.dispatchEvent(new Event('input',{bubbles:true}));});[...d.querySelectorAll('button')].find(e=>e.textContent==='确定').click();[...r.querySelectorAll('button')].find(e=>e.textContent==='保存规则').click();return true;})()`);
result=ev(`(async()=>{for(let i=0;i<40;i++){let s=JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.id===19).deductConfig.salesPct.employeeShares;if(s.mode==='custom')return s;await new Promise(x=>setTimeout(x,100));}throw Error('custom not persisted');})()`);
assert.equal(result.mode,'custom');assert.deepEqual(result.employees.map(e=>e.pct),[40,60]);
console.log('PASS browser modes: old custom restored, average readonly/save/reload, custom40/60 saved, cancel preserves average');
