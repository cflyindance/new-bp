const {createRequire}=require('node:module');
const path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=createRequire(path.join(process.env.TIPOUT_BROWSER_PACKAGES,'package.json'))('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:65021/');
  await page.evaluate(async()=>{
   const {mountLegacyTipsRuntime}=await import('/src/team/tips/tips-legacy-runtime.ts');
   const {renderTipsTemplate}=await import('/src/team/tips/tips-templates.ts');
   const store='Golden Dragon Chinese Kitchen - Dallas, TX 75231';
   localStorage.clear();
   localStorage.setItem('tipout_rules',JSON.stringify([{id:901,ruleName:'旧在岗上限',store,poolKind:'tip',allocationMode:'legacy_pool',distribution:'hours',clockin:'time_window',workHoursConfig:{mode:'capped',maxHoursPerDay:2},poolRules:[],receivers:[]}]));
   document.body.innerHTML='<div id="test-host"></div>';
   const shadow=document.querySelector('#test-host').attachShadow({mode:'open'}),root=document.createElement('div');shadow.append(root);
   const style=document.createElement('style');style.textContent=(await import('/src/team/tips/tips-page.css?inline')).default;shadow.append(style);
   const context={getScope:()=>({storeId:store,storeLabel:store,storeLabelEn:store,isAllStores:false,usesInPageStorePicker:true,stores:[{id:store,labelZh:store,labelEn:store}]}),setStoreScope:()=>{},subscribeScopeChange:()=>()=>{},navigate:()=>{},replace:()=>{},getNavigationState:()=>null,getScrollOwner:()=>null};
   window.mountEditor=(edit=false)=>{window.runtime?.destroy();root.innerHTML=renderTipsTemplate('rule-editor');const query=edit?'?poolKind=tip&mode=edit&id=901':'?poolKind=tip';window.runtime=mountLegacyTipsRuntime(shadow,root,{view:'rule-editor',query,href:'/team/tips/rules/editor'+query},context);};
   window.mountEditor();
  });
  await page.locator('input[name="distribution"][value="hours"]').check();
  assert.equal(await page.locator('#workHoursActualLabel').innerText(),'按有效打卡工时');
  await page.locator('input[name="workHoursMode"][value="capped"]').check();
  await page.locator('#maxHoursPerDay').fill('5');
  await page.locator('input[name="clockin"][value="unrestricted"]').check();
  assert.equal(await page.locator('#workHoursActualLabel').innerText(),'按有效分配工时');
  await page.locator('input[name="clockin"][value="time_window"]').check();
  assert.equal(await page.locator('#workHoursEditableOptions').isVisible(),false);
  assert.equal(await page.locator('#workHoursTimeWindowInfo').isVisible(),true);
  assert.equal(await page.locator('#maxHoursPerDay').isDisabled(),true);
  assert.equal(await page.locator('#workHoursTimeWindowCapNotice').isVisible(),true);
  await page.locator('input[name="clockin"][value="clock"]').check();
  assert.equal(await page.locator('#maxHoursPerDay').inputValue(),'5');
  assert.equal(await page.locator('#maxHoursPerDay').isDisabled(),false);
  await page.locator('input[name="distribution"][value="orders"]').check();
  assert.equal(await page.locator('#workHoursConfigPanel').isVisible(),false);
  await page.evaluate(()=>window.mountEditor(true));
  assert.equal(await page.locator('#legacyTimeWindowHoursNotice').isVisible(),true);
  assert.equal(await page.locator('#legacyTimeWindowHoursAck').isChecked(),false);
  await page.locator('#legacyTimeWindowHoursAck').check();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('tipout_rules'))[0].workHoursConfig.mode),'capped');
  assert.deepEqual(errors,[]);
  console.log('PASS: real editor linkage, cap draft restoration, legacy warning/ack and no automatic rule writes');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
