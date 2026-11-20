import type {ServiceEntitlementKind,ServicePackage,SubscriptionServiceSnapshot} from './subscription-service-domain';

const DAY=86400000,actor='demo.menusifu.cn';
export const SERVICE_ENTITLEMENT_DEMO_VERSION = 2;
const fixtureNote = '默认演示权益，非真实合同或购买';

function demoReference(key: string, kind: ServiceEntitlementKind, stopped: boolean): string {
  if (kind === 'free') return '随品牌入驻开通会员基础服务，支持所属门店登记会员和查询会员资料。';
  if (kind === 'trial') return key === 'marketing'
    ? '品牌计划开展会员召回活动，先试用短信营销功能，评估触达效果后再决定是否采购。'
    : '品牌计划上线积分和会员等级，先试用会员成长服务，核对门店积分累计与等级调整。';
  if (kind === 'gift') return stopped
    ? '为配合门店周年庆活动，赠送一个月会员营销服务，用于活动短信触达。'
    : '为支持品牌上线会员运营，赠送一个月会员运营服务，供门店验证会员运营流程。';
  if (key === 'growth') return '合同编号 HT-2026-1029-014。按合同约定，为指定门店开通会员成长服务，支持积分和会员等级管理。';
  if (key === 'marketing') return '开通单号 KT-2026-1103-008。品牌已确认采购会员营销服务，用于会员召回和短信营销。';
  return '合同编号 HT-2026-0915-006。按原合同开通会员运营服务，用于日常会员运营。';
}

function upgradeDemoReferences(snapshot: SubscriptionServiceSnapshot, brandIds: ReadonlySet<string>): void {
  for (const grant of snapshot.subscriptions) {
    if (grant.subjectType !== 'brand' || !brandIds.has(grant.subjectId) || grant.createdBy !== actor
        || grant.note !== fixtureNote || !grant.entitlementKind || !grant.packageId.startsWith('pkg-ent-demo-')) continue;
    const key = grant.packageId.slice('pkg-ent-demo-'.length);
    const prefix = `ent-demo-${grant.subjectId}-${key}-${grant.entitlementKind}-`;
    const suffix = grant.id.slice(prefix.length);
    if (!grant.id.startsWith(prefix) || !['active','expired','stopped'].includes(suffix)) continue;
    const old = grant.entitlementKind === 'paid' ? 'DEMO-CONTRACT-20261029'
      : grant.entitlementKind === 'gift' ? '演示运营赠送' : '演示数据';
    if (grant.reference === old) grant.reference = demoReference(key, grant.entitlementKind, suffix === 'stopped');
  }
}

