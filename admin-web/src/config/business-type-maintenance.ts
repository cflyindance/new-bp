import {businessTemplateDimensions,canManageBusinessTemplates,readBusinessMenuTemplates} from './business-menu-template-store';
import {listCustomBusinessTypes,upsertCustomBusinessType} from './enterprise-platform-preset-store';
import {brandMenuChoices} from './brand-menu-choices';
import {templateDialog,templateEsc as esc} from './business-menu-template-ui';
import {PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES} from './platform-preset-catalog';
export function saveBusinessTypeName(label:string,id?:string,expected?:string):string {
 if(!canManageBusinessTemplates())throw Error('暂无经营业态维护权限。');const name=label.trim(),custom=listCustomBusinessTypes(),old=id?custom.find(t=>t.id===id):undefined;
 if(!name||name.length>30)throw Error('业态名称须为1至30字。');
 if(id&&(!old||old.label!==expected))throw Error('业态已更新，请重新打开编辑。');
 if(Object.entries(businessTemplateDimensions().category).some(([key,value])=>key!==id&&value.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('业态名称已存在。');
 if(PLATFORM_PRESET_BUILTIN_BUSINESS_TYPES.some(t=>t.label.toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('业态名称已存在。');
 return upsertCustomBusinessType(name,id??'custom-'+crypto.randomUUID()).id;
}
export function openBusinessTypeEditor(onSaved:(id:string)=>void,id?:string):void{
 const current=id?listCustomBusinessTypes().find(t=>t.id===id):undefined;if(id&&!current)return;
 const d=templateDialog(id?'编辑经营业态':'新增经营业态',`<label class="ba-field">业态名称<input name="businessTypeName" maxlength="30" value="${esc(current?.label??'')}" placeholder="例如：烘焙甜品"></label><p class="ba-muted">保存后可在该业态下配置单店/连锁等菜单模板。仅维护目录，不自动开通商户菜单。</p><p class="ba-error" data-business-type-error role="alert"></p><button type="button" class="ba-btn ba-primary" data-business-type-save>保存业态</button>`);
 d.querySelector('input')!.addEventListener('input',()=>{d.dataset.templateDirty='true'});
 d.querySelector('[data-business-type-save]')!.addEventListener('click',()=>{try{const key=saveBusinessTypeName(d.querySelector<HTMLInputElement>('input')!.value,id,current?.label);d.dataset.templateDirty='';d.close();onSaved(key)}catch(e){d.querySelector('[data-business-type-error]')!.textContent=(e as Error).message;}});
}
export function openBusinessTypeMaintenance(onChoose:(id:string)=>void):void{
 const d=templateDialog('经营业态维护','<p class="ba-note">内置业态保留，自定义业态支持新增与改名。每个业态可配置多组服务方式和组织模式的菜单；发布后供品牌/门店主动选择。</p><div data-business-type-list></div>');
 const render=()=>{const categories=businessTemplateDimensions().category,custom=new Set(listCustomBusinessTypes().map(t=>t.id)),templates=readBusinessMenuTemplates(brandMenuChoices());
 d.querySelector('[data-business-type-list]')!.innerHTML=`${canManageBusinessTemplates()?'<button type="button" class="ba-btn ba-primary" data-business-type-new>新增业态</button>':''}<div class="ba-table-wrap"><table><thead><tr><th>业态名称</th><th>来源</th><th>菜单模板</th><th>操作</th></tr></thead><tbody>${Object.entries(categories).map(([id,name])=>`<tr><td>${esc(name)}</td><td>${custom.has(id)?'自定义':'内置'}</td><td>${templates.filter(t=>t.draft.category===id).length} 组</td><td><div class="ba-actions"><button type="button" class="ba-btn" data-business-type-bind="${esc(id)}">管理绑定菜单</button>${custom.has(id)&&canManageBusinessTemplates()?`<button type="button" class="ba-btn" data-business-type-edit="${esc(id)}">改名</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
 d.querySelector('[data-business-type-new]')?.addEventListener('click',()=>openBusinessTypeEditor(()=>render()));
 d.querySelectorAll<HTMLButtonElement>('[data-business-type-edit]').forEach(b=>b.onclick=()=>openBusinessTypeEditor(()=>render(),b.dataset.businessTypeEdit));
 d.querySelectorAll<HTMLButtonElement>('[data-business-type-bind]').forEach(b=>b.onclick=()=>{d.close();onChoose(b.dataset.businessTypeBind!)});
 };render();
}
