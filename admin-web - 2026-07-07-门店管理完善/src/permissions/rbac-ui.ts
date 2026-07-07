import { refreshSessionIfCurrentEmployee, refreshUserSessionContext, getUserSessionContext } from "../auth/session-permissions";
import { resolveChainDataPerspective } from "../auth/merchant-scope-context";
import {
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
  getStaffBrandPickerOptions,
  getStaffRegionPickerOptions,
  getStaffStorePickerOptions,
  type StaffStoreAccess,
  type StaffStoreAccessMode,
} from "./store-access";
import {
  findDemoScopeStoreLabel,
  migrateLegacyBrandId,
  migrateLegacyRegionId,
  migrateLegacyStoreId,
} from "./m-platform-store-scope";
import type { RbacRole, StaffAssignment } from "./rbac-types";
import { resolveStaffStoreAccessOnSave } from "./rbac-store-factory";
import { formatGrantChainSummary } from "./rbac-audit";
import {
  filterGrantableRoles,
  filterPickerOptionsByDelegableStores,
  filterRegionOptionsByDelegableStores,
  isStaffManageableInGrantContext,
  isStaffRowGrantEditable,
  mergePreservedStaffRoleIds,
  resolveStaffGrantUiContext,
  validateStaffRoleGrant,
  type StaffGrantUiContext,
} from "./rbac-grant";
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
              ${
                r.defaultStoreAccess
                  ? `<p class="mt-2 text-xs text-muted-foreground">默认数据范围：${escapeHtml(formatStaffStoreAccessLabel(r.defaultStoreAccess))}</p>`
                  : ""
              }
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

function renderStaffAccessCheckboxPicks(
  employeeId: string,
  panelClass: string,
  checkboxClass: string,
  options: { value: string; labelZh: string }[],
  selectedIds: string[],
  normalizeId: (id: string) => string,
  hidden: boolean,
): string {
  return `<div class="${panelClass} flex flex-wrap gap-2 ${hidden ? "hidden" : ""}" data-employee="${escapeHtml(employeeId)}">
      ${options
        .map((o) => {
          const checked = selectedIds.map(normalizeId).includes(normalizeId(o.value));
          return `<label class="inline-flex items-center gap-1 text-xs">
            <input type="checkbox" class="${checkboxClass}" data-employee="${escapeHtml(employeeId)}" value="${escapeHtml(o.value)}" ${checked ? "checked" : ""} />
            ${escapeHtml(o.labelZh)}
          </label>`;
        })
        .join("")}
    </div>`;
}

