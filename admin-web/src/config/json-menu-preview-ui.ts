import { isMenuDirectory, resolveEffectiveExternalUrl, resolveEffectiveMenuType, resolveEffectiveMicroAppConfig, type MenuDocument, type MenuLocale, type MenuNode, type MenuNodePath } from "./json-menu-document-domain";
import { encodeMenuNodePath } from "./json-menu-tree-ui";

function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!); }
function label(node: MenuNode, locale: MenuLocale): string { return node.i18nInfo?.[locale] || node.name || "未命名"; }

function samePath(a: MenuNodePath, b: MenuNodePath): boolean {
  return encodeMenuNodePath(a) === encodeMenuNodePath(b);
}

function pathLevelText(path: MenuNodePath): string {
  return path.length ? `${path.length} 级菜单` : "菜单配置";
}

function previewBadge(node: MenuNode, ancestors: MenuNode[]): string {
  const effectiveType = resolveEffectiveMenuType(node, ancestors);
  if (isMenuDirectory(node)) return "目录";
  if (effectiveType === "iframe") return "iframe";
  if (effectiveType === "inner") return "项目内";
  if (effectiveType === "micro-app") return "应用";
  if (effectiveType === "external") return "外链";
  if (effectiveType === "link") return "链接";
  return "";
}

function rootMetaBadge(node: MenuNode): string {
  const hasIframeDescendant = (node.children ?? []).some((child) => resolveEffectiveMenuType(child, [node]) === "iframe" || (child.children ?? []).some((grandChild) => resolveEffectiveMenuType(grandChild, [node, child]) === "iframe"));
  return hasIframeDescendant ? `<span class="shrink-0 rounded bg-sky-50 px-1.5 py-px text-[10px] text-sky-600">云产品</span>` : "";
}

function renderTopLevelButton(node: MenuNode, path: MenuNodePath, locale: MenuLocale, activeRootIndex: number): string {
  if (node.display === false) return "";
  const active = path[0] === activeRootIndex;
  const hasChildren = Boolean(node.children?.some((child) => child.display !== false));
  return `<li><button type="button" ${node.disabled === true ? "disabled aria-disabled=\"true\"" : `data-jme-select="${encodeMenuNodePath(path)}"`} class="flex w-full min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors duration-200 focus:ring-2 focus:ring-teal-600/30 ${node.disabled === true ? "cursor-not-allowed opacity-50" : active ? "bg-teal-700 text-white shadow-[0_8px_20px_rgba(13,148,136,0.2)]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}"><span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-white/15 text-white" : "text-teal-700"} text-[10px]">${node.icon ? "◆" : "·"}</span><span class="min-w-0 flex-1 truncate">${escapeHtml(label(node, locale))}</span>${node.disabled === true ? `<span class="text-[9px]">已禁用</span>` : ""}${rootMetaBadge(node)}${hasChildren ? `<span class="shrink-0 text-xs transition-transform duration-200 ${active ? "rotate-180 text-white/80" : "text-slate-400"}">›</span>` : ""}</button></li>`;
}

function renderSheetItem(node: MenuNode, path: MenuNodePath, locale: MenuLocale, ancestors: MenuNode[], selectedPath: MenuNodePath): string {
  if (node.display === false) return "";
  const active = samePath(path, selectedPath);
  const badge = previewBadge(node, ancestors);
  return `<button type="button" ${node.disabled === true ? "disabled aria-disabled=\"true\"" : `data-jme-select="${encodeMenuNodePath(path)}"`} class="flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors duration-150 focus:ring-2 focus:ring-teal-600/30 ${node.disabled === true ? "cursor-not-allowed opacity-50" : active ? "bg-teal-50 text-teal-800 shadow-[inset_3px_0_0_#0f766e]" : "text-slate-700 hover:bg-slate-50"}"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-md ${active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"} text-[10px]">${node.icon ? "◆" : "·"}</span><span class="min-w-0 flex-1 truncate text-sm font-medium">${escapeHtml(label(node, locale))}</span>${node.disabled === true ? `<span class="text-[9px] text-rose-600">已禁用</span>` : ""}${badge ? `<span class="rounded border ${active ? "border-teal-200 bg-white text-teal-700" : "border-slate-200 bg-white text-slate-500"} px-1.5 py-0.5 text-[9px]">${escapeHtml(badge)}</span>` : ""}</button>`;
}

