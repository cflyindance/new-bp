async (page) => {
  const base='http://127.0.0.1:61438',path='/#/m-platform/permissions/merchant-subscriptions';
  const dir='docs/verification/subscription-entitlement-actions-20261030';
  const check=(value,message)=>{if(!value)throw Error(message);};
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+path);
  await page.locator('[data-login-form], [data-subscription-service-page]').first().waitFor();
  if(page.url().includes('/login')){await page.getByRole('button',{name:'登录',exact:true}).click();await page.waitForURL(url=>!url.hash.includes('/login'));await page.goto(base+path);}
  await page.locator('[data-subscription-service-page]').waitFor();
  await page.evaluate(async()=>{await (await import('/src/config/subscription-published-menu-tree.ts')).ensurePublishedSubscriptionMenuTree();(await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot();});
  await page.reload();await page.setViewportSize({width:1600,height:1100});
  const gift='ent-demo-merchant-zhangji-loyalty-gift-active',paid='ent-demo-merchant-zhangji-growth-paid-active',trial='ent-demo-merchant-zhangji-marketing-trial-active',expired='ent-demo-merchant-zhangji-loyalty-paid-expired';
  const action=(id,op)=>page.locator(`[data-sub-entitlement-action="${op}"][data-subscription-id="${id}"]`);
  const read=()=>page.evaluate(async()=> (await import('/src/config/subscription-service-store.ts')).readSubscriptionServiceSnapshot());
  await action(gift,'extend').waitFor();
  check(await action(gift,'extend').innerText()==='延长赠送','gift label');
  check(await action(trial,'paid').count()===1,'trial conversion');
  check(await action(expired,'paid').innerText()==='再次开通','expired reopening');
  check(await page.locator('[data-sub-more="ent-demo-merchant-zhangji-basic-free-active"]').count()===1,'free more');
  await page.screenshot({path:dir+'/list.png'});
  const freeMore=page.locator('[data-sub-more="ent-demo-merchant-zhangji-basic-free-active"]');await freeMore.click();await page.getByRole('menuitem',{name:'查看详情',exact:true}).waitFor();await page.screenshot({path:dir+'/more.png'});await page.keyboard.press('Escape');
  const before=JSON.stringify(await read());
  await action(gift,'extend').click();let dialog=page.getByRole('dialog',{name:'延长赠送',exact:true});await dialog.waitFor();
  await page.screenshot({path:dir+'/gift-extension.png'});
  await dialog.locator('[name=value]').fill('2027-01-01T12:00');await dialog.locator('[name=reason]').fill('   ');await dialog.getByRole('button',{name:'确认延长赠送',exact:true}).click();
  check((await dialog.locator('[data-ent-error]').innerText()).includes('原因'),'whitespace reason rejected');
  check(JSON.stringify(await read())===before,'invalid request no write');
  await dialog.locator('[name=reason]').fill('验收：补充运营赠送期限');await dialog.getByRole('button',{name:'确认延长赠送',exact:true}).click();await dialog.waitFor({state:'detached'});
  let snapshot=await read();check(snapshot.audit[0].entitlementChange.reason==='验收：补充运营赠送期限','extension audit reason');
  await action(paid,'extend').click();dialog=page.getByRole('dialog',{name:'续期服务权益',exact:true});await dialog.waitFor();await page.screenshot({path:dir+'/paid-renewal.png'});await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await action(trial,'paid').click();dialog=page.getByRole('dialog',{name:/正式开通/});await dialog.waitFor();await page.screenshot({path:dir+'/trial-paid.png'});await dialog.getByRole('button',{name:'取消',exact:true}).click();
  const source=(await read()).subscriptions.find(g=>g.id===expired);
  await action(expired,'paid').click();dialog=page.getByRole('dialog',{name:/正式开通/});await dialog.waitFor();await page.screenshot({path:dir+'/expired-reopen.png'});
  await dialog.locator('[name=endAt]').fill('2027-02-01T12:00');await dialog.locator('[name=reference]').fill('隔离验收新开通依据');await dialog.getByRole('button',{name:'确认正式开通',exact:true}).click();await dialog.waitFor({state:'detached'});
  snapshot=await read();check(JSON.stringify(snapshot.subscriptions.find(g=>g.id===expired))===JSON.stringify(source),'expired source preserved');check(snapshot.subscriptions[0].id!==expired&&Date.parse(snapshot.subscriptions[0].startAt)>Date.parse(source.endAt),'new record preserves gap');
  const trigger=page.locator(`[data-sub-more="${paid}"]`);await trigger.scrollIntoViewIfNeeded();await page.waitForTimeout(200);await trigger.press('ArrowDown');await page.getByRole('menuitem',{name:'停用',exact:true}).click();dialog=page.getByRole('dialog',{name:'停用服务权益',exact:true});await dialog.waitFor();check((await dialog.innerText()).includes('实际失去'),'disable impact');await page.screenshot({path:dir+'/disable.png'});await dialog.getByRole('button',{name:'取消',exact:true}).click();
  await trigger.press('ArrowDown');await page.getByRole('menuitem',{name:'查看详情',exact:true}).click();await page.locator('#subscription-detail-title').waitFor();await page.screenshot({path:dir+'/detail.png'});await page.locator('[data-sub-modal-close]').first().click();
  await trigger.press('ArrowDown');await page.getByRole('menuitem',{name:'操作记录',exact:true}).click();await page.locator('#subscription-audit-title').waitFor();await page.screenshot({path:dir+'/audit.png'});await page.locator('[data-sub-modal-close]').first().click();
  const guarded=await page.evaluate(async()=>{
    const store=await import('/src/config/service-entitlement-store.ts');const s=await import('/src/config/subscription-service-store.ts');const snapshot=s.readSubscriptionServiceSnapshot();let count=0;
    const ids=[snapshot.subscriptions.find(g=>g.entitlementKind==='trial').id,snapshot.subscriptions.find(g=>g.entitlementKind==='free').id,'ent-demo-merchant-zhangji-loyalty-paid-expired'];
    const before=JSON.stringify(snapshot);for(const id of ids){try{store.changeServiceEntitlement(id,'extend','2028-01-01T00:00:00Z');}catch{count++;}}
    return {count,unchanged:JSON.stringify(s.readSubscriptionServiceSnapshot())===before};
  });check(guarded.count===3&&guarded.unchanged,'store type/expiry guards');
  check(errors.length===0,'page errors: '+errors.join(';'));
  await page.evaluate(async()=>{const m=await import('/src/permissions/m-platform-store.ts');const s=m.createMState();s.roles[0].grants['m:page:subscriptions']='read';localStorage.setItem(m.M_PERMISSION_STORAGE,JSON.stringify(s));});
  await page.reload();await page.locator('[data-sub-more]').first().waitFor();
  check(await page.locator('[data-sub-entitlement-action]').count()===0,'readonly must hide commercial writes');
  const readonlyBlocked=await page.evaluate(async(id)=>{try{(await import('/src/config/service-entitlement-store.ts')).changeServiceEntitlement(id,'extend','2028-01-01T00:00:00Z');return false;}catch{return true;}},paid);check(readonlyBlocked,'readonly storage guard');
  await page.locator('[data-sub-more="ent-demo-merchant-zhangji-basic-free-active"]').press('ArrowDown');await page.getByRole('menuitem',{name:'查看详情',exact:true}).click();await page.locator('#subscription-detail-title').waitFor();await page.locator('[data-sub-modal-close]').first().click();
  await page.evaluate(async()=>{const m=await import('/src/permissions/m-platform-store.ts');localStorage.removeItem(m.M_PERMISSION_STORAGE);});await page.reload();
  return 'PASS matrix, mouse more, trial conversion dialog, gift required reason/audit, paid cancel, expired new ID/gap, scoped disable, detail/audit, store guards, readonly browse and write rejection';
}
