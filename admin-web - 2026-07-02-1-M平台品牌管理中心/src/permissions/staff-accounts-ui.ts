import type { StaffLoginAccount } from "./staff-account-store-factory";
import {
  MERCHANT_RBAC_SCOPE,
  rbacHref,
  type RbacScopeConfig,
} from "./rbac-scope";

let activeScope: RbacScopeConfig = MERCHANT_RBAC_SCOPE;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isStaffAccountsPath(path: string): boolean {
  return path === "/permissions/staff-accounts";
}

function renderAccountRow(account: StaffLoginAccount, roleNames: string): string {
  return `<tr class="border-t border-border" data-staff-account-row="${escapeHtml(account.id)}">
    <td class="px-4 py-3 font-medium text-card-foreground">${escapeHtml(account.employeeName)}</td>
    <td class="px-4 py-3 font-mono text-xs text-muted-foreground">${escapeHtml(account.employeeId)}</td>
    <td class="px-4 py-3 font-mono text-sm">${escapeHtml(account.loginEmail)}</td>
    <td class="px-4 py-3 text-sm text-muted-foreground">${escapeHtml(roleNames || "—")}</td>
    <td class="px-4 py-3">
      <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        account.enabled
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-muted text-muted-foreground"
      }">${account.enabled ? "启用" : "停用"}</span>
    </td>
    <td class="px-4 py-3 text-right whitespace-nowrap">
      <button type="button" class="text-sm text-primary hover:underline" data-staff-acct-edit="${escapeHtml(account.id)}">编辑</button>
      <button type="button" class="ml-3 text-sm text-primary hover:underline" data-staff-acct-reset="${escapeHtml(account.id)}">重置密码</button>
      ${
        account.isSystem
          ? ""
          : `<button type="button" class="ml-3 text-sm text-destructive hover:underline" data-staff-acct-delete="${escapeHtml(account.id)}">删除</button>`
      }
    </td>
  </tr>`;
}

function renderEditorModal(account: StaffLoginAccount | null, employeeOptions: string): string {
  const isEdit = !!account;
  return `<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    data-staff-acct-modal
    role="dialog"
    aria-modal="true"
    aria-labelledby="staff-acct-modal-title"
  >
    <form class="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg" data-staff-acct-form>
      <h3 id="staff-acct-modal-title" class="text-lg font-semibold text-card-foreground">
        ${isEdit ? "编辑登录账号" : "新建登录账号"}
      </h3>
      <input type="hidden" name="id" value="${escapeHtml(account?.id ?? "")}" />
      <div class="mt-4 grid gap-4">
        ${
          isEdit
            ? `<div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">员工工号</span>
                <input type="text" class="mt-1 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-mono" value="${escapeHtml(account!.employeeId)}" readonly />
              </label>
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">员工姓名</span>
                <input name="employeeName" type="text" required class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value="${escapeHtml(account!.employeeName)}" />
              </label>
            </div>`
            : `<div class="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">快速选择员工（可选）</span>
                <select class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" data-staff-acct-employee-pick>
                  <option value="">手动输入新员工…</option>
                  ${employeeOptions}
                </select>
                <p class="mt-1 text-xs text-muted-foreground">选择未绑定账号的员工将自动填入工号与姓名；也可直接手动输入新建。</p>
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block text-sm">
                  <span class="font-medium text-card-foreground">员工工号</span>
                  <input name="employeeId" type="text" required pattern="[a-zA-Z0-9_-]+" placeholder="如 e004" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" data-staff-acct-employee-id />
                </label>
                <label class="block text-sm">
                  <span class="font-medium text-card-foreground">员工姓名</span>
                  <input name="employeeName" type="text" required placeholder="如 赵新人" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" data-staff-acct-employee-name />
                </label>
              </div>
            </div>`
        }
        <label class="block text-sm">
          <span class="font-medium text-card-foreground">登录邮箱</span>
          <input name="loginEmail" type="email" required autocomplete="off" placeholder="name@menusifu.cn" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" value="${escapeHtml(account?.loginEmail ?? "")}" />
          <p class="mt-1 text-xs text-muted-foreground">须为 Menusifu 企业邮箱（*@menusifu.cn / *@menusifu.com）</p>
        </label>
        ${
          isEdit
            ? `<label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="changePassword" class="rounded border-border" data-staff-acct-change-pw />
              <span>修改密码</span>
            </label>
            <div class="hidden grid gap-4 sm:grid-cols-2" data-staff-acct-pw-fields>
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">新密码</span>
                <input name="password" type="password" autocomplete="new-password" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">确认密码</span>
                <input name="confirmPassword" type="password" autocomplete="new-password" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
            </div>`
            : `<div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">登录密码</span>
                <input name="password" type="password" required autocomplete="new-password" minlength="6" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <label class="block text-sm">
                <span class="font-medium text-card-foreground">确认密码</span>
                <input name="confirmPassword" type="password" required autocomplete="new-password" minlength="6" class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
            </div>`
        }
        <label class="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" class="rounded border-border" ${account?.enabled !== false ? "checked" : ""} />
          <span>启用账号（停用后无法登录）</span>
        </label>
        <p class="hidden rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" data-staff-acct-error></p>
      </div>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted" data-staff-acct-cancel>取消</button>
        <button type="submit" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">保存</button>
      </div>
    </form>
  </div>`;
}

