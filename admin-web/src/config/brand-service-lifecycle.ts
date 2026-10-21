import {getAuthenticatedEmail} from '../auth/login';
import {authorizeBrandManagement,currentBrandPrincipal,readBrandAccess,brandMenuChoices,brandRawMenuKeys} from './brand-access-store';
import {brandConfigurationVersion,getMerchantById,getMerchantCapability,updateMerchantStatus,getMerchantStores} from './enterprise-merchant-store';
import {serviceStatus} from './brand-service-policy';
export type BrandServiceAction='activate'|'suspend'|'resume'|'close';
export function brandServiceReadiness(id:string):string[]{
 const m=getMerchantById(id);if(!m)return ['品牌不存在'];const access=readBrandAccess(id),issues:string[]=[];
 if(!m.name.trim()||!m.contactName?.trim()||!m.groupId)issues.push('请补全品牌名称、所属集团和联系人');
 const legacy=!m.accountProvisioningRequired&&m.primaryAdminEmail&&!access.accounts.some(a=>a.email.toLowerCase()===m.primaryAdminEmail!.toLowerCase());
 if(!access.accounts.some(a=>a.admin&&a.enabled)&&!legacy)issues.push('请先开通至少一名已启用的品牌管理员');
 const keys=brandRawMenuKeys(id);if(!brandMenuChoices(getMerchantCapability(id)?.productLineIds).some(c=>c.isPage&&keys.has(c.key)))issues.push('请至少开通一个品牌菜单页面');
 if(m.contractExpiresAt){const expiry=Date.parse(m.contractExpiresAt);if(!Number.isFinite(expiry))issues.push('合同到期日无效，请先核对');else if(expiry<Date.now())issues.push('合同或License已到期，请先续期');}
 return issues;
}
export function brandOnboardingProgress(id:string):string{
 const m=getMerchantById(id);if(!m)return '—';const access=readBrandAccess(id);
 if(!access.accounts.some(a=>a.admin&&a.enabled)&&!(!m.accountProvisioningRequired&&m.primaryAdminEmail&&!access.accounts.some(a=>a.email.toLowerCase()===m.primaryAdminEmail!.toLowerCase())))return '待开通管理员';
 const keys=brandRawMenuKeys(id);if(!brandMenuChoices(getMerchantCapability(id)?.productLineIds).some(c=>c.isPage&&keys.has(c.key)))return '待配置品牌菜单';
 if(m.onboardingCompletedAt)return '初始化已完成';return m.firstLoginAt||access.accounts.some(a=>a.admin&&a.lastLoginAt)?'已首次登录':'待首次登录';
}
export const brandServiceVersion=(id:string)=>JSON.stringify({config:brandConfigurationVersion(id),access:readBrandAccess(id).version});
export function transitionBrandService(id:string,action:BrandServiceAction,reason:string,expected:string):void{
 if(!getAuthenticatedEmail())throw Error('请先登录M平台。');
 if(currentBrandPrincipal())throw Error('品牌服务状态仅支持M平台运营调整。');
 const actor=authorizeBrandManagement(id,'m-platform');if(brandServiceVersion(id)!==expected)throw Error('品牌配置已更新，请刷新后重试。');
 const m=getMerchantById(id);if(!m)throw Error('品牌不存在。');const status=serviceStatus(m.status);
 if(!({activate:status==='onboarding',suspend:status==='active',resume:status==='suspended',close:status==='active'||status==='suspended'}[action]))throw Error('当前品牌状态不支持此操作。');
 if(action==='activate'||action==='resume'){const issues=brandServiceReadiness(id);if(issues.length)throw Error(issues.join('；'));}
 if(!reason.trim()||reason.trim().length<2||reason.trim().length>200)throw Error('请填写2至200字的操作原因。');
 updateMerchantStatus(id,action==='activate'||action==='resume'?'active':action==='suspend'?'suspended':'closed',actor,{reason,expected:brandConfigurationVersion(id)});
}
export function brandServiceImpact(id:string):string{return `当前品牌及其 ${getMerchantStores(id).length} 家门店的商家后台访问；已有菜单、账号、角色与业务数据保留。`;}
