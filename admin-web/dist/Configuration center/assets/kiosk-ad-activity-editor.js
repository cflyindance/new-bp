/* Per-asset actions; a dialog stages changes until confirmation. */
(function(root){
  'use strict';
  var api=KioskAdActivities;
  function esc(value){var node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function toast(error){if(root.Toast)Toast.validate(error.message||error);}
  function decorate(container,items,editor){
    container.querySelectorAll('[data-index][data-role]').forEach(function(card){
      if(!card.classList.contains('group'))return;
      var item=items[Number(card.dataset.index)];if(!item)return;if(!item.assetId)item.assetId=crypto.randomUUID();
      var existing=card.querySelector('.ad-asset-actions');if(existing)existing.remove();
      var bar=document.createElement('div');bar.className='ad-asset-actions';
      var configure=document.createElement('button');configure.type='button';configure.textContent=api.actionLabel(item.clickAction)+' · 设置';configure.title=configure.textContent;configure.setAttribute('aria-label','配置素材 '+(Number(card.dataset.index)+1)+' 的点击行为');
      var preview=document.createElement('button');preview.type='button';preview.textContent='预览';preview.setAttribute('aria-label','预览素材 '+(Number(card.dataset.index)+1)+' 的活动');
      configure.disabled=!api.getContext().canWrite||!editor.canEditActivity();configure.__adEditor=editor;configure.title=configure.disabled?'请从有编辑权限的品牌广告入口进入':configure.title;
      preview.disabled=!item.clickAction||item.clickAction.type==='none';
      configure.onclick=function(e){e.preventDefault();e.stopPropagation();edit(item,editor,configure).catch(toast);};
      preview.onclick=function(e){e.preventDefault();e.stopPropagation();KioskAdActivityRuntime.open({action:item.clickAction,slot:editor.snapshot(),preview:true,source:{adId:new URLSearchParams(location.search).get('id')||'',slotId:editor.snapshot().id,assetId:item.assetId}}).catch(toast);};
      bar.append(configure,preview);card.append(bar);
    });
  }
  async function edit(item,editor,trigger){
    var slot=editor.snapshot(),context=api.getContext();if(!context.canWrite||!editor.canEditActivity())throw Error('当前品牌或账号无权修改该广告的点击行为');
    var openedScope=context.scope,draft=api.normalizeAction(item.clickAction),rows=[],loaded=false,generation=0,dirty=false,closing=false;
    var dialog=document.createElement('dialog');dialog.className='ad-action-dialog';dialog.setAttribute('aria-label','配置点击行为');
    dialog.innerHTML='<form method="dialog"><header><button type="button" data-close aria-label="关闭点击设置">×</button><h2>点击行为</h2><button type="submit" class="ad-action-primary">确认</button></header><div class="ad-action-body"><p class="ad-action-help" data-capability></p><label>点击行为<select name="actionType"><option value="none">不跳转</option><option value="activity">打开项目内活动</option><option value="external">打开外部活动</option></select></label><section data-internal hidden><label>活动类型<select name="activityType"><option value="promotion">促销活动</option><option value="points">积分兑换活动</option><option value="coupon">优惠券活动</option></select></label><label data-promotion-filter>促销类型<select name="promotionType"><option value="">全部类型</option><option value="buyGifts">买A赠B</option><option value="buyDiscount">M件N折</option><option value="orderDiscount">满减折扣</option><option value="exchangePurchase">加价换购</option></select></label><label>搜索活动<input name="search" type="search" placeholder="活动名称"></label><label>选择活动<select name="activityId" size="5" aria-label="选择活动"></select></label><p data-status class="ad-action-help" role="status"></p><button type="button" data-retry>刷新活动</button><p data-details class="ad-action-help"></p></section><section data-external hidden><label>活动名称<input name="title" maxlength="80" placeholder="请输入活动名称"></label><label>活动链接<input name="url" type="url" placeholder="https://"></label><p data-domains class="ad-action-help"></p></section><label class="ad-action-check"><input type="checkbox" name="applyAll">应用到本广告全部素材（含其他规格）</label><p data-error role="alert" class="ad-action-error"></p><div class="ad-action-footer"><button type="button" data-preview>预览活动页面</button><button type="button" data-discard hidden>放弃修改并关闭</button></div></div></form>';
    var form=dialog.querySelector('form'),type=form.elements.actionType,activityType=form.elements.activityType,activityId=form.elements.activityId,promotionType=form.elements.promotionType,error=dialog.querySelector('[data-error]'),status=dialog.querySelector('[data-status]'),details=dialog.querySelector('[data-details]'),preview=dialog.querySelector('[data-preview]'),submit=form.querySelector('[type=submit]');
    var allowed=api.capabilities(slot,context);Array.from(type.options).forEach(function(option){option.disabled=allowed.indexOf(option.value)<0;});
    dialog.querySelector('[data-capability]').textContent=allowed.length===1?'该渠道或位置暂不支持点击跳转，可保留素材并选择不跳转。':'每张素材可以关联不同活动，参与条件由活动模块判断。';
    if(context.configurationNote){var info=document.createElement('p');info.className='ad-action-help';info.textContent=context.configurationNote;dialog.querySelector('[data-capability]').after(info);}
    if(context.externalExample){var example=document.createElement('button');example.type='button';example.textContent='填入演示外部活动';example.onclick=function(){form.elements.title.value=context.externalExample.title;form.elements.url.value=context.externalExample.url;dirty=true;error.textContent='';};dialog.querySelector('[data-external]').append(example);}
    dialog.querySelector('[data-domains]').textContent=context.externalOrigins.length?'允许域名：'+context.externalOrigins.join('、'):'外部活动域名尚未登记，请联系平台管理员。';
    type.value=draft.type;activityType.value=draft.type==='activity'?draft.activityType:'promotion';form.elements.title.value=draft.type==='external'?draft.title:'';form.elements.url.value=draft.type==='external'?draft.url:'';
    function selection(){if(type.value==='none')return {type:'none'};if(type.value==='external')return {type:'external',scope:openedScope,title:form.elements.title.value,url:form.elements.url.value};return {type:'activity',scope:openedScope,activityType:activityType.value,activityId:activityId.value};}
    function renderRows(){
      var selected=activityId.value||(draft.type==='activity'?draft.activityId:''),filtered=api.filterActivities(rows,form.elements.search.value,activityType.value==='promotion'?promotionType.value:'');
      if(loaded&&!filtered.some(function(row){return row.id===selected;})){selected='';draft={type:'none'};}
      activityId.innerHTML='<option value="">请选择活动</option>'+filtered.map(function(row){var state=api.activityState(row),disabled=row.status!=='published'||state==='已结束';return '<option value="'+esc(row.id)+'"'+(selected===row.id?' selected':'')+(disabled?' disabled':'')+'>'+esc(row.name)+' · '+esc(row.requiresBusinessCheck&&state==='进行中'?'已启用 · 时段待复核':state)+'</option>';}).join('');
      if(loaded)status.textContent=!rows.length?'暂无可选活动，请确认活动已发布；如仍无法选择，请联系管理员。':!filtered.length?'没有符合条件的活动，请调整筛选条件。':'共 '+filtered.length+' 个活动'+(filtered.length!==rows.length?'（全部 '+rows.length+' 个）':'');
      showDetails();
    }
    function showDetails(){var row=rows.find(function(v){return v.id===activityId.value;});details.textContent=row?(row.description||'')+'　适用门店：'+(row.storeIds.length?row.storeIds.length+' 家':'品牌全部门店'):'';}
    async function load(){var request=++generation;loaded=false;status.textContent='正在加载活动…';dialog.querySelector('[data-retry]').disabled=true;activityId.disabled=true;rows=[];renderRows();try{var requestContext=api.getContext();if(requestContext.scope!==openedScope||!requestContext.canWrite)throw Error('品牌或权限已变化，请重新打开广告');var list=await api.listActivities(requestContext,activityType.value);if(request!==generation||!dialog.isConnected)return;if(api.getContext().scope!==openedScope||!api.getContext().canWrite)throw Error('品牌或权限已变化，请重新打开广告');rows=list;loaded=true;status.textContent=rows.length?'共 '+rows.length+' 个活动':'暂无可选活动，请确认活动已发布；如仍无法选择，请联系管理员。';renderRows();}catch(e){if(request===generation)status.textContent=e.message||'活动加载失败，请重试';}finally{if(request===generation){dialog.querySelector('[data-retry]').disabled=false;activityId.disabled=false;}}}
    function toggle(){dialog.querySelector('[data-internal]').hidden=type.value!=='activity';dialog.querySelector('[data-external]').hidden=type.value!=='external';preview.disabled=type.value==='none';dialog.querySelector('[data-promotion-filter]').hidden=activityType.value!=='promotion';if(type.value==='activity')load();}
    async function validated(){var current=api.getContext();if(current.scope!==openedScope||!current.canWrite)throw Error('品牌或权限已变化，请重新打开广告');var value=await api.validateAction(selection(),editor.snapshot(),current);if(api.getContext().scope!==openedScope||!api.getContext().canWrite)throw Error('品牌或权限已变化，请重新打开广告');return value;}
    type.onchange=toggle;activityType.onchange=function(){draft={type:'none'};form.elements.search.value='';promotionType.value='';dialog.querySelector('[data-promotion-filter]').hidden=activityType.value!=='promotion';load();};activityId.onchange=showDetails;promotionType.onchange=renderRows;form.elements.search.oninput=renderRows;dialog.querySelector('[data-retry]').onclick=load;
    form.oninput=function(){dirty=true;error.textContent='';};form.onchange=function(){dirty=true;error.textContent='';};
    function close(){if(closing)return;closing=true;generation++;dialog.close();dialog.remove();if(trigger.isConnected)trigger.focus();}
    function requestClose(){if(dirty){error.textContent='当前点击设置尚未确认。继续编辑或选择放弃修改。';dialog.querySelector('[data-discard]').hidden=false;}else close();}
    dialog.querySelector('[data-close]').onclick=requestClose;dialog.querySelector('[data-discard]').onclick=close;dialog.oncancel=function(e){e.preventDefault();requestClose();};
    preview.onclick=async function(){error.textContent='';preview.disabled=true;try{var value=await validated();await KioskAdActivityRuntime.open({action:value,slot:editor.snapshot(),preview:true,source:{adId:'',assetId:item.assetId,slotId:slot.id}});}catch(e){error.textContent=e.message;}finally{preview.disabled=type.value==='none';}};
    form.onsubmit=async function(e){e.preventDefault();error.textContent='';submit.disabled=true;try{var value=await validated();var targets=form.elements.applyAll.checked?editor.allMedia():[item];targets.forEach(function(target){target.clickAction=JSON.parse(JSON.stringify(value));});close();editor.refreshMedia();document.getElementById('screensaverForm')?.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('editForm')?.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}};
    document.body.append(dialog);dialog.showModal();type.focus();toggle();
  }
  window.addEventListener('ad-activity-context',function(){document.querySelectorAll('[data-ad-activity-context-note]').forEach(function(note){note.textContent=api.getContext().scope?'可为每张素材配置点击行为；活动会按所选门店和时间再次校验。':'请从营销广告入口进入明确品牌后配置点击行为。';});document.querySelectorAll('.ad-asset-actions button:first-child').forEach(function(button){button.disabled=!api.getContext().canWrite||!button.__adEditor.canEditActivity();button.title=button.disabled?'请从有编辑权限的品牌广告入口进入':button.textContent;});});
  root.KioskAdActivityEditor={decorate:decorate};
})(window);
