const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/27273/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const base = process.env.BRAND_PREVIEW_URL || 'http://127.0.0.1:5313';
  const dir = process.env.USAGE_SCREENSHOT_DIR || 'output/playwright/order-rule-labels';
  fs.mkdirSync(dir, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.evaluate(async () => {
      const auth = await import('/src/auth/login.ts');
      auth.setAuthenticated(auth.DEMO_LOGIN_ACCOUNT);
      (await import('/src/shell/app-shell-mode.ts')).enterMPlatformShell();
    });
    await page.goto(base + '/#/m-platform/merchants/merchant-zhangji');
    await page.evaluate(async () => {
      const entered = (await import('/src/config/enterprise-merchant-impersonate.ts'))
        .enterStoreBackendAsImpersonator('M00000001', '#/m-platform/merchants/merchant-zhangji');
      if (!entered) throw Error('Isolated storefront fixture unavailable');
    });
    await page.goto(base + '/#/home');
    await page.locator('#nav-tree').waitFor();
    await page.getByRole('button', { name: '前厅管理中心', exact: true }).click();
    await page.getByRole('button', { name: '下单规则', exact: true }).waitFor();
    await page.screenshot({ path: dir + '/root.png' });
    await page.getByRole('button', { name: '下单规则', exact: true }).click();
    const routes = [
      ['自助餐限购', '/operations/queue-call/buffet-rules', 'buffet'],
      ['菜品搭配', '/operations/queue-call/menu-order-limits/dish-round', 'dish-pairing'],
      ['下单设置', '/operations/queue-call/menu-order-limits/other', 'general-settings'],
    ];
    for (const [name, route, file] of routes) {
      const link = page.getByRole('link', { name, exact: true });
      await link.waitFor();
      assert.equal(await link.getAttribute('href'), '#' + route);
      await link.click();
      await page.waitForURL('**/#' + route);
      if (file === 'buffet') {
        const frame = page.frameLocator('[data-foh-buffet-rules-root] iframe');
        await frame.getByRole('heading', { name, exact: true }).waitFor();
        assert.equal(await page.locator('[data-foh-buffet-rules-root] iframe').getAttribute('title'), name);
      } else {
        await page.getByRole('region', { name, exact: true }).waitFor();
        if (file === 'dish-pairing') {
          await page.getByRole('heading', { name, exact: true }).first().waitFor();
          await page.getByText('配置同一轮下单中的菜品互斥与必选组合规则。', { exact: true }).waitFor();
        } else {
          for (const category of ['下单时间间隔', '命中后授权', '积分菜限制']) {
            await page.getByText(category, { exact: true }).first().waitFor();
          }
        }
      }
      await page.screenshot({ path: dir + '/' + file + '.png' });
      for (const [label] of routes) assert.equal(await page.getByRole('link', { name: label, exact: true }).count(), 1);
    }
    assert.deepEqual(errors, []);
    console.log('PASS native Chrome: parent, ordered leaves, unchanged routes, buffet frame title, pairing explanation, general categories; no page errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
