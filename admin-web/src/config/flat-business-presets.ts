import {readBusinessMenuTemplates,planTemplateSelection} from './business-menu-template-store';
import {templateDialog,templateEsc} from './business-menu-template-ui';
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
 const provenance=()=>{host.dataset.flatPresetState=JSON.stringify({selected,baseline,source});if(source)bar.dataset.templateSource=source+` · 额外选择 ${read().filter(k=>!baseline.includes(k)).length} 项／取消 ${baseline.filter(k=>!read().includes(k)).length} 项`;};
 const render=()=>{bar.innerHTML='<span>业态</span><div class="ba-flat-preset-options" role="group" aria-label="业态">'+rows().map(t=>`<button type="button" class="ba-btn ${t.id===selected?'ba-primary':''}" aria-pressed="${t.id===selected}" data-business-preset="${templateEsc(t.id)}">${templateEsc(t.releases.at(-1)!.name.replace(/\s*·\s*(连锁|单店)\s*$/,''))}</button>`).join('')+'</div><span role="alert" data-preset-error></span>';};
 const choose=(id:string,automatic=false)=>{
  if(id===selected)return;
  const t=rows().find(t=>t.id===id),release=t?.releases.at(-1);if(!t||!release)return;
  const revision=t.revision;
  const commit=()=>{const current=rows().find(t=>t.id===id);if(!current||current.revision!==revision){bar.querySelector('[data-preset-error]')!.textContent='业态预设已更新，请重新选择。';return;}
   const plan=planTemplateSelection(read(),release.keys,choices,allowed,'replace');
   if(!plan.next.some(k=>choices.some(c=>c.key===k&&c.isPage))){bar.querySelector('[data-preset-error]')!.textContent='该业态暂无当前可用菜单，已保留现有选择。';return;}
   apply(plan.next);baseline=[...plan.next];selected=id;source=`模板「${release.name}」v${release.version} [${id}]`;render();provenance();host.dispatchEvent(new Event('change',{bubbles:true}));
  };
  if(changed()){
   if(automatic||pending?.open)return;
   pending=templateDialog('切换业态','<p>切换业态将替换已调整的菜单，是否继续？</p>');
   const footer=pending.querySelector('footer')!;footer.innerHTML='<button type="button" class="ba-btn" data-keep>继续编辑</button><button type="button" class="ba-btn ba-primary" data-switch>切换业态</button>';
   pending.querySelector('[data-keep]')!.addEventListener('click',()=>pending!.close());
   pending.querySelector('[data-switch]')!.addEventListener('click',()=>{commit();pending!.close();});
  }else commit();
 };
 bar.addEventListener('click',e=>{const button=(e.target as Element).closest<HTMLElement>('[data-business-preset]');if(button)choose(button.dataset.businessPreset!);});
 host.addEventListener('change',provenance,{signal:controller.signal});
 host.addEventListener('business-template-context-change',()=>{const context=scene.read();if(!context.categories.length&&!context.modes.length)return;const t=rows().filter(t=>matchesBrandMenuScene(t.releases.at(-1)!,context)).sort((a,b)=>Number(b.releases.at(-1)!.category==='general')-Number(a.releases.at(-1)!.category==='general'))[0];if(t)choose(t.id,true);},{signal:controller.signal});
 render();
 const context=scene.read();if(context.categories.length||context.modes.length){const t=rows().filter(t=>matchesBrandMenuScene(t.releases.at(-1)!,context)).sort((a,b)=>Number(b.releases.at(-1)!.category==='general')-Number(a.releases.at(-1)!.category==='general'))[0];if(t)choose(t.id,true);}
}
