const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const base=process.env.BRAND_PREVIEW_URL || 'http://127.0.0.1:5314',dir='output/playwright/buffet-list-fields';
 fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/Configuration%20center/buffet-rule.html');
  await page.evaluate(()=>{
   const p=window.ORDER_LIMIT_MODULE_PROFILE;
   p.repository.saveRules([{id:99001,status:'disabled',name:'渠道验收',authoringConfig:{name:'渠道验收',buffetTemplateId:'party-round-basic',subject:'party_size',enabledPeriods:['per_round'],targetType:'dish_set',participatingStoreIds:['ny-midtown','flushing'],deployStoreIds:['ny-midtown'],partyRanges:[{min:1,max:null}],storeConfigs:{'ny-midtown':{dishSetMembers:[{productLineId:'kiosk',dishId:'a'}]},flushing:{dishSetMembers:[{productLineId:'emenu',dishId:'b'}]}}}}]);
   localStorage.setItem(p.storage.listColumnsKey,JSON.stringify({version:2,visible:['name','strategy','productScope','period','partyRanges','roundRanges','status','actions']}));
  });
  await page.reload();
  const row=page.getByRole('row').filter({hasText:'渠道验收'});
  await row.waitFor();
  await row.getByText('每人＋每轮限购 · 按人数限购 · 每轮 · 按菜品集限购',{exact:true}).waitFor();
  await row.getByText('Kiosk、eMenu',{exact:true}).waitFor();
  await page.getByRole('columnheader',{name:'渠道',exact:true}).first().waitFor();
  for(const name of ['人数区间','轮次区间','限购周期'])assert.equal(await page.getByRole('columnheader',{name,exact:true}).count(),0);
  await page.getByRole('button',{name:'字段设置',exact:true}).click();
  await page.getByRole('button',{name:'恢复默认',exact:true}).click();
  await page.getByRole('button',{name:'确认',exact:true}).click();
  await page.locator('#filterKeyword').fill('渠道验收');
  await row.waitFor();
  await page.screenshot({path:dir+'/strategy-channels.png'});
  await page.getByRole('button',{name:'字段设置',exact:true}).click();
  assert.equal(await page.locator('#columnPanel input[data-column]').count(),9);
  assert.equal(await page.locator('#columnPanel input[data-column="period"],#columnPanel input[data-column="partyRanges"],#columnPanel input[data-column="roundRanges"]').count(),0);
  await page.screenshot({path:dir+'/fields.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS Chrome strategy four parts, all-store channels, nine fields and old preference filtering');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
