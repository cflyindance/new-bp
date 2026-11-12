/* Native create/edit flow; catalog and validation are compiled from the shared TS contract. */
(function(root){
  'use strict';
  var api=KioskAdSlots;
  function esc(value){var el=document.createElement('span');el.textContent=String(value||'');return el.innerHTML;}
  function confirmChange(message){return new Promise(function(resolve){var dialog=document.createElement('dialog');dialog.className='ui-dialog-panel ad-slot-confirm w-full max-w-sm overflow-hidden rounded-xl border-0 p-0';dialog.setAttribute('aria-label','确认修改');dialog.innerHTML='<div class="ui-dialog-header"><h3 class="ui-dialog-title">请确认</h3></div><p class="ui-dialog-body whitespace-pre-line"></p><div class="ui-dialog-footer"><button type="button" class="ui-dialog-btn" data-cancel>取消</button><button type="button" class="ui-dialog-btn ui-dialog-btn--primary" data-ok>继续</button></div>';dialog.querySelector('p').textContent=message;var previous=document.activeElement;function finish(value){dialog.close();dialog.remove();if(previous&&previous.isConnected)previous.focus();resolve(value);}dialog.querySelector('[data-cancel]').onclick=function(){finish(false);};dialog.querySelector('[data-ok]').onclick=function(){finish(true);};dialog.oncancel=function(e){e.preventDefault();finish(false);};document.body.append(dialog);dialog.showModal();});}
  function mount(config){
    var form=document.getElementById(config.formId),action=document.getElementById(config.nextId),title=document.querySelector('header h1'),oldTitle=title.textContent;
    var slots=[],catalogError='',selected=null,channel='',bank={},cache={},active={},hooks=null,theme=config.theme;
    try{slots=api.readCatalog(localStorage);}catch(e){catalogError=e.message;}
    if(!config.copy&&theme&&theme.adSlot){try{api.validateSnapshot(slots,theme.adSlot);selected=theme.adSlot;channel=selected.productLine;}catch(e){catalogError=e.message;channel=theme.adSlot.productLine||'';}}
    if(!channel&&theme){var oldChannels=theme.distributeChannels||theme.lastDistributePrefs&&theme.lastDistributePrefs.channels||[];if(oldChannels.length===1)channel=oldChannels[0];}
    var picking=!selected;
    var section=document.createElement('section');section.className='mx-auto w-full max-w-2xl rounded-2xl border border-[#f0f0f0] bg-white p-8 shadow-sm';
    section.innerHTML='<h2 class="mb-2 text-base font-medium">选择渠道 <span class="text-red-500">*</span></h2><p class="mb-5 text-sm text-gray-500">一条广告投放到一个渠道、一个展示位置</p><div id="adChannelGrid" class="grid grid-cols-3 gap-3" role="radiogroup" aria-label="投放渠道"></div><div class="mt-8 border-t pt-6"><h2 class="mb-4 text-base font-medium">展示位置 <span class="text-red-500">*</span></h2><div id="adSlotGrid" class="grid grid-cols-2 gap-3" role="radiogroup" aria-label="展示位置"></div></div><p id="adSlotError" class="mt-5 text-sm text-red-500" role="alert"></p>';
    form.before(section);
    var next=document.createElement('button');next.type='button';next.id='positionNextBtn';next.className=action.className;next.textContent='下一步';action.before(next);
    var summary=document.createElement('div');summary.className='mb-5 flex items-center justify-between gap-4 text-sm';summary.innerHTML='<span id="adPositionSummary"></span>';form.prepend(summary);
    function roleFor(spec){return spec.height>spec.width?'portrait':'landscape';}
    function specs(role){return selected?selected.specs.filter(function(s){return roleFor(s)===role;}):[];}
    function spec(role){var list=specs(role);return list.find(function(s){return s.id===active[role];})||list[0]||api.newSpec(role,role==='portrait'?1080:1920,role==='portrait'?1920:1080);}
    function flush(){if(hooks&&selected)['portrait','landscape'].forEach(function(role){if(specs(role).length)bank[spec(role).id]=hooks.get(role);});}
    function allowedKinds(s){var source=slots.find(function(v){return selected&&v.id===selected.id;}),binding=source&&source.bindings[channel];return s.mediaKinds.filter(function(k){return !binding||binding.mediaKinds.indexOf(k)>=0;});}
    function renderMedia(){
      if(!hooks)return;
      ['portrait','landscape'].forEach(function(role){
        var list=specs(role),s=spec(role),label=document.querySelector('[data-position-ratio="'+role+'"]'),block=label.closest('.border-t');block.style.display=list.length?'':'none';
        var select=block.querySelector('[data-ad-spec-selector]');if(!select){select=document.createElement('select');select.setAttribute('data-ad-spec-selector',role);select.setAttribute('aria-label',role==='portrait'?'竖版素材规格':'横版素材规格');select.className='mb-4 h-10 rounded-xl border border-gray-300 px-3 text-sm';label.parentElement.after(select);select.addEventListener('change',function(){flush();active[role]=this.value;hooks.set(role,bank[this.value]||[]);renderMedia();});}
        select.innerHTML=list.map(function(v){return '<option value="'+esc(v.id)+'"'+(v.id===s.id?' selected':'')+'>'+esc(v.name)+' · '+v.width+'×'+v.height+' · '+esc(v.applicability)+'</option>';}).join('');select.style.display=list.length>1?'':'none';
        var kinds=allowedKinds(s),items=bank[s.id]||hooks.get(role);var kind=items.length?items[0].type:kinds[0]||'image';
        document.querySelectorAll('input[name="'+role+'Type"]').forEach(function(r){r.disabled=kinds.indexOf(r.value)<0;r.closest('label').style.display=r.disabled?'none':'';r.checked=r.value===kind;});
        hooks.refresh(role);
      });
    }
    function radio(name,value,label,checked){return '<label class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 '+(checked?'border-primary bg-[#e6f4ff]':'border-[#d9d9d9]')+'"><input type="radio" name="'+name+'" value="'+esc(value)+'"'+(checked?' checked':'')+'><span>'+esc(label)+'</span></label>';}
    function refresh(){
      section.style.display=picking?'':'none';form.style.display=picking?'none':'';action.style.display=picking?'none':'';next.style.display=picking?'':'none';title.textContent=picking?'选择渠道与广告位':oldTitle;
      document.getElementById('adChannelGrid').innerHTML=api.CHANNELS.map(function(c){return radio('adChannel',c,c,c===channel);}).join('');
      var options=api.available(slots,channel);document.getElementById('adSlotGrid').innerHTML=!channel?'<p class="col-span-2 text-sm text-gray-500">请先选择渠道</p>':options.length?options.map(function(s){return radio('adSlot',s.id,s.name,selected&&s.id===selected.id);}).join(''):'<p class="col-span-2 text-sm text-gray-500">该渠道暂无可用广告位，请联系平台管理员配置并登记接入</p>';
      section.querySelector('#adSlotError').textContent=catalogError;next.disabled=!selected||selected.productLine!==channel||!options.some(function(s){return s.id===selected.id;});next.style.opacity=next.disabled?'0.45':'';
      summary.querySelector('span').textContent=selected?'投放渠道：'+channel+'　展示位置：'+selected.name:'未选择渠道与广告位';
      var progress=document.querySelector('.step-progress-inner');if(progress)progress.style.width=picking?'25%':'50%';
    }
    section.addEventListener('change',async function(event){
      var input=event.target;flush();if(selected&&hooks&&Object.values(bank).some(function(v){return v.length;})&&!(await confirmChange('更换渠道或广告位后，素材将按目标规格重新校验。是否继续？'))){refresh();return;}if(selected){cache.__legacy={portrait:[],landscape:[]};selected.specs.forEach(function(s){cache.__legacy[roleFor(s)]=cache.__legacy[roleFor(s)].concat(bank[s.id]||[]);});}if(input.name==='adChannel'){flush();if(selected)cache[selected.id+'@'+selected.version]=bank;channel=input.value;selected=null;bank={};active={};catalogError='';}
      else if(input.name==='adSlot'){var slot=slots.find(function(s){return s.id===input.value;});if(slot){flush();if(selected)cache[selected.id+'@'+selected.version]=bank;selected=api.snapshot(slot);bank=cache[selected.id+'@'+selected.version]||{};active={};}}
      refresh();
    });
    next.addEventListener('click',function(){if(next.disabled)return;if(cache.__legacy){['portrait','landscape'].forEach(function(role){if(specs(role).length&&!bank[spec(role).id])bank[spec(role).id]=cache.__legacy[role];});delete cache.__legacy;}picking=false;refresh();['portrait','landscape'].forEach(function(role){if(hooks)hooks.set(role,bank[spec(role).id]||[]);});renderMedia();});
    window.addEventListener('storage',function(event){if(event.key===api.PLATFORM_KEY){try{slots=api.readCatalog(localStorage);catalogError='广告位配置已更新，保存前将重新校验';}catch(e){catalogError=e.message;}refresh();}});
    refresh();
    async function loadItems(items){var list=await hooks.load(items);if(config.copy){for(var item of list){if(item.type==='video'&&item.mediaRef){var blob=await KioskThemeMediaIdb.get(item.mediaRef);if(!blob)throw Error('源视频已失效，无法复制');item.file=blob;delete item.mediaRef;}}}return list;}
    async function metadata(item){
      var source=item.url||item.dataUrl;var blob=item.file;
      if(!blob){if(!source&&item.mediaRef&&root.KioskThemeMediaIdb)blob=await KioskThemeMediaIdb.get(item.mediaRef);else{var response=await fetch(source);if(!response.ok)throw Error('无法读取素材，请重新上传');blob=await response.blob();}}
      if(!blob)throw Error('素材文件已失效，请重新上传');var objectUrl=URL.createObjectURL(blob),kind=item.type||'image';
      try{return await new Promise(function(resolve,reject){var el=kind==='video'?document.createElement('video'):new Image();var timeout=setTimeout(function(){reject(Error('素材读取超时，请重新上传'));},15000);function done(){clearTimeout(timeout);resolve({kind:kind,mime:blob.type,bytes:blob.size,width:kind==='video'?el.videoWidth:el.naturalWidth,height:kind==='video'?el.videoHeight:el.naturalHeight,duration:kind==='video'?el.duration:undefined});}if(kind==='video'){el.preload='metadata';el.onloadedmetadata=done;}else el.onload=done;el.onerror=function(){clearTimeout(timeout);reject(Error('素材无法解码，请重新上传'));};el.src=objectUrl;});}finally{URL.revokeObjectURL(objectUrl);}
    }
    async function serialize(process){
      if(!selected)throw Error('请选择渠道与广告位');var current=api.readCatalog(localStorage),slot=api.validateSnapshot(current,selected);flush();
      var bySpec={},portrait=[],landscape=[],count=0,warnings=[];
      for(var i=0;i<selected.specs.length;i++){
        var s=selected.specs[i],items=bank[s.id]||[];if(!items.length)continue;count+=items.length;
        var types=Array.from(new Set(items.map(function(v){return v.type||'image';})));if(types.length!==1)throw Error(s.name+'不能混用图片与视频');
        var kind=types[0];if(items.length>(kind==='video'?s.maxVideos:s.maxImages))throw Error(s.name+'素材数量超过上限');
        if(!slot.bindings[channel].mediaKinds.includes(kind))throw Error('该渠道尚未登记支持此素材类型');
        bySpec[s.id]=[];
        for(var j=0;j<items.length;j++){
          var item=items[j],meta=await metadata(item);warnings=warnings.concat(api.validateMedia(s,meta));
          // Preserve uploaded pixels; the former thumbnail compression is unsuitable for strict dimensions.
          var source=item;if(item.file&&kind==='image'){var url=await new Promise(function(resolve,reject){var reader=new FileReader();reader.onload=function(){resolve(reader.result);};reader.onerror=reject;reader.readAsDataURL(item.file);});source={url:url,dataUrl:url,type:'image'};}
          var stored=await process(source,roleFor(s)==='portrait');stored.adSpecId=s.id;stored.metadata=meta;stored.fit=s.fit;bySpec[s.id].push(stored);(roleFor(s)==='portrait'?portrait:landscape).push(stored);
        }
      }
      if(!count)throw Error('请至少配置一套规格的广告素材');
      if(warnings.length&& !(await confirmChange('以下素材与推荐尺寸不同：\n'+warnings.join('\n')+'\n是否保留当前素材并继续保存？')))throw Error('已取消保存，请检查素材尺寸');
      return {bySpec:bySpec,portrait:portrait,landscape:landscape,slot:JSON.parse(JSON.stringify(selected))};
    }
    return {
      defaultKind:function(role){return allowedKinds(spec(role))[0]||'image';},
      validateItem:async function(role,item){var meta=await metadata(item);if(allowedKinds(spec(role)).indexOf(meta.kind)<0)throw Error('该渠道不支持此素材类型');return api.validateMedia(spec(role),meta);},
      value:function(){return selected?selected.code:'';},snapshot:function(){return selected;},channel:function(){return channel;},
      mediaSpec:function(role){var s=spec(role);return {width:s.width,height:s.height,ratio:api.ratio(s).replace(':','∶'),box:(role==='portrait'?'w-[7.5rem]':'w-[10rem]')+' ad-spec-box',fit:s.fit};},
      spec:spec,maxCount:function(role,kind){return kind==='video'?spec(role).maxVideos:spec(role).maxImages;},
      hasMedia:function(){flush();return Object.keys(bank).some(function(k){return bank[k]&&bank[k].length;});},
      attachMedia:function(value){hooks=value;renderMedia();},
      hydrate:async function(th){
        if(config.copy&&th&&th.adSlotAssets){var copied={};for(var key of Object.keys(th.adSlotAssets))copied[key]=await loadItems(th.adSlotAssets[key]);var live=slots.find(function(s){return s.id===th.adSlot.id;});cache[th.adSlot.id+'@'+(live?live.specVersion:th.adSlot.version)]=copied;cache.__legacy={portrait:await loadItems(th.portraitImages||[]),landscape:await loadItems(th.landscapeImages||[])};}
        else if(selected&&th&&th.adSlotAssets){for(var id of Object.keys(th.adSlotAssets))bank[id]=await loadItems(th.adSlotAssets[id]);}
        else if(th&&selected){for(var role of ['portrait','landscape'])if(specs(role).length)bank[spec(role).id]=await loadItems(th[role+'Images']||[]);}
        else if(th){cache.__legacy={portrait:await loadItems(th.portraitImages||[]),landscape:await loadItems(th.landscapeImages||[])};}
        if(selected)['portrait','landscape'].forEach(function(role){hooks.set(role,bank[spec(role).id]||[]);});renderMedia();
      },
      serialize:serialize,
      back:function(){if(config.formId==='editForm'||picking)return false;flush();picking=true;refresh();return true;}
    };
  }
  root.KioskThemePositionEditor={mount:mount,escape:esc};
})(window);
