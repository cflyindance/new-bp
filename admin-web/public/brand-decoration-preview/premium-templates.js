/* V6：模板注册表与配置；默认页面继续由原生 iframe 渲染。 */
(() => {
 'use strict';
 const P=KioskPages,D=KioskDemo,esc=D.esc;
 const themes=Object.assign(Object.create(null),{
  jade:{id:'jade',name:'松石雅宴',en:'JADE ATELIER',tag:'东方雅致',desc:'暖白纸感 · 深松绿 · 舒展留白',paper:'#f5f3ec',surface:'#fffdf8',ink:'#203d34',muted:'#617064',primary:'#254e40',on:'#ffffff',line:'#dce1d5',accent:'#84673d',radius:18,font:'"Kiosk Serif","Noto Serif SC","Songti SC","SimSun",serif'},
  noir:{id:'noir',name:'曜石金序',en:'NOIR RESERVE',tag:'静奢餐叙',desc:'曜石深色 · 香槟金 · 序列构图',paper:'#171d1c',surface:'#222b28',ink:'#f4efdf',muted:'#a9b1a6',primary:'#dbc18d',on:'#17221d',line:'#3d4840',accent:'#dbc18d',radius:8,font:'"Kiosk Serif","Noto Serif SC","Songti SC","SimSun",serif'},
  terra:{id:'terra',name:'赤陶食集',en:'TERRA TABLE',tag:'当代食集',desc:'陶土暖红 · 奶油纸色 · 鲜明大图',paper:'#fbf2e5',surface:'#fffaf3',ink:'#492c26',muted:'#81665c',primary:'#ad432e',on:'#ffffff',line:'#e7d8c7',accent:'#9c603f',radius:26,font:'"Kiosk Sans","Microsoft YaHei","PingFang SC",sans-serif'}
 });
 const previousUpgrade=P.upgrade;
 P.upgrade=c=>{const next=previousUpgrade(c);return next&&typeof next==='object'&&!Array.isArray(next)?{pageTemplates:{},templateBrandOverrides:{},...next}:next;};
 function valid(c){
  return !!c.pageTemplates&&typeof c.pageTemplates==='object'&&!Array.isArray(c.pageTemplates)&&Object.entries(c.pageTemplates).every(([id,value])=>P.catalog.some(p=>p.id===id)&&!!themes[value])
   &&!!c.templateBrandOverrides&&typeof c.templateBrandOverrides==='object'&&!Array.isArray(c.templateBrandOverrides)&&Object.entries(c.templateBrandOverrides).every(([key,value])=>key==='radius'?[4,12,18,28].includes(Number(value)):['primary','onPrimary','background'].includes(key)&&/^#[a-f0-9]{6}$/i.test(value));
 }
 function apply(c,id,suite=false){
  if(!themes[id])return c;
  const ids=suite?P.catalog.map(p=>p.id):[];
  return {...c,pageTemplates:{...c.pageTemplates,...Object.fromEntries(ids.map(page=>[page,id]))},decoratedPages:[...new Set([...c.decoratedPages,...ids])]};
 }
 function applyPage(c,page,id){const next=apply(c,id);return {...next,pageTemplates:{...next.pageTemplates,[page]:id},decoratedPages:[...new Set([...next.decoratedPages,page])]};}
 function style(c,id){
  const base=themes[id]||themes.jade,o=c.templateBrandOverrides||{};let t={...base};if(o.background){const rgb=o.background.slice(1).match(/../g).map(x=>parseInt(x,16));const light=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>150;t=light?{...t,surface:'#fffdf8',ink:'#203d34',muted:'#617369',line:'#dce1d5',accent:'#84673d'}:{...t,surface:'#222b28',ink:'#f4efdf',muted:'#a9b1a6',line:'#3d4840',accent:'#dbc18d'};}
  return '--pt-paper:'+(o.background||t.paper)+';--pt-surface:'+t.surface+';--pt-ink:'+t.ink+';--pt-muted:'+t.muted+';--pt-primary:'+(o.primary||t.primary)+';--pt-on:'+(o.onPrimary||t.on)+';--pt-line:'+t.line+';--pt-accent:'+t.accent+';--pt-radius:'+(o.radius||t.radius)+'px;--pt-display:'+t.font;
 }
 function panel(c,page){
  const entry=P.catalog.find(p=>p.id===page),active=c.decoratedPages.includes(page)?c.pageTemplates[page]:null,orientation=KioskDevicePreview.current().orientation;
  return '<div class="panel-title"><span>CURATED / 03 COLLECTIONS</span><h2>'+esc(entry.label)+'模板</h2><p>为这一页选择，也可贯穿整段点餐体验。</p></div><a class="pt-library-link" href="'+KioskDevicePreview.link('template-gallery.html',{page})+'" target="_blank" rel="noopener">'+D.icon('eye')+'三套并排对照 <span>↗</span></a><div class="pt-template-list">'+Object.values(themes).map(t=>'<article class="pt-choice '+(active===t.id?'is-selected':'')+'" data-theme="'+t.id+'"><button class="pt-choose" data-premium-template="'+t.id+'"><div class="pt-choice-thumb"><img src="template-screens-v6/'+t.id+'/'+page+'-'+orientation+'.png?v=6.2" alt="'+t.name+' · '+esc(entry.label)+'模板预览"></div><div class="pt-choice-text"><span>'+t.en+'</span><h3>'+t.name+'</h3><p>'+t.desc+'</p><div class="pt-swatches"><i style="background:'+t.paper+'"></i><i style="background:'+t.primary+'"></i><i style="background:'+t.accent+'"></i><b>'+(active===t.id?'当前模板':'应用到此页 →')+'</b></div></div></button><button class="pt-apply-suite" data-premium-suite="'+t.id+'">整套应用 · 24 个页面 '+D.icon('arrow')+'</button></article>').join('')+'</div><div class="hint">'+D.icon('lock')+'模板只改变视觉与展示结构，保留价格、输入和交易状态。选择模板会将本页切换为自定义，保存草稿后可再模拟发布。</div>';
 }
 function demoConfig(theme){
  return {...P.defaults,name:'禾食',english:'HE SHI',logo:'',primary:'#214b3d',onPrimary:'#ffffff',background:'#f7f3e8',radius:18,imageRatio:'wide',bannerPosition:'top',decoratedPages:P.catalog.map(p=>p.id),pageTemplates:Object.fromEntries(P.catalog.map(p=>[p.id,theme])),templateBrandOverrides:{}};
 }
 function demoSession(page){return {...D.newSession(),page,cart:{1:1,2:1},category:'推荐',paymentMethod:'scan',paymentResult:'success',paymentError:'',orderTotal:60,orderNumber:'A038',picks:{table:'A03',party:'2',service:'柜台自取',tip:'不添加',spec:'标准份',main:'招牌鸡腿饭',side:'田园时蔬',drink:'清爽柠檬茶'}};}
 window.KioskPremium={themes,valid,apply,applyPage,style,panel,demoConfig,demoSession};
})();
