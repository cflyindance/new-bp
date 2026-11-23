/* 共享前台渲染器：后台和顾客端使用同一份展示与演示交互。 */
(() => {
  const icons = {
    bowl: '<path d="M3 11h18c0 6-3.5 9-9 9s-9-3-9-9ZM8 7c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5m5 5c-2-2 2-3 0-5M7 22h10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    bag: '<path d="M5 7h14l2 14H3L5 7Zm3 0V5a4 4 0 0 1 8 0v2"/>',
    arrow: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    paint: '<path d="m14 3 7 7-9 9-7-7 9-9ZM5 15c-4 0-4 6-4 6s6 0 6-4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 18 6-6 4 4 4-6 4 6"/>',
    undo: '<path d="M4 9h10a7 7 0 0 1 0 14M4 9l6-6M4 9l6 6"/>',
    print: '<path d="M6 8V2h12v6M6 17H2V9h20v8h-4M6 14h12v8H6Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>',
    leaf: '<path d="M20 3C8 1 1 9 6 16s16 2 14-13ZM5 21 17 8"/>',
    back: '<path d="m14 5-7 7 7 7"/>',
    settings: '<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M3 16v5h18v-5"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const goods = [
    {id:1,name:'招牌鸡腿饭',en:'Teriyaki chicken bowl',desc:'现烤鸡腿 · 时蔬 · 溏心蛋',price:28,cat:'饭食',photo:0,tag:'招牌'},
    {id:2,name:'香煎牛肉饭',en:'Sliced beef bowl',desc:'鲜嫩牛肉 · 香软米饭',price:32,cat:'饭食',photo:1,tag:'人气'},
    {id:3,name:'田园时蔬',en:'Seasonal vegetables',desc:'当季蔬菜，清爽好搭配',price:12,cat:'小食',photo:2,tag:''},
    {id:4,name:'清爽柠檬茶',en:'Fresh lemon iced tea',desc:'鲜切柠檬 · 清爽茶香',price:8,cat:'饮品',photo:3,tag:'清爽'},
  ];
  const money = n => '¥' + Number(n).toFixed(2);
  function brand(c) {return `<div class="brand-mark">${c.logo ? `<img src="${esc(c.logo)}" alt="品牌Logo">` : icon('bowl')}<div><strong>${esc(c.name)}</strong><span>${esc(c.english)}</span></div></div>`;}
  const photo = (i, cls='') => `<div class="food-photo p${i} ${cls}" role="img" aria-label="${esc(goods[i]?.name || '餐品')}"></div>`;
  function theme(c) {return `--brand:${c.primary};--on-brand:${c.onPrimary};--paper:${c.background};--radius:${c.radius}px` ;}
  function header(c, extra='') {return `<header class="kiosk-header">${brand(c)}${extra}</header>`;}
  function render(c, s, opts={}) {
    const english=s.lang==='en';
    const count=Object.values(s.cart).reduce((a,b)=>a+b,0), total=goods.reduce((a,g)=>a+g.price*(s.cart[g.id]||0),0);
    let body='';
    if (s.page==='home') {
      body=`<section class="home-screen ${c.homeTemplate==='split'?'split-home':''}"><div class="home-copy">${brand(c)}<span class="eyebrow">FRESHLY MADE. EVERY DAY.</span><h1>${esc(c.slogan)}</h1><p>${esc(c.welcome)}</p></div><div class="home-visual">${photo(0)}<span class="photo-note">一碗热饭，一份用心</span></div><div class="home-actions"><div class="dining-toggle"><button data-k="dining" data-value="堂食" class="${s.dining==='堂食'?'selected':''}">${english?'Dine in':'堂食'}</button><button data-k="dining" data-value="打包" class="${s.dining==='打包'?'selected':''}">${english?'Take away':'打包'}</button></div><button class="k-primary start-order" data-k="start">${english?'Start ordering':esc(c.cta)}${icon('arrow')}</button><button class="language" data-k="language">${english?'English / 切换中文':'中文 / English'}</button></div><div class="kiosk-footnote">${esc(c.name)} · 美好一餐，从这里开始</div></section>`;
    } else if(s.page==='menu') {
      const banner=c.banner?`<section class="promo" data-section="banner"><div><span class="eyebrow">MADE WITH CARE</span><h2>${esc(c.bannerTitle)}</h2><p>${esc(c.bannerSubtitle)}</p></div>${photo(0)}</section>`:'';
      let list=goods.filter(g=>s.category==='推荐'||s.category===g.cat);
      if(s.scenario==='empty')list=[];
      const cards=list.map(g=>`<article class="food-card ${c.imageRatio==='square'?'square-photo':''}">${s.scenario==='noimage'?`<div class="missing-photo">${icon('image')}<span>暂无图片</span></div>`:photo(g.photo)}<div class="food-body">${g.tag?`<span class="food-tag">${g.tag}</span>`:''}<h3>${english?g.en:g.name}</h3><p>${esc(g.desc)}</p><div class="food-bottom"><strong>${money(g.price)}</strong><button class="add" data-k="add" data-id="${g.id}" aria-label="加购${g.name}" ${s.scenario==='soldout'&&g.id===1?'disabled':''}>${s.scenario==='soldout'&&g.id===1?'售罄':(s.cart[g.id]||'+')}</button></div></div></article>`).join('');
      const categories=`<nav class="categories" aria-label="商品分类">${['推荐','饭食','小食','饮品'].map((x,i)=>`<button data-k="category" data-value="${x}" class="${s.category===x?'active':''}">${icon(['sun','bowl','leaf','grid'][i])}<span>${x}</span></button>`).join('')}</nav>`;
      const menu=`<section class="menu-layout ${c.menuTemplate==='feature'?'feature-menu':''}" data-section="products">${categories}<div class="food-list"><div class="list-title"><h2>${s.category==='推荐'?'今日推荐':s.category}</h2><span>新鲜现做 · 好好吃饭</span></div>${cards?`<div class="food-grid">${cards}</div>`:`<div class="empty-menu">${icon('bowl')}<h3>当前暂无可售商品</h3><p>请联系店员，或稍后再试</p><button data-k="home">返回首页</button></div>`}</div></section>`;
      body=`${header(c,`<button class="k-back" data-k="home" aria-label="返回首页">${icon('back')}</button>`)}<main class="menu-scroll">${c.bannerPosition==='top'?banner+menu:menu+banner}</main><footer class="cart-bar"><div>${icon('bag')}<span>${count?`已选 <b>${count}</b> 件`:'选一份喜欢的好饭'}</span></div><strong>${money(total)}</strong><button class="k-primary" data-k="cart" ${!count?'disabled':''}>${english?'View cart':'查看购物车'}${icon('arrow')}</button></footer>`;
    } else {
      body=`${header(c)}<section class="finish-screen"><div class="success-icon">${icon('check')}</div><span class="eyebrow">THANK YOU FOR YOUR ORDER</span><h1>下单成功</h1><p>您的取餐号</p><div class="order-number">${esc(s.orderNumber||'A038')}</div><p class="pickup">${esc(c.pickup)}</p><div class="receipt"><div><span>订单金额</span><strong>${money(s.orderTotal??60)}</strong></div><small>演示订单 · ${esc(s.dining)}</small><div class="receipt-actions"><button data-k="print">${icon('print')}打印小票</button><button data-k="home">无需小票</button></div></div>${c.finishBanner?`<div class="thankyou">${icon('leaf')}<h2>${esc(c.thankyou)}</h2><p>期待下一次，继续为你好好做饭</p></div>`:''}<button class="k-primary return-home" data-k="home">返回首页${icon('arrow')}</button></section>`;
    }
    return `<div class="kiosk ${opts.orientation==='landscape'?'landscape':''}" style="${theme(c)}" data-page="${s.page}">${body}</div>`;
  }
  function newSession() {return {page:'home',cart:{},category:'推荐',dining:'堂食',lang:'zh',scenario:'normal',orderTotal:null,orderNumber:null};}
  function cartHtml(s) {
    const rows=goods.filter(g=>s.cart[g.id]).map(g=>`<div class="cart-row">${photo(g.photo)}<div><strong>${g.name}</strong><p>${money(g.price)} / 份</p></div><div class="stepper"><button data-cart="minus" data-id="${g.id}" aria-label="减少${g.name}">−</button><span>${s.cart[g.id]}</span><button data-cart="plus" data-id="${g.id}" aria-label="增加${g.name}">+</button></div><b>${money(g.price*s.cart[g.id])}</b></div>`).join('');
    const total=goods.reduce((a,g)=>a+g.price*(s.cart[g.id]||0),0);
    return `<div class="modal-heading"><div><span class="eyebrow">YOUR ORDER</span><h2>确认你的这一餐</h2></div><button data-close aria-label="关闭购物车">×</button></div>${rows||'<p class="empty-cart">购物车为空，先选一份好饭吧。</p>'}<div class="cart-total"><span>合计 <small>演示无额外费用</small></span><strong>${money(total)}</strong></div><div class="payment-options"><label><input type="radio" name="payment" value="success" checked> 模拟支付成功</label><label><input type="radio" name="payment" value="fail"> 模拟支付失败</label></div><p id="payment-error" class="error" role="alert"></p><button class="primary pay-button" data-cart="pay" ${!total?'disabled':''}>模拟结算 · ${money(total)}</button><p class="modal-note">仅演示交互，不会产生真实订单或扣款。</p>`;
  }
  window.KioskDemo={icon,esc,goods,money,brand,theme,render,newSession,cartHtml};
})();
