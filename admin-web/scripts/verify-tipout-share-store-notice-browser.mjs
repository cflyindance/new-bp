import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import path from 'node:path';
const run=args=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session tips-shares-20261023 ${args}`],{encoding:'utf8'});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval --stdin'],{encoding:'utf8',input:code,maxBuffer:4*1024*1024}));
run('open http://127.0.0.1:65122/');const saved=ev('JSON.stringify({...localStorage})'),ss=ev('JSON.stringify({...sessionStorage})');
run('open http://127.0.0.1:65125/');ev(`Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(JSON.parse(${JSON.stringify(ss)})).forEach(([k,v])=>sessionStorage.setItem(k,v));true`);run('reload');
if(ev('location.hash').includes('login'))run('find role button click --name 登录 --exact');
if(ev('location.hash').includes('m-platform')){run('find role button click --name Demo视角切换');run('find role button click --name 门店版 --exact');}
ev("location.hash='/team/tips/rules/editor?poolKind=tip';true");
const result=ev(`(async()=>{let r;for(let i=0;i<80;i++){r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#deductAddMenuBtn'))break;await new Promise(x=>setTimeout(x,100));}r.querySelector('#deductAddMenuBtn').click();r.querySelector('#deductAddOptionMenu [data-basis=sales_pct]').click();await new Promise(x=>setTimeout(x,100));const button=r.querySelector('[id^=deduct-share-button-]');const empty=r.querySelector('#storeSelect').value==='';const enabled=!button.disabled;button.click();return {empty,enabled,text:r.textContent.includes('请先选择门店'),opened:r.querySelector('#contributorSharesDrawer').classList.contains('show')};})()`);
assert.equal(result.empty,true);assert.equal(result.enabled,true);assert.equal(result.text,true);assert.equal(result.opened,false);
assert.equal(ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;return r.querySelector('.notification-error span:last-child').textContent;})()`),'请先选择门店');
run('screenshot '+path.resolve('dist/TipOut/docs/assets/tips-share-store-notice-20261023/notice.png').replaceAll('\\','/'));
console.log('PASS live UI: no-store button enabled, click shows store notice, drawer stays closed');
