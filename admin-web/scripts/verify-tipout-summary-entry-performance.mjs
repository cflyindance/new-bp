import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

const rows = Array.from({length: 60}, (_, i) => ({id: 'e'+i, name: 'Employee '+i, role: 'Server', store: 'A'}));
let generations = 0;
const root = {localStorage: {getItem: () => JSON.stringify(rows)},
  TipOutRosterDirectory: {canonicalRosterStoreName: value => value},
};
const context = vm.createContext({window: root, document: {getElementById: () => ({value:'A'})}});
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-scenario-data.js.txt','utf8'), context);
const originalDay = root.TipOutScenarioData.day;
root.TipOutScenarioData.day = input => {generations++; return originalDay(input);};
vm.runInContext(fs.readFileSync('src/team/tips/legacy/tipout-scenario-source.js.txt','utf8'), context);
const source = root.TipOutScenarioSource;
const run = callback => source.withReadCache ? source.withReadCache(callback) : callback();
const before = performance.now();
run(() => { for (let day=1;day<=30;day++) for(const row of rows) {
  const key='2026-09-'+String(day).padStart(2,'0');
  source.employee(row.name,key,{employeeId:row.id,storeId:'A'});
  source.employee(row.name,key,{employeeId:row.id,storeId:'A'});
}});
console.log(JSON.stringify({employees:60,dates:30,generations,milliseconds:Math.round(performance.now()-before)}));
assert.equal(generations,30,'generate the store day once per synchronous summary render, not per employee');
let first;
run(() => { first=source.day('2026-09-01','A'); assert.equal(first,source.day('2026-09-01','A')); assert.notEqual(first,source.day('2026-09-01','B')); });
rows[0].name='Renamed';
assert.equal(run(()=>source.day('2026-09-01','A'))[0].name,'Renamed','next render must read fresh roster');
assert.throws(()=>run(()=>{source.day('2026-09-01','A');throw new Error('failed');}),/failed/);
rows[0].name='After failure';
assert.equal(source.day('2026-09-01','A')[0].name,'After failure','failed render must release cache');

const program = fs.readFileSync('src/team/tips/programs/distribution.js.txt','utf8');
const init = program.match(/    function initializeSummaryPage\(\) \{[\s\S]*?\n    \}/)[0];
let renders=0;
const initContext={window:{TipOutDemoRules:{ensure(){}}},document:{getElementById:()=>({})},URLSearchParams,history:{state:null},
  initStoreSelect(){},applyDefaultSummaryDateRange(){},syncSummaryDateSortUi(){},syncSummaryViewUi(){},
  TipOutSummaryUi:{resolveSummaryView:()=> 'date'},restoreSummaryUiState:()=>false,
  updateEmployeeFilter(skipRender){if(!skipRender)renders++;},renderDailySummaryList(){renders++;}};
initContext.window.location={search:''};
vm.runInNewContext(init+';initializeSummaryPage();',initContext);
assert.equal(renders,1,'first entry must render the summary once');
console.log('Summary entry performance, fresh reads and cleanup passed');
