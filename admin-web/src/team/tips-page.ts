import pageCss from "./tips/tips-page.css?raw";
import shellCss from "./tips/tips-shell.css?raw";
import { createTipsPageContext, type TipsPageContext } from "./tips/tips-context";
import { mountLegacyTipsRuntime, type TipsRuntimeHandle } from "./tips/tips-legacy-runtime";
import { renderTipsTemplate } from "./tips/tips-templates";
import type { TipsRoute } from "./tips/tips-navigation";
import { isTipsFullscreenRoute } from "./tips/tips-navigation";
import { createTipsEscapeController, type TipsEscapeHandle } from "./tips/tips-escape";

export interface TipsPageHandle { destroy(): void }
const mounted = new WeakMap<HTMLElement, TipsPageHandle>();
function canScroll(el: HTMLElement, delta: number){return el.scrollHeight>el.clientHeight&&(delta<0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight);}
export function mountTipsPage(container:HTMLElement, route:TipsRoute, context:TipsPageContext=createTipsPageContext()):TipsPageHandle{
  mounted.get(container)?.destroy();
  const shadow=container.shadowRoot??container.attachShadow({mode:"open"});
  shadow.innerHTML=`<style>${pageCss}</style><style>${shellCss}</style><div data-team-tips-page>${renderTipsTemplate(route.view)}</div>`;
  const root=shadow.querySelector<HTMLElement>("[data-team-tips-page]")!;
  const owner=container.closest<HTMLElement>("[data-team-tips-scroll]");
  const fullscreen=isTipsFullscreenRoute(route);
  owner?.classList.toggle("team-tips-flow-fullscreen",fullscreen);
  owner?.toggleAttribute("data-team-tips-flow-fullscreen",fullscreen);
  const wheel=(event:WheelEvent)=>{if(!owner||!event.deltaY)return;const local=event.composedPath().find((n):n is HTMLElement=>n instanceof HTMLElement&&canScroll(n,event.deltaY));if(local&&local!==owner)return;const before=owner.scrollTop;owner.scrollTop+=event.deltaY;if(before!==owner.scrollTop)event.preventDefault();};
  container.addEventListener("wheel",wheel,{passive:false});
  let runtime:TipsRuntimeHandle|null=null;
  let escape:TipsEscapeHandle|null=fullscreen?createTipsEscapeController(shadow,route,context):null;
  const frames:number[]=[];
  const saved=context.getNavigationState()?.scrollTop ?? 0;
  const restore=()=>{if(owner)owner.scrollTop=Math.min(saved,Math.max(0,owner.scrollHeight-owner.clientHeight));};
  restore();frames.push(requestAnimationFrame(()=>{restore();frames.push(requestAnimationFrame(restore));}));
  try{runtime=mountLegacyTipsRuntime(shadow,root,route,context);}catch(error){console.error(error);shadow.innerHTML=`<style>${shellCss}</style><div class="team-tips-error" role="alert">小费管理页面加载失败，请刷新后重试。</div>`;}
  let destroyed=false;
  const handle={destroy(){if(destroyed)return;destroyed=true;runtime?.destroy();runtime=null;escape?.destroy();escape=null;frames.forEach(cancelAnimationFrame);container.removeEventListener("wheel",wheel);owner?.classList.remove("team-tips-flow-fullscreen");owner?.removeAttribute("data-team-tips-flow-fullscreen");owner?.classList.remove("team-tips-scroll-locked");shadow.innerHTML="";mounted.delete(container);}};
  mounted.set(container,handle);return handle;
}
