import type {MerchantStatus} from './enterprise-merchant-types';
export function serviceStatus(status:MerchantStatus):'onboarding'|'active'|'suspended'|'closed'{return status==='draft'?'onboarding':status==='closing'?'suspended':status;}
export const serviceLabel=(status:MerchantStatus)=>({onboarding:'待启用',active:'已启用',suspended:'已暂停',closed:'已关闭'}[serviceStatus(status)]);
