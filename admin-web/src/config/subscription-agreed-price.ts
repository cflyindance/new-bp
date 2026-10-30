import type {MerchantSubscription} from './subscription-service-domain';

/** Display the recorded deal snapshot only; never infer a price from today's package. */
export function subscriptionAgreedPrice(subscription:MerchantSubscription):{amount:string;basis:string} {
 const minor=subscription.agreedPriceMinor;
 if(typeof minor!=='number'||!Number.isSafeInteger(minor)||minor<0)return {amount:'—',basis:''};
 let amount=(minor/100).toFixed(2),currency=subscription.agreedCurrency;
 try{if(!currency||!/^[A-Z]{3}$/.test(currency))throw Error();amount=new Intl.NumberFormat('zh-CN',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100);}catch{amount+='（币种未记录）';}
 const unit=subscription.agreedBillingUnit==='brand'?'品牌':subscription.agreedBillingUnit==='store'?'门店':'单位未记录';
 const cycle=subscription.agreedBillingInterval?({month:'月',quarter:'季度',year:'年','one-time':'一次性'})[subscription.agreedBillingInterval]:undefined;
 return {amount,basis:`/${unit}/${cycle??'周期未记录'}`};
}
