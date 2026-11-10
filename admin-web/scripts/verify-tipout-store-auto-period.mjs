import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const read = file => fs.readFileSync(`src/team/tips/${file}`, 'utf8');
function fixture(rows = []) {
  const nodes = new Map(), cleanups = [], timers = new Map(), saved = new Map();
  let active = true, nextTimer = 0, calls = [], renders = 0, fail = false, gate;
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', hidden: true, inert: false, disabled: false, dataset: {}, style: {}, isConnected: true,
      setAttribute(key, value) { this[key] = value; }, classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null,
      querySelectorAll: () => [], focus() { ctx.document.activeElement = this; }, textContent: '', innerHTML: '' });
    return nodes.get(id);
  }
  const ctx = { URLSearchParams, sessionStorage: { getItem: () => null, setItem() {} }, document: { getElementById: node, addEventListener() {}, activeElement: null },
    window: { location: { search: '?screen=store' }, tipoutIsPageActive: () => active, registerTipOutCleanup: fn => cleanups.push(fn),
      setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); } },
  };
  ctx.document.body = node('body');
  vm.createContext(ctx);
  for (const file of ['legacy/tipout-auto-allocation.js.txt', 'legacy/tipout-dashboard-model.js.txt', 'programs/summary-auto-allocation.js.txt', 'programs/store-summary-auto-allocation.js.txt']) vm.runInContext(read(file), ctx);
  Object.assign(ctx, { validateSummaryDateRange: () => true, dashboardAllowedStores: () => [{ store: 'A', label: '门店A' }, { store: 'B', label: '门店B' }],
    dashboardScopeKey: () => ['scope', node('dateStart').value, node('dateEnd').value].join('/'),
    getRulesForCurrentStore: () => [{}], readAllocationScopeRows: scope => rows.filter(r => r.dateKey >= scope.startDate && r.dateKey <= scope.endDate),
    TipOutDateState: { inspect: (store, date) => saved.get(`${store}/${date}`) || {} },
    TipOutAllocationResults: { isAllocated: (store, date) => !!saved.get(`${store}/${date}`)?.snapshot },
    invalidateDayPipelineCache() {}, renderSummaryViews() { renders++; }, syncStoreSummaryHeader() {},
    escapeSummaryHtml: value => String(value).replaceAll('<', '&lt;'), showNotification(message) { throw Error(message); },
  });
  ctx.executeSummaryAutoDate = async (date, item) => {
    calls.push([item.store, date]); if (gate) await gate;
    ctx.assertSummaryAutoActive();
    const existing = ctx.summaryAutoExisting(item.store, date); if (existing) return existing;
    if (fail && date.endsWith('02')) throw Error('日期来源异常');
    saved.set(`${item.store}/${date}`, { snapshot: { allocationSource: 'system' } });
    return { status: 'success', message: '系统分配已保存' };
  };
  node('storeSelect').value = 'A'; node('dateStart').value = '2026-11-01'; node('dateEnd').value = '2026-11-03';
  const flush = async () => { const batch = [...timers.entries()]; batch.forEach(([id]) => timers.delete(id)); batch.forEach(([, fn]) => fn()); await Promise.resolve(); await Promise.resolve(); };
  return { ctx, node, saved, calls, timers, flush, cleanups, fail(value) { fail = value; }, hold(value) { gate = value; }, leave() { active = false; }, renders: () => renders,
    async start() { const run = ctx.startStoreSummaryAutoAllocation(ctx.storeSummaryAutoRevision); await flush(); await run; } };
}
const row = (date, allocatable = true, allocated = false) => ({ dateKey: date, allocated, businessStatusResult: { allocatable } });

test('only pending eligible dates of the selected store are saved; manual and paid dates are preserved', async () => {
  const f = fixture([row('2026-11-01'), row('2026-11-02'), row('2026-11-03')]);
  const manual = { snapshot: { allocationSource: 'manual', amount: 123 } }, paid = { payoutStatus: 'paid' };
  f.saved.set('A/2026-11-01', manual); f.saved.set('A/2026-11-02', paid);
  await f.start();
  assert.deepEqual(f.calls, [['A', '2026-11-03']]); assert.equal(f.saved.get('A/2026-11-01'), manual); assert.equal(f.saved.get('A/2026-11-02'), paid);
  assert.equal(f.node('storeSummaryAutoPercent').textContent, '100%'); assert.equal(f.node('storeSummaryAutoRetry').hidden, true);
  f.ctx.closeStoreSummaryAutoAllocation(); assert.equal(f.node('storeSummaryPage').inert, false); assert.equal(f.node('storeSummaryAutoModal').hidden, true);
});

