/** Canonical category membership shared by merchant pages and permission editor. */
import { groupCatalogItemsByCategory, type ModuleSettingCatalogHub, type ModuleSettingCatalogItem, type ModuleSettingCatalogGroup } from './module-settings-catalog';
import { normalizeFohCatalogItemsForGrouping } from './foh-settings-group-keys';
import { normalizeFinanceCatalogItemsForGrouping } from './finance-settings-group-keys';
import { normalizeOrderCatalogItemsForGrouping } from './order-settings-group-keys';
import { normalizePrintCatalogItemsForGrouping } from './print-settings-group-keys';
import { orderCenterViewGroups } from './order-center-navigation';
import { isStoreInformationPage, storeInformationItemPath } from './store-information-navigation';
export function settingsCategoryItems(hub: ModuleSettingCatalogHub): ModuleSettingCatalogItem[] {
  switch(hub.settingsPath){
    case '/operations/queue-call/settings': return normalizeFohCatalogItemsForGrouping(hub.items);
    case '/finance/settings': return normalizeFinanceCatalogItemsForGrouping(hub.items);
    case '/orders/settings': return normalizeOrderCatalogItemsForGrouping(hub.items);
    case '/print-templates/settings': return normalizePrintCatalogItemsForGrouping(hub.items);
    default: return hub.items;
  }
}
export function settingsCategoryViewGroups(hub: ModuleSettingCatalogHub, path: string, groups: ModuleSettingCatalogGroup[]): ModuleSettingCatalogGroup[] {
  if(hub.settingsPath==='/orders/settings')return orderCenterViewGroups(groups,path);
  if(hub.settingsPath==='/stores/settings'&&isStoreInformationPage(path)){
    const clean=path.split(/[?#]/)[0].replace(/\/$/,'');
    const base=['/stores/profile','/stores/hours','/stores/settings'].find(p=>clean===p||clean.startsWith(p+'/'));
    if(!base)return [];
    const items=groups.flatMap(g=>g.items).filter(i=>storeInformationItemPath(i)===base);
    const key=base==='/stores/profile'?'store-profile':base==='/stores/hours'?'store-hours-operation':'store-operation-alerts';
    const title=base==='/stores/profile'?'门店档案':base==='/stores/hours'?'营业时间':'营业提醒';
    return items.length?[{groupKey:key,groupTitle:title,items}]:[];
  }
  return groups;
}
export function settingsCatalogGroups(hub: ModuleSettingCatalogHub, path=hub.settingsPath): ModuleSettingCatalogGroup[] {
  return settingsCategoryViewGroups(hub,path,groupCatalogItemsByCategory(settingsCategoryItems(hub),hub.groupOrder));
}
