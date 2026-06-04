import type { PermissionAccess, PermissionResource } from "../config/permission-registry";
import {
  countRoleStats,
  deleteRole,
  getModuleGroups,
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
  return `
    <div class="space-y-6">
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-card-foreground">权限总览</h2>
        <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
          按 <strong class="text-card-foreground">一级导航 → 功能入口</strong> 配置角色可访问范围；支持
          <strong class="text-card-foreground">不可见 / 仅查看 / 可操作</strong>。门店角色、员工绑定、开钱箱等人员授权在本区维护；
          全店登录与会话策略见
          <a href="#/permissions/account-session" class="text-primary hover:underline">账户与会话安全</a>；
          POS/iPad 操作密码与下单授权见
          <a href="#/operations/queue-call/settings" class="text-primary hover:underline">前厅管理中心 · 设置</a>。
        </p>
        <dl class="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <dt class="text-muted-foreground">可授权一级模块</dt>
            <dd class="mt-1 text-2xl font-semibold tabular-nums text-card-foreground">${groups.length}</dd>
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
        <p class="text-sm text-muted-foreground">创建角色并配置其可访问的导航与功能，以及查看/操作级别。开钱箱等能力请在矩阵中对<strong>钱箱/支付</strong>相关入口设为「可操作」，再在<a href="#/permissions/staff" class="text-primary hover:underline">员工授权</a>绑定角色。</p>
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

function renderMatrixRows(role: RbacRole, filter: string): string {
  const groups = getModuleGroups();
  const q = filter.trim().toLowerCase();
  return groups
    .map((g) => {
      const rows = g.resources.filter((r) => {
        if (!q) return true;
        const hay = `${g.moduleTitle} ${r.featureTitle} ${r.path}`.toLowerCase();
        return hay.includes(q);
      });
      if (!rows.length) return "";
      return `<tbody data-rbac-module="${escapeHtml(g.moduleId)}" class="rbac-matrix-module">
        <tr class="bg-muted/50">
          <td colspan="4" class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">${escapeHtml(g.moduleTitle)}</td>
        </tr>
        ${rows.map((r) => renderResourceRow(role, r)).join("")}
      </tbody>`;
    })
    .join("");
}

function renderResourceRow(role: RbacRole, res: PermissionResource): string {
  const access = role.grants[res.key] ?? "hidden";
  return `<tr class="border-t border-border" data-rbac-resource="${escapeHtml(res.key)}">
    <td class="px-3 py-2 pl-6 text-sm text-card-foreground">
      <div>${escapeHtml(res.featureTitle)}</div>
      <div class="text-xs text-muted-foreground font-mono">${escapeHtml(res.path)}</div>
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(res.key)}" value="hidden" class="rbac-grant-radio" data-key="${escapeHtml(res.key)}" ${access === "hidden" ? "checked" : ""} aria-label="不可见" />
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(res.key)}" value="view" class="rbac-grant-radio" data-key="${escapeHtml(res.key)}" ${access === "view" ? "checked" : ""} aria-label="仅查看" />
    </td>
    <td class="px-2 py-2 text-center">
      <input type="radio" name="grant-${escapeHtml(res.key)}" value="operate" class="rbac-grant-radio" data-key="${escapeHtml(res.key)}" ${access === "operate" ? "checked" : ""} aria-label="可操作" />
    </td>
    <td class="px-3 py-2">
      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accessBadgeClass(access)}">${accessLabel(access)}</span>
    </td>
  </tr>`;
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
        </div>
      </div>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div class="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <span class="font-medium text-card-foreground">功能权限矩阵</span>
          <input data-rbac-matrix-filter type="search" placeholder="筛选模块或功能…" class="ml-auto max-w-xs flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
        </div>
        <div class="overflow-x-auto max-h-[min(60vh,520px)]">
          <table class="w-full text-sm" data-rbac-matrix-table>
            <thead class="sticky top-0 z-10 bg-card text-muted-foreground shadow-sm">
              <tr>
                <th class="px-3 py-2 text-left font-medium min-w-[200px]">导航 / 功能</th>
                <th class="px-2 py-2 text-center w-16">不可见</th>
                <th class="px-2 py-2 text-center w-16">仅查看</th>
                <th class="px-2 py-2 text-center w-16">可操作</th>
                <th class="px-3 py-2 text-left w-24">当前</th>
              </tr>
            </thead>
            ${renderMatrixRows(role, "")}
          </table>
        </div>
        <p class="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          标准操作列（新建/编辑/删除/导出/审核）将在接入 API 后按页面细化；当前以<strong>页面级</strong>三态为准。仅查看：可见导航与列表，主按钮禁用；不可见：侧栏不展示入口。
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
      <p class="text-sm text-muted-foreground">为员工分配一个或多个角色；有效权限为多角色 grants 的<strong>并集</strong>（取最高：可操作 &gt; 仅查看 &gt; 不可见）。</p>
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

function collectGrantsFromEditor(root: HTMLElement): Record<string, PermissionAccess> {
  const grants: Record<string, PermissionAccess> = {};
  root.querySelectorAll<HTMLInputElement>(".rbac-grant-radio:checked").forEach((el) => {
    const key = el.getAttribute("data-key");
    const val = el.value;
    if (key && (val === "hidden" || val === "view" || val === "operate")) grants[key] = val;
  });
  return grants;
}

function applyMatrixPreset(root: HTMLElement, access: PermissionAccess): void {
  root.querySelectorAll<HTMLInputElement>(`.rbac-grant-radio[value="${access}"]`).forEach((el) => {
    el.checked = true;
    const key = el.getAttribute("data-key");
    const row = key ? root.querySelector(`[data-rbac-resource="${key}"]`) : null;
    const badge = row?.querySelector("td:last-child span");
    if (badge) {
      badge.className = `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accessBadgeClass(access)}`;
      badge.textContent = accessLabel(access);
    }
  });
}

export function bindPermissionsRbac(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-rbac-delete-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-rbac-delete-role");
      if (!id) return;
      if (!confirm("确定删除该角色？已绑定员工的角无法删除。")) return;
      if (deleteRole(id)) location.hash = "#/permissions/roles";
      else alert("无法删除：角色不存在、为系统角色或仍有关联员工。");
    });
  });

  const editor = document.querySelector<HTMLElement>("[data-rbac-editor]");
  if (editor) {
    const roleId = editor.getAttribute("data-role-id") ?? "";
    const isNew = editor.getAttribute("data-is-new") === "1";
    let draft = { ...(getRoleById(roleId)?.grants ?? {}) };

    editor.querySelectorAll<HTMLInputElement>(".rbac-grant-radio").forEach((radio) => {
      radio.addEventListener("change", () => {
        const key = radio.getAttribute("data-key");
        const val = radio.value;
        if (!key || (val !== "hidden" && val !== "view" && val !== "operate")) return;
        draft = mergeRoleGrants(draft, key, val);
        const row = editor.querySelector(`[data-rbac-resource="${key}"]`);
        const badge = row?.querySelector("td:last-child span");
        if (badge) {
          badge.className = `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${accessBadgeClass(val)}`;
          badge.textContent = accessLabel(val);
        }
      });
    });

    editor.querySelectorAll<HTMLButtonElement>("[data-rbac-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = btn.getAttribute("data-rbac-preset");
        const access: PermissionAccess =
          p === "operate-all" ? "operate" : p === "view-all" ? "view" : "hidden";
        applyMatrixPreset(editor, access);
        draft = collectGrantsFromEditor(editor);
      });
    });

    const filterInput = editor.querySelector<HTMLInputElement>("[data-rbac-matrix-filter]");
    filterInput?.addEventListener("input", () => {
      const q = filterInput.value.trim().toLowerCase();
      editor.querySelectorAll<HTMLElement>("[data-rbac-resource]").forEach((row) => {
        const text = row.textContent?.toLowerCase() ?? "";
        row.classList.toggle("hidden", !!q && !text.includes(q));
      });
      editor.querySelectorAll<HTMLElement>(".rbac-matrix-module").forEach((tb) => {
        const visible = tb.querySelectorAll("[data-rbac-resource]:not(.hidden)").length > 0;
        tb.classList.toggle("hidden", !!q && !visible);
      });
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
      draft = collectGrantsFromEditor(editor);
      upsertRole(
        {
          id,
          name,
          description: description.trim(),
          isSystem: existing?.isSystem ?? false,
          grants: draft,
          updatedAt: new Date().toISOString(),
        },
        `角色「${name}」权限矩阵已保存`,
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
