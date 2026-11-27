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
    var policy=KioskAdTargetPolicy, existing=!!theme&&!config.copy, staged=null, orphaned=[];
    var opened=theme?JSON.parse(JSON.stringify(theme)):null, compatibilityRevision=0, compatibilityTimer;
    function latest(){return JSON.parse(localStorage.getItem('kiosk_themes')||'[]').find(function(t){return theme&&t.id===theme.id;});}
    function editable(){var current=existing?latest():null;return !existing||!!current&&policy.canEditTarget(current);}
    function assertSave(){if(existing){var current=latest();if(current&&current.interactionScope&&current.interactionScope!==KioskAdActivities.getContext().scope)throw Error('广告活动属于其他品牌，请切换正确品牌或复制后重新配置');policy.assertSave(current,opened,selected||{});}}
    var purpose=existing?(theme.adPurpose||'campaign'):(new URLSearchParams(location.search).get('asDefault')==='1'?'default':theme&&config.copy&&theme.adPurpose||'campaign');
    var picking=!selected&&editable();
    var section=document.createElement('section');section.className='mx-auto w-full max-w-4xl rounded-2xl border border-[#f0f0f0] bg-white p-4 sm:p-8 shadow-sm';
    section.innerHTML='<h2 class="mb-2 text-base font-medium">选择渠道 <span class="text-red-500">*</span></h2><p class="mb-5 text-sm text-gray-500">一条广告投放到一个渠道、一个展示位置</p><div id="adChannelGrid" class="grid grid-cols-3 gap-3" role="radiogroup" aria-label="投放渠道"></div><div class="mt-8 border-t pt-6"><h2 class="mb-4 text-base font-medium">展示位置 <span class="text-red-500">*</span></h2><div class="grid gap-4 sm:grid-cols-2"><div class="min-w-0"><label id="adSlotSearchLabel" class="mb-3 block"><input id="adSlotSearch" type="search" class="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm" aria-label="搜索展示位置" placeholder="搜索位置名称或场景"></label><div id="adSlotGrid" class="grid content-start gap-2" role="radiogroup" aria-label="展示位置"></div></div><details id="adSlotPreview" class="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-3"><summary class="cursor-pointer text-sm font-medium sm:hidden">查看位置示例</summary><div id="adSlotPreviewContent" aria-live="polite"></div></details></div></div><p id="adSlotError" class="mt-5 text-sm text-red-500" role="alert"></p>';
    var purposeBox=document.createElement('fieldset');purposeBox.className='mb-8';purposeBox.innerHTML='<legend class="mb-4 text-base font-medium">广告用途</legend><div class="grid grid-cols-2 gap-3">'+radio('adPurpose','campaign','限时投放',purpose==='campaign')+radio('adPurpose','default','日常展示',purpose==='default')+'</div>';purposeBox.querySelector('input[value="default"]').nextElementSibling.insertAdjacentHTML('beforeend','<span class="mt-1 block text-xs font-normal text-gray-500">无有效限时广告时展示</span>');purposeBox.hidden=existing;section.prepend(purposeBox);
    purposeBox.addEventListener('change',async function(e){if(e.target.name!=='adPurpose')return;var nextPurpose=e.target.value;flush();if(nextPurpose==='default'&&allBankItems().some(function(item){return item.clickAction&&item.clickAction.type!=='none';})&&!await confirmChange('默认广告不支持跳转。切换后将清除当前副本中的点击行为，是否继续？')){purposeBox.querySelectorAll('input').forEach(function(r){r.checked=r.value===purpose;});return;}purpose=nextPurpose;purposeBox.querySelectorAll('label').forEach(function(label){var checked=label.querySelector('input').value===purpose;label.classList.toggle('border-primary',checked);label.classList.toggle('bg-[#e6f4ff]',checked);label.classList.toggle('border-[#d9d9d9]',!checked);});if(purpose==='default')allBankItems().forEach(function(item){item.clickAction={type:'none'};});renderMedia();});
    function allBankItems(){return Object.values(bank).concat(Object.values(cache).filter(function(v){return v&&typeof v==='object';}).flatMap(function(v){return Object.values(v);})).flat().filter(function(v){return v&&typeof v==='object'&&('type' in v||'assetId' in v);});}
    form.before(section);
    var next=document.createElement('button');next.type='button';next.id='positionNextBtn';next.className=action.className;next.textContent='下一步';action.before(next);
    var summary=document.createElement('div');summary.className='mb-5 flex items-center justify-between gap-4 text-sm';summary.innerHTML='<span id="adPositionSummary"></span><button type="button" id="adChangeTarget" class="shrink-0 text-primary">修改渠道与位置</button>';form.prepend(summary);
    var notice=document.createElement('div');notice.className='mb-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600';summary.after(notice);
    var batchButton=document.createElement('button');batchButton.type='button';batchButton.className='ad-batch-entry';batchButton.textContent='批量设置点击行为';form.querySelector('[data-ad-material-actions]').append(batchButton);
    batchButton.onclick=function(){root.KioskAdActivityEditor.openBatch(editorApi,batchButton).catch(function(error){if(root.Toast)Toast.validate(error.message);});};
    var validationNotice=document.createElement('p');validationNotice.className='mb-4 text-sm text-red-500';validationNotice.setAttribute('role','alert');notice.after(validationNotice);
    function scheduleCompatibility(){clearTimeout(compatibilityTimer);var revision=++compatibilityRevision;compatibilityTimer=setTimeout(function(){checkCompatibility(revision);},80);}
    async function checkCompatibility(revision){flush();var errors=[];if(selected){var supported=KioskAdActivities.capabilities(selected,KioskAdActivities.getContext());try{if(Object.values(bank).some(function(list){return list.some(function(item){return !supported.includes(KioskAdActivities.normalizeAction(item.clickAction).type);});}))errors.push('该渠道或位置不支持当前点击行为，请设置为不跳转或更换位置');}catch(actionError){errors.push(actionError.message);}}for(var target of selected?selected.specs:[]){var items=bank[target.id]||[],types=Array.from(new Set(items.map(function(v){return v.type||'image';})));if(types.length>1)errors.push(target.name+'不能混用图片与视频，请删除或替换素材');if(items.length>(types[0]==='video'?target.maxVideos:target.maxImages))errors.push(target.name+'素材数量超过上限，请删除多余素材');for(var item of items){try{var meta=await metadata(item);if(allowedKinds(target).indexOf(meta.kind)<0)throw Error('不支持此素材类型');api.validateMedia(target,meta);}catch(e){errors.push(target.name+'：'+e.message+'，请删除或替换该素材');}}}if(revision===compatibilityRevision)validationNotice.textContent=Array.from(new Set(errors)).join('；');}
    var materialNotice=document.createElement('div');materialNotice.className='mb-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm';notice.after(materialNotice);materialNotice.hidden=true;
    var cancel=document.createElement('button');cancel.type='button';cancel.textContent='取消修改';cancel.id='cancelTargetChange';cancel.className='mr-4 rounded-xl border px-5 py-3 text-sm';next.before(cancel);
    function cloneBank(value){var out={};Object.keys(value).forEach(function(k){out[k]=Array.isArray(value[k])?value[k].slice():value[k];});return out;}
    function cancelChange(){if(!staged)return false;selected=staged.selected;channel=staged.channel;bank=staged.bank;cache=staged.cache;active=staged.active;orphaned=staged.orphaned;staged=null;picking=false;refresh();['portrait','landscape'].forEach(function(role){if(hooks)hooks.set(role,bank[spec(role).id]||[]);});renderMedia();return true;}
    cancel.onclick=cancelChange;
    summary.querySelector('button').onclick=function(){if(!editable())return;flush();staged={selected:selected,channel:channel,bank:cloneBank(bank),cache:Object.assign({},cache),active:Object.assign({},active),orphaned:orphaned.slice()};picking=true;refresh();};
    function renderOrphans(){materialNotice.hidden=!orphaned.length;if(!orphaned.length)return;materialNotice.innerHTML='<p>目标位置不支持部分素材方向，'+orphaned.length+' 个素材尚未分配。请移除后重新上传符合目标规格的素材。</p><button type="button" class="mt-2 text-primary">移除不适用素材</button>';materialNotice.querySelector('button').onclick=async function(){if(await confirmChange('移除不适用于目标位置的素材？原广告在保存前保持不变。')){orphaned=[];renderOrphans();}};}
    function roleFor(spec){return spec.height>spec.width?'portrait':'landscape';}
    function specs(role){return selected?selected.specs.filter(function(s){return roleFor(s)===role;}):[];}
    function spec(role){var list=specs(role);return list.find(function(s){return s.id===active[role];})||list[0]||api.newSpec(role,role==='portrait'?1080:1920,role==='portrait'?1920:1080);}
    function flush(){if(hooks&&selected)['portrait','landscape'].forEach(function(role){if(specs(role).length)bank[spec(role).id]=hooks.get(role);});}
    function allowedKinds(s){var source=slots.find(function(v){return selected&&v.id===selected.id;}),binding=source&&source.bindings[channel];return s.mediaKinds.filter(function(k){return !binding||binding.mediaKinds.indexOf(k)>=0;});}
    function syncBatchButton(){batchButton.hidden=purpose==='default';batchButton.disabled=purpose==='default'||!KioskAdActivities.getContext().canWrite||existing&&theme.interactionScope&&theme.interactionScope!==KioskAdActivities.getContext().scope;}
    function renderMedia(){
      syncBatchButton();
      if(!hooks)return;
      var firstMaterialBlock=true;
      ['portrait','landscape'].forEach(function(role){
        var list=specs(role),s=spec(role),label=document.querySelector('[data-position-ratio="'+role+'"]'),block=label.closest('.border-t');block.style.display=list.length?'':'none';block.classList.toggle('ad-material-first',!!list.length&&firstMaterialBlock);if(list.length)firstMaterialBlock=false;
        var select=block.querySelector('[data-ad-spec-selector]');if(!select){select=document.createElement('select');select.setAttribute('data-ad-spec-selector',role);select.setAttribute('aria-label',role==='portrait'?'竖版素材规格':'横版素材规格');select.className='mb-4 h-10 rounded-xl border border-gray-300 px-3 text-sm';label.parentElement.after(select);select.addEventListener('change',function(){flush();active[role]=this.value;hooks.set(role,bank[this.value]||[]);renderMedia();});}
        select.innerHTML=list.map(function(v){return '<option value="'+esc(v.id)+'"'+(v.id===s.id?' selected':'')+'>'+esc(v.name)+' · '+v.width+'×'+v.height+' · '+esc(v.applicability)+'</option>';}).join('');select.style.display=list.length>1?'':'none';
        var kinds=allowedKinds(s),items=bank[s.id]||hooks.get(role);var kind=items.length?items[0].type:kinds[0]||'image';
        document.querySelectorAll('input[name="'+role+'Type"]').forEach(function(r){r.disabled=kinds.indexOf(r.value)<0;r.closest('label').style.display=r.disabled?'none':'';r.checked=r.value===kind;});
        hooks.refresh(role);
      });
    }
    function radio(name,value,label,checked){return '<label class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 '+(checked?'border-primary bg-[#e6f4ff]':'border-[#d9d9d9]')+'"><input type="radio" name="'+name+'" value="'+esc(value)+'"'+(checked?' checked':'')+'><span>'+esc(label)+'</span></label>';}
    var slotGrid=section.querySelector('#adSlotGrid'),slotSearch=section.querySelector('#adSlotSearch'),preview=section.querySelector('#adSlotPreview'),previewContent=section.querySelector('#adSlotPreviewContent');
    var desktopPreview=window.matchMedia('(min-width: 640px)');
    function syncPreviewLayout(){preview.open=desktopPreview.matches;}
    desktopPreview.addEventListener('change',syncPreviewLayout);
    syncPreviewLayout();
    function safeExample(slot){return slot&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(slot.exampleImage||'');}
    function slotOption(slot){
      var checked=selected&&slot.id===selected.id;
      return '<label class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 '+(checked?'border-primary bg-[#e6f4ff]':'border-[#d9d9d9]')+'"><input type="radio" name="adSlot" value="'+esc(slot.id).replace(/"/g,'&quot;')+'"'+(checked?' checked':'')+'><span class="min-w-0 break-words text-sm">'+esc(slot.name)+(slot.scene?'<span class="block text-xs text-gray-500">'+esc(slot.scene)+'</span>':'')+'</span></label>';
    }
    function renderSlotPicker(options){
      var showSearch=options.length>=6;
      section.querySelector('#adSlotSearchLabel').style.display=showSearch?'':'none';
      var term=showSearch?slotSearch.value.trim().toLowerCase():'';
      var visible=options.filter(function(slot){return [slot.name,slot.scene].some(function(text){return String(text||'').toLowerCase().includes(term);});});
      var message=!channel?'请先选择渠道':!options.length?'该渠道暂无可用广告位，请联系平台管理员配置并登记接入':'没有匹配的展示位置';
      slotGrid.innerHTML=visible.length?visible.map(slotOption).join(''):'<p class="text-sm text-gray-500">'+message+'</p>';
    }
    function renderSlotPreview(options){
      var slot=selected&&options.find(function(item){return item.id===selected.id;});
      preview.hidden=!options.length;
      if(!options.length){previewContent.replaceChildren();return;}
      var heading=slot?esc(slot.name):'尚未选择展示位置';
      var body=safeExample(slot)?'<img src="'+slot.exampleImage+'" alt="'+esc(slot.name).replace(/"/g,'&quot;')+'的投放位置" class="h-full w-full object-contain">':'<p class="px-3 text-center text-sm text-gray-500">'+(slot?'该位置暂无示例图':'请选择左侧展示位置')+'</p>';
      previewContent.innerHTML='<h3 class="my-2 break-words text-sm font-medium">'+heading+'</h3><div class="flex h-44 items-center justify-center rounded-lg border border-gray-200 bg-white p-2">'+body+'</div>'+(safeExample(slot)?'<button type="button" data-example-slot="'+slots.indexOf(slot)+'" class="mt-2 rounded-md px-2 py-2 text-sm text-primary">查看大图</button>':'');
    }
    slotSearch.addEventListener('input',function(){renderSlotPicker(api.available(slots,channel));});
    section.addEventListener('click',function(event){
      var trigger=event.target.closest('[data-example-slot]');if(!trigger)return;
      var slot=slots[Number(trigger.dataset.exampleSlot)];if(!slot)return;
      var dialog=document.createElement('dialog');dialog.className='ui-dialog-panel rounded-xl border-0 p-4';dialog.setAttribute('aria-label',slot.name+' · 区域示例图');
      var image=document.createElement('img');image.src=slot.exampleImage;image.alt=slot.name+'的投放位置';image.style.cssText='max-width:calc(100vw - 64px);max-height:75vh;object-fit:contain';
      var close=document.createElement('button');close.type='button';close.className='ui-dialog-btn';close.textContent='关闭';close.onclick=function(){dialog.close();};
      dialog.addEventListener('close',function(){dialog.remove();if(trigger.isConnected)trigger.focus();});dialog.append(image,close);document.body.append(dialog);dialog.showModal();
    });
    function refresh(){
      section.style.display=picking?'':'none';form.style.display=picking?'none':'';action.style.display=picking?'none':'';next.style.display=picking?'':'none';title.textContent=picking?'选择渠道与广告位':oldTitle;
      document.getElementById('adChannelGrid').innerHTML=api.CHANNELS.map(function(c){return radio('adChannel',c,c,c===channel);}).join('');
      var options=api.available(slots,channel);renderSlotPicker(options);renderSlotPreview(options);
      section.querySelector('#adSlotError').textContent=catalogError;next.disabled=!selected||selected.productLine!==channel||!options.some(function(s){return s.id===selected.id;});next.style.opacity=next.disabled?'0.45':'';
      summary.querySelector('span').textContent=selected?(purpose==='default'?'日常展示':'限时投放')+'　投放渠道：'+channel+'　展示位置：'+api.displayName(selected):'未选择渠道与广告位';
      summary.querySelector('button').hidden=!existing||!editable();
      notice.hidden=!existing||editable();
      if(!notice.hidden){notice.textContent=latest()&&policy.history(latest())==='published'?'已投放广告的渠道与位置不可修改。':'历史投放状态无法确认，渠道与位置不可修改。';var link=document.createElement('a');link.textContent='复制广告';link.className='ml-3 text-primary';link.href=(window.appendMenusifuEmbeddedParam||function(v){return v;})('screensaver-create.html?copyFrom='+encodeURIComponent(theme.id));notice.append(link);}
      cancel.hidden=!picking||!staged;
      if(!selected&&!editable()){action.disabled=true;catalogError='该广告缺少有效投放配置，请复制广告重新配置';notice.hidden=false;}
      renderOrphans();
      var progress=document.querySelector('.step-progress-inner');if(progress)progress.style.width=picking?'25%':'50%';
    }
    section.addEventListener('change',async function(event){
      var input=event.target;if(input.name!=='adChannel'&&input.name!=='adSlot')return;if(!editable()){cancelChange();refresh();return;}flush();if(selected&&hooks&&Object.values(bank).some(function(v){return v.length;})&&!(await confirmChange('更换渠道或广告位后，素材将按目标规格重新校验。是否继续？'))){refresh();return;}if(selected&&Object.values(bank).some(function(v){return v.length;})){cache.__legacy={portrait:[],landscape:[]};selected.specs.forEach(function(s){cache.__legacy[roleFor(s)]=cache.__legacy[roleFor(s)].concat(bank[s.id]||[]);});}if(input.name==='adChannel'){flush();if(selected)cache[selected.id+'@'+selected.version]=bank;channel=input.value;slotSearch.value='';syncPreviewLayout();var defaultScreen=api.available(slots,channel).find(function(s){return s.code==='screensaver';});selected=defaultScreen?api.snapshot(defaultScreen):null;bank=selected?cache[selected.id+'@'+selected.version]||{}:{};active={};catalogError='';}
      else if(input.name==='adSlot'){var slot=slots.find(function(s){return s.id===input.value;});if(slot){flush();if(selected)cache[selected.id+'@'+selected.version]=bank;selected=api.snapshot(slot);bank=cache[selected.id+'@'+selected.version]||{};active={};}}
      refresh();
      var restored=Array.from(section.querySelectorAll('input[type="radio"]')).find(function(radio){return radio.name===input.name&&radio.value===input.value;});
      if(restored)restored.focus();
    });
    next.addEventListener('click',function(){if(next.disabled)return;if(cache.__legacy){['portrait','landscape'].forEach(function(role){if(specs(role).length){var carried=cache.__legacy[role]||[],targetItems=bank[spec(role).id]||[];carried.forEach(function(item){if(!targetItems.some(function(v){return v===item||(v.assetId&&item.assetId?v.assetId===item.assetId:(v.mediaRef&&v.mediaRef===item.mediaRef)||(v.url&&v.url===item.url));}))targetItems.push(item);});bank[spec(role).id]=targetItems;}else orphaned=orphaned.concat(cache.__legacy[role]||[]);});delete cache.__legacy;}picking=false;staged=null;refresh();['portrait','landscape'].forEach(function(role){if(hooks)hooks.set(role,bank[spec(role).id]||[]);});renderMedia();scheduleCompatibility();});
    window.addEventListener('storage',function(event){if(event.key==='kiosk_themes'){if(!editable())cancelChange();refresh();}if(event.key===api.PLATFORM_KEY){try{slots=api.readCatalog(localStorage);catalogError='广告位配置已更新，保存前将重新校验';}catch(e){catalogError=e.message;}refresh();}});
    refresh();
    async function loadItems(items){var list=await hooks.load(items);if(config.copy&&purpose==='default')list.forEach(function(item){item.clickAction={type:'none'};});if(config.copy){for(var item of list){if(item.type==='video'&&item.mediaRef){var blob=await KioskThemeMediaIdb.get(item.mediaRef);if(!blob)throw Error('源视频已失效，无法复制');item.file=blob;delete item.mediaRef;}}}return list;}
    async function metadata(item){
      var source=item.url||item.dataUrl;var blob=item.file;
      if(!blob){if(!source&&item.mediaRef&&root.KioskThemeMediaIdb)blob=await KioskThemeMediaIdb.get(item.mediaRef);else{var response=await fetch(source);if(!response.ok)throw Error('无法读取素材，请重新上传');blob=await response.blob();}}
      if(!blob)throw Error('素材文件已失效，请重新上传');var objectUrl=URL.createObjectURL(blob),kind=item.type||'image';
      try{return await new Promise(function(resolve,reject){var el=kind==='video'?document.createElement('video'):new Image();var timeout=setTimeout(function(){reject(Error('素材读取超时，请重新上传'));},15000);function done(){clearTimeout(timeout);resolve({kind:kind,mime:blob.type,bytes:blob.size,width:kind==='video'?el.videoWidth:el.naturalWidth,height:kind==='video'?el.videoHeight:el.naturalHeight,duration:kind==='video'?el.duration:undefined});}if(kind==='video'){el.preload='metadata';el.onloadedmetadata=done;}else el.onload=done;el.onerror=function(){clearTimeout(timeout);reject(Error('素材无法解码，请重新上传'));};el.src=objectUrl;});}finally{URL.revokeObjectURL(objectUrl);}
    }
    async function serialize(process){
      assertSave();validationNotice.textContent='';if(orphaned.length)throw Error('请先移除未分配到目标规格的素材');if(!selected)throw Error('请选择渠道与广告位');var current=api.readCatalog(localStorage),slot=api.validateSnapshot(current,selected);flush();
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
          var stored=await process(source,roleFor(s)==='portrait');stored.assetId=item.assetId||crypto.randomUUID();stored.clickAction=KioskAdActivities.normalizeAction(item.clickAction);stored.adSpecId=s.id;stored.metadata=meta;stored.fit=s.fit;bySpec[s.id].push(stored);(roleFor(s)==='portrait'?portrait:landscape).push(stored);
        }
      }
      if(!count)throw Error('请至少配置一套规格的广告素材');
      if(purpose==='default')KioskDefaultAds.validateDefault({adPurpose:purpose,adSlot:selected,interactionScope:KioskAdActivities.getContext().scope,adSlotAssets:bySpec});
      var activityContext=KioskAdActivities.getContext(),interactionScope=activityContext.scope;
      if(purpose==='default'&&(!interactionScope||!activityContext.canWrite))throw Error('当前品牌或账号无权保存默认广告');
      await KioskAdActivities.validateThemeActions({adSlot:selected,adSlotAssets:bySpec,interactionScope:interactionScope},activityContext);
      if(KioskAdActivities.getContext().scope!==interactionScope)throw Error('品牌上下文已变化，请重新打开广告');
      if(warnings.length&& !(await confirmChange('以下素材与推荐尺寸不同：\n'+warnings.join('\n')+'\n是否保留当前素材并继续保存？')))throw Error('已取消保存，请检查素材尺寸');
      return {adPurpose:purpose,bySpec:bySpec,portrait:portrait,landscape:landscape,slot:JSON.parse(JSON.stringify(selected)),interactionScope:interactionScope};
    }
    root.addEventListener('ad-activity-context',function(){syncBatchButton();if(hooks&&selected)scheduleCompatibility();});
    var editorApi={
      mediaEntries:function(){flush();var entries=[];if(selected)selected.specs.forEach(function(s){(bank[s.id]||[]).forEach(function(item,index){if(!item.assetId)item.assetId=crypto.randomUUID();entries.push({item:item,spec:s,role:roleFor(s),index:index});});});return entries;},
      defaultKind:function(role){return allowedKinds(spec(role))[0]||'image';},
      validateItem:async function(role,item){var meta=await metadata(item);if(allowedKinds(spec(role)).indexOf(meta.kind)<0)throw Error('该渠道不支持此素材类型');return api.validateMedia(spec(role),meta);},
      value:function(){return selected?selected.code:'';},snapshot:function(){return selected;},channel:function(){return channel;},
      mediaSpec:function(role){var s=spec(role);return {width:s.width,height:s.height,ratio:api.ratio(s).replace(':','∶'),box:(role==='portrait'?'w-[7.5rem]':'w-[10rem]')+' ad-spec-box',fit:s.fit};},
      spec:spec,maxCount:function(role,kind){return kind==='video'?spec(role).maxVideos:spec(role).maxImages;},
      hasMedia:function(){flush();return Object.keys(bank).some(function(k){return bank[k]&&bank[k].length;});},
      attachMedia:function(value){hooks=value;renderMedia();},
      hydrate:async function(th){
        if(config.copy&&th&&th.adSlotAssets){var copied={};for(var key of Object.keys(th.adSlotAssets))copied[key]=await loadItems(th.adSlotAssets[key]);var live=slots.find(function(s){return s.id===th.adSlot.id;});cache[th.adSlot.id+'@'+(live?live.specVersion:th.adSlot.version)]=copied;cache.__legacy={portrait:[],landscape:[]};th.adSlot.specs.forEach(function(sourceSpec){cache.__legacy[roleFor(sourceSpec)]=cache.__legacy[roleFor(sourceSpec)].concat(copied[sourceSpec.id]||[]);});}
        else if(selected&&th&&th.adSlotAssets){for(var id of Object.keys(th.adSlotAssets))bank[id]=await loadItems(th.adSlotAssets[id]);}
        else if(th&&selected){for(var role of ['portrait','landscape'])if(specs(role).length)bank[spec(role).id]=await loadItems(th[role+'Images']||[]);}
        else if(th){cache.__legacy={portrait:await loadItems(th.portraitImages||[]),landscape:await loadItems(th.landscapeImages||[])};}
        if(selected)['portrait','landscape'].forEach(function(role){hooks.set(role,bank[spec(role).id]||[]);});renderMedia();
      },
      purpose:function(){return purpose;},canEditActivity:function(){return purpose!=='default'&&(!existing||!theme.interactionScope||theme.interactionScope===KioskAdActivities.getContext().scope);},allMedia:function(){flush();return selected?selected.specs.flatMap(function(s){return bank[s.id]||[];}):[];},refreshMedia:renderMedia,refreshCompatibility:scheduleCompatibility,assertSave:assertSave,serialize:serialize,
      back:function(){if(staged)return cancelChange();if(existing||config.formId==='editForm'||picking)return false;flush();picking=true;refresh();return true;}
    };
    return editorApi;
  }
  root.KioskThemePositionEditor={mount:mount,escape:esc};
})(window);
