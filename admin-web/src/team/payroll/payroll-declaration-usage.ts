import type { PayrollEmployee, PayrollScopeSnapshot } from './payroll-types';
import type { DeclarationTemplateFamily } from './payroll-declaration-types';
import type { PayrollDeclarationRepository } from './payroll-declaration-api';

export async function countDeclarationEmployees(
  families: DeclarationTemplateFamily[], employees: PayrollEmployee[],
  stores: PayrollScopeSnapshot['stores'], repositoryFor: (storeId: string) => PayrollDeclarationRepository,
): Promise<Record<string, number | null>> {
  const counts: Record<string, number | null> = Object.fromEntries(families.map(f => [f.familyId, 0]));
  const seen = new Set<string>();
  for (const employee of employees) {
    const matches = stores.filter(s => [s.id, s.labelZh, s.labelEn].includes(String(employee.store || '')));
    if (!employee.id || matches.length !== 1) continue;
    const storeId = matches[0].id;
    const key = JSON.stringify([storeId, employee.id]);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const preference = await repositoryFor(storeId).loadEmployeePreference(employee.id) ?? employee.declarationPreference;
      const family = families.find(f => f.familyId === preference?.defaultFamilyId && (!f.scope.storeId || f.scope.storeId === storeId));
      if (family && counts[family.familyId] !== null) counts[family.familyId] = (counts[family.familyId] ?? 0) + 1;
    } catch {
      // Failed reads are unknown, never silently presented as zero employees.
      families.filter(f => !f.scope.storeId || f.scope.storeId === storeId).forEach(f => { counts[f.familyId] = null; });
    }
  }
  return counts;
}
