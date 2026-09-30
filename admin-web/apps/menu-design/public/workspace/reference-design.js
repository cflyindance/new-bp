/* Reference inputs never represent model inference. Gallery metadata is authored. */
(function(root){
  const M=root.MenuModel,R=root.MenuRenderer,E=R.esc;
  const recipes=[
    {id:'hero',name:'一道主角，几分留白',tag:'大图主推',palette:'nature',note:'一块大面积主推区域，其他菜品沿侧边排列。'},
    {id:'collage',name:'不必对齐，也很有序',tag:'错落拼贴',palette:'clean',note:'大小与起点错落，轻装饰与呼吸感，菜名和价格保持清晰。'},
    {id:'editorial',name:'像一本料理杂志',tag:'自由构图',palette:'ink',note:'非对称双列、明显留白与编辑式标题，建立阅读节奏。'},
    {id:'text',name:'让文字成为主角',tag:'文字主导',palette:'clean',note:'精简图片，以分组、菜名和价格建立层级。'},
    {id:'grid',name:'整齐地呈现每一味',tag:'规整分栏',palette:'nature',note:'等宽分栏和一致的图片比例，适合快速浏览。'}
  ];
  function ensure(s){if(!s.reference)s.reference={source:null,id:null,image:'',name:'',recipe:'hero',mode:'adapt',focus:'all',palette:'nature',interpreted:false,samples:false,confirmed:false,selected:0,previous:null};if(!s.reference.analysis)s.reference.analysis={status:s.reference.interpreted?'ready':'idle',kind:'legacy'};return s.reference;}
  function ready(s){const r=ensure(s);return !!(r.source&&r.analysis.status==='ready'&&r.interpreted&&r.samples&&r.confirmed);}
  function invalidate(s){const r=ensure(s);if(r.samples)r.previous={recipe:r.recipe,mode:r.mode,palette:r.palette,selected:r.selected,state:r.sampleInput};r.interpreted=false;r.samples=false;r.confirmed=false;}
  function choose(s,id){const p=recipes.find(x=>x.id===id);if(!p)return;invalidate(s);Object.assign(s.reference,{source:'gallery',id,image:'',name:p.name,recipe:id,palette:p.palette,analysis:{status:'idle',kind:'gallery'},selected:0});}
  function sample(s,index=0){const r=ensure(s),layout=r.mode==='style'||['color','type'].includes(r.focus)?(index?'text':'grid'):r.recipe;return {...s,layout,style:['layout','type'].includes(r.focus)?s.style:r.palette,fontMood:r.focus==='color'?'sans':r.palette==='clean'?'sans':'serif',compositionVariant:index,overrides:{},reference:undefined};}
  function confirm(s,index){const r=ensure(s);if(!r.source||r.analysis.status!=='ready'||!r.interpreted||!r.samples)return;const v=sample(s,index);s.layout=v.layout;s.style=v.style;s.compositionVariant=v.compositionVariant;s.fontMood=v.fontMood;s.overrides={};r.selected=index;r.confirmed=true;}
  function beginAnalysis(s){const r=ensure(s);invalidate(s);r.analysis={status:'running',kind:r.source==='upload'?'demo':'gallery'};}
  function finishAnalysis(s){const r=ensure(s);if(r.source==='upload'){r.recipe='collage';r.palette='clean';}r.analysis={status:'ready',kind:r.source==='upload'?'demo':'gallery'};}
  function analysisView(s){
    const r=ensure(s),a=r.analysis,p=recipes.find(x=>x.id===r.recipe)||recipes[0];
    if(a.status!=='ready')return `<div class="analysis-status" role="status"><span class="eyebrow">REFERENCE ANALYSIS</span><h3>${a.status==='failed'?'分析未完成':a.status==='cancelled'?'分析已取消':'参考图已准备好'}</h3><p>${a.status==='failed'?'演示失败：参考图与商品已保留，可以重试或更换参考图。':a.status==='cancelled'?'参考图和商品已保留，继续分析后可确认风格。':'开始自动分析流程，完成后再确认参考特征。'}</p>${button(a.status==='idle'?'开始分析（模拟）':'重新分析（模拟）','analyze','',true)}</div>`;
    const colors={nature:['#f5f0e6','#244c39','#bf8d5b'],ink:['#183c35','#e9d9ae','#faf5e8'],clean:['#faf7f0','#a94232','#303932']}[r.palette];
    const mood={nature:'自然质感 · 温暖克制',ink:'深色餐叙 · 沉稳精致',clean:'轻盈餐桌 · 明快有呼吸感'}[r.palette];
    return `<div class="analysis-report"><div class="section-head"><h3>风格分析结果</h3><span class="badge warn">模拟结果 · ${r.interpreted?'已确认':'待你确认'}</span></div>
    <p class="hint">${r.analysis.kind==='gallery'?'来源：原创图库的预设特征，不是模型识别。':r.analysis.kind==='legacy'?'来源：之前人工设置的参考特征，不是模型识别。':'来源：预编写示例，与上传图片内容无关；仅演示 AI 分析后的交互。'}</p>
    <dl class="analysis-facts"><div><dt>整体风格</dt><dd>${E(mood)}</dd></div><div><dt>配色与背景</dt><dd><span class="analysis-swatches">${colors.map(c=>`<span style="background:${c}" title="${c}"></span>`).join('')}</span>${r.palette==='ink'?'深色底与暖金强调':'浅色底与少量强调色'}，突出菜品与价格。</dd></div><div><dt>构图与主次</dt><dd><strong>${E(p.tag)}</strong> · ${E(p.note)}</dd></div><div><dt>字体气质</dt><dd>${r.palette==='clean'?'简洁无衬线，菜名清晰，价格醒目。':'标题带衬线气质，正文简洁；标题与价格形成层级。'}</dd></div><div><dt>装饰语言</dt><dd>${r.recipe==='collage'?'轻量色块与错落留白，装饰不遮挡商品信息。':'克制的分隔与留白，主次明确，不堆叠无关装饰。'}</dd></div></dl>
    <div class="reference-reading"><strong>如何适配你的菜单</strong><p>当前 ${s.width} × ${s.height} ${s.unit||'px'} · ${M.items(s).length} 道商品，按每页最多 ${s.density} 道规划 ${M.pages(s).length} 页；不把全部商品硬塞进参考图。</p><p>只借鉴设计特征，不复制参考图的品牌、菜名、价格或菜品图片。以上商品数量来自当前材料。</p></div>
    <details class="analysis-corrections" ${a.edited?'open':''}><summary>修正分析结果</summary><p class="hint">不符合你的参考图？可以调整；修改后需要重新确认。</p>${options('构图特征','recipe',r.recipe,recipes.map(x=>[x.id,x.tag]))}${options('配色与字体气质','palette',r.palette,[['nature','奶油白 / 森林绿 · 自然衬线'],['ink','墨绿 / 暖金 · 精致衬线'],['clean','暖白 / 朱红 · 简洁无衬线']])}</details>
    </div>`;
  }
  function demo(recipe){const s=M.create();s.items[5].price=36;s.brand='山野餐桌';s.subtitle='当季食材 / 自然风味';s.layout=recipe.id;s.style=recipe.palette;s.width=1080;s.height=1400;return s;}
  const button=(name,a,id='',primary=false,disabled=false)=>`<button class="btn ${primary?'primary':''}" data-action="ref-${a}" data-id="${E(id)}" ${disabled?'disabled':''}>${name}</button>`;
  function options(label,key,value,list){return `<label class="ref-field">${label}<select data-field="ref-${key}">${list.map(([v,n])=>`<option value="${v}" ${v===value?'selected':''}>${n}</option>`).join('')}</select></label>`;}
  function view(s){const r=ensure(s),p=recipes.find(x=>x.id===r.recipe),thumb=r.source==='upload'?`<img src="${E(r.image)}" alt="上传的主参考图">`:r.source?R.svg(demo(p),M.pages(demo(p))[0]):'';
    return `<div class="ref-intro"><div><span class="eyebrow">REFERENCE → YOUR MENU</span><h2>从一张喜欢的菜单，开始你的设计。</h2><p>借鉴构图和气质，内容始终来自你选中的 ${M.items(s).length} 道商品。</p></div><span class="badge warn">AI 识别流程演示 · 未接入模型</span></div>
    <section class="section"><div class="section-head"><h2>01 选择一张主参考图</h2>${button('＋ 上传参考图','upload')}</div><p class="hint">PNG / JPG · 最大 5 MB · 仅本机处理。也可以从以下原创参考图库选择。</p>
    <div class="reference-gallery">${recipes.map(t=>{const d=demo(t);return `<button class="reference-tile ${r.source==='gallery'&&r.id===t.id?'selected':''}" data-action="ref-choose" data-id="${t.id}" aria-label="选择参考图：${t.tag}"><div class="reference-art">${R.svg(d,M.pages(d)[0])}</div><span class="reference-tag">${t.tag}</span><strong>${t.name}</strong><small>${r.id===t.id&&r.source==='gallery'?'✓ 当前参考':'原创图库 · 设计示例'}</small></button>`}).join('')}</div></section>
    ${r.source?`<section class="section"><div class="section-head"><h2>02 自动分析参考图</h2><span class="badge">${r.source==='upload'?'本地上传':'原创参考图库'}</span></div><div class="reference-brief"><div class="reference-source">${thumb}<p>${E(r.name)}</p></div><div class="reference-controls">
    ${analysisView(s)}
    ${r.analysis.status==='ready'?`${options('参考方式','mode',r.mode,[['adapt','参考并适配（推荐）'],['faithful','尽量还原布局'],['style','只参考风格']])}
    ${options('参考范围','focus',r.focus,[['all','整体效果'],['layout','仅布局'],['color','仅配色'],['type','仅字体气质']])}


    <div class="reference-reading"><strong>本次参考意图</strong><p>${r.mode==='style'||['color','type'].includes(r.focus)?'借鉴视觉气质，重新组织布局。':E(p.note)}</p><p>${r.mode==='faithful'?'尽量保留主次比例；数量不一致时先确认分页适配。':'按实际商品数量与画布比例适配，不复制参考图中的品牌或价格。'}</p></div>
    <label class="check-label"><input type="checkbox" data-field="ref-interpreted" ${r.interpreted?'checked':''}>我确认以上分析与参考方式，按当前商品进行适配</label>`:'' }
    </div></div><div class="notice warn">分析与样稿均为本地模拟，未调用 AI。上传图使用固定示例，图库使用预设特征；所有结果均可修正。</div>
    <div class="row wrap">${button(r.samples?'重新生成对比样稿':'生成 2 个菜单样稿','samples','',true,!M.canGenerate(s)||!r.interpreted||r.analysis.status!=='ready')}${r.analysis.status==='ready'?button('重新分析（模拟）','analyze'):''}${button('演示分析失败','analysis-fail')}${r.analysis.status==='ready'?button('演示样稿失败一次','fail'):''}<span class="hint">${M.pages(s).length} 页预计 · 每页最多 ${s.density} 道 · 所有选中商品保留</span></div></section>`:`<div class="empty-preview"><p>选择或上传参考图后，自动进入分析流程；你只需确认或修正结果。</p></div>`}
    ${r.previous&&!r.samples?`<div class="notice warn">参考或材料发生变化，之前的样稿已失效。草稿内容保留；请重新确认参考特征并生成样稿。</div>${r.previous.state?`<details class="section"><summary>查看旧样稿（已失效，仅供对照）</summary><div class="reference-old">${R.svg(r.previous.state,M.pages(r.previous.state)[0])}</div></details>`:''}`:''}
    ${r.samples?`<section class="section"><div class="section-head"><h2>03 对比样稿，确认你的方向</h2><span class="badge ${r.confirmed?'good':''}">${r.confirmed?'✓ 方向已确认':'请选择一份样稿'}</span></div><p class="hint">${r.mode==='style'?'重新规划布局，借鉴色彩与字体气质。':'保留参考图的主次比例和布局特征；B 方案调整视觉重心。'} ${M.items(s).length} 道商品将分为 ${M.pages(s).length} 页，不遗漏商品。</p><div class="reference-candidates">${[0,1].map(i=>{const d=sample(s,i),pages=M.pages(d);return `<article class="reference-candidate ${r.selected===i?'selected':''}"><button class="candidate-pick" data-action="ref-select" data-id="${i}" aria-label="选择样稿 ${i?'B':'A'}"><span class="candidate-title">${i?'B · 调整重心':'A · 延续参考'} ${r.selected===i?'✓':''}</span>${R.svg(d,pages[0])}<span class="hint">首页 · 真实商品与价格</span></button><details><summary>查看典型内容页</summary>${R.svg(d,pages[1]||pages[0])}</details></article>`}).join('')}</div><div class="reference-confirm">${button(r.confirmed?'✓ 已采用样稿 '+(r.selected?'B':'A'):'采用样稿 '+(r.selected?'B':'A')+'，确认方向','confirm','',true,!M.canGenerate(s))}<small>确认后，可进入页面规划并生成可编辑菜单。</small></div></section>`:''}`;
  }
  root.MenuReference={analysisView,recipes,ensure,ready,invalidate,choose,beginAnalysis,finishAnalysis,sample,confirm,view};
})(window);
