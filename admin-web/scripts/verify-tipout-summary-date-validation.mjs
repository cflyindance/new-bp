import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
const exportSource=fs.readFileSync('src/team/tips/legacy/export.js.txt','utf8');
const template=fs.readFileSync('src/team/tips/templates/distribution.html','utf8');
function extract(text,name) {
  const start=text.match(new RegExp('^( *)(?:async )?function '+name+'\\([^\\n]*?\\) \\{','m'));
  assert.ok(start, name+' handler exists');
  const tail=text.slice(start.index+start[0].length);
  const end=tail.match(new RegExp('^'+start[1]+'\\}', 'm'));
  assert.ok(end, name+' closes');
  return start[0]+tail.slice(0,end.index)+end[0];
}
const els={};
for(const id of ['dateStart','dateEnd','summaryDateRangeError']){
  els[id]={value:'',textContent:'',hidden:true,attrs:{},focusCount:0,
    setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},focus(){this.focusCount++;}};
}
els.dateStart.value='2026-10-19';els.dateEnd.value='2026-10-23';
let renders=0, captures=0, invalidations=0, reads=0;
const context={window:{},document:{getElementById:id=>els[id]},lastValidSummaryDateRange:null,
  renderSummaryViewsFromFacts(){renders++;},
  invalidateDayPipelineCache(){invalidations++;},
  captureSummaryUiState(){captures++;},
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-summary-date-sort.js.txt','utf8'),context);
context.TipOutSummaryDateSort=context.window.TipOutSummaryDateSort;
for(const name of ['validateSummaryDateRange','handleSummaryDateRangeChange','renderSummaryViews'])
  vm.runInContext(extract(source,name),context);
context.window.TipOutScenarioSource={withReadCache(fn){reads++;return fn();}};
context.renderSummaryViews();
assert.equal(renders,1);
assert.equal(els.summaryDateRangeError.hidden,true);
assert.equal(context.lastValidSummaryDateRange.startDate,'2026-10-19');
const cases=[
 ['','2026-10-23','dateStart','请选择开始日期'],
 ['2026-10-19','','dateEnd','请选择结束日期'],
 ['2026-10-24','2026-10-23','dateStart','开始日期不能晚于结束日期'],
 ['2026-02-30','2026-03-02','dateStart','请输入有效的开始日期'],
 ['2026-10-19','bad','dateEnd','请输入有效的结束日期'],
];
for(const [start,end,field,message]of cases){
 els.dateStart.value=start;els.dateEnd.value=end;
 const oldRender=renders,oldRead=reads,oldCapture=captures;
 assert.equal(context.handleSummaryDateRangeChange(),false);
 assert.equal(renders,oldRender,'invalid range preserves rendered results');
 assert.equal(reads,oldRead,'invalid range does not read facts');
 assert.equal(captures,oldCapture,'invalid input is not persisted as query history');
 assert.equal(els[field].attrs['aria-invalid'],'true');
 assert.ok(els[field].focusCount>0);
 assert.ok(els.summaryDateRangeError.textContent.startsWith(message));
 assert.ok(els.summaryDateRangeError.textContent.includes('2026/10/19'));
 assert.equal(context.renderSummaryViews(),false,'background refresh cannot zero the overview');
}
// Guard every navigation or mutation using potentially stale results.
for(const name of ['openDailyDetail','openEmployeeReconciliationDetail','quickAllocateDay',
 'openConfirmPayoutModal','openTipAllocationModal','doCancelAllocate','setSummaryView','captureSummaryUiState'])
 vm.runInContext(extract(source,name),context);
for(const name of ['toggleExportMenu','exportAs','openEmailModal','sendEmail'])
 vm.runInContext(extract(exportSource,name),context);
for(const name of ['openDailyDetail','openEmployeeReconciliationDetail','quickAllocateDay',
 'openConfirmPayoutModal','openTipAllocationModal','doCancelAllocate','setSummaryView',
 'captureSummaryUiState','toggleExportMenu','exportAs','openEmailModal','sendEmail'])
 await context[name]('2026-10-20'); // Any unguarded downstream work would access missing collaborators and throw.
els.dateStart.value='2026-10-20';els.dateEnd.value='2026-10-20';
context.captureSummaryUiState=()=>{captures++;};
assert.equal(context.handleSummaryDateRangeChange(),true);
assert.equal(els.summaryDateRangeError.hidden,true);
assert.equal(els.dateStart.attrs['aria-invalid'],undefined);
assert.equal(els.dateEnd.attrs['aria-invalid'],undefined);
assert.equal(renders,2,'valid correction rerenders once');
assert.equal(invalidations,1);
assert.equal(captures,1);
assert.equal(context.lastValidSummaryDateRange.startDate,'2026-10-20');
assert.match(template,/id="summaryDateRangeError"[^>]*role="alert"/);
assert.match(template,/id="dateStart"[^>]*aria-label="开始日期"[^>]*handleSummaryDateRangeChange\(\)/);
assert.match(template,/id="dateEnd"[^>]*aria-label="结束日期"[^>]*handleSummaryDateRangeChange\(\)/);
console.log('PASS summary date validation: empty, invalid, reversed, same-day, preserved results/history, guarded actions, recovery');

