import type {ActivityProvider,ActivityRecord} from './ad-activity-actions';

/** Kiosk release/5.0.2 identity adapter. load/check/participate use the original business service. */
export interface KioskPromotion {id:string|number;activityName:string;activityType:'buyGifts'|'buyDiscount'|'orderDiscount'|'exchangePurchase';enable:boolean;timeInfo?:unknown;activityRule?:unknown}
export interface KioskPromotionSource {
  load(scope:string):Promise<{promotion:KioskPromotion[];promotionEnableType:string;storeIds:string[]}>;
  check:NonNullable<ActivityProvider['check']>;
  participate:NonNullable<ActivityProvider['participate']>;
  describe?(promotion:KioskPromotion):string;
}
const LABELS={buyGifts:'买A赠B',buyDiscount:'M件N折',orderDiscount:'满减折扣',exchangePurchase:'加价换购'};
export function createKioskPromotionActivityProvider(source:KioskPromotionSource):ActivityProvider {
  async function list(scope:string):Promise<ActivityRecord[]>{
    const config=await source.load(scope);
    if(!Array.isArray(config.promotion)||!Array.isArray(config.storeIds)||!config.storeIds.length)throw Error('Kiosk促销配置或适用门店无效');
    const ids=new Set<string>();
    for(const row of config.promotion){const id=String(row.id??'');if(!id||ids.has(id))throw Error('Kiosk促销活动标识缺失或重复');ids.add(id);}
    return config.promotion.map(row=>({id:String(row.id),scope,type:'promotion',name:row.activityName||'-',status:row.enable===true&&LABELS[row.activityType]&&config.promotionEnableType===row.activityType?'published':'disabled',storeIds:[...config.storeIds],requiresBusinessCheck:true,description:(LABELS[row.activityType]||'促销活动')+'\n'+(source.describe?.(row)||'活动时间、商品范围、门槛及优惠规则以原活动为准。')}));
  }
  return {list:async(scope,type)=>type==='promotion'?list(scope):[],get:async(scope,type,id)=>type==='promotion'?(await list(scope)).find(row=>row.id===id)??null:null,check:(record,options)=>source.check(record,options),participate:(record,context)=>source.participate(record,context)};
}
