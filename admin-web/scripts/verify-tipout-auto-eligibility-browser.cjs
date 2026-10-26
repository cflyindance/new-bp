// Run against the dedicated, signed-in agent-browser session; never clears user storage.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const session=process.env.TIPOUT_BROWSER_SESSION||'tips-auto-eligible-20261026';
const directory=path.resolve('dist/TipOut/docs/assets/tips-auto-eligibility-20261026');fs.mkdirSync(directory,{recursive:true});
function cli(args,input){return execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{input,encoding:'utf8',timeout:60000});}
function evaluate(code){const output=cli('eval --stdin',code).trim();return JSON.parse(output);}
function root(code){return evaluate(`(()=>{const r=[...document.querySelectorAll('*')].map(e=>e.shadowRoot).find(r=>r&&r.querySelector('#summaryAutoModal'));if(!r)throw Error('TipOut root missing');${code}})()`);}
async function until(code){for(let i=0;i<100;i++){if(root(code))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+code);}
function screenshot(name){cli('screenshot '+path.join(directory,name+'.png').replaceAll('\\','/'));}
(async()=>{
 cli('set viewport 1500 950');
 await until(`return !!r.querySelector('#dateStart');`);
 if(root(`return r.querySelector('#summaryAutoModal').classList.contains('show');`)){
   await until(`return !r.querySelector('#summaryAutoClose').disabled;`);
   root(`r.querySelector('#summaryAutoClose').click();return true;`);
 }
 const reset=(all)=>evaluate(`(()=>{const store='Golden Dragon Chinese Kitchen - Dallas, TX 75231',dates=${JSON.stringify(all)};for(const key of ['tipout_allocation_results_v1','tipout-payout-records-v1']){const data=JSON.parse(localStorage.getItem(key)||'{}');dates.forEach(d=>delete data[store+'\\u0000'+d]);localStorage.setItem(key,JSON.stringify(data));}const flags=JSON.parse(localStorage.getItem('tipout_allocated')||'{}');flags[store]=(flags[store]||[]).filter(d=>!dates.includes(d));localStorage.setItem('tipout_allocated',JSON.stringify(flags));return true;})()`);
 reset(Array.from({length:10},(_,i)=>'2026-09-'+String(i+1).padStart(2,'0')));
 evaluate(`window.autoTestOriginalLock=navigator.locks.request.bind(navigator.locks);window.autoTestFailed=false;navigator.locks.request=async function(name,options,callback){if(name.includes('2026-09-04')&&!window.autoTestFailed){window.autoTestFailed=true;throw Error('演示：临时写入失败，请重试');}return window.autoTestOriginalLock(name,options,callback);};true`);
 function range(start,end){root(`r.querySelector('#dateStart').value='${start}';r.querySelector('#dateEnd').value='${end}';r.querySelector('#dateEnd').dispatchEvent(new Event('change',{bubbles:true}));return true;`);}
 range('2026-09-01','2026-09-10');
 await until(`return r.querySelector('#summaryAutoModal').classList.contains('show')&&!r.querySelector('#summaryAutoClose').disabled;`);
 const rows=root(`return [...r.querySelectorAll('#summaryAutoRows tr')].map(e=>e.textContent);`);
 assert.equal(rows.length,8);assert.ok(rows.some(t=>t.includes('2026-09-04')&&t.includes('分配失败')));assert.ok(rows.every(t=>!t.includes('2026-09-03')&&!t.includes('2026-09-10')));
 screenshot('write-failed');
 const before=JSON.parse(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`));
 root(`r.querySelector('#summaryAutoRetry').click();return true;`);
 await until(`return !r.querySelector('#summaryAutoClose').disabled;`);
 assert.ok(root(`return r.querySelector('#summaryAutoCounts').textContent;`).includes('失败 0 天'));
 const after=evaluate(`localStorage.getItem('tipout_allocation_results_v1')`),saved=JSON.parse(after);
 for(const [key,value]of Object.entries(before))assert.deepEqual(saved[key],value);
 screenshot('retry-success');root(`r.querySelector('#summaryAutoClose').click();return true;`);
 async function silent(start,end){
  const observed=await root(`return (async()=>{const modal=r.querySelector('#summaryAutoModal');let opened=false;const observer=new MutationObserver(()=>{if(modal.classList.contains('show'))opened=true;});observer.observe(modal,{attributes:true,attributeFilter:['class']});r.querySelector('#dateStart').value='${start}';r.querySelector('#dateEnd').value='${end}';r.querySelector('#dateEnd').dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,1800));observer.disconnect();return {opened,showing:modal.classList.contains('show'),inert:r.querySelector('#dateStart').closest('section').inert};})();`);
  assert.deepEqual(observed,{inert:false,opened:false,showing:false});
  assert.equal(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`),after);
 }
 await silent('2026-09-01','2026-09-10');screenshot('all-allocated');
 await silent('2026-09-03','2026-09-03');screenshot('closed-only');
 reset(['2026-09-04']);range('2026-09-01','2026-09-10');
 await until(`return r.querySelector('#summaryAutoModal').classList.contains('show')&&!r.querySelector('#summaryAutoClose').disabled;`);
 assert.equal(root(`return r.querySelectorAll('#summaryAutoRows tr').length;`),1);
 assert.match(root(`return r.querySelector('#summaryAutoRows').textContent;`),/2026-09-04.*分配成功/);
 const final=JSON.parse(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`));
 for(const [key,value]of Object.entries(saved))if(!key.endsWith('2026-09-04'))assert.deepEqual(final[key],value);
 screenshot('one-pending');root(`r.querySelector('#summaryAutoClose').click();return true;`);
 evaluate(`navigator.locks.request=window.autoTestOriginalLock;true`);
 console.log('PASS browser: no transient dialog for allocated/closed ranges; only one pending date queued; eight eligible dates continue on failure and retry without overwriting');
})().catch(error=>{console.error(error);process.exitCode=1;});
