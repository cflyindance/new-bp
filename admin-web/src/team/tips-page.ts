import pageCss from "./tips/tips-page.css?raw";
import shellCss from "./tips/tips-shell.css?raw";
import standaloneHeaderCss from "../ui/standalone-page-header.css?raw";
import figmaCss from "./tips/tips-figma.css?raw";
import { createTipsPageContext, type TipsPageContext } from "./tips/tips-context";
import { mountLegacyTipsRuntime, type TipsRuntimeHandle } from "./tips/tips-legacy-runtime";
import { renderTipsTemplate } from "./tips/tips-templates";
import type { TipsRoute } from "./tips/tips-navigation";
import { isTipsFullscreenRoute, parseTipsRoute } from "./tips/tips-navigation";
import { createTipsEscapeController, type TipsEscapeHandle } from "./tips/tips-escape";

export interface TipsPageHandle { destroy(): void; canRetain(): boolean; reattach(): void }
const mounted = new WeakMap<HTMLElement, TipsPageHandle>();
function canScroll(el: HTMLElement, delta: number){return el.scrollHeight>el.clientHeight&&(delta<0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight);}
export function mountTipsPage(container:HTMLElement, route:TipsRoute, context:TipsPageContext=createTipsPageContext()):TipsPageHandle{
  mounted.get(container)?.destroy();
  const shadow=container.shadowRoot??container.attachShadow({mode:"open"});
  shadow.innerHTML=`<style>${pageCss}</style><style>${shellCss}</style><style>${standaloneHeaderCss}</style><style>${figmaCss}</style><div data-team-tips-page>${renderTipsTemplate(route.view)}</div>`;
  const root=shadow.querySelector<HTMLElement>("[data-team-tips-page]")!;
  let owner=container.closest<HTMLElement>("[data-team-tips-scroll]");
  const mountedPath=route.href.split("?")[0];
  const fullscreen=isTipsFullscreenRoute(route);
  const applyOwner=()=>{owner?.classList.toggle("team-tips-flow-fullscreen",fullscreen);owner?.toggleAttribute("data-team-tips-flow-fullscreen",fullscreen);};
  applyOwner();
  const wheel=(event:WheelEvent)=>{if(!owner||!event.deltaY)return;const local=event.composedPath().find((n):n is HTMLElement=>n instanceof HTMLElement&&canScroll(n,event.deltaY));if(local&&local!==owner)return;const before=owner.scrollTop;owner.scrollTop+=event.deltaY;if(before!==owner.scrollTop)event.preventDefault();};
  container.addEventListener("wheel",wheel,{passive:false});
  let runtime:TipsRuntimeHandle|null=null;
  let escape:TipsEscapeHandle|null=fullscreen?createTipsEscapeController(shadow,route,context):null;
  const frames:number[]=[];
  const saved=context.getNavigationState()?.scrollTop ?? 0;
  const restore=()=>{if(owner)owner.scrollTop=Math.min(saved,Math.max(0,owner.scrollHeight-owner.clientHeight));};
  restore();frames.push(requestAnimationFrame(()=>{restore();frames.push(requestAnimationFrame(restore));}));
  try{runtime=mountLegacyTipsRuntime(shadow,root,route,context);}catch(error){console.error(error);shadow.innerHTML=`<style>${shellCss}</style><div class="team-tips-error" role="alert">小费管理页面加载失败，请刷新后重试。</div>`;}
  const mountedScope=JSON.stringify(context.getScope());
  let destroyed=false;
  const handle={
    canRetain(){return !destroyed&&runtime!==null&&root.isConnected&&parseTipsRoute(location.hash).href.split("?")[0]===mountedPath&&JSON.stringify(context.getScope())===mountedScope;},
    reattach(){const scrollTop=owner?.scrollTop??0;owner?.classList.remove("team-tips-flow-fullscreen","team-tips-scroll-locked");owner?.removeAttribute("data-team-tips-flow-fullscreen");owner=container.closest<HTMLElement>("[data-team-tips-scroll]");applyOwner();if(owner)owner.scrollTop=scrollTop;},
    destroy(){if(destroyed)return;destroyed=true;runtime?.destroy();runtime=null;escape?.destroy();escape=null;frames.forEach(cancelAnimationFrame);container.removeEventListener("wheel",wheel);owner?.classList.remove("team-tips-flow-fullscreen");owner?.removeAttribute("data-team-tips-flow-fullscreen");owner?.classList.remove("team-tips-scroll-locked");shadow.innerHTML="";mounted.delete(container);}
  };
  mounted.set(container,handle);return handle;
}
