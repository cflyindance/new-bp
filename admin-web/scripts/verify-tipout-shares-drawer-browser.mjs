import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const run=(args)=>execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session tips-shares-20261023 ${args}`],{encoding:'utf8'});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval --stdin'],{encoding:'utf8',input:code,maxBuffer:4*1024*1024}));
run('open http://127.0.0.1:65122/');
const saved=ev('JSON.stringify({...localStorage})');
const session=ev('JSON.stringify({...sessionStorage})');
run('open http://127.0.0.1:65123/');
ev(`Object.entries(JSON.parse(${JSON.stringify(saved)})).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(JSON.parse(${JSON.stringify(session)})).forEach(([k,v])=>sessionStorage.setItem(k,v));location.hash='/team/tips/rules/editor?poolKind=tip&mode=edit&id=19';true`);
run('reload');
if(ev('location.hash').includes('m-platform')){
  run('find role button click --name Demo视角切换');
  run('find role button click --name 门店版 --exact');
  ev("location.hash='/team/tips/rules/editor?poolKind=tip&mode=edit&id=19';true");
}
const result=ev(`(async()=>{let r;for(let i=0;i<80;i++){r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('[id^="deduct-share-button-"]'))break;await new Promise(x=>setTimeout(x,100));}const d=r.querySelector('#contributorSharesDrawer');const closed=getComputedStyle(d).visibility==='hidden'&&d.getBoundingClientRect().left>=innerWidth;const b=r.querySelector('[id^="deduct-share-button-"]');b.click();await new Promise(x=>setTimeout(x,400));const opened=getComputedStyle(d).visibility==='visible'&&!d.inert;const inputs=[...d.querySelectorAll('input[type=number]')];inputs[0].value='40';inputs[1].value='60';inputs[0].dispatchEvent(new Event('input',{bubbles:true}));[...d.querySelectorAll('button')].find(e=>e.textContent==='确定').click();await new Promise(x=>setTimeout(x,400));return {closed,opened,count:inputs.length,closedAgain:d.inert&&getComputedStyle(d).visibility==='hidden',summary:r.querySelector('[id^="deduct-share-summary-"]').textContent};})()`);
assert.equal(result.closed,true);assert.equal(result.opened,true);assert.equal(result.count,2);assert.equal(result.closedAgain,true);assert.match(result.summary,/40%.*60%/);
console.log('PASS live browser drawer: initially hidden, click opens editable two employees, 40/60 confirm closes and updates draft');
