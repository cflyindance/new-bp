/**
 * 财务中心 · 收银记录与审计（方案 A：滑层一级 + 业务查询页）。
 * seq 449 付款记录；seq 450 钱箱登入退出记录。
 */

export const FINANCE_REGISTER_AUDIT_PAYMENTS_PATH = "/finance/register-audit/payments";
export const FINANCE_REGISTER_AUDIT_CASH_DRAWER_PATH = "/finance/register-audit/cash-drawer";
export const FINANCE_REGISTER_AUDIT_PREFIX = "/finance/register-audit";

export const FINANCE_REGISTER_AUDIT_PAGES = [
  {
    seq: 449,
    path: FINANCE_REGISTER_AUDIT_PAYMENTS_PATH,
    title: "付款记录",
    titleEn: "Payment records",
    sceneDesc:
      "查看各收银终端（POS）的付款与退款流水，用于对账与稽核。与「收支流水」的全店资金视角不同，本条以收银机/班次为审计粒度。",
  },
  {
    seq: 450,
    path: FINANCE_REGISTER_AUDIT_CASH_DRAWER_PATH,
    title: "钱箱登入退出记录",
    titleEn: "Cash drawer session log",
    sceneDesc:
      "查看收银员开启、关闭钱箱（登入/退出）的操作记录，用于现金内控审计。钱箱容差规则见设置 · 钱箱与现金平账。",
  },
] as const;

type PaymentRecord = {
  id: string;
  payee: string;
  date: string;
  amount: number;
  operator: string;
  drawer: string;
  voided: boolean;
};

type CashDrawerSessionRecord = {
  id: string;
  name: string;
  drawer: string;
  loginAmount: number;
  logoutAmount: number | null;
  from: string;
  to: string | null;
  /** 登入/登出金额不一致时的说明备注 */
  amountMismatchRemark: string | null;
};

const MOCK_EMPLOYEES = ["张三", "李四", "王五"];
const MOCK_DRAWERS = ["1号钱箱", "2号钱箱", "Bar"];

let paymentRecords: PaymentRecord[] = [
  {
    id: "p1",
    payee: "张三",
    date: "2026-06-03",
    amount: 128.5,
    operator: "李四",
    drawer: "1号钱箱",
    voided: false,
  },
];

let cashDrawerSessions: CashDrawerSessionRecord[] = [
  {
    id: "d1",
    name: "张三",
    drawer: "1号钱箱",
    loginAmount: 200,
    logoutAmount: null,
    from: "2026-06-03T09:00",
    to: null,
    amountMismatchRemark: null,
  },
];

type AuditFilterState = {
  dateFrom: string;
  dateTo: string;
  employee: string;
  showVoided: boolean;
};

