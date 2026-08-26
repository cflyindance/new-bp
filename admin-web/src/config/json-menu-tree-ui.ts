import {
  getCompatibilityRootPath,
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
function isStrictDescendantPath(parent: MenuNodePath, candidate: MenuNodePath): boolean {
  return candidate.length > parent.length && parent.every((part, index) => candidate[index] === part);
}
function nodeLabel(node: MenuNode): string { return node.i18nInfo?.["zh-CN"] || node.name || "未命名菜单"; }

export interface MenuNodeIssueSummary {
  ownError: number;
  ownWarning: number;
  descendantError: number;
  descendantWarning: number;
}

export function summarizeMenuNodeIssues(path: MenuNodePath, issues: MenuValidationIssue[]): MenuNodeIssueSummary {
  const summary: MenuNodeIssueSummary = { ownError: 0, ownWarning: 0, descendantError: 0, descendantWarning: 0 };
  issues.forEach((issue) => {
    if (!issue.path) return;
    const own = samePath(issue.path, path);
    const descendant = isStrictDescendantPath(path, issue.path);
    if (!own && !descendant) return;
    const key = `${descendant ? "descendant" : "own"}${issue.severity === "error" ? "Error" : "Warning"}` as keyof MenuNodeIssueSummary;
    summary[key] += 1;
  });
  return summary;
}

export function findFirstDescendantIssuePath(
  nodes: MenuNode[],
  parentPath: MenuNodePath,
  issues: MenuValidationIssue[],
  severity: MenuValidationIssue["severity"],
): MenuNodePath | null {
  return walkMenuNodes(nodes).find((visit) =>
    isStrictDescendantPath(parentPath, visit.path)
    && issues.some((issue) => issue.severity === severity && issue.path && samePath(issue.path, visit.path)))?.path ?? null;
}

function renderIssueBadge(encoded: string, kind: "own" | "descendant", severity: MenuValidationIssue["severity"], count: number): string {
  if (!count) return "";
  const isError = severity === "error";
  const label = `${kind === "descendant" ? "子菜单 " : ""}${count} ${isError ? "错误" : "警告"}`;
  const tone = kind === "own"
    ? isError ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
    : isError ? "border-red-200 bg-white text-red-600 hover:bg-red-50" : "border-amber-200 bg-white text-amber-600 hover:bg-amber-50";
  return `<button type="button" data-jme-issue-path="${encoded}" data-jme-issue-kind="${kind}" data-jme-issue-severity="${severity}" class="rounded border px-1.5 py-0.5 text-[9px] font-medium leading-4 ${tone} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/30" title="定位${label}" aria-label="定位${label}">${label}</button>`;
}

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
  const issueSummary = summarizeMenuNodeIssues(path, issues);
  const compatibilityRoot = getCompatibilityRootPath(document.menu, path);
  const protectedNode = Boolean(compatibilityRoot);
  const active = samePath(path, selectedPath);
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(encoded) || Boolean(search);
  const cardTone = active ? "border-blue-500 bg-white shadow-[0_1px_3px_rgba(37,99,235,0.10)]" : "border-transparent bg-transparent hover:bg-white";
  const issueBadges = [
    renderIssueBadge(encoded, "own", "error", issueSummary.ownError),
    renderIssueBadge(encoded, "own", "warning", issueSummary.ownWarning),
    renderIssueBadge(encoded, "descendant", "error", issueSummary.descendantError),
    renderIssueBadge(encoded, "descendant", "warning", issueSummary.descendantWarning),
  ].join("");
  const searchable = `${nodeLabel(node)} ${node.name ?? ""} ${node.key ?? ""} ${node.path ?? ""}`.toLowerCase();
  const childMatches = node.children?.some((child) => JSON.stringify(child).toLowerCase().includes(search)) ?? false;
  if (search && !searchable.includes(search) && !childMatches) return "";

  return `<li class="relative" data-jme-tree-item="${encoded}">
    ${path.length > 1 && path.length <= 4 ? `<span aria-hidden="true" class="pointer-events-none absolute -left-2 top-6 z-[1] w-2 border-t ${path.length === 4 ? "border-dashed border-amber-200" : "border-slate-200"}"></span>` : ""}
    <div class="group relative flex min-h-16 items-start gap-2 rounded-2xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-blue-500/20 ${protectedNode ? "" : "cursor-grab active:cursor-grabbing"} ${cardTone}" draggable="${protectedNode ? "false" : "true"}" data-jme-drag-path="${encoded}" title="${protectedNode ? "兼容保留节点不可拖动" : "拖动可调整菜单顺序或层级"}">
      <button type="button" data-jme-toggle="${encoded}" class="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded text-xl font-bold leading-none text-slate-500 hover:bg-white hover:text-slate-800 ${hasChildren ? "" : "invisible"}" aria-label="${isExpanded ? "收起" : "展开"}"><span aria-hidden="true">${isExpanded ? "⌃" : "⌄"}</span></button>
      <button type="button" data-jme-select="${encoded}" class="min-w-0 flex-1 text-left focus-visible:outline-none">
        <span class="flex min-w-0 items-center gap-2"><span class="truncate text-[15px] ${active ? "font-bold text-slate-900" : "font-semibold text-slate-800"}" title="${escapeHtml(nodeLabel(node))}">${escapeHtml(nodeLabel(node))}</span></span>
        <span class="mt-1 text-xs text-slate-300">${path.length} 级</span>
      </button>
      <div class="ml-1 flex max-w-[210px] shrink-0 flex-wrap items-start justify-end gap-1 self-start">
        <span class="flex h-6 shrink-0 items-center gap-1">${protectedNode ? `<span class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500">兼容保留</span>` : ""}${node.display === false ? `<span class="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500">隐藏</span>` : ""}${node.disabled === true ? `<span class="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-600">已禁用</span>` : ""}</span><details class="relative" data-jme-menu-actions><summary class="grid h-6 w-6 cursor-pointer place-items-center rounded text-base leading-none text-slate-500 hover:bg-white hover:text-slate-900">…</summary><div class="absolute right-0 z-30 mt-2 w-60 rounded-[20px] border border-white bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.22)]"><button type="button" data-jme-open-add="${encoded}" class="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-medium text-slate-900 hover:bg-slate-50"><span class="grid w-6 shrink-0 place-items-center text-xl font-normal">✎</span><span>新增子级</span></button><button type="button" data-jme-duplicate-menu="${encoded}" class="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-medium text-slate-900 hover:bg-slate-50"><span class="grid w-6 shrink-0 place-items-center text-xl font-normal">▣</span><span>复制导航及子级</span></button><button type="button" data-jme-move-menu="${encoded}" class="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-medium text-slate-900 hover:bg-slate-50"><span class="grid w-6 shrink-0 place-items-center text-xl font-normal">↕</span><span>指定移动</span></button><button type="button" data-jme-move-up="${encoded}" class="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-medium text-slate-900 hover:bg-slate-50"><span class="grid w-6 shrink-0 place-items-center text-2xl font-light">↑</span><span>上移</span></button><button type="button" data-jme-move-down="${encoded}" class="flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-lg font-medium text-slate-900 hover:bg-slate-50"><span class="grid w-6 shrink-0 place-items-center text-2xl font-light">↓</span><span>下移</span></button><button type="button" data-jme-delete-menu="${encoded}" class="mt-1.5 flex h-14 w-full items-center gap-3 rounded-2xl bg-red-50 px-3 text-left text-lg font-medium text-red-400 hover:bg-red-100"><span class="grid w-6 shrink-0 place-items-center text-xl font-normal">▱</span><span>删除</span></button></div></details>
      </div>
    </div>
    ${hasChildren && isExpanded ? `<ol class="${path.length < 4 ? "ml-7 pl-2" : "ml-0 pl-0"}">${node.children!.map((child, index) => `<div data-jme-drop-parent="${encoded}" data-jme-drop-index="${index}" class="h-1 rounded hover:bg-blue-300"></div>${renderNode(document, child, [...path, index], [...ancestors, node], selectedPath, issues, expanded, search)}`).join("")}<div data-jme-drop-parent="${encoded}" data-jme-drop-index="${node.children!.length}" class="h-1 rounded hover:bg-blue-300"></div></ol>` : ""}
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
  const search = searchValue.trim().toLowerCase();
  return `<section class="flex min-h-0 w-[34%] min-w-[360px] max-w-[430px] shrink-0 flex-col border-r border-slate-100 bg-[#fafafa]" data-jme-tree-panel>
    <header class="shrink-0 border-b border-slate-200 px-6 pb-4 pt-6">
      <div class="flex items-center justify-between"><h2 class="text-lg font-bold text-slate-900">导航结构</h2><button type="button" data-jme-open-add="" class="text-sm font-semibold text-blue-500 hover:text-blue-700" title="新增一级菜单" aria-label="新增一级菜单">＋ 一级导航</button></div>
      <label class="mt-4 flex min-w-0 items-center rounded-full border border-slate-200 bg-white px-3 focus-within:border-blue-500"><span class="text-slate-400">⌕</span><input type="search" name="json-menu-tree-search" data-jme-search value="${escapeHtml(searchValue)}" placeholder="搜索导航名称、Key 或路径" autocomplete="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" class="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"></label>
      <div class="mt-4 flex items-center gap-3 text-sm"><span class="font-medium text-slate-800">${visits.length} 项</span>${expandableCount ? `<button type="button" data-jme-toggle-expand-all class="ml-auto text-slate-500 hover:text-blue-600">${allExpanded ? "收起" : "展开"}</button>` : ""}</div>
    </header>
    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1" data-jme-tree-scroll>
      ${document.menu.length ? `<ol>${document.menu.map((node, index) => `<div data-jme-drop-parent="" data-jme-drop-index="${index}" class="h-1 rounded hover:bg-teal-300"></div>${renderNode(document, node, [index], [], selectedPath, issues, expanded, search)}`).join("")}<div data-jme-drop-parent="" data-jme-drop-index="${document.menu.length}" class="h-2 rounded hover:bg-teal-300"></div></ol>` : `<div class="grid h-full min-h-72 place-items-center text-center"><div><div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-xl text-slate-400">☷</div><p class="mt-3 text-sm font-medium">暂无菜单</p><p class="mt-1 text-xs text-slate-500">从新增一级菜单开始配置</p></div></div>`}
    </div>
  </section>`;
}
