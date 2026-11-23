import {displayScope} from './scope';
import {CONTENTS_PATH} from './domain';
import {canConfigureActions,localCatalogProvider,type ActivityContext,type ActivityProvider} from './ad-activity-actions';
import {currentBrandAccess} from '../config/brand-access-store';
import {getAuthenticatedEmail,DEMO_LOGIN_ACCOUNT} from '../auth/login';
import {getUserSessionContext} from '../auth/session-permissions';
import {buildPermissionResourceIndex} from '../config/permission-registry';

/** Business integrations register one provider; ad positions never implement promotion calculations. */
let integration:{provider:ActivityProvider;externalOrigins:string[];supportedActions?:ActivityContext['supportedActions']}|undefined;
export function registerAdActivityProvider(provider:ActivityProvider,externalOrigins:string[]=[],supportedActions?:ActivityContext['supportedActions']):void {integration={provider,externalOrigins:[...externalOrigins],supportedActions};}
export function currentAdActivityContext():ActivityContext {
  const scope=displayScope(CONTENTS_PATH);
  const resource=[...buildPermissionResourceIndex().byKey.values()].find(node=>node.path==='/marketing/screensaver');
  const snapshot=resource?getUserSessionContext()?.permissionSnapshot[resource.key]:undefined;
  const canWrite=!!scope.scope&&canConfigureActions(currentBrandAccess('page:/marketing/screensaver'),snapshot,(getAuthenticatedEmail()??'').toLowerCase()===DEMO_LOGIN_ACCOUNT.toLowerCase());
  return {scope:scope.scope,canWrite,storeIds:scope.storeIds,provider:integration?.provider??localCatalogProvider(localStorage),externalOrigins:integration?.externalOrigins??[],supportedActions:integration?.supportedActions};
}
