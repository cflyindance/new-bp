import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';
const src=fs.readFileSync('src/main.ts','utf8');const start=src.indexOf('function applyDefaultDemoBrandView(');assert.ok(start>=0,'demo brand landing helper exists');
const code=src.slice(start,src.indexOf('function mountLoginShell(',start));let email='demo.menusifu.cn',restricted=false,shell='m-platform',applied=0;
const ctx={DEMO_LOGIN_ACCOUNT:'demo.menusifu.cn',getAuthenticatedEmail:()=>email,isViewSwitchRestricted:()=>restricted,writeAppShellMode:v=>shell=v,switchToBrandView:()=>{applied++;return true;}};vm.createContext(ctx);vm.runInContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText,ctx);
assert.equal(ctx.applyDefaultDemoBrandView(),true);assert.equal(shell,'merchant');assert.equal(applied,1);
email='staff@menusifu.com';shell='m-platform';assert.equal(ctx.applyDefaultDemoBrandView(),false);assert.equal(shell,'m-platform');assert.equal(applied,1);
email='demo.menusifu.cn';restricted=true;assert.equal(ctx.applyDefaultDemoBrandView(),false);assert.equal(shell,'m-platform');
assert.match(src,/if \(\["", "#", "#\/", "#\/home", "#\/home\/"\]\.includes\(location.hash\) && applyDefaultDemoBrandView\(\)\)/);
assert.match(src,/const useBrandDefault = getAuthenticatedEmail/);
console.log('PASS demo landing: demo uses brand via existing switch, real account and impersonation unchanged, root-only startup');
const docDir='docs/项目文档';
for(const name of ['演示登录产品权威需求文档.md','演示登录业务规格说明书（研发交付版）.md','演示登录需求文档（个人规范版）.md']){
const doc=fs.readFileSync(docDir+'/'+name,'utf8');assert.match(doc,/版本 v1.1 · LOGIN-BRAND-DEFAULT-20261023-01/);
for(const m of doc.matchAll(/!?\[[^\]]*\]\((\.\/[^)]+)\)/g))assert.ok(fs.existsSync(docDir+'/'+m[1]),'missing '+m[1]);
}
console.log('PASS demo entry docs: three paired v1.1, shared change ID and local assets/links');
