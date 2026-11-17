const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),base=process.env.BRAND_PREVIEW_URL || 'http://127.0.0.1:5316',dir='output/playwright/buffet-scene-title';
 fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/Configuration%20center/buffet-rule.html');
  await page.evaluate(()=>{
   const p=window.ORDER_LIMIT_MODULE_PROFILE;
   const rule=p.createDefaultScenarioRule(p.defaultScenarios.find(s=>s.key==='party_size|per_round|dish'),99018);
   rule.origin='custom';rule.status='draft';
   const d=rule.editorDraft;
   d.currentStep=2;d.highestStep=5;d.buffetSceneFusionVersion=1;
   d.subject='party_size';d.targetType='dish';d.buffetTemplateId='party-multi-round';
   d.period='multi_round';d.enabledPeriods=['multi_round'];
   d.partyRanges=[{min:1,max:null,rangeId:'p1'}];
   d.roundRanges=[{min:1,max:1,rangeId:'r1'},{min:2,max:4,rangeId:'r2'}];
   d.periodPolicies={multi_round:{blocks:{targetEnabled:true,totalEnabled:false,sameDishEnabled:false}}};
   d.participatingStoreIds=['ny-midtown'];d.deployStoreIds=['ny-midtown'];d.activeStoreId='ny-midtown';
   d.storeConfigs={'ny-midtown':{productLines:['kiosk'],dishTargets:[{productLineId:'kiosk',dishId:'d:g-hotpot:c-hotpot-base:d-pot-single'}],categoryTargets:[],dishSetMembers:[],periodValues:{multi_round:{targetLimits:{},exceptionDishLimits:{},totalBounds:{}}}}};
   d.storeConfigs['ny-midtown'].targetIds=['dish:d:g-hotpot:c-hotpot-base:d-pot-single'];
   d.storeConfigs['ny-midtown'].structureByLine={kiosk:['d:g-hotpot:c-hotpot-base:d-pot-single'],emenu:[],sdi:[]};
   p.repository.saveRules([rule]);
  });
  await page.goto(base+'/Configuration%20center/buffet-rule-editor.html?draftId=99018');
  await page.screenshot({path:dir+'/debug-editor.png'});
  const cards=page.locator('[data-quantity-scene-open][data-v4-period="multi_round"]');
  await cards.first().waitFor();assert.equal(await cards.count(),2);
  await cards.first().click();
  const dialog=page.locator('#quantitySceneDialog');
  await dialog.getByRole('heading',{name:'配置1 人及以上 · 1 轮',exact:true}).waitFor();
  assert.match(await dialog.locator('.olf-scene-heading > span').innerText(),/家参与门店/);
  await page.screenshot({path:dir+'/first.png'});
  await page.locator('[data-quantity-scene-next]').click();
  await dialog.getByRole('heading',{name:'配置1 人及以上 · 2–4 轮',exact:true}).waitFor();
  assert.match(await dialog.locator('.olf-scene-position').innerText(),/2 \/ 2/);
  await page.screenshot({path:dir+'/next.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS Chrome first/next scene dynamic heading, participant subtitle and scenario position');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
