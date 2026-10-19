/** In-page settings classification. All controls stay mounted in their original draft bucket. */
export interface SettingsCategory { key: string; title: string; targetId: string }
const escape = (s: string): string => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function renderSettingsCategoryLayout(basePath: string, categories: readonly SettingsCategory[], body: string): string {
  if (!categories.length) return body;
  const suffix = typeof location === 'undefined' ? '' : location.hash.split('?')[0].split('/').pop();
  const active = categories.find(c => c.key === suffix) ?? categories[0];
  return `<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden sm:flex-row" data-settings-category-layout>
    <nav class="module-settings-subnav w-full shrink-0 overflow-y-auto border-border sm:w-56 sm:border-r sm:pr-4" aria-label="设置分类">
      <ul class="m-0 list-none space-y-0.5 p-0">${categories.map(c=>`<li><a href="#${escape(basePath)}/${escape(c.key)}" data-settings-category-link="${escape(c.key)}" data-settings-category-target="${escape(c.targetId)}" class="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${c.key===active.key?'bg-primary/10 font-medium text-primary':''}" ${c.key===active.key?'aria-current="true"':''}>${escape(c.title)}</a></li>`).join('')}</ul>
    </nav>
    <div class="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto" data-settings-category-scroll>${body}</div>
  </div>`;
}
export function bindSettingsCategoryLayouts(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-settings-category-layout]').forEach(layout=>{
    if(layout.dataset.categoryBound==='1')return;
    layout.dataset.categoryBound='1';
    const host=layout.querySelector<HTMLElement>('[data-settings-category-scroll]');if(!host)return;
    const links=[...layout.querySelectorAll<HTMLAnchorElement>('[data-settings-category-link]')];
    const panels=links.map(link=>({link,panel:document.getElementById(link.dataset.settingsCategoryTarget??'')})).filter(row=>row.panel&&host.contains(row.panel));
    const activate=(link:HTMLAnchorElement)=>{for(const candidate of links){const on=candidate===link;candidate.classList.toggle('bg-primary/10',on);candidate.classList.toggle('font-medium',on);candidate.classList.toggle('text-primary',on);if(on)candidate.setAttribute('aria-current','true');else candidate.removeAttribute('aria-current');}};
    let lockedUntil=0;
    const scrollTo=(row:typeof panels[number])=>{activate(row.link);lockedUntil=performance.now()+300;host.scrollTo({top:Math.max(0,host.scrollTop+row.panel!.getBoundingClientRect().top-host.getBoundingClientRect().top),behavior:'auto'});};
    for(const row of panels)row.link.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();history.replaceState(null,'',row.link.getAttribute('href')!);scrollTo(row);});
    host.addEventListener('scroll',()=>{if(performance.now()<lockedUntil)return;const top=host.getBoundingClientRect().top+48;let active=panels[0];for(const row of panels)if(row.panel!.getBoundingClientRect().top<=top)active=row;if(active)activate(active.link);},{passive:true});
    const initial=panels.find(row=>row.link.getAttribute('href')===location.hash)??panels[0];if(initial)requestAnimationFrame(()=>scrollTo(initial));
  });
}
