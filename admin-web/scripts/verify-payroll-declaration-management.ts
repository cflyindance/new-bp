import assert from 'node:assert/strict';
import { createDeclarationManagement } from '../src/team/payroll/payroll-declaration-management';
import { createBrowserDeclarationRepository } from '../src/team/payroll/payroll-declaration-browser';
import type { PayrollScopeSnapshot } from '../src/team/payroll/payroll-types';
import type { PayrollDeclarationRepository } from '../src/team/payroll/payroll-declaration-api';

async function main() {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) } } });
  let scope: PayrollScopeSnapshot = { brandId: 'org', regionId: '', storeId: 'A', storeLabel: 'A店', storeLabelEn: 'A', isAllStores: false, usesInPageStorePicker: true, stores: [{ id: 'A', labelZh: 'A店', labelEn: 'A' }, { id: 'B', labelZh: 'B店', labelEn: 'B' }] };
  const calls: Array<[string, string | undefined]> = [];
  const factory = (organizationId: string, storeId?: string) => {
    calls.push([organizationId, storeId]);
    return createBrowserDeclarationRepository({ organizationId, storeId, actorId: 'test', permission: 'publish' });
  };
  const manager = createDeclarationManagement({ getScope: () => scope }, factory);
  assert.throws(() => manager.repositoryFor('C'), /门店/);
  manager.repositoryFor('B');
  assert.deepEqual(calls.at(-1), ['org', 'B']);
  const ids: Record<string, string> = {};
  for (const storeId of [undefined, 'A', 'B']) {
    const repo = manager.repositoryFor(storeId);
    const family = await repo.createFamily({ localeCode: 'es-US', languageDisplayName: 'Español', ...(storeId ? { storeId } : {}) });
    ids[storeId ?? 'enterprise'] = family.familyId;
    const version = await repo.saveDraft({ familyId: family.familyId, source: 'Test {{employee_name}}', variableSchemaVersion: 'v1' });
    await repo.publishVersion({ versionId: version.versionId, expectedFamilyRevision: 0 });
  }
  const all = await manager.listTemplates();
  assert.equal(all.families.length, 3);
  assert.equal(all.versions.length, 3);
  assert.equal(all.failedStores.length, 0);
  for (const store of ['A', 'B']) {
    const visible = (await manager.repositoryFor(store).listTemplates()).families.map(f => f.familyId).sort();
    assert.deepEqual(visible, [ids.enterprise, ids[store]].sort());
  }
  scope = { ...scope, usesInPageStorePicker: false };
  assert.deepEqual(manager.stores().map(s => s.id), ['A']);
  assert.throws(() => manager.repositoryFor('B'), /门店/);
  assert.equal((await manager.listTemplates()).families.length, 2);
  scope = { ...scope, storeId: '', usesInPageStorePicker: true, stores: [] };
  assert.throws(() => manager.repositoryFor('A'), /门店/);
  assert.equal((await manager.listTemplates()).families.length, 1);
  scope = { ...scope, stores: [{ id: 'A', labelZh: 'A店', labelEn: 'A' }] };
  const partial = createDeclarationManagement({ getScope: () => scope }, (org, store) => {
    const repo = factory(org, store);
    return store ? { ...repo, listTemplates: async () => { throw new Error('offline'); } } : repo;
  });
  assert.deepEqual((await partial.listTemplates()).failedStores, ['A店']);
  let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const delayed = createDeclarationManagement({ getScope: () => scope }, (org, store): PayrollDeclarationRepository => {
    const repo = factory(org, store);
    return { ...repo, listTemplates: async () => { await barrier; return repo.listTemplates(); } };
  });
  const pending = delayed.listTemplates();
  scope = { ...scope, brandId: 'other' };
  release();
  await assert.rejects(pending, /失效/);
  assert.equal((await manager.listTemplates()).families.length, 0);
  console.log('Declaration management routing, isolation, partial failure and stale requests passed');
}
void main();
