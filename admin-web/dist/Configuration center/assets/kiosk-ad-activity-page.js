(function(){
  'use strict';
  var api=KioskAdActivities,token=new URLSearchParams(location.search).get('token'),session,context,record,timer;
  var title=document.getElementById('title'),state=document.getElementById('state'),body=document.getElementById('body'),error=document.getElementById('error'),participate=document.getElementById('participate'),retry=document.getElementById('retry'),frame=document.getElementById('external-frame');
  function close(){if(parent!==window)parent.postMessage({type:'ad-activity-close',token:token},location.origin);else if(history.length>1)history.back();}
  document.getElementById('return').onclick=close;
  function interacted(){if(parent!==window)parent.postMessage({type:'ad-activity-interaction',token:token},location.origin);}
  document.addEventListener('pointerdown',interacted);document.addEventListener('keydown',interacted);
  async function load(){
    clearTimeout(timer);error.textContent='';retry.hidden=true;participate.hidden=true;frame.hidden=true;frame.removeAttribute('src');
    try{
      if(parent===window||!parent.KioskAdActivityRuntime)throw Error('活动入口已失效，请返回重新打开');
      session=parent.KioskAdActivityRuntime.getSession(token);context=parent.KioskAdActivities.getContext();
      if(!session||session.scope!==context.scope)throw Error('品牌上下文已变化，请返回重新打开');
      api.setContext(context);await api.validateAction(session.action,session.slot,context,{runtime:!session.preview,storeIds:session.storeId?[session.storeId]:[]});
      document.getElementById('mode').textContent=session.preview?'预览模式，不执行领取、兑换或订单优惠。':'';
      if(session.action.type==='external'){
        title.textContent=session.action.title;body.textContent='';
        if(session.preview){state.textContent='外部活动链接已校验';body.textContent=session.action.url+'\n后台预览不加载第三方页面，避免触发外部活动操作。';return;}
        state.textContent='正在加载外部活动…';frame.hidden=false;retry.hidden=false;
        frame.onload=function(){clearTimeout(timer);state.textContent='外部活动';};frame.onerror=function(){clearTimeout(timer);state.textContent='';error.textContent='外部活动加载失败，请重试或返回。';};
        frame.src=api.safeExternalUrl(session.action.url,context.externalOrigins);timer=setTimeout(function(){error.textContent='外部活动加载超时；若页面拒绝嵌入，请联系活动提供方。';retry.hidden=false;},10000);
      }else{
        record=await api.getActivity(context,session.action.activityType,session.action.activityId);title.textContent=record.name;state.textContent=session.preview&&record.requiresBusinessCheck?'时间以原活动规则为准':api.activityState(record);body.textContent=record.description||'活动详情由原活动模块提供。';
        participate.hidden=false;participate.textContent=session.action.activityType==='points'?'去积分兑换':'去参与活动';participate.disabled=session.preview||!context.provider.participate||api.activityState(record)!=='进行中';
        if(!session.preview&&!context.provider.participate)error.textContent='活动参与入口暂未接入，请返回。';
      }
    }catch(e){title.textContent='活动当前不可用';state.textContent='';body.textContent='';error.textContent=e.message||'加载失败，请返回重试';retry.hidden=false;}
  }
  retry.onclick=load;
  participate.onclick=async function(){
    if(!session||session.preview||!context.provider.participate)return;
    participate.disabled=true;error.textContent='';
    try{var latest=parent.KioskAdActivities.getContext();if(latest.scope!==session.scope)throw Error('品牌上下文已变化，请返回');await api.validateAction(session.action,session.slot,latest,{runtime:true,storeIds:session.storeId?[session.storeId]:[]});record=await api.getActivity(latest,session.action.activityType,session.action.activityId);var outcome=await latest.provider.participate(record,{scope:latest.scope,storeId:session.storeId,source:session.source});if(outcome&&outcome.outcome==='completed'){api.recordEvent(localStorage,latest,Object.assign({},session.source,{type:'participation',activityId:record.id,channel:session.slot.productLine,positionCode:session.slot.code,storeId:session.storeId}));state.textContent='活动参与成功';}else if(outcome&&outcome.outcome==='cancelled'){state.textContent='已取消参与';participate.disabled=false;}else if(outcome&&outcome.outcome==='opened'){state.textContent='已交由活动模块处理';close();}else {error.textContent='活动处理结果未确认，请返回原活动页面核对。';}}
    catch(e){error.textContent=e.message||'参与失败，请重试';participate.disabled=false;}
  };
  window.addEventListener('pagehide',function(){clearTimeout(timer);frame.removeAttribute('src');});load();
})();