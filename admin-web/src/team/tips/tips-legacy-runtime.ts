import common from "./legacy/common.js.txt?raw";
import scope from "./legacy/global-scope-filter.js.txt?raw";
import ruleData from "./legacy/ruleData.js.txt?raw";
import personalSales from "./legacy/personalSalesDeduct.js.txt?raw";
import allocation from "./legacy/tipAllocation.js.txt?raw";
import attendance from "./legacy/attendanceMock.js.txt?raw";
import summary from "./legacy/tipout-summary-ui.js.txt?raw";
import datePoolView from "./legacy/tipout-date-pool-view.js.txt?raw";
import payrollBridge from "./legacy/tipout-payroll-bridge.js.txt?raw";
import orderTipStatus from "./legacy/orderTipStatus.js.txt?raw";
import paymentMethods from "./legacy/paymentMethodApportion.js.txt?raw";
import exportCode from "./legacy/export.js.txt?raw";
import distribution from "./programs/distribution.js.txt?raw";
import details from "./programs/details.js.txt?raw";
import rules from "./programs/rules.js.txt?raw";
import editor from "./programs/rule-editor.js.txt?raw";
import employeeReconciliation from "./programs/employee-reconciliation.js.txt?raw";
import type { TipsPageContext } from "./tips-context";
import { rewriteLegacyTipsUrl, type TipsRoute } from "./tips-navigation";
import type { TipsView } from "./tips-templates";

export interface TipsRuntimeHandle { destroy(): void }
type Bag = Record<PropertyKey, unknown>;

const programs: Record<TipsView, string> = { distribution, details, rules, "rule-editor": editor, "employee-reconciliation": employeeReconciliation };
const dependencies: Record<TipsView, string[]> = {
  distribution: [common, summary, ruleData, personalSales, datePoolView, allocation, attendance, payrollBridge],
  details: [common, ruleData, personalSales, datePoolView, allocation, attendance],
  rules: [common, ruleData],
  "rule-editor": [common, ruleData, orderTipStatus, paymentMethods, personalSales, allocation],
  "employee-reconciliation": [common, summary],
};

function runtimeSource(view: TipsView): string {
  return [scope, ...dependencies[view],
    "window.TipOutGlobalScopeFilter=Object.assign(window.TipOutGlobalScopeFilter||{},__scopeAdapter);",
    "var TipOutGlobalScopeFilter=window.TipOutGlobalScopeFilter,ruleData=window.ruleData;",
    "var TipOutSummaryUi=window.TipOutSummaryUi,TipOutPaymentMethodApportion=window.TipOutPaymentMethodApportion;",
    "var TipOutDatePoolView=window.TipOutDatePoolView;",
    "var TipOutAttendance=window.TipOutAttendance,TipAllocation=window.TipAllocation;",
    "var TipOutPersonalSalesDeduct=window.TipOutPersonalSalesDeduct,TipOutOrderTipStatus=window.TipOutOrderTipStatus;",
    "var TipOutPayrollBridge=window.TipOutPayrollBridge;",
    programs[view], (view === "distribution" || view === "employee-reconciliation") ? exportCode : "",
    "return {runHandler:function(code,event,element){return(function(){return eval(code)}).call(element)}};",
    "//# sourceURL=team-tips-native-runtime.js"].join("\n\n");
}

function scopeAdapter(context: TipsPageContext, cleanups: Set<() => void>) {
  return {
    readGlobalScopeFilter: () => context.getScope(), readScopeMeta: () => context.getScope(),
    usesInPageStorePicker: () => true,
    listScopedStoreOptions: () => context.getScope().stores.map((s) => ({ value: s.id, labelZh: s.labelZh, labelEn: s.labelEn })),
    writeGlobalStoreFilter: (id: unknown) => context.setStoreScope(String(id ?? "")),
    bindGlobalScopeFilterListener: (fn: (scope: unknown) => void) => { const off = context.subscribeScopeChange(fn); cleanups.add(off); return context.getScope(); },
  };
}

