const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const base = process.env.BRAND_PREVIEW_URL || 'http://127.0.0.1:5305';
  const output = process.env.USAGE_SCREENSHOT_DIR || 'output/playwright/buffet-period-column';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/Configuration%20center/buffet-rule.html');
    await page.getByRole('heading', { name: '自助餐限购', exact: true }).waitFor();
    const headings = () => page.getByRole('columnheader', { name: '限购周期', exact: true }).count();
    const period = page.locator('input[data-column="period"]');
    const toggle = () => page.getByRole('button', { name: '字段设置', exact: true }).click();
    const confirm = () => page.getByRole('button', { name: '确认', exact: true }).click();
    assert.equal(await headings(), 0, 'default 7 columns unchanged');
    await toggle();
    assert.equal(await page.locator('#columnPanel input[data-column]').count(), 12);
    assert.equal(await period.isChecked(), false);
    await period.check();
    assert.equal(await headings(), 0, 'draft does not immediately affect table');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    assert.equal(await headings(), 0);
    await toggle();
    await period.check();
    await confirm();
    assert.ok(await headings() > 0);
    const values = await page.evaluate(() => {
      const view = window.BuffetRuleListView;
      const key = window.ORDER_LIMIT_MODULE_PROFILE.storage.listColumnsKey;
      return { saved: JSON.parse(localStorage.getItem(key)), values: [...document.querySelectorAll('.rules-table')].flatMap(table => {
        const index = [...table.querySelectorAll('th')].findIndex(th => th.textContent === '限购周期');
        return [...table.querySelectorAll('tbody tr')].map(tr => tr.children[index].textContent);
      }), definitions: view.columnDefinitions().length };
    });
    assert.ok(values.saved.visible.includes('period'));
    assert.ok(values.values.includes('整个订单'));
    assert.ok(values.values.includes('每轮'));
    assert.ok(values.values.every(value => value && value !== 'undefined'));
    await page.reload();
    await page.getByRole('columnheader', { name: '限购周期', exact: true }).first().waitFor();
    await toggle();
    await period.uncheck();
    await page.getByRole('button', { name: '取消', exact: true }).click();
    assert.ok(await headings() > 0, 'cancel preserves saved period column');
    await toggle();
    await period.uncheck();
    await confirm();
    assert.equal(await headings(), 0);
    await toggle();
    await period.check();
    await page.evaluate(() => {
      const key = window.ORDER_LIMIT_MODULE_PROFILE.storage.listColumnsKey;
      window.__columnWriteBefore = localStorage.getItem(key);
      window.__columnOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('isolated preference failure', 'QuotaExceededError');
        return window.__columnOriginalSetItem.call(this, name, value);
      };
    });
    await confirm();
    assert.equal(await page.locator('#columnError').innerText(), '保存失败，请重试；原列设置未改变');
    assert.equal(await headings(), 0);
    assert.equal(await period.isChecked(), true);
    assert.equal(await page.evaluate(() => localStorage.getItem(window.ORDER_LIMIT_MODULE_PROFILE.storage.listColumnsKey) === window.__columnWriteBefore), true);
    await page.evaluate(() => { Storage.prototype.setItem = window.__columnOriginalSetItem; });
    await confirm();
    assert.ok(await headings() > 0);
    await toggle();
    await page.getByRole('button', { name: '恢复默认', exact: true }).click();
    assert.equal(await period.isChecked(), false);
    assert.ok(await headings() > 0, 'restore is draft until confirmation');
    await confirm();
    assert.equal(await headings(), 0);
    await toggle();
    await period.check();
    await confirm();
    await page.screenshot({ path: output + '/table.png' });
    await toggle();
    await page.screenshot({ path: output + '/columns.png' });
    assert.deepEqual(errors, []);
    console.log('PASS period checkbox, 12 options, cancel, confirm, table values, reload persistence, deselect, restore defaults and failed-write retry');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
