/* 当前检出 f84dd529 的顾客流程目录；默认/自定义不影响业务启用。 */
(() => {
 const P=KioskPages;
 const entries=[
 ['waitList','等位登记','waitList','启用等位时','等位登记','请输入用餐人数与联系信息','number'],
 ['tableService','取餐／送餐方式','tableService','堂食服务方式开启时','请选择服务方式','柜台自取或送餐到桌','cards'],
 ['phoneInput','手机号输入','phoneInput','开启电话收集时','请输入手机号码','用于接收本次订单通知','number'],
 ['reward','会员奖励','@component/CRM/Rewards','会员登录并有奖励时','我的奖励','选择可用奖励','rewards'],
 ['enterName','姓名输入','enterName','开启姓名收集时','请输入您的姓名','方便店员为您送餐','name'],
 ['partySizeSelection','用餐人数','partySizeSelection','开启人数收集时','请选择用餐人数','请输入本次用餐人数','number'],
 ['togoOption','打包选项','togoOption','开启打包附加选项时','打包选项','请选择所需餐具等选项','options'],
 ['chooseTable','选择桌台','chooseTable','开启桌台服务时','请选择桌台','请选择用餐区域与桌台','tables'],
 ['tippingPanel','小费选择','tippingPanel','启用小费时','您愿意添加小费吗？','小费预设由业务配置决定','tips'],
 ['cardPayment','刷卡支付过程','cardPayment','刷卡支付时','请在读卡器上完成支付','请插卡、刷卡或挥卡','terminal'],
 ['afterCreditCardPay','付款后小费与签名','afterCreditCardPay','支付完成后的后续操作','支付成功','请按提示完成后续操作','after'],
 ['signature','独立签名','signature','支付方式要求签名时','请在下方签名','签名仅为演示，不上传或保存','signature'],
 ['paymentMember','支付后会员','paymentMember','启用支付后会员引导时','加入会员，享受更多权益','会员注册及权益以门店规则为准','member'],
 ['connectionError','连接异常','connectionError','连接异常时','连接失败','请联系店员，或稍后重试','error'],
 ['login','会员登录弹框','@component/CRM/LoginCRM','开启会员登录入口时','会员登录','请输入手机号码以继续','number'],
 ['detail','商品详情弹框','orderPage/orderDetailModal','点击普通商品时','商品详情','选择规格与口味','detail'],
 ['combo','套餐选择','comboPanel','选择套餐商品时','请选择套餐内容','请完成必选分组','combo']
 ];
 P.nativeInfo={};
 const paths={screensaver:'mainPage/components/MainPageScreenSaver.jsx',home:'mainPage',orderType:'orderType',menu:'orderPage',review:'orderReview',payment:'paymentType',finish:'orderFinish'};
 for(const p of P.catalog){p.source=paths[p.id];p.condition=p.id==='screensaver'?'屏保开启且存在素材时':'主流程／由门店配置决定';}
 for(const [id,label,source,condition,title,note,kind] of entries){
  P.nativeInfo[id]={title,note,kind};P.defaults[id+'Title']=title;P.defaults[id+'Note']=note;P.limits[id+'Title']=32;P.limits[id+'Note']=80;
  P.catalog.push({id,label,short:label,source,condition,group:['detail','combo','login'].includes(id)?'弹框与子流程':'条件流程',desc:condition,icon:'grid',fields:[id+'Title',id+'Note'],layers:[['content','页面标题与说明',false],['layout','系统业务控件',true]]});
 }
 // 新建配置从项目默认开始；旧版本已经选择的自定义装修保持不变。
 P.initial=[];
 P.baseline='feat/4.9.7 @ f84dd529';
})();
