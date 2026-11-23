import {snapshot,validateMedia,type AdSlot} from './ad-slot-catalog';
import {enable,isDefault,sameScope,stores} from './default-ads';
import {defaultAdDemoAssets as assets} from './default-ad-demo-assets';

type Ad=Record<string,any>;
export const DEFAULT_DEMO_VERSION='menusifu:display-default-demo:v1:';
export function ensureDefaultAdDemo(storage:Pick<Storage,'getItem'|'setItem'>,catalog:AdSlot[],context:{demo:boolean;scope:string;canWrite:boolean;assetBase:string}):void {
  if(!context.demo||!context.scope||!context.canWrite||storage.getItem(DEFAULT_DEMO_VERSION+context.scope))return;
  const raw=storage.getItem('kiosk_themes'),records:unknown=raw?JSON.parse(raw):[];
  if(!Array.isArray(records))throw Error('广告数据格式无效，原数据已保留');
  const result=buildDefaultDemo(records,catalog,context.scope,context.assetBase);
  storage.setItem('kiosk_themes',JSON.stringify(result));
  storage.setItem(DEFAULT_DEMO_VERSION+context.scope,'1');
}
export const defaultDemoStores=[
  {mid:'N789234560',name:'Old Neighbourhood Traditional Snack Shop'},
  {mid:'K567890123',name:"Li's Roast Meat Rice Bowl"},
  {mid:'P901234567',name:'Menusifu Test'},
  {mid:'R123456789',name:'Three Visits Spicy Noodles (Technology Road Branch)'},
  {mid:'T345678901',name:'Menusifu'},
];
const cases=[
  {key:'kiosk-idle',slot:'ad-kiosk-screensaver',name:'Kiosk · 待机招牌推荐',art:['kiosk-idle-p','kiosk-idle-l'],store:[0,1,2]},
  {key:'kiosk-home',slot:'ad-kiosk-home',name:'Kiosk · 首页常驻推荐',art:['kiosk-home-p','kiosk-home-l'],store:[0,1]},
  {key:'kiosk-cart',slot:'display-demo-kiosk-cart',name:'Kiosk · 购物车搭配推荐',art:['kiosk-cart'],store:[0]},
  {key:'emenu-idle',slot:'ad-emenu-screensaver',name:'eMenu · 待机欢迎页',art:['emenu-idle'],store:[0,2]},
  {key:'emenu-menu',slot:'display-demo-emenu-menu',name:'eMenu · 菜单首页招牌',art:['emenu-menu'],store:[1,2]},
  {key:'cds-idle',slot:'ad-cds-screensaver',name:'CDS · 顾客屏待机',art:['cds-idle'],store:[0,1]},
  {key:'pickup-banner',slot:'display-demo-pickup-ready',name:'取餐屏 · 常驻取餐提示',art:['pickup-banner'],store:[2,3]},
  {key:'waitlist-side',slot:'display-demo-waitlist-entry',name:'Waitlist · 等位侧栏推荐',art:['waitlist-side'],store:[0,3,4]},
  {key:'kiosk-home-spare',slot:'ad-kiosk-home',name:'Kiosk · 首页备用素材',art:['kiosk-home-l'],store:[0,1],disabled:true},
] as const;

/** No writes here. Existing advertisements, including overlapping defaults, remain untouched. */
export function buildDefaultDemo(existing:Ad[],catalog:AdSlot[],scope:string,assetBase:string,now=new Date().toISOString()):Ad[] {
  if(!scope)return existing;
  let result=existing.slice();
  for(const item of cases){
    const id='display-default-demo-'+scope+'-'+item.key;
    if(result.some(ad=>ad.id===id))continue;
    const slot=catalog.find(slot=>slot.id===item.slot);
    if(!slot?.enabled||!slot.productLine||!slot.bindings[slot.productLine]||!slot.specs?.length)continue;
    const ref=snapshot(slot),bySpec:Record<string,Ad[]>={},portrait:Ad[]=[],landscape:Ad[]=[];
    let invalid=false;
    for(const key of item.art){
      const first=assets[(key+'-1') as keyof typeof assets];
      const spec=ref.specs.find(spec=>spec.width===first.width&&spec.height===first.height);
      if(!spec){invalid=true;break;}
      const list:Ad[]=[];
      for(const number of [1,2]){
        const image=assets[(key+'-'+number) as keyof typeof assets],url=new URL(image.file,assetBase).href;
        const metadata={kind:'image' as const,mime:'image/png',bytes:image.bytes,width:image.width,height:image.height};
        try{validateMedia(spec,metadata);}catch{invalid=true;break;}
        list.push({assetId:id+'-'+spec.id+'-'+number,type:'image',src:url,dataUrl:url,adSpecId:spec.id,fit:spec.fit,metadata,clickAction:{type:'none'}});
      }
      if(invalid||list.length>spec.maxImages||!slot.bindings[slot.productLine].mediaKinds.includes('image')){invalid=true;break;}
      bySpec[spec.id]=list;(spec.height>spec.width?portrait:landscape).push(...list);
    }
    if(invalid)continue;
    let selected=item.store.map(index=>defaultDemoStores[index]);
    const ad:Ad={id,name:item.name+'（演示）',adPurpose:'default',interactionScope:scope,createTime:new Date(now).toLocaleString('sv-SE'),
      publishStatus:'draft',publicationHistory:'never',effectTime:'--',adSlot:ref,adSlotAssets:bySpec,
      portraitImages:portrait,landscapeImages:landscape,idleTimeoutSec:60,carouselIntervalSec:5,transitionEffect:'fade',
      distributeChannels:[ref.productLine],distributePositions:[ref.code]};
    if(!('disabled' in item)){
      const occupied=new Set(result.filter(other=>isDefault(other)&&other.publishStatus==='published'&&sameScope(other,ad)).flatMap(stores));
      selected=selected.filter(store=>!occupied.has(store.mid));
      if(!selected.length)continue;
      result=enable([...result,ad],id,selected,scope,now);
    }else{
      ad.defaultStoreIds=selected.map(s=>s.mid);
      ad.distributedStores=selected.map(s=>({...s,channelStatuses:[{channel:ref.productLine}]}));
      ad.lastDistributePrefs={stores:selected,channels:ad.distributeChannels,positions:ad.distributePositions};
      result.push(ad);
    }
  }
  return result;
}
