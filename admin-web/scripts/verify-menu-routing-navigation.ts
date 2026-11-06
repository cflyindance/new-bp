import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MENU_ROUTING_PAGES, MENU_ROUTING_ROOT, menuRoutingPage } from '../src/config/menu-routing-navigation';
import { M_RESOURCES, mPageForPath } from '../src/permissions/m-platform-catalog';

assert.deepEqual(MENU_ROUTING_PAGES.map(page => page.title), ['导航编排', '页面注册中心']);
for (const page of MENU_ROUTING_PAGES) {
  assert.equal(menuRoutingPage(page.path).view, page.view);
  assert.equal(menuRoutingPage(`${page.path}/?preview=1`).view, page.view);
  assert.equal(mPageForPath(page.path)?.id, 'routing');
}
assert.equal(menuRoutingPage(MENU_ROUTING_ROOT).view, 'nav');
assert.equal(menuRoutingPage(`${MENU_ROUTING_ROOT}/edit/legacy`).view, 'nav');
assert.equal(M_RESOURCES.has('m:page:routing'), true);
assert.equal(M_RESOURCES.has('m:page:page-registry'), false);
const editor = readFileSync(new URL('../src/config/json-menu-editor-ui.ts', import.meta.url), 'utf8');
assert.doesNotMatch(editor, /registrationTabs|data-page-view|registrationUi\.view/);
assert.match(editor, /未保存的菜单修改/);
console.log('PASS menu routing child routes, legacy fallback, existing permission resource, no tabs, existing menu leave protection');
