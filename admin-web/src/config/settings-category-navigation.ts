import {orderPresetSeq} from './order-center-navigation';
import {isStoreInformationPage} from './store-information-navigation';
/** Shared presentation boundary: independent business pages have no category sidebar. */
export function hasModuleSettingsCategorySidebar(path:string):boolean {
  const clean=path.split(/[?#]/)[0].replace(/\/$/,'');
  return !orderPresetSeq(clean)&&!(isStoreInformationPage(clean)&&!clean.startsWith('/stores/settings'));
}