export function renderStaffAccountsPage(scope: RbacScopeConfig = MERCHANT_RBAC_SCOPE): string {
  activeScope = scope;
  const accountsApi = scope.staffAccounts;
  const accounts = accountsApi.listStaffLoginAccounts();
  const { roles, staff } = scope.rbac.getRbacSnapshot();
  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const rolesByEmployee = new Map(
    staff.map((s) => [
      s.employeeId,
      s.roleIds.map((id) => roleNameById.get(id) ?? id).join("、"),
    ]),
  );

  const boundEmployeeIds = new Set(accounts.map((a) => a.employeeId));
  const availableStaff = staff.filter((s) => !boundEmployeeIds.has(s.employeeId));
  const employeeOptions = availableStaff
    .map(
      (s) =>
        `<option value="${escapeHtml(s.employeeId)}" data-name="${escapeHtml(s.employeeName)}">${escapeHtml(s.employeeName)}（${escapeHtml(s.employeeId)}）</option>`,
    )
    .join("");

  const staffHref = rbacHref(scope, "/staff");
  const detailHtml = scope.staffAccountsDetail.replace(
    "员工授权",
    `<a href="${staffHref}" class="text-primary hover:underline">员工授权</a>`,
  );
  const logExtra = scope.isEnterpriseStaff
    ? ""
    : ` 登录日志见 <a href="#/log-management/login-logs" class="text-primary hover:underline">系统登录日志</a>。`;

  return `
    <div class="space-y-4" data-staff-accounts-page data-rbac-scope="${escapeHtml(scope.scope)}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          <p>${scope.staffAccountsIntro}</p>
          <p class="mt-2">${detailHtml}${logExtra}</p>
        </div>
        <button type="button" class="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" data-staff-acct-new>新建登录账号</button>
      </div>
      <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th class="px-4 py-2 font-medium">${scope.isEnterpriseStaff ? "企业级员工" : "员工"}</th>
              <th class="px-4 py-2 font-medium">工号</th>
              <th class="px-4 py-2 font-medium">登录邮箱</th>
              <th class="px-4 py-2 font-medium">已授权角色</th>
              <th class="px-4 py-2 font-medium">状态</th>
              <th class="px-4 py-2 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            ${accounts.length ? accounts.map((a) => renderAccountRow(a, rolesByEmployee.get(a.employeeId) ?? "")).join("") : '<tr><td colspan="6" class="px-4 py-8 text-center text-muted-foreground">暂无登录账号，点击右上角「新建登录账号」添加</td></tr>'}
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground">演示环境密码以明文存于浏览器 localStorage；生产须改为服务端哈希存储与强制改密策略。</p>
      <div data-staff-acct-modal-host></div>
      <template data-staff-acct-employee-options>${employeeOptions}</template>
    </div>`;
}

function closeModal(): void {
  document.querySelector("[data-staff-acct-modal]")?.remove();
}

function openEditorModal(accountId: string | null): void {
  const host = document.querySelector<HTMLElement>("[data-staff-acct-modal-host]");
  if (!host) return;
  const accountsApi = activeScope.staffAccounts;
  const account = accountId ? (accountsApi.getStaffLoginAccountById(accountId) ?? null) : null;
  const optionsTpl = document.querySelector<HTMLTemplateElement>("[data-staff-acct-employee-options]");
  const employeeOptions = optionsTpl?.innerHTML ?? "";
  host.innerHTML = renderEditorModal(account, employeeOptions);
  bindModal();
}