/** Seed known demo brands and refresh legacy placeholder copy in demo records. */
export function seedServiceEntitlementDemo(snapshot:SubscriptionServiceSnapshot,catalog:Array<{id:string;path:string}>,brands:Array<{id:string;stores:string[]}>,now=Date.now()):boolean {
 if((snapshot.entitlementDemoVersion ?? 0) >= SERVICE_ENTITLEMENT_DEMO_VERSION || !brands.length)return false;
 if(snapshot.entitlementDemoVersion===1){
  upgradeDemoReferences(snapshot,new Set(brands.map(brand=>brand.id)));
  snapshot.entitlementDemoVersion=SERVICE_ENTITLEMENT_DEMO_VERSION;
  return true;
 }
 const members=catalog.filter(n=>n.path.startsWith('/members/'));
 const sms=members.find(n=>n.path==='/members/crm/sms-tasks'),users=members.find(n=>n.path==='/members/users/list');
 const rest=members.filter(n=>n!==sms&&n!==users);
 if(!sms||!users||rest.length<2)return false;
 const at=(days:number)=>new Date(now+days*DAY).toISOString(),created=at(-10);
 const definitions=[{key:'basic',name:'会员基础服务（演示）',price:0,node:users},{key:'marketing',name:'会员营销服务（演示）',price:29900,node:sms},{key:'growth',name:'会员成长服务（演示）',price:19900,node:rest[0]},{key:'loyalty',name:'会员运营服务（演示）',price:9900,node:rest[1]}];
 // Reserved fixture identities must never replace existing user objects.
 if(definitions.some(d=>snapshot.packages.some(p=>p.id===`pkg-ent-demo-${d.key}`))){
  upgradeDemoReferences(snapshot,new Set(brands.map(brand=>brand.id)));
  snapshot.entitlementDemoVersion=SERVICE_ENTITLEMENT_DEMO_VERSION;
  return true;
 }
 for(const d of definitions){
  const pkg:ServicePackage={id:`pkg-ent-demo-${d.key}`,code:`DEMO_ENT_${d.key.toUpperCase()}`,name:d.name,description:'演示服务：用于核对菜单配置、试用、正式开通及到期状态；不代表真实购买。',priceMinor:d.price,currency:'CNY',billingInterval:'month',commercial:{chargeType:d.price?'paid':'free',billingUnit:d.key==='loyalty'?'store':'brand',trialEnabled:!!d.price,trialDays:14},status:'published',activeReleaseId:`rel-ent-demo-${d.key}-1`,createdAt:created,updatedAt:created};
  snapshot.packages.push(pkg);snapshot.releases.push({...pkg,id:pkg.activeReleaseId!,packageId:pkg.id,version:1,routeBlueprintVersion:snapshot.routeBlueprintVersion,routeNodeIds:[d.node.id],publishedAt:created,publishedBy:actor});
  (snapshot.protectedRoutes??=[]).push({packageId:pkg.id,routeNodeId:d.node.id,path:d.node.path});
 }
 const add=(brand:typeof brands[number],key:string,kind:ServiceEntitlementKind,start:number,end?:number,options:{price?:number;selected?:boolean;stopped?:boolean}={})=>{
  const pkg=snapshot.packages.find(p=>p.id===`pkg-ent-demo-${key}`)!;
  const id=`ent-demo-${brand.id}-${key}-${kind}-${options.stopped?'stopped':end!==undefined&&end<0?'expired':'active'}`;
  if(snapshot.subscriptions.some(g=>g.id===id))return;
  if(options.selected&&!brand.stores.length)return;
  const grant={id,subjectType:'brand' as const,subjectId:brand.id,packageId:pkg.id,entitlementKind:kind,scopeMode:options.selected?'selected' as const:'all' as const,storeIds:options.selected?[brand.stores[0]]:[],startAt:at(start),endAt:end===undefined?undefined:at(end),createdAt:at(start),createdBy:actor,agreedPriceMinor:options.price??(kind==='paid'?pkg.priceMinor:0),agreedCurrency:'CNY',agreedBillingInterval:pkg.billingInterval,agreedBillingUnit:pkg.commercial!.billingUnit,releaseId:pkg.activeReleaseId,reference:demoReference(key,kind,!!options.stopped),note:fixtureNote,...(options.stopped?{disabledAt:at(-1),disabledBy:actor,disableReason:'演示：运营手动停用'}:{})};
  snapshot.subscriptions.push(grant);snapshot.audit.push({id:`audit-${id}`,objectType:'subscription',objectId:id,action:'entitlement.demo',actor,at:grant.createdAt,detail:`演示权益 · ${pkg.name} · ${{free:'免费开通',trial:'开始试用',paid:'正式开通',gift:'赠送'}[kind]} · ${options.selected?'指定门店':'全部品牌门店（含新增）'} · ${options.stopped?'已停用':end===undefined?'长期有效':end<0?'已到期':`结束于 ${grant.endAt}`} · 非真实购买`});
 };
 for(const brand of brands){
  add(brand,'basic','free',-10);
  if(brand.id==='merchant-zhangji'){
   add(brand,'marketing','trial',-2,12);add(brand,'growth','paid',-5,25,{price:15900,selected:true});
   add(brand,'loyalty','gift',-3,27);add(brand,'growth','trial',-30,-16);add(brand,'loyalty','paid',-40,-10,{price:7900});add(brand,'marketing','gift',-20,10,{stopped:true});
  }else if(brand.id==='merchant-tea-one')add(brand,'marketing','trial',-20,-6);
  else if(brand.id==='merchant-menusifu-na')add(brand,'marketing','paid',-5,25,{price:24900});
  else add(brand,'loyalty','gift',-3,27);
 }
 snapshot.entitlementDemoVersion=SERVICE_ENTITLEMENT_DEMO_VERSION;return true;
}
