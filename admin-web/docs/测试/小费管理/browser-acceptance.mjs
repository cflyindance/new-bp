import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const shots=process.argv[2],session='tips-test-presets-final-20261106';fs.mkdirSync(shots,{recursive:true});
const captureDir=fs.mkdtempSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/,m=>m.slice(1))),'scope-cli-'));let call=0;const cli=args=>{const out=path.join(captureDir,(++call)+'.out'),err=out+'.err',a=fs.openSync(out,'w'),e=fs.openSync(err,'w');try{execFileSync('C:/Users/27273/Tools/node/node-v23.9.0-win-x64/node_modules/agent-browser/bin/agent-browser-win32-x64.exe',['--session',session,...args.split(' ')],{stdio:['ignore',a,e],timeout:30000});}catch(error){throw Error(fs.readFileSync(err,'utf8')||error.message);}finally{fs.closeSync(a);fs.closeSync(e);}return fs.readFileSync(out,'utf8');};
const run=code=>JSON.parse(cli('eval -b '+Buffer.from(code).toString('base64')));
const root='Array.from(document.querySelectorAll("*")).find(e=>e.shadowRoot)?.shadowRoot';
const act=body=>run('(()=>{const r='+root+';'+body+'})()');
async function wait(code){for(let i=0;i<1200;i++){const x=run(code);if(x)return x;await new Promise(r=>setTimeout(r,150));}throw Error('UI timeout '+code);}
const click=selector=>act('r.querySelector('+JSON.stringify(selector)+').click();return true;');
const select=(selector,value)=>act('const el=r.querySelector('+JSON.stringify(selector)+');el.value='+JSON.stringify(value)+';el.dispatchEvent(new Event("change",{bubbles:true}));return el.value;');
const options=selector=>act('return Array.from(r.querySelector('+JSON.stringify(selector)+').options).map(e=>e.value);');
const drawer=()=>act('return Array.from(r.querySelectorAll(".drawer.show")).map(e=>e.id);');
const summary=id=>act('return r.querySelector('+JSON.stringify('#deduct-card-'+id+'-conditions')+').textContent;');
const poolSummary=()=>act('return Array.from(r.querySelectorAll("#poolRulesContainer .pool-rule-conditions")).map(e=>e.textContent);');
console.log('Starting isolated browser acceptance');cli('open http://127.0.0.1:65257/');
run(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim()==='登录');if(b)b.click();return true;})()`);
await wait(`location.hash!=='#/login'`);
for(let step=0;step<8;step++){
 if(!run(`location.hash.includes('onboarding')`))break;
 const state=run(`Array.from(document.querySelectorAll('button')).map(e=>({text:e.textContent.trim(),disabled:e.disabled}))`);console.log('Onboarding buttons',JSON.stringify(state));
 const label=state.find(e=>!e.disabled&&/下一步|开始|完成|进入|跳过/.test(e.text));
 if(!label)throw Error('Onboarding needs observed UI action');
 run(`(()=>{Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim()===${JSON.stringify(label.text)}).click();return true;})()`);
 await new Promise(r=>setTimeout(r,350));
}









cli('set viewport 1440 1000');run('location.hash="/team/tips/distribution"');await wait('('+root+')?.querySelector("#allocationDashboard")?.getAttribute("aria-busy")==="false"');click('#tipoutPresetButton');await wait('('+root+')?.querySelector("#tipoutPresetDialog")');cli('screenshot '+path.join(shots,'catalog.png'));act('const buttons=Array.from(r.querySelectorAll("#tipoutPresetDialog button"));if(localStorage.getItem("tipout-test-presets-v1")){buttons.find(e=>e.textContent==="全选当前组").click();buttons.find(e=>e.textContent==="恢复所选预设").click();buttons.find(e=>e.textContent==="确认恢复所选预设").click();}else buttons.find(e=>e.textContent==="加载全部").click();return true;');await wait('!('+root+')?.querySelector("#tipoutPresetDialog button").disabled');const loadText=act('return r.querySelector("#tipoutPresetDialog [role=status]").textContent;');assert.ok(!loadText.includes('加载未完成'),loadText);const manifest=run('JSON.parse(localStorage.getItem("tipout-test-presets-v1"))');assert.equal(Object.keys(manifest.cases).length,32);const result=run('JSON.parse(localStorage.getItem("tipout_allocation_results_v1"))');const cases={C01:[50,50],C02:[25,75],C03:[25,75],C04:[50,50],C05:[25,75],C06:[30,30,40],C07:[100,0],C08:[50,50],C15:[30],C16:[.01,0,0]};for(const [id,expected]of Object.entries(cases)){const snapshot=Object.values(result).find(s=>s.store.includes(' '+id+' '));assert.ok(snapshot,id+' snapshot');const values=snapshot.pools[0].employees.map(e=>e.amount);assert.deepEqual(values.slice().sort((a,b)=>a-b),expected.slice().sort((a,b)=>a-b),id+' receiver values');}cli('screenshot '+path.join(shots,'loaded.png'));act('Array.from(r.querySelectorAll("#tipoutPresetDialog tbody tr")).find(e=>e.cells[1].textContent==="C13").querySelector("button").click();return true;');await wait('('+root+')?.querySelector(".tipout-daily-row")');click('.tipout-daily-row');await wait('('+root+')?.querySelector(".tipout-contribution-section")||('+root+')?.querySelector("#detailDate")');cli('screenshot '+path.join(shots,'c13-detail.png'));cli('open http://127.0.0.1:65257/#/team/tips/distribution?testPresets=1&testGroup=E&testCase=E02&startDate='+manifest.cases.E02.dates[0]+'&endDate='+manifest.cases.E02.dates.at(-1));await wait('('+root+')?.querySelector("#allocationDashboard")?.getAttribute("aria-busy")==="false"');assert.ok(act('return !r.querySelector("#dashboardRetry").hidden;'),'failed retry visible');cli('screenshot '+path.join(shots,'partial-failure.png'));click('#tipoutPresetButton');act('const e=r.querySelector("#tipoutPresetDialog input[aria-label^=E02]");e.click();Array.from(r.querySelectorAll("#tipoutPresetDialog button")).find(e=>e.textContent==="修复所选故障").click();return true;');await new Promise(r=>setTimeout(r,500));act('Array.from(r.querySelectorAll("#tipoutPresetDialog button")).find(e=>e.textContent==="关闭").click();return true;');click('#dashboardRetry');await wait('('+root+')?.querySelector("#allocationDashboard")?.getAttribute("aria-busy")==="false"');assert.ok(act('return r.querySelector("#dashboardRetry").hidden;'));cli('screenshot '+path.join(shots,'retry-success.png'));console.log('PASS actual 32 presets loaded, 10 receiver amount cases, detail, failed tasks and repaired retry');
