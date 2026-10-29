import type {ServiceEntitlementKind,ServicePackage,SubscriptionServiceSnapshot} from './subscription-service-domain';

const DAY=86400000,actor='demo.menusifu.cn';
/** Append once to known demo brands; never rewrite existing services or grants. */
export function seedServiceEntitlementDemo(snapshot:SubscriptionServiceSnapshot,catalog:Array<{id:string;path:string}>,brands:Array<{id:string;stores:string[]}>,now=Date.now()):boolean {
 if(snapshot.entitlementDemoVersion===1||!brands.length)return false;
 const members=catalog.filter(n=>n.path.startsWith('/members/'));
 const sms=members.find(n=>n.path==='/members/crm/sms-tasks'),users=members.find(n=>n.path==='/members/users/list');
 const rest=members.filter(n=>n!==sms&&n!==users);
 if(!sms||!users||rest.length<2)return false;
 const at=(days:number)=>new Date(now+days*DAY).toISOString(),created=at(-10);
 const definitions=[{key:'basic',name:'会员基础服务（演示）',price:0,node:users},{key:'marketing',name:'会员营销服务（演示）',price:29900,node:sms},{key:'growth',name:'会员成长服务（演示）',price:19900,node:rest[0]},{key:'loyalty',name:'会员运营服务（演示）',price:9900,node:rest[1]}];
 // Reserved fixture identities must never replace existing user objects.
 if(definitions.some(d=>snapshot.packages.some(p=>p.id===`pkg-ent-demo-${d.key}`))){snapshot.entitlementDemoVersion=1;return true;}
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
  const grant={id,subjectType:'brand' as const,subjectId:brand.id,packageId:pkg.id,entitlementKind:kind,scopeMode:options.selected?'selected' as const:'all' as const,storeIds:options.selected?[brand.stores[0]]:[],startAt:at(start),endAt:end===undefined?undefined:at(end),createdAt:at(start),createdBy:actor,agreedPriceMinor:options.price??(kind==='paid'?pkg.priceMinor:0),agreedCurrency:'CNY',agreedBillingInterval:pkg.billingInterval,agreedBillingUnit:pkg.commercial!.billingUnit,releaseId:pkg.activeReleaseId,reference:kind==='paid'?'DEMO-CONTRACT-20261029':kind==='gift'?'演示运营赠送':'演示数据',note:'默认演示权益，非真实合同或购买',...(options.stopped?{disabledAt:at(-1),disabledBy:actor,disableReason:'演示：运营手动停用'}:{})};
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
 snapshot.entitlementDemoVersion=1;return true;
}
