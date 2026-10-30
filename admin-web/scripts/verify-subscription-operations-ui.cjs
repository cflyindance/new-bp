const assert = require('node:assert/strict');
const fs = require('node:fs');

const ui = fs.readFileSync('src/config/subscription-operations-ui.ts', 'utf8');
const page = fs.readFileSync('src/config/subscription-service-ui.ts', 'utf8');
const store = fs.readFileSync('src/config/subscription-service-store.ts', 'utf8');
const domain = fs.readFileSync('src/config/subscription-operations-domain.ts', 'utf8');

for (const label of ['编辑','立即生效','续期','调整到期时间','停用','撤销','重新开通','查看详情','操作记录']) assert(ui.includes(label), `missing operation ${label}`);
for (const state of ['服务包已下架','服务包已停用','服务包未发布','服务包缺失']) assert(ui.includes(state), `missing package state ${state}`);
for (const hook of ['data-sub-operation','data-sub-edit-form','data-sub-risk-form','data-sub-adjust-form','data-sub-reopen-form','subscription-detail-title','subscription-audit-title']) assert(page.includes(hook), `missing UI hook ${hook}`);
for (const metric of ['providedRouteCount','lostRouteCount','retainedRouteCount','gainedRouteCount','alreadyCoveredRouteCount','nextBoundaryAt','expiresAt','snapshotToken']) assert(domain.includes(metric), `missing impact field ${metric}`);
for (const action of ['subscription.update_scheduled','subscription.activate_now','subscription.extend','subscription.adjust_end','subscription.disable','subscription.cancel','subscription.reopen']) assert(store.includes(action), `missing audit ${action}`);
assert(page.includes('maxlength="200"'), 'risk reasons must be capped at 200');
assert(!ui.includes('<details'), 'row operations must not expand table rows');
for (const hook of [
  'data-sub-more',
  'data-sub-operations-menu',
  'popover="auto"',
  'aria-haspopup="menu"',
  'aria-controls',
  'aria-expanded="false"',
  'role="menu"',
  'role="menuitem"',
  'package-more',
  'package-menu',
  'aria-disabled="true"',
  'aria-describedby',
]) assert(ui.includes(hook), `missing popover contract ${hook}`);
for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape', 'Tab']) {
  assert(ui.includes(key), `missing keyboard behavior ${key}`);
}
assert(/if \(event\.key === "Tab"\) \{\s*menu\.hidePopover\(\);\s*if \(trigger\.isConnected\) trigger\.focus\(\{ preventScroll: true \}\);\s*return;\s*\}/.test(ui), 'Tab must close and restore the trigger as the native focus-order starting point');
assert(ui.includes("closest('[data-sub-operations-menu]')"), 'menu scroll must stay open');
assert(page.includes('bindSubscriptionMoreMenus(document)'), 'subscription page must bind more menus');
assert(page.includes('aria-modal="true"'), 'operation layers must be modal-accessible');
console.log('subscription operation UI verification passed');