/** 有子菜单的二级：仅作目录，点击展开/收起，不进入页面选中态 */
function renderSheetDirectoryItem(node: MenuNode, path: MenuNodePath, locale: MenuLocale, expanded: boolean): string {
  if (node.display === false) return "";
  const encoded = encodeMenuNodePath(path);
  return `<button type="button" data-jme-sheet-toggle="${encoded}" aria-expanded="${expanded ? "true" : "false"}" class="flex w-full min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors duration-150 focus:ring-2 focus:ring-teal-600/30 ${expanded ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"}"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-md ${expanded ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-400"} text-[10px]">${node.icon ? "◆" : "·"}</span><span class="min-w-0 flex-1 truncate text-sm font-medium">${escapeHtml(label(node, locale))}</span><span class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-500">目录</span><span class="shrink-0 text-base leading-none text-slate-400 transition-transform duration-200 ${expanded ? "rotate-90 text-teal-700" : ""}" aria-hidden="true">›</span></button>`;
}

function renderSheet(
  node: MenuNode,
  rootPath: MenuNodePath,
  locale: MenuLocale,
  selectedPath: MenuNodePath,
  expandedSheetPaths: ReadonlySet<string>,
): string {
  const children = (node.children ?? []).filter((child) => child.display !== false);
  if (!children.length) return "";
  return `<aside class="absolute inset-0 z-30 flex flex-col border-l border-slate-200 bg-white shadow-[18px_0_40px_rgba(15,23,42,0.12)]" data-jme-preview-sheet>
    <div class="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4">
      <button type="button" data-jme-sheet-back="${encodeMenuNodePath(rootPath)}" class="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-800 shadow-sm outline-none transition hover:border-teal-300 hover:bg-teal-100 hover:text-teal-950 focus:ring-2 focus:ring-teal-600/40" aria-label="返回一级菜单" title="返回一级菜单">
        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>
      </button>
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-slate-900">${escapeHtml(label(node, locale))}</h3>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3" data-jme-preview-sheet-scroll>
      <div class="space-y-2">${children.map((child, index) => {
        const childPath = [...rootPath, index];
        const thirdLevel = (child.children ?? []).filter((grandChild) => grandChild.display !== false);
        if (thirdLevel.length) {
          const encoded = encodeMenuNodePath(childPath);
          const expanded = expandedSheetPaths.has(encoded);
          return `<section class="space-y-1.5">
            ${renderSheetDirectoryItem(child, childPath, locale, expanded)}
            ${expanded ? `<div class="ml-5 space-y-1.5 border-l border-slate-200/90 pl-3">${thirdLevel.map((grandChild, grandChildIndex) => renderSheetItem(grandChild, [...childPath, grandChildIndex], locale, [node, child], selectedPath)).join("")}</div>` : ""}
          </section>`;
        }
        return `<section>${renderSheetItem(child, childPath, locale, [node], selectedPath)}</section>`;
      }).join("")}</div>
    </div>
  </aside>`;
}

