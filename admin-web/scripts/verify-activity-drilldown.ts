import assert from 'node:assert/strict';
import { createActivityDemo } from '../src/config/merchant-activity-demo';
import { ACTIVITY_PATH, activityScopeHref, parseActivityScope } from '../src/config/merchant-activity-drilldown';
const data = createActivityDemo();
assert.equal(parseActivityScope(ACTIVITY_PATH, data), null);
for (const scope of [
  { storeId: 'demo-all' }, { storeId: 'demo-all', line: 'POS' as const },
  { storeId: 'demo-all', line: 'POS' as const, deviceId: 'demo-all-POS-1' },
  { storeId: 'demo-all', deviceId: 'demo-all-POS-1' },
  { storeId: 'demo-all', line: 'POS GO' as const },
]) assert.deepEqual(parseActivityScope(activityScopeHref(scope).slice(1), data), scope);
for (const suffix of [
  '/store/missing', '/store/demo-all/line/missing', '/store/demo-all/device/missing',
  '/store/demo-all/line/Kiosk/device/demo-all-POS-1', '/store/demo-error/device/demo-all-POS-1',
  '/store/demo-all/device/demo-all-POS-1/line/POS', '/store/demo-all/line/POS/unknown/x', '/store/%zz',
]) assert.equal(parseActivityScope(ACTIVITY_PATH + suffix, data), undefined, suffix);
assert.equal(parseActivityScope('/m-platform/other/store/demo-all', data), undefined);
console.log('PASS activity drawer scopes: legacy store/line/device addresses, encoded lines and invalid/cross-scope denial');
