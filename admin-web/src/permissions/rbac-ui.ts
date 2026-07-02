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
import type { RbacRole } from "./rbac-types";
import {
  MERCHANT_RBAC_SCOPE,
  rbacHref,
  stripRbacRoutePrefix,
  isMerchantPermissionsPath,
  type RbacScopeConfig,
} from "./rbac-scope";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isPermissionsRbacPath(path: string): boolean {
  return isMerchantPermissionsPath(path);
}

export function renderPermissionsRbacPage(
  path: string,
  scope: RbacScopeConfig = MERCHANT_RBAC_SCOPE,
): string {
  const sub = stripRbacRoutePrefix(path, scope);
  if (sub === "/overview" || sub === "") return renderOverviewPage(scope);
  if (sub === "/roles") return renderRolesListPage(scope);
  if (sub === "/roles/new" || sub.startsWith("/roles/edit/")) {
    return renderRoleEditorPage(path, scope);
  }
  if (sub === "/staff") return renderStaffPage(scope);
  if (sub === "/change-log") return renderChangelogPage(scope);
  return renderOverviewPage(scope);
}

function renderOverviewPage(scope: RbacScopeConfig): string {
  const { roles, staff } = scope.rbac.getRbacSnapshot();
  const groups = scope.rbac.getModuleGroups();
  const index = scope.rbac.getPermissionIndex();
  const staffAccountsHref = rbacHref(scope, "/staff-accounts");
  return `
    <div class="space-y-6" data-rbac-scope="${escapeHtml(scope.scope)}">
      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-card-foreground">权限总览</h2>
        <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
          ${scope.overviewIntro.replace(
            "员工登录账号",
            `<a href="${staffAccountsHref}" class="text-primary hover:underline">员工登录账号</a>`,
          )}
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
            <dt class="text-muted-foreground">${scope.isEnterpriseStaff ? "已授权企业级员工" : "已授权员工"}</dt>
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
                const s = scope.rbac.countRoleStats(r);
                return `<tr class="border-t border-border">
                  <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(r.name)}${r.isSystem ? '<span class="ml-2 text-xs text-muted-foreground">系统</span>' : ""}</td>
                  <td class="px-4 py-3 tabular-nums">${s.enabled} / ${s.total}</td>
                  <td class="px-4 py-3 tabular-nums">${s.enabledL1}</td>
                  <td class="px-4 py-3 text-right">
                    <a href="${rbacHref(scope, `/roles/edit/${encodeURIComponent(r.id)}`)}" class="text-primary hover:underline">编辑矩阵</a>
                  </td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderRolesListPage(scope: RbacScopeConfig): string {
  const { roles } = scope.rbac.getRbacSnapshot();
  const staffAccountsHref = rbacHref(scope, "/staff-accounts");
  return `
    <div class="space-y-4" data-rbac-scope="${escapeHtml(scope.scope)}">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted-foreground">${scope.rolesIntro.replace(
          "员工登录账号",
          `<a href="${staffAccountsHref}" class="text-primary hover:underline">员工登录账号</a>`,
        )}</p>
        <a href="${rbacHref(scope, "/roles/new")}" class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">新建角色</a>
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${roles
          .map((r) => {
            const s = scope.rbac.countRoleStats(r);
            return `<article class="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-card-foreground">${escapeHtml(r.name)}</h3>
                ${r.isSystem ? '<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">系统</span>' : ""}
              </div>
              <p class="mt-2 text-sm text-muted-foreground line-clamp-2">${escapeHtml(r.description || "—")}</p>
              <p class="mt-3 text-xs text-muted-foreground">已启用 ${s.enabled} 项 · 一级导航 ${s.enabledL1} 个</p>
              <div class="mt-4 flex gap-2">
                <a href="${rbacHref(scope, `/roles/edit/${encodeURIComponent(r.id)}`)}" class="text-sm font-medium text-primary hover:underline">编辑权限</a>
                ${r.isSystem ? "" : `<button type="button" class="text-sm text-destructive hover:underline" data-rbac-delete-role="${escapeHtml(r.id)}">删除</button>`}
              </div>
            </article>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderRoleEditorPage(path: string, scope: RbacScopeConfig): string {
  const sub = stripRbacRoutePrefix(path, scope);
  const isNew = sub === "/roles/new";
  const roleId = isNew ? "" : decodeURIComponent(sub.replace("/roles/edit/", ""));
  const existing = roleId ? scope.rbac.getRoleById(roleId) : undefined;
  const role: RbacRole = existing ?? {
    id: "",
    name: "",
    description: "",
    isSystem: false,
    selection: {},
    updatedAt: new Date().toISOString(),
  };

  const index = scope.rbac.getRbacPresetIndex();
  const selection = scope.rbac.normalizeRoleSelection(role.selection);
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
  const enabledL1 = scope.rbac.countRoleStats(role).enabledL1;

  return `
    <div class="space-y-4" data-rbac-editor data-rbac-scope="${escapeHtml(scope.scope)}">
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
        data-rbac-route-prefix="${escapeHtml(scope.routePrefix)}"
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
        <a href="${rbacHref(scope, "/roles")}" class="rounded-lg border border-border px-5 py-2 text-sm hover:bg-muted">取消</a>
      </div>
    </div>`;
}

function renderStaffStoreAccessCell(
  s: { employeeId: string; storeAccess: StaffStoreAccess },
  scope: RbacScopeConfig,
): string {
  const allLabel = scope.isEnterpriseStaff ? "全企业" : "全部门店";
  const storesLabel = scope.isEnterpriseStaff ? "指定范围" : "指定门店";

  if (!scope.isEnterpriseStaff && isStoreLayoutPreset()) {
    const layoutStoreId = getLayoutContextStoreId();
    const layoutStoreLabel =
      DEMO_SCOPE_STORES.find((o) => o.value === layoutStoreId)?.labelZh ?? layoutStoreId;
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
      <option value="all" ${s.storeAccess.mode === "all" ? "selected" : ""}>${allLabel}</option>
      <option value="stores" ${s.storeAccess.mode === "stores" ? "selected" : ""}>${storesLabel}</option>
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

function renderStaffPage(scope: RbacScopeConfig): string {
  const { roles, staff } = scope.rbac.getRbacSnapshot();
  const staffAccountsHref = rbacHref(scope, "/staff-accounts");
  const storeLayoutHint =
    !scope.isEnterpriseStaff && isStoreLayoutPreset()
      ? `<p class="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">当前为<strong class="text-card-foreground">门店版</strong>模拟：全员默认可访问门店「${escapeHtml(DEMO_SCOPE_STORES.find((o) => o.value === getLayoutContextStoreId())?.labelZh ?? getLayoutContextStoreId())}」。切换顶栏「连锁版」后可配置多店数据范围。</p>`
      : "";
  return `
    <div class="space-y-4" data-rbac-scope="${escapeHtml(scope.scope)}">
      ${storeLayoutHint}
      <p class="text-sm text-muted-foreground">${scope.staffIntro.replace(
        "员工登录账号",
        `<a href="${staffAccountsHref}" class="text-primary hover:underline">员工登录账号</a>`,
      )}</p>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">${scope.isEnterpriseStaff ? "企业级员工" : "员工"}</th>
              <th class="px-4 py-2 font-medium">角色（功能权限）</th>
              <th class="px-4 py-2 font-medium">${escapeHtml(scope.staffDataScopeColumn)}</th>
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
              <td class="px-4 py-3">${renderStaffStoreAccessCell(s, scope)}</td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <button type="button" data-rbac-save-staff class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存员工授权</button>
    </div>`;
}

function renderChangelogPage(scope: RbacScopeConfig): string {
  const { changelog } = scope.rbac.getRbacSnapshot();
  return `
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden" data-rbac-scope="${escapeHtml(scope.scope)}">
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

export function bindPermissionsRbac(scope: RbacScopeConfig = MERCHANT_RBAC_SCOPE): void {
  const routePrefix = scope.routePrefix;

  document.querySelectorAll<HTMLButtonElement>("[data-rbac-delete-role]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-rbac-delete-role");
      if (!id) return;
      if (!confirm("确定删除该角色？已绑定员工的角色无法删除。")) return;
      if (scope.rbac.deleteRole(id)) location.hash = `#${routePrefix}/roles`;
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
        scope.rbac.cascadeRbacEnableSelection(selection, key, enabled),
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
      const existing = scope.rbac.getRoleById(id);
      if (isNew && existing) {
        alert("角色 ID 已存在。");
        return;
      }
      scope.rbac.upsertRole(
        {
          id,
          name,
          description: description.trim(),
          isSystem: existing?.isSystem ?? false,
          selection: scope.rbac.normalizeRoleSelection(matrixApi.getSelection()),
          updatedAt: new Date().toISOString(),
        },
        `角色「${name}」功能权限已保存`,
      );
      if (!scope.isEnterpriseStaff) refreshUserSessionContext();
      location.hash = `#${routePrefix}/roles/edit/${encodeURIComponent(id)}`;
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
    const { staff: prev } = scope.rbac.getRbacSnapshot();
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
    scope.rbac.updateStaffAssignments(next);
    if (!scope.isEnterpriseStaff) {
      next.forEach((s) => refreshSessionIfCurrentEmployee(s.employeeId));
    }
    alert(scope.saveStaffSuccessMessage);
  });
}
