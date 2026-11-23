/* Presentation only. Parent sends a scoped draft; no order/payment APIs are available. */
(()=>{'use strict';const screen=document.querySelector('#screen');let width=540,height=960;
function fit(){const scale=Math.min(innerWidth/width,innerHeight/height);Object.assign(screen.style,{width:width+'px',height:height+'px',left:(innerWidth-width*scale)/2+'px',top:(innerHeight-height*scale)/2+'px',transform:'scale('+scale+')'});}
const esc=value=>KioskDemo.esc(String(value));
function mobile(s,page){const theme=s.styles[page].theme,colors={jade:['#f7f4eb','#204d40','#fff'],noir:['#191c1b','#d3b67a','#191c1b'],terra:['#fbf1e4','#9c4831','#fff']}[theme],style=`--paper:${colors[0]};--ink:${s.primary};--on:${colors[2]}`;
let body='',action='开始点餐';const meal=(i)=>`<div class="food"><div class="meal" style="background-position:${i%2?'100%':'0'} ${i>1?'100%':'0'}"></div><b>${['炙烤鸡腿饭','时蔬谷物碗','慢炖牛肉饭','南瓜浓汤'][i]}</b><small>¥${[32,28,42,18][i]}.00　＋</small></div>`;
if(page==='home')body='<span class="eyebrow">GOOD FOOD, GOOD MOMENTS</span><h1>一餐一味，<br>认真款待。</h1><p>新鲜现做，把好味道带到你面前。</p><div class="hero"></div>';
if(page==='menu'){body='<div class="menu-tabs"><b>主厨推荐</b><span>当季轻食</span><span>饮品</span></div><div class="grid">'+[0,1,2,3].map(meal).join('')+'</div>';action='查看购物车 · ¥60.00';}
if(page==='detail'){body='<div class="hero" style="height:300px;margin:0"></div><h1>炙烤鸡腿饭</h1><p>鲜嫩鸡腿，搭配当季时蔬与热米饭。</p><div class="row"><b>口味</b><span>原味　微辣</span></div><div class="row"><b>份量</b><span>标准份</span></div>';action='加入购物车 · ¥32.00';}
if(page==='review'){body='<span class="eyebrow">YOUR ORDER</span><h1>确认这一餐</h1><div class="row"><b>炙烤鸡腿饭 × 1</b><span>¥32.00</span></div><div class="row"><b>时蔬谷物碗 × 1</b><span>¥28.00</span></div><div class="row"><b>合计</b><b>¥60.00</b></div>';action='确认订单';}
if(page==='payment'){body='<span class="eyebrow">CHECKOUT</span><h1>选择支付方式</h1><p>应付金额</p><h1>¥60.00</h1><div class="row"><b>信用卡／借记卡</b><span>○</span></div><div class="row"><b>扫码支付</b><span>○</span></div>';action='确认支付（演示）';}
if(page==='finish'){body='<div class="success"><i>✓</i><p>THANK YOU FOR YOUR ORDER</p><h2>下单成功</h2><p>您的取餐号</p><h1>A038</h1><p>请留意取餐屏叫号</p></div>';action='返回菜单';}
if(page==='login'){body='<span class="eyebrow">MEMBERSHIP</span><h1>欢迎回来</h1><p>登录会员，享受专属礼遇。</p><input aria-label="演示手机号" placeholder="输入手机号码" readonly>';action='登录（演示）';}
return `<div class="em" style="${style}"><header><strong>${esc(s.brandName)}</strong><span>电子菜单 · 演示</span></header><main>${body}</main><footer><button tabindex="-1">${action}</button></footer></div>`;
}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='bd-render')return;const {scheme:s,page,orientation}=event.data;const style=s?.styles?.[page];if(!style)return;
if(s.channel==='emenu'){width=390;height=844;screen.innerHTML=style.mode==='default'?'<div class="em-empty"><div><strong>项目默认页面</strong>eMenu 原生默认效果尚未接入。<br>切换自定义装修可查看移动端样式。</div></div>':mobile(s,page);}
else{const landscape=orientation==='landscape';width=landscape?960:540;height=landscape?540:960;
if(style.mode==='default'){screen.innerHTML=`<iframe title="Kiosk 原生参考 f84dd529" src="native-app/index.html?page=${encodeURIComponent(page)}&orientation=${landscape?'landscape':'portrait'}&device=${landscape?'android-14-1':'android-24-1'}" style="width:${width*2}px;height:${height*2}px;transform:scale(.5);pointer-events:none" sandbox="allow-scripts allow-same-origin"></iframe>`;}
else{const config=KioskPremium.demoConfig(style.theme);config.name=s.brandName;const rgb=s.primary.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));const on=(rgb[0]*299+rgb[1]*587+rgb[2]*114)/1000>150?'#17221d':'#ffffff';config.templateBrandOverrides={...config.templateBrandOverrides,primary:s.primary,onPrimary:on};screen.innerHTML=KioskPremium.render(config,KioskPremium.demoSession(page),{orientation});}}
screen.style.pointerEvents='none';fit();});addEventListener('resize',fit);parent.postMessage({type:'bd-ready'},location.origin);
})();
