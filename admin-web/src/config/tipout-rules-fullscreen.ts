const TIPOUT_RULES_FULLSCREEN_ENTRY_FILES = new Set([
  "rules.html",
  "rule-add.html",
]);

const TIPOUT_RULES_FULLSCREEN_EXIT_FILES = new Set([
  "index.html",
]);

export type TipOutRulesFullscreenTransition = "enter" | "exit" | "preserve";

function getPageFileName(url: string): string {
  try {
    const baseUrl = typeof window === "undefined" ? "http://localhost/" : window.location.href;
    const pathname = new URL(url, baseUrl).pathname;
    return decodeURIComponent(pathname.split("/").pop() ?? "").toLowerCase();
  } catch {
    return "";
  }
}

export function resolveTipOutRulesFullscreenTransition(
  url: string,
): TipOutRulesFullscreenTransition {
  const fileName = getPageFileName(url);
  if (TIPOUT_RULES_FULLSCREEN_ENTRY_FILES.has(fileName)) return "enter";
  if (TIPOUT_RULES_FULLSCREEN_EXIT_FILES.has(fileName)) return "exit";
  return "preserve";
}

function setTipOutRulesFullscreen(frame: HTMLIFrameElement, fullscreen: boolean): void {
  frame.classList.toggle("tipout-rules-flow-fullscreen", fullscreen);
  frame.toggleAttribute("data-tipout-rules-flow-fullscreen", fullscreen);
}

function syncTipOutRulesFullscreen(frame: HTMLIFrameElement): void {
  let currentUrl = "";
  try {
    currentUrl = frame.contentWindow?.location.href ?? frame.src;
  } catch {
    return;
  }

  const transition = resolveTipOutRulesFullscreenTransition(currentUrl);
  if (transition === "enter") setTipOutRulesFullscreen(frame, true);
  if (transition === "exit") setTipOutRulesFullscreen(frame, false);
}

export function bindTipOutRulesFullscreenFlow(root: ParentNode = document): void {
  root.querySelectorAll<HTMLIFrameElement>("[data-tipout-rules-frame]").forEach((frame) => {
    if (frame.dataset.tipoutRulesFullscreenBound === "true") return;

    frame.dataset.tipoutRulesFullscreenBound = "true";
    frame.addEventListener("load", () => syncTipOutRulesFullscreen(frame));
    syncTipOutRulesFullscreen(frame);
  });
}
