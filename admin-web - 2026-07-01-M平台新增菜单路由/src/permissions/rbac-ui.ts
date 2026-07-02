import { buildPlatformPresetIndex } from "../config/platform-preset-tree";
import { refreshSessionIfCurrentEmployee, refreshUserSessionContext } from "../auth/session-permissions";
import {
  DEMO_SCOPE_STORES,
  getLayoutContextStoreId,
  isStoreLayoutPreset,
} from "../auth/session-scope";
import {
  bindFourColumnMatrix,
  renderFourColumnMatrix,
  renderFourColumnMatrixShell,
} from "../config/permission-four-column-ui";
import {
  formatStaffStoreAccessLabel,
  type StaffStoreAccess,
} from "./store-access";
import {
  cascadeRbacEnableSelection,
  countRoleStats,
  deleteRole,
  getModuleGroups,
  getPermissionIndex,
  getRbacPresetIndex,
  getRbacSnapshot,
  getRoleById,
  normalizeRoleSelection,
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
          按 <strong class="text-card-foreground">一级导航 → 二级导航 → 三级分组 → 功能设置</strong> 四级树配置角色权限；
          通过<strong class="text-card-foreground">勾选导航功能</strong>启用或关闭访问（与平台预设 · 配置预设交互一致）。
          门店角色、<a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a>与员工绑定在本区维护。
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
              <th class="px-4 py-2 font-medium">已启用节点</th>
              <th class="px-4 py-2 font-medium">一级导航</th>
              <th class="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            ${roles
              .map((r) => {
                const s = countRoleStats(r);
                return `<tr class="border-t border-border">
                  <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(r.name)}${r.isSystem ? '<span class="ml-2 text-xs text-muted-foreground">系统</span>' : ""}</td>
                  <td class="px-4 py-3 tabular-nums">${s.enabled} / ${s.total}</td>
                  <td class="px-4 py-3 tabular-nums">${s.enabledL1}</td>
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
        <p class="text-sm text-muted-foreground">创建角色并按四级导航树勾选功能权限（与平台预设 · 配置预设一致）。员工登录账号在 <a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a> 维护。</p>
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
              <p class="mt-3 text-xs text-muted-foreground">已启用 ${s.enabled} 项 · 一级导航 ${s.enabledL1} 个</p>
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

function renderRoleEditorPage(path: string): string {
  const isNew = path === "/permissions/roles/new";
  const roleId = isNew ? "" : decodeURIComponent(path.replace("/permissions/roles/edit/", ""));
  const existing = roleId ? getRoleById(roleId) : undefined;
  const role: RbacRole = existing ?? {
    id: "",
    name: "",
    description: "",
    isSystem: false,
    selection: {},
    updatedAt: new Date().toISOString(),
  };

  const index = getRbacPresetIndex();
  const selection = normalizeRoleSelection(role.selection);
  const activeL1 = index.groups[0]?.moduleKey ?? "";
  const activeL2 = index.groups[0]?.tree.children[0]?.resource.key ?? "";
  const activeL3 = index.groups[0]?.tree.children[0]?.children[0]?.resource.key ?? "";
  const { col1, col2, col3, col4 } = renderFourColumnMatrix(
    selection,
    index,
    activeL1,
    activeL2,
    activeL3,
    "",
    undefined,
    "rbac",
  );
  const enabledL1 = countRoleStats(role).enabledL1;

  return `
    <div class="space-y-4" data-rbac-editor>
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
      </div>
      <div
        class="min-h-0 flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col"
        data-rbac-matrix-root
        data-role-id="${escapeHtml(role.id)}"
        data-is-new="${isNew ? "1" : "0"}"
        data-active-l1="${escapeHtml(activeL1)}"
        data-active-l2="${escapeHtml(activeL2)}"
        data-active-l3="${escapeHtml(activeL3)}"
      >
        <input type="hidden" data-pp-selection-json value="${escapeHtml(JSON.stringify(selection))}" />
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-card-foreground">按导航树配置功能</h2>
          <p class="text-xs text-muted-foreground mt-0.5">角色权限 · 当前已启用 <strong class="text-card-foreground">${enabledL1}</strong> 个一级导航</p>
        </div>
        ${renderFourColumnMatrixShell(col1, col2, col3, col4)}
        <p class="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          分组内功能 / 设置：<strong class="text-card-foreground">勾选</strong>即展示，未勾选则不展示；勾选后可按需勾选<strong class="text-card-foreground">可编辑</strong>（可改开关与配置值），不勾选可编辑则为只读展示。
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button type="button" data-rbac-save-role class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存角色</button>
        <a href="#/permissions/roles" class="rounded-lg border border-border px-5 py-2 text-sm hover:bg-muted">取消</a>
      </div>
    </div>`;
}

function renderStaffStoreAccessCell(s: {
  employeeId: string;
  storeAccess: StaffStoreAccess;
}): string {
  const layoutStoreId = getLayoutContextStoreId();
  const layoutStoreLabel =
    DEMO_SCOPE_STORES.find((o) => o.value === layoutStoreId)?.labelZh ?? layoutStoreId;

  if (isStoreLayoutPreset()) {
    return `<div class="space-y-1">
      <p class="text-sm font-medium text-card-foreground">${escapeHtml(layoutStoreLabel)}</p>
      <p class="text-xs text-muted-foreground">门店版仅单店经营，默认可访问当前模拟门店</p>
      <input type="hidden" class="rbac-staff-store-mode" data-employee="${escapeHtml(s.employeeId)}" value="stores" />
      <input type="hidden" class="rbac-staff-layout-store" data-employee="${escapeHtml(s.employeeId)}" value="${escapeHtml(layoutStoreId)}" />
    </div>`;
  }

  const demoStores = DEMO_SCOPE_STORES.filter((o) => o.value);
  return `<div class="space-y-2">
    <select class="rbac-staff-store-mode h-9 rounded-md border border-border bg-background px-2 text-sm" data-employee="${escapeHtml(s.employeeId)}">
      <option value="all" ${s.storeAccess.mode === "all" ? "selected" : ""}>全部门店</option>
      <option value="stores" ${s.storeAccess.mode === "stores" ? "selected" : ""}>指定门店</option>
    </select>
    <div class="rbac-staff-store-picks flex flex-wrap gap-2 ${s.storeAccess.mode === "all" ? "hidden" : ""}" data-employee="${escapeHtml(s.employeeId)}">
      ${demoStores
        .map((o) => {
          const checked = s.storeAccess.ids.includes(o.value);
          return `<label class="inline-flex items-center gap-1 text-xs">
            <input type="checkbox" class="rbac-staff-store-cb" data-employee="${escapeHtml(s.employeeId)}" value="${escapeHtml(o.value)}" ${checked ? "checked" : ""} />
            ${escapeHtml(o.labelZh)}
          </label>`;
        })
        .join("")}
    </div>
    <p class="text-xs text-muted-foreground">${escapeHtml(formatStaffStoreAccessLabel(s.storeAccess))}</p>
  </div>`;
}

function renderStaffPage(): string {
  const { roles, staff } = getRbacSnapshot();
  const storeLayoutHint = isStoreLayoutPreset()
    ? `<p class="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">当前为<strong class="text-card-foreground">门店版</strong>模拟：全员默认可访问门店「${escapeHtml(DEMO_SCOPE_STORES.find((o) => o.value === getLayoutContextStoreId())?.labelZh ?? getLayoutContextStoreId())}」。切换顶栏「连锁版」后可配置多店数据范围。</p>`
    : "";
  return `
    <div class="space-y-4">
      ${storeLayoutHint}
      <p class="text-sm text-muted-foreground">为员工分配角色（功能权限并集）与<strong>可访问门店</strong>（数据范围）。切换顶栏门店只改变数据查询范围，<strong>不会</strong>改变功能权限。登录邮箱与密码请在 <a href="#/permissions/staff-accounts" class="text-primary hover:underline">员工登录账号</a> 维护。</p>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">员工</th>
              <th class="px-4 py-2 font-medium">角色（功能权限）</th>
              <th class="px-4 py-2 font-medium">可访问门店（数据范围）</th>
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
              <td class="px-4 py-3">${renderStaffStoreAccessCell(s)}</td>
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

  const matrixRoot = document.querySelector<HTMLElement>("[data-rbac-matrix-root]");
  if (matrixRoot) {
    const roleId = matrixRoot.getAttribute("data-role-id") ?? "";
    const isNew = matrixRoot.getAttribute("data-is-new") === "1";
    const matrixApi = bindFourColumnMatrix(matrixRoot, {
      getIndex: () => buildPlatformPresetIndex("pos"),
      matrixMode: "rbac",
      onEnableToggle: (selection, key, enabled) =>
        cascadeRbacEnableSelection(selection, key, enabled),
    });

    document.querySelector<HTMLButtonElement>("[data-rbac-save-role]")?.addEventListener("click", () => {
      const editor = document.querySelector<HTMLElement>("[data-rbac-editor]");
      if (!editor) return;
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
          selection: normalizeRoleSelection(matrixApi.getSelection()),
          updatedAt: new Date().toISOString(),
        },
        `角色「${name}」功能权限已保存`,
      );
      refreshUserSessionContext();
      location.hash = `#/permissions/roles/edit/${encodeURIComponent(id)}`;
    });
  }

  document.querySelectorAll<HTMLSelectElement>(".rbac-staff-store-mode").forEach((sel) => {
    sel.addEventListener("change", () => {
      const employeeId = sel.getAttribute("data-employee");
      if (!employeeId) return;
      const picks = document.querySelector<HTMLElement>(
        `.rbac-staff-store-picks[data-employee="${employeeId}"]`,
      );
      if (picks) picks.classList.toggle("hidden", sel.value === "all");
    });
  });

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

      const layoutStoreEl = document.querySelector<HTMLInputElement>(
        `.rbac-staff-layout-store[data-employee="${s.employeeId}"]`,
      );
      let storeAccess: StaffStoreAccess;
      if (layoutStoreEl?.value) {
        storeAccess = { mode: "stores", ids: [layoutStoreEl.value] };
      } else {
        const modeEl = document.querySelector<HTMLSelectElement>(
          `.rbac-staff-store-mode[data-employee="${s.employeeId}"]`,
        );
        const mode = modeEl?.value === "all" ? "all" : "stores";
        storeAccess = { mode: "all", ids: [] };
        if (mode === "stores") {
          const storeIds: string[] = [];
          document
            .querySelectorAll<HTMLInputElement>(
              `.rbac-staff-store-cb[data-employee="${s.employeeId}"]:checked`,
            )
            .forEach((cb) => {
              if (cb.value) storeIds.push(cb.value);
            });
          storeAccess = { mode: "stores", ids: storeIds.length ? storeIds : s.storeAccess.ids };
        }
      }

      return { ...s, roleIds, storeAccess };
    });
    updateStaffAssignments(next);
    next.forEach((s) => refreshSessionIfCurrentEmployee(s.employeeId));
    alert("员工授权已保存（本地演示数据）。若修改了当前登录账号，请刷新页面或重新登录以同步顶栏门店选项。");
  });
}
