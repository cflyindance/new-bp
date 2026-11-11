import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const path='src/team/tips/tips-dashboard-assets.ts';
assert.ok(fs.existsSync(path),'Dashboard SVGs must be bundled instead of depending on public deployment copies');
let source=fs.readFileSync(path,'utf8').replace(/import (\w+) from "(.+?)\?raw";/g,(_,name,file)=>'const '+name+'='+JSON.stringify(fs.readFileSync('src/team/tips/'+file.replace('./',''),'utf8'))+';');
source=source.replace('export const tipoutDashboardAssets: Record<string, string> =','const tipoutDashboardAssets =');
const icons=vm.runInNewContext(source+';tipoutDashboardAssets',{encodeURIComponent});
for(const name of ['arrow-left','store','refresh-cw','calendar-days','users']) {
 assert.match(icons[name+'.svg'],/^data:image\/svg\+xml,/);
 assert.match(decodeURIComponent(icons[name+'.svg'].split(',')[1]),/<svg/);
}
const runtime=fs.readFileSync('src/team/tips/tips-legacy-runtime.ts','utf8');
assert.match(runtime,/tipoutDashboardAssets,/);
const program=fs.readFileSync('src/team/tips/programs/summary-auto-allocation.js.txt','utf8');
assert.match(program,/dashboardAssetUrl\(img.dataset.dashboardAsset\)/);
const template=fs.readFileSync('src/team/tips/tips-templates.ts','utf8');
const expression=template.match(/return (html\.replace[^;]+);/)[1];
assert.match(vm.runInNewContext(expression,{html:'<img src="/tipout/dashboard/store.svg">',tipoutDashboardAssets:icons}),/src="data:image\/svg/);
console.log('PASS bundled SVGs do not depend on host, deployment prefix, or public file copies');
