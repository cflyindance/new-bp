import assert from 'node:assert/strict';
import { buildMEditorCatalog, mEditorChoices, mEditorBlocked, applyMEditorGrant } from '../src/permissions/m-platform-editor';
import { M_RESOURCES } from '../src/permissions/m-platform-catalog';
import { mResolve, mRoleState, type MRole } from '../src/permissions/m-platform-domain';

const catalog = buildMEditorCatalog();
assert.ok([...M_RESOURCES.keys()].every(key=>catalog.resources.has(key)), 'presentation retains all original resources');
assert.ok([...catalog.resources.keys()].every(key => key.startsWith('m:')));
assert.deepEqual(mEditorChoices('m:page:devices').map(x => x[0]), ['hidden', 'read']);
assert.deepEqual(mEditorChoices('m:page:stores').map(x => x[0]), ['hidden', 'read', 'edit']);
const role: MRole = { id: 'editor-test', name: '编辑器验收', description: '', grants: {
  'm:module:merchants': 'read', 'm:page:stores': 'edit', 'm:action:stores:status': 'edit',
  'm:action:stores:impersonate': 'edit',
} };
const effective = (key: string) => mResolve(mRoleState(role), 'preview', key);
applyMEditorGrant(role, 'm:page:stores', 'read', effective);
assert.equal(effective('m:action:stores:status'), 'hidden');
assert.equal(role.grants['m:action:stores:status'], 'edit', 'readonly preserves stored child grant');
assert.match(mEditorBlocked('m:action:stores:status', effective), /只读/);
assert.equal(mEditorBlocked('m:action:stores:impersonate', effective), '', 'output can be granted on readonly page');
applyMEditorGrant(role, 'm:action:stores:impersonate', 'hidden', effective);
assert.equal(effective('m:action:stores:impersonate'), 'hidden');
applyMEditorGrant(role, 'm:action:stores:impersonate', 'edit', effective);
assert.equal(effective('m:action:stores:impersonate'), 'edit');
applyMEditorGrant(role, 'm:module:merchants', 'hidden', effective);
assert.equal(effective('m:page:stores'), 'hidden');
assert.equal(role.grants['m:page:stores'], 'read');
assert.throws(() => applyMEditorGrant(role, 'm:page:stores', 'edit', effective), /上级/);
applyMEditorGrant(role, 'm:module:merchants', 'read', effective);
applyMEditorGrant(role, 'm:page:stores', 'edit', effective);
assert.equal(effective('m:action:stores:status'), 'edit', 'restoring parent restores retained child grants');
assert.throws(() => applyMEditorGrant(role, 'm:page:devices', 'edit', effective), /不匹配/);
assert.throws(() => applyMEditorGrant(role, 'm:action:stores:status', 'read', effective), /不匹配/);
assert.throws(() => applyMEditorGrant(role, 'page:/orders', 'read', effective), /不匹配/);
console.log('M role editor: catalog parity, ancestor gates, readonly writes, output actions and invalid grants passed');
