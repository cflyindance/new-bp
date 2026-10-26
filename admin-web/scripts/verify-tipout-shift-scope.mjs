import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const c={window:{}};vm.createContext(c);for(const name of ['tipout-employee-weights','tipout-time-window','tipout-funding'])vm.runInContext(fs.readFileSync('src/team/tips/legacy/'+name+'.js.txt','utf8'),c);
const engine=c.window.TipOutTimeWindow,at=t=>'2026-10-26T'+t+':00-05:00';
const person=(id,a,b,orders=[])=>({employeeId:id,name:id,role:'Server',originalTips:100,orderTips:100,reportedTips:0,attendance:{punchSessions:[{status:'complete',clockInAt:at(a),clockOutAt:at(b)}]},orders});
const order=(id,time,tip)=>({id,completedPaymentAt:at(time),timeZone:'America/Chicago',tipAmount:tip,businessDate:'2026-10-26'});
const facts=[person('A','10:00','12:00',[order('one','11:00',60)]),person('B','12:00','14:00',[order('two','13:00',60)])];
const shift={name:'午班',start:'10:00',end:'14:00',minClockMinutes:30,maxClockMinutes:60};
const rule={id:1,ruleName:'班次',poolKind:'tip',allocationMode:'legacy_pool',allocationScope:'shift',clockin:'time_window',distribution:'average',shifts:[shift],receivers:[{roles:['Server'],pct:100}],poolRules:[{type:'tips',pct:100}],deductRoles:['Server']};
const run=(r=rule,f=facts)=>engine.allocateRule(r,f,'2026-10-26');
assert.deepEqual(Array.from(run().employeeAmounts,e=>e.amount),[60,60]);
assert.equal(run().poolAmount,120);assert.equal(run().lines.length,1);
const uneven=[person('A','10:00','10:20',[order('a','11:00',60)]),person('B','10:00','14:00',[order('b','13:00',60)])];
assert.deepEqual(Array.from(run(rule,uneven).employeeAmounts,e=>e.amount),[0,120]);
const hours=run({...rule,distribution:'hours'},[person('A','10:00','11:00',[order('a','11:00',60)]),person('B','10:00','14:00',[order('b','13:00',60)])]);
assert.deepEqual(Array.from(hours.employeeAmounts,e=>e.amount),[60,60]);assert.equal(hours.lines[0].participants[1].actualMinutes,240);assert.equal(hours.lines[0].participants[1].allocationMinutes,60);
assert.deepEqual(Array.from(run({...rule,distribution:'orders'}).employeeAmounts,e=>e.amount),[60,60]);
assert.equal(run({...rule,shifts:[{...shift,minClockMinutes:300,maxClockMinutes:0}]}).unallocated,120);
assert.throws(()=>run({...rule,shifts:[shift,{...shift,name:'冲突',start:'13:00',end:'15:00'}]}),/重叠/);
assert.throws(()=>run({...rule,distribution:'hours',shifts:[{...shift,minClockMinutes:100,maxClockMinutes:30}]}),/上限/);
assert.throws(()=>engine.validateShifts([{...shift,minClockMinutes:NaN}]),/整数/);
assert.equal(engine.overlapMinutes(person('X','10:00','14:00'),{start:Date.parse(at('11:00')),end:Date.parse(at('12:00'))}),60);
const outside=[person('A','10:00','14:00',[order('before','09:00',10),order('end','14:00',20),order('within','10:00',30)])];assert.equal(run(rule,outside).poolAmount,30);
const overnight=[person('A','10:00','14:00')];overnight[0].attendance.punchSessions=[{status:'complete',clockInAt:'2026-10-26T22:00:00-05:00',clockOutAt:'2026-10-27T02:00:00-05:00'}];overnight[0].orders=[{...order('night','23:00',20),completedPaymentAt:'2026-10-27T01:00:00-05:00'}];assert.equal(run({...rule,shifts:[{...shift,start:'22:00',end:'02:00'}]},overnight).poolAmount,20);
const output=run();const snapshot={store:'s',dateKey:'2026-10-26',scenarioFacts:facts,pools:[{ruleId:1,poolAmount:output.poolAmount,timeWindow:output,employees:output.employeeAmounts}]};
const saved=c.window.TipOutFunding.reconcileExisting(snapshot,[rule]);assert.equal(saved.summary.allocatedAmount,120);


const twoShifts=run({...rule,shifts:[{...shift,name:'早',start:'10:00',end:'12:00',minClockMinutes:0},{...shift,name:'午',start:'12:00',end:'14:00',minClockMinutes:0}]});assert.equal(twoShifts.lines.length,2);assert.deepEqual(Array.from(twoShifts.employeeAmounts,p=>p.amount),[60,60]);
assert.deepEqual(Array.from(run({...rule,receivers:[{roles:['Server'],pct:100,employeeWeights:{Server:{A:2,B:1}}}]}).employeeAmounts,e=>e.amount),[80,40]);
assert.equal(hours.employeeAmounts[1].allocationHours,1);
const incomplete=JSON.parse(JSON.stringify(facts));incomplete[0].attendance.punchSessions=[{status:'missing-clock-out',clockInAt:at('10:00')}];assert.throws(()=>run(rule,incomplete),/不完整/);

vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-date-pool-view.js.txt','utf8'),c);c.window.TipOutScenarioSource={day:()=>outside,totals:()=>({sales:0,tips:60,manual:0,surcharge:0})};
const projected=c.window.TipOutDatePoolView.projectDate({dateKey:'2026-10-26',rules:[rule],allocated:false,originalTips:60});assert.equal(projected.poolAmount,30,'pending date summary must exclude tips outside selected shift');

console.log('PASS shifts: independent pool, threshold, cap, all methods, boundaries, overlap, cross-day and funding reconciliation');
