/* V6 自定义模板：共享业务演示状态，页面按任务而非通用占位渲染。 */
(() => {
 'use strict';
 const T=KioskPremium,D=KioskDemo,P=KioskPages,{esc,icon,goods,money}=D,previous=D.render;
 const total=s=>goods.reduce((sum,g)=>sum+g.price*(s.cart[g.id]||0),0);
 const count=s=>Object.values(s.cart).reduce((a,b)=>a+b,0);
 const btn=(text,action,attrs='',cls='pt-button')=>'<button type="button" class="'+cls+'" data-k="'+action+'" '+attrs+'>'+text+'</button>';
 const primary=(text,action,attrs='')=>btn('<span>'+text+'</span><i>'+icon('arrow')+'</i>',action,attrs,'pt-button pt-primary');
 const photo=(n,cls='')=>'<div class="pt-photo pt-photo-'+n+' '+cls+'" role="img" aria-label="'+esc(goods[n]?.name||'现做餐食')+'"><svg viewBox="'+(n%2)+' '+Math.floor(n/2)+' 1 1" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="assets/food-atlas.png" x="0" y="0" width="2" height="2"/></svg></div>';
 const glyph=name=>'<span class="pt-glyph">'+icon(name)+'</span>';
 const flag=text=>'<span class="pt-flag">'+text+'</span>';
 const pick=(s,group,fallback='')=>s.picks?.[group]??fallback;
 function brand(c){return '<div class="pt-brand">'+(c.logo?'<img src="'+esc(c.logo)+'" alt="品牌标识">':'<span class="pt-brand-symbol">'+icon('bowl')+'</span>')+'<div><strong>'+esc(c.name)+'</strong><small>'+esc(c.english)+'</small></div></div>';}
 function head(c,s,t){return '<header class="pt-header">'+brand(c)+'<div class="pt-header-note"><span>'+t.en+'</span><b>新鲜现做 · 用心款待</b></div>'+(!['home','screensaver'].includes(s.page)?btn(icon('back'),'home','aria-label="返回首页"','pt-icon-button'):'')+'</header>';}
 function heading(title,note,kicker='A MOMENT, WELL SERVED'){return '<div class="pt-heading"><span class="pt-kicker">'+esc(kicker)+'</span><h1>'+esc(title)+'</h1>'+(note?'<p>'+esc(note)+'</p>':'')+'</div>';}
 function footer(text,action,attrs='',secondary='返回菜单',back='to-menu'){
  return '<footer class="pt-bottom">'+btn(icon('back')+'<span>'+secondary+'</span>',back,'','pt-back-button')+primary(text,action,attrs)+'</footer>';
 }
 function options(s,items,group,cls=''){
  return '<div class="pt-options '+cls+'">'+items.map((item,i)=>{
   const [value,title,desc,symbol]=Array.isArray(item)?item:[item,item,'','grid'],selected=pick(s,group)===value;
   return btn('<span class="pt-option-index">'+String(i+1).padStart(2,'0')+'</span>'+glyph(symbol||'grid')+'<span class="pt-option-copy"><strong>'+esc(title)+'</strong><small>'+esc(desc)+'</small></span><i class="pt-choice-check">'+(selected?icon('check'):'')+'</i>','pt-select','data-group="'+group+'" data-value="'+esc(value)+'" aria-pressed="'+selected+'"','pt-option '+(selected?'is-selected':''));
  }).join('')+'</div>';
 }
 function pad(){return '<div class="pt-pad">'+['1','2','3','4','5','6','7','8','9','清空','0','⌫'].map(x=>btn(x,'pt-key','data-value="'+x+'"','pt-key')).join('')+'</div>';}
 function phone(c,s,isLogin=false){
  return '<section class="pt-form-card"><div class="pt-form-symbol">'+glyph(isLogin?'lock':'settings')+'<span>'+(isLogin?'YOUR MEMBERSHIP':'STAY CONNECTED')+'</span></div><label class="pt-field-label" for="pt-phone">手机号码</label><div class="pt-phone-field"><span>手机号</span><input id="pt-phone" class="pt-input" inputmode="numeric" autocomplete="off" maxlength="15" value="'+esc(s.inputs?.[s.page]||'')+'" placeholder="请输入手机号码" aria-label="手机号码"></div>'+pad()+'<p class="pt-form-help">'+(isLogin?'登录会员，发现属于你的专属礼遇':'仅用于本次点餐联系，请确认号码准确')+'</p><p class="pt-validation" role="alert"></p></section>';
 }
 function summary(s){return '<aside class="pt-summary"><span class="pt-kicker">YOUR ORDER</span><h2>这一餐，刚刚好</h2><div><span>用餐方式</span><b>'+esc(s.dining)+'</b></div><div><span>餐品数量</span><b>'+count(s)+' 份</b></div><div class="pt-total"><span>应付金额</span><strong>'+money(total(s))+'</strong></div><small>新鲜现做 · 下单后即刻为你准备</small></aside>';}
 function inputPage(c,s){
  const id=s.page,isName=id==='enterName';
  const body=isName?'<section class="pt-form-card pt-name-card">'+glyph('paint')+'<span class="pt-kicker">NICE TO MEET YOU</span><label class="pt-field-label" for="pt-name">怎么称呼你？</label><input id="pt-name" class="pt-input" maxlength="24" autocomplete="off" value="'+esc(s.inputs?.[id]||'')+'" placeholder="请输入姓名" aria-label="姓名"><div class="pt-name-decoration">'+brand(c)+'<p>为每一份热爱生活的你<br>认真准备一餐</p></div><p class="pt-validation" role="alert"></p></section>':phone(c,s);
  return '<main class="pt-scroll pt-form-layout">'+heading(c[id+'Title'],c[id+'Note'],'A PERSONAL TOUCH')+body+'</main>'+footer('确认并继续','pt-confirm','','暂时跳过','flow-next');
 }
 function payment(c,s){
  return '<main class="pt-scroll pt-payment-layout">'+heading(c.paymentTitle,c.paymentNote,'A SEAMLESS FINISH')+'<section class="pt-pay-amount"><span>本次应付</span><strong>'+money(total(s))+'</strong><small>'+esc(s.dining)+' · '+count(s)+' 份餐品</small></section>'+options({...s,picks:{...s.picks,method:s.paymentMethod}},[['scan','扫码支付','便捷扫码，轻松完成','grid'],['card','银行卡支付','请按照读卡器提示操作','bag']],'method','pt-payment-options')+'<div class="pt-payment-safety">'+icon('lock')+'<span data-bd-copy>安心支付，享用美好一餐</span></div><fieldset class="pt-payment-demo"><legend>支付演示</legend><label><input type="radio" name="flow-payment" value="success" '+(s.paymentResult!=='fail'?'checked':'')+'> 成功</label><label><input type="radio" name="flow-payment" value="fail" '+(s.paymentResult==='fail'?'checked':'')+'> 失败</label></fieldset>'+(s.paymentError?'<p class="pt-error" role="alert">'+esc(s.paymentError)+'</p>':'')+'</main>'+footer('确认模拟支付','pay-now',total(s)?'':'disabled','核对订单','to-review');
 }
 function home(c,s,t){
  const saver=s.page==='screensaver',title=saver?c.screensaverTitle:c.slogan,note=saver?c.screensaverSubtitle:c.welcome;
  return '<main class="pt-home"><div class="pt-home-copy"><span class="pt-kicker">'+(t.id==='noir'?'THE ART OF A GOOD MEAL':'SEASONAL · FRESH · THOUGHTFUL')+'</span><h1>'+esc(title).replace(/\n/g,'<br>')+'</h1><p>'+esc(note)+'</p><div class="pt-home-detail"><span>一餐一味</span><i></i><span>用心款待</span></div></div><div class="pt-home-image">'+photo(0)+'<span class="pt-photo-caption"><b>01</b> 招牌鸡腿饭<br><small>SIGNATURE CHICKEN BOWL</small></span><span class="pt-image-stamp">'+(t.id==='terra'?'热乎<br>上桌':'用心<br>现做')+'</span></div><div class="pt-home-action">'+primary(saver?'轻触开始':esc(c.cta),saver?'wake':'start')+'<small>美好的一餐，从这里开始</small></div></main><div class="pt-home-foot"><span>'+t.en+'</span><span>每一天，都值得好好吃饭</span></div>';
 }
 function menu(c,s,t){
  let list=goods.filter(g=>s.category==='推荐'||s.category===g.cat);if(s.scenario==='empty')list=[];
  const cards=list.map(g=>'<article class="pt-product">'+(s.scenario==='noimage'?'<div class="pt-photo pt-no-photo">'+icon('image')+'<span>图片准备中</span></div>':photo(g.photo))+'<div class="pt-product-copy">'+(g.tag?flag(g.tag):'')+'<h3>'+esc(s.lang==='en'?g.en:g.name)+'</h3><p>'+esc(g.desc)+'</p><div><strong>'+money(g.price)+'</strong>'+btn(s.scenario==='soldout'&&g.id===1?'售罄':'+','add','data-id="'+g.id+'" aria-label="加购'+g.name+'" '+(s.scenario==='soldout'&&g.id===1?'disabled':''),'pt-add')+'</div></div></article>').join('');
  return '<main class="pt-scroll pt-menu">'+(c.banner?'<section class="pt-menu-banner"><div><span class="pt-kicker">FROM OUR KITCHEN</span><h2>'+esc(c.bannerTitle)+'</h2><p>'+esc(c.bannerSubtitle)+'</p></div>'+photo(t.id==='terra'?1:0)+'</section>':'')+'<div class="pt-menu-columns"><nav class="pt-categories" aria-label="餐品分类">'+['推荐','饭食','小食','饮品'].map((x,i)=>btn('<span>'+String(i+1).padStart(2,'0')+'</span>'+x,'category','data-value="'+x+'"','pt-category '+(s.category===x?'is-active':''))).join('')+'</nav><section class="pt-products"><div class="pt-list-title"><h2>'+esc(s.category==='推荐'?'主厨推荐':s.category)+'</h2><span>认真做好每一份</span></div><div class="pt-product-grid">'+(cards||'<div class="pt-empty">'+glyph('bowl')+'<h3>好味道，稍等片刻</h3><p>当前分类暂无可售餐品，请查看其他分类。</p></div>')+'</div></section></div></main><footer class="pt-cart"><div>'+glyph('bag')+'<span>'+count(s)+'<small>已选餐品</small></span></div><strong>'+money(total(s))+'</strong>'+primary('查看订单','cart',count(s)?'':'disabled')+'</footer>';
 }
 function review(c,s){
  const rows=goods.filter(g=>s.cart[g.id]).map(g=>'<article class="pt-order-row">'+photo(g.photo)+'<div><h3>'+g.name+'</h3><small>'+money(g.price)+' / 份</small><div class="pt-stepper">'+btn('−','qty-minus','data-id="'+g.id+'" aria-label="减少'+g.name+'"')+'<span>'+s.cart[g.id]+'</span>'+btn('+','qty-plus','data-id="'+g.id+'" aria-label="增加'+g.name+'"')+'</div></div><strong>'+money(g.price*s.cart[g.id])+'</strong></article>').join('');
  return '<main class="pt-scroll pt-review">'+heading(c.reviewTitle,c.reviewNote,'YOUR ORDER, WITH CARE')+'<div class="pt-review-columns"><section class="pt-order-list">'+(rows||'<div class="pt-empty">'+glyph('bag')+'<h3>购物车还空着</h3><p>挑选一份喜欢的餐品吧</p></div>')+'</section>'+summary(s)+'</div></main>'+footer('前往支付','to-payment',total(s)?'':'disabled','继续点餐','to-menu');
 }
 function finish(c,s){
  return '<main class="pt-scroll pt-finish"><div class="pt-success-seal">'+icon('check')+'</div><span class="pt-kicker">THANK YOU FOR DINING WITH US</span><h1>下单成功</h1><p>你的美味，正在用心准备</p><section class="pt-ticket"><div class="pt-ticket-label"><span>取餐号码</span><small>YOUR ORDER NUMBER</small></div><strong class="pt-order-number">'+esc(s.orderNumber||'A038')+'</strong><p>'+esc(c.pickup)+'</p><div class="pt-ticket-total"><span>本次订单</span><b>'+money(s.orderTotal??60)+'</b></div><div class="pt-receipt-actions">'+btn(icon('print')+'<span data-bd-copy>打印小票</span>','print')+btn('无需小票','home')+'</div></section>'+(c.finishBanner?'<div class="pt-thanks">'+icon('leaf')+'<h2>'+esc(c.thankyou)+'</h2><span>期待再次与你相遇</span></div>':'')+'</main>'+footer('返回首页','home','','继续享用','home');
 }
 function choices(c,s){
  const id=s.page,title=c[id+'Title'],note=c[id+'Note'];let content='',label='确认并继续';
  if(id==='orderType')content=options({...s,picks:{...s.picks,dining:s.dining}},[['堂食','在这里享用','慢下来，好好吃一餐','bowl'],['打包','将美味带走','打包一份，延续好心情','bag']],'dining','pt-dining-options');
  if(id==='tableService')content=options(s,[['柜台自取','柜台取餐','餐品完成后，请留意叫号','bag'],['送餐到桌','送餐到桌','选好桌台，由我们为你送达','grid']],'service');
  if(id==='partySizeSelection')content='<section class="pt-party-intro">'+glyph('bowl')+'<h2>一起吃饭，是件美好的事</h2><p>这次，一共几位？</p></section><div class="pt-number-options">'+[1,2,3,4,5,6,8,10,12].map(n=>btn('<strong>'+n+'</strong><small>位</small>','pt-select','data-group="party" data-value="'+n+'" aria-pressed="'+(pick(s,'party','2')===String(n))+'"','pt-number '+(pick(s,'party','2')===String(n)?'is-selected':''))).join('')+'</div>';
  if(id==='togoOption')content=options(s,[['需要餐具','需要餐具','为你配好本餐所需餐具','bowl'],['无需餐具','无需餐具','少一份消耗，多一份绿色','leaf']],'cutlery')+'<div class="pt-quiet-note">'+icon('leaf')+'<span data-bd-copy>让每一份好味道，都轻装出发</span></div>';
  if(id==='chooseTable')content='<div class="pt-zone-label"><span>用餐区域</span><b>大厅</b><small>请选择你的桌台</small></div><div class="pt-tables">'+['A01','A02','A03','A04','A05','A06'].map((x,i)=>btn(glyph('grid')+'<strong>'+x+'</strong><small>'+(i%2?'4':'2')+'人桌</small>','pt-select','data-group="table" data-value="'+x+'" aria-pressed="'+(pick(s,'table','A03')===x)+'"','pt-table '+(pick(s,'table','A03')===x?'is-selected':''))).join('')+'</div>';
  if(id==='tippingPanel')content='<section class="pt-gratitude">'+glyph('leaf')+'<h2>感谢你的心意</h2><p>你的一份支持，让用心被看见。</p></section>'+options(s,[['15%','15%','谢谢你的认可','leaf'],['18%','18%','感谢这份心意','leaf'],['20%','20%','让美好继续发生','leaf']],'tip','pt-tip-options')+'<div class="pt-tip-alternatives">'+btn('不添加','pt-select','data-group="tip" data-value="不添加"','pt-text-button '+(pick(s,'tip','不添加')==='不添加'?'is-selected':''))+btn('自定义金额','pt-custom-tip','','pt-text-button')+'</div><p class="pt-form-help">小费金额由门店结算配置确认</p>';
  return '<main class="pt-scroll pt-choice-page pt-page-'+id+'">'+heading(id==='orderType'?c.orderTypeTitle:title,id==='orderType'?c.orderTypeNote:note,'THOUGHTFULLY, YOUR CHOICE')+content+'</main>'+footer(id==='orderType'?'进入菜单':label,id==='orderType'?'to-menu':'pt-confirm','','返回首页','home');
 }
 function member(c,s){
  const reward=s.page==='reward';
  return '<main class="pt-scroll pt-member">'+heading(c[s.page+'Title'],c[s.page+'Note'],'A LITTLE SOMETHING, FOR YOU')+'<section class="pt-membership-card"><div>'+brand(c)+'<span>MEMBERS CLUB</span></div><span class="pt-kicker">SOMETHING SPECIAL</span><h2>'+(reward?'每一次光临<br>都有新的惊喜':'为美味相聚<br>留一份专属礼遇')+'</h2><div class="pt-membership-bottom"><span>'+(reward?'200 <small>可用积分</small>':'为每一次喜欢，积攒更多期待')+'</span><b>✦</b></div></section>'+(reward?'<div class="pt-rewards">'+[['下次光临 · 饮品礼遇','清爽柠檬茶 · 100积分'],['日常美味 · 小食礼遇','田园时蔬 · 150积分']].map(([a,b],i)=>btn(glyph(i?'leaf':'sun')+'<span><strong>'+a+'</strong><small>'+b+'</small></span><i>领取 →</i>','native-feedback','','pt-reward')).join('')+'</div>':'<div class="pt-benefits"><div>'+glyph('sun')+'<strong>专属礼遇</strong><small>更多惊喜，等你发现</small></div><div>'+glyph('leaf')+'<strong>积分相伴</strong><small>每一次光临，都有回应</small></div></div>')+'</main>'+footer(reward?'确认选择':'了解会员权益',reward?'flow-next':'native-feedback','','暂时跳过','flow-next');
 }
 function processing(c,s){
  const id=s.page,after=id==='afterCreditCardPay';
  if(id==='connectionError')return '<main class="pt-scroll pt-status-page pt-error-page"><div class="pt-status-symbol">'+glyph('settings')+'</div>'+heading(c[id+'Title'],c[id+'Note'],'A SHORT PAUSE')+'<section class="pt-status-card"><strong>连接暂时中断</strong><p>请稍候重试，或联系店员为你提供帮助。</p><span class="pt-status-tag">我们会陪你完成这一餐</span></section></main>'+footer('重新连接（模拟）','home','','联系店员','native-feedback');
  return '<main class="pt-scroll pt-status-page '+(after?'pt-paid-page':'')+'"><div class="pt-status-symbol">'+(after?'<span class="pt-success-seal">'+icon('check')+'</span>':'<svg class="pt-terminal" viewBox="0 0 180 200" fill="none" aria-hidden="true"><rect x="35" y="14" width="110" height="165" rx="18" stroke="currentColor" stroke-width="2"/><rect x="49" y="29" width="82" height="60" rx="7" fill="currentColor" opacity=".12"/><path d="m78 60 9 9 19-22M55 111h12m17 0h12m17 0h12m-70 20h12m17 0h12m17 0h12m-70 20h12m17 0h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="103" y="140" width="60" height="40" rx="6" stroke="currentColor" stroke-width="2"/><path d="M112 152h42" stroke="currentColor" stroke-width="5"/></svg>')+'</div>'+heading(c[id+'Title'],c[id+'Note'],after?'PAYMENT RECEIVED':'PLEASE FOLLOW THE TERMINAL')+'<section class="pt-status-card"><span>'+(after?'本次已支付':'本次应付金额')+'</span><strong>'+money(s.orderTotal??total(s))+'</strong><p>'+(after?'谢谢你，接下来完成最后一步。':'请根据读卡器提示操作，完成后继续。')+'</p></section></main>'+footer(after?'继续':'模拟支付完成',after?'flow-next':'pt-card-success',!after&&!total(s)?'disabled':'',after?'返回首页':'取消支付',after?'home':'to-review');
 }
 function queue(c,s){
  return '<main class="pt-scroll pt-queue">'+heading(c.waitListTitle,c.waitListNote,'A TABLE IS WAITING FOR YOU')+'<section class="pt-queue-card"><span class="pt-kicker">WELCOME TO OUR TABLE</span><h2>美味值得<br>稍作等待</h2><p>相聚的每一刻，都值得认真对待。</p><div>'+glyph('bowl')+'<span>到店登记 · 用心安排</span></div></section><section class="pt-queue-form"><label class="pt-field-label">用餐人数</label><div class="pt-number-options">'+[1,2,3,4,6,8].map(n=>btn(String(n)+' 位','pt-select','data-group="party" data-value="'+n+'"','pt-number '+(pick(s,'party','2')===String(n)?'is-selected':''))).join('')+'</div><label class="pt-field-label" for="pt-wait-phone">联系电话</label><input id="pt-wait-phone" class="pt-input" inputmode="tel" maxlength="15" placeholder="请输入手机号码"><p class="pt-form-help">登记后请留意门店现场通知</p><p class="pt-validation" role="alert"></p></section></main>'+footer('模拟登记','pt-confirm','','返回首页','home');
 }
 function signatureCard(){
  return '<section class="pt-signature-card"><div><span>请在此处签名</span>'+btn('重新签写','native-clear','','pt-text-button')+'</div><canvas class="native-signature pt-signature" width="880" height="400" aria-label="签名区域，可拖动绘制"></canvas><div class="pt-sign-line"><span>签名</span><i></i><small>SIGN HERE</small></div></section>';
 }
 function postPayment(c,s,scene){
  const showTip=scene!=='signature', showSignature=scene!=='tip';
  const title=showTip&&showSignature?'选择小费并签名':showTip?'选择小费':'请签名确认';
  const tips=showTip?options(s,[['15%','15%','感谢你的支持','leaf'],['18%','18%','谢谢你的心意','leaf'],['20%','20%','感谢认可','leaf'],['不添加','不添加小费','','grid']],'tip','pt-tip-options'):'';
  const totalLabel='<section class="pt-status-card"><span>本次已支付</span><strong>'+money(s.orderTotal??total(s))+'</strong><p>请按提示完成后续操作</p></section>';
  return '<main class="pt-scroll pt-signature-page pt-post-payment">'+heading(title,c.afterCreditCardPayNote,'PAYMENT RECEIVED')+totalLabel+tips+(showSignature?signatureCard():'')+'</main>'+footer('确认并继续','flow-next','','返回首页','home');
 }
 function signature(c,s){
  return '<main class="pt-scroll pt-signature-page">'+heading(c.signatureTitle,c.signatureNote,'ONE FINAL TOUCH')+'<div class="pt-signature-summary"><span>已支付金额</span><strong>'+money(s.orderTotal??60)+'</strong></div>'+signatureCard()+'<p class="pt-form-help">确认后继续完成订单</p></main>'+footer('确认签名','flow-next','','稍后签名','flow-next');
 }
 function modalPage(c,s){
  const id=s.page;let inner='',actions='';
  if(id==='login'){inner=heading(c.loginTitle,c.loginNote,'WELCOME BACK')+phone(c,s,true);actions=footer('登录（模拟）','pt-confirm','','暂不登录','to-menu');}
  if(id==='detail'){
   inner='<div class="pt-detail-hero">'+photo(0)+flag('主厨推荐')+'</div><div class="pt-detail-copy"><span class="pt-kicker">SIGNATURE SELECTION</span><h1>招牌鸡腿饭</h1><p>现烤鸡腿 · 时蔬 · 溏心蛋</p><strong>'+money(28)+'</strong><h3>选择规格</h3>'+options(s,[['标准份','标准份','恰好的满足','bowl'],['大份','大份','更多一份好胃口','bowl']],'spec','pt-spec-options')+'</div>';
   actions=footer('加入购物车','native-detail-add','','继续看看','to-menu');
  }
  if(id==='combo'){
   inner=heading(c.comboTitle,c.comboNote,'CURATE YOUR PERFECT MEAL')+'<div class="pt-combo-groups">'+[['main','主食','招牌鸡腿饭','香煎牛肉饭',0],['side','配菜','田园时蔬','无需配菜',2],['drink','饮品','清爽柠檬茶','温水',3]].map(([group,title,a,b,n],i)=>'<section><div class="pt-combo-title"><span>0'+(i+1)+'</span><h3>'+title+'</h3><small>'+(i?'任选一份':'必选一份')+'</small></div><div class="pt-combo-options">'+[a,b].map((label,j)=>btn((j?'':photo(n))+'<span>'+label+'</span><i>'+(pick(s,group,a)===label?icon('check'):'+')+'</i>','pt-select','data-group="'+group+'" data-value="'+label+'" aria-pressed="'+(pick(s,group,a)===label)+'"','pt-combo-option '+(pick(s,group,a)===label?'is-selected':''))).join('')+'</div></section>').join('')+'</div>';
   actions=footer('加入购物车','native-detail-add','','继续看看','to-menu');
  }
  return '<main class="pt-scroll pt-modal-scene"><div class="pt-scene-background">'+photo(0)+photo(1)+'</div><section class="pt-modal-card" role="dialog" aria-label="'+esc(P.catalog.find(p=>p.id===id).label)+'"><div class="pt-modal-top"><span>'+esc(c.name)+' · 为你精选</span>'+btn('×','to-menu','aria-label="关闭"','pt-icon-button')+'</div><div class="pt-modal-scroll">'+inner+'</div>'+actions+'</section></main>';
 }
 function render(c,s,opts={}){
  const id=c.pageTemplates[s.page],t=T.themes[id];if(!t)return previous(c,s,opts);
  let body='';
  if(['home','screensaver'].includes(s.page))body=home(c,s,t);
  else if(s.page==='menu')body=menu(c,s,t);
  else if(s.page==='review')body=review(c,s);
  else if(s.page==='payment')body=payment(c,s);
  else if(s.page==='finish')body=finish(c,s);
  else if(['phoneInput','enterName'].includes(s.page))body=inputPage(c,s);
  else if(['orderType','tableService','partySizeSelection','togoOption','chooseTable','tippingPanel'].includes(s.page))body=choices(c,s);
  else if(['reward','paymentMember'].includes(s.page))body=member(c,s);
  else if(s.page==='afterCreditCardPay'&&opts.postPaymentScene)body=postPayment(c,s,opts.postPaymentScene);
  else if(['cardPayment','afterCreditCardPay','connectionError'].includes(s.page))body=processing(c,s);
  else if(s.page==='signature')body=signature(c,s);
  else if(s.page==='waitList')body=queue(c,s);
  else if(['login','detail','combo'].includes(s.page))body=modalPage(c,s);
  return '<div class="kiosk premium-kiosk pt-'+id+' '+(opts.orientation==='landscape'?'pt-landscape':'pt-portrait')+' pt-page-'+s.page+'" style="'+esc(T.style(c,id))+'" data-page="'+s.page+'" data-premium="'+id+'" data-render-mode="premium-template">'+head(c,s,t)+body+'</div>';
 }
 T.render=render;
 D.render=(c,s,opts={})=>c.decoratedPages.includes(s.page)&&T.themes[c.pageTemplates?.[s.page]]?render(c,s,opts):previous(c,s,opts);
 T.handleAction=(el,s,{refresh,toast})=>{
  const a=el.dataset.k;if(!a?.startsWith('pt-'))return false;
  s.picks=s.picks||{};s.inputs=s.inputs||{};
  const remember=()=>{const input=document.querySelector('.premium-kiosk .pt-input');if(input)s.inputs[s.page]=input.value;};
  if(a==='pt-select'){remember();s.picks[el.dataset.group]=el.dataset.value;if(el.dataset.group==='dining')s.dining=el.dataset.value;if(el.dataset.group==='method')s.paymentMethod=el.dataset.value;}
  if(a==='pt-key'){
   const input=document.querySelector('.premium-kiosk .pt-input');if(input){const value=el.dataset.value;input.value=value==='清空'?'':value==='⌫'?input.value.slice(0,-1):(input.value+value).slice(0,15);s.inputs[s.page]=input.value;}return true;
  }
  if(a==='pt-custom-tip'){toast('自定义小费入口仅做样式展示，实际金额由门店结算配置处理');return true;}
  if(a==='pt-card-success'){if(!total(s))return true;s.orderTotal=total(s);s.orderNumber='A038';s.cart={};s.page='afterCreditCardPay';}
  if(a==='pt-confirm'){
   remember();const input=document.querySelector('.premium-kiosk .pt-input');
   if(input&&(!input.value.trim()||(s.page!=='enterName'&&!/^\d+$/.test(input.value)))){const error=document.querySelector('.premium-kiosk .pt-validation');if(error)error.textContent=s.page==='enterName'?'请填写姓名后继续':'请填写有效的数字号码后继续';input.focus();return true;}
   if(s.page==='waitList'){toast('模拟登记完成；未连接真实等位系统');s.page='home';}else if(s.page==='login'){toast('模拟登录完成；未连接真实会员账户');s.page='menu';}else s.page='menu';
  }
  refresh();return true;
 };
})();
