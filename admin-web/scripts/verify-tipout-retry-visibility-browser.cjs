// Run against the dedicated, signed-in agent-browser session; never clears user storage.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const session=process.env.TIPOUT_BROWSER_SESSION||'tips-retry-visibility-20261026';
const directory=path.resolve('dist/TipOut/docs/assets/tips-retry-visibility-20261026');fs.mkdirSync(directory,{recursive:true});
function cli(args,input){return execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} ${args}`],{input,encoding:'utf8',timeout:60000});}
function evaluate(code){const output=cli('eval --stdin',code).trim();return JSON.parse(output);}
function root(code){return evaluate(`(()=>{const r=[...document.querySelectorAll('*')].map(e=>e.shadowRoot).find(r=>r&&r.querySelector('#summaryAutoModal'));if(!r)throw Error('TipOut root missing');${code}})()`);}
async function until(code){for(let i=0;i<100;i++){if(root(code))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+code);}
function screenshot(name){cli('screenshot '+path.join(directory,name+'.png').replaceAll('\\','/'));}
(async()=>{
 cli('set viewport 1500 950');
 if(root(`return r.querySelector('#summaryAutoModal').classList.contains('show');`)){await until(`return !r.querySelector('#summaryAutoClose').disabled;`);root(`r.querySelector('#summaryAutoClose').click();return true;`);}
 evaluate(`(()=>{const store='Golden Dragon Chinese Kitchen - Dallas, TX 75231',dates=['2026-09-01','2026-09-02'];for(const key of ['tipout_allocation_results_v1','tipout-payout-records-v1']){const data=JSON.parse(localStorage.getItem(key)||'{}');dates.forEach(d=>delete data[store+String.fromCharCode(0)+d]);localStorage.setItem(key,JSON.stringify(data));}const flags=JSON.parse(localStorage.getItem('tipout_allocated')||'{}');flags[store]=(flags[store]||[]).filter(d=>!dates.includes(d));localStorage.setItem('tipout_allocated',JSON.stringify(flags));return true;})()`);
 evaluate(`window.retryTestLock=navigator.locks.request.bind(navigator.locks);window.retryTestFailed=false;navigator.locks.request=async function(name,options,callback){if(name.includes('2026-09-01')&&!window.retryTestFailed){window.retryTestFailed=true;throw Error('演示：临时写入失败');}if(name.includes('2026-09-02'))await new Promise(r=>setTimeout(r,5000));return window.retryTestLock(name,options,callback);};true`);
 root(`r.querySelector('#dateStart').value='2026-09-01';r.querySelector('#dateEnd').value='2026-09-02';r.querySelector('#dateEnd').dispatchEvent(new Event('change',{bubbles:true}));return true;`);
 await until(`return r.querySelector('#summaryAutoCounts').textContent.includes('失败 1 天')&&r.querySelector('#summaryAutoClose').disabled;`);
 assert.equal(root(`return r.querySelector('#summaryAutoRetry').hidden&&getComputedStyle(r.querySelector('#summaryAutoRetry')).display==='none';`),true);screenshot('running');
 await until(`return !r.querySelector('#summaryAutoClose').disabled;`);
 assert.equal(root(`const b=r.querySelector('#summaryAutoRetry');return !b.hidden&&!b.disabled&&getComputedStyle(b).display!=='none';`),true);screenshot('failed');
 const before=JSON.parse(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`));
 root(`r.querySelector('#summaryAutoRetry').click();return true;`);
 await until(`return !r.querySelector('#summaryAutoClose').disabled;`);
 assert.equal(root(`const b=r.querySelector('#summaryAutoRetry');return b.hidden&&b.disabled&&getComputedStyle(b).display==='none';`),true);
 assert.ok(root(`return r.querySelector('#summaryAutoCounts').textContent;`).includes('失败 0 天'));
 const after=JSON.parse(evaluate(`localStorage.getItem('tipout_allocation_results_v1')`));for(const [key,value]of Object.entries(before))assert.deepEqual(after[key],value);
 screenshot('success');root(`r.querySelector('#summaryAutoClose').click();return true;`);evaluate(`navigator.locks.request=window.retryTestLock;true`);
 console.log('PASS browser retry visibility: hidden during running with failures, shown after completed failure, hidden after retry success; saved results preserved');
})().catch(error=>{console.error(error);process.exitCode=1;});
