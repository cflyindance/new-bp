/** Lazy registration keeps authentication and preset initialization independent of the M workspace. */
import type { BrandAccessState, BrandAccount } from '../config/brand-access-domain';
import type { UserSessionContext } from './session-permissions';
import type { Store } from '../permissions/center-domain';

type Principal={merchantId:string;account:BrandAccount;state:BrandAccessState};
type Identity={name:string;groupId:string;regions:{regionId:string;name:string}[]};
interface BrandAccessRuntime {
  recordBrandSuccessfulLogin?:(email:string)=>void;
  currentBrandPrincipal:()=>Principal|null;
  buildBrandSessionContext:()=>UserSessionContext|null;
  validateBrandLogin:(email:string,password:string)=>string|null|undefined;
  isBrandPathAllowed:(path:string)=>boolean;
  brandStoresForPath:(ids:string[],path:string)=>string[];
  brandStores:(id:string)=>Store[];
  brandIdentity:(id:string)=>Identity|null;
  brandPrimaryAdminEmail:(id:string)=>string;
}
let runtime:BrandAccessRuntime|undefined;
export function installBrandAccessRuntime(value:BrandAccessRuntime):void {runtime=value;}
export const currentBrandPrincipal=()=>runtime?.currentBrandPrincipal()??null;
export const buildBrandSessionContext=()=>runtime?.buildBrandSessionContext()??null;
export const validateBrandLogin=(email:string,password:string)=>runtime?.validateBrandLogin(email,password);
export const isBrandPathAllowed=(path:string)=>runtime?.isBrandPathAllowed(path)??true;
export const brandStoresForPath=(ids:string[],path:string)=>runtime?.brandStoresForPath(ids,path)??ids;
export const brandStores=(id:string)=>runtime?.brandStores(id)??[];
export const brandIdentity=(id:string)=>runtime?.brandIdentity(id)??null;
export const brandPrimaryAdminEmail=(id:string)=>runtime?.brandPrimaryAdminEmail(id)??'';

export const recordBrandSuccessfulLogin=(email:string)=>runtime?.recordBrandSuccessfulLogin?.(email);
