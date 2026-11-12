import {withDefaults} from './ad-slot-catalog';
import {createPlatformState,createMerchantState,type DisplayPlatform,type MerchantDisplayState} from './domain';
import {PLATFORM_STORAGE,merchantStorageKey,readDisplayState,commitDisplayState} from './persistence';
export function readDisplayPlatform():DisplayPlatform{return withDefaults(readDisplayState(localStorage,PLATFORM_STORAGE,createPlatformState))}
export function readMerchantDisplay(scope:string):MerchantDisplayState {
  const state=readDisplayState(localStorage,merchantStorageKey(scope),()=>createMerchantState(scope));
  if(state.scope!==scope)throw Error('展示内容品牌归属异常，原数据已保留');return state;
}
export function saveDisplayPlatform(next:DisplayPlatform,expected:number):DisplayPlatform{return commitDisplayState(localStorage,PLATFORM_STORAGE,next,expected,createPlatformState)}
export function saveMerchantDisplay(next:MerchantDisplayState,expected:number):MerchantDisplayState{return commitDisplayState(localStorage,merchantStorageKey(next.scope),next,expected,()=>createMerchantState(next.scope))}
export function readLegacyScreensavers():unknown {const raw=localStorage.getItem('kiosk_themes');if(!raw)return [];try{return JSON.parse(raw)}catch{throw Error('旧屏保数据格式无效，原数据已保留')}}
