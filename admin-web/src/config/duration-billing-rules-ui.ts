/**
 * 计时与自助餐规则 · 独立按时计价规则管理（列表 + 右侧抽屉编辑）
 */
import { openConfirmDialog } from "../ui/app-confirm-dialog";
import { showAppToast } from "../ui/app-toast";
import {
  formatRulePricingSummary,
  resolveDurationBillingStoreId,
  validateDurationBillingRule,
  type DurationBillingRule,
  type DurationBillingRuleInput,
  type DurationBillingRate,
} from "./duration-billing-rules-store";
import { loadKposKtvSaleItems } from "./kpos-floor-plan-client";
import {
  deleteKposHourlyRateRule,
  listKposHourlyRateRules,
  saveKposHourlyRateRule,
} from "./kpos-hourly-rate-client";

let rulesSnapshot: DurationBillingRule[] = [];

const INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DEFAULT_RATES: DurationBillingRate[] = [
  { fromMinutes: 0, toMinutes: null, charge: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true } },
];

function renderRateRows(rates: DurationBillingRate[]): string {
  let nextFrom = 0;
  return rates.map((rate, index) => {
    const fromMinutes = nextFrom;
    if (rate.toMinutes !== null) nextFrom = rate.toMinutes;
    const chargeType = rate.charge.type;
    return `
      <div class="space-y-3 rounded-md border border-border p-3" data-duration-billing-rate-row>
        <div class="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2">
          <label class="space-y-1"><span class="text-xs text-muted-foreground">开始（分钟）</span><input class="${INPUT_CLASS} bg-muted/40" readonly value="${fromMinutes}" data-duration-billing-rate-from /></label>
          <span class="pb-2 text-muted-foreground">–</span>
          <label class="space-y-1"><span class="text-xs text-muted-foreground">结束（留空为以上）</span><input class="${INPUT_CLASS}" type="number" min="${fromMinutes + 1}" step="1" value="${rate.toMinutes ?? ""}" data-duration-billing-rate-to /></label>
          <button type="button" class="mb-0.5 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive" data-duration-billing-rate-delete aria-label="删除区间"${rates.length === 1 ? " disabled" : ""}>×</button>
        </div>
        <div class="grid gap-3 sm:grid-cols-[10rem_1fr_1fr]">
          <label class="space-y-1"><span class="text-xs text-muted-foreground">收费方式</span><select class="${INPUT_CLASS}" data-duration-billing-rate-charge-type><option value="fixed"${chargeType === "fixed" ? " selected" : ""}>固定收费</option><option value="unit"${chargeType === "unit" ? " selected" : ""}>按单位收费</option></select></label>
          <label class="space-y-1"><span class="text-xs text-muted-foreground">金额（元）</span><input class="${INPUT_CLASS}" type="number" min="0.01" step="0.01" value="${rate.charge.amount}" data-duration-billing-rate-amount /></label>
          <label class="space-y-1 ${chargeType === "unit" ? "" : "hidden"}" data-duration-billing-rate-unit-wrap><span class="text-xs text-muted-foreground">每多少分钟</span><input class="${INPUT_CLASS}" type="number" min="1" step="1" value="${chargeType === "unit" ? rate.charge.unitMinutes : 30}" data-duration-billing-rate-unit /></label>
        </div>
      </div>`;
  }).join("");
}

function renderRuleRow(rule: DurationBillingRule): string {
  const parseError = "parseError" in rule ? String(rule.parseError || "") : "";
  return `
    <tr class="border-t border-border" data-duration-billing-rule-row data-rule-id="${escapeHtml(rule.id)}">
      <td class="px-3 py-2.5 text-sm text-foreground">${escapeHtml(rule.name)}</td>
      <td class="px-3 py-2.5 text-sm tabular-nums ${parseError ? "text-destructive" : "text-foreground"}">${parseError ? escapeHtml(parseError) : escapeHtml(formatRulePricingSummary(rule))}</td>
      <td class="px-3 py-2.5 text-right whitespace-nowrap">
        <div class="inline-flex items-center gap-2">
          <button type="button" class="text-xs font-medium ${parseError ? "cursor-not-allowed text-muted-foreground" : "text-foreground hover:underline"}" data-duration-billing-rule-edit${parseError ? " disabled title=\"异常 KPOS 规则只能在 KPOS Admin 中修复\"" : ""}>编辑</button>
          <button type="button" class="text-xs font-medium ${parseError ? "cursor-not-allowed text-muted-foreground" : "text-destructive hover:underline"}" data-duration-billing-rule-delete${parseError ? " disabled title=\"异常 KPOS 规则只能在 KPOS Admin 中修复\"" : ""}>删除</button>
        </div>
      </td>
    </tr>`;
}

