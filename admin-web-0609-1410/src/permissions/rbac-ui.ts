import type { PermissionAccess, PermissionTreeNode } from "../config/permission-registry";
import { isExplicitGrant } from "../config/permission-registry";
import {
  countRoleStats,
  deleteRole,
  getEffectiveGrant,
  getModuleGroups,
  getPermissionIndex,
  getRbacSnapshot,
  getRoleById,
  mergeRoleGrants,
  updateStaffAssignments,
  upsertRole,
  type RbacRole,
} from "./rbac-store";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function accessLabel(a: PermissionAccess): string {
  if (a === "operate") return "可操作";
  if (a === "view") return "仅查看";
  return "不可见";
}

function accessBadgeClass(a: PermissionAccess): string {
  if (a === "operate") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (a === "view") return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

function levelLabel(level: number): string {
  if (level === 1) return "一级导航";
  if (level === 2) return "二级入口";
  if (level === 3) return "功能分类";
  return "功能设置";
}

function levelPadding(level: number): string {
  return `${0.5 + (level - 1) * 1.25}rem`;
}

export function isPermissionsRbacPath(path: string): boolean {
  return (
    path === "/permissions/overview" ||
    path === "/permissions/roles" ||
    path.startsWith("/permissions/roles/") ||
    path === "/permissions/staff" ||
    path === "/permissions/change-log"
  );
}

export function renderPermissionsRbacPage(path: string): string {
  if (path === "/permissions/overview") return renderOverviewPage();
  if (path === "/permissions/roles") return renderRolesListPage();
  if (path === "/permissions/roles/new" || path.startsWith("/permissions/roles/edit/")) {
    return renderRoleEditorPage(path);
  }
  if (path === "/permissions/staff") return renderStaffPage();
  if (path === "/permissions/change-log") return renderChangelogPage();
  return renderOverviewPage();
}

function renderOverviewPage(): string {
  const { roles, staff } = getRbacSnapshot();
  const groups = getModuleGroups();
  const index = getPermissionIndex();
  return `
    <div class="space-y-6">
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-card-foreground">权限总览</h2>
        <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
          按 <strong class="text-card-foreground">一级导航 → 二级入口 → 功能分类 → 功能设置</strong> 四级树配置角色权限；
          支持 <strong class="text-card-foreground">不可见 / 仅查看 / 可操作</strong>，子级继承父级并封顶。
          门店角色、<a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a>与员工绑定在本区维护；POS 会话与操作安全见
          <a href="#/operations/queue-call/settings/foh-pos-shell" class="text-primary hover:underline">前厅 · 登录与主界面</a>。
        </p>
        <dl class="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
          <div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <dt class="text-muted-foreground">可授权一级模块</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${groups.length}</dd>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <dt class="text-muted-foreground">可授权资源节点</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${index.byKey.size}</dd>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <dt class="text-muted-foreground">角色数</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${roles.length}</dd>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <dt class="text-muted-foreground">已授权员工</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${staff.length}</dd>
          </div>
        </dl>
      </div>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div class="border-b border-border px-4 py-3 font-medium text-card-foreground">角色摘要</div>
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">角色</th>
              <th class="px-4 py-2 font-medium">可操作</th>
              <th class="px-4 py-2 font-medium">仅查看</th>
              <th class="px-4 py-2 font-medium">不可见</th>
              <th class="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            ${roles
              .map((r) => {
                const s = countRoleStats(r);
                return `<tr class="border-t border-border">
                  <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(r.name)}${r.isSystem ? '<span class="ml-2 text-xs text-muted-foreground">系统</span>' : ""}</td>
                  <td class="px-4 py-3 tabular-nums">${s.operate}</td>
                  <td class="px-4 py-3 tabular-nums">${s.view}</td>
                  <td class="px-4 py-3 tabular-nums">${s.hidden}</td>
                  <td class="px-4 py-3 text-right">
                    <a href="#/permissions/roles/edit/${encodeURIComponent(r.id)}" class="text-primary hover:underline">编辑矩阵</a>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderRolesListPage(): string {
  const { roles } = getRbacSnapshot();
  return `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">创建角色并配置四级权限树。员工登录账号在 <a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a> 维护。</p>
        <a href="#/permissions/roles/new" class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">新建角色</a>
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${roles
          .map((r) => {
            const s = countRoleStats(r);
            return `<article class="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-card-foreground">${escapeHtml(r.name)}</h3>
                ${r.isSystem ? '<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">系统</span>' : ""}
              </div>
              <p class="mt-2 text-sm text-muted-foreground line-clamp-2">${escapeHtml(r.description || "—")}</p>
              <p class="mt-3 text-xs text-muted-foreground">可操作 ${s.operate} · 仅查看 ${s.view} · 不可见 ${s.hidden}</p>
              <div class="mt-4 flex gap-2">
                <a href="#/permissions/roles/edit/${encodeURIComponent(r.id)}" class="text-sm font-medium text-primary hover:underline">编辑权限</a>
                ${r.isSystem ? "" : `<button type="button" class="text-sm text-destructive hover:underline" data-rbac-delete-role="${escapeHtml(r.id)}">删除</button>`}
              </div>
            </article>`;
          })
          .join("")}
      </div>
    </div>`;
}

function nodeSearchText(node: PermissionTreeNode): string {
  const r = node.resource;
  const parts = [r.moduleTitle, r.title, r.path ?? "", r.groupKey ?? "", r.seq ? `s${r.seq}` : ""];
  for (const child of node.children) parts.push(nodeSearchText(child));
  return parts.join(" ");
}

function renderTreeNodeRow(
  role: RbacRole,
  node: PermissionTreeNode,
  expandedKeys: Set<string>,
  filter: string,
  parentCollapsed = false,
): string {
  const r = node.resource;
  const effective = getEffectiveGrant(role.grants, r.key);
  const explicit = isExplicitGrant(role.grants, r.key);
  const hasChildren = node.children.length > 0;
  const expanded = expandedKeys.has(r.key) || !!filter.trim();
  const q = filter.trim().toLowerCase();
  const hay = nodeSearchText(node).toLowerCase();
  const selfMatch = !q || hay.includes(q);
  if (!selfMatch) return "";

  const childRows = hasChildren
    ? node.children
        .map((c) => renderTreeNodeRow(role, c, expandedKeys, filter, !expanded))
        .join("")
    : "";

  const meta =
    r.level === 2 && r.path
      ? `<div class="text-xs text-muted-foreground font-mono">${escapeHtml(r.path)}</div>`
      : r.level === 4 && r.seq
        ? `<div class="text-xs text-muted-foreground">seq ${r.seq}</div>`
        : r.level === 3 && r.groupKey
          ? `<div class="text-xs text-muted-foreground font-mono">${escapeHtml(r.groupKey)}</div>`
          : "";

  const toggleBtn = hasChildren
    ? `<button type="button" class="rbac-tree-toggle mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted" data-key="${escapeHtml(r.key)}" aria-expanded="${expanded ? "true" : "false"}">${expanded ? "▼" : "▶"}</button>`
    : `<span class="mr-1 inline-block w-5 shrink-0"></span>`;

  const inheritBadge = explicit
    ? ""
    : `<span class="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">继承</span>`;

  const hiddenClass = parentCollapsed || (!selfMatch && !!q) ? " hidden" : "";

  return `<tr class="border-t border-border rbac-tree-row${hiddenClass}" data-rbac-resource="${escapeHtml(r.key)}" data-rbac-level="${r.level}">
    <td class="px-3 py-2 text-sm text-card-foreground" style="padding-left:${levelPadding(r.level)}">
      <div class="flex items-start gap-0.5">
        ${toggleBtn}
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-1">
            <span class="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">${levelLabel(r.level)}</span>
            <span>${escapeHtml(r.title)}</span>
          </div>
          ${meta}
        </div>
      </div>
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(r.key)}" value="hidden" class="rbac-grant-radio" data-key="${escapeHtml(r.key)}" ${effective === "hidden" ? "checked" : ""} aria-label="不可见" />
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(r.key)}" value="view" class="rbac-grant-radio" data-key="${escapeHtml(r.key)}" ${effective === "view" ? "checked" : ""} aria-label="仅查看" />
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(r.key)}" value="operate" class="rbac-grant-radio" data-key="${escapeHtml(r.key)}" ${effective === "operate" ? "checked" : ""} aria-label="可操作" />
    </td>
    <td class="px-3 py-2">
      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accessBadgeClass(effective)}">${accessLabel(effective)}</span>${inheritBadge}
    </td>
  </tr>${childRows}`;
}

function renderMatrixTree(role: RbacRole, filter: string): string {
  const groups = getModuleGroups();
  const expanded = new Set<string>();
  for (const g of groups) expanded.add(g.moduleKey);

  return groups
    .map((g) => {
      const row = renderTreeNodeRow(role, g.tree, expanded, filter);
      if (!row) return "";
      return `<tbody data-rbac-module="${escapeHtml(g.moduleId)}" class="rbac-matrix-module">${row}</tbody>`;
    })
    .join("");
}

function renderRoleEditorPage(path: string): string {
  const isNew = path === "/permissions/roles/new";
  const roleId = isNew ? "" : decodeURIComponent(path.replace("/permissions/roles/edit/", ""));
  const existing = roleId ? getRoleById(roleId) : undefined;
  const role: RbacRole = existing ?? {
    id: "",
    name: "",
    description: "",
    isSystem: false,
    grants: {},
    updatedAt: new Date().toISOString(),
  };

  return `
    <div class="space-y-4" data-rbac-editor data-role-id="${escapeHtml(role.id)}" data-is-new="${isNew ? "1" : "0"}">
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="block text-sm">
            <span class="font-medium text-card-foreground">角色名称</span>
            <input data-rbac-field="name" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value="${escapeHtml(role.name)}" ${role.isSystem ? "readonly" : ""} />
          </label>
          <label class="block text-sm">
            <span class="font-medium text-card-foreground">角色 ID</span>
            <input data-rbac-field="slug" type="text" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" value="${escapeHtml(role.id)}" placeholder="例如 cashier" ${isNew ? "" : "readonly"} />
          </label>
          <label class="block text-sm md:col-span-2">
            <span class="font-medium text-card-foreground">说明</span>
            <textarea data-rbac-field="description" rows="2" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">${escapeHtml(role.description)}</textarea>
          </label>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" data-rbac-preset="operate-all" class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">全部可操作</button>
          <button type="button" data-rbac-preset="view-all" class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">全部仅查看</button>
          <button type="button" data-rbac-preset="hidden-all" class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">全部不可见</button>
          <button type="button" data-rbac-expand-all class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">展开全部</button>
          <button type="button" data-rbac-collapse-l2 class="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted">仅展开到二级</button>
        </div>
      </div>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <span class="font-medium text-card-foreground">功能权限矩阵（四级树）</span>
          <input data-rbac-matrix-filter type="search" placeholder="筛选模块、分类、设置项、seq…" class="ml-auto max-w-xs flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
        </div>
        <div class="overflow-x-auto max-h-[min(65vh,560px)]" data-rbac-matrix-scroll>
          <table class="w-full text-sm" data-rbac-matrix-table>
            <thead class="sticky top-0 z-10 bg-card text-muted-foreground shadow-sm">
              <tr>
                <th class="px-3 py-2 text-left font-medium min-w-[260px]">导航 / 功能</th>
                <th class="px-2 py-2 text-center w-16">不可见</th>
                <th class="px-2 py-2 text-center w-16">仅查看</th>
                <th class="px-2 py-2 text-center w-16">可操作</th>
                <th class="px-3 py-2 text-left w-28">有效权限</th>
              </tr>
            </thead>
            ${renderMatrixTree(role, "")}
          </table>
        </div>
        <p class="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          子级默认<strong>继承</strong>父级有效权限；显式选择后标记消失。父级为「仅查看」时，子级最高也只能仅查看（开关/输入框 disabled）。
          设置项 L4 控制能否修改门店配置值，与 catalog 中的开关状态无关。
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" data-rbac-save-role class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存角色</button>
        <a href="#/permissions/roles" class="rounded-lg border border-border px-5 py-2 text-sm hover:bg-muted">取消</a>
      </div>
    </div>`;
}

function renderStaffPage(): string {
  const { roles, staff } = getRbacSnapshot();
  return `
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">为员工分配一个或多个角色；有效权限为多角色 grants 的<strong>并集</strong>（取最高：可操作 &gt; 仅查看 &gt; 不可见），再按树继承封顶。登录邮箱与密码请在 <a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a> 维护。</p>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">员工</th>
              <th class="px-4 py-2 font-medium">角色</th>
            </tr>
          </thead>
          <tbody>
            ${staff
              .map(
                (s) => `<tr class="border-t border-border" data-staff-row="${escapeHtml(s.employeeId)}">
              <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(s.employeeName)}<span class="ml-2 font-mono text-xs text-muted-foreground">${escapeHtml(s.employeeId)}</span></td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-3">
                  ${roles
                    .map((r) => {
                      const checked = s.roleIds.includes(r.id);
                      return `<label class="inline-flex items-center gap-1.5 text-sm">
                        <input type="checkbox" class="rbac-staff-role-cb" data-employee="${escapeHtml(s.employeeId)}" data-role="${escapeHtml(r.id)}" ${checked ? "checked" : ""} />
                        ${escapeHtml(r.name)}
                      </label>`;
                    })
                    .join("")}
                </div>
              </td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <button type="button" data-rbac-save-staff class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存员工授权</button>
    </div>`;
}

function renderChangelogPage(): string {
  const { changelog } = getRbacSnapshot();
  return `
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="px-4 py-2 font-medium">时间</th>
            <th class="px-4 py-2 font-medium">操作人</th>
            <th class="px-4 py-2 font-medium">动作</th>
            <th class="px-4 py-2 font-medium">说明</th>
          </tr>
        </thead>
        <tbody>
          ${changelog
            .map(
              (e) => `<tr class="border-t border-border">
            <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">${escapeHtml(e.at.slice(0, 19).replace("T", " "))}</td>
            <td class="px-4 py-3">${escapeHtml(e.actor)}</td>
            <td class="px-4 py-3">${escapeHtml(e.action)}</td>
            <td class="px-4 py-3 text-card-foreground">${escapeHtml(e.detail)}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function updateRowBadge(editor: HTMLElement, key: string, effective: PermissionAccess, explicit: boolean): void {
  const row = editor.querySelector(`[data-rbac-resource="${key}"]`);
  const badge = row?.querySelector("td:last-child span.inline-flex");
  if (badge) {
    badge.className = `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accessBadgeClass(effective)}`;
    badge.textContent = accessLabel(effective);
  }
  const inherit = row?.querySelector("td:last-child span.rounded.bg-muted");
  if (inherit) inherit.remove();
  if (!explicit && row) {
    const td = row.querySelector("td:last-child");
    if (td && !td.querySelector("span.rounded.bg-muted")) {
      td.insertAdjacentHTML(
        "beforeend",
        '<span class="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">继承</span>',
      );
    }
  }
}

function refreshEffectiveBadges(editor: HTMLElement, draft: Record<string, PermissionAccess>): void {
  const index = getPermissionIndex();
  editor.querySelectorAll<HTMLElement>("[data-rbac-resource]").forEach((row) => {
    const key = row.getAttribute("data-rbac-resource");
    if (!key) return;
    const effective = getEffectiveGrant(draft, key);
    const explicit = isExplicitGrant(draft, key);
    updateRowBadge(editor, key, effective, explicit);
    const radios = row.querySelectorAll<HTMLInputElement>(".rbac-grant-radio");
    radios.forEach((radio) => {
      radio.checked = radio.value === effective;
    });
  });
}

function applyCascade(
  draft: Record<string, PermissionAccess>,
  key: string,
  access: PermissionAccess,
  cascade: boolean,
): Record<string, PermissionAccess> {
  let next = mergeRoleGrants(draft, key, access);
  if (!cascade) return next;
  const index = getPermissionIndex();
  for (const childKey of index.getDescendantKeys(key)) {
    next = mergeRoleGrants(next, childKey, access);
  }
  return next;
}

function applySparsePreset(access: PermissionAccess): Record<string, PermissionAccess> {
  const grants: Record<string, PermissionAccess> = {};
  for (const g of getModuleGroups()) {
    grants[g.moduleKey] = access;
  }
  return grants;
}

export function bindPermissionsRbac(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-rbac-delete-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-rbac-delete-role");
      if (!id) return;
      if (!confirm("确定删除该角色？已绑定员工的角色无法删除。")) return;
      if (deleteRole(id)) location.hash = "#/permissions/roles";
      else alert("无法删除：角色不存在、为系统角色或仍有关联员工。");
    });
  });

  const editor = document.querySelector<HTMLElement>("[data-rbac-editor]");
  if (editor) {
    const roleId = editor.getAttribute("data-role-id") ?? "";
    const isNew = editor.getAttribute("data-is-new") === "1";
    let draft: Record<string, PermissionAccess> = { ...(getRoleById(roleId)?.grants ?? {}) };

    editor.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement;
      const toggle = target.closest<HTMLButtonElement>(".rbac-tree-toggle");
      if (!toggle) return;
      const key = toggle.getAttribute("data-key");
      if (!key) return;
      const wasExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", wasExpanded ? "false" : "true");
      toggle.textContent = wasExpanded ? "▶" : "▼";
      const row = toggle.closest("tr");
      if (!row) return;
      let sibling = row.nextElementSibling;
      const level = Number(row.getAttribute("data-rbac-level") ?? "1");
      while (sibling) {
        const sibLevel = Number(sibling.getAttribute("data-rbac-level") ?? "99");
        if (sibLevel <= level) break;
        if (wasExpanded) {
          sibling.classList.add("hidden");
        } else if (sibLevel === level + 1) {
          sibling.classList.remove("hidden");
        }
        sibling = sibling.nextElementSibling;
      }
    });

    editor.querySelectorAll<HTMLInputElement>(".rbac-grant-radio").forEach((radio) => {
      radio.addEventListener("change", () => {
        const key = radio.getAttribute("data-key");
        const val = radio.value;
        if (!key || (val !== "hidden" && val !== "view" && val !== "operate")) return;
        const index = getPermissionIndex();
        const hasChildren = index.getDescendantKeys(key).length > 0;
        let cascade = false;
        if (hasChildren) {
          cascade = confirm("是否将同一权限级联到所有子节点？\n确定 = 级联；取消 = 仅当前节点。");
        }
        draft = applyCascade(draft, key, val, cascade);
        refreshEffectiveBadges(editor, draft);
      });
    });

    editor.querySelectorAll<HTMLButtonElement>("[data-rbac-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = btn.getAttribute("data-rbac-preset");
        const access: PermissionAccess =
          p === "operate-all" ? "operate" : p === "view-all" ? "view" : "hidden";
        if (!confirm(`将所有一级导航设为「${accessLabel(access)}」？（子级继承，可再逐层覆盖）`)) return;
        draft = applySparsePreset(access);
        refreshEffectiveBadges(editor, draft);
      });
    });

    editor.querySelector<HTMLButtonElement>("[data-rbac-expand-all]")?.addEventListener("click", () => {
      editor.querySelectorAll<HTMLButtonElement>(".rbac-tree-toggle").forEach((btn) => {
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "▼";
      });
      editor.querySelectorAll<HTMLElement>(".rbac-tree-row").forEach((row) => row.classList.remove("hidden"));
    });

    editor.querySelector<HTMLButtonElement>("[data-rbac-collapse-l2]")?.addEventListener("click", () => {
      editor.querySelectorAll<HTMLElement>(".rbac-tree-row").forEach((row) => {
        const level = Number(row.getAttribute("data-rbac-level") ?? "1");
        if (level > 2) row.classList.add("hidden");
      });
      editor.querySelectorAll<HTMLButtonElement>(".rbac-tree-toggle").forEach((btn) => {
        const row = btn.closest("tr");
        const level = Number(row?.getAttribute("data-rbac-level") ?? "1");
        if (level === 1) {
          btn.setAttribute("aria-expanded", "true");
          btn.textContent = "▼";
        } else {
          btn.setAttribute("aria-expanded", "false");
          btn.textContent = "▶";
        }
      });
    });

    const filterInput = editor.querySelector<HTMLInputElement>("[data-rbac-matrix-filter]");
    filterInput?.addEventListener("input", () => {
      const q = filterInput.value.trim().toLowerCase();
      editor.querySelectorAll<HTMLElement>(".rbac-tree-row").forEach((row) => {
        const text = row.textContent?.toLowerCase() ?? "";
        row.classList.toggle("hidden", !!q && !text.includes(q));
      });
      if (q) {
        editor.querySelectorAll<HTMLButtonElement>(".rbac-tree-toggle").forEach((btn) => {
          btn.setAttribute("aria-expanded", "true");
          btn.textContent = "▼";
        });
        editor.querySelectorAll<HTMLElement>(".rbac-tree-row").forEach((row) => {
          if (!row.classList.contains("hidden")) row.classList.remove("hidden");
        });
      }
    });

    editor.querySelector<HTMLButtonElement>("[data-rbac-save-role]")?.addEventListener("click", () => {
      const name = (editor.querySelector<HTMLInputElement>('[data-rbac-field="name"]')?.value ?? "").trim();
      const slug = (
        editor.querySelector<HTMLInputElement>('[data-rbac-field="slug"]')?.value ?? ""
      )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const description =
        editor.querySelector<HTMLTextAreaElement>('[data-rbac-field="description"]')?.value ?? "";
      const id = isNew ? slug : roleId;
      if (!name || !id) {
        alert("请填写角色名称与 ID。");
        return;
      }
      const existing = getRoleById(id);
      if (isNew && existing) {
        alert("角色 ID 已存在。");
        return;
      }
      upsertRole(
        {
          id,
          name,
          description: description.trim(),
          isSystem: existing?.isSystem ?? false,
          grants: draft,
          updatedAt: new Date().toISOString(),
        },
        `角色「${name}」四级权限矩阵已保存`,
      );
      location.hash = `#/permissions/roles/edit/${encodeURIComponent(id)}`;
    });
  }

  document.querySelector<HTMLButtonElement>("[data-rbac-save-staff]")?.addEventListener("click", () => {
    const { staff: prev } = getRbacSnapshot();
    const next = prev.map((s) => {
      const boxes = document.querySelectorAll<HTMLInputElement>(
        `.rbac-staff-role-cb[data-employee="${s.employeeId}"]`,
      );
      const roleIds: string[] = [];
      boxes.forEach((cb) => {
        if (cb.checked) {
          const r = cb.getAttribute("data-role");
          if (r) roleIds.push(r);
        }
      });
      return { ...s, roleIds };
    });
    updateStaffAssignments(next);
    alert("员工授权已保存（本地演示数据）。");
  });
}
