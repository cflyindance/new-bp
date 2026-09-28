const { createRequire } = require('node:module');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = process.env.TIPOUT_BROWSER_PACKAGES
  ? createRequire(path.join(process.env.TIPOUT_BROWSER_PACKAGES, 'package.json'))('playwright')
  : require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.TIPOUT_PREVIEW_URL || 'http://127.0.0.1:65021/');
    const result = await page.evaluate(async () => {
      const { ensurePresetEmployeesPerStore } = await import('/src/config/team-employee-roster-scope.ts');
      const store = 'Golden Dragon Chinese Kitchen - Dallas, TX 75231';
      const key = 'tipout-employees-roster-v1';
      localStorage.clear();
      ensurePresetEmployeesPerStore([store]);
      const fresh = JSON.parse(localStorage.getItem(key) || '[]');
      const freshRoles = fresh.filter(row => row.store === '上海陆家嘴店' && row.active !== false).map(row => row.role);
      const original = fresh.find(row => row.role === 'Busser');
      original.active = false;
      localStorage.setItem(key, JSON.stringify(fresh));
      // Simulate a roster persisted by the previous seed version.
      localStorage.removeItem('tipout-golden-receiver-seeds-v2');
      ensurePresetEmployeesPerStore([store]);
      const repaired = JSON.parse(localStorage.getItem(key) || '[]');
      return {
        freshRoles,
        repairedRoles: repaired.filter(row => row.store === '上海陆家嘴店' && row.active !== false).map(row => row.role),
        originalStillInactive: repaired.find(row => row.id === original.id).active === false,
      };
    });
    for (const role of ['Server', 'Bartender', 'Busser', 'Runner', 'Host']) {
      assert.ok(result.freshRoles.includes(role), `fresh demo roster missing ${role}`);
      assert.ok(result.repairedRoles.includes(role), `existing demo roster missing active ${role}`);
    }
    assert.equal(result.originalStillInactive, true, 'must not reactivate a disabled employee');
    await page.evaluate(async () => {
      const { mountLegacyTipsRuntime } = await import('/src/team/tips/tips-legacy-runtime.ts');
      const { renderTipsTemplate } = await import('/src/team/tips/tips-templates.ts');
      const store = 'Golden Dragon Chinese Kitchen - Dallas, TX 75231';
      document.body.innerHTML = '<div id="test-host"></div>';
      const shadow = document.querySelector('#test-host').attachShadow({ mode: 'open' });
      const root = document.createElement('div');
      root.innerHTML = renderTipsTemplate('distribution');
      shadow.append(root);
      const context = {
        getScope: () => ({ storeId: store, storeLabel: store, storeLabelEn: store, isAllStores: false, usesInPageStorePicker: true, stores: [{ id: store, labelZh: store, labelEn: store }] }),
        setStoreScope: () => {}, subscribeScopeChange: () => () => {}, navigate: () => {}, replace: () => {}, getNavigationState: () => null, getScrollOwner: () => null,
      };
      window.testRuntime = mountLegacyTipsRuntime(shadow, root, { view: 'distribution', query: '', href: '/team/tips/distribution' }, context);
    });
    const button = page.locator('.tipout-quick-allocate').first();
    await button.waitFor();
    await button.click();
    await page.waitForFunction(() => Object.keys(JSON.parse(localStorage.getItem('tipout_allocation_results_v1') || '{}')).length > 0);
    const snapshot = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1')))[0]);
    assert.ok(snapshot.pools.length > 0, 'default rules should allocate with seeded employees');
    assert.ok(snapshot.pools.some(pool => pool.employees.some(employee => employee.amount > 0)), 'seeded allocation should produce a positive employee result');
    console.log('TipOut initial roster browser verification passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
