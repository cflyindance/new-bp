import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const helper=fs.readFileSync('src/team/tips/legacy/tipout-summary-date-sort.js.txt','utf8');
const now=new Date(2026,9,26,23,59);
const context={window:{},Date:class extends Date{constructor(...args){super(...(args.length?args:[2026,9,26,23,59]));}}};vm.createContext(context);vm.runInContext(helper,context);
const api=context.window.TipOutSummaryDateSort;
assert.equal(typeof api.quickDateRange,'function');
const expected={today:['2026-10-26','2026-10-26'],yesterday:['2026-10-25','2026-10-25'],'this-week':['2026-10-26','2026-10-26'],'last-week':['2026-10-19','2026-10-25'],'this-month':['2026-10-01','2026-10-26'],'last-month':['2026-09-01','2026-09-30']};
for(const [key,[startDate,endDate]]of Object.entries(expected))assert.deepEqual({...api.quickDateRange(key,now)},{startDate,endDate});
const edges=[['this-week',new Date(2026,9,25),'2026-10-19','2026-10-25'],['last-week',new Date(2027,0,1),'2026-12-21','2026-12-27'],['last-month',new Date(2024,2,1),'2024-02-01','2024-02-29'],['last-month',new Date(2026,2,31),'2026-02-01','2026-02-28'],['last-month',new Date(2026,0,1),'2025-12-01','2025-12-31'],['yesterday',new Date(2026,0,1),'2025-12-31','2025-12-31']];
for(const [key,date,startDate,endDate]of edges)assert.deepEqual({...api.quickDateRange(key,date)},{startDate,endDate});
assert.equal(api.quickDateRange('unknown',now),null);assert.equal(api.quickDateRange('today',new Date(NaN)),null);
assert.deepEqual({...api.defaultDateRange(now)},{startDate:'2026-09-26',endDate:'2026-10-26'},'initial rolling month unchanged');
function element(){return {value:'',attrs:{},hidden:true,textContent:'',setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){}};}
const nodes={dateStart:element(),dateEnd:element(),summaryDateRangeError:element()};
const buttons=Object.keys(expected).map(key=>({...element(),dataset:{datePreset:key}}));
nodes.summaryDatePresets={querySelectorAll:()=>buttons};
let renders=0,captures=0,invalidations=0,scheduled=0;
context.scheduleSummaryAutoAllocation=()=>scheduled++;
Object.assign(context,{document:{getElementById:id=>nodes[id]},TipOutSummaryDateSort:api,activeSummaryDatePreset:'',lastValidSummaryDateRange:{startDate:'2026-09-26',endDate:'2026-10-26'},invalidateDayPipelineCache(){invalidations++;},renderSummaryViews(){renders++;},captureSummaryUiState(){captures++;}});
const source=fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
function extract(name){const start=source.match(new RegExp('^( *)function '+name+'\\([^\\n]*\\) \\{','m'));assert.ok(start,name);const tail=source.slice(start.index+start[0].length),end=tail.match(new RegExp('^'+start[1]+'\\}','m'));return start[0]+tail.slice(0,end.index)+end[0];}
for(const name of ['validateSummaryDateRange','syncSummaryDatePresetUi','handleSummaryDateRangeChange','applySummaryDatePreset'])vm.runInContext(extract(name),context);
for(const [key,range]of Object.entries(expected)){assert.equal(context.applySummaryDatePreset(key),true);assert.deepEqual([nodes.dateStart.value,nodes.dateEnd.value],range);assert.deepEqual(buttons.filter(b=>b.attrs['aria-pressed']==='true').map(b=>b.dataset.datePreset),[key]);}
assert.equal(renders,6);assert.equal(captures,6);assert.equal(invalidations,6,'one update per click');
assert.equal(scheduled,6,'valid ranges schedule allocation once; invalid ranges do not');
assert.equal(context.applySummaryDatePreset('bad'),false);assert.equal(renders,6);
nodes.dateStart.value='';assert.equal(context.handleSummaryDateRangeChange(),false);assert.ok(buttons.every(b=>b.attrs['aria-pressed']==='false'));assert.equal(renders,6,'invalid manual date preserves previous results');
assert.equal(context.applySummaryDatePreset('today'),true);assert.equal(nodes.summaryDateRangeError.hidden,true,'shortcut repairs invalid manual date');
nodes.dateStart.value='2026-10-26';assert.equal(context.handleSummaryDateRangeChange(),true);assert.ok(buttons.every(b=>b.attrs['aria-pressed']==='false'),'manual edit clears highlight even for same range');
context.activeSummaryDatePreset='yesterday';context.syncSummaryDatePresetUi();assert.ok(buttons.every(b=>b.attrs['aria-pressed']==='false'),'stale range cannot stay selected');
const template=fs.readFileSync('src/team/tips/templates/distribution.html','utf8');
assert.ok(template.indexOf('id="summaryDatePresets"')<template.indexOf('id="dateRangeFilterField"'));
for(const key of Object.keys(expected))assert.match(template,new RegExp('type="button"[^>]*data-date-preset="'+key+'"[^>]*aria-pressed="false"'));
console.log('PASS quick dates: six ranges, leap/year/week boundaries, initial default, one refresh, manual clear, invalid recovery and accessible buttons');