export function renderJsonMenuFullscreenPreview(
  document: MenuDocument,
  locale: MenuLocale,
  selectedPath: MenuNodePath,
  selectedNode?: MenuNode,
  ancestors: MenuNode[] = [],
  openSheetRootPath: MenuNodePath | null = null,
  expandedSheetPaths: ReadonlySet<string> = new Set(),
): string {
  const roots = document.menu.filter((node) => node.display !== false);
  const defaultRootIndex = roots.findIndex((node) => Boolean(node.children?.some((child) => child.display !== false)));
  const activeRootIndex = openSheetRootPath?.length ? openSheetRootPath[0] : selectedPath.length ? selectedPath[0] : defaultRootIndex >= 0 ? defaultRootIndex : 0;
  const activeRoot = document.menu[activeRootIndex];
  const rootHasChildren = Boolean(openSheetRootPath?.length && activeRoot?.children?.some((child) => child.display !== false));
  const effectiveType = selectedNode ? resolveEffectiveMenuType(selectedNode, ancestors) : undefined;
  const directory = selectedNode ? isMenuDirectory(selectedNode) : false;
  const title = selectedNode ? label(selectedNode, locale) : "未选择菜单";
  const typeLabel = directory ? "目录容器" : effectiveType === "iframe" ? "iframe 嵌入" : effectiveType === "inner" ? "项目内页面" : effectiveType === "micro-app" ? "微应用" : effectiveType === "external" ? "外部链接" : effectiveType === "link" ? "链接菜单" : "未配置";
  const primaryTarget = !selectedNode ? "—" : directory ? "点击后展开子菜单" : selectedNode.path || "未配置商家后台路由";
  const iframeTarget = selectedNode && effectiveType === "iframe" ? selectedNode.url || "未配置 iframe 地址" : "";
  const externalTarget = selectedNode && effectiveType === "external" ? resolveEffectiveExternalUrl(selectedNode, ancestors) || "未配置外部链接地址" : "";
  const specialTarget = selectedNode && effectiveType === "link" ? `目标菜单 Key：${selectedNode.targetKey || "未配置"}` : selectedNode && effectiveType === "micro-app" ? `微应用地址：${resolveEffectiveMicroAppConfig(selectedNode, ancestors)?.url || "未配置"}` : "";

  return `<div class="fixed inset-0 z-[140] flex bg-slate-100" role="dialog" aria-modal="true" aria-label="商家后台菜单预览" data-jme-fullscreen-preview-panel>
    <aside class="relative flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-5 py-5"><p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">Merchant Admin</p><h2 class="mt-1 truncate text-lg font-semibold text-slate-900">${escapeHtml(document.name || "商家后台")}</h2></div>
      <nav class="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="商家后台预览一级菜单" data-jme-preview-nav-scroll><ol class="space-y-1">${document.menu.map((node, index) => renderTopLevelButton(node, [index], locale, activeRootIndex)).join("")}</ol></nav>
      <div class="border-t border-slate-200 px-5 py-3 text-[10px] text-slate-400">当前编辑内容 · 仅预览交互，不加载真实页面</div>
      ${activeRoot && rootHasChildren ? renderSheet(activeRoot, [activeRootIndex], locale, selectedPath, expandedSheetPaths) : ""}
    </aside>
    <main class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6"><div><p class="text-xs text-slate-500">商家后台菜单预览</p><h1 class="mt-0.5 text-base font-semibold text-slate-900">${escapeHtml(title)}</h1></div><div class="flex items-center gap-3"><div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5" aria-label="预览语言">${(["zh-CN", "zh-HK", "en-US"] as MenuLocale[]).map((item) => `<button type="button" data-jme-locale="${item}" class="rounded px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-600/30 ${locale === item ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500"}">${item}</button>`).join("")}</div><button type="button" data-jme-fullscreen-close class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none hover:bg-slate-50 focus:ring-2 focus:ring-teal-600/30">退出预览</button></div></header>
      <div class="min-h-0 flex-1 overflow-y-auto p-8" data-jme-preview-main-scroll>
        <div class="mx-auto max-w-5xl"><div class="flex items-start justify-between gap-5"><div><span class="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">${escapeHtml(typeLabel)}</span><h2 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900">${escapeHtml(title)}</h2><p class="mt-2 text-sm text-slate-500">${pathLevelText(selectedPath)}</p></div><div class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right"><p class="text-[10px] text-slate-400">节点 Key</p><p class="mt-1 font-mono text-xs text-slate-700">${escapeHtml(selectedNode?.key || "—")}</p></div></div>
          <div class="mt-8 grid gap-5 lg:grid-cols-2"><section class="rounded-lg border border-slate-200 bg-white p-5"><p class="text-xs font-medium text-slate-500">商家后台路由</p><p class="mt-3 break-all font-mono text-sm text-slate-800">${escapeHtml(primaryTarget)}</p></section>${specialTarget ? `<section class="rounded-lg border border-fuchsia-200 bg-fuchsia-50/50 p-5"><p class="text-xs font-medium text-fuchsia-700">${effectiveType === "link" ? "链接目标" : "生效微应用配置"}</p><p class="mt-3 break-all font-mono text-sm text-fuchsia-900">${escapeHtml(specialTarget)}</p></section>` : iframeTarget ? `<section class="rounded-lg border border-sky-200 bg-sky-50/50 p-5"><p class="text-xs font-medium text-sky-700">iframe 嵌入地址</p><p class="mt-3 break-all font-mono text-sm text-sky-900">${escapeHtml(iframeTarget)}</p><p class="mt-3 text-xs text-sky-600">安全预览模式不会请求该地址。</p></section>` : externalTarget ? `<section class="rounded-lg border border-violet-200 bg-violet-50/50 p-5"><p class="text-xs font-medium text-violet-700">外部链接地址</p><p class="mt-3 break-all font-mono text-sm text-violet-900">${escapeHtml(externalTarget)}</p><p class="mt-3 text-xs text-violet-600">发布后由商家后台在新窗口打开。</p></section>` : `<section class="rounded-lg border border-slate-200 bg-white p-5"><p class="text-xs font-medium text-slate-500">打开方式</p><p class="mt-3 text-sm text-slate-800">${directory ? "优先展开当前目录或一级菜单滑层" : effectiveType === "inner" ? "在商家后台内容区域打开项目内页面" : activeRoot && rootHasChildren && selectedPath.length === 1 ? "点击一级菜单后优先展开二级菜单滑层" : "按当前配置展示"}</p></section>`}</div>
          <section class="mt-5 rounded-lg border border-slate-200 bg-white p-5"><div class="flex items-center justify-between"><p class="text-sm font-semibold text-slate-900">多语言显示</p><span class="text-xs text-slate-400">当前 ${locale}</span></div><div class="mt-4 grid grid-cols-3 gap-3">${(["zh-CN", "zh-HK", "en-US"] as MenuLocale[]).map((item) => `<div class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3"><p class="text-[10px] text-slate-400">${item}</p><p class="mt-1 truncate text-sm font-medium text-slate-700">${escapeHtml(selectedNode ? label(selectedNode, item) : "—")}</p></div>`).join("")}</div></section>
        </div>
      </div>
    </main>
  </div>`;
}

export function renderJsonMenuPreview(document: MenuDocument, locale: MenuLocale, selectedPath: MenuNodePath, selectedNode?: MenuNode, ancestors: MenuNode[] = []): string {
  const effectiveType = selectedNode ? resolveEffectiveMenuType(selectedNode, ancestors) : undefined;
  const directory = selectedNode ? isMenuDirectory(selectedNode) : false;
  const target = !selectedNode ? "请选择菜单节点" : directory ? "目录节点：点击后展开子菜单" : effectiveType === "iframe" ? selectedNode.url || "未配置 iframe 地址" : effectiveType === "external" ? resolveEffectiveExternalUrl(selectedNode, ancestors) || "未配置外部链接地址" : effectiveType === "link" ? `目标菜单 Key：${selectedNode.targetKey || "未配置"}` : effectiveType === "micro-app" ? resolveEffectiveMicroAppConfig(selectedNode, ancestors)?.url || "未配置微应用地址" : selectedNode.path || "未配置路由地址";
  return `<section class="flex h-[224px] shrink-0 flex-col border-t border-slate-200 bg-slate-50" data-jme-preview-panel>
    <header class="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4"><div class="flex items-center gap-3"><h2 class="text-xs font-semibold text-slate-800">商家后台菜单预览</h2><span class="text-[10px] text-slate-400">仅模拟菜单结构，不加载页面</span></div><div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">${(["zh-CN", "zh-HK", "en-US"] as MenuLocale[]).map((item) => `<button type="button" data-jme-locale="${item}" class="rounded px-2.5 py-1 text-[10px] ${locale === item ? "bg-white font-medium text-slate-800 shadow-sm" : "text-slate-500"}">${item}</button>`).join("")}</div></header>
    <div class="flex min-h-0 flex-1 overflow-hidden p-3">
      <div class="flex w-64 shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-white"><div class="border-b border-slate-200 px-3 py-2"><p class="truncate text-xs font-semibold text-slate-800">${escapeHtml(document.name || "未命名配置")}</p><p class="mt-0.5 text-[9px] text-slate-400">Merchant Admin</p></div><ol class="min-h-0 flex-1 overflow-y-auto p-1.5">${document.menu.filter((node) => node.display !== false).map((node, index) => renderTopLevelButton(node, [index], locale, selectedPath.length ? selectedPath[0] : 0)).join("")}</ol></div>
      <div class="ml-3 flex min-w-0 flex-1 flex-col justify-center rounded-md border border-dashed border-slate-300 bg-white px-6"><div class="flex items-center gap-2"><span class="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">${directory ? "目录" : effectiveType === "iframe" ? "iframe 嵌入" : effectiveType === "inner" ? "项目内页面" : effectiveType === "external" ? "外部链接" : effectiveType === "link" ? "链接菜单" : effectiveType === "micro-app" ? "微应用" : effectiveType ?? "未配置"}</span>${selectedNode ? `<span class="text-xs text-slate-500">${escapeHtml(label(selectedNode, locale))}</span>` : ""}${selectedNode?.disabled === true ? `<span class="text-[10px] text-rose-600">已禁用</span>` : ""}</div><p class="mt-2 break-all font-mono text-xs text-slate-600">${escapeHtml(target)}</p>${effectiveType === "iframe" ? `<p class="mt-2 text-[11px] text-amber-600">发布后由商家后台内容区承载 iframe；此处不会访问第三方地址。</p>` : effectiveType === "external" ? `<p class="mt-2 text-[11px] text-violet-600">发布后由商家后台在新窗口打开。</p>` : ""}</div>
    </div>
  </section>`;
}
