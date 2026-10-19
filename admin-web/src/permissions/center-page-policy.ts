import type {Catalog} from './center-catalog';
import type {Access,Resource} from './center-domain';
import {authorizationRows,applyAuthorization,type AuthorizationRow} from './center-authorization';
import {applyResourceGrant} from './center-employee-pages';
export interface PagePolicy {kind:'single'|'complex'|'entry'; row?:AuthorizationRow; setting?:Resource; coreKeys:string[]}
export function pagePolicy(c:Catalog,page:string):PagePolicy {
  const rows=authorizationRows(c,page),groups=c.sections?.get(page)??c.groups.get(page)??[];
  const children=[...c.resources.values()].filter(r=>r.parent===page&&!r.compatibilityOnly);
  const settings=[...new Set(groups.flatMap(g=>g.keys))].filter(k=>c.resources.get(k)?.type==='setting');
  const auxiliary=new Set(rows.filter(r=>r.mode==='visibility').map(r=>r.contentKey));
  const additional=new Set(rows.flatMap(r=>r.additionalContentKeys??[]));
  const coreKeys=[...new Set([...rows.filter(r=>r.mode!=='visibility').map(r=>r.contentKey),...children.filter(r=>r.type==='content'&&!auxiliary.has(r.key)&&!additional.has(r.key)).map(r=>r.key),...settings])];
  const covered=new Set(rows.flatMap(r=>[r.contentKey,...(r.additionalContentKeys??[]),...r.editKeys]));
  if(rows.length===1&&rows[0].mode!=='visibility'&&!settings.length&&children.every(r=>covered.has(r.key)))return {kind:'single',row:rows[0],coreKeys};
  if(!rows.length&&settings.length===1&&children.every(r=>r.type==='setting'))return {kind:'single',setting:c.resources.get(settings[0])!,coreKeys};
  // One page-wide business object may coexist with independently granted utilities.
  // Promote only when it covers every core; never mistake one of several objects for the page.
  const primary=rows.filter(r=>r.mode!=='visibility');
  const row=primary.length===1&&coreKeys.every(k=>[primary[0].contentKey,...(primary[0].additionalContentKeys??[])].includes(k))?primary[0]:undefined;
  return {kind:coreKeys.length?'complex':'entry',coreKeys,row};
}
export function registerPagePolicies(c:Catalog):void {
  for(const r of c.resources.values())if(r.type==='page'){
    const p=pagePolicy(c,r.key);if(p.coreKeys.length)r.pageContentKeys=p.coreKeys;
  }
}
/** Explicit decisions repair the hidden legacy page gate; never open an ancestor. */
export function syncPageGrant(c:Catalog,page:string,target:Record<string,Access>,keys:string[],value:Access|'inherit'):void {
  const resource=c.resources.get(page);if(!resource?.pageContentKeys?.some(k=>keys.includes(k))&&!keys.includes(resource?.settingPageGate??''))return;
  if(value==='inherit')delete target[page];else target[page]='read';
}
export function applyPageAuthorization(c:Catalog,page:string,target:Record<string,Access>,row:AuthorizationRow,value:Access|'inherit'):void {
  applyAuthorization(target,row,value);syncPageGrant(c,page,target,[row.contentKey],value);
}
export function applyPageResourceGrant(c:Catalog,page:string,target:Record<string,Access>,resource:Resource,value:Access|'inherit'):void {
  for(const key of [resource.key,...(resource.relatedGrantKeys??[])]){const marker=c.resources.get(key)?.parentChoiceKey;if(marker)delete target[marker];}
  applyResourceGrant(target,resource,value);syncPageGrant(c,page,target,[resource.key],value);
}
