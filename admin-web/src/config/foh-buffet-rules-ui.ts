import { bindRuleIframeFullscreen, releaseRuleIframeFullscreen } from "./rule-iframe-fullscreen";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const BUFFET_RULE_FULLSCREEN_PAGES = new Set([
  "buffet-rule-editor.html",
  "buffet-rule-publish-confirm.html",
]);
const BUFFET_RULE_LIST_PAGE = "buffet-rule.html";
let buffetRuleFullscreenTeardown: (() => void) | null = null;

export function bindFohBuffetRulesUi(): void {
  const root = document.querySelector<HTMLElement>("[data-foh-buffet-rules-root]");
  if (!root) return;
  buffetRuleFullscreenTeardown?.();
  buffetRuleFullscreenTeardown = bindRuleIframeFullscreen(root, {
    frameSelector: "[data-foh-buffet-rule-frame]",
    fullscreenPages: BUFFET_RULE_FULLSCREEN_PAGES,
    listPage: BUFFET_RULE_LIST_PAGE,
  });
}

export function releaseFohBuffetRulesFullscreen(): void {
  buffetRuleFullscreenTeardown?.();
  buffetRuleFullscreenTeardown = null;
  releaseRuleIframeFullscreen();
}

export function renderFohBuffetRulesPanel(iframeSrc: string): string {
  return `<div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm" data-foh-buffet-rules-root>
    <iframe title="自助餐规则" class="block h-full min-h-[22rem] w-full flex-1 border-0 sm:min-h-0" src="${escapeHtml(iframeSrc)}" data-foh-buffet-rule-frame referrerpolicy="no-referrer-when-downgrade" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
  </div>`;
}
