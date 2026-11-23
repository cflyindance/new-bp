import {currentAdActivityContext} from '../marketing-display/ad-activity-provider';
import {ensureDefaultAdDemo} from '../marketing-display/default-ad-demo';
import {readCatalog} from '../marketing-display/ad-slot-catalog';
import {getAuthenticatedEmail,DEMO_LOGIN_ACCOUNT} from '../auth/login';

const MARKETING_SCREENSAVER_FLOW_ENTRY_FILES = new Set([
  "screensaver-create.html",
  "screensaver-edit.html",
]);

const MARKETING_SCREENSAVER_FLOW_EXIT_FILES = new Set([
  "kiosk-screensaver.html",
  "kiosk-theme-list.html",
]);

export type MarketingScreensaverFullscreenTransition = "enter" | "exit" | "preserve";

function getPageFileName(url: string): string {
  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost/" : window.location.href;
    const pathname = new URL(url, baseUrl).pathname;
    return decodeURIComponent(pathname.split("/").pop() ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export function resolveMarketingScreensaverFullscreenTransition(
  url: string,
): MarketingScreensaverFullscreenTransition {
  const fileName = getPageFileName(url);
  if (MARKETING_SCREENSAVER_FLOW_ENTRY_FILES.has(fileName)) return "enter";
  if (MARKETING_SCREENSAVER_FLOW_EXIT_FILES.has(fileName)) return "exit";
  return "preserve";
}

function setMarketingScreensaverFullscreen(frame: HTMLIFrameElement, fullscreen: boolean): void {
  frame.classList.toggle("marketing-screensaver-flow-fullscreen", fullscreen);
  frame.toggleAttribute("data-marketing-screensaver-flow-fullscreen", fullscreen);
}

function syncMarketingScreensaverFullscreen(frame: HTMLIFrameElement): void {
  let currentUrl = "";
  try {
    currentUrl = frame.contentWindow?.location.href ?? frame.src;
    const activityApi=(frame.contentWindow as (Window & {KioskAdActivities?:{setContextResolver:(resolve:typeof currentAdActivityContext)=>void}})|null)?.KioskAdActivities;
    if(activityApi){
      if(getPageFileName(currentUrl)==='kiosk-theme-list.html'){
        const context=currentAdActivityContext();
        try{ensureDefaultAdDemo(localStorage,readCatalog(localStorage),{demo:(getAuthenticatedEmail()??'').trim().toLowerCase()===DEMO_LOGIN_ACCOUNT.toLowerCase(),scope:context.scope,canWrite:context.canWrite,assetBase:new URL('ad-default-demo/',document.baseURI).href});}catch(error){console.warn('默认广告演示数据未初始化',error);}
      }
      activityApi.setContextResolver(currentAdActivityContext);
    }
  } catch {
    // If the iframe ever becomes cross-origin, preserve the current flow state.
    return;
  }

  const transition = resolveMarketingScreensaverFullscreenTransition(currentUrl);
  if (transition === "enter") setMarketingScreensaverFullscreen(frame, true);
  if (transition === "exit") setMarketingScreensaverFullscreen(frame, false);
}

export function bindMarketingScreensaverFullscreenFlow(root: ParentNode = document): void {
  const frame = root.querySelector<HTMLIFrameElement>("[data-marketing-screensaver-frame]");
  if (!frame || frame.dataset.marketingScreensaverFullscreenBound === "true") return;

  frame.dataset.marketingScreensaverFullscreenBound = "true";
  frame.addEventListener("load", () => syncMarketingScreensaverFullscreen(frame));
  syncMarketingScreensaverFullscreen(frame);
}
