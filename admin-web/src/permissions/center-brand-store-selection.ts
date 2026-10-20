import type {Scope,Store} from './center-domain';

export interface ScopeBrand {id:string;name:string}
export interface BrandStoreGroup extends ScopeBrand {stores:Store[]}
export type ScopePickerMode=Scope['mode']|'brand-stores';
/** UI selection only. Brand grouping never changes persisted scope semantics. */
export class BrandStoreSelection {
  readonly groups:BrandStoreGroup[];
  readonly selected:Set<string>;
  readonly visited=new Set<string>();
  active='';
  constructor(private readonly stores:Store[],brands:ScopeBrand[],initialIds:string[]=[]){
    this.groups=[...new Set(stores.map(s=>s.brand))].map(id=>({id,name:brands.find(b=>b.id===id)?.name||(id?'未识别品牌':'未归属品牌'),stores:stores.filter(s=>s.brand===id)}));
    this.selected=new Set(initialIds.filter(id=>stores.some(s=>s.id===id)));
    for(const group of this.groups)if(group.stores.some(s=>this.selected.has(s.id)))this.visited.add(group.id);
  }
  activate(id:string):void {
    const group=this.groups.find(g=>g.id===id);if(!group)return;
    this.active=id;
    if(!this.visited.has(id)){this.visited.add(id);for(const store of group.stores)this.selected.add(store.id);}
  }
  setBrand(id:string,checked:boolean):void {
    const group=this.groups.find(g=>g.id===id);if(!group)return;
    this.active=id;this.visited.add(id);
    for(const store of group.stores)if(checked)this.selected.add(store.id);else this.selected.delete(store.id);
  }
  setStore(id:string,checked:boolean):void {
    const store=this.stores.find(s=>s.id===id);if(!store)return;
    this.visited.add(store.brand);if(checked)this.selected.add(id);else this.selected.delete(id);
  }
  state(id:string):'none'|'partial'|'all'{
    const group=this.groups.find(g=>g.id===id),count=group?.stores.filter(s=>this.selected.has(s.id)).length??0;
    return !count?'none':count===group?.stores.length?'all':'partial';
  }
  scope():Scope {
    const ids=[...new Set(this.stores.filter(s=>this.selected.has(s.id)).map(s=>s.id))];
    if(!ids.length)throw Error('请选择至少一家授权门店');
    return {mode:'stores',ids};
  }
}
export function scopeFromPicker(mode:ScopePickerMode,ids:string[],brands:BrandStoreSelection):Scope {
  if(mode==='brand-stores')return brands.scope();
  if(!['stores','brands','regions'].includes(mode))throw Error('授权范围无效');
  const unique=[...new Set(ids)];if(!unique.length||unique.some(id=>!id.trim()))throw Error('请选择至少一个授权范围');
  return {mode,ids:unique};
}
