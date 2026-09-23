const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const packageRoot = process.env.TIPOUT_BROWSER_PACKAGES;
const { chromium } = packageRoot ? createRequire(path.join(packageRoot, 'package.json'))('playwright') : require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const view of ['distribution', 'details']) {
      await page.setContent(fs.readFileSync(`src/team/tips/templates/${view}.html`, 'utf8'));
      // Exercise the shared record view against each real page template, in isolated browser memory.
      await page.evaluate(() => {
        window.TipOutDateState = { inspect: () => ({ payoutStatus: 'paid', snapshot: {
          snapshotId: 'snapshot-1', summary: { allocatedAmount: 900 }, pools: [{ employees: [{ employeeId: 'a' }, { employeeId: 'b' }] }]
        }, payout: { recordId: 'record-1', paidAt: '2026-09-23T01:02:03Z', paidByDisplayNameAtConfirmation: '<script>unsafe</script>' } }) };
        const trigger = document.createElement('button');
        trigger.id = 'test-record-trigger'; trigger.textContent = '记录测试入口';
        trigger.onclick = () => window.TipOutPayoutRecordUi.open('Golden Dragon', '2026/09/21');
        document.body.prepend(trigger);
      });
      await page.addScriptTag({ content: fs.readFileSync('src/team/tips/legacy/tipout-payout-record-ui.js.txt', 'utf8') });
      await page.locator('#test-record-trigger').click();
      const modal = page.locator('#tipoutPayoutRecordModal');
      assert.equal(await modal.count(), 1);
      assert.match(await modal.innerText(), /\$900.00/);
      assert.match(await modal.innerText(), /2 人（整日）/);
      assert.match(await modal.innerText(), /<script>unsafe<\/script>/);
      assert.equal(await modal.locator('script').count(), 0);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), '关闭');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), '关闭');
      await page.keyboard.press('Escape');
      assert.equal(await modal.count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'test-record-trigger');
      await page.locator('#test-record-trigger').click();
      await modal.locator('.modal-footer button').click();
      assert.equal(await modal.count(), 0);
      console.log(`${view}: record fields, safe text, focus trap, Escape and close passed`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
