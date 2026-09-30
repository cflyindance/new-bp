import type { PayrollDeclarationRepository } from './payroll-declaration-api';
import type { PayrollScopeSnapshot } from './payroll-types';
import type { DeclarationTemplateFamily, DeclarationTemplateVersion } from './payroll-declaration-types';

/** Management aggregation must never be reused for employee language resolution. */
export function createDeclarationManagement(
  context: { getScope(): PayrollScopeSnapshot },
  factory: (organizationId: string, storeId?: string) => PayrollDeclarationRepository,
) {
  let signature = '';
  let generation = 0;
  const repositories = new Map<string, PayrollDeclarationRepository>();
  const stores = () => {
    const scope = context.getScope();
    return [...new Map(scope.stores.filter(store => store.id && (scope.usesInPageStorePicker || store.id === scope.storeId)).map(store => [store.id, store])).values()];
  };
  const invalidate = () => { generation++; repositories.clear(); };
  const sync = () => {
    const scope = context.getScope();
    const next = JSON.stringify([scope.brandId, scope.storeId, scope.usesInPageStorePicker, stores().map(store => store.id).sort()]);
    if (next !== signature) { signature = next; invalidate(); }
    return scope;
  };
  const repositoryFor = (storeId?: string) => {
    const scope = sync();
    if (storeId !== undefined && (!storeId || !stores().some(store => store.id === storeId))) throw new Error('请选择有权限的有效门店');
    const key = storeId ?? '';
    let repository = repositories.get(key);
    if (!repository) {
      repository = factory(scope.brandId || 'demo-organization', storeId);
      repositories.set(key, repository);
    }
    return repository;
  };
  const listTemplates = async () => {
    const scope = sync();
    const current = generation;
    const targets = [{ id: undefined as string | undefined, label: '企业通用' }, ...stores().map(store => ({ id: store.id, label: store.labelZh || store.id }))];
    const results = await Promise.allSettled(targets.map(target => repositoryFor(target.id).listTemplates()));
    sync();
    if (generation !== current) throw new Error('声明模板加载已失效，请重新打开设置');
    const families = new Map<string, DeclarationTemplateFamily>();
    const versions = new Map<string, DeclarationTemplateVersion>();
    const failedStores: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') { failedStores.push(targets[index].label); return; }
      const accepted = result.value.families.filter(family => family.scope.organizationId === (scope.brandId || 'demo-organization') && (!family.scope.storeId || family.scope.storeId === targets[index].id));
      for (const family of accepted) {
        if (!families.has(family.familyId) || Number(family.revision ?? 0) > Number(families.get(family.familyId)?.revision ?? 0)) families.set(family.familyId, family);
      }
      for (const version of result.value.versions) {
        if (accepted.some(family => family.familyId === version.familyId)) versions.set(version.versionId, version);
      }
    });
    return { families: [...families.values()], versions: [...versions.values()], failedStores };
  };
  return { stores, repositoryFor, listTemplates, invalidate };
}