function renderRulesTableInner(rules: DurationBillingRule[]): string {
  if (rules.length === 0) {
    return `
      <p class="text-sm leading-relaxed text-muted-foreground" data-duration-billing-rules-empty>
        暂无按时计价规则。点击「+ 新建规则」创建，例如每 5 元 / 30 分钟。
      </p>`;
  }
  const rows = rules.map(renderRuleRow).join("");
  return `
    <div class="overflow-x-auto rounded-md border border-border" data-duration-billing-rules-table>
      <table class="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 font-medium">计时收费商品</th>
            <th class="px-3 py-2 font-medium w-[9rem]">计价摘要</th>
            <th class="px-3 py-2 text-right font-medium w-[11rem]">操作</th>
          </tr>
        </thead>
        <tbody data-duration-billing-rules-list>${rows}</tbody>
      </table>
    </div>`;
}

function renderDrawerHtml(): string {
  return `
    <div
      class="fixed inset-0 z-[10040] hidden"
      data-duration-billing-drawer
      aria-hidden="true"
    >
      <button type="button" class="absolute inset-0 bg-black/45" data-duration-billing-drawer-backdrop aria-label="关闭"></button>
      <div
        class="relative ml-auto flex h-full w-full max-w-[480px] flex-col border-l border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duration-billing-drawer-title"
      >
        <div class="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h3 id="duration-billing-drawer-title" class="text-base font-semibold text-foreground" data-duration-billing-drawer-title>新建按时计价规则</h3>
          <button type="button" class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" data-duration-billing-drawer-close aria-label="关闭">×</button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div class="space-y-4">
            <label class="block space-y-1.5">
              <span class="text-sm text-foreground">计时收费商品</span>
              <select class="${INPUT_CLASS}" data-duration-billing-drawer-product disabled>
                <option value="">正在加载 POS Menu 中的 KTV 商品…</option>
              </select>
              <span class="text-xs text-muted-foreground" data-duration-billing-product-help>与编辑桌子中的【KTV/卡拉OK】房间使用同一主机 POS 数据源</span>
            </label>
            <fieldset class="space-y-3 rounded-md border border-border p-4">
              <legend class="px-1 text-sm font-medium text-foreground">时间区间与收费方式</legend>
              <p class="text-xs leading-relaxed text-muted-foreground">区间从 0 分钟连续排列；每个区间独立选择固定收费或按单位收费，费用逐段累计。</p>
              <div class="space-y-3" data-duration-billing-rate-list>${renderRateRows(DEFAULT_RATES)}</div>
              <button type="button" class="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm font-medium hover:bg-muted" data-duration-billing-rate-add>+ 增加区间</button>
            </fieldset>
          </div>
        </div>
        <div class="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted" data-duration-billing-drawer-cancel>取消</button>
          <button type="button" class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" data-duration-billing-drawer-save>保存规则</button>
        </div>
      </div>
    </div>`;
}

export function renderDurationBillingRulesSectionHtml(): string {
  const storeId = resolveDurationBillingStoreId();
  return `
    <div
      class="space-y-3 px-4 py-4"
      data-duration-billing-rules-section
      data-duration-billing-rules-store-id="${escapeHtml(storeId)}"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="text-sm font-semibold text-foreground">按时计价规则</h4>
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
          data-duration-billing-rule-add
        >+ 新建规则</button>
      </div>
      <div data-duration-billing-rules-list-wrap><p class="text-sm text-muted-foreground">正在从 KPOS 读取按时计费规则…</p></div>
      ${renderDrawerHtml()}
    </div>`;
}

export function setDurationBillingRulesSectionVisible(visible: boolean): void {
  document.querySelectorAll<HTMLElement>("[data-duration-billing-rules-section]").forEach((section) => {
    section.classList.toggle("hidden", !visible);
    if (visible) section.removeAttribute("aria-hidden");
    else section.setAttribute("aria-hidden", "true");
    if (visible) void rerenderRulesList(section);
  });
}

