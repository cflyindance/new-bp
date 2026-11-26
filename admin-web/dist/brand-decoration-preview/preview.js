/* Presentation only. Parent sends a scoped draft; no order/payment APIs are available. */
(()=>{'use strict';const screen=document.querySelector('#screen');let width=540,height=960;
function fit(){const scale=Math.min(innerWidth/width,innerHeight/height);Object.assign(screen.style,{width:width+'px',height:height+'px',left:(innerWidth-width*scale)/2+'px',top:(innerHeight-height*scale)/2+'px',transform:'scale('+scale+')'});}
const esc=value=>KioskDemo.esc(String(value));
function mobile(s,page,palette,landscape){const theme=s.styles[page].theme,colors={jade:['#f7f4eb','#204d40','#fff'],noir:['#191c1b','#d3b67a','#191c1b'],terra:['#fbf1e4','#9c4831','#fff']}[theme],style=palette ? `--paper:${palette.background};--ink:${palette.ink};--on:${palette.onPrimary};--primary:${palette.primary};--accent:${palette.accent};--surface:${palette.surface};--line:${palette.line}` : `--paper:${colors[0]};--ink:${s.primary};--on:${colors[2]}`;
let body='',action='开始点餐';const meal=(i)=>`<div class="food"><div class="meal" style="background-position:${i%2?'100%':'0'} ${i>1?'100%':'0'}"></div><b>${['炙烤鸡腿饭','时蔬谷物碗','慢炖牛肉饭','南瓜浓汤'][i]}</b><div class="em-food-action"><small>¥${[32,28,42,18][i]}.00</small><button type="button" class="em-add" aria-label="加购" tabindex="-1">＋</button></div></div>`;
if(page==='home')body='<span class="eyebrow">GOOD FOOD, GOOD MOMENTS</span><h1>一餐一味，<br>认真款待。</h1><p>新鲜现做，把好味道带到你面前。</p><div class="hero"></div>';
if(page==='menu'){body='<div class="menu-tabs"><b>主厨推荐</b><span>当季轻食</span><span>饮品</span></div><div class="grid">'+[0,1,2,3].map(meal).join('')+'</div>';action='查看购物车 · ¥60.00';}
if(page==='detail'){body='<div class="hero"></div><h1>炙烤鸡腿饭</h1><p data-emenu-copy="detail-note">鲜嫩鸡腿，搭配当季时蔬与热米饭。</p><div class="row"><b>口味</b><span>原味　微辣</span></div><div class="row"><b>份量</b><span>标准份</span></div>';action='加入购物车 · ¥32.00';}
if(page==='review'){body='<span class="eyebrow">YOUR ORDER</span><h1>确认这一餐</h1><div class="row"><b>炙烤鸡腿饭 × 1</b><span>¥32.00</span></div><div class="row"><b>时蔬谷物碗 × 1</b><span>¥28.00</span></div><div class="row"><b>合计</b><b>¥60.00</b></div>';action='确认订单';}
if(page==='payment'){body='<span class="eyebrow">CHECKOUT</span><h1>选择支付方式</h1><p>应付金额</p><h1>¥60.00</h1><div class="row" data-payment-method="card"><b>信用卡／借记卡</b><span>○</span></div><div class="row" data-payment-method="scan"><b>扫码支付</b><span>○</span></div>';action='确认支付（演示）';}
if(page==='finish'){body='<div class="success"><i>✓</i><p>THANK YOU FOR YOUR ORDER</p><h2>下单成功</h2><p>您的取餐号</p><h1>A038</h1><p>请留意取餐屏叫号</p></div>';action='返回菜单';}
if(page==='login'){body='<span class="eyebrow">MEMBERSHIP</span><h1>欢迎回来</h1><p>登录会员，享受专属礼遇。</p><input aria-label="演示手机号" placeholder="输入手机号码" readonly>';action='登录（演示）';}
return `<div class="em em-layout-${theme}${landscape ? ' em-landscape' : ''}" data-page="${esc(page)}" style="${style}"><header><strong>${esc(s.brandName)}</strong><span>电子菜单 · 演示</span></header><main>${body}</main><footer><button tabindex="-1">${page === 'menu' || page === 'detail'
    ? `<span data-emenu-copy>${action.split(' · ')[0]}</span> · ${action.split(' · ')[1]}`
    : action}</button></footer></div>`;
}
function applyNativePalette(frame, palette) {
  const doc = frame.contentDocument;
  if (!doc?.head) return;
  let theme = doc.getElementById('bd-native-palette');
  let rules = doc.getElementById('bd-native-palette-rules');
  if (!palette) {
    theme?.remove();
    rules?.remove();
    return;
  }
  if (!theme) {
    theme = doc.createElement('style');
    theme.id = 'bd-native-palette';
    doc.head.append(theme);
  }
  if (!rules) {
    rules = doc.createElement('link');
    rules.id = 'bd-native-palette-rules';
    rules.rel = 'stylesheet';
    rules.href = new URL('native-palette.css', location.href).href;
    doc.head.append(rules);
  }
  // The original screen stays light. Only change the colors its controls use.
  const tokens = {
    '--primary-color': palette.primary,
    '--primary-selected-color': palette.primary,
    '--primary-secondary-color': palette.selectedFill,
    '--primary-color-darker': palette.primary,
    '--background-crm-login': palette.labelFill,
    '--bd-native-on-primary': palette.onPrimary,
    '--bd-native-on-selected': palette.selectedText,
    '--bd-native-on-label': palette.labelText,
    '--bd-native-accent': palette.nativeAccent,
    '--bd-native-muted': '#30343a'
  };
  const colors = Object.entries(tokens)
    .filter(([, color]) => /^#[0-9a-f]{6}$/i.test(color))
    .map(([name, color]) => `${name}: ${color} !important;`)
    .join('\n');
  theme.textContent = ':root, .appContent___4gt1b { ' + colors + ' }';
}
const nativeContent = new WeakMap();
function updateNativeContent(doc, elements, reportDefaults, selection) {
  const previous = nativeContent.get(doc);
  previous?.observer.disconnect();
  previous?.restore();
  nativeContent.delete(doc);
  if (!selection && !reportDefaults && !elements.some(field => typeof field.value === 'string')) return;
  const applied = new Map();
  let marked = new Set();
  const click = event => selectPreviewField(event, selection?.request);
  const style = selection ? doc.createElement('style') : null;
  if (style) {
    style.textContent = `
      [data-bd-select-field] { cursor: pointer; }
      [data-bd-select-field]:hover, [data-bd-selection] { outline: 2px solid #1677ff; outline-offset: 2px; }
      [data-bd-selection="field"] { outline-width: 3px; }
    `;
    doc.head.append(style);
    doc.addEventListener('click', click, true);
  }
  const apply = () => {
    const defaults = {};
    const nextMarked = new Set();
    for (const {id, kind, group, selector, original: expectedOriginal, value} of elements) {
      if (kind !== 'text') continue;
      let text;
      for (const candidate of doc.querySelectorAll(selector)) {
        text = Array.from(candidate.childNodes).find(node => {
          if (node.nodeType !== 3) return false;
          const existing = applied.get(node);
          const original = existing && node.textContent === existing.value ? existing.original : node.textContent;
          return expectedOriginal ? original.trim() === expectedOriginal : original.trim().length > 0;
        });
        if (text) break;
      }
      if (!text) continue;
      const existing = applied.get(text);
      const original = existing && text.textContent === existing.value ? existing.original : text.textContent;
      defaults[id] = original.trim();
      if (selection && text.parentElement) {
        const target = text.parentElement;
        markPreviewField(target, { id, group }, selection);
        nextMarked.add(target);
      }
      if (typeof value !== 'string' || text.textContent === value) continue;
      applied.set(text, { original, value });
      text.textContent = value;
    }
    for (const target of marked) {
      if (!nextMarked.has(target)) clearPreviewField(target);
    }
    marked = nextMarked;
    reportDefaults?.(defaults);
  };
  const observer = new MutationObserver(apply);
  apply();
  observer.observe(doc.documentElement, { subtree: true, childList: true, characterData: true });
  nativeContent.set(doc, { observer, restore: () => {
    if (style) {
      doc.removeEventListener('click', click, true);
      style.remove();
    }
    for (const target of marked) clearPreviewField(target);
    for (const [node, entry] of applied) {
      if (node.textContent === entry.value) node.textContent = entry.original;
    }
  }});
}
function styleNativeHeader(doc, palette) {
  doc.getElementById('bd-native-header-style')?.remove();
  if (!palette || ![palette.primary, palette.onPrimary].every(color => /^#[0-9a-f]{6}$/i.test(color))) return;
  const style = doc.createElement('style');
  style.id = 'bd-native-header-style';
  style.textContent = `
    :is(.logoBox___sS0OZ,.logoBox___vs4kp,.header___BrXnk) {
      background-color: ${palette.primary};
      color: ${palette.onPrimary};
      box-shadow: ${palette.divider ? 'inset 0 -1px 0 ' + palette.onPrimary + '40' : 'none'};
    }
    :is(.logoBox___sS0OZ,.logoBox___vs4kp,.header___BrXnk) :is(img[class*="backPrePage"],img[class*="homeBtn"]) {
      filter: ${palette.onPrimary === '#ffffff' ? 'brightness(0) invert(1)' : 'brightness(0)'};
    }
  `;
  doc.head.append(style);
}
function applyCustomContent(root, elements) {
  for (const { kind, selector, attribute, value } of elements) {
    const target = root.querySelector(selector);
    if (!target || !value) continue;
    if (kind === 'hidden') target.style.display = 'none';
    else if (kind === 'text') {
      if (attribute === 'placeholder') target.setAttribute(attribute, value);
      else target.textContent = value;
    }
    else if (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) {
      const image = document.createElement('img');
      image.className = 'bd-content-image';
      image.src = value;
      image.alt = '';
      const original = target.firstElementChild;
      image.addEventListener('load', () => { if (original) original.style.display = 'none'; });
      image.addEventListener('error', () => image.remove());
      target.append(image);
    }
  }
}
let selectionRequest;
function selectPreviewField(event, request) {
  if (!Number.isInteger(request)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const target = event.target.closest?.('[data-bd-select-field]');
  parent.postMessage({ type: 'bd-select-content', id: target?.dataset.bdSelectField ?? null, request }, location.origin);
}
document.querySelector('#stage').addEventListener('click', event => selectPreviewField(event, selectionRequest), true);

function markPreviewField(target, field, selection) {
  target.dataset.bdSelectField = field.id;
  if (field.group === selection.region) target.dataset.bdSelection = field.id === selection.field ? 'field' : 'region';
  else delete target.dataset.bdSelection;
}
function clearPreviewField(target) {
  delete target.dataset.bdSelectField;
  delete target.dataset.bdSelection;
}
function markSelectableContent(elements, selection) {
  if (!selection) return;
  const header = screen.querySelector('header');
  if (header) header.dataset.bdSelectField = 'top-navigation';
  for (const field of elements) {
    const target = screen.querySelector(field.selector);
    if (!target) continue;
    markPreviewField(target, field, selection);
    const hitArea = field.hitArea ? target.closest(field.hitArea) : null;
    if (hitArea) hitArea.dataset.bdSelectField = field.id;
  }
  for (const control of screen.querySelectorAll('a,button,input,select,textarea,[tabindex]')) control.tabIndex = -1;
}
function renderNative(page, landscape, palette, headerPalette, elements, reportDefaults, postPaymentScene, selection) {
  const direction = landscape ? 'landscape' : 'portrait';
  const device = landscape ? 'android-14-1' : 'android-24-1';
  const params = new URLSearchParams({ page, orientation: direction, device });
  if (page === 'afterCreditCardPay') params.set('postPaymentScene', postPaymentScene);
  const src = `native-app/index.html?${params}`;
  let frame = screen.querySelector('iframe[data-native-preview]');
  if (frame?.getAttribute('src') !== src) {
    frame = document.createElement('iframe');
    frame.dataset.nativePreview = '';
    frame.tabIndex = -1;
    frame.title = 'Kiosk 原生参考 f84dd529';
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    Object.assign(frame.style, {
      width: width * 2 + 'px', height: height * 2 + 'px',
      transform: 'scale(.5)', pointerEvents: 'none'
    });
    frame.src = src;
    screen.replaceChildren(frame);
  }
  frame.style.pointerEvents = selection ? 'auto' : 'none';
  const refresh = () => {
    applyNativePalette(frame, palette);
    const doc = frame.contentDocument;
    if (!doc?.head) return;
    styleNativeHeader(doc, headerPalette);
    updateNativeContent(doc, elements, reportDefaults, selection);
  };
  frame.onload = refresh;
  if (frame.contentDocument?.URL !== 'about:blank') refresh();
}
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='bd-render')return;const {scheme:s,palette,page,orientation}=event.data;const style=s?.styles?.[page];if(!style)return;
const { headerPalette } = event.data;
const postPaymentScene = ['tip', 'signature'].includes(event.data.postPaymentScene) ? event.data.postPaymentScene : 'both';
const elements = Array.isArray(event.data.elements) ? event.data.elements : [];
const request = event.data.defaultCopyRequest;
let previousDefaults = '';
const reportDefaults = Number.isInteger(request) ? values => {
  const snapshot = JSON.stringify(values);
  if (snapshot === previousDefaults || !Object.keys(values).length) return;
  previousDefaults = snapshot;
  parent.postMessage({ type: 'bd-default-copy', request, values }, location.origin);
} : undefined;

const roleColors=palette?{
  'label-fill':palette.labelFill,'label-text':palette.labelText,
  'selected-fill':palette.selectedFill,'selected-text':palette.selectedText,'selected-muted':palette.selectedMuted,
  'secondary-fill':palette.secondaryFill,'secondary-text':palette.secondaryText,'control-line':palette.controlLine,
  'muted':palette.muted,
  'success-fill':palette.successFill,'success-text':palette.successText,
  'warning-fill':palette.warningFill,'warning-text':palette.warningText,
  'error-fill':palette.errorFill,'error-text':palette.errorText
}:undefined;
if(s.channel==='emenu'){const landscape=orientation==='landscape';width=landscape?844:390;height=landscape?390:844;screen.innerHTML=style.mode==='default'?'<div class="em-empty"><div><strong>项目默认页面</strong>eMenu 原生默认效果尚未接入。<br>切换自定义装修可查看移动端样式。</div></div>':mobile(s,page,palette,landscape);}
else{const landscape=orientation==='landscape';width=landscape?960:540;height=landscape?540:960;
if(style.mode==='default'){renderNative(page,landscape,s.paletteId==='system'?undefined:palette,headerPalette,elements,reportDefaults,postPaymentScene,event.data.selection);}
else{const config=KioskPremium.demoConfig(style.theme);config.name=s.brandName;const rgb=s.primary.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));const on=(rgb[0]*299+rgb[1]*587+rgb[2]*114)/1000>150?'#17221d':'#ffffff';config.templateBrandOverrides={...config.templateBrandOverrides,primary:s.primary,onPrimary:on};screen.innerHTML=KioskPremium.render(config,KioskPremium.demoSession(page),{orientation,postPaymentScene});
if(palette){const item=screen.firstElementChild;const tokens={paper:palette.background,surface:palette.surface,ink:palette.ink,muted:palette.muted,line:palette.line,accent:palette.accent,primary:palette.primary,on:palette.onPrimary};
for(const [name,color] of Object.entries(tokens))item.style.setProperty('--pt-'+name,color);}}}
if(roleColors && style.mode==='custom' && screen.firstElementChild){
  screen.firstElementChild.classList.add('has-scheme-palette');
  for(const [role,color] of Object.entries(roleColors))screen.firstElementChild.style.setProperty('--bd-role-'+role,color);
}
if (style.mode === 'custom' && screen.firstElementChild) {
  const layout = event.data.referenceLayout ?? event.data.homeLayout;
  if (layout) {
    const root = screen.firstElementChild;
    const kioskHome = s.channel === 'kiosk' && page === 'home';
    root.classList.add(kioskHome ? 'pt-reference-home' : 'bd-reference-layout');
    root.dataset.imageFirst = layout.imageFirst === true ? 'true' : 'false';
    root.dataset.referenceAlign = layout.align === 'center' ? 'center' : 'start';
    const bounded = (value, min, max, fallback) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
    root.style.setProperty('--pt-ref-image', bounded(layout.imageShare, 42, 62, 50) + '%');
    root.style.setProperty('--pt-ref-radius', bounded(layout.radius, 4, 36, 24) + 'px');
  }
  if (reportDefaults) {
    const defaults = {};
    for (const {id, kind, selector, attribute} of elements) {
      if (kind !== 'text') continue;
      const target = screen.firstElementChild.querySelector(selector);
      if (target) defaults[id] = (attribute === 'placeholder' ? target.getAttribute(attribute) ?? '' : target.innerText).trim();
    }
    reportDefaults(defaults);
  }
  applyCustomContent(screen.firstElementChild, elements);
  const header = screen.firstElementChild.querySelector('header');
  if (header && headerPalette) {
    header.classList.add('bd-themed-header');
    header.style.backgroundColor = headerPalette.primary;
    header.style.color = headerPalette.onPrimary;
    header.style.boxShadow = headerPalette.divider ? 'inset 0 -1px 0 ' + headerPalette.onPrimary + '40' : 'none';
  }
}
selectionRequest = event.data.selection?.request;
screen.style.pointerEvents = event.data.selection ? 'auto' : 'none';
markSelectableContent(elements, style.mode === 'custom' ? event.data.selection : undefined);fit();});addEventListener('resize',fit);parent.postMessage({type:'bd-ready'},location.origin);
})();
