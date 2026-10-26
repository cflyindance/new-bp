import assert from 'node:assert/strict';
import { projectTipOutSchedule } from '../src/team/tips/tips-schedule-source';
const base={shifts:[{id:'s1',name:'午班',startTime:'10:00',endTime:'14:00',color:'#fff',earlyClockInMinutes:0,autoClockOutDelayEnabled:false,autoClockOutDelayMinutes:0}],employees:[{id:'A',name:'A',store:'上海陆家嘴店'},{id:'B',name:'B',store:'广州天河店'}],assignments:[{employeeId:'A',date:'2026-10-26',shiftId:'s1',overrideStartTime:'11:00'},{employeeId:'B',date:'2026-10-26',shiftId:'s1'},{employeeId:'A',date:'2026-10-25',shiftId:'s1'}]};
const before=JSON.stringify(base), rows=projectTipOutSchedule('Golden Dragon Chinese Kitchen - Dallas, TX 75231','2026-10-26',base);
assert.equal(rows.length,1);assert.equal(rows[0].start,'11:00');assert.equal(rows[0].end,'14:00');assert.deepEqual(rows[0].employeeIds,['A']);assert.equal(rows[0].minClockMinutes,0);assert.equal(rows[0].maxClockMinutes,0);assert.equal(JSON.stringify(base),before);
assert.deepEqual(projectTipOutSchedule('上海陆家嘴店','2026-10-27',base),[]);
assert.throws(()=>projectTipOutSchedule('上海陆家嘴店','2026-10-26',{...base,shifts:[]}),/班次已失效/);
assert.throws(()=>projectTipOutSchedule('上海陆家嘴店','2026-10-26',{...base,shifts:[{...base.shifts[0],storeId:'广州天河店'}]}),/门店不一致/);
assert.deepEqual(projectTipOutSchedule('roster-store:'+encodeURIComponent('上海陆家嘴店'),'2026-10-26',base)[0].employeeIds,['A']);
console.log('PASS schedule adapter: store isolation and aliases, employee IDs, exact date, actual time overrides, no inline limits, invalid references, no writes');

const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)}});
const {readCommittedTeamSchedule}=await import('../src/config/team-shift-scheduling-ui');
memory.set('tipout-employees-roster-v1',JSON.stringify(base.employees));memory.set('bplant-team-shift-types-v1',JSON.stringify([{...base.shifts[0],startTime:'13:00'}]));memory.set('bplant-team-shift-assignments-v1',JSON.stringify(base.assignments));
memory.set('bplant-team-shift-draft-baseline-v1',JSON.stringify({shifts:base.shifts,assignments:base.assignments}));
assert.equal(readCommittedTeamSchedule().shifts[0].startTime,'10:00','other-tab uncommitted draft must not leak into tips');
memory.delete('bplant-team-shift-draft-baseline-v1');assert.equal(readCommittedTeamSchedule().shifts[0].startTime,'13:00','after save baseline removal, read updated schedule');
console.log('PASS committed schedule reader: draft isolation and saved refresh');