async function rerenderRulesList(section: HTMLElement): Promise<void> {
  const wrap = section.querySelector<HTMLElement>("[data-duration-billing-rules-list-wrap]");
  if (!wrap) return;
  wrap.innerHTML = '<p class="text-sm text-muted-foreground">正在从 KPOS 读取按时计费规则…</p>';
  try {
    rulesSnapshot = await listKposHourlyRateRules();
    wrap.innerHTML = renderRulesTableInner(rulesSnapshot);
  } catch (error) {
    wrap.innerHTML = `<p class="text-sm text-destructive">${escapeHtml(error instanceof Error ? error.message : "无法读取 KPOS 按时计费规则")}</p>`;
  }
}

function closeDrawer(section: HTMLElement): void {
  const drawer = section.querySelector<HTMLElement>("[data-duration-billing-drawer]");
  if (!drawer) return;
  drawer.classList.add("hidden");
  drawer.classList.remove("flex");
  drawer.setAttribute("aria-hidden", "true");
  drawer.dataset.editRuleId = "";
  drawer.dataset.drawerMode = "";
}

function setRateRows(drawer: HTMLElement, rates: DurationBillingRate[]): void {
  const list = drawer.querySelector<HTMLElement>("[data-duration-billing-rate-list]");
  if (list) list.innerHTML = renderRateRows(rates);
}

function readRateRows(drawer: HTMLElement): DurationBillingRate[] {
  let nextFrom = 0;
  return Array.from(drawer.querySelectorAll<HTMLElement>("[data-duration-billing-rate-row]")).map((row) => {
    const toValue = row.querySelector<HTMLInputElement>("[data-duration-billing-rate-to]")?.value.trim() ?? "";
    const chargeType = row.querySelector<HTMLSelectElement>("[data-duration-billing-rate-charge-type]")?.value;
    const amount = Number(row.querySelector<HTMLInputElement>("[data-duration-billing-rate-amount]")?.value);
    const fromMinutes = nextFrom;
    const toMinutes = toValue === "" ? null : Number(toValue);
    if (toMinutes !== null) nextFrom = toMinutes;
    return {
      fromMinutes,
      toMinutes,
      charge: chargeType === "fixed"
        ? { type: "fixed", amount }
        : {
            type: "unit",
            amount,
            unitMinutes: Number(row.querySelector<HTMLInputElement>("[data-duration-billing-rate-unit]")?.value),
            roundUp: true,
          },
    };
  });
}

function refreshRateRows(drawer: HTMLElement): void {
  setRateRows(drawer, readRateRows(drawer));
}

async function loadKtvProducts(drawer: HTMLElement, rule?: DurationBillingRule): Promise<void> {
  const select = drawer.querySelector<HTMLSelectElement>("[data-duration-billing-drawer-product]");
  const help = drawer.querySelector<HTMLElement>("[data-duration-billing-product-help]");
  if (!select) return;
  select.disabled = true;
  select.innerHTML = '<option value="">正在加载 POS Menu 中的 KTV 商品…</option>';
  let products;
  try {
    products = await loadKposKtvSaleItems();
  } catch {
    select.innerHTML = '<option value="">无法读取主机 POS 的 KTV 商品</option>';
    if (help) {
      help.textContent = "无法读取主机 POS 的 KTV 商品，请检查主机与 License 连接";
      help.classList.add("text-destructive");
    }
    return;
  }
  const legacyBinding = rule?.productBinding;
  const configuredIds = new Set(rulesSnapshot.map((item) => String(item.id)));
  const currentProductId = String(rule?.productBinding?.productId ?? "");
  const options = products.map((product) => {
    const configuredElsewhere = configuredIds.has(String(product.id)) && String(product.id) !== currentProductId;
    return `
    <option value="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}"${configuredElsewhere ? " disabled" : ""}>
      ${escapeHtml(product.name)} · ${escapeHtml(product.id)}${configuredElsewhere ? "（已有 KPOS 规则）" : ""}
    </option>`;
  }).join("");
  const legacyOption = legacyBinding && !products.some((product) => product.id === legacyBinding.productId)
    ? `<option value="${escapeHtml(legacyBinding.productId)}" data-product-name="${escapeHtml(legacyBinding.productNameSnapshot)}" disabled>${escapeHtml(legacyBinding.productNameSnapshot)}（当前不可用）</option>`
    : "";
  select.innerHTML = `<option value="">请选择 KTV 商品</option>${legacyOption}${options}`;
  select.value = legacyBinding?.productId ?? "";
  select.disabled = products.length === 0;
  if (help) {
    help.textContent = products.length > 0
      ? `已从主机 POS 同步 ${products.length} 个 KTV 商品`
      : "主机 POS 中没有配置 KTV 商品";
    help.classList.toggle("text-destructive", products.length === 0);
  }
}

