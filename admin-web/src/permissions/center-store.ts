import { getRbacSnapshot } from "./rbac-store";
import { listStaffLoginAccounts } from "./staff-account-store";
import { buildPermissionResourceIndex } from "../config/permission-registry";
import { listMPlatformStoreScopeEntries } from "./m-platform-store-scope";
import { buildCenterCatalog, pageKey, settingKey } from "./center-catalog";
import { type CenterState, type Store, type Scope, type Access } from "./center-domain";
import { persistCenterChange } from './center-persistence';
import { migrateNavigationPermissions } from './center-navigation-migration';
import {migrateRoleOnlyState} from './center-role-only';
import {getEnterpriseMerchantSnapshot} from '../config/enterprise-merchant-store';
import type {ScopeBrand} from './center-brand-store-selection';

export const CENTER_KEY = 'menusifu:permission-center-local:v4';
export const centerStores = (): Store[] => listMPlatformStoreScopeEntries().map(s=>({id:s.storeId,title:s.storeName,brand:s.merchantId,region:s.regionName}));
export const centerBrands = (): ScopeBrand[] => getEnterpriseMerchantSnapshot().merchants.map(m=>({id:m.merchantId,name:m.name}));
export function readCenterState(): CenterState {
  const raw = localStorage.getItem(CENTER_KEY);
  if (raw) {
    const state = JSON.parse(raw) as CenterState;
    if(state.schema!==1 || !Array.isArray(state.roles) || !Array.isArray(state.employees) || !Array.isArray(state.logs)) throw Error('权限数据版本无法读取；原数据已保留，请联系管理员');
    return migrateNavigationPermissions(migrateRoleOnlyState(localStorage,CENTER_KEY,state,raw),buildCenterCatalog().resources,centerStores());
  }
  const legacy = getRbacSnapshot(), accounts = listStaffLoginAccounts(), catalog = buildCenterCatalog();
  const registry = buildPermissionResourceIndex();
  const roles = legacy.roles.map(r=>{
    const grants: Record<string,Access> = {};
    for(const node of registry.byKey.values()) {
      const selected = r.selection[node.key];
      if(!selected?.enabled) continue;
      const key = node.level===1 ? `module:${node.moduleId}` : node.level===2 && node.path ? pageKey(node.path) : node.level===4 && node.path && node.seq!=null ? settingKey(node.path,node.seq) : '';
      if(catalog.resources.has(key)) grants[key] = node.level===4 && selected.l4EditMode==='editable' ? 'edit':'read';
    }
    return {id:r.id,name:r.name,description:r.description,system:r.isSystem,grants};
  });
  const ids = new Set([...legacy.staff.map(e=>e.employeeId),...accounts.map(a=>a.employeeId)]);
  const state: CenterState = {schema:1,employeeAuthorization:'roles-only',version:0,roles,employees:[...ids].map(id=>{
    const row=legacy.staff.find(e=>e.employeeId===id),account=accounts.find(a=>a.employeeId===id);
    const known = row?.storeAccess && row.storeAccess.mode!=='all' && row.storeAccess.ids.length;
    const scope: Scope | undefined = known ? {mode:row!.storeAccess.mode as Scope['mode'],ids:[...row!.storeAccess.ids]} : undefined;
    return {id,name:row?.employeeName??account?.employeeName??id,email:account?.loginEmail??'',status:account ? account.enabled?'enabled':'disabled':'unopened',bindings:scope ? (row?.roleIds??[]).map(roleId=>({id:crypto.randomUUID(),roleId,scope:structuredClone(scope)})) : [],overrides:{},migrationReview:!scope && !!row?.roleIds.length};
  }),logs:[]};
  // Keep all legacy keys untouched. Fail visibly if persistence is unavailable.
  const migrated=migrateNavigationPermissions(state,catalog.resources,centerStores());
  localStorage.setItem(CENTER_KEY,JSON.stringify(migrated));
  return migrated;
}
export function saveCenterState(next: CenterState, expectedVersion: number, objectId: string, action: string, actor: string): CenterState {
  return persistCenterChange(localStorage,CENTER_KEY,next,expectedVersion,objectId,action,actor,buildCenterCatalog().resources);
}
