import {
  getCompatibilityRootPath,
  isMenuDirectory,
  resolveEffectiveMenuType,
  walkMenuNodes,
  type MenuDocument,
  type MenuNode,
  type MenuNodePath,
  type MenuValidationIssue,
} from "./json-menu-document-domain";

function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!); }
export function encodeMenuNodePath(path: MenuNodePath): string { return path.join("."); }
export function decodeMenuNodePath(value: string): MenuNodePath { return value ? value.split(".").map(Number) : []; }
function samePath(a: MenuNodePath, b: MenuNodePath): boolean { return encodeMenuNodePath(a) === encodeMenuNodePath(b); }
function nodeLabel(node: MenuNode): string { return node.i18nInfo?.["zh-CN"] || node.name || "未命名菜单"; }

function renderNode(
  document: MenuDocument,
  node: MenuNode,
  path: MenuNodePath,
  ancestors: MenuNode[],
  selectedPath: MenuNodePath,
  issues: MenuValidationIssue[],
  expanded: Set<string>,
  search: string,
): string {
  const encoded = encodeMenuNodePath(path);
  const ownIssues = issues.filter((issue) => issue.path && samePath(issue.path, path));
  const hasError = ownIssues.some((issue) => issue.severity === "error");
  const hasWarning = ownIssues.some((issue) => issue.severity === "warning");
  const compatibilityRoot = getCompatibilityRootPath(document.menu, path);
  const protectedNode = Boolean(compatibilityRoot);
  const active = samePath(path, selectedPath);
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(encoded) || Boolean(search);
  const effectiveType = resolveEffectiveMenuType(node, ancestors);
  const typeLabel = isMenuDirectory(node) ? "目录" : effectiveType === "iframe" ? "iframe" : effectiveType === "inner" ? "项目内" : effectiveType ?? "未配置";
  const typeClass = protectedNode ? "border-amber-200 bg-amber-50 text-amber-700" : isMenuDirectory(node) ? "border-slate-200 bg-slate-50 text-slate-500" : effectiveType === "iframe" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-teal-200 bg-teal-50 text-teal-700";
  const searchable = `${nodeLabel(node)} ${node.name ?? ""} ${node.key ?? ""} ${node.path ?? ""}`.toLowerCase();
  const childMatches = node.children?.some((child) => JSON.stringify(child).toLowerCase().includes(search)) ?? false;
  if (search && !searchable.includes(search) && !childMatches) return "";

  return `<li class="relative" data-jme-tree-item="${encoded}">
    ${path.length > 1 && path.length <= 4 ? `<span aria-hidden="true" class="pointer-events-none absolute -left-2 top-6 z-[1] w-2 border-t ${path.length === 4 ? "border-dashed border-amber-200" : "border-slate-200"}"></span>` : ""}
    <div class="group relative flex min-h-12 items-start gap-1 rounded-lg border px-2 py-1.5 transition focus-within:ring-2 focus-within:ring-teal-600/20 ${active ? "border-teal-300 bg-teal-50 text-teal-800 shadow-[inset_4px_0_0_#0f766e]" : "border-transparent hover:bg-slate-50"}" draggable="${protectedNode ? "false" : "true"}" data-jme-drag-path="${encoded}">
      <button type="button" data-jme-toggle="${encoded}" class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded text-xs text-slate-400 hover:bg-white ${hasChildren ? "" : "invisible"}" aria-label="${isExpanded ? "收起" : "展开"}">${isExpanded ? "⌄" : "›"}</button>
      <button type="button" data-jme-select="${encoded}" class="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span class="flex min-w-0 items-center gap-2"><span class="truncate text-[13px] ${active ? "font-bold text-teal-800" : "font-semibold text-slate-800"}" title="${escapeHtml(nodeLabel(node))}">${escapeHtml(nodeLabel(node))}</span>${hasError ? `<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" title="存在错误"></span>` : hasWarning ? `<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="存在警告"></span>` : ""}</span>
        <span class="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400"><code class="min-w-0 truncate" title="${escapeHtml(node.key || "未设置 Key")}">${escapeHtml(node.key || "未设置 Key")}</code><span class="shrink-0">· ${path.length} 级</span></span>
      </button>
      <div class="ml-1 flex shrink-0 items-start gap-2 self-start">
        ${!protectedNode ? `<div class="flex h-6 w-[48px] shrink-0 items-center justify-end gap-0 ${active ? "flex" : "hidden group-hover:flex group-focus-within:flex"}">
          ${path.length < 3 ? `<button type="button" data-jme-open-add="${encoded}" class="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-white hover:text-teal-700" title="添加子菜单">＋</button>` : ""}
          <button type="button" data-jme-row-more="${encoded}" class="grid h-6 w-6 place-items-center rounded text-slate-500 hover:bg-white" title="更多">•••</button>
        </div>` : ""}
        <span class="flex h-6 shrink-0 items-center gap-1"><span class="rounded border px-1.5 py-0.5 text-[9px] font-medium ${active && !protectedNode ? "border-teal-300 bg-white/70 text-teal-700" : typeClass}">${protectedNode ? "兼容保留" : typeLabel}</span>${node.display === false ? `<span class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500">隐藏</span>` : ""}</span>
      </div>
    </div>
    ${hasChildren && isExpanded ? `<ol class="${path.length < 4 ? "ml-4 pl-2" : "ml-0 pl-0"} border-l ${path.length >= 3 ? "border-dashed border-amber-200" : "border-slate-200"}">${node.children!.map((child, index) => `<div data-jme-drop-parent="${encoded}" data-jme-drop-index="${index}" class="h-1 rounded hover:bg-teal-300"></div>${renderNode(document, child, [...path, index], [...ancestors, node], selectedPath, issues, expanded, search)}`).join("")}<div data-jme-drop-parent="${encoded}" data-jme-drop-index="${node.children!.length}" class="h-1 rounded hover:bg-teal-300"></div></ol>` : ""}
  </li>`;
}

export function renderJsonMenuTree(
  document: MenuDocument,
  selectedPath: MenuNodePath,
  issues: MenuValidationIssue[],
  searchValue: string,
  expanded: Set<string>,
): string {
  const visits = walkMenuNodes(document.menu);
  const expandableCount = visits.filter((visit) => visit.node.children?.length).length;
  const allExpanded = expandableCount > 0 && visits.every((visit) => !visit.node.children?.length || expanded.has(encodeMenuNodePath(visit.path)));
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const search = searchValue.trim().toLowerCase();
  return `<section class="flex min-h-0 w-[34%] min-w-[340px] max-w-[400px] shrink-0 flex-col border-r border-slate-100 bg-white" data-jme-tree-panel>
    <header class="shrink-0 px-5 pb-3 pt-5">
      <div class="flex items-center justify-between"><div class="flex items-baseline gap-2"><h2 class="text-sm font-semibold text-slate-900">菜单结构</h2><span class="text-[10px] text-slate-400">${visits.length} 项 · 最多三级</span></div><button type="button" data-jme-open-add="" class="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-lg leading-none text-white shadow-[0_2px_6px_rgba(15,118,110,0.14)] hover:bg-teal-800" title="新增一级菜单" aria-label="新增一级菜单">＋</button></div>
      <label class="mt-3 flex min-w-0 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 focus-within:border-teal-600 focus-within:bg-white"><span class="text-slate-400">⌕</span><input data-jme-search value="${escapeHtml(searchValue)}" placeholder="搜索菜单名称、Key 或路径" class="h-9 min-w-0 flex-1 bg-transparent px-2 text-xs outline-none"></label>
      <div class="mt-2.5 flex items-center gap-3 text-[10px]"><span class="text-red-600">${errors} 错误</span><span class="text-amber-600">${warnings} 警告</span>${issues.length ? `<button type="button" data-jme-next-issue class="text-teal-700 hover:underline">定位问题 →</button>` : ""}${expandableCount ? `<span class="ml-auto flex gap-2"><button type="button" data-jme-toggle-expand-all class="text-slate-500 hover:text-teal-700">${allExpanded ? "全部收起" : "全部展开"}</button></span>` : ""}</div>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1" data-jme-tree-scroll>
      ${document.menu.length ? `<ol>${document.menu.map((node, index) => `<div data-jme-drop-parent="" data-jme-drop-index="${index}" class="h-1 rounded hover:bg-teal-300"></div>${renderNode(document, node, [index], [], selectedPath, issues, expanded, search)}`).join("")}<div data-jme-drop-parent="" data-jme-drop-index="${document.menu.length}" class="h-2 rounded hover:bg-teal-300"></div></ol>` : `<div class="grid h-full min-h-72 place-items-center text-center"><div><div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-xl text-slate-400">☷</div><p class="mt-3 text-sm font-medium">暂无菜单</p><p class="mt-1 text-xs text-slate-500">从新增一级菜单开始配置</p></div></div>`}
    </div>
  </section>`;
}