async function openDrawer(section: HTMLElement, mode: "create" | "edit", rule?: DurationBillingRule): Promise<void> {
  const drawer = section.querySelector<HTMLElement>("[data-duration-billing-drawer]");
  if (!drawer) return;

  const titleEl = drawer.querySelector<HTMLElement>("[data-duration-billing-drawer-title]");
  if (titleEl) {
    titleEl.textContent = mode === "create" ? "新建按时计价规则" : "编辑按时计价规则";
  }
  drawer.dataset.drawerMode = mode;
  drawer.dataset.editRuleId = mode === "edit" && rule ? rule.id : "";

  const rates = rule?.pricing.type === "rates"
    ? rule.pricing.rates
    : rule?.pricing.type === "unit"
      ? [{ fromMinutes: 0, toMinutes: null, charge: { type: "unit" as const, amount: rule.pricing.amount, unitMinutes: rule.pricing.unitMinutes, roundUp: true as const } }]
      : DEFAULT_RATES;
  setRateRows(drawer, rates.map((rate) => ({ ...rate, charge: { ...rate.charge } })));

  drawer.classList.remove("hidden");
  drawer.classList.add("flex");
  drawer.removeAttribute("aria-hidden");
  await loadKtvProducts(drawer, rule);
  drawer.querySelector<HTMLSelectElement>("[data-duration-billing-drawer-product]")?.focus({ preventScroll: true });
}

function readDrawerDraft(section: HTMLElement): DurationBillingRuleInput | null {
  const drawer = section.querySelector<HTMLElement>("[data-duration-billing-drawer]");
  if (!drawer) return null;

  const productSelect = drawer.querySelector<HTMLSelectElement>("[data-duration-billing-drawer-product]");
  const productOption = productSelect?.selectedOptions[0];
  const productId = productSelect?.value.trim() ?? "";
  const productName = productOption?.dataset.productName?.trim() ?? "";

  return {
    id: drawer.dataset.editRuleId || undefined,
    name: productName,
    scenes: [],
    enabled: true,
    productBinding: productId && productName ? {
      productId,
      productNameSnapshot: productName,
      requiredTag: "KTV",
      snapshotUpdatedAt: new Date().toISOString(),
    } : undefined,
    pricing: { type: "rates", rates: readRateRows(drawer) },
  };
}

async function saveDrawer(section: HTMLElement): Promise<void> {
  const draft = readDrawerDraft(section);
  if (!draft) return;
  const result = validateDurationBillingRule(draft);
  if (!result.ok || !result.value.productBinding) {
    showAppToast(result.ok ? "请选择计时收费商品" : result.message, { variant: "error" });
    return;
  }
  try {
    await saveKposHourlyRateRule(result.value.productBinding.productId, result.value.pricing);
    showAppToast("规则已保存到 KPOS", { variant: "success" });
    closeDrawer(section);
    await rerenderRulesList(section);
  } catch (error) {
    showAppToast(error instanceof Error ? error.message : "KPOS 保存失败", { variant: "error" });
    await rerenderRulesList(section);
  }
}

async function deleteRule(section: HTMLElement, ruleId: string): Promise<void> {
  const ok = await openConfirmDialog({
    title: "确认删除按时计价规则",
    message: "将从 KPOS 删除该商品的全部按时计费区间。若仍有桌台绑定，系统会阻止删除。",
    confirmLabel: "确认删除",
    danger: true,
  });
  if (!ok) return;

  try {
    await deleteKposHourlyRateRule(ruleId);
    showAppToast("规则已从 KPOS 删除", { variant: "success" });
  } catch (error) {
    showAppToast(error instanceof Error ? error.message : "KPOS 删除失败", { variant: "error" });
  }
  await rerenderRulesList(section);
}