const filterState: AuditFilterState = {
  dateFrom: new Date().toISOString().slice(0, 10),
  dateTo: new Date().toISOString().slice(0, 10),
  employee: "",
  showVoided: false,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(n: number): string {
  return n.toFixed(2);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isFinanceRegisterAuditPath(path: string): boolean {
  return path === FINANCE_REGISTER_AUDIT_PREFIX || path.startsWith(`${FINANCE_REGISTER_AUDIT_PREFIX}/`);
}

export function getActiveFinanceRegisterAuditSubPath(path: string): string {
  if (!isFinanceRegisterAuditPath(path)) return "";
  const sorted = [...FINANCE_REGISTER_AUDIT_PAGES].sort((a, b) => b.path.length - a.path.length);
  for (const page of sorted) {
    if (path === page.path || path.startsWith(`${page.path}/`)) return page.path;
  }
  return FINANCE_REGISTER_AUDIT_PAYMENTS_PATH;
}

export function findFinanceRegisterAuditTitle(
  path: string,
): { title: string; module: string } | null {
  if (!isFinanceRegisterAuditPath(path)) return null;
  const active = getActiveFinanceRegisterAuditSubPath(path);
  const page = FINANCE_REGISTER_AUDIT_PAGES.find((p) => p.path === active);
  return {
    title: page?.title ?? "收银记录与审计",
    module: "财务中心 · 收银记录与审计",
  };
}

function filterPayments(): PaymentRecord[] {
  return paymentRecords.filter((r) => {
    if (r.date < filterState.dateFrom || r.date > filterState.dateTo) return false;
    if (filterState.employee && r.payee !== filterState.employee) return false;
    if (!filterState.showVoided && r.voided) return false;
    return true;
  });
}

function filterCashDrawerSessions(): CashDrawerSessionRecord[] {
  return cashDrawerSessions.filter((r) => {
    const day = r.from.slice(0, 10);
    if (day < filterState.dateFrom || day > filterState.dateTo) return false;
    if (filterState.employee && r.name !== filterState.employee) return false;
    return true;
  });
}

function renderEmployeeOptions(selected: string, paymentsMode: boolean): string {
  const label = paymentsMode ? "根据支付员工筛选" : "按收银员筛选";
  const opts = [
    `<option value="">${escapeHtml(label)}</option>`,
    ...MOCK_EMPLOYEES.map(
      (e) =>
        `<option value="${escapeHtml(e)}"${e === selected ? " selected" : ""}>${escapeHtml(e)}</option>`,
    ),
  ];
  return opts.join("");
}

function renderPaymentsTable(rows: PaymentRecord[]): string {
  if (!rows.length) {
    return `<tr><td colspan="6" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无记录，可点击右上角「+」新增</td></tr>`;
  }
  return rows
    .map(
      (r) => `
    <tr class="border-b border-border/60 hover:bg-muted/30">
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.payee)}</td>
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.date)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${formatMoney(r.amount)}</td>
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.operator)}</td>
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.drawer)}</td>
      <td class="px-4 py-2.5 text-sm">${r.voided ? "是" : "—"}</td>
    </tr>`,
    )
    .join("");
}

function cashDrawerAmountsMismatch(loginAmount: number, logoutAmount: number | null): boolean {
  return logoutAmount != null && Math.abs(loginAmount - logoutAmount) > 0.001;
}

function renderCashDrawerTable(rows: CashDrawerSessionRecord[]): string {
  if (!rows.length) {
    return `<tr><td colspan="7" class="px-4 py-10 text-center text-sm text-muted-foreground">暂无记录，可点击右上角「+」新增</td></tr>`;
  }
  return rows
    .map(
      (r) => `
    <tr class="border-b border-border/60 hover:bg-muted/30">
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.name)}</td>
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.drawer)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${formatMoney(r.loginAmount)}</td>
      <td class="px-4 py-2.5 text-sm tabular-nums">${r.logoutAmount == null ? "—" : formatMoney(r.logoutAmount)}</td>
      <td class="px-4 py-2.5 text-sm">${escapeHtml(r.from.replace("T", " "))}</td>
      <td class="px-4 py-2.5 text-sm">${r.to ? escapeHtml(r.to.replace("T", " ")) : "—"}</td>
      <td class="max-w-[12rem] truncate px-4 py-2.5 text-sm" title="${escapeHtml(r.amountMismatchRemark ?? "")}">${r.amountMismatchRemark ? escapeHtml(r.amountMismatchRemark) : "—"}</td>
    </tr>`,
    )
    .join("");
}

function renderAddDialogShell(title: string, formBody: string, formMode: string): string {
  return `
    <div
      id="finance-register-audit-add-dialog"
      class="fixed inset-0 z-[10040] hidden items-center justify-center overflow-y-auto p-4"
      data-register-audit-add-overlay
      aria-hidden="true"
      role="presentation"
    >
      <button type="button" class="absolute inset-0 bg-black/40" data-register-audit-add-backdrop aria-label="关闭"></button>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-register-audit-add-dialog-title"
        class="relative z-10 my-auto w-full max-w-md rounded-xl border border-border bg-card p-0 shadow-xl"
      >
        <form class="flex flex-col" data-register-audit-add-form="${formMode}">
          <div class="border-b border-border px-5 py-4">
            <h2 id="finance-register-audit-add-dialog-title" class="text-base font-semibold text-foreground">${escapeHtml(title)}</h2>
          </div>
          <div class="space-y-3 px-5 py-4">${formBody}</div>
          <div class="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-register-audit-add-cancel>取消</button>
            <button type="submit" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">保存</button>
          </div>
        </form>
      </div>
    </div>`;
}

function renderAddDialog(activePath: string): string {
  const isPayments = activePath === FINANCE_REGISTER_AUDIT_PAYMENTS_PATH;
  const drawerOpts = MOCK_DRAWERS.map(
    (d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`,
  ).join("");
  const employeeOpts = MOCK_EMPLOYEES.map(
    (e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`,
  ).join("");

  if (isPayments) {
    return renderAddDialogShell(
      "新增付款记录",
      `
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">收款人</span>
            <select name="payee" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${employeeOpts}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">日期</span>
            <input name="date" type="date" required value="${todayIsoDate()}" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">金额</span>
            <input name="amount" type="number" step="0.01" min="0" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">操作人员</span>
            <select name="operator" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${employeeOpts}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">钱箱</span>
            <select name="drawer" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${drawerOpts}</select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input name="voided" type="checkbox" class="size-4 rounded border-input" />
            <span>已作废</span>
          </label>`,
      "payments",
    );
  }

  return renderAddDialogShell(
    "新增钱箱登入退出记录",
    `
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">姓名</span>
            <select name="name" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${employeeOpts}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">钱箱</span>
            <select name="drawer" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">${drawerOpts}</select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">登入金额</span>
            <input name="loginAmount" type="number" step="0.01" min="0" required data-register-audit-login-amount class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">登出金额（可选）</span>
            <input name="logoutAmount" type="number" step="0.01" min="0" data-register-audit-logout-amount class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="hidden text-sm" data-register-audit-mismatch-remark-wrap>
            <span class="mb-1 block text-muted-foreground">登入登出金额不一致理由备注</span>
            <textarea
              name="amountMismatchRemark"
              rows="3"
              maxlength="200"
              placeholder="请说明登入与登出金额不一致的原因"
              data-register-audit-mismatch-remark
              class="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
            ></textarea>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">从</span>
            <input name="from" type="datetime-local" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-muted-foreground">到（可选）</span>
            <input name="to" type="datetime-local" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>`,
    "cash-drawer",
  );
}

function openRegisterAuditAddDialog(): void {
  const overlay = document.getElementById("finance-register-audit-add-dialog");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.classList.add("flex");
  overlay.setAttribute("aria-hidden", "false");
}

function closeRegisterAuditAddDialog(): void {
  const overlay = document.getElementById("finance-register-audit-add-dialog");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.classList.remove("flex");
  overlay.setAttribute("aria-hidden", "true");
}

export function renderFinanceRegisterAuditPageContent(path: string): string {
  const active = getActiveFinanceRegisterAuditSubPath(path);
  const isPayments = active === FINANCE_REGISTER_AUDIT_PAYMENTS_PATH;
  const tabs = FINANCE_REGISTER_AUDIT_PAGES.map((page) => {
    const selected = page.path === active;
    return `
      <a href="#${page.path}"
        role="tab"
        class="inline-flex min-h-10 items-center border-b-2 px-4 text-sm font-medium transition-colors ${
          selected
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
        }"
        ${selected ? 'aria-selected="true"' : 'aria-selected="false"'}
      >${escapeHtml(page.title)}</a>`;
  }).join("");

  const paymentRows = filterPayments();
  const drawerRows = filterCashDrawerSessions();

  const tableHead = isPayments
    ? `<tr class="bg-primary text-primary-foreground">
        <th class="px-4 py-2.5 text-left text-sm font-medium">收款人</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">日期</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">操作人员</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">钱箱</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">已作废</th>
      </tr>`
    : `<tr class="bg-primary text-primary-foreground">
        <th class="px-4 py-2.5 text-left text-sm font-medium">姓名</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">钱箱</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">登入金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">登出金额</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">从</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">到</th>
        <th class="px-4 py-2.5 text-left text-sm font-medium">不一致备注</th>
      </tr>`;

  const tableBody = isPayments ? renderPaymentsTable(paymentRows) : renderCashDrawerTable(drawerRows);

  return `
    <div class="finance-register-audit-page flex min-h-0 flex-1 flex-col gap-4" data-register-audit-page="${isPayments ? "payments" : "cash-drawer"}">
      <div role="tablist" aria-label="收银记录与审计" class="flex shrink-0 border-b border-border">
        ${tabs}
      </div>

      <div class="flex shrink-0 flex-wrap items-end gap-3">
        <label class="text-sm">
          <span class="mb-1 block text-xs text-muted-foreground">从</span>
          <input type="date" data-register-audit-date-from value="${escapeHtml(filterState.dateFrom)}" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
        <label class="text-sm">
          <span class="mb-1 block text-xs text-muted-foreground">到</span>
          <input type="date" data-register-audit-date-to value="${escapeHtml(filterState.dateTo)}" class="h-9 rounded-md border border-input bg-background px-3 text-sm" />
        </label>
        <label class="text-sm">
          <span class="mb-1 block text-xs text-transparent select-none">.</span>
          <select data-register-audit-employee class="h-9 min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm">
            ${renderEmployeeOptions(filterState.employee, isPayments)}
          </select>
        </label>
        ${
          isPayments
            ? `<label class="mb-1.5 flex items-center gap-2 text-sm">
            <input type="checkbox" data-register-audit-show-voided class="size-4 rounded border-input"${filterState.showVoided ? " checked" : ""} />
            <span>显示已作废记录</span>
          </label>`
            : ""
        }
        <div class="flex items-end gap-2">
          <button type="button" data-register-audit-query class="h-9 min-w-[7rem] rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">查询</button>
          <button type="button" data-register-audit-add class="h-9 min-w-[7rem] rounded-md border border-foreground bg-background px-4 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">新增</button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table class="w-full min-w-[640px] border-collapse">
          <thead class="sticky top-0 z-[1]">${tableHead}</thead>
          <tbody>${tableBody}</tbody>
        </table>
      </div>

      ${renderAddDialog(active)}
    </div>`;
}

function readFilterFromDom(root: HTMLElement): void {
  const from = root.querySelector<HTMLInputElement>("[data-register-audit-date-from]");
  const to = root.querySelector<HTMLInputElement>("[data-register-audit-date-to]");
  const employee = root.querySelector<HTMLSelectElement>("[data-register-audit-employee]");
  const showVoided = root.querySelector<HTMLInputElement>("[data-register-audit-show-voided]");
  if (from?.value) filterState.dateFrom = from.value;
  if (to?.value) filterState.dateTo = to.value;
  if (employee) filterState.employee = employee.value;
  if (showVoided) filterState.showVoided = showVoided.checked;
}

function syncCashDrawerMismatchRemarkField(form: HTMLFormElement): void {
  const loginInput = form.querySelector<HTMLInputElement>("[data-register-audit-login-amount]");
  const logoutInput = form.querySelector<HTMLInputElement>("[data-register-audit-logout-amount]");
  const wrap = form.querySelector<HTMLElement>("[data-register-audit-mismatch-remark-wrap]");
  const remark = form.querySelector<HTMLTextAreaElement>("[data-register-audit-mismatch-remark]");
  if (!loginInput || !logoutInput || !wrap || !remark) return;

  const loginAmount = Number(loginInput.value);
  const logoutRaw = logoutInput.value.trim();
  const logoutAmount = logoutRaw === "" ? null : Number(logoutRaw);
  const mismatch =
    logoutAmount != null && Number.isFinite(loginAmount) && cashDrawerAmountsMismatch(loginAmount, logoutAmount);

  wrap.classList.toggle("hidden", !mismatch);
  remark.required = mismatch;
  if (!mismatch) remark.value = "";
}

export function bindFinanceRegisterAuditUi(remount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-register-audit-page]");
  if (!root) return;

  root.querySelector("[data-register-audit-query]")?.addEventListener("click", () => {
    readFilterFromDom(root);
    remount();
  });

  root.querySelector("[data-register-audit-add]")?.addEventListener("click", () => {
    openRegisterAuditAddDialog();
    const form = root.querySelector<HTMLFormElement>('[data-register-audit-add-form="cash-drawer"]');
    if (form) syncCashDrawerMismatchRemarkField(form);
  });

  root.querySelector("[data-register-audit-add-backdrop]")?.addEventListener("click", () => {
    closeRegisterAuditAddDialog();
  });

  root.querySelectorAll("[data-register-audit-add-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeRegisterAuditAddDialog();
    });
  });

  const form = root.querySelector<HTMLFormElement>("[data-register-audit-add-form]");
  form?.querySelector("[data-register-audit-login-amount]")?.addEventListener("input", () => {
    if (form) syncCashDrawerMismatchRemarkField(form);
  });
  form?.querySelector("[data-register-audit-logout-amount]")?.addEventListener("input", () => {
    if (form) syncCashDrawerMismatchRemarkField(form);
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const mode = form.getAttribute("data-register-audit-add-form");
    const fd = new FormData(form);
    if (mode === "payments") {
      paymentRecords.unshift({
        id: `p${Date.now()}`,
        payee: String(fd.get("payee") ?? ""),
        date: String(fd.get("date") ?? todayIsoDate()),
        amount: Number(fd.get("amount") ?? 0),
        operator: String(fd.get("operator") ?? ""),
        drawer: String(fd.get("drawer") ?? ""),
        voided: fd.get("voided") === "on",
      });
    } else {
      const logoutRaw = fd.get("logoutAmount");
      const toRaw = fd.get("to");
      const loginAmount = Number(fd.get("loginAmount") ?? 0);
      const logoutAmount = logoutRaw ? Number(logoutRaw) : null;
      const remarkRaw = String(fd.get("amountMismatchRemark") ?? "").trim();
      if (cashDrawerAmountsMismatch(loginAmount, logoutAmount) && !remarkRaw) {
        form.querySelector<HTMLTextAreaElement>("[data-register-audit-mismatch-remark]")?.focus();
        return;
      }
      cashDrawerSessions.unshift({
        id: `d${Date.now()}`,
        name: String(fd.get("name") ?? ""),
        drawer: String(fd.get("drawer") ?? ""),
        loginAmount,
        logoutAmount,
        from: String(fd.get("from") ?? ""),
        to: toRaw ? String(toRaw) : null,
        amountMismatchRemark: cashDrawerAmountsMismatch(loginAmount, logoutAmount) ? remarkRaw : null,
      });
    }
    closeRegisterAuditAddDialog();
    remount();
  });
}
