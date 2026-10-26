// Run against the dedicated, signed-in agent-browser session; never clears user storage.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const session='tips-auto-allocation-20261026';
const directory=path.resolve('dist/TipOut/docs/assets/tips-auto-allocation-20261026');fs.mkdirSync(directory,{recursive:true});
function cli(args,input){return execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{input,encoding:'utf8',timeout:60000});}
function evaluate(code){const output=cli('eval --stdin',code).trim();return JSON.parse(output);}
function root(code){return evaluate(`(()=>{const r=[...document.querySelectorAll('*')].map(e=>e.shadowRoot).find(r=>r&&r.querySelector('#summaryAutoModal'));if(!r)throw Error('TipOut root missing');${code}})()`);}
async function until(code){for(let i=0;i<100;i++){if(root(code))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+code);}
function screenshot(name){cli('screenshot '+path.join(directory,name+'.png').replaceAll('\\','/'));}
(async()=>{
 cli('set viewport 1500 950');
 // Reset ONLY this script's ten dedicated demo dates so the failure/retry scenario is reproducible.
 evaluate(`(()=>{const dates=Array.from({length:10},(_,i)=>'2026-09-'+String(i+1).padStart(2,'0')),store='Golden Dragon Chinese Kitchen - Dallas, TX 75231';for(const key of ['tipout_allocation_results_v1','tipout-payout-records-v1']){const data=JSON.parse(localStorage.getItem(key)||'{}');dates.forEach(date=>delete data[store+'\\u0000'+date]);localStorage.setItem(key,JSON.stringify(data));}const flags=JSON.parse(localStorage.getItem('tipout_allocated')||'{}');flags[store]=(flags[store]||[]).filter(date=>!dates.includes(date));localStorage.setItem('tipout_allocated',JSON.stringify(flags));return true;})()`);
 root(`if(r.querySelector('#summaryAutoModal').classList.contains('show'))r.querySelector('#summaryAutoClose').click();r.querySelector('[data-date-preset="this-week"]').click();return true;`);
 await until(`return r.querySelector('#summaryAutoModal').classList.contains('show')&&!r.querySelector('#summaryAutoClose').disabled;`);
 assert.match(root(`return r.querySelector('#dateStart').value;`),/^2026-10-26$/);
 screenshot('default-result');
 root(`r.querySelector('#summaryAutoClose').click();return true;`);
 // Inject one lock failure only in this isolated demo tab. All calculations and writes remain real.
 evaluate(`window.autoTestOriginalLock=navigator.locks.request.bind(navigator.locks);window.autoTestFailed=false;navigator.locks.request=async function(name,options,callback){await new Promise(r=>setTimeout(r,180));if(name.includes('2026-09-04')&&!window.autoTestFailed){window.autoTestFailed=true;throw Error('演示：临时写入失败，请重试');}return window.autoTestOriginalLock(name,options,callback);};true`);
 root(`const a=r.querySelector('#dateStart'),b=r.querySelector('#dateEnd');a.value='2026-09-01';b.value='2026-09-10';a.dispatchEvent(new Event('change',{bubbles:true}));b.dispatchEvent(new Event('change',{bubbles:true}));return true;`);
 await until(`return r.querySelector('#summaryAutoModal').classList.contains('show')&&r.querySelector('#summaryAutoClose').disabled;`);
 screenshot('running');
 await until(`return r.querySelector('#summaryAutoClose').disabled===false;`);
 const rows=root(`return [...r.querySelectorAll('#summaryAutoRows tr')].map(e=>e.textContent);`);
 assert.equal(rows.length,10);assert.ok(rows.some(t=>t.includes('2026-09-04')&&t.includes('分配失败')));assert.ok(rows.some(t=>t.includes('分配成功')));assert.ok(rows.some(t=>t.includes('已跳过')));
 screenshot('mixed-result');
 const before=evaluate(`localStorage.getItem('tipout_allocation_results_v1')`);
 root(`r.querySelector('#summaryAutoRetry').click();return true;`);
 await until(`return r.querySelector('#summaryAutoClose').disabled===false;`);
 assert.ok(root(`return [...r.querySelectorAll('#summaryAutoRows tr')].find(e=>e.textContent.includes('2026-09-04')).textContent;`).includes('分配成功'));
 const after=evaluate(`localStorage.getItem('tipout_allocation_results_v1')`);
 const old=JSON.parse(before),next=JSON.parse(after);
 for(const [key,value]of Object.entries(old))assert.deepEqual(next[key],value,'retry must preserve every previously saved snapshot');
 screenshot('retry-result');
 root(`r.querySelector('#summaryAutoClose').click();return true;`);screenshot('closed');
 root(`r.querySelector('#dateEnd').dispatchEvent(new Event('change',{bubbles:true}));return true;`);
 await until(`return r.querySelector('#summaryAutoModal').classList.contains('show')&&!r.querySelector('#summaryAutoClose').disabled;`);
 assert.equal(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`),after,'repeat range cannot overwrite results');
 screenshot('existing-skipped');
 root(`r.querySelector('#summaryAutoClose').click();return true;`);
 evaluate(`navigator.locks.request=window.autoTestOriginalLock;true`);
 console.log('PASS browser default week auto-save, sequential ten days, failure/skip, retry preservation, close, repeat no overwrite');
})().catch(error=>{console.error(error);process.exitCode=1;});

