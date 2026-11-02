import type { Access, Resource } from '../permissions/center-domain';
interface ProviderAccessRuntime {
  active:()=>boolean;
  canTarget:(brandId:string,storeId?:string)=>boolean;
  canListBrand:(brandId:string)=>boolean;
  access:(brandId:string,storeId:string|undefined,key:string,resources:Map<string,Resource>)=>Access;
}
let runtime:ProviderAccessRuntime|undefined;
export const installProviderAccessRuntime=(value:ProviderAccessRuntime):void=>{runtime=value;};
export const providerScopeActive=():boolean=>location.hash.startsWith('#/m-platform/');
export const providerIsActive=():boolean=>runtime?.active()??false;
export const providerTargetAllowed=(brandId:string,storeId?:string):boolean=>runtime?.canTarget(brandId,storeId)??false;
export const providerBrandListed=(brandId:string):boolean=>runtime?.canListBrand(brandId)??false;
export const providerAccess=(brandId:string,storeId:string|undefined,key:string,resources:Map<string,Resource>):Access=>runtime?.access(brandId,storeId,key,resources)??'hidden';
export function assertProviderTarget(brandId:string,storeId?:string):void {
  if(providerScopeActive()&&!providerTargetAllowed(brandId,storeId))throw Error('当前员工未获准访问此品牌／门店。');
}
