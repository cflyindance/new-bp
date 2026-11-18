// Run in an isolated demo browser profile against a running admin-web preview.
// playwright-cli open http://127.0.0.1:<port>/ --headed
// playwright-cli run-code --filename scripts/verify-interval-product-occupancy-browser.js
// This fixture changes demo rules in its isolated browser, never production data.
async(page)=>{
 const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
 const base=new URL('/',page.url()).href;
 await page.setViewportSize({width:1440,height:1050});await page.goto(base);await page.waitForTimeout(900);
 if(await page.getByRole('button',{name:'登录',exact:true}).count())await page.getByRole('button',{name:'登录',exact:true}).click();await page.waitForTimeout(700);
 if(page.url().includes('onboarding')){await page.getByRole('button',{name:'下一步',exact:true}).click();await page.getByRole('button',{name:'下一步',exact:true}).click();await page.getByRole('button',{name:'进入系统',exact:true}).click();}
 await page.goto(base+'#/operations/queue-call/menu-order-limits/other/interval');await page.waitForTimeout(1000);
 const fixture=await page.evaluate(async()=>{
  const p=await import('/src/config/brand-menu-structure-picker-ui.ts');const f=await import('/src/config/module-settings-form-ui.ts');
  const g=p.BRAND_MENU_STRUCTURE_BY_LINE.kiosk[0],c=g.categories[0],x=c.dishes[0];
  const drink=p.BRAND_MENU_STRUCTURE_BY_LINE.kiosk.find(g=>g.id==='g-drink');const tea=drink.categories[0].dishes[0];const teaKey=p.dishKey(drink.id,drink.categories[0].id,tea.id);
  const make=(line,key)=>({...p.emptyBrandMenuStructureByLine(),[line]:[key]});const xKey=p.dishKey(g.id,c.id,x.id);
  localStorage.setItem(f.moduleSettingStorageKey('590-menu-order-interval-rules'),JSON.stringify([{id:'r1',intervalSeconds:300,structureByLine:make('kiosk',xKey)},{id:'r2',intervalSeconds:180,structureByLine:make('kiosk',teaKey)}]));
  return {xKey,xName:x.name.replace(/（.*）/,''),teaKey,teaName:tea.name.replace(/（.*）/,''),groupKey:p.groupKey(g.id)};
 });
 await page.reload();await page.waitForTimeout(1000);await page.locator('[data-order-interval-scene="product"]').click();
 const dialog=page.locator('[data-menu-order-interval-dialog]:visible');
 const add=()=>page.getByRole('button',{name:'新增规则',exact:true}).click();
 const read=()=>page.evaluate(async()=> (await import('/src/config/module-settings-guest-menu-order-interval-ui.ts')).readGuestMenuOrderIntervalRules());
 await add();
 assert(await dialog.locator(`[data-brand-menu-enable="${fixture.xKey}"]`).count()===0,'Occupied leaf filtered');
 assert(await dialog.locator('[data-brand-menu-col="dish"] input').count()===2,'Category candidates filtered');
 await dialog.locator('[data-brand-menu-search]').fill(fixture.xName);
 assert((await dialog.innerText()).includes('没有匹配的商品'),'Search excludes occupied');
 await dialog.locator('[data-brand-menu-search]').fill('');
 await dialog.locator(`[data-brand-menu-enable="${fixture.groupKey}"]`).check();
 const category=dialog.locator('[data-brand-menu-col="category"] input').first();
 await category.uncheck();
 assert(await dialog.locator(`[data-brand-menu-enable="${fixture.groupKey}"]`).evaluate(el=>el.indeterminate),'Group half-selection remains correct');
 await category.check();
 const selected=await dialog.locator('[data-brand-menu-structure-by-line]').inputValue();
 const projected=await page.evaluate(async raw=>(await import('/src/config/brand-menu-structure-picker-ui.ts')).selectedBrandMenuDishesByLine(JSON.parse(raw)),selected);
 assert(projected.length===8 && !projected.some(d=>d.dishName.includes(fixture.xName)),'Group selection excludes occupied leaves');
 await dialog.locator('[data-brand-menu-line-select="emenu"]').click();
 await dialog.locator('[data-brand-menu-search]').fill(fixture.teaName);
 assert(await dialog.locator('[data-brand-menu-search-results] input').count()>0,'Same product on different line available');
 await dialog.locator('[data-brand-menu-search-results] input').first().check();
 await dialog.locator('[data-brand-menu-line-select="kiosk"]').click();
 await dialog.locator('[data-brand-menu-search]').fill('');
 assert((await dialog.innerText()).includes('已选 9 个商品'),'Across line state preserved');
 await page.screenshot({path:'D:/Dev/Temp/Codex/interval-product-occupancy/filtered.png',fullPage:true});
 await dialog.getByRole('button',{name:'确认',exact:true}).click();assert((await read()).length===3,'New rule added to draft');
 await page.locator('[data-rule-id="r1"] [data-menu-order-interval-edit]').click();
 assert(await dialog.locator(`[data-brand-menu-enable="${fixture.xKey}"]`).isChecked(),'Editing retains own occupied leaf');
 const before=JSON.stringify(await read());await page.keyboard.press('Escape');assert(JSON.stringify(await read())===before,'Cancel preserves original rule');
 // Introduce a competing rule after opening; save must re-read current occupancy.
 await add();await dialog.locator('[data-brand-menu-col="dish"] input').first().check();
 const pending=JSON.parse(await dialog.locator('[data-brand-menu-structure-by-line]').inputValue());
 await page.evaluate(async value=>{const m=await import('/src/config/module-settings-guest-menu-order-interval-ui.ts');m.writeGuestMenuOrderIntervalRules([...m.readGuestMenuOrderIntervalRules(),{id:'r-stale',intervalSeconds:600,structureByLine:value}]);},pending);
 const count=(await read()).length;await dialog.getByRole('button',{name:'确认',exact:true}).click();
 assert(await dialog.locator('[data-menu-order-interval-conflict]').isVisible(),'Conflict blocks confirmation');
 assert(!(await dialog.locator('[data-menu-order-interval-conflict]').innerText()).includes('（Kiosk）（Kiosk）'),'No repeated product line label');
 assert((await read()).length===count,'Conflict does not add or overwrite draft');
 assert(JSON.stringify(JSON.parse(await dialog.locator('[data-brand-menu-structure-by-line]').inputValue()))===JSON.stringify(pending),'Conflict preserves pending selection');
 await page.screenshot({path:'D:/Dev/Temp/Codex/interval-product-occupancy/conflict.png',fullPage:true});
 await page.evaluate(async()=>{const m=await import('/src/config/module-settings-guest-menu-order-interval-ui.ts');m.writeGuestMenuOrderIntervalRules(m.readGuestMenuOrderIntervalRules().filter(r=>r.id!=='r-stale'));});
 await dialog.getByRole('button',{name:'确认',exact:true}).click();assert(await dialog.count()===0,'Resolved conflict can confirm');
 const generic=await page.evaluate(async key=>{const p=await import('/src/config/brand-menu-structure-picker-ui.ts');const host=document.createElement('div');host.innerHTML=p.renderBrandMenuStructurePickerHtml([],undefined,undefined,{enableLines:true});return !!host.querySelector(`[data-brand-menu-enable="${key}"]`);},fixture.xKey);assert(generic,'Unrelated picker not filtered');
 await page.getByRole('button',{name:'保存设置',exact:true}).click();await page.getByRole('button',{name:'确认下发',exact:true}).click();await page.waitForTimeout(700);await page.reload();await page.waitForTimeout(1000);await page.locator('[data-order-interval-scene="product"]').click();
 assert((await read()).length===4,'Rules persist after save and reload');
 await add();assert(await dialog.locator(`[data-brand-menu-enable="${fixture.xKey}"]`).count()===0,'Filtering persists after reload');await page.keyboard.press('Escape');
 // Historical overlap remains visible when editing, but cannot be silently confirmed.
 await page.evaluate(async value=>{const m=await import('/src/config/module-settings-guest-menu-order-interval-ui.ts');m.writeGuestMenuOrderIntervalRules([...m.readGuestMenuOrderIntervalRules(),{id:'legacy-overlap',intervalSeconds:120,structureByLine:{kiosk:[value],emenu:[],sdi:[]}}]);},fixture.xKey);
 await page.locator('[data-rule-id="r1"] [data-menu-order-interval-edit]').click();
 assert(await dialog.locator(`[data-brand-menu-enable="${fixture.xKey}"]`).isChecked(),'Historical overlap retained visibly');
 await dialog.getByRole('button',{name:'确认',exact:true}).click();
 assert(await dialog.locator('[data-menu-order-interval-conflict]').isVisible(),'Historical overlap blocked');
 await page.keyboard.press('Escape');
 // Fully occupied line: no group or search path back into occupied leaves.
 await page.evaluate(async()=>{const p=await import('/src/config/brand-menu-structure-picker-ui.ts');const m=await import('/src/config/module-settings-guest-menu-order-interval-ui.ts');const all={...p.emptyBrandMenuStructureByLine(),kiosk:p.BRAND_MENU_STRUCTURE_BY_LINE.kiosk.flatMap(g=>g.categories.flatMap(c=>c.dishes.map(d=>p.dishKey(g.id,c.id,d.id))))};m.writeGuestMenuOrderIntervalRules([{id:'all',intervalSeconds:300,structureByLine:all}]);});
 await add();assert((await dialog.innerText()).includes('当前产线商品均已被其他规则使用'),'All occupied empty state');assert(await dialog.locator('[data-brand-menu-col="group"] input').count()===0,'Empty group cannot batch select');
 await page.screenshot({path:'D:/Dev/Temp/Codex/interval-product-occupancy/all-occupied.png',fullPage:true});await page.keyboard.press('Escape');
 console.log('PASS leaf/group/search filtering, line isolation, editing own rule, cancel, stale conflict recheck, save/reload and unfiltered caller regression');
}
