function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderFohBuffetRulesPanel(iframeSrc: string): string {
  return `<div class="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm" data-foh-buffet-rules-root>
    <iframe title="自助餐规则" class="block h-full min-h-[22rem] w-full flex-1 border-0 sm:min-h-0" src="${escapeHtml(iframeSrc)}" referrerpolicy="no-referrer-when-downgrade" allow="clipboard-read; clipboard-write; fullscreen"></iframe>
  </div>`;
}
