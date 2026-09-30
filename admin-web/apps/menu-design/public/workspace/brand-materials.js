/* Optional local brand assets. No remote services or font execution. */
let brandAdvancedOpen=false,brandUploadToken=0,brandError='';
function brandMaterialsView(){
  const b=M.ensureBrand(s);
  return `<div class="brand-colors"><h3>品牌色（可选）</h3><p class="hint">选择色板或填写 #RRGGBB；没有品牌规范可以留空。</p><div class="grid three">${[['primary','品牌主色'],['secondary','辅助色 / 背景'],['accent','强调色']].map(([key,label])=>`<div class="brand-color"><label class="brand-picker">${label}<input aria-label="${label}拾色器" type="color" data-field="brandmat-${key}" value="${b[key]||'#234b3e'}"></label>${field(label+'色值','brandmat-'+key,b[key],'text','maxlength="7" placeholder="#234B3E"')}<button class="btn sm ghost" data-action="brand-clear" data-id="${key}">清除${label}</button><small>${b[key]?'已设置':'未设置 · 拾色器颜色仅作示例'}</small></div>`).join('')}</div></div>
  ${select('配色使用规则','brandmat-policy',b.policy,[['blend','品牌色为主，允许适配（推荐）'],['strict','严格使用品牌色'],['reference','优先参考图配色']])}
  <div class="notice"><span>${E(M.brandSummary(s))}<br>严格模式使用辅助色作背景；适配模式保留主色/强调色，其他颜色采用参考方向。请检查文字与背景的对比度。</span></div>
  ${brandError||M.brandIssue(s)?notice(E(brandError||M.brandIssue(s)),'bad'):''}
  <details class="brand-advanced" ${brandAdvancedOpen?'open':''}><summary>更多品牌材料 <span class="hint">字体偏好、装饰素材</span></summary><div class="brand-advanced-body">${select('品牌字体偏好（可选）','brandmat-fontPreference',b.fontPreference,[['未指定','未指定'],['简洁无衬线','简洁无衬线'],['典雅衬线','典雅衬线'],['手写气质','手写气质']])}<p class="hint">此处仅记录偏好，不加载或上传字体文件；正式使用品牌字体需确认授权。</p><div class="asset-drop"><span class="thumb">${b.decorImage?`<img alt="品牌装饰素材预览" src="${E(b.decorImage)}">`:'＋'}</span><div><strong>背景 / 纹理 / 装饰图（可选）</strong><small>${b.decorImage?E(b.decorName):'PNG / JPG，最大 5 MB，仅本机保存'}</small></div><span class="spacer"></span>${btn(b.decorImage?'替换装饰素材':'上传装饰素材','brand-upload','','sm')}${b.decorImage?btn('移除装饰素材','brand-remove','','sm'):''}</div><p class="hint">装饰素材可收集和预览，当前不会自动作为菜单背景。提供材料不代表每页必须展示，展示意图在上一步设置。</p></div></details>`;
}
function changeBrand(key,value){
  if(!['primary','secondary','accent','policy','fontPreference'].includes(key))return;
  const b=M.ensureBrand(s);
  if(['primary','secondary','accent'].includes(key)){value=String(value).trim();if(value&&!/^#[\da-f]{6}$/i.test(value)){brandError='色值未保存，请输入 #RRGGBB，例如 #234B3E。';render();return;}value=value.toUpperCase();}
  if(key==='policy'&&!['blend','strict','reference'].includes(value))return;
  checkpoint();b[key]=value;brandError='';dirty(true);render();
}
function brandAction(action,id){
  if(action==='brand-clear'){changeBrand(id,'');return;}
  if(action==='brand-remove'){brandUploadToken++;checkpoint();Object.assign(M.ensureBrand(s),{decorImage:'',decorName:''});brandError='';dirty(true);render();return;}
  if(action==='brand-upload')uploadBrandDecoration();
}
function uploadBrandDecoration(){
  document.querySelector('#brand-decoration-input')?.remove();
  const input=document.createElement('input');input.id='brand-decoration-input';input.type='file';input.accept='image/png,image/jpeg';input.hidden=true;input.setAttribute('aria-label','上传品牌装饰素材');document.body.append(input);input.oncancel=()=>input.remove();
  input.onchange=()=>{const file=input.files[0];input.remove();if(!file)return;
    const token=++brandUploadToken,target=s;
    const fail=message=>{if(token!==brandUploadToken||s!==target)return;brandError=message+' 原有素材已保留。';render();};
    if(!['image/png','image/jpeg'].includes(file.type)||file.size>5*1024*1024){fail('请选择不超过 5 MB 的 PNG 或 JPG。');return;}
    const reader=new FileReader();reader.onerror=()=>fail('图片读取失败。');reader.onload=()=>{const img=new Image();img.onerror=()=>fail('图片无法解码。');img.onload=()=>{if(token!==brandUploadToken||s!==target||busy)return;try{const ratio=Math.min(1,1000/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*ratio));cv.height=Math.max(1,Math.round(img.height*ratio));cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);const data=cv.toDataURL('image/png');checkpoint();Object.assign(M.ensureBrand(s),{decorImage:data,decorName:file.name});brandError='';dirty(true);render();}catch{fail('图片处理失败。')}};img.src=reader.result;};reader.readAsDataURL(file);
  };input.click();
}
document.addEventListener('toggle',e=>{if(e.target?.classList?.contains('brand-advanced'))brandAdvancedOpen=e.target.open;},true);
