(function(root){
  'use strict';
  function validateTheme(theme){
    if(!theme||!theme.adSlot)throw Error('请返回广告编辑页，选择一个渠道与广告位');
    var slot=KioskAdSlots.validateSnapshot(KioskAdSlots.readCatalog(localStorage),theme.adSlot);
    if(!Array.isArray(theme.distributeChannels)||theme.distributeChannels.length!==1||theme.distributeChannels[0]!==slot.productLine)throw Error('投放渠道与广告位不一致，请重新编辑');
    if(!Array.isArray(theme.distributePositions)||theme.distributePositions.length!==1||theme.distributePositions[0]!==slot.code)throw Error('展示位置与广告位不一致，请重新编辑');
    var total=0;
    theme.adSlot.specs.forEach(function(spec){
      var list=theme.adSlotAssets&&theme.adSlotAssets[spec.id]||[];if(!list.length)return;total+=list.length;
      var kinds=Array.from(new Set(list.map(function(a){return a.type||'image';})));if(kinds.length!==1)throw Error('同一规格不能混用图片与视频');
      if(list.length>(kinds[0]==='video'?spec.maxVideos:spec.maxImages))throw Error('素材数量超过规格限制');
      if(!slot.bindings[slot.productLine].mediaKinds.includes(kinds[0]))throw Error('终端尚未登记支持该素材类型');
      list.forEach(function(asset){if(!asset.metadata)throw Error('素材规格信息缺失，请重新编辑');KioskAdSlots.validateMedia(spec,asset.metadata);});
    });
    if(!total)throw Error('请配置至少一套规格的广告素材');return theme;
  }
  function checkCurrent(){
    try{
      var id=localStorage.getItem('current_theme_id_for_distribute'),theme=JSON.parse(localStorage.getItem('kiosk_themes')||'[]').find(function(t){return t.id===id;});validateTheme(theme);
      var positions=KioskThemePositions.read(),channels=JSON.parse(localStorage.getItem('selected_channels_for_distribute')||'[]');
      if(positions.length!==1||positions[0]!==theme.adSlot.code||channels.length!==1||channels[0]!==theme.adSlot.productLine)throw Error('渠道或位置上下文已变化，请返回广告编辑页重新确认');return true;
    }catch(error){Toast.validate(error.message);return false;}
  }
  root.KioskAdSlotValidation={validateTheme:validateTheme,checkCurrent:checkCurrent};
})(window);
