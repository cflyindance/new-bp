/* Shared activity container: preview is read-only; real participation belongs to the provider. */
(function(root){
  'use strict';
  var sessions=new Map(),activityPageUrl=new URL('../activity.html',document.currentScript.src);
  async function open(options){
    var api=KioskAdActivities,context=api.getContext(),action=api.normalizeAction(options.action),valid=true;
    try{action=await api.validateAction(action,options.slot,context,{runtime:!options.preview,storeIds:options.storeId?[options.storeId]:[]});}catch(error){valid=false;}
    if(action.type==='none')throw Error('此素材未配置跳转');
    var token=crypto.randomUUID(),dialog=document.createElement('dialog'),previous=document.activeElement;
    var session={action:action,slot:options.slot,source:options.source||{adId:'',assetId:'',slotId:options.slot.id},storeId:options.storeId||'',preview:options.preview!==false,scope:context.scope};
    sessions.set(token,session);dialog.className='ad-activity-container';dialog.setAttribute('aria-label',session.preview?'活动预览':'活动详情');
    var top=document.createElement('div');top.className='ad-activity-container-header';var heading=document.createElement('strong');heading.textContent=session.preview?'活动预览':'活动详情';var close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','关闭活动');top.append(heading,close);
    var frame=document.createElement('iframe');frame.title='统一活动页面';var pageUrl=new URL(activityPageUrl);pageUrl.searchParams.set('token',token);frame.src=pageUrl.href;dialog.append(top,frame);
    function finish(){clearTimeout(timer);window.removeEventListener('message',message);dialog.close();dialog.remove();sessions.delete(token);if(previous&&previous.isConnected)previous.focus();}
    function message(event){if(event.origin!==location.origin||event.source!==frame.contentWindow||!event.data||event.data.token!==token)return;if(event.data.type==='ad-activity-close')finish();else if(event.data.type==='ad-activity-interaction'){clearTimeout(timer);timer=setTimeout(finish,120000);}}
    var timer=setTimeout(finish,120000);dialog.onpointerdown=function(){clearTimeout(timer);timer=setTimeout(finish,120000);};close.onclick=finish;dialog.oncancel=function(e){e.preventDefault();finish();};window.addEventListener('message',message);document.body.append(dialog);dialog.showModal();close.focus();
    if(valid)api.recordEvent(localStorage,context,Object.assign({},session.source,{type:'click',activityId:action.type==='activity'?action.activityId:undefined,channel:session.slot.productLine,positionCode:session.slot.code,storeId:session.storeId}),session.preview);
    return token;
  }
  root.KioskAdActivityRuntime={open:open,getSession:function(token){return sessions.get(token);}};
})(window);
