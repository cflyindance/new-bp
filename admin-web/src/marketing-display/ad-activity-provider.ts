import {displayScope} from './scope';
import {CONTENTS_PATH} from './domain';
import {canConfigureActions,type ActivityContext,type ActivityProvider} from './ad-activity-actions';
import {merchantAdActivityProvider,registeredDemoActions} from './merchant-ad-activity-provider';
import {resolveEffectiveScope} from '../auth/effective-scope-api';
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
  const demo=(getAuthenticatedEmail()??'').trim().toLowerCase()===DEMO_LOGIN_ACCOUNT.toLowerCase();
  const effective=resolveEffectiveScope();
  const promotionScope=JSON.stringify([effective.perspective,effective.groupId,[...effective.brandIds].sort(),[...effective.storeIds].sort()]);
  const nativeProvider=merchantAdActivityProvider({storage:localStorage,scope:scope.scope,promotionScope,storeIds:scope.storeIds,demo});
  const promotionAccess=currentBrandAccess('page:/promotions/campaigns');
  const couponAccess=currentBrandAccess('page:/members/card/coupon-mgmt');
  const canReadType=(t:string)=>t==='promotion'?promotionAccess!=='hidden':t==='coupon'?couponAccess!=='hidden':true;
  const provider:ActivityProvider=integration?.provider??{...nativeProvider,list:async(s,t)=>!canReadType(t)?[]:nativeProvider.list(s,t),get:async(s,t,id)=>!canReadType(t)?null:nativeProvider.get(s,t,id)};
  return {scope:scope.scope,canWrite,storeIds:scope.storeIds,provider,externalOrigins:integration?.externalOrigins??(demo?['https://activities.example.test']:[]),supportedActions:integration?.supportedActions??(demo?registeredDemoActions:undefined),configurationNote:demo?'演示模式：复用促销中心活动；积分、优惠券与外链为演示信息，不执行真实领取或兑换。':'促销活动来自当前数据范围的促销中心；积分、优惠券与外部来源须由平台接入。',externalExample:demo?{title:'品牌会员日（演示）',url:'https://activities.example.test/member-day'}:undefined};
}