test('already allocated, closed, empty and unconfigured scopes do not open the progress UI', async () => {
  for (const rows of [[], [row('2026-11-01', false)], [row('2026-11-01', true, true)]]) {
    const f = fixture(rows); await f.start(); assert.equal(f.ctx.storeSummaryAutoOpen, false); assert.equal(f.calls.length, 0);
  }
  const f = fixture([row('2026-11-01')]); f.ctx.getRulesForCurrentStore = () => []; await f.start(); assert.equal(f.ctx.storeSummaryAutoOpen, false);
});

test('running allocation locks the background and close; completed failures retry only failed dates', async () => {
  const f = fixture([row('2026-11-01'), row('2026-11-02')]); f.fail(true);
  let release; f.hold(new Promise(resolve => { release = resolve; }));
  const run = f.ctx.startStoreSummaryAutoAllocation(0); await f.flush();
  assert.equal(f.ctx.storeSummaryAutoBusy, true); assert.equal(f.node('storeSummaryPage').inert, true); assert.equal(f.node('storeSummaryAutoClose').disabled, true);
  assert.equal(f.node('storeSummaryAutoRetry').hidden, true); f.ctx.closeStoreSummaryAutoAllocation(); assert.equal(f.ctx.storeSummaryAutoOpen, true);
  release(); await run;
  assert.equal(f.node('storeSummaryAutoState').textContent, '部分失败'); assert.equal(f.node('storeSummaryAutoRetry').hidden, false);
  assert.equal(f.node('storeSummaryAutoResults').hidden, false); assert.match(f.node('storeSummaryAutoRows').innerHTML, /日期来源异常/);
  f.fail(false); await f.ctx.retryStoreSummaryAutoAllocation();
  assert.deepEqual(f.calls, [['A', '2026-11-01'], ['A', '2026-11-02'], ['A', '2026-11-02']]);
  assert.equal(f.node('storeSummaryAutoRetry').hidden, true); assert.equal(f.node('storeSummaryAutoState').textContent, '分配完成');
});

test('concurrent allocations are retained and reported as skipped', async () => {
  const f = fixture([row('2026-11-01')]); let release; f.hold(new Promise(resolve => { release = resolve; }));
  const run = f.ctx.startStoreSummaryAutoAllocation(0); await f.flush(); const manual = { snapshot: { allocationSource: 'manual' } };
  f.saved.set('A/2026-11-01', manual); release(); await run;
  assert.equal(f.saved.get('A/2026-11-01'), manual); assert.match(f.node('storeSummaryAutoStats').innerHTML, /跳过 1 天/);
});

test('superseded preflight and inactive page cannot allocate', async () => {
  const f = fixture([row('2026-11-01')]); const run = f.ctx.startStoreSummaryAutoAllocation(0); f.ctx.storeSummaryAutoRevision++; await f.flush(); await run;
  assert.equal(f.calls.length, 0); f.leave(); await f.start(); assert.equal(f.calls.length, 0);
});

test('leaving during a date stops queued dates and blocks pending writes', async () => {
  const f = fixture([row('2026-11-01'), row('2026-11-02')]); let release; f.hold(new Promise(resolve => { release = resolve; }));
  const run = f.ctx.startStoreSummaryAutoAllocation(0); await f.flush(); f.leave(); f.cleanups.forEach(fn => fn()); release(); await run;
  assert.equal(f.saved.size, 0); assert.equal(f.calls.length, 1);
});

test('the selected store is part of the asynchronous write scope', async () => {
  const f = fixture([row('2026-11-01')]); let release; f.hold(new Promise(resolve => { release = resolve; }));
  const run = f.ctx.startStoreSummaryAutoAllocation(0); await f.flush(); f.node('storeSelect').value = 'B'; release(); await run;
  assert.equal(f.saved.size, 0);
});

test('rapid date changes debounce to the latest store range', async () => {
  const f = fixture([row('2026-11-01'), row('2026-11-02')]);
  f.ctx.scheduleSummaryAutoAllocation(); f.node('dateStart').value = '2026-11-02'; f.ctx.scheduleSummaryAutoAllocation();
  assert.equal(f.timers.size, 1); await f.flush(); await f.flush();
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.deepEqual(f.calls, [['A', '2026-11-02']]);
});
