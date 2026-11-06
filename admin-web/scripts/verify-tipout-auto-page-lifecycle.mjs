import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = fs.readFileSync('src/team/tips/programs/summary-auto-allocation.js.txt', 'utf8');
function fixture() {
  let active = true, writes = 0, prepared = 0, checks = 0;
  const timers = new Map(), cleanups = [];
  const context = {
    URLSearchParams, sessionStorage: { getItem: () => null, setItem() {} },
    document: { addEventListener() {} },
    window: {
      location: { search: '' }, tipoutIsPageActive: () => active,
      registerTipOutCleanup: fn => cleanups.push(fn),
      setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id; },
      clearTimeout(id) { timers.delete(id); },
      prepareTipoutQuickSnapshot() { prepared++; return {}; },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  Object.assign(context, {
    validateSummaryDateRange: () => true, dashboardRange: () => ({ startDate: '2026-11-02', endDate: '2026-11-03' }),
    dashboardScopeKey: () => 'scope', dashboardSetBusy: busy => { context.dashboardBusy = busy; },
    renderDashboardProgress() {}, dashboardInspectStores: async () => { checks++; },
    TipOutDashboardModel: { plan: () => [] },
    summaryAutoExisting: () => null, getRulesForCurrentStore: () => [{ clockin: 'clock' }],
    readAllocationScopeRows: () => [{ businessStatusResult: { allocatable: true } }],
    TipOutDateState: { notify() {} },
    TipOutAllocationResults: { async commit(_snapshot, options) { options.assertActive(); writes++; } },
  });
  context.document.getElementById = () => ({ value: '' });
  return { context, timers, cleanups, leave() { active = false; }, counts: () => ({ writes, prepared, checks }) };
}

test('leaving the page prevents new automatic allocation scheduling', () => {
  const f = fixture(); f.leave();
  f.context.scheduleSummaryAutoAllocation();
  assert.equal(f.timers.size, 0, 'inactive page must not schedule an allocation');
});

test('a callback already scheduled before leaving does not inspect or allocate', async () => {
  const f = fixture(); f.context.scheduleSummaryAutoAllocation();
  assert.equal(f.timers.size, 1);
  const pending = [...f.timers.values()][0]; f.leave(); pending();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(f.counts().checks, 0, 'delayed callback must not inspect stores after navigation');
  assert.equal(f.counts().writes, 0);
});

test('leaving during the per-date delay prevents snapshot preparation and commit', async () => {
  const f = fixture();
  const pending = f.context.executeSummaryAutoDate('2026-11-02', { store: 'test-store' });
  const rejection = assert.rejects(pending, /页面已离开/);
  f.leave(); [...f.timers.values()][0](); await rejection;
  assert.equal(f.counts().prepared, 0);
  assert.equal(f.counts().writes, 0);
});

test('the same active-page assertion also protects the asynchronous commit boundary', () => {
  const f = fixture(); f.leave();
  assert.throws(() => f.context.assertSummaryAutoActive(), /页面已离开/);
});

test('active pages can still schedule, and cleanup stops queued work', () => {
  const f = fixture(); let stopped = false;
  f.context.scheduleSummaryAutoAllocation(); assert.equal(f.timers.size, 1);
  f.context.summaryAutoQueue = { stop() { stopped = true; } };
  f.cleanups.forEach(fn => fn());
  assert.equal(stopped, true);
  assert.equal(f.timers.size, 0, 'cleanup removes the pending startup callback');
  assert.throws(() => f.context.assertSummaryAutoActive(), /页面已离开/);
});

test('an active page still prepares and saves its date successfully', async () => {
  const f = fixture();
  const pending = f.context.executeSummaryAutoDate('2026-11-02', { store: 'test-store' });
  [...f.timers.values()][0]();
  assert.equal((await pending).status, 'success');
  assert.deepEqual(f.counts(), { checks: 0, prepared: 1, writes: 1 });
});

test('leaving while commit preparation awaits prevents the write', async () => {
  const f = fixture(); let release, committed = false;
  const gate = new Promise(resolve => { release = resolve; });
  f.context.TipOutAllocationResults.commit = async (_snapshot, options) => {
    await gate; options.assertActive(); committed = true;
  };
  const pending = f.context.executeSummaryAutoDate('2026-11-02', { store: 'test-store' });
  const rejection = assert.rejects(pending, /页面已离开/);
  [...f.timers.values()][0](); await Promise.resolve();
  assert.equal(f.counts().prepared, 1);
  f.leave(); release(); await rejection;
  assert.equal(committed, false);
});
