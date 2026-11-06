// Use a fresh, signed-in, isolated agent-browser session. Never clears business storage.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const executable = process.env.TIPOUT_BROWSER_BIN || 'agent-browser';
const session = process.env.TIPOUT_BROWSER_SESSION || 'tipout-page-lifecycle';
const base = process.env.TIPOUT_BROWSER_URL || 'http://127.0.0.1:5173';
const evidence = process.env.TIPOUT_EVIDENCE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'tipout-lifecycle-'));
fs.mkdirSync(evidence, { recursive: true });
let call = 0;
function cli(...args) {
  const out = path.join(evidence, `cli-${++call}.out`), err = out + '.err';
  const stdout = fs.openSync(out, 'w'), stderr = fs.openSync(err, 'w');
  try { execFileSync(executable, ['--session', session, ...args], { stdio: ['ignore', stdout, stderr], timeout: 35000 }); }
  catch (error) { throw Error(fs.readFileSync(err, 'utf8') || error.message); }
  finally { fs.closeSync(stdout); fs.closeSync(stderr); }
  return fs.readFileSync(out, 'utf8');
}
const evaluate = source => JSON.parse(cli('eval', '-b', Buffer.from(source).toString('base64')));
const root = "document.querySelector('[data-team-tips-root]')?.shadowRoot";
const wait = source => evaluate(`(async()=>{for(let i=0;i<180;i++){if(${source})return true;await new Promise(r=>setTimeout(r,100));}throw Error('Page condition timed out');})()`);
function openOrdersNavigation() {
  for (let level = 0; level < 8; level++) {
    const action = evaluate(`(()=>{
      const orders=document.getElementById('orders-secondary-sheet');
      if(orders&&orders.getAttribute('aria-hidden')==='false'&&!orders.inert)return 'ready';
      const visible=button=>{const b=button.getBoundingClientRect();return b.width>0&&b.x>=0&&b.right<=innerWidth&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('button')===button;};
      const buttons=Array.from(document.querySelectorAll('aside button'));
      const back=buttons.find(b=>/返回/.test(b.getAttribute('aria-label')||'')&&visible(b));
      const target=back||buttons.find(b=>b.dataset.navModuleSheetSidebarOpen==='orders'&&visible(b));
      if(!target)throw Error('Visible navigation control missing');
      target.dataset.tipoutLifecycleNavigation='';return 'click';
    })()`);
    if (action === 'ready') return;
    cli('click', '[data-tipout-lifecycle-navigation]');
    evaluate('(async()=>{await new Promise(r=>setTimeout(r,180));return true;})()');
  }
  throw Error('Orders navigation did not open');
}

cli('open', `${base}/#/team/tips/distribution`);
cli('reload'); // Reset only this isolated session's prior test hooks.
wait(`${root}?.querySelector('#allocationDashboard')?.getAttribute('aria-busy')==='false'`);
evaluate(`(()=>{
  window.__lifecycleHost=document.querySelector('[data-team-tips-root]');
  window.__lifecycleChecks=0;
  const original=window.setTimeout.bind(window);
  window.setTimeout=function(fn,delay,...args){if(delay===20)window.__lifecycleChecks++;return original(fn,delay,...args);};
  return true;
})()`);
openOrdersNavigation();
const navigation = evaluate(`(async()=>{await new Promise(r=>setTimeout(r,600));return {
  sameHost:window.__lifecycleHost===document.querySelector('[data-team-tips-root]'),
  checks:window.__lifecycleChecks,
  path:location.hash,
  ordersOpen:document.getElementById('orders-secondary-sheet')?.getAttribute('aria-hidden')==='false'
};})()`);
assert.equal(navigation.sameHost, true);
assert.equal(navigation.checks, 0);
assert.equal(navigation.ordersOpen, true);
assert.equal(navigation.path, '#/team/tips/distribution');
cli('set', 'viewport', '1440', '1000');
cli('screenshot', path.join(evidence, 'navigation-keeps-dashboard.png'));

