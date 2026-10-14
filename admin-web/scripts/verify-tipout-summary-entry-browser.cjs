const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const { chromium } = process.env.TIPOUT_BROWSER_PACKAGES ? createRequire(path.join(process.env.TIPOUT_BROWSER_PACKAGES,'package.json'))('playwright') : require('playwright');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const page = await browser.newPage();
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(process.env.TIPOUT_PREVIEW_URL || 'http://127.0.0.1:65022/');
    const measurements = await page.evaluate(async () => {
      const {mountTipsPage} = await import('/src/team/tips-page.ts');
      const store='上海陆家嘴店';
      localStorage.clear();
      history.replaceState(null,'','#/team/tips/distribution');
      localStorage.setItem('tipout-employees-roster-v1',JSON.stringify(Array.from({length:60},(_,i)=>({id:'perf-'+i,name:'Perf '+i,role:['Server','Bartender','Busser','Runner','Host','Cashier'][i%6],store,active:true}))));
      document.body.innerHTML='<main data-team-tips-scroll><div id="perf-host"></div></main>';
      const host=document.getElementById('perf-host');
      const scope={storeId:store,storeLabel:store,storeLabelEn:store,isAllStores:false,usesInPageStorePicker:true,stores:[{id:store,labelZh:store,labelEn:store}]};
      const context={getScope:()=>scope,setStoreScope:()=>{},subscribeScopeChange:()=>()=>{},navigate:()=>{},replace:()=>{},getNavigationState:()=>null,getScrollOwner:()=>null};
      let rosterReads=0;
      const read=Storage.prototype.getItem;
      Storage.prototype.getItem=function(key){if(key==='tipout-employees-roster-v1')rosterReads++;return read.call(this,key);};
      const started=performance.now();
      try {window.perfRuntime=mountTipsPage(host,{view:'distribution',query:'',href:'/team/tips/distribution'},context);}
      finally {Storage.prototype.getItem=read;}
      const initialMs=performance.now()-started;
      return {initialMs:Math.round(initialMs),rosterReads,rows:host.shadowRoot.querySelectorAll('#dailySummaryList tr').length};
    });
    assert.ok(measurements.rows>=28,'renders the month date summary');
    assert.ok(measurements.rosterReads<500,'entry does not reread the full roster for every employee/date');
    const firstAmounts=await page.locator('#dailySummaryList').innerText();
    await page.locator('#employeeReconciliationTab').click();
    await page.locator('#employeeReconciliationList tr').first().waitFor();
    await page.locator('#dateTaskTab').click();
    assert.equal(await page.locator('#dailySummaryList').innerText(),firstAmounts,'switching back preserves date results');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify(measurements));
    console.log('Browser entry and date/employee summary consistency passed');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