function renderStaffStoreAccessCell(
  s: { employeeId: string; storeAccess: StaffStoreAccess },
  scope: RbacScopeConfig,
  grantCtx: StaffGrantUiContext,
  editable: boolean,
): string {
  if (!editable) {
    return `<div class="space-y-1">
      <p class="text-sm text-card-foreground">${escapeHtml(formatStaffStoreAccessLabel(s.storeAccess))}</p>
      <p class="text-xs text-muted-foreground">超出当前视角可下放范围，仅展示</p>
    </div>`;
  }

  const allLabel = scope.isEnterpriseStaff ? "全企业" : "全部门店";
  const brandsLabel = scope.isEnterpriseStaff ? "指定品牌" : "指定品牌";
  const regionsLabel = scope.isEnterpriseStaff ? "指定区域" : "指定区域";
  const storesLabel = scope.isEnterpriseStaff ? "指定范围" : "指定门店";

  if (!scope.isEnterpriseStaff && isStoreLayoutPreset()) {
    const layoutStoreId = getLayoutContextStoreId();
    const layoutStoreLabel = findDemoScopeStoreLabel(layoutStoreId);
    return `<div class="space-y-1">
      <p class="text-sm font-medium text-card-foreground">${escapeHtml(layoutStoreLabel)}</p>
      <p class="text-xs text-muted-foreground">门店版仅单店经营，默认可访问当前模拟门店</p>
      <input type="hidden" class="rbac-staff-store-mode" data-employee="${escapeHtml(s.employeeId)}" value="stores" />
      <input type="hidden" class="rbac-staff-layout-store" data-employee="${escapeHtml(s.employeeId)}" value="${escapeHtml(layoutStoreId)}" />
    </div>`;
  }

  const grantorAccess = grantCtx.grantorAccess;
  const allowedModes = grantCtx.allowedStoreAccessModes;
  let brandOpts = getStaffBrandPickerOptions(grantorAccess);
  let regionOpts = getStaffRegionPickerOptions(grantorAccess);
  let storeOpts = getStaffStorePickerOptions(grantorAccess);

  if (grantCtx.tier === "brand" || grantCtx.tier === "store") {
    storeOpts = filterPickerOptionsByDelegableStores(storeOpts, grantCtx.delegableStoreIds);
    regionOpts = filterRegionOptionsByDelegableStores(regionOpts, grantCtx.delegableStoreIds);
    brandOpts = [];
  }

  let mode = s.storeAccess.mode;
  if (!allowedModes.includes(mode)) {
    mode = allowedModes.includes("stores") ? "stores" : allowedModes[0] ?? "stores";
  }

  const modeOptions = (
    [
      { value: "all" as const, label: allLabel },
      { value: "brands" as const, label: brandsLabel },
      { value: "regions" as const, label: regionsLabel },
      { value: "stores" as const, label: storesLabel },
    ] as const
  ).filter((o) => allowedModes.includes(o.value));

  return `<div class="space-y-2">
    <select class="rbac-staff-store-mode h-9 rounded-md border border-border bg-background px-2 text-sm" data-employee="${escapeHtml(s.employeeId)}">
      ${modeOptions
        .map(
          (o) =>
            `<option value="${o.value}" ${mode === o.value ? "selected" : ""}>${escapeHtml(o.label)}</option>`,
        )
        .join("")}
    </select>
    ${renderStaffAccessCheckboxPicks(
      s.employeeId,
      "rbac-staff-brand-picks",
      "rbac-staff-brand-cb",
      brandOpts,
      s.storeAccess.ids,
      migrateLegacyBrandId,
      mode !== "brands",
    )}
    ${renderStaffAccessCheckboxPicks(
      s.employeeId,
      "rbac-staff-region-picks",
      "rbac-staff-region-cb",
      regionOpts,
      s.storeAccess.ids,
      migrateLegacyRegionId,
      mode !== "regions",
    )}
    ${renderStaffAccessCheckboxPicks(
      s.employeeId,
      "rbac-staff-store-picks",
      "rbac-staff-store-cb",
      storeOpts,
      s.storeAccess.ids,
      migrateLegacyStoreId,
      mode !== "stores",
    )}
    <p class="text-xs text-muted-foreground">${escapeHtml(formatStaffStoreAccessLabel(s.storeAccess))}</p>
  </div>`;
}

