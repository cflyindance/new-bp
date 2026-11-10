const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const base=process.env.BRAND_PREVIEW_URL||'http://127.0.0.1:5304',dir=process.env.USAGE_SCREENSHOT_DIR||'output/playwright/subscription-read-quota';
 fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],warnings=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='warning')warnings.push(e.text());});
  await page.goto(base);
  await page.evaluate(async()=>{const a=await import('/src/auth/login.ts');a.setAuthenticated(a.DEMO_LOGIN_ACCOUNT);(await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();});
  await page.goto(base+'/#/m-platform/merchants/merchant-zhangji');
  await page.evaluate(async()=>{const entered=(await import('/src/config/enterprise-merchant-impersonate.ts')).enterStoreBackendAsImpersonator('M00000001','#/m-platform/merchants/merchant-zhangji');if(!entered)throw Error('isolated storefront fixture unavailable');});
  await page.goto(base+'/#/home');await page.locator('#nav-tree').waitFor();
  await page.evaluate(async()=>{
    await (await import('/src/config/subscription-published-menu-tree.ts')).ensurePublishedSubscriptionMenuTree();
    const s=await import('/src/config/subscription-service-store.ts');const snapshot=s.readSubscriptionServiceSnapshot();
    snapshot.entitlementDemoVersion=0;
    localStorage.setItem('menusifu:subscription-service-packages-v1',JSON.stringify(snapshot));
  });
  const before=await page.evaluate(()=>localStorage.getItem('menusifu:subscription-service-packages-v1'));
  await page.addInitScript(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='menusifu:subscription-service-packages-v1')throw new DOMException('quota injected only in isolated test','QuotaExceededError');return original.call(this,key,value);};
  });
  errors.length=0;await page.reload();await page.locator('#nav-tree').waitFor();
  const retained=await page.evaluate(async()=>{
    const s=await import('/src/config/subscription-service-store.ts'),snapshot=s.readSubscriptionServiceSnapshot();
    let explicitSaveFailed=false;try{s.writeSubscriptionServiceSnapshot(snapshot);}catch(e){explicitSaveFailed=e.name==='QuotaExceededError';}
    const domain=await import('/src/config/service-entitlement-domain.ts'),pkg=snapshot.packages.find(p=>p.commercial);
    return {explicitSaveFailed,version:snapshot.entitlementDemoVersion,denied:pkg?!domain.serviceAccess(snapshot,pkg,{brandId:'no-entitlement-test'}).usable:true,stored:localStorage.getItem('menusifu:subscription-service-packages-v1')};
  });
  assert.equal(retained.stored,before,'persisted permissions untouched');
  assert.equal(retained.version,0,'failed demo migration is not applied in memory');
  assert(retained.explicitSaveFailed);assert(retained.denied,'no permission bypass');
  await page.getByRole('button',{name:'前厅管理中心',exact:true}).click();
  await page.screenshot({path:dir+'/parent-navigation.png'});
  // Published menu documents may retain the earlier label for this same group.
  const orderRules=page.getByRole('button',{name:'下单规则',exact:true});
  await orderRules.waitFor();
  await orderRules.click();
  await page.getByRole('link',{name:'自助餐限购',exact:true}).click();
  await page.waitForURL('**/#/operations/queue-call/buffet-rules');
  await page.frameLocator('[data-foh-buffet-rules-root] iframe').getByRole('heading',{name:'自助餐限购',exact:true}).waitFor();
  await page.screenshot({path:dir+'/navigation-after-quota.png'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('menusifu:subscription-service-packages-v1')),before);
  assert.equal(errors.length,0,errors.join('\n'));
  assert.equal(warnings.filter(s=>s.includes('服务与订阅自动缓存')).length,1,'one warning, not flooding navigation');
  console.log('PASS real navigation under subscription quota: parent, child, buffet iframe; saved rights unchanged; explicit save fails; protected service denied');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
