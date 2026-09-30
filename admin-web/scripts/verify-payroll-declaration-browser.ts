import assert from 'node:assert/strict';
import { createPayrollDeclarationRepository } from '../src/team/payroll/payroll-declaration-api';

async function main() {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { hostname: 'cflyindance.github.io', search: '' }, localStorage: storage } });
  let requests = 0;
  const fetchMock = (async () => { requests++; return new Response('405 Not Allowed', { status: 405 }); }) as typeof fetch;
  const scope = { organizationId: 'test-org', storeId: 'store-1', actorId: 'test-admin', permission: 'publish' as const };
  const repo = createPayrollDeclarationRepository(scope, fetchMock);
  const defaultPreference = await repo.saveEmployeePreference({ employeeId: 'default-employee', defaultFamilyId: 'system-default', defaultLocaleCode: 'en-US', defaultPrintMode: 'employee-only' });
  assert.equal(defaultPreference.defaultFamilyId, 'system-default');
  assert.deepEqual(await repo.listTemplates(), { families: [], versions: [] });
  const family = await repo.createFamily({ localeCode: 'es-US', languageDisplayName: 'Español' });
  const draft = await repo.saveDraft({ familyId: family.familyId, source: 'Horas {{total_hours}}', variableSchemaVersion: 'v1' });
  await assert.rejects(repo.saveEmployeePreference({ employeeId: 'e1', defaultFamilyId: family.familyId, defaultLocaleCode: 'es-US', defaultPrintMode: 'employee-only' }), /发布/);
  await repo.publishVersion({ versionId: draft.versionId, expectedFamilyRevision: 0 });
  const reopened = createPayrollDeclarationRepository(scope, fetchMock);
  assert.equal((await reopened.listTemplates()).versions[0].status, 'published');
  await assert.rejects(repo.publishVersion({ versionId: draft.versionId, expectedFamilyRevision: 0 }));
  assert.equal((await createPayrollDeclarationRepository({ ...scope, organizationId: 'other' }, fetchMock).listTemplates()).families.length, 0);
  await assert.rejects(repo.saveDraft({ familyId: family.familyId, source: '<script>x</script>', variableSchemaVersion: 'v1' }));
  await repo.saveEmployeePreference({ employeeId: 'e1', defaultFamilyId: family.familyId, defaultLocaleCode: 'es-US', defaultPrintMode: 'employee-only' });
  const snapshot = await repo.confirmDeclaration({ employeeId: 'e1', periodId: 'p1', primaryVersionId: draft.versionId, variables: { total_hours: '40' } });
  assert.equal(snapshot.renderedText, 'Horas 40');
  assert.equal((await reopened.loadSnapshot('e1', 'p1'))?.contentHash, snapshot.contentHash);
  assert.equal(await createPayrollDeclarationRepository({ ...scope, storeId: 'store-2' }, fetchMock).loadSnapshot('e1', 'p1'), null);
  await repo.retireVersion({ versionId: draft.versionId, expectedFamilyRevision: 1 });
  assert.equal((await reopened.listTemplates()).versions[0].status, 'retired');
  assert.equal(requests, 0, 'GitHub Pages must not send declaration requests');
  storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(repo.createFamily({ localeCode: 'fr', languageDisplayName: 'French' }), /浏览器/);
  (globalThis as any).window.location.hostname = '127.0.0.1';
  await assert.rejects(createPayrollDeclarationRepository(scope, fetchMock).listTemplates(), /405/);
  assert.equal(requests, 1, 'localhost retains HTTP mode');
  console.log('Declaration browser demo repository passed');
}
void main();
