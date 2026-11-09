import type {DisplayPlatform,MerchantDisplayState} from './domain';
export interface DisplayStorage {getItem(key:string):string|null;setItem(key:string,value:string):void}
export const PLATFORM_STORAGE='menusifu:display-regions:v1';
export const MERCHANT_STORAGE_PREFIX='menusifu:display-content:v1:';
export const merchantStorageKey=(scope:string)=>MERCHANT_STORAGE_PREFIX+encodeURIComponent(scope);
/** Invalid or newer schema data is never silently replaced with defaults. */
export function readDisplayState<T extends DisplayPlatform|MerchantDisplayState>(storage:DisplayStorage,key:string,fallback:()=>T):T {
  const raw=storage.getItem(key);if(raw===null)return fallback();let parsed:unknown;
  try{parsed=JSON.parse(raw)}catch{throw Error('展示内容数据无法读取，原数据已保留，请联系管理员')}
  const value=parsed as Record<string,unknown>;
  if(!value||value.schema!==1||!Number.isInteger(value.revision)||Number(value.revision)<0||('scope' in value?typeof value.scope!=='string'||!Array.isArray(value.contents)||!Array.isArray(value.placements)||!Array.isArray(value.legacyIds):!Array.isArray(value.regions)))throw Error('展示内容数据版本或结构无效，原数据已保留');
  return value as unknown as T;
}
export function commitDisplayState<T extends DisplayPlatform|MerchantDisplayState>(storage:DisplayStorage,key:string,next:T,expected:number,fallback:()=>T):T {
  const current=readDisplayState(storage,key,fallback);if(current.revision!==expected)throw Error('数据已被其他窗口修改，请保留草稿并刷新后重试');
  const saved=structuredClone({...next,revision:expected+1});
  try{storage.setItem(key,JSON.stringify(saved))}catch{throw Error('保存失败，浏览器存储空间不足或不可用。当前草稿已保留')}
  return saved;
}
