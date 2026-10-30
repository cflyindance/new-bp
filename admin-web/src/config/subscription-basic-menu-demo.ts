import {getSubscriptionRouteCatalog,type SubscriptionServiceSnapshot,type ServicePackageDraft} from './subscription-service-domain';

/** Upgrade only the untouched reserved fixture; published v1 remains immutable. */
export function seedBasicMenuDemo(snapshot:SubscriptionServiceSnapshot,catalog:Array<{id:string;path:string}>,blueprintVersion:number,now=Date.now()):boolean {
 const pkg=snapshot.packages.find(p=>p.id==='pkg-basic-99');
 if(!pkg||pkg.code!=='BASIC_99'||pkg.name!=='基础经营版'||pkg.description!=='覆盖商品、订单、支付与经营首页的基础能力。'||pkg.priceMinor!==9900||pkg.currency!=='CNY'||pkg.billingInterval!=='month'||pkg.commercial||pkg.status!=='published'||pkg.activeReleaseId!=='rel-basic-1'||pkg.createdAt!==pkg.updatedAt)return false;
 const releases=snapshot.releases.filter(r=>r.packageId===pkg.id),original=releases[0];
 if(releases.length!==1||!original||original.id!=='rel-basic-1'||original.version!==1||original.publishedBy!=='hq.admin@menusifu.cn'||original.name!==pkg.name||original.priceMinor!==pkg.priceMinor||original.description!==pkg.description||original.currency!==pkg.currency||original.billingInterval!==pkg.billingInterval||original.commercial)return false;
 const legacy=getSubscriptionRouteCatalog().filter(n=>['dashboard','orders','transactions','product-center-main'].includes(n.moduleId)).map(n=>n.id);
 const same=(a:string[],b:string[])=>a.length===b.length&&a.every(k=>b.includes(k));
 if(!same(original.routeNodeIds,legacy))return false;
 const grants=snapshot.subscriptions.filter(s=>s.packageId===pkg.id);
 if(grants.some(s=>!['sub-demo-brand-basic'].includes(s.id)||s.createdBy!=='hq.admin@menusifu.cn'||s.entitlementKind))return false;
 if(snapshot.audit.some(a=>a.objectId===pkg.id||grants.some(s=>s.id===a.objectId)))return false;
 const drafts=snapshot.drafts.filter(d=>d.packageId===pkg.id);
 const untouched=(d:ServicePackageDraft)=>d.revision===1&&d.baseReleaseId===original.id&&d.name===original.name&&d.description===original.description&&d.priceMinor===original.priceMinor&&d.currency===original.currency&&d.billingInterval===original.billingInterval&&!d.commercial&&same(d.routeNodeIds,legacy);
 if(drafts.some(d=>!untouched(d)))return false;
 const keys=[...new Set(catalog.filter(n=>['/dashboard/','/orders/','/transactions/','/brand-products/','/brand-menu/','/menu/'].some(prefix=>n.path.startsWith(prefix))).map(n=>n.id))];
 if(!keys.length||snapshot.releases.some(r=>r.id==='rel-basic-menu-demo-v2'))return false;
 const at=new Date(now).toISOString(),release={...original,id:'rel-basic-menu-demo-v2',version:2,routeBlueprintVersion:blueprintVersion,routeNodeIds:keys,publishedAt:at,publishedBy:'demo.menusifu.cn'};
 snapshot.routeBlueprintVersion=blueprintVersion;snapshot.releases.push(release);pkg.activeReleaseId=release.id;pkg.updatedAt=at;
 drafts.forEach(d=>Object.assign(d,{baseReleaseId:release.id,routeBlueprintVersion:blueprintVersion,routeNodeIds:[...keys],revision:d.revision+1,updatedAt:at}));
 snapshot.audit.unshift({id:'audit-basic-menu-demo-v2',action:'package.demo.menu',objectType:'package',objectId:pkg.id,actor:'demo.menusifu.cn',at,detail:`基础经营版演示菜单补齐 · v2 · ${keys.length} 个有效菜单 · 非真实购买`});
 return true;
}
