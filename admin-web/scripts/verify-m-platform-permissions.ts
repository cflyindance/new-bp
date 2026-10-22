import assert from 'node:assert/strict';
import { M_MODULES, M_PAGES, M_RESOURCES, mModuleKey, mPageKey, mActionKey, mPageForPath } from '../src/permissions/m-platform-catalog';
import { mResolve, validateMState, assertMGrantCeiling, mIsAdministrator, type MState } from '../src/permissions/m-platform-domain';
const state: MState = { schema: 1, revision: 0, roles: [
  { id: 'read', name: '客服', description: '', grants: { [mModuleKey('presets')]: 'read', [mPageKey('presets')]: 'read' } },
  { id: 'publish', name: '发布员', description: '', grants: { [mPageKey('presets')]: 'edit', [mActionKey('presets', 'publish')]: 'edit' } },
], employees: [{ id: 'a', roleIds: ['read'] }, { id: 'b', roleIds: ['read', 'publish'] }], logs: [] };
validateMState(state);
assert.equal(mResolve(state, 'a', mPageKey('presets')), 'read');
assert.equal(mResolve(state, 'a', mActionKey('presets', 'publish')), 'hidden');
assert.equal(mResolve(state, 'b', mActionKey('presets', 'publish')), 'edit', 'union applies across roles before ancestor gates');
assert.equal(mResolve(state, 'b', mActionKey('presets', 'sync')), 'hidden', 'editable page never grants independent action');
assert.equal(mResolve(state, 'b', mPageKey('presets'), false), 'hidden', 'disabled account gates all permissions');
assert.equal(mResolve(state, 'unknown', mPageKey('presets')), 'hidden');
assert.equal(mResolve(state, 'b', 'page:/team/payroll-report'), 'hidden', 'merchant permissions do not enter M catalog');
assert.equal(mResolve(state, 'b', 'm:page:new-future-page'), 'hidden');
const hiddenParent = structuredClone(state); hiddenParent.roles[0].grants[mModuleKey('presets')] = 'hidden';
assert.equal(mResolve(hiddenParent, 'b', mActionKey('presets', 'publish')), 'hidden');
assert.equal(hiddenParent.roles[1].grants[mActionKey('presets', 'publish')], 'edit', 'ancestor hiding preserves descendant configuration');
const readOnly = structuredClone(state); readOnly.roles[1].grants[mPageKey('presets')] = 'read';
assert.equal(mResolve(readOnly, 'b', mActionKey('presets', 'publish')), 'hidden', 'write action blocked by readonly page');
const exportState = structuredClone(state); exportState.roles[0].grants = { [mModuleKey('hardware')]: 'read', [mPageKey('devices')]: 'read', [mActionKey('devices', 'export')]: 'edit' };
assert.equal(mResolve(exportState, 'a', mActionKey('devices', 'export')), 'edit', 'output operation can be independently granted on readonly page');
assert.throws(() => assertMGrantCeiling(state, 'a', { [mPageKey('presets')]: 'edit' }), /超出/);
assertMGrantCeiling(state, 'a', { [mPageKey('presets')]: 'read' });
const invalid = structuredClone(state); invalid.roles.push({ ...invalid.roles[0], id: 'duplicate' });
assert.throws(() => validateMState(invalid), /名称已存在/);
const invalidBinding = structuredClone(state); invalidBinding.employees[0].roleIds = ['missing'];
assert.throws(() => validateMState(invalidBinding), /失效角色/);
assert.equal(mIsAdministrator(state, 'a'), false);
assert.equal(M_MODULES.length, 6);
assert.equal(new Set(M_PAGES.map(p => p.path)).size, M_PAGES.length);
assert.ok([...M_RESOURCES.keys()].every(key => key.startsWith('m:')));
assert.equal(mPageForPath('/m-platform/permissions/subscription-services/create')?.id, 'services', 'service route under permissions is not an access-admin resource');
assert.equal(mPageForPath('/m-platform/permissions/staff-accounts')?.id, 'staff');
assert.equal(mPageForPath('/m-platform/merchants/groups/demo/edit')?.id, 'groups');
assert.equal(mPageForPath('/m-platform/hardware/devices/by-type/pos')?.id, 'devices');
assert.equal(mPageForPath('/m-platform/unknown'), undefined);
console.log(`PASS: M platform role union, deny defaults, parent/page gates, independent output actions, scope ceiling, resource isolation and route attribution (${M_MODULES.length} modules / ${M_PAGES.length} pages / ${M_RESOURCES.size} resources)`);
