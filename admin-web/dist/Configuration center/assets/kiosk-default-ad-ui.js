/* Native adapter: one local storage transaction; production persistence belongs to the host API. */
(function(root){
  'use strict';
  function dialog(title,render,confirmLabel){return new Promise(function(resolve){
    var previous=document.activeElement,node=document.createElement('dialog');
    node.className='ui-dialog-panel w-full max-w-2xl overflow-hidden rounded-xl border-0 p-0';node.setAttribute('aria-label',title);
    node.innerHTML='<div class="ui-dialog-header"><h3 class="ui-dialog-title"></h3></div><div class="ui-dialog-body overflow-auto" style="max-height:55vh"></div><div class="ui-dialog-footer"><button type="button" class="ui-dialog-btn" data-cancel>取消</button><button type="button" class="ui-dialog-btn ui-dialog-btn--primary" data-ok></button></div>';
    node.querySelector('h3').textContent=title;render(node.querySelector('.ui-dialog-body'));
    if(confirmLabel){var header=node.querySelector('.ui-dialog-header');header.style.cssText='display:flex;align-items:center;gap:16px;padding:24px;background:var(--ui-bg-muted,#f5f6f7)';var close=node.querySelector('[data-cancel]'),ok=node.querySelector('[data-ok]');close.textContent='×';close.setAttribute('aria-label','关闭');close.style.cssText='width:48px;height:48px;border-radius:12px;background:rgba(0,0,0,.04);font-size:20px';ok.style.cssText='margin-left:auto;height:48px;border-radius:12px';header.prepend(close);header.append(ok);node.querySelector('.ui-dialog-footer').remove();}
    node.querySelector('[data-ok]').textContent=confirmLabel||'知道了';node.querySelector('[data-cancel]').hidden=!confirmLabel;
    function finish(value){node.close();node.remove();if(previous&&previous.isConnected)previous.focus();resolve(value);}
    node.querySelector('[data-cancel]').onclick=function(){finish(false);};node.querySelector('[data-ok]').onclick=function(){finish(true);};node.oncancel=function(event){event.preventDefault();finish(false);};
    document.body.append(node);node.showModal();node.querySelector(confirmLabel?'[data-cancel]':'[data-ok]').focus();
  });}
  function message(text){return dialog('提示',function(body){body.textContent=text;});}
  async function enable(id,stores){
    var raw=localStorage.getItem('kiosk_themes'),list=JSON.parse(raw||'[]'),candidate=list.find(function(ad){return ad.id===id;}),context=KioskAdActivities.getContext();
    if(!context.canWrite||!candidate||candidate.interactionScope!==context.scope)throw Error('当前品牌或账号无权启用该广告');
    KioskDefaultAds.validateDefault(candidate);
    var slot=KioskAdSlots.validateSnapshot(KioskAdSlots.readCatalog(localStorage),candidate.adSlot);
    Object.keys(candidate.adSlotAssets).forEach(function(id){
      var spec=slot.specs.find(function(s){return s.id===id;}),items=candidate.adSlotAssets[id];
      if(!spec)throw Error('素材规格已变化，请重新编辑广告');
      if(!items.length)return;
      var kind=items[0].type||'image';
      if(items.length>(kind==='video'?spec.maxVideos:spec.maxImages)||items.some(function(item){return (item.type||'image')!==kind;}))throw Error('素材类型或数量不符合位置规格');
      if(!slot.bindings[candidate.adSlot.productLine].mediaKinds.includes(kind))throw Error('该渠道不支持此素材类型');
      items.forEach(function(item){if(!item.metadata)throw Error('素材信息缺失，请重新编辑广告');KioskAdSlots.validateMedia(spec,item.metadata);});
    });
    await KioskAdActivities.validateThemeActions(candidate,context,'publish');
    var next=KioskDefaultAds.enable(list,id,stores,context.scope),rows=KioskDefaultAds.conflicts(list,candidate,stores.map(function(s){return String(s.mid);}));
    if(rows.length){
      var accepted=await dialog('替换默认广告',function(body){
        var intro=document.createElement('p');intro.className='mb-4 text-sm text-gray-600';intro.textContent='以下门店将使用新的默认广告；其他门店保持原配置。';body.append(intro);
        var table=document.createElement('table');table.className='w-full text-left text-sm';var head=table.createTHead().insertRow();['门店','当前默认广告','替换后'].forEach(function(text){var th=document.createElement('th');th.className='border-b p-3 font-medium';th.textContent=text;head.append(th);});
        rows.forEach(function(row){row.storeIds.forEach(function(mid){var tr=table.insertRow(),store=stores.find(function(s){return String(s.mid)===mid;});[store?store.name+' / '+mid:mid,row.ad.name||'未命名广告',candidate.name||'未命名广告'].forEach(function(text){var cell=tr.insertCell();cell.className='border-b p-3';cell.textContent=text;});});});body.append(table);
      },'确认替换');if(!accepted)return false;
    }
    var currentContext=KioskAdActivities.getContext();
    if(!currentContext.canWrite||currentContext.scope!==context.scope)throw Error('品牌或权限已变化，请重新打开广告');
    KioskAdSlots.validateSnapshot(KioskAdSlots.readCatalog(localStorage),candidate.adSlot);
    if(localStorage.getItem('kiosk_themes')!==raw)throw Error('广告配置已在其他窗口修改，请返回刷新后重试');
    localStorage.setItem('kiosk_themes',JSON.stringify(next));
    ['selected_stores_for_distribute','selected_channels_for_distribute','current_theme_id_for_distribute'].forEach(function(key){localStorage.removeItem(key);});
    return true;
  }
  root.KioskDefaultAdUI={enable:enable,message:message};
})(window);
