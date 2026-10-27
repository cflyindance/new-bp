import assert from 'node:assert/strict';
import { M_MODULES, M_RESOURCES, mPageKey, mModuleKey, mPageForPath } from '../src/permissions/m-platform-catalog';
import { mResolve, type MState } from '../src/permissions/m-platform-domain';
import { groupMNavigation } from '../src/permissions/m-platform-navigation';

const original = JSON.stringify(M_MODULES);
const grouped = groupMNavigation(M_MODULES);
assert.equal(JSON.stringify(M_MODULES), original, 'presentation cannot mutate authorization catalog');
assert.deepEqual(grouped.find(m => m.id === 'activity-analysis')?.pages.map(p => p.id), ['merchant-activity', 'device-activity']);
assert.ok(grouped.find(m => m.id === 'merchants')?.pages.every(p => !p.id.endsWith('activity')));
assert.deepEqual(grouped.flatMap(m => m.pages.map(p => p.id)).sort(), M_MODULES.flatMap(m => m.pages.map(p => p.id)).sort(), 'every page appears exactly once');
assert.equal(grouped.findIndex(m => m.id === 'activity-analysis'), grouped.findIndex(m => m.id === 'merchants') + 1);
const state: MState = { schema: 1, revision: 0, logs: [], roles: [{ id: 'r', name: 'r', description: '', grants: {
  [mModuleKey('merchants')]: 'read', [mPageKey('device-activity')]: 'read',
} }], employees: [{ id: 'e', roleIds: ['r'] }] };
const visible = () => groupMNavigation(M_MODULES.map(m => ({ ...m, pages: m.pages.filter(p => mResolve(state, 'e', mPageKey(p.id)) !== 'hidden') })).filter(m => m.pages.length && mResolve(state, 'e', mModuleKey(m.id)) !== 'hidden'));
assert.deepEqual(visible().map(m => [m.id, m.pages.map(p => p.id)]), [['activity-analysis', ['device-activity']]], 'single authorized leaf keeps category');
assert.equal(M_RESOURCES.get(mPageKey('device-activity'))?.parent, mModuleKey('merchants'));
assert.equal(M_RESOURCES.has(mModuleKey('activity-analysis')), false, 'no implicit new grants');
assert.equal(mPageForPath('/m-platform/merchants/device-activity/demo-all-switched')?.id, 'device-activity');
assert.equal(mPageForPath('/m-platform/merchants/activity/store/demo-all')?.id, 'merchant-activity');
state.roles[0]!.grants[mModuleKey('merchants')] = 'hidden';
assert.deepEqual(visible(), [], 'hidden existing ancestor still denies access');
state.roles[0]!.grants[mModuleKey('merchants')] = 'read';
delete state.roles[0]!.grants[mPageKey('device-activity')];
assert.deepEqual(visible(), [], 'empty category hidden');
assert.deepEqual(groupMNavigation([]), []);
console.log('PASS activity navigation: grouping, order, no duplication/mutation, single leaf, empty category, unchanged permissions and detail routes');
