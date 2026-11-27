/** Atomic, optimistic batch patch for the in-memory advertisement editor. */
type Asset = {assetId?:string;clickAction?:unknown};
export type ActionBatch = {slot:string;ids:string[];before:Record<string,string>};
const actionKey=(asset:Asset)=>JSON.stringify(asset.clickAction??{type:'none'},(_,value)=>
  value&&typeof value==='object'&&!Array.isArray(value)
    ? Object.keys(value).sort().reduce((out,key)=>({...out,[key]:value[key]}),{}) : value);
function index(items:Asset[]):Map<string,Asset> {
  const result=new Map<string,Asset>();
  for(const item of items){
    if(!item.assetId||result.has(item.assetId))throw Error('素材标识异常，请重新打开广告');
    result.set(item.assetId,item);
  }
  return result;
}
export function captureBatch(items:Asset[],slot:unknown):ActionBatch {
  if(!items.length)throw Error('请至少选择一张素材');
  index(items);
  return {slot:JSON.stringify(slot),ids:items.map(item=>item.assetId!),before:Object.fromEntries(items.map(item=>[item.assetId!,actionKey(item)]))};
}
export function commonAction(items:Asset[]):{mixed:boolean;action:unknown} {
  const mixed=items.some(item=>actionKey(item)!==actionKey(items[0]));
  return {mixed,action:mixed?{type:'none'}:structuredClone(items[0]?.clickAction??{type:'none'})};
}
/** Caller validates the action and current scope/capabilities before calling this synchronous commit. */
export function applyBatch(batch:ActionBatch,current:Asset[],slot:unknown,action:unknown):number {
  if(JSON.stringify(slot)!==batch.slot)throw Error('渠道、广告位或规格已变化，请重新选择素材');
  const available=index(current);
  const targets=batch.ids.map(id=>{
    const item=available.get(id);
    if(!item)throw Error('所选素材已移除，请重新选择');
    if(actionKey(item)!==batch.before[id])throw Error('所选素材的点击行为已变化，请重新选择');
    return item;
  });
  // Clone all values before the first mutation, so even serialization failure is atomic.
  const patches=targets.map(()=>structuredClone(action));
  targets.forEach((item,i)=>{item.clickAction=patches[i];});
  return targets.length;
}
