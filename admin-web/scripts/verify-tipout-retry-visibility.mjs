import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync('src/team/tips/programs/summary-auto-allocation.js.txt','utf8');
const fn=src.slice(src.indexOf('    function renderSummaryAutoProgress('),src.indexOf('    function startSummaryAutoAllocation('));
const nodes={};let focused='';
const document={getElementById(id){return nodes[id]||(nodes[id]={focus(){focused=id;}});}};
const context={document,summaryAutoDisposed:false,summaryAutoScope:{store:'s',startDate:'d1',endDate:'d2'},escapeSummaryHtml:String,invalidateDayPipelineCache(){},renderSummaryViews(){}};
vm.createContext(context);vm.runInContext(fn,context);
for(const [running,statuses,hidden]of [[true,['failed','running'],true],[false,['failed','success'],false],[true,['running','success'],true],[false,['success','success'],true],[false,['skipped','success'],true]]){
 context.renderSummaryAutoProgress({running,items:statuses.map((status,i)=>({date:'d'+i,status,message:''}))});
 assert.equal(nodes.summaryAutoRetry.hidden,hidden,JSON.stringify({running,statuses}));
 assert.equal(nodes.summaryAutoRetry.disabled,hidden);
 if(!running)assert.equal(focused,hidden?'summaryAutoClose':'summaryAutoRetry');
}
assert.match(fs.readFileSync('src/team/tips/templates/distribution.html','utf8'),/id="summaryAutoRetry"[^>]*hidden/);
assert.match(fs.readFileSync('src/team/tips/tips-page.css','utf8'),/#summaryAutoRetry\[hidden\]\s*\{\s*display:\s*none/);
console.log('PASS retry button: hidden while running including failures, visible only after failed completion, hidden after success, focus and initial/CSS hiding');
