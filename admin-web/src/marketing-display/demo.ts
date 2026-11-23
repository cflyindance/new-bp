import {DEMO_LOGIN_ACCOUNT,getAuthenticatedEmail} from '../auth/login';
import {newSpec,snapshot,type AdSlot} from './ad-slot-catalog';
import {readDisplayPlatform,saveDisplayPlatform} from './store';

const cases=[
  {key:'kiosk-cart',line:'Kiosk',device:'自助终端',scene:'购物车',position:'购物车加购推荐',headline:'加一份招牌薯条',detail:'与汉堡套餐一起享用',color:'#9a3412',layout:'横版',width:1280,height:720},
  {key:'emenu-menu',line:'eMenu',device:'移动端',scene:'点餐',position:'菜单首页活动横幅',headline:'午市套餐',detail:'周一至周五 · 11:00–14:00',color:'#166534',layout:'横版',width:1280,height:720},
  {key:'pickup-ready',line:'取餐屏',device:'取餐显示屏',scene:'取餐',position:'取餐屏底部横幅',headline:'下次到店试试新品',detail:'新品青柠冰茶 · 夏日限定',color:'#075985',layout:'横版',width:1280,height:720},
  {key:'waitlist-entry',line:'Waitlist',device:'排队叫号屏',scene:'等位',position:'等位屏侧栏推荐',headline:'等位期间先看菜单',detail:'招牌烤鸡与时令沙拉',color:'#6b21a8',layout:'竖版',width:720,height:1280},
  {key:'cds-payment',line:'CDS',device:'平板',scene:'结账',position:'结账页会员权益',headline:'会员消费积分',detail:'结账前出示会员码',color:'#9f1239',layout:'横版',width:1280,height:720,unbound:true},
] as const;
const marker='menusifu:display-demo-fixtures:v1:';

function artwork(item:typeof cases[number],width:number,height:number,context=false):string {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('无法生成演示素材');
  const unit=Math.min(width,height),padding=Math.round(unit*.08);
  ctx.fillStyle=context?'#e2e8f0':item.color;ctx.fillRect(0,0,width,height);
  if(context){
    ctx.fillStyle='#fff';ctx.fillRect(padding,padding,width-padding*2,height-padding*2);
    ctx.fillStyle='#334155';ctx.font='bold '+Math.round(unit*.064)+'px sans-serif';ctx.fillText(item.line+' · '+item.scene,padding*2,padding*2.5);
    ctx.fillStyle='#e2e8f0';for(let row=0;row<3;row++)ctx.fillRect(padding*2,padding*(4+row),width-padding*4,padding*.45);
    ctx.fillStyle=item.color;ctx.fillRect(padding*2,height*.66,width-padding*4,height*.20);
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(unit*.064)+'px sans-serif';ctx.fillText('广告位置 · '+item.position,padding*2.4,height*.78,width-padding*5);
  }else{
    ctx.fillStyle='#ffffff20';ctx.beginPath();ctx.arc(width*.86,height*.22,unit*.34,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold '+Math.round(unit*.10)+'px sans-serif';ctx.fillText(item.headline,padding,height*.49,width-padding*2);
    ctx.font=Math.round(unit*.046)+'px sans-serif';ctx.fillText(item.detail,padding,height*.62,width-padding*2);
    ctx.font=Math.round(unit*.030)+'px sans-serif';ctx.fillText('DEMO · 演示素材',padding,height-padding);
  }
  return canvas.toDataURL('image/png');
}

export function ensureDisplayDemo(includeAds=false):void {
  if(getAuthenticatedEmail()?.trim().toLowerCase()!==DEMO_LOGIN_ACCOUNT)return;
  const legacyMarker=marker+'single-terminal';
  if(!localStorage.getItem(legacyMarker)){
    const platform=readDisplayPlatform();
    const legacy=platform.regions.find(region=>region.builtin&&region.id==='idle-screensaver'&&!region.productLine);
    if(legacy){
      const productLine='Kiosk',binding=legacy.bindings[productLine];
      legacy.productLine=productLine;
      legacy.bindings=binding?{[productLine]:binding}:{};
      legacy.specs??=[newSpec(),newSpec('landscape',1920,1080)];
      legacy.specVersion??=1;
      saveDisplayPlatform(platform,platform.revision);
    }
    localStorage.setItem(legacyMarker,'1');
  }
  if(!localStorage.getItem(marker+'regions')){
    const platform=readDisplayPlatform(),next=structuredClone(platform);
    for(const item of cases){
      const id='display-demo-'+item.key,code='demo.'+item.key;
      if(next.regions.some(region=>region.id===id||region.productLine===item.line&&region.code===code))continue;
      const layout=item.layout==='横版'?'横屏':'竖屏';
      const spec={...newSpec('demo-'+item.key,item.width,item.height),name:item.device+' · '+item.layout,applicability:item.device+'／'+layout};
      next.regions.push({id,code,productLine:item.line,name:item.position+'（演示）',scene:item.scene,description:'演示用：'+item.detail,exampleImage:artwork(item,640,360,true),ratio:item.layout==='横版'?'16:9':'9:16',mediaKinds:['image','video'],maxItems:20,parameters:[],bindings:'unbound' in item?{}:{[item.line]:{minimumVersion:'1.0.0',mediaKinds:['image','video']}},enabled:true,builtin:false,generation:0,specs:[spec],specVersion:1,specHistory:[]});
    }
    if(next.regions.length!==platform.regions.length)saveDisplayPlatform(next,platform.revision);
    localStorage.setItem(marker+'regions','1');
  }
  if(!includeAds||localStorage.getItem(marker+'ads'))return;
  const raw=localStorage.getItem('kiosk_themes');
  const records:unknown=raw?JSON.parse(raw):[];
  if(!Array.isArray(records))return;
  const platform=readDisplayPlatform();
  for(const item of cases){
    const slot=platform.regions.find(region=>region.id==='display-demo-'+item.key);
    if(!slot?.enabled||!slot.productLine||!slot.bindings[slot.productLine]||!slot.specs?.length||records.some(record=>record?.id==='display-demo-ad-'+item.key))continue;
    const ref=snapshot(slot as AdSlot),spec=ref.specs[0];
    if(!spec.mediaKinds.includes('image')||!spec.imageFormats.includes('image/png')||spec.width*spec.height>4_000_000)continue;
    const src=artwork(item,spec.width,spec.height);
    const bytes=Math.floor(src.split(',')[1].replace(/=+$/,'').length*3/4);
    if(bytes>spec.imageMaxMB*1024*1024)continue;
    const asset={type:'image',src,adSpecId:spec.id,fit:spec.fit,metadata:{kind:'image',mime:'image/png',bytes,width:spec.width,height:spec.height}};
    records.push({id:'display-demo-ad-'+item.key,name:item.headline+'（演示）',createTime:new Date().toLocaleString('sv-SE'),publishStatus:'draft',publicationHistory:'never',effectTime:'',adSlot:ref,adSlotAssets:{[spec.id]:[asset]},portraitImages:spec.height>spec.width?[asset]:[],landscapeImages:spec.height<=spec.width?[asset]:[],distributeChannels:[ref.productLine],distributePositions:[ref.code],distributedStores:[]});
  }
  localStorage.setItem('kiosk_themes',JSON.stringify(records));
  localStorage.setItem(marker+'ads','1');
}
