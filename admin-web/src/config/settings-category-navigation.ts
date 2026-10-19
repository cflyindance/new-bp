import {orderPresetSeq} from './order-center-navigation';
import {isStoreInformationPage} from './store-information-navigation';
/** Shared presentation boundary: independent business pages have no category sidebar. */
export function hasModuleSettingsCategorySidebar(path:string):boolean {
  const clean=path.split(/[?#]/)[0].replace(/\/$/,'');
  if(/^\/operations\/queue-call\/(brand-menu\/(brands|settings)|category-settings\/(age-category|menu|special-menu|settings)|classification-settings\/(categories|settings)|menu-order-limits\/dish-round|buffet-rules)$/.test(clean))return false;
  return !orderPresetSeq(clean)&&!(isStoreInformationPage(clean)&&!clean.startsWith('/stores/settings'));
}
