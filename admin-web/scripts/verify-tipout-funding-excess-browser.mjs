// Read-only acceptance against the dedicated authenticated agent-browser test session.
// Start preview, open the dedicated fixture on 2026-10-20 and allow automatic confirmation first.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const session=process.env.TIPOUT_TEST_SESSION||'tips-excess-20261023';
if(!/^[a-z0-9-]+$/i.test(session))throw new Error('Use an isolated test session name');
const code=`(async()=>{let root;for(let retry=0;retry<40;retry++){root=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(root?.querySelector('.tipout-funding-summary'))break;await new Promise(resolve=>setTimeout(resolve,100));}
const snapshot=Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1')||'{}')).find(s=>s.store==='【演示】贡献超计划验收门店'&&s.dateKey==='2026-10-20');
const panel=root?.querySelector('.tipout-funding-summary');
return {snapshot: snapshot&&{summary:snapshot.summary,funding:snapshot.pools[0].funding,amounts:snapshot.employeeAmounts},panel:panel?.textContent,state:panel?.getAttribute('data-funding-state'),formula:root?.querySelector('.formula-pool-val')?.textContent,cardPool:root?.querySelector('.detail-card')?.getAttribute('data-pool')};})()`;
const b64=Buffer.from(code).toString('base64');
const result=JSON.parse(process.platform==='win32'?execFileSync('cmd.exe',['/d','/s','/c',`agent-browser.cmd --session ${session} eval -b ${b64}`],{encoding:'utf8'}):execFileSync('agent-browser',['--session',session,'eval','-b',b64],{encoding:'utf8'}));
assert.ok(result.snapshot,'open dedicated fixture and confirm first');assert.equal(result.snapshot.funding.target,10);assert.equal(result.snapshot.funding.contributed,20);
assert.equal(result.snapshot.funding.actual,20);assert.equal(result.snapshot.funding.ownerContribution,0);
assert.equal(result.snapshot.amounts.find(e=>e.employeeId==='funding-source').deducted,20);
assert.equal(result.snapshot.amounts.find(e=>e.employeeId==='funding-kitchen').received,12);
assert.equal(result.snapshot.amounts.find(e=>e.employeeId==='funding-busser').received,8);
assert.equal(result.snapshot.summary.poolAmount,20);assert.equal(result.snapshot.summary.unallocatedAmount,0);
assert.match(result.panel,/贡献超出计划 \$10.00/);assert.match(result.panel,/实际可分配金额\$20.00/);assert.equal(result.state,'confirmed');assert.equal(result.formula,'$10.00');assert.equal(result.cardPool,'20');
console.log('PASS actual browser: confirmed 10/20, source deduction20, receivers12/8, actual overview20, preserved formula10 and excess marker');
