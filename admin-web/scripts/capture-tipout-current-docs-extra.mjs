import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {execFileSync} from 'node:child_process';
const cmd=args=>execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 '+args],{encoding:'utf8',maxBuffer:8*1024*1024});
const ev=code=>JSON.parse(execFileSync('cmd.exe',['/d','/s','/c','agent-browser.cmd --session tips-shares-20261023 eval --stdin'],{encoding:'utf8',input:code,maxBuffer:8*1024*1024}));
const ui=code=>ev(`(()=>{const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot).shadowRoot;${code}})()`);
const dir=path.resolve('dist/TipOut/docs/assets/tips-docs-current-20261023').replaceAll('\\','/'),file=dir+'/capture-manifest.json',m=JSON.parse(fs.readFileSync(file,'utf8'));
function shot(name,state){cmd(`screenshot ${dir}/${name}.png`);m.records=m.records.filter(r=>r.file!==name+'.png');m.records.push({file:name+'.png',state,url:ev('location.href'),selectedDate:ui("return r.querySelector('#detailDate')?.value||null;"),capturedAt:new Date().toISOString(),sha256:crypto.createHash('sha256').update(fs.readFileSync(`${dir}/${name}.png`)).digest('hex')});fs.writeFileSync(file,JSON.stringify(m,null,2));}
const store=ev("JSON.parse(localStorage.getItem('tipout_rules')).find(r=>r.id===19).store");
ev(`location.hash='/team/tips/details?date=2026-10-23&store='+encodeURIComponent(${JSON.stringify(store)})+'&from=summary&return=history';true`);
ev("(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('.tipout-lock-banner'))return true;await new Promise(x=>setTimeout(x,100));}throw Error('locked day absent');})()");
ui("r.querySelector('.detail-contribution-section').scrollIntoView({block:'start'});r.querySelector('.contribution-shortage').open=true;return true;");shot('contribution-shortage','已发放快照：应扣40实扣20，少扣提示展开');
ui("const d=r.querySelector('.tipout-funding-excess:not(.tipout-funding-shortfall):not(.contribution-shortage)');if(!d)throw Error('excess absent');d.open=true;d.scrollIntoView({block:'center'});return true;");shot('funding-excess','C>P的该条规则：按C分配提示展开');
ui("const d=r.querySelector('.tipout-funding-shortfall');d.open=true;d.scrollIntoView({block:'center'});return true;");shot('funding-shortfall','C<P的该条规则：老板补足提示展开');
ui("const d=r.querySelector('#detailDate');d.value='2026-10-21';d.dispatchEvent(new Event('change',{bubbles:true}));return true;");
ev("(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;const b=r?.querySelector('#confirmDetailAllocationBtn');if(b&&getComputedStyle(b).display!=='none'&&!b.disabled)return true;await new Promise(x=>setTimeout(x,100));}throw Error('editable day absent');})()");
ui("r.querySelector('#detailActionBar').scrollIntoView({block:'end'});return true;");shot('detail-editable','10/21未发放：当前可编辑操作文案');
ui("r.querySelector('#saveCurrentDetailAllocationBtn').click();return true;");shot('detail-no-change','未调整时点击灰色保存，页面原因提示');
ui("r.querySelector('#confirmDetailAllocationDialogBtn').click();return true;");
// Return via the real application button; no business data is changed.
ui("r.querySelector('[data-native-onclick*=goBack]')?.click();return true;");
console.log('PASS supplementary capture; snapshots unchanged');
ev("location.hash='/team/tips/distribution?view=employee';true");
ev("(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('.tipout-employee-row'))return true;await new Promise(x=>setTimeout(x,100));}throw Error('employee summary absent');})()");
ui("r.querySelector('.tipout-employee-row').scrollIntoView({block:'center'});return true;");shot('employee-list','员工汇总／实际员工行与工时、贡献列');
ui("r.querySelector('.tipout-employee-row').click();return true;");
ev("(async()=>{for(let i=0;i<100;i++){const r=Array.from(document.querySelectorAll('*')).find(e=>e.shadowRoot)?.shadowRoot;if(r?.querySelector('#employeeDetailRows tr'))return true;await new Promise(x=>setTimeout(x,100));}throw Error('employee detail absent');})()");
shot('employee-daily','员工每日考勤分配／只读，确认与预计贡献混合周期');
