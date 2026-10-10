import type { PayrollDeclarationRepository } from './payroll-declaration-api';
import type { EmployeeDeclarationPreference } from './payroll-declaration-types';

export interface AssignmentEmployee {
  key: string;
  employeeId: string;
  storeId: string;
  name: string;
  employeeNumber: string;
  preference: EmployeeDeclarationPreference | null;
  unavailableReason?: string;
}
export interface AssignmentPreview {
  familyId: string;
  employees: AssignmentEmployee[];
  replacements: number;
  generation: string;
}
export interface AssignmentResult {
  succeeded: string[];
  skipped: string[];
  failed: Array<{ employee: AssignmentEmployee; message: string }>;
  requiresConfirmation: boolean;
}
const fingerprint = (p: EmployeeDeclarationPreference | null) => JSON.stringify([
  p?.defaultFamilyId ?? 'system-default', p?.defaultLocaleCode ?? 'en-US', p?.defaultPrintMode ?? 'employee-only',
]);

export function createDeclarationBatch(input: {
  repositoryFor(storeId: string): PayrollDeclarationRepository;
  listEmployees(): Promise<AssignmentEmployee[]>;
  generation(): string;
  applySaved(employee: AssignmentEmployee, preference: EmployeeDeclarationPreference): void;
}) {
  return {
    async prepareAssignment(familyId: string, selected: AssignmentEmployee[]): Promise<AssignmentPreview> {
      const generation = input.generation();
      const available = await input.listEmployees();
      const employees: AssignmentEmployee[] = [];
      for (const employee of new Map(selected.map(e => [e.key, e])).values()) {
        const current = available.find(e => e.key === employee.key && e.storeId === employee.storeId && e.employeeId === employee.employeeId);
        if (!current || current.unavailableReason) throw new Error(current?.unavailableReason || '员工已不在可分配范围内');
        const repository = input.repositoryFor(current.storeId);
        const { families, versions } = await repository.listTemplates();
        const family = families.find(f => f.familyId === familyId && (!f.scope.storeId || f.scope.storeId === current.storeId));
        if (!family || !versions.some(v => v.versionId === family.activeVersionId && v.familyId === familyId && v.status === 'published')) throw new Error('模板已失效，请重新选择已发布模板');
        employees.push({ ...current, preference: await repository.loadEmployeePreference(current.employeeId) ?? current.preference });
      }
      if (input.generation() !== generation) throw new Error('门店范围已变更，请重新选择员工');
      return { familyId, employees, generation, replacements: employees.filter(e => e.preference && !['system-default', familyId].includes(e.preference.defaultFamilyId)).length };
    },
    async executeAssignment(preview: AssignmentPreview): Promise<AssignmentResult> {
      const result: AssignmentResult = { succeeded: [], skipped: [], failed: [], requiresConfirmation: false };
      if (preview.generation !== input.generation()) throw new Error('门店范围已变更，请重新选择员工');
      const fresh = await this.prepareAssignment(preview.familyId, preview.employees);
      if (fresh.employees.some(e => fingerprint(e.preference) !== fingerprint(preview.employees.find(old => old.key === e.key)?.preference ?? null))) {
        result.requiresConfirmation = true;
        return result;
      }
      for (const employee of fresh.employees) {
        try {
          if (input.generation() !== preview.generation) throw new Error('门店范围已变更，未执行此项');
          if (employee.preference?.defaultFamilyId === preview.familyId) { result.skipped.push(employee.key); continue; }
          const repository = input.repositoryFor(employee.storeId);
          const { families, versions } = await repository.listTemplates();
          const family = families.find(f => f.familyId === preview.familyId && (!f.scope.storeId || f.scope.storeId === employee.storeId));
          if (!family || !versions.some(v => v.versionId === family.activeVersionId && v.familyId === family.familyId && v.status === 'published')) throw new Error('模板已失效');
          if (input.generation() !== preview.generation) throw new Error('门店范围已变更，未执行此项');
          const preference = await repository.saveEmployeePreference({ employeeId: employee.employeeId, defaultFamilyId: family.familyId, defaultLocaleCode: family.localeCode, defaultPrintMode: employee.preference?.defaultPrintMode ?? 'employee-only' });
          result.succeeded.push(employee.key);
          if (input.generation() === preview.generation) input.applySaved(employee, preference);
        } catch (error) {
          result.failed.push({ employee, message: error instanceof Error ? error.message : '保存失败' });
        }
      }
      return result;
    },
  };
}
