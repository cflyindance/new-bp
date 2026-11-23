import {scheduleStatus,promotionTypes,type Campaign,type PromotionConfiguration} from '../promotions/domain';
import {createPromotionDemo} from '../promotions/demo';
import {capabilities,type ActivityProvider,type ActivityRecord,type ActionSlot,type ClickAction} from './ad-activity-actions';

const promotionKinds={gift:'buyGifts',quantity:'buyDiscount',order:'orderDiscount',exchange:'exchangePurchase'} as const;
const demoSlots:Record<string,string>={'kiosk-cart':'Kiosk','emenu-menu':'eMenu','pickup-ready':'取餐屏','waitlist-entry':'Waitlist'};
export function registeredDemoActions(slot:ActionSlot):Array<ClickAction['type']> {
  const key=slot.id.replace(/^display-demo-/,'');
  return slot.id==='display-demo-'+key&&slot.code==='demo.'+key&&demoSlots[key]===slot.productLine?['none','activity','external']:capabilities(slot);
}
function promotionRules(row:Campaign){
  const f=row.fields,discount=f.discountKind==='percent'?f.discount+'%':'$'+f.discount;
  let benefit=row.fields.name;
  if(row.type==='gift'&&f.quantity&&f.limit)benefit='买 '+f.quantity+' 件，赠 '+f.limit+' 件';
  if(row.type==='quantity'&&f.quantity&&f.discount)benefit=(f.frequency==='each'?'每满':'满')+f.quantity+' 件，1 件减 '+f.discount+'%';
  if(row.type==='order'&&f.threshold&&f.discount)benefit='满 $'+f.threshold+' 减 '+discount;
  if(row.type==='exchange'&&f.limit&&f.discount)benefit='满 '+(f.condition==='items'?f.quantity+' 件':'$'+f.threshold)+'，最多换购 '+f.limit+' 件，单件减 '+discount;
  const conditions=[f.firstOrder==='yes'?'仅限首次下单':'',f.useCode==='yes'?'需输入促销码':'',row.purchase&&Object.values(row.purchase).some(items=>items.length)?'适用于活动配置的指定商品':''].filter(Boolean);
  return {benefit,conditions:conditions.join('；')||'参与资格以原活动配置为准',schedule:{weekdays:f.days?f.days.split(',').map(Number):[],startTime:f.startTime||'',endTime:f.endTime||''}};
}
export function merchantAdActivityProvider(options:{storage:Pick<Storage,'getItem'>;scope:string;promotionScope:string;storeIds:string[];demo:boolean;now?:()=>Date}):ActivityProvider {
  function config():PromotionConfiguration {
    const key='merchant-promotion-'+(options.demo?'demo':'config')+':v1:'+options.promotionScope;
    const raw=options.storage.getItem(key)??(options.demo?options.storage.getItem('merchant-promotion-config:v1:'+options.promotionScope):null);
    const value=raw===null?(options.demo?createPromotionDemo(options.now?.()):{activeType:'',campaigns:[]}):JSON.parse(raw);
    if(!Array.isArray(value.campaigns)||value.campaigns.some((row:any)=>!row||typeof row.id!=='string'||!row.fields||!Object.hasOwn(promotionTypes,row.type)))throw Error('促销活动配置无法读取，请在促销中心检查后重试');
    if(new Set(value.campaigns.map((row:any)=>row.id)).size!==value.campaigns.length)throw Error('促销活动标识重复，请在促销中心检查');
    return value;
  }
  function rows(scope:string,type:string):ActivityRecord[] {
    if(scope!==options.scope)throw Error('活动所属品牌不一致');
    if(type==='coupon')return options.demo?[{id:'ad-demo-coupon-welcome',scope,type:'coupon',name:'新客满减券领取活动（演示）',rules:{benefit:'领取满$30减$5优惠券',conditions:'演示活动，不发券、不核销；领取资格和使用条件由原优惠券模块判断'},status:'published',storeIds:[...options.storeIds],description:'演示活动：领取满$30减$5优惠券。仅用于广告关联及只读预览，不发券、不核销；领取资格、数量、有效期与使用规则由原优惠券业务处理。'}]:[];
    if(type==='points')return options.demo?[{id:'ad-demo-points-coffee',scope,type:'points',name:'积分兑换咖啡（演示）',rules:{benefit:'500积分兑换一杯咖啡',conditions:'演示活动，不扣积分、不兑换；资格及库存由原积分模块判断'},status:'published',storeIds:[...options.storeIds],description:'演示活动：使用500积分兑换一杯咖啡。仅用于广告关联及只读预览，不扣积分、不兑换商品。'}]:[];
    const value=config();
    return value.campaigns.map(row=>({id:row.id,scope,type:'promotion',promotionType:promotionKinds[row.type],name:row.fields.name||'-',rules:promotionRules(row),status:row.enabled&&value.activeType===row.type?'published':'disabled',storeIds:[...options.storeIds],requiresBusinessCheck:true,
      startAt:row.fields.startDate?new Date(row.fields.startDate+'T00:00:00').getTime():undefined,
      endAt:row.fields.endDate?new Date(row.fields.endDate+'T23:59:59.999').getTime():undefined,
      description:[promotionTypes[row.type],row.fields.zh||row.fields.name,'活动日期：'+(row.fields.startDate||'不限')+' 至 '+(row.fields.endDate||'不限'),'星期：'+(row.fields.days||'不限'),'时段：'+(row.fields.startTime?row.fields.startTime+'–'+row.fields.endTime:'不限'),'具体商品、门槛、优惠及参与结果以原促销模块为准。'].join('\n')}));
  }
  return {list:async(scope,type)=>rows(scope,type),get:async(scope,type,id)=>rows(scope,type).find(row=>row.id===id)??null,
    check:async(record,check)=>{
      if(record.scope!==options.scope)return {available:false,reason:'活动所属品牌不一致'};
      if(record.type==='coupon')return {available:options.demo&&record.id==='ad-demo-coupon-welcome'};
      if(record.type==='points')return {available:options.demo&&record.id==='ad-demo-points-coffee'};
      const value=config(),row=value.campaigns.find(row=>row.id===record.id);
      const state=row?scheduleStatus(row,value.activeType,new Date(check.now??options.now?.().getTime()??Date.now())):null;
      return {available:!!row&&state!==null&&state!=='已结束'&&(!check.runtime||state==='进行中'),reason:'促销未启用、已结束或当前不在活动时段，请检查原活动'};
    }};
}
