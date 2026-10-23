import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import path from 'node:path';
const run=args=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session demo-brand-entry-20261023 ${args}`],{encoding:'utf8'});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session demo-brand-entry-20261023 eval --stdin'],{encoding:'utf8',input:code,maxBuffer:2*1024*1024}));
run('open http://127.0.0.1:65131/');
// Reuse the completed-onboarding business fixture, not a production account or real login history.
const fixture=JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval --stdin'],{encoding:'utf8',input:'JSON.stringify({...localStorage})',maxBuffer:4*1024*1024}));
ev(`Object.entries(JSON.parse(${JSON.stringify(fixture)})).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();true`);
run('open http://127.0.0.1:65131/#/login');
run('find role button click --name 登录 --exact');
const state=()=>ev(`(async()=>{for(let i=0;i<80;i++){if(location.hash==='#/home'&&document.querySelector('#nav-tree'))return {hash:location.hash,perspective:sessionStorage.getItem('menusifu:chain-data-perspective-v1'),layout:localStorage.getItem('sidebar-nav-layout-preset-v1'),shell:sessionStorage.getItem('menusifu:app-shell-mode-v1'),m:!!document.querySelector('[data-m-platform-content]')};await new Promise(x=>setTimeout(x,100));}throw Error('brand home not mounted');})()`);
let result=state();assert.equal(result.perspective,'brand');assert.equal(result.layout,'chain');assert.equal(result.m,false);assert.equal(result.shell,null);
const asset=path.resolve('docs/项目文档/images/demo-brand-default-20261023').replaceAll('\\','/');run('screenshot '+asset+'/brand-home.png');
run('open http://127.0.0.1:65131/#/m-platform/nav-blueprint');
const m=ev(`(async()=>{for(let i=0;i<80;i++){if(document.querySelector('[data-m-platform-content]'))return {hash:location.hash,shell:sessionStorage.getItem('menusifu:app-shell-mode-v1')};await new Promise(x=>setTimeout(x,100));}throw Error('explicit M route not mounted');})()`);assert.equal(m.shell,'m-platform');assert.match(m.hash,/m-platform/);
run('open http://127.0.0.1:65131/');result=state();assert.equal(result.perspective,'brand');assert.equal(result.shell,null);run('screenshot '+asset+'/reopen-root.png');
run('open http://127.0.0.1:65131/#/team/tips/rules');
assert.equal(ev(`(async()=>{for(let i=0;i<80;i++){if([...document.querySelectorAll('*')].some(e=>e.shadowRoot?.querySelector('#rulesTableBody')))return location.hash;await new Promise(x=>setTimeout(x,100));}return location.hash;})()`),'#/team/tips/rules');
console.log('PASS live demo default: login brand home, explicit M still opens, reopening root resets to brand, direct business hash preserved');