evaluate(`(()=>{
  window.__lifecycleLockRequests=0;window.__lifecycleWrites=0;
  window.__lifecycleOriginalLock=navigator.locks.request.bind(navigator.locks);
  navigator.locks.request=function(name,options,callback){
    if(!String(name).startsWith('tipout-date-write:'))return window.__lifecycleOriginalLock(name,options,callback);
    window.__lifecycleLockRequests++;
    if(!window.__lifecycleHeld)return new Promise((resolve,reject)=>{
      window.__lifecycleHeld=name;
      window.__lifecycleRelease=()=>window.__lifecycleOriginalLock(name,options,callback).then(resolve,reject);
    });
    return window.__lifecycleOriginalLock(name,options,callback);
  };
  const original=Storage.prototype.setItem;
  window.__lifecycleOriginalSetItem=original;
  Storage.prototype.setItem=function(key,value){if(this===localStorage&&['tipout_allocation_results_v1','tipout_allocated'].includes(key))window.__lifecycleWrites++;return original.call(this,key,value);};
  ${root}.querySelector('#dashboardFilters [data-date-preset="last-week"]').click();
  return true;
})()`);
wait('!!window.__lifecycleHeld');
const pending = evaluate(`(()=>({
  before:[localStorage.getItem('tipout_allocation_results_v1'),localStorage.getItem('tipout_allocated')],
  start:${root}.querySelector('#dateStart').value,
  end:${root}.querySelector('#dateEnd').value,
  requests:window.__lifecycleLockRequests
}))()`);
assert.equal(pending.requests, 1);
openOrdersNavigation();
cli('snapshot', '-i');
evaluate(`(()=>{const link=Array.from(document.querySelectorAll('a[href="#/orders/settings"]')).find(a=>{
  const box=a.getBoundingClientRect();
  return !a.closest('[inert],[aria-hidden="true"]')&&box.width>0&&box.x>=0&&box.right<=innerWidth;
});if(!link)throw Error('Visible orders navigation link missing');link.dataset.tipoutLifecycleLeave='';return true;})()`);
cli('click', '[data-tipout-lifecycle-leave]');
wait("location.hash.startsWith('#/orders/')");
evaluate('window.__lifecycleRelease();true');
const left = evaluate(`(async()=>{await new Promise(r=>setTimeout(r,900));return {
  path:location.hash,hostPresent:!!document.querySelector('[data-team-tips-root]'),
  requests:window.__lifecycleLockRequests,writes:window.__lifecycleWrites,
  after:[localStorage.getItem('tipout_allocation_results_v1'),localStorage.getItem('tipout_allocated')]
};})()`);
assert.equal(left.hostPresent, false);
assert.match(left.path, /^#\/orders\//);
assert.equal(left.requests, 1, 'no next date may request a lock after leaving');
assert.equal(left.writes, 0, 'a delayed allocation may not save after leaving');
assert.deepEqual(left.after, pending.before, 'existing allocation results are preserved');
cli('screenshot', path.join(evidence, 'orders-after-leave.png'));
evaluate(`navigator.locks.request=window.__lifecycleOriginalLock;Storage.prototype.setItem=window.__lifecycleOriginalSetItem;true`);

cli('open', `${base}/#/team/tips/distribution?startDate=${pending.start}&endDate=${pending.end}&datePreset=last-week`);
wait(`${root}?.querySelector('#allocationDashboard')?.getAttribute('aria-busy')==='false'`);
const resumed = evaluate(`(()=>({tasks:${root}.querySelectorAll('#dashboardTaskRows tr').length,
  results:localStorage.getItem('tipout_allocation_results_v1'),
  start:${root}.querySelector('#dateStart').value,end:${root}.querySelector('#dateEnd').value}))()`);
assert.equal(resumed.start, pending.start);
assert.equal(resumed.end, pending.end);
assert.ok(resumed.tasks > 0, 're-entering the dashboard still allocates pending dates');
assert.notEqual(resumed.results, pending.before[0]);
fs.writeFileSync(path.join(evidence, 'browser-result.json'), JSON.stringify({ navigation, left: { ...left, after: undefined, savedResultsUnchanged: true }, resumed: { ...resumed, results: undefined } }, null, 2));
console.log('PASS browser: navigation retains dashboard with no new checks; leaving cancels held allocation without writes or later dates; re-entry still allocates pending dates.');
