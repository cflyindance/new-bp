import {serviceEntitlementData} from './service-entitlement-data';
import { matchingPaidMenus, publishedPaidServicesForMenu, resolveCurrentSubscriptionContext } from './subscription-service-runtime';
import { ensurePublishedSubscriptionMenuTree } from './subscription-published-menu-tree';
import { readSubscriptionServiceSnapshot, SUBSCRIPTION_SERVICE_CHANGE_EVENT } from './subscription-service-store';
import { resolveServicePathAccess, entitlementApplies, serviceAccess, type ServiceAccess } from './service-entitlement-domain';

export function currentServiceAccess(path=location.hash.slice(1)): ServiceAccess[] {
  if (path.startsWith('/m-platform/')) return [];
  const {snapshot,catalog}=serviceEntitlementData();
  const context = resolveCurrentSubscriptionContext() ?? {};
  const paidMenus = matchingPaidMenus(path);
  if (paidMenus.length) {
    const deepest = [...paidMenus].sort((a, b) => b.path.length - a.path.length)[0]!;
    return publishedPaidServicesForMenu(deepest.id).map(pkg => serviceAccess(snapshot, pkg, context));
  }
  if(!snapshot.packages.some(p=>p.commercial))return [];
  return resolveServicePathAccess(snapshot,catalog,path,context);
}
export function servicePathBlocked(path=location.hash.slice(1)): boolean {
  const rights=currentServiceAccess(path);
  return !!rights.length&&!rights.some(r=>r.usable);
}

let installed=false, signature="", refresh:()=>void, timer:ReturnType<typeof setTimeout>|undefined;
function schedule(): void {
  clearTimeout(timer);
  const rights=currentServiceAccess();
  if (!rights.length) return;
  const now=Date.now(), snapshot=readSubscriptionServiceSnapshot(), context=resolveCurrentSubscriptionContext()??{}, ids=new Set(rights.map(r=>r.package.id));
  const next=snapshot.subscriptions.filter(s=>ids.has(s.packageId)&&entitlementApplies(s,context)).flatMap(s=>[Date.parse(s.startAt),s.endAt?Date.parse(s.endAt):NaN]).filter(at=>Number.isFinite(at)&&at>now).sort((a,b)=>a-b)[0];
  if(next)timer=setTimeout(()=>{checkForChange();schedule();},Math.min(next-now+20,2147483647));
}
function currentSignature():string {
  return JSON.stringify(currentServiceAccess().map(r=>[r.package.id,r.package.updatedAt,r.label,r.usable,r.grant?.id,r.grant?.endAt]));
}
function checkForChange():void {
  const next=currentSignature();
  if(next!==signature){signature=next;refresh();}
}
export function installServiceEntitlementRuntime(onMount:()=>void): void {
  refresh=onMount;
  signature=currentSignature();
  schedule();
  if(installed)return;
  installed=true;
  const changed=()=>{if(location.hash.startsWith('#/m-platform/'))return;signature=currentSignature();refresh();schedule();};
  window.addEventListener(SUBSCRIPTION_SERVICE_CHANGE_EVENT,changed);
  window.addEventListener('storage',event=>{if(event.key==='menusifu:subscription-service-packages-v1'||event.key===null)changed();});
  window.addEventListener('focus',()=>{if(currentServiceAccess().length)changed();});
  for(const type of ['click','submit','beforeinput','change'])document.addEventListener(type,event=>{
    const target=event.target;
    if(!(target instanceof Element)||!target.closest('#app main'))return;
    if(target.closest('[data-service-gate],[data-service-trial],[data-service-notice],a, [data-nav-leaf]'))return;
    if(servicePathBlocked()) {event.preventDefault();event.stopImmediatePropagation();refresh();schedule();}
  },true);
  void ensurePublishedSubscriptionMenuTree().then(changed=>{if(changed&&!location.hash.startsWith('#/m-platform/'))refresh();}).catch(()=>{});
}