function renderStaffPage(scope: RbacScopeConfig): string {
  const { roles, staff } = scope.rbac.getRbacSnapshot();
  const staffAccountsHref = rbacHref(scope, "/staff-accounts");
  const grantCtx = resolveStaffGrantUiContext(scope.isEnterpriseStaff);
  const grantableRoles = filterGrantableRoles(roles, grantCtx);
  const grantableRoleIds = new Set(grantableRoles.map((r) => r.id));
  const visibleStaff = staff.filter((s) => isStaffManageableInGrantContext(s, grantCtx));
  const hiddenStaffCount = staff.length - visibleStaff.length;

  const storeLayoutHint =
    !scope.isEnterpriseStaff && isStoreLayoutPreset()
      ? `<p class="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">当前为<strong class="text-card-foreground">门店版</strong>模拟：全员默认可访问门店「${escapeHtml(findDemoScopeStoreLabel(getLayoutContextStoreId()))}」。切换顶栏「连锁版」后可配置多店数据范围。</p>`
      : "";
  const grantHint = grantCtx.hint
    ? `<p class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">${escapeHtml(grantCtx.hint)}</p>`
    : "";
  const hiddenHint =
    hiddenStaffCount > 0
      ? `<p class="text-xs text-muted-foreground">另有 ${hiddenStaffCount} 名员工不在当前视角可管理范围内，未列出。</p>`
      : "";

  return `
    <div class="space-y-4" data-rbac-scope="${escapeHtml(scope.scope)}">
      ${storeLayoutHint}
      ${grantHint}
      <p class="text-sm text-muted-foreground">${scope.staffIntro.replace(
        "员工登录账号",
        `<a href="${staffAccountsHref}" class="text-primary hover:underline">员工登录账号</a>`,
      )}</p>
      ${hiddenHint}
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
            ${visibleStaff
              .map((s) => {
                const editable = isStaffRowGrantEditable(s, grantCtx);
                const roleCells = grantableRoles
                  .map((r) => {
                    const checked = s.roleIds.includes(r.id);
                    return `<label class="inline-flex items-center gap-1.5 text-sm">
                        <input type="checkbox" class="rbac-staff-role-cb" data-employee="${escapeHtml(s.employeeId)}" data-role="${escapeHtml(r.id)}" ${checked ? "checked" : ""} ${editable ? "" : "disabled"} />
                        ${escapeHtml(r.name)}
                      </label>`;
                  })
                  .join("");
                const preservedRoles = s.roleIds.filter((id) => !grantableRoleIds.has(id));
                const preservedHint =
                  preservedRoles.length > 0
                    ? `<p class="mt-1 text-xs text-muted-foreground">保留角色：${escapeHtml(
                        preservedRoles
                          .map((id) => roles.find((r) => r.id === id)?.name ?? id)
                          .join("、"),
                      )}（当前视角不可修改）</p>`
                    : "";
                return `<tr class="border-t border-border" data-staff-row="${escapeHtml(s.employeeId)}" data-staff-editable="${editable ? "1" : "0"}">
              <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(s.employeeName)}<span class="ml-2 font-mono text-xs text-muted-foreground">${escapeHtml(s.employeeId)}</span></td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-3">${roleCells}</div>
                ${preservedHint}
              </td>
              <td class="px-4 py-3">${renderStaffStoreAccessCell(s, scope, grantCtx, editable)}</td>
            </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <button type="button" data-rbac-save-staff class="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存员工授权</button>
    </div>`;
}

function renderChangelogPage(scope: RbacScopeConfig): string {
  const { changelog } = scope.rbac.getRbacSnapshot();
  const hasGrantChain = changelog.some((e) => e.grantChain);
  return `
    <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden" data-rbac-scope="${escapeHtml(scope.scope)}">
      <p class="border-b border-border px-4 py-3 text-xs text-muted-foreground">员工授权变更将记录授权人、被授权人、数据视角与授权天花板，便于追溯分级放权链路。</p>
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th class="px-4 py-2 font-medium">时间</th>
            <th class="px-4 py-2 font-medium">操作人</th>
            <th class="px-4 py-2 font-medium">动作</th>
            ${hasGrantChain ? '<th class="px-4 py-2 font-medium">授权链</th>' : ""}
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
            ${
              hasGrantChain
                ? `<td class="px-4 py-3 text-xs text-muted-foreground">${
                    e.grantChain
                      ? escapeHtml(
                          [
                            e.grantChain.grantorName ?? e.grantChain.grantorEmployeeId,
                            e.grantChain.granteeName ?? e.grantChain.granteeEmployeeId,
                          ]
                            .filter(Boolean)
                            .join(" → "),
                        )
                      : "—"
                  }</td>`
                : ""
            }
            <td class="px-4 py-3 text-card-foreground">${escapeHtml(formatGrantChainSummary(e))}</td>
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
      getIndex: () => scope.rbac.getRbacPresetIndex(),
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
          defaultStoreAccess: existing?.defaultStoreAccess,
          maxPerspective: existing?.maxPerspective,
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
      const mode = sel.value;
      const panels: { selector: string; activeMode: StaffStoreAccessMode }[] = [
        { selector: ".rbac-staff-brand-picks", activeMode: "brands" },
        { selector: ".rbac-staff-region-picks", activeMode: "regions" },
        { selector: ".rbac-staff-store-picks", activeMode: "stores" },
      ];
      for (const { selector, activeMode } of panels) {
        const picks = document.querySelector<HTMLElement>(
          `${selector}[data-employee="${employeeId}"]`,
        );
        if (picks) picks.classList.toggle("hidden", mode !== activeMode);
      }
    });
  });

  document.querySelector<HTMLButtonElement>("[data-rbac-save-staff]")?.addEventListener("click", () => {
    const { staff: prev, roles } = scope.rbac.getRbacSnapshot();
    const grantCtx = resolveStaffGrantUiContext(scope.isEnterpriseStaff);
    const grantableRoles = filterGrantableRoles(roles, grantCtx);
    const grantableRoleIds = new Set(grantableRoles.map((r) => r.id));
    const grantorAccess: StaffStoreAccess = grantCtx.grantorAccess;

    const next: StaffAssignment[] = [];

    for (const s of prev) {
      const row = document.querySelector<HTMLElement>(`[data-staff-row="${s.employeeId}"]`);
      const editable = row?.getAttribute("data-staff-editable") === "1";
      if (!editable) {
        next.push(s);
        continue;
      }

      const boxes = document.querySelectorAll<HTMLInputElement>(
        `.rbac-staff-role-cb[data-employee="${s.employeeId}"]:not(:disabled)`,
      );
      const checkedGrantableRoleIds: string[] = [];
      boxes.forEach((cb) => {
        if (cb.checked) {
          const r = cb.getAttribute("data-role");
          if (r) checkedGrantableRoleIds.push(r);
        }
      });
      const roleIds = mergePreservedStaffRoleIds(
        s.roleIds,
        checkedGrantableRoleIds,
        grantableRoleIds,
      );

      const roleValidation = validateStaffRoleGrant(roleIds, roles, grantCtx);
      if (!roleValidation.ok) {
        alert(`员工「${s.employeeName}」：${roleValidation.reason}`);
        return;
      }

      const layoutStoreEl = document.querySelector<HTMLInputElement>(
        `.rbac-staff-layout-store[data-employee="${s.employeeId}"]`,
      );
      let explicitAccess: StaffStoreAccess;
      if (layoutStoreEl?.value) {
        explicitAccess = { mode: "stores", ids: [layoutStoreEl.value] };
      } else {
        const modeEl = document.querySelector<HTMLSelectElement>(
          `.rbac-staff-store-mode[data-employee="${s.employeeId}"]`,
        );
        const modeRaw = modeEl?.value ?? "all";
        if (modeRaw === "all") {
          explicitAccess = { mode: "all", ids: [] };
        } else if (modeRaw === "brands" || modeRaw === "regions" || modeRaw === "stores") {
          const cbClass =
            modeRaw === "brands"
              ? "rbac-staff-brand-cb"
              : modeRaw === "regions"
                ? "rbac-staff-region-cb"
                : "rbac-staff-store-cb";
          const ids: string[] = [];
          document
            .querySelectorAll<HTMLInputElement>(
              `.${cbClass}[data-employee="${s.employeeId}"]:checked`,
            )
            .forEach((cb) => {
              if (cb.value) ids.push(cb.value);
            });
          explicitAccess = { mode: modeRaw, ids: ids.length ? ids : s.storeAccess.ids };
        } else {
          explicitAccess = { mode: "all", ids: [] };
        }
      }

      const storeAccess = resolveStaffStoreAccessOnSave(s, roleIds, explicitAccess, roles);
      next.push({ ...s, roleIds, storeAccess });
    }

    const session = getUserSessionContext();
    const result = scope.rbac.updateStaffAssignments(next, {
      grantorAccess: scope.isEnterpriseStaff ? undefined : grantorAccess,
      grantorEmployeeId: session?.employeeId,
      grantorName: session?.employeeName,
      perspective: scope.isEnterpriseStaff ? undefined : resolveChainDataPerspective(),
    });
    if (!result.ok) {
      alert(result.message);
      return;
    }
    if (!scope.isEnterpriseStaff) {
      next.forEach((s) => refreshSessionIfCurrentEmployee(s.employeeId));
    }
    alert(scope.saveStaffSuccessMessage);
  });
}