export function mountLegacyTipsRuntime(shadow: ShadowRoot, root: HTMLElement, route: TipsRoute, context: TipsPageContext): TipsRuntimeHandle {
  const controller = new AbortController();
  const cleanups = new Set<() => void>(), timers = new Set<number>(), intervals = new Set<number>(), animationFrames = new Set<number>();
  const observers = new Set<MutationObserver>();
  const realWindow = window, realDocument = document;
  const on = (target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) =>
    target.addEventListener(type, listener, { ...(typeof options === "boolean" ? { capture: options } : options), signal: controller.signal });
  const docTarget: Bag = {
    body: root, head: realDocument.head, documentElement: root, readyState: "complete", defaultView: realWindow,
    createElement: realDocument.createElement.bind(realDocument), createTextNode: realDocument.createTextNode.bind(realDocument),
    getElementById: (id: string) => shadow.getElementById(id), querySelector: shadow.querySelector.bind(shadow), querySelectorAll: shadow.querySelectorAll.bind(shadow),
    addEventListener: (t: string, l: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => on(root, t, l, o),
    removeEventListener: root.removeEventListener.bind(root),
  };
  const scopedDocument = new Proxy(docTarget, { get(t, p) { if (p === "activeElement") return shadow.activeElement; if (p in t) return t[p]; const v = Reflect.get(realDocument, p, realDocument); return typeof v === "function" ? v.bind(realDocument) : v; }, set(t,p,v){t[p]=v;return true;} });
  const locationFacade = new Proxy({} as Location, { get(_t,p){ if(p === "search") return route.query; if(p === "href") return `${realWindow.location.origin}/#${route.href}`; const v=Reflect.get(realWindow.location,p,realWindow.location); return typeof v === "function" ? v.bind(realWindow.location) : v; }, set(_t,p,v){ if(p === "href"){ const mapped=rewriteLegacyTipsUrl(String(v)); context.navigate(mapped ?? String(v)); return true; } return Reflect.set(realWindow.location,p,v); } });
  const winTarget: Bag = {
    document: scopedDocument, location: locationFacade, parent: null, top: null, self: null,
    addEventListener: (t:string,l:EventListenerOrEventListenerObject,o?:boolean|AddEventListenerOptions)=>on(realWindow,t,l,o), removeEventListener: realWindow.removeEventListener.bind(realWindow),
    setTimeout:(h:TimerHandler,n?:number,...a:unknown[])=>{const id=realWindow.setTimeout(()=>{timers.delete(id);typeof h === "function" ? h(...a) : realWindow.eval(h)},n);timers.add(id);return id;},
    clearTimeout:(id:number)=>{timers.delete(id);realWindow.clearTimeout(id)}, setInterval:(h:TimerHandler,n?:number,...a:unknown[])=>{const id=realWindow.setInterval(h,n,...a);intervals.add(id);return id;}, clearInterval:(id:number)=>{intervals.delete(id);realWindow.clearInterval(id)},
    requestAnimationFrame:(fn:FrameRequestCallback)=>{const id=realWindow.requestAnimationFrame((time)=>{animationFrames.delete(id);fn(time)});animationFrames.add(id);return id;},
    cancelAnimationFrame:(id:number)=>{animationFrames.delete(id);realWindow.cancelAnimationFrame(id)},
    scrollTo:(_x:number,y:number)=>{const el=context.getScrollOwner();if(el)el.scrollTop=y}, scrollBy:(_x:number,y:number)=>{const el=context.getScrollOwner();if(el)el.scrollTop+=y},
  };
  const scopedWindow = new Proxy(winTarget, { get(t,p){ if(p in t)return t[p]; const v=Reflect.get(realWindow,p,realWindow); return typeof v === "function" ? v.bind(realWindow) : v; }, set(t,p,v){t[p]=v;return true;} });
  winTarget.parent=scopedWindow; winTarget.top=scopedWindow; winTarget.self=scopedWindow;
  const normalizeHandlers = (node: ParentNode) => node.querySelectorAll<HTMLElement>("*").forEach((el) => Array.from(el.attributes).forEach((a) => { if(/^on/i.test(a.name)){el.setAttribute(`data-native-${a.name.toLowerCase()}`,a.value);el.removeAttribute(a.name);} }));
  normalizeHandlers(root);
  const observer = new MutationObserver((items)=>items.forEach((item)=>item.addedNodes.forEach((node)=>{if(node instanceof HTMLElement){normalizeHandlers(node);Array.from(node.attributes).forEach((a)=>{if(/^on/i.test(a.name)){node.setAttribute(`data-native-${a.name.toLowerCase()}`,a.value);node.removeAttribute(a.name);}})}})));
  observer.observe(root,{childList:true,subtree:true});
  observers.add(observer);
  let api: { runHandler(code:string,event:Event,element:HTMLElement): unknown };
  try {
    api = new Function("window","document","location","global","globalThis","self","__scopeAdapter",runtimeSource(route.view))(scopedWindow,scopedDocument,locationFacade,scopedWindow,scopedWindow,scopedWindow,scopeAdapter(context,cleanups));
    root.dispatchEvent(new Event("DOMContentLoaded"));
  } catch (cause) { observer.disconnect(); controller.abort(); throw new Error("Native tips runtime failed to initialize",{cause}); }
  ["click","change","input","submit","mouseover","mouseout","keydown"].forEach((type)=>on(root,type,(event:Event)=>{const el=(event.target as Element | null)?.closest<HTMLElement>(`[data-native-on${type}]`);if(!el||!root.contains(el))return;if(type === "click" && el.closest("a"))event.preventDefault();api.runHandler(el.getAttribute(`data-native-on${type}`)??"",event,el);},true));
  on(root,"click",(event:Event)=>{
    const anchor=(event.target as Element|null)?.closest<HTMLAnchorElement>("a[href]");
    if(!anchor||!root.contains(anchor)||anchor.hasAttribute("data-native-onclick"))return;
    const mapped=rewriteLegacyTipsUrl(anchor.getAttribute("href")??"");
    if(!mapped)return;
    event.preventDefault();
    event.stopPropagation();
    context.navigate(mapped);
  },true);
  return { destroy(){observers.forEach((item)=>item.disconnect());observers.clear();controller.abort();cleanups.forEach((f)=>f());cleanups.clear();timers.forEach(clearTimeout);timers.clear();intervals.forEach(clearInterval);intervals.clear();animationFrames.forEach(cancelAnimationFrame);animationFrames.clear();root.querySelectorAll(".show").forEach((el)=>el.classList.remove("show"));} };
}
