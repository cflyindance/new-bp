import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const code=`(async()=>{let root;for(let i=0;i<50;i++){root=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(root?.querySelector('.detail-contribution-section'))break;await new Promise(x=>setTimeout(x,100));}
if(location.origin!=='http://127.0.0.1:65122')throw Error('isolated preview only');
const rule=JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.demoScenarioKey==='employee-share-test-v1');
const snapshot=Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1'))).find(s=>s.dateKey==='2026-10-23'&&s.store===rule.store);
return {shares:rule.deductConfig.salesPct.employeeShares,pool:snapshot.pools.find(p=>String(p.ruleId)===String(rule.id)),text:root.querySelector('.detail-contribution-section').textContent,locked:!!root.querySelector('.tipout-lock-banner')};})()`;
const out=execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval -b '+Buffer.from(code).toString('base64')],{encoding:'utf8'});
const r=JSON.parse(out);
assert.deepEqual(r.shares.employees.map(e=>e.pct),[40,60]);assert.equal(r.pool.funding.contributed,80);assert.equal(r.pool.funding.target,100);assert.equal(r.pool.funding.actual,100);assert.equal(r.pool.funding.ownerContribution,20);
assert.deepEqual(r.pool.funding.contributionRules[0].employees.map(e=>e.amount),[20,60]);assert.equal(r.pool.funding.contributionRules[0].shortfall,20);
assert.match(r.text,/可扣余额不足，少扣 \$20.00/);assert.equal(r.locked,true);
console.log('PASS live UI: saved40/60, contribution80, owner20, actual100, due40/60 actual20/60, shortage20 in locked snapshot');
