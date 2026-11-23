async (page) => {
 const dir='docs/验证记录/images/employee-account-opening-20261123/';const d=()=>page.locator('dialog').last();const shot=async(name)=>page.screenshot({path:dir+name+'.png',fullPage:true});
 const assert=(v,m)=>{if(!v)throw Error(m);};
 for(const platform of ['m','b']){
  const isM=platform==='m';
  await page.evaluate(async(isM)=>{const shell=await import('/src/shell/app-shell-mode.ts');if(isM)shell.enterMPlatformShell();else shell.exitMPlatformShell();},isM);
  const base=isM?'http://127.0.0.1:5487/#/m-platform/permissions/staff':'http://127.0.0.1:5487/#/permissions/staff';await page.goto(base);
  const before=await page.evaluate(()=>JSON.stringify(localStorage));await page.getByRole('button',{name:'新增员工账号',exact:true}).click();await d().getByRole('button',{name:'关闭',exact:true}).click();assert(await page.evaluate(()=>JSON.stringify(localStorage))===before,'cancel wrote storage');await shot(platform+'-10-cancel');
  const email=`lifecycle-${platform}-${Date.now()}@menusifu.cn`;
  await page.getByRole('button',{name:'新增员工账号',exact:true}).click();await d().locator(isM?'[name=employeeName]':'[name=name]').fill('邀请生命周期验收');await d().locator('[name=email]').fill(email);if(isM)await d().locator('[name=employeeId]').fill(email.split('@')[0]);await d().locator('[type=submit]').click();
  const row=()=>page.getByRole('row').filter({hasText:email});
  if(!isM){await row().getByRole('link',{name:'管理详情'}).click();await page.getByRole('button',{name:'登录与安全',exact:true}).click();}
  const action=(name)=>isM?row().getByRole('button',{name,exact:true}):page.getByRole('button',{name,exact:true});
  await action('撤销邀请').click();await shot(platform+'-11-revoke-confirm');await d().locator('[type=submit]').click();await shot(platform+'-12-revoked');
  if(isM){await action('演示接受邀请').click();await d().locator('[name=password]').fill('DemoPassword123');await d().locator('[name=confirmPassword]').fill('DemoPassword123');await d().locator('[type=submit]').click();assert((await d().innerText()).includes('撤销'),'revoked acceptance allowed');await shot(platform+'-13-revoked-error');await d().getByRole('button',{name:'取消',exact:true}).click();}
  await action('重发演示邀请').click();await shot(platform+'-14-resend-confirm');await d().locator('[type=submit]').click();await shot(platform+'-15-resent');
  await page.evaluate(async({email,isM})=>{const a=await import(isM?'/src/permissions/enterprise-staff-account-store.ts':'/src/permissions/staff-account-store.ts');const row=a.getStaffLoginAccountByEmail(email);a.updateStaffLoginAccount(row.id,{invitation:{sentAt:new Date(0).toISOString(),expiresAt:new Date(0).toISOString()}});},{email,isM});await page.reload();if(!isM)await page.getByRole('button',{name:'登录与安全',exact:true}).click();await shot(platform+'-16-expired');
  await action('演示接受邀请').click();await d().locator('[name=password]').fill('DemoPassword123');await d().locator('[name=confirmPassword]').fill('DemoPassword123');await d().locator('[type=submit]').click();assert((await d().innerText()).includes('过期'),'expired invitation accepted');await shot(platform+'-17-expired-error');await d().getByRole('button',{name:'取消',exact:true}).click();
 }
 console.log('PASS M/B cancel no-write, revoke, resend, expiry and acceptance rejection in browser');
}
