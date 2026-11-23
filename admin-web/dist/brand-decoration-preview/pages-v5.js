/* 页面库与配置迁移：装修清单只控制独立展示，不决定业务页面是否存在。 */
(() => {
  const catalog = [
    {id:'screensaver',label:'屏保／待机页',short:'屏保',icon:'image',group:'引导与展示',desc:'品牌海报、待机标题和进入提示',fields:['screensaverTitle','screensaverSubtitle','screensaverTemplate'],layers:[['brand','品牌标识',false],['content','待机文案',false],['layout','品牌主视觉',false],['content','进入点餐入口',true]]},
    {id:'home',label:'首页',short:'首页',icon:'bowl',group:'引导与展示',desc:'品牌主视觉、标语与点餐入口',fields:['slogan','welcome','cta','homeTemplate'],layers:[['brand','品牌标识',false],['content','品牌标语',false],['layout','主视觉',false],['content','点餐入口',true]]},
    {id:'orderType',label:'用餐方式页',short:'用餐方式',icon:'grid',group:'点餐流程',desc:'堂食／打包选项的展示与引导文案',fields:['orderTypeTitle','orderTypeNote','orderTypeTemplate'],layers:[['brand','品牌标识',false],['content','引导文案',false],['layout','用餐方式选项',true]]},
    {id:'menu',label:'菜单页',short:'菜单页',icon:'bowl',group:'点餐流程',desc:'分类导航、商品卡片与活动横幅',fields:['menuTemplate','imageRatio','banner','bannerTitle','bannerSubtitle','bannerPosition'],layers:[['brand','品牌标识',false],['content','活动横幅',false],['layout','分类导航',true],['layout','商品列表',true],['layout','购物车',true]]},
    {id:'review',label:'购物车／订单确认页',short:'订单确认',icon:'bag',group:'点餐流程',desc:'订单标题、辅助说明与金额展示区',fields:['reviewTitle','reviewNote','reviewTemplate'],layers:[['brand','品牌标识',false],['content','订单引导',false],['layout','商品与数量',true],['layout','金额与确认操作',true]]},
    {id:'payment',label:'支付方式页',short:'支付方式',icon:'lock',group:'交易与结果',desc:'品牌提示区和支付选项排列',fields:['paymentTitle','paymentNote','paymentTemplate'],layers:[['brand','品牌标识',false],['content','支付说明',false],['layout','应付金额',true],['layout','模拟支付选项',true]]},
    {id:'finish',label:'完成页',short:'完成页',icon:'check',group:'交易与结果',desc:'取餐提示、品牌感谢区与小票样式',fields:['pickup','thankyou','finishBanner'],layers:[['brand','品牌标识',false],['content','取餐信息',true],['content','小票操作',true],['content','品牌感谢区',false]]},
  ];
  const initial=['home','menu','finish'];
  const defaults={screensaverTitle:'一碗热饭，等你来',screensaverSubtitle:'轻触屏幕，开启美好一餐',screensaverTemplate:'poster',slogan:'热乎好饭，\n认真做好',welcome:'现做的热饭，给认真生活的你。',cta:'开始点餐',homeTemplate:'poster',orderTypeTitle:'今天，想在哪里享用？',orderTypeNote:'请选择用餐方式，我们会为你准备好。',orderTypeTemplate:'cards',menuTemplate:'classic',imageRatio:'wide',banner:true,bannerTitle:'今日好饭，用心现做',bannerSubtitle:'一碗热饭，一份用心',bannerPosition:'top',reviewTitle:'确认你的这一餐',reviewNote:'新鲜现做，请核对餐品与数量。',reviewTemplate:'cards',paymentTitle:'选择支付方式',paymentNote:'安心享用，认真吃好这一餐。',paymentTemplate:'cards',pickup:'请留意取餐屏叫号',thankyou:'谢谢你，认真吃好每一餐',finishBanner:true};
  const limits={screensaverTitle:28,screensaverSubtitle:60,orderTypeTitle:28,orderTypeNote:60,reviewTitle:28,reviewNote:60,paymentTitle:28,paymentNote:60};
  function upgrade(c){if(!c||typeof c!=='object'||Array.isArray(c))return c;return {...defaults,...c,decoratedPages:c.decoratedPages===undefined?initial.slice():c.decoratedPages};}
  function effective(c,id){const result={...c};if(Array.isArray(c.decoratedPages)&&!c.decoratedPages.includes(id)){for(const key of catalog.find(p=>p.id===id)?.fields||[])result[key]=defaults[key];}return result;}
  window.KioskPages={catalog,initial,defaults,limits,upgrade,effective};
})();
