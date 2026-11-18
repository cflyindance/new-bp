import {bindOpenedBrandMenuTree} from './brand-menu-read-tree';
import {readBusinessMenuTemplates,planTemplateSelection} from './business-menu-template-store';
import {templateEsc} from './business-menu-template-ui';
import {matchesBrandMenuScene,type BrandMenuSceneOptions} from './brand-menu-scene';
import type {MenuChoice} from './brand-menu-choices';

const bindings=new WeakMap<HTMLElement,AbortController>();
/** Creation-only shortcut. Published releases remain the source of menu keys. */
export function bindFlatBusinessPresets(host:HTMLElement,choices:MenuChoice[],read:()=>string[],apply:(keys:string[])=>void,scene:BrandMenuSceneOptions,allowed?:Set<string>){
 bindings.get(host)?.abort();const controller=new AbortController();bindings.set(host,controller);
 host.previousElementSibling?.matches('[data-template-toolbar]')&&host.previousElementSibling.remove();
 const bar=document.createElement('section');bar.dataset.templateToolbar='';bar.className='ba-flat-presets';host.before(bar);
 const saved=host.dataset.flatPresetState?JSON.parse(host.dataset.flatPresetState):{};
 let selected:string=saved.selected??'',baseline:string[]=saved.baseline??[],source:string=saved.source??'',pending:HTMLDialogElement|undefined;
 const rows=()=>readBusinessMenuTemplates(choices).filter(t=>t.enabled&&t.releases.at(-1)?.org===scene.read().org);
 const changed=()=>read().length!==baseline.length||read().some(k=>!baseline.includes(k));
 const updateAppliedCard=()=>{
  bar.querySelectorAll<HTMLButtonElement>('[data-business-preset]').forEach(card=>{
   const applied=card.dataset.businessPreset===selected;
   card.toggleAttribute('data-applied',applied);
   card.querySelector<HTMLElement>('[data-applied-label]')!.hidden=!applied;
  });
 };
 const provenance=()=>{updateAppliedCard();host.dataset.flatPresetState=JSON.stringify({selected,baseline,source});if(source)bar.dataset.templateSource=source+` · 额外选择 ${read().filter(k=>!baseline.includes(k)).length} 项／取消 ${baseline.filter(k=>!read().includes(k)).length} 项`;};
 const render=()=>{
  const cards=rows().map(template=>{
   const release=template.releases.at(-1)!;
   const plan=planTemplateSelection([],release.keys,choices,allowed,'replace');
   const pages=choices.filter(choice=>choice.isPage&&plan.next.includes(choice.key)).length;
   return `<button type="button" class="ba-template-card" data-business-preset="${templateEsc(template.id)}" aria-haspopup="dialog">
    <span class="ba-template-card-content"><strong>${templateEsc(release.name)}</strong><small>${pages} 个页面</small><small class="ba-template-applied" data-applied-label hidden>已应用</small></span>
    <span class="ba-template-arrow" aria-hidden="true">→</span>
   </button>`;
  }).join('');
  bar.innerHTML=`<h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l5 5v13H6zM14 3v5h5"/></svg>使用菜单模板</h3><p class="ba-muted">预览后可补充或替换</p><div class="ba-flat-preset-options">${cards||'<p class="ba-template-empty ba-muted">暂无已发布模板</p>'}</div><span role="alert" data-preset-error></span>`;
  updateAppliedCard();
 };
 const choose=(id:string,automatic=false)=>{
  if(automatic&&(id===selected||changed()))return;
  const template=rows().find(t=>t.id===id),release=template?.releases.at(-1);
  if(!template||!release)return;
  const preview=planTemplateSelection([],release.keys,choices,allowed,'replace');
  const pages=choices.filter(choice=>choice.isPage&&preview.next.includes(choice.key)).length;
  const commit=(mode:'replace'|'add',error:Element)=>{
   if(rows().find(t=>t.id===id)?.revision!==template.revision){error.textContent='菜单模板已更新，请关闭后重新选择。';return false;}
   if(!pages){error.textContent='该模板暂无当前可用菜单。';return false;}
   const plan=planTemplateSelection(read(),release.keys,choices,allowed,mode);
   apply(plan.next);baseline=[...plan.next];selected=id;source=`模板「${release.name}」v${release.version} [${id}]`;
   provenance();host.dispatchEvent(new Event('change',{bubbles:true}));
   return true;
  };
  if(automatic){commit('replace',bar.querySelector('[data-preset-error]')!);return;}
  if(pending?.open)return;
  const dialog=document.createElement('dialog');
  pending=dialog;
  dialog.className='ba ba-modal ba-create-template-preview';
  dialog.setAttribute('aria-labelledby','brand-create-template-title');
  dialog.innerHTML=`<div class="ba-dialog-inner">
   <header class="ba-dialog-header">
    <div class="ba-create-section-head"><button type="button" class="ba-btn" data-close aria-label="关闭模板预览">×</button>
     <div><h2 id="brand-create-template-title">预览菜单模板</h2><p class="ba-muted">${templateEsc(release.name)} · ${pages} 个页面</p></div>
    </div>
    <div class="ba-actions"><button type="button" class="ba-btn" data-apply="add">补充到已选菜单</button><button type="button" class="ba-btn ba-primary" data-apply="replace">替换已选菜单</button></div>
   </header>
   <div class="ba-dialog-body"><p role="alert" data-preview-error></p><div data-template-tree></div></div>
  </div>`;
  dialog.querySelector('[data-close]')!.addEventListener('click',()=>dialog.close());
  dialog.querySelectorAll<HTMLButtonElement>('[data-apply]').forEach(button=>{
   button.disabled=!pages;
   button.onclick=()=>{if(commit(button.dataset.apply as 'replace'|'add',dialog.querySelector('[data-preview-error]')!))dialog.close();};
  });
  bindOpenedBrandMenuTree(dialog.querySelector('[data-template-tree]')!,choices,new Set(preview.next),{emptyText:'该模板暂无当前可用菜单。'});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);
  dialog.showModal();
 };
 bar.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLElement>('[data-business-preset]');if(button)choose(button.dataset.businessPreset!);});
 host.addEventListener('change',provenance,{signal:controller.signal});
 host.addEventListener('business-template-context-change',()=>{const context=scene.read();if(!context.categories.length&&!context.modes.length)return;const t=rows().filter(t=>matchesBrandMenuScene(t.releases.at(-1)!,context)).sort((a,b)=>Number(b.releases.at(-1)!.category==='general')-Number(a.releases.at(-1)!.category==='general'))[0];if(t)choose(t.id,true);},{signal:controller.signal});
 render();
 const context=scene.read();if(context.categories.length||context.modes.length){const t=rows().filter(t=>matchesBrandMenuScene(t.releases.at(-1)!,context)).sort((a,b)=>Number(b.releases.at(-1)!.category==='general')-Number(a.releases.at(-1)!.category==='general'))[0];if(t)choose(t.id,true);}
}
