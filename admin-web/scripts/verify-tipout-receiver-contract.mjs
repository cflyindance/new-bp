import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const c={}; c.window=c; vm.createContext(c);
for (const file of ['tipout-employee-weights','tipout-time-window','tipout-funding']) vm.runInContext(fs.readFileSync(`src/team/tips/legacy/${file}.js.txt`,'utf8'),c);
const plain=x=>JSON.parse(JSON.stringify(x));
const at=t=>`2026-09-28T${t}:00-05:00`;
const facts=['A','B','C'].map((name,i)=>({employeeId:name,name,role:i===2?'Busser':'Server',originalTips:i?0:120,orderTips:i?0:120,reportedTips:0,
 attendance:{effectiveHours:i?3:6,punchSessions:[{status:'complete',clockInAt:at('18:00'),clockOutAt:at('22:00')}]},
 orders:Array.from({length:i?2:4},(_,j)=>({id:name+j,tipAmount:i===0&&j===0?120:0,salesAmount:100,completedPaymentAt:at('18:30'),timeZone:'America/Chicago'}))}));
const rule={id:'r',distribution:'average',clockin:'unrestricted',receivers:[{roles:['Server','Busser'],pct:100}],poolRules:[{type:'tips',pct:100}],funding:{version:1,priority:1,method:'balance',tipSources:['order'],formulas:[{source:'tips',rate:100}],groups:[{kind:'role',values:['Server','Busser']}]}};
const received=result=>plain(result.employeeAmounts).map(x=>x.amount??x.received);
assert.deepEqual(received(c.TipOutTimeWindow.allocateRule(rule,facts,'2026-09-28')),[40,40,40], 'one multi-role receiver row is one shared group');
const run=(r=rule,f=facts,o)=>c.TipOutFunding.calculate([r],f,'2026-09-28',o);
assert.deepEqual(received(run()),[40,40,40]);
const absent=plain(facts); absent[2].attendance={effectiveHours:0,punchSessions:[]};
assert.deepEqual(received(run(rule,absent)),[60,60,0], 'unrestricted average does not auto-admit absent staff');
assert.deepEqual(received(run(rule,absent,{r:{C:{included:true}}})),[40,40,40]);
assert.deepEqual(received(run({...rule,distribution:'orders'},absent)),[60,30,30]);
assert.deepEqual(received(run({...rule,distribution:'orders',clockin:'clock'},absent)),[80,40,0]);
const weighted=plain(rule); weighted.receivers[0].employeeWeights={Server:{B:2}};
for (const [method,expected] of [['average',[30,60,30]],['hours',[48,48,24]],['orders',[48,48,24]]]) {
 assert.deepEqual(received(run({...weighted,distribution:method})),expected);
}
for(const pct of [0,-10,90,110,NaN]) assert.throws(()=>run({...rule,receivers:[{roles:['Server'],pct}]}),/占比|比例/);
const nested={...rule,receivers:[{roles:['Server','Busser'],pct:100,subReceivers:[{roles:['Server','Busser'],pct:100}]}]};
assert.deepEqual(received(run(nested)),[40,40,40]);
assert.deepEqual(received(c.TipOutTimeWindow.allocateRule(nested,facts,'2026-09-28')),[40,40,40]);
assert.throws(()=>run({...rule,receivers:[{pct:100,subReceivers:[{roles:['Server'],pct:90}]}]}),/100/);
const split={...rule,receivers:[{roles:['Server'],pct:50},{roles:['Busser'],pct:50}]};
assert.deepEqual(received(run(split)),[30,30,60]);
assert.deepEqual(received(c.TipOutTimeWindow.allocateRule(split,facts,'2026-09-28')),[30,30,60]);
const zero=plain(rule);zero.receivers[0].employeeWeights={Server:{A:0,B:0},Busser:{C:0}};
assert.equal(run(zero).summary.unallocatedAmount,120);
assert.equal(c.TipOutTimeWindow.allocateRule(zero,facts,'2026-09-28').unallocated,120);
const snapshot=JSON.stringify(facts);run();assert.equal(JSON.stringify(facts),snapshot);
console.log('PASS: receiver groups, nested shares, all methods, explicit admission, weights, zero bases, immutable facts');
