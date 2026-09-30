/** Independent product entry; never changes the merchant tab's shell state. */
export function isMenuDesignPage(): boolean {
  return document.documentElement.dataset.product === "menu-design";
}

export function getMenuDesignUrl(base = new URL("./", location.href).href): string {
  return new URL("menu-design/", base).href;
}

export function openMenuDesign(prepareUrl: (url: string) => string = url => url): void {
  if (isMenuDesignPage()) return;
  const url = prepareUrl(getMenuDesignUrl());
  window.open(url, "_blank", "noopener,noreferrer");
  document.getElementById("menu-design-launch-notice")?.remove();
  const notice = document.createElement("div");
  notice.id = "menu-design-launch-notice";
  notice.setAttribute("role", "status");
  notice.className = "fixed bottom-5 left-5 z-[110] rounded-lg border border-border bg-card p-4 text-sm text-foreground shadow-lg";
  const link = document.createElement("a");
  link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
  link.textContent = "若新标签页未打开，点击进入菜单设计 / Open Menu Design";
  link.className = "underline";
  const close = document.createElement("button");
  close.textContent = "×"; close.setAttribute("aria-label", "关闭提示 / Dismiss");
  close.className = "ml-4 px-2"; close.onclick = () => notice.remove();
  notice.append(link, close); document.body.append(notice);
}
