import assert from 'node:assert/strict';
import { createDeclarationBatch, type AssignmentEmployee } from '../src/team/payroll/payroll-declaration-batch';
import { createBrowserDeclarationRepository } from '../src/team/payroll/payroll-declaration-browser';

async function main() {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'window', { value: { localStorage: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v) } }, configurable: true });
  const repo = createBrowserDeclarationRepository({ organizationId: 'org', storeId: 'A', actorId: 'admin', permission: 'publish' });
  const family = await repo.createFamily({ languageDisplayName: '中文', localeCode: 'zh-CN', storeId: 'A' });
  const version = await repo.saveDraft({ familyId: family.familyId, source: '{{employee_name}}', variableSchemaVersion: 'v1' });
  await repo.publishVersion({ versionId: version.versionId, expectedFamilyRevision: 0 });
  const employees: AssignmentEmployee[] = ['1','2','3'].map(employeeId => ({ key: employeeId, employeeId, storeId: 'A', name: employeeId, employeeNumber: employeeId, preference: null }));
  employees[0].employeeNumber = ''; // An employee number is not required for assignment.
  await repo.saveEmployeePreference({ employeeId: '3', defaultFamilyId: family.familyId, defaultLocaleCode: 'zh-CN', defaultPrintMode: 'employee-only' });
  let fail = true;
  let generation = '1';
  const writes: string[] = [];
  const batch = createDeclarationBatch({ repositoryFor: () => ({ ...repo, saveEmployeePreference: async p => { if (p.employeeId === '2' && fail) throw new Error('test failure'); writes.push(p.employeeId); return repo.saveEmployeePreference(p); } }), listEmployees: async () => employees, generation: () => generation, applySaved: (e,p) => { employees.find(item => item.key === e.key)!.preference = p; } });
  const preview = await batch.prepareAssignment(family.familyId, employees);
  assert.equal(preview.replacements, 0);
  const result = await batch.executeAssignment(preview);
  assert.deepEqual(result.succeeded, ['1']);
  assert.equal((await repo.loadEmployeePreference('1'))?.defaultFamilyId, family.familyId);
  assert.deepEqual(result.skipped, ['3']);
  assert.equal(result.failed.length, 1);
  fail = false;
  const retry = await batch.executeAssignment(await batch.prepareAssignment(family.familyId, result.failed.map(f => f.employee)));
  assert.deepEqual(retry.succeeded, ['2']);
  assert.deepEqual(writes, ['1','2']);
  generation = '2';
  await assert.rejects(batch.executeAssignment(preview), /范围/);
  await repo.retireVersion({ versionId: version.versionId, expectedFamilyRevision: 1 });
  await assert.rejects(batch.prepareAssignment(family.familyId, employees), /失效/);
  console.log('Declaration batch assignment passed');
}
void main();