function bindModal(): void {
  const modal = document.querySelector<HTMLElement>("[data-staff-acct-modal]");
  const form = document.querySelector<HTMLFormElement>("[data-staff-acct-form]");
  if (!modal || !form) return;

  const accountsApi = activeScope.staffAccounts;
  const { ensureStaffRecord } = activeScope.rbac;

  const errorEl = form.querySelector<HTMLElement>("[data-staff-acct-error]");
  const showError = (msg: string) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.toggle("hidden", !msg);
  };

  form.querySelector("[data-staff-acct-cancel]")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const employeePick = form.querySelector<HTMLSelectElement>("[data-staff-acct-employee-pick]");
  const employeeIdInput = form.querySelector<HTMLInputElement>("[data-staff-acct-employee-id]");
  const employeeNameInput = form.querySelector<HTMLInputElement>("[data-staff-acct-employee-name]");

  employeePick?.addEventListener("change", () => {
    const opt = employeePick.selectedOptions[0];
    if (!employeeIdInput || !employeeNameInput) return;
    if (!employeePick.value) {
      employeeIdInput.readOnly = false;
      employeeNameInput.readOnly = false;
      employeeIdInput.classList.remove("bg-muted/40");
      employeeNameInput.classList.remove("bg-muted/40");
      return;
    }
    employeeIdInput.value = employeePick.value;
    employeeNameInput.value = opt?.getAttribute("data-name") ?? "";
    employeeIdInput.readOnly = true;
    employeeNameInput.readOnly = true;
    employeeIdInput.classList.add("bg-muted/40");
    employeeNameInput.classList.add("bg-muted/40");
  });

  const changePw = form.querySelector<HTMLInputElement>("[data-staff-acct-change-pw]");
  const pwFields = form.querySelector<HTMLElement>("[data-staff-acct-pw-fields]");
  changePw?.addEventListener("change", () => {
    pwFields?.classList.toggle("hidden", !changePw.checked);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showError("");
    const id = (form.querySelector<HTMLInputElement>('input[name="id"]')?.value ?? "").trim();
    const employeeId = (
      form.querySelector<HTMLInputElement>("[data-staff-acct-employee-id]")?.value ??
      form.querySelector<HTMLInputElement>('input[name="employeeId"]')?.value ??
      ""
    ).trim();
    const employeeName = (form.querySelector<HTMLInputElement>('[name="employeeName"]')?.value ?? "").trim();
    const loginEmail = (form.querySelector<HTMLInputElement>('input[name="loginEmail"]')?.value ?? "").trim();
    const password = form.querySelector<HTMLInputElement>('input[name="password"]')?.value ?? "";
    const confirmPassword = form.querySelector<HTMLInputElement>('input[name="confirmPassword"]')?.value ?? "";
    const enabled = !!form.querySelector<HTMLInputElement>('input[name="enabled"]')?.checked;

    try {
      if (id) {
        const changePassword = !!changePw?.checked;
        if (changePassword) {
          if (!password) {
            showError("请填写新密码");
            return;
          }
          if (password.length < 6) {
            showError("密码至少 6 位");
            return;
          }
          if (password !== confirmPassword) {
            showError("两次输入的密码不一致");
            return;
          }
        }
        accountsApi.updateStaffLoginAccount(id, {
          employeeName,
          loginEmail,
          enabled,
          ...(changePassword ? { password } : {}),
        });
      } else {
        if (!employeeId) {
          showError("请填写员工工号");
          return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(employeeId)) {
          showError("工号仅支持字母、数字、下划线与连字符");
          return;
        }
        if (password !== confirmPassword) {
          showError("两次输入的密码不一致");
          return;
        }
        ensureStaffRecord(employeeId, employeeName);
        accountsApi.createStaffLoginAccount({
          employeeId,
          employeeName,
          loginEmail,
          password,
          enabled,
        });
      }
      closeModal();
      location.reload();
    } catch (err) {
      showError(err instanceof Error ? err.message : "保存失败");
    }
  });
}

export function bindStaffAccountsPage(scope: RbacScopeConfig = MERCHANT_RBAC_SCOPE): void {
  activeScope = scope;
  const accountsApi = scope.staffAccounts;

  const page = document.querySelector("[data-staff-accounts-page]");
  if (!page || page.getAttribute("data-bound") === "1") return;
  page.setAttribute("data-bound", "1");

  page.querySelector("[data-staff-acct-new]")?.addEventListener("click", () => openEditorModal(null));

  page.querySelectorAll<HTMLButtonElement>("[data-staff-acct-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-staff-acct-edit");
      if (id) openEditorModal(id);
    });
  });

  page.querySelectorAll<HTMLButtonElement>("[data-staff-acct-reset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-staff-acct-reset");
      if (!id) return;
      const pw = prompt("请输入新密码（至少 6 位）：");
      if (!pw) return;
      if (pw.length < 6) {
        alert("密码至少 6 位");
        return;
      }
      try {
        accountsApi.updateStaffLoginAccount(id, { password: pw });
        alert("密码已重置");
      } catch (err) {
        alert(err instanceof Error ? err.message : "重置失败");
      }
    });
  });

  page.querySelectorAll<HTMLButtonElement>("[data-staff-acct-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-staff-acct-delete");
      if (!id) return;
      if (!confirm("确定删除该登录账号？删除后员工将无法以此邮箱登录。")) return;
      if (accountsApi.deleteStaffLoginAccount(id)) location.reload();
      else alert("无法删除：账号不存在或为系统预置账号。");
    });
  });
}
