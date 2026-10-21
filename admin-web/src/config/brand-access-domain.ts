import { resolveAccess, type Access, type CenterState, type Resource, type Store } from '../permissions/center-domain';

export interface BrandAccount {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  admin: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  /** Local prototype credentials; use the existing authentication service in production. */
  password: string;
}
export interface BrandAccessState extends CenterState { merchantId: string; accounts: BrandAccount[]; logs:(CenterState['logs'][number]&{facts?:import('./brand-audit-types').BrandChangeFacts})[] }

/** Never combine one binding's role with another binding's store range. */
export function brandAccountStores(state: BrandAccessState, account: BrandAccount, stores: Store[]): string[] {
  if (!account.enabled) return [];
  if (account.admin) return stores.map(s => s.id);
  const employee = state.employees.find(e => e.id === account.id);
  return stores.filter(s => employee?.bindings.some(b => b.scope.mode === 'stores' ? b.scope.ids.includes(s.id) : b.scope.mode === 'brands' ? b.scope.ids.includes(s.brand) : b.scope.ids.includes(s.region))).map(s => s.id);
}

export function resolveBrandAccess(
  state: BrandAccessState, account: BrandAccount, storeIds: string[], key: string,
  stores: Store[], resources: Map<string, Resource>, brandCeiling: Set<string>, storeCeilings: Map<string, Set<string>>,
  brandPerspective: boolean,
): Access {
  if (!account.enabled || !brandCeiling.has(key) || !resources.has(key)) return 'hidden';
  const resource = resources.get(key)!;
  if (account.admin && brandPerspective) return resource.type === 'action' || resource.type === 'setting' ? 'edit' : 'read';
  const allowed = new Set(brandAccountStores(state, account, stores));
  const targets = storeIds.filter(id => allowed.has(id));
  // Aggregated operations require every target store; do not union stores' privileges.
  if (!targets.length || targets.length !== storeIds.length) return 'hidden';
  if(brandPerspective && !account.admin && resource.type!=='action') {
    const values=targets.map(id=>storeCeilings.get(id)?.has(key)?resolveAccess(state,account.id,id,key,stores,resources):'hidden');
    if(!values.some(v=>v!=='hidden'))return 'hidden';
    return resource.type==='setting'&&values.every(v=>v==='edit')?'edit':'read';
  }
  let result: Access = 'edit';
  for (const id of targets) {
    if (!storeCeilings.get(id)?.has(key)) return 'hidden';
    const access = account.admin ? resource.type === 'action' || resource.type === 'setting' ? 'edit' : 'read' : resolveAccess(state, account.id, id, key, stores, resources);
    if (access === 'hidden') return 'hidden';
    if (access === 'read') result = 'read';
  }
  return result;
}

export function assertBrandVersion(actual: number, expected: number): void {
  if (actual !== expected) throw Error('数据已被其他窗口修改，请保留当前选择，刷新后重新编辑。');
}

export function updateMenuKeys(current: string[], selected: string[], mode: 'add' | 'replace', ceiling: Set<string>): string[] {
  return [...new Set([...(mode === 'add' ? current : []), ...selected])].filter(k => ceiling.has(k)).sort();
}
