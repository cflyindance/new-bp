/* Preview-only hardware environment and canvas scaling. Merchant configuration is never changed here. */
(()=>{
 const profiles=[
  {id:'android-24-1',label:'24″竖屏 · 1080×1920 · 倍率1',width:1080,height:1920,inches:24,dpr:1,orientation:'portrait'},
  {id:'android-24-15',label:'24″竖屏 · 1080×1920 · 倍率1.5',width:1080,height:1920,inches:24,dpr:1.5,orientation:'portrait'},
  {id:'android-14-1',label:'14″横屏 · 1920×1080 · 倍率1',width:1920,height:1080,inches:14,dpr:1,orientation:'landscape'},
  {id:'android-14-15',label:'14″横屏 · 1920×1080 · 倍率1.5',width:1920,height:1080,inches:14,dpr:1.5,orientation:'landscape'}
 ];
 const query=new URLSearchParams(location.search),read=key=>{try{return sessionStorage.getItem(key);}catch{return null;}},write=(key,value)=>{try{sessionStorage.setItem(key,value);}catch{}};
 const find=id=>profiles.find(p=>p.id===id);
 let selected=(find(query.get('device'))||find(read('kiosk-preview-device-v5'))||profiles[0]).id;
 let zoom=query.has('zoom')?(query.get('zoom')==='actual'?'actual':'fit'):(read('kiosk-preview-zoom-v5')==='actual'?'actual':'fit');
 const current=()=>find(selected),get=id=>find(id)||profiles[0];
 function select(id){if(!find(id))return;selected=id;write('kiosk-preview-device-v5',id);}
 function setZoom(value){zoom=value==='actual'?'actual':'fit';write('kiosk-preview-zoom-v5',zoom);}
 function link(file,extra={}){const url=new URL(file,location.href);url.searchParams.set('native','v5');url.searchParams.set('device',selected);url.searchParams.set('zoom',zoom);for(const [k,v] of Object.entries(extra))url.searchParams.set(k,v);return url.pathname.split('/').pop()+url.search;}
 function controls(){return `<div class="device-preview-controls"><label title="Android Kiosk 画布。倍率按设备 DPR 模拟，保留项目原适配算法。">设备 <select id="preview-device" aria-label="预览设备">${profiles.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${p.label}</option>`).join('')}</select></label><label title="100%为1个设备画布像素对应1个浏览器CSS像素，不代表实际英寸1:1。">视图 <select id="preview-zoom" aria-label="画布显示比例"><option value="fit" ${zoom==='fit'?'selected':''}>适应窗口</option><option value="actual" ${zoom==='actual'?'selected':''}>100% 像素</option></select></label><span class="preview-scale" data-preview-scale aria-live="polite"></span></div>`;}
 function description(){const p=current();return `Android · ${p.inches}″ · ${p.width}×${p.height} · 显示倍率 ${p.dpr}`;}
 function fit(doc=document){let percentage=100;doc.querySelectorAll('.device-wrapper').forEach(wrapper=>{const area=wrapper.closest('.stage')||wrapper.parentElement,landscape=wrapper.classList.contains('landscape'),w=landscape?960:540,h=landscape?540:960;const scale=zoom==='actual'?2:Math.max(.1,Math.min(2,(area.clientWidth-56)/w,(area.clientHeight-30)/h));area.classList.toggle('pixel-preview',zoom==='actual');wrapper.style.width=w*scale+'px';wrapper.style.height=h*scale+'px';wrapper.style.margin=zoom==='actual'?'16px auto':'0';const device=wrapper.querySelector('.device');if(device){device.style.width=w+'px';device.style.height=h+'px';device.style.transform=`scale(${scale})`;}percentage=Math.round(scale/2*100);});doc.querySelectorAll('a[data-preview-target]').forEach(a=>a.href=link(a.dataset.previewTarget));doc.querySelectorAll('[data-preview-scale]').forEach(el=>{el.textContent=percentage+'%';el.title='设备画布相对浏览器CSS像素的显示比例；物理大小取决于显示器PPI。';});return percentage;}
 function applyRuntime(win){const params=new URLSearchParams(win.location.search);if(params.get('reference')==='1'){win.__KIOSK_DEVICE_PROFILE__={mode:'browser-reference'};return;}
  const p=get(params.get('device')||selected),dpr=p.dpr,originalUA=win.navigator.userAgent,errors=[];
  const set=(object,key,getter)=>{try{Object.defineProperty(object,key,{configurable:true,get:getter});}catch(e){errors.push(key+': '+e.message);}};
  let ua=originalUA.replace(/\([^)]*\)/,'(Linux; Android; KioskPreview)');if(!ua.includes('Android'))ua+=' Android';if(!ua.includes('MenusifuAndroidShell'))ua+=' MenusifuAndroidShell';
  set(win.navigator,'userAgent',()=>ua);set(win,'devicePixelRatio',()=>dpr);
  set(win.screen,'width',()=>Math.round(win.innerWidth/dpr));set(win.screen,'height',()=>Math.round(win.innerHeight/dpr));set(win.screen,'availWidth',()=>Math.round(win.innerWidth/dpr));set(win.screen,'availHeight',()=>Math.round(win.innerHeight/dpr));
  if(win.screen.orientation){set(win.screen.orientation,'type',()=>win.innerWidth>=win.innerHeight?'landscape-primary':'portrait-primary');set(win.screen.orientation,'angle',()=>win.innerWidth>=win.innerHeight?90:0);}
  win.__KIOSK_DEVICE_PROFILE__={...p,mode:'android-kiosk-preview',originalUA,errors,ppi:Math.hypot(p.width,p.height)/p.inches};
 }
 window.KioskDevicePreview={profiles,current,get,select,setZoom,zoom:()=>zoom,controls,description,fit,link,applyRuntime,rotate(){const p=current();select(profiles.find(q=>q.orientation!==p.orientation&&q.dpr===p.dpr).id);}};
})();