export function bindDurationBillingRulesUi(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-duration-billing-rules-section]").forEach((section) => {
    if (section.dataset.durationBillingRulesBound === "1") return;
    section.dataset.durationBillingRulesBound = "1";
    void rerenderRulesList(section);
    window.addEventListener("menusifu:kpos-floor-plan-connection-change", () => {
      void rerenderRulesList(section);
    });

    section.addEventListener("change", (event) => {
      const target = event.target as HTMLElement;
      const drawer = section.querySelector<HTMLElement>("[data-duration-billing-drawer]");
      if (!drawer) return;
      if (target.matches("[data-duration-billing-rate-charge-type]")) {
        const row = target.closest<HTMLElement>("[data-duration-billing-rate-row]");
        row?.querySelector<HTMLElement>("[data-duration-billing-rate-unit-wrap]")
          ?.classList.toggle("hidden", (target as HTMLSelectElement).value !== "unit");
        return;
      }
      if (target.matches("[data-duration-billing-rate-to]")) refreshRateRows(drawer);
    });

    section.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      if (target.closest("[data-duration-billing-rule-add]")) {
        void openDrawer(section, "create");
        return;
      }

      const addIntervalButton = target.closest("[data-duration-billing-rate-add]");
      if (addIntervalButton) {
        const drawer = addIntervalButton.closest<HTMLElement>("[data-duration-billing-drawer]");
        if (!drawer) return;
        const rates = readRateRows(drawer);
        const last = rates.at(-1);
        if (!last || last.toMinutes === null) {
          showAppToast("请先填写当前最后区间的结束分钟", { variant: "error" });
          return;
        }
        rates.push({
          fromMinutes: last.toMinutes,
          toMinutes: null,
          charge: { type: "unit", amount: 5, unitMinutes: 30, roundUp: true },
        });
        setRateRows(drawer, rates);
        return;
      }

      const deleteIntervalButton = target.closest("[data-duration-billing-rate-delete]");
      if (deleteIntervalButton) {
        const drawer = deleteIntervalButton.closest<HTMLElement>("[data-duration-billing-drawer]");
        const row = deleteIntervalButton.closest<HTMLElement>("[data-duration-billing-rate-row]");
        if (!drawer || !row) return;
        const rows = Array.from(drawer.querySelectorAll<HTMLElement>("[data-duration-billing-rate-row]"));
        const index = rows.indexOf(row);
        const rates = readRateRows(drawer);
        if (index < 0 || rates.length <= 1) {
          showAppToast("请至少保留一个时间区间", { variant: "error" });
          return;
        }
        rates.splice(index, 1);
        setRateRows(drawer, rates);
        return;
      }

      if (
        target.closest("[data-duration-billing-drawer-cancel]") ||
        target.closest("[data-duration-billing-drawer-close]") ||
        target.closest("[data-duration-billing-drawer-backdrop]")
      ) {
        closeDrawer(section);
        return;
      }

      if (target.closest("[data-duration-billing-drawer-save]")) {
        void saveDrawer(section);
        return;
      }

      const editBtn = target.closest("[data-duration-billing-rule-edit]");
      if (editBtn) {
        const row = editBtn.closest<HTMLElement>("[data-duration-billing-rule-row]");
        const ruleId = row?.getAttribute("data-rule-id");
        if (!ruleId) return;
        const rule = rulesSnapshot.find((r) => r.id === ruleId);
        const invalidRule = rule as (DurationBillingRule & { parseError?: string }) | undefined;
        if (invalidRule?.parseError) {
          showAppToast(`该商品的 KPOS 规则异常：${invalidRule.parseError}`, { variant: "error" });
        } else if (rule?.pricing.type === "tiered") {
          showAppToast("旧版时段计价规则暂不支持编辑", { variant: "error" });
        } else if (rule) void openDrawer(section, "edit", rule);
        return;
      }

      const deleteBtn = target.closest("[data-duration-billing-rule-delete]");
      if (deleteBtn) {
        const row = deleteBtn.closest<HTMLElement>("[data-duration-billing-rule-row]");
        const ruleId = row?.getAttribute("data-rule-id");
        if (ruleId) void deleteRule(section, ruleId);
      }
    });
  });
}

export function refreshDurationBillingRulesSections(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-duration-billing-rules-section]").forEach((section) => {
    void rerenderRulesList(section);
  });
}
