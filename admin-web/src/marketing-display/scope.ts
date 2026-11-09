import {getEnterpriseMerchantSnapshotForAuthorization} from '../config/enterprise-merchant-store';
import type {FlowStore} from './flow-views';
import {getAuthenticatedEmail,DEMO_LOGIN_ACCOUNT} from '../auth/login';
import {currentBrandPrincipal} from '../auth/brand-access-runtime';
import {getScopedFilterOptions,readScopeFilters} from '../auth/session-scope';
import {getUserSessionContext} from '../auth/session-permissions';
import {resolveDefaultAnchorBrandId,isGroupHqDataPerspective} from '../auth/merchant-scope-context';
import {currentBrandAccess} from '../config/brand-access-store';
import {currentMAccess} from '../permissions/m-platform-store';
import {mCanVisit} from '../permissions/m-platform-runtime';
import {mActionKey} from '../permissions/m-platform-catalog';
import {CONTENTS_PATH,PLACEMENTS_PATH,REGIONS_PATH,restrictDisplayStores,type DisplayContext} from './domain';
import {listMPlatformStoreScopeEntries,LEGACY_BRAND_ID_MAP} from '../permissions/m-platform-store-scope';
export interface DisplayScope extends DisplayContext {name:string;stores:FlowStore[];selectedStore:string}
export function displayScope(path:string):DisplayScope {
  const filters=readScopeFilters(),principal=currentBrandPrincipal(),options=getScopedFilterOptions();
  const rawScope=principal?.merchantId||filters.brand||(!isGroupHqDataPerspective()?resolveDefaultAnchorBrandId():'')||'';
  const scope=LEGACY_BRAND_ID_MAP[rawScope]??rawScope;
  const metadata=new Map(getEnterpriseMerchantSnapshotForAuthorization().stores.map(s=>[s.storeId,s]));
  const stores=restrictDisplayStores(scope,options.stores,listMPlatformStoreScopeEntries()).map(s=>({id:s.value,name:s.labelZh,address:metadata.get(s.value)?.address,postalCode:metadata.get(s.value)?.postalCode}));
  const access=currentBrandAccess(`action:${path===PLACEMENTS_PATH?PLACEMENTS_PATH:CONTENTS_PATH}:manage-page`);
  const demo=(getAuthenticatedEmail()??'').toLowerCase()===DEMO_LOGIN_ACCOUNT.toLowerCase();
  const snapshot=getUserSessionContext()?.permissionSnapshot['marketing:mkt-screensaver'];
  const canWrite=!!scope&&(access==='edit'||access===undefined&&(demo||!!snapshot?.enabled&&snapshot.display!==false&&snapshot.l4EditMode==='editable'));
  return {scope,name:options.brands.find(b=>b.value===scope)?.labelZh||'当前品牌',stores,storeIds:stores.map(s=>s.id),selectedStore:filters.store,canWrite};
}
export function canManageDisplayRegions():boolean{return mCanVisit(REGIONS_PATH)&&currentMAccess(mActionKey('presets','publish'))==='edit'}
export function requireCurrentDisplayScope(expected:string,path:string):DisplayScope {const context=displayScope(path);if(context.scope!==expected)throw Error('品牌上下文已变化，请重新打开表单');if(!context.canWrite)throw Error('暂无操作权限');return context}
