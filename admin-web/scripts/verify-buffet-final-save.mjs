import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const flow = fs.readFileSync('dist/Configuration center/assets/order-limit-flow.js','utf8');
const between = (a,b) => {const i=flow.indexOf(a),j=flow.indexOf(b,i); assert.ok(i>=0&&j>i,a); return flow.slice(i,j);};
const helpers = between('  function isTransientBuffetCreate(', '  function saveEditorDraft(');
let writes=0, timers=0, recovery=0, fail=false, buffet=true, validation=null, navigations=0;
let envelope={rules:[{id:2,status:'disabled'}],drafts:[{id:9,status:'draft'}],snapshots:{kept:{}},currentSnapshotId:'kept'};
const clone=x=>JSON.parse(JSON.stringify(x));
const buttons={};
const context=vm.createContext({
  moduleProfile:{routes:{list:'buffet-rule.html',editor:'buffet-rule-editor.html'},repository:{mutateEnvelope(_rev,fn){const next=fn(clone(envelope)); if(fail)throw Error('storage full'); envelope=next; writes++;}}},
  editorState:null, viewMode:false, AUTOSAVE_DELAY:900, RECOVERY_PREFIX:'recovery:',
  isBuffetProfile:()=>buffet,cloneValue:clone,
  nextRuleId:rules=>Math.max(0,...rules.map(r=>Number(r.id)||0))+1,
  buildCompatibilityRule:(r,status)=>({...clone(r),status,publishedConfig:{shouldBeRemoved:true}}),
  loadRules:()=>clone(envelope.rules.concat(envelope.drafts)),saveRules:()=>{writes++;},
  getParams:()=>new URLSearchParams(''),draftFromRule:()=>({name:'',conditions:{}}),today:()=> '2026-11-07',
  window:{location:{},clearTimeout(){},setTimeout(){timers++;}},
  history:{replaceState(){throw Error('new create must not rewrite draftId');}},
  sessionStorage:{setItem(){recovery++;},removeItem(){}},
  document:{getElementById:id=>(buttons[id] ||= {})},
  setSaveState(){},toast(){},finalStepNumber:()=>5,validateAll:()=>validation,
  goToEditorStep(){},teardownSceneComboNavSpy(){},go(){navigations++;},URLSearchParams
});
vm.runInContext(helpers,context);
vm.runInContext(between('  function initializeDraftRule(', '  function initializeViewRule('),context);
vm.runInContext(between('  function saveEditorDraft(', '  function validateContinuousRanges('),context);
const rule=context.initializeDraftRule();
assert.equal(rule.transientCreate,true);
assert.equal(rule.id,null);
assert.equal(rule.status,'disabled');
assert.equal(writes,0);
assert.equal(rule.editorDraft.buffetTemplateSelectionMode,'preset_only');
context.editorState={rule,currentStep:1,stepErrors:{},dirty:false};
context.markEditorDirty();
assert.equal(context.saveEditorDraft(true),true);
assert.equal(writes,0);assert.equal(timers,0);assert.equal(recovery,0);
assert.equal(context.saveTransientBuffetRuleAndReturn(),false,'not final step');
context.editorState.currentStep=5;
validation={step:2,message:'missing quantities'};
assert.equal(context.saveTransientBuffetRuleAndReturn(),false);
assert.equal(writes,0);
validation=null;fail=true;
const before=JSON.stringify(envelope);
assert.equal(context.saveTransientBuffetRuleAndReturn(),false);
assert.equal(JSON.stringify(envelope),before);
assert.equal(rule.savedRuleId,undefined);assert.equal(context.editorState.dirty,true);
fail=false;
assert.equal(context.saveTransientBuffetRuleAndReturn(),true);
assert.equal(writes,1);assert.equal(rule.savedRuleId,10);
const saved=envelope.rules.at(-1);
assert.equal(saved.status,'disabled');assert.equal(saved.publishedConfig,null);
assert.equal(saved.transientCreate,undefined);assert.equal(envelope.drafts.length,1);
assert.equal(envelope.currentSnapshotId,'kept');
assert.equal(context.saveTransientBuffetRuleAndReturn(),true);
assert.equal(writes,1,'repeat final click must not duplicate');
context.persistNewBuffetRule({transientCreate:true,editorDraft:{name:'another tab'}});
assert.equal(envelope.rules.at(-1).id,11,'ID allocated against latest locked data');
const review=context.renderTransientBuffetReview('确认规则并发布 发布前检查通过：<div class="olf-summary olf-summary--primary">保存并下发</div>');
assert.doesNotMatch(review,/发布|下发后/);assert.match(review,/保存后默认禁用/);
buffet=false;
assert.equal(context.isTransientBuffetCreate(),false);
assert.ok(navigations>=1);
const list=fs.readFileSync('dist/Configuration center/buffet-rule.html','utf8');
const storage=new Map();
const listContext=vm.createContext({
 state:{filters:{keyword:'牛肉',storeId:'store-a'},advancedOpen:true},
 sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
 document:{getElementById:id=>(buttons[id] ||= {})},
 window:{scrollY:360,scrollTo(_x,y){assert.equal(y,360);}},
 refreshDynamicOptions(){},render(){},requestAnimationFrame:fn=>fn()
});
vm.runInContext(list.slice(list.indexOf('      var createReturnKey='),list.indexOf('      function records()')),listContext);
listContext.rememberCreateReturn();
listContext.state.filters.keyword='';listContext.state.filters.storeId='';
listContext.state.advancedOpen=false;
listContext.restoreCreateReturn();
assert.equal(listContext.state.filters.keyword,'牛肉');
assert.equal(listContext.state.filters.storeId,'store-a');
assert.equal(listContext.state.advancedOpen,false,'removed advanced state is not restored');
assert.equal(storage.size,0,'return context consumed once');
console.log('verify-buffet-final-save: PASS');
