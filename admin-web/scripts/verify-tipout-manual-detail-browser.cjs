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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.TIPOUT_PREVIEW_URL || 'http://127.0.0.1:65021/');
    await page.evaluate(async () => {
      localStorage.clear();
      const { mountLegacyTipsRuntime } = await import('/src/team/tips/tips-legacy-runtime.ts');
      const { renderTipsTemplate } = await import('/src/team/tips/tips-templates.ts');
      const store = 'Golden Dragon Chinese Kitchen - Dallas, TX 75231';
      localStorage.setItem('tipout-employees-roster-v1', JSON.stringify([
        { id: 'manual-server', name: 'Maria Garcia', role: 'Server', store, active: true },
        { id: 'manual-busser', name: 'Carlos Lopez', role: 'Busser', store, active: true }
      ]));
      localStorage.setItem('tipout_rules', JSON.stringify([{
        id: 9001, ruleName: '工时手动调整测试', store, allocationMode: 'order_tip_then_residual',
        poolKind: 'tip', poolRules: [{ type: 'tips', pct: 100 }],
        distribution: 'hours', clockin: 'clock',
        workHoursConfig: { mode: 'capped', maxHoursPerDay: 5 },
        receivers: [{ roles: ['Server', 'Busser'], pct: 100 }],
        residual: { receiverRoles: ['Server', 'Busser'] }
      }]));
      document.body.innerHTML = '<div id="test-host"></div>';
      const shadow = document.querySelector('#test-host').attachShadow({ mode: 'open' });
      const root = document.createElement('div'); shadow.append(root);
      const context = {
        getScope: () => ({ storeId: store, storeLabel: store, storeLabelEn: store, isAllStores: false,
          usesInPageStorePicker: true, stores: [{ id: store, labelZh: store, labelEn: store }] }),
        setStoreScope: () => {}, subscribeScopeChange: () => () => {}, navigate: href => { window.testNavigation = href; }, replace: () => {},
        getNavigationState: () => null, getScrollOwner: () => null
      };
      window.testHost = { shadow, root, context, mountLegacyTipsRuntime, renderTipsTemplate };
      root.innerHTML = renderTipsTemplate('details');
      const date = '2026-09-25';
      window.testRuntime = mountLegacyTipsRuntime(shadow, root, {
        view: 'details', query: '?store=' + encodeURIComponent(store) + '&date=' + date,
        href: '/team/tips/details?store=' + encodeURIComponent(store) + '&date=' + date
      }, context);
    });
    const card = page.locator('.detail-card[data-order-tip-mode="1"][data-hours-based="1"]');
    await card.waitFor();
    assert.ok(await card.locator('.detail-emp-hours-input').count() >= 2);
    assert.ok(await card.locator('.detail-emp-pct-input').count() >= 2);
    const server = card.locator('.detail-result-section[data-role="Server"] tr').filter({ has: page.locator('.detail-emp-hours-input') }).first();
    const hours = server.locator('.detail-emp-hours-input');
    const pct = server.locator('.detail-emp-pct-input');
    assert.equal(await hours.isEditable(), true);
    await hours.fill('8'); await hours.dispatchEvent('change');
    assert.equal(await hours.inputValue(), '8');
    assert.ok(Number(await pct.inputValue()) > 0);
    assert.equal((await card.locator('.detail-result-section[data-role="Server"] .detail-emp-pct-input').evaluateAll(inputs => inputs.reduce((sum, input) => sum + Math.round(Number(input.value) * 100), 0))), 10000);
    await pct.fill('101'); await pct.dispatchEvent('change');
    const invalidBefore = await page.evaluate(() => localStorage.getItem('tipout_allocation_results_v1'));
    await page.locator('#confirmDetailAllocationBtn').click();
    assert.equal(await page.evaluate(() => localStorage.getItem('tipout_allocation_results_v1')), invalidBefore);
    await pct.fill('40'); await pct.dispatchEvent('change');
    assert.equal(await pct.inputValue(), '40');
    const roleAmountBefore = await card.locator('.detail-result-section[data-role="Server"] .role-amount').textContent();
    page.on('dialog', dialog => dialog.accept());
    const before = await page.evaluate(() => localStorage.getItem('tipout_allocation_results_v1'));
    await page.locator('#confirmDetailAllocationBtn').click();
    await page.waitForFunction(previous => localStorage.getItem('tipout_allocation_results_v1') !== previous, before);
    const saved = await page.evaluate(() => {
      const snapshot = Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1'))).find(value => value.dateKey === '2026-09-25');
      return snapshot.pools[0].employees.find(employee => employee.name === 'Maria Garcia');
    });
    assert.equal(saved.hours, 8);
    assert.equal(saved.percentage, 40);
    assert.equal(saved.hoursSource, 'manual');
    assert.equal(await page.locator('.detail-card[data-order-tip-mode="1"] .detail-result-section[data-role="Server"] .role-amount').textContent(), roleAmountBefore);
    const restoredPct = page.locator('.detail-card[data-order-tip-mode="1"] .detail-result-section[data-role="Server"] .detail-emp-pct-input').first();
    assert.equal(await restoredPct.inputValue(), '40');
    const originalSavedAmount = saved.amount;
    await restoredPct.fill('40'); await restoredPct.dispatchEvent('change');
    const reconfirmBefore = await page.evaluate(() => localStorage.getItem('tipout_allocation_results_v1'));
    await page.locator('#confirmDetailAllocationBtn').click();
    await page.waitForFunction(previous => localStorage.getItem('tipout_allocation_results_v1') !== previous, reconfirmBefore);
    const reconfirmedAmount = await page.evaluate(() => {
      const snapshot = Object.values(JSON.parse(localStorage.getItem('tipout_allocation_results_v1'))).find(value => value.dateKey === '2026-09-25');
      return snapshot.pools[0].employees.find(employee => employee.name === 'Maria Garcia').amount;
    });
    assert.equal(reconfirmedAmount, originalSavedAmount);
    await page.evaluate(() => {
      window.testRuntime.destroy();
      const { shadow, root, context, mountLegacyTipsRuntime, renderTipsTemplate } = window.testHost;
      root.innerHTML = renderTipsTemplate('distribution');
      window.testRuntime = mountLegacyTipsRuntime(shadow, root, {
        view: 'distribution', query: '?view=employee', href: '/team/tips/distribution?view=employee'
      }, context);
    });
    await page.locator('#dateStart').fill('2026-09-25');
    await page.locator('#dateStart').dispatchEvent('change');
    await page.locator('#dateEnd').fill('2026-09-25');
    await page.locator('#dateEnd').dispatchEvent('change');
    const maria = page.locator('#employeeReconciliationList tr').filter({ hasText: 'Maria Garcia' }).first();
    await maria.locator('.tipout-allocation-hours-button').click();
    assert.match(await page.locator('#allocationHoursDetailRows').textContent(), /工时手动调整测试/);
    assert.match(await page.locator('#allocationHoursDetailRows').textContent(), /手工录入/);
    assert.match(await page.locator('#allocationHoursDetailRows').textContent(), /8 h/);
    await page.locator('#allocationHoursDetailClose').click();
    await maria.click();
    const detailNavigation = await page.evaluate(() => window.testNavigation);
    assert.match(detailNavigation, /employee-reconciliation/);
    const detailQuery = detailNavigation.slice(detailNavigation.indexOf('?'));
    await page.evaluate(query => {
      window.testRuntime.destroy();
      const { shadow, root, context, mountLegacyTipsRuntime, renderTipsTemplate } = window.testHost;
      root.innerHTML = renderTipsTemplate('employee-reconciliation');
      window.testRuntime = mountLegacyTipsRuntime(shadow, root, {
        view: 'employee-reconciliation', query, href: '/team/tips/employee-reconciliation' + query
      }, context);
    }, detailQuery);
    const dailyHours = page.locator('#employeeDetailRows tr').first().locator('.tipout-allocation-hours-button');
    await dailyHours.click();
    assert.match(await page.locator('#employeeDetailHoursRows').textContent(), /工时手动调整测试/);
    assert.match(await page.locator('#employeeDetailHoursRows').textContent(), /手工录入/);
    assert.match(await page.locator('#employeeDetailHoursRows').textContent(), /8 h/);
    assert.deepEqual(errors, []);
    console.log('Order-tip manual hours over cap, exact ratio, snapshot and employee summary passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
