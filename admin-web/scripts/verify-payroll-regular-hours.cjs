const assert = require('node:assert/strict');
const fs = require('node:fs');
const code = fs.readFileSync('src/team/payroll/legacy/payroll.js.txt', 'utf8');
const start = code.indexOf('  function computeRegularHoursFromDay(');
const end = code.indexOf('\n  function ', start + 5);
const calc = new Function('pairNetMinutes', 'mealMinutes', `${code.slice(start,end)};return computeRegularHoursFromDay`)(
  (a,b) => {const m=s=>s.split(':').reduce((h,v)=>h*60+Number(v),0);return (m(b)-m(a)+1440)%1440;},
  s => !s ? 0 : String(s).includes(':') ? String(s).split(':').reduce((h,v)=>h*60+Number(v),0) : Number(s)
);
const day = {slots:[{in:'09:00',out:'18:00'}],unpaidMealBreak:'0:30',paidMealBreak:'',ot:2.5,ot2:0};
assert.equal(calc(day),6,'OT must not also be included in Regular');
assert.equal(calc({...day,ot:0}),8.5);
assert.equal(calc({...day,ot:1,ot2:1.5}),6);
assert.equal(calc({...day,ot:9}),0);
assert.equal(calc({...day,ot:0,paidMealBreak:'0:15'}),8.25);
console.log('Regular / OT non-overlap passed');
