import type { Catalog } from './center-catalog';
import type { Access } from './center-domain';
import { applyResourceGrant, resourceOwn } from './center-employee-pages';
import {syncPageGrant} from './center-page-policy';
export function categorySettingKeys(catalog: Catalog, page: string, id: string): string[] {
  const groups=catalog.sections?.get(page)??catalog.groups.get(page)??[];
  return [...new Set(groups.find(g=>g.id===id)?.keys??[])].filter(k=>catalog.resources.get(k)?.type==='setting');
}
export function categoryGrantValue(catalog: Catalog, keys: string[], own:(key:string)=>Access|'inherit'): Access|'inherit'|'mixed' {
  const values=keys.map(k=>resourceOwn(catalog.resources.get(k)!,own));
  return values.length&&values.every(v=>v===values[0])?values[0]:'mixed';
}
/** Batch edit existing field grants only; never create a category gate or touch a sibling. */
export function applyCategoryGrant(catalog: Catalog, page: string, id: string, grants: Record<string,Access>, value: Access|'inherit'): void {
  for(const key of categorySettingKeys(catalog,page,id))applyResourceGrant(grants,catalog.resources.get(key)!,value);
  syncPageGrant(catalog,page,grants,categorySettingKeys(catalog,page,id),value);
}
