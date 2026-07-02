/**
 * 支付中心 · 支付方式（seq 234 SSOT）：以支付方式为维度，每种方式勾选适用产线。
 */

import { MODULE_SETTING_CHOICE_CONTROL_CLASS } from "./module-settings-choice-ui";
import {
  readModuleSettingCheckbox,
  readModuleSettingJson,
  writeModuleSettingJson,
} from "./module-settings-form-ui";

export const PAYMENT_METHODS_HOST_SEQ = 234;

export const PAYMENT_METHODS_MEMBER_SEQS = [29, 233, 448, 511] as const;

const STORAGE_FIELD_ID = "234-payment-methods-config";

export type BuiltinPaymentMethodCode =
  | "cash"
  | "credit-card"
  | "gift-card"
  | "member-card"
  | "wechat"
  | "alipay";

export type CustomPaymentMethod = {
  id: string;
  name: string;
  openDrawer: boolean;
};

export type PaymentMethodsConfig = {
  customMethods: CustomPaymentMethod[];
  /** 支付方式 id → 启用的产线 id 列表 */
  byMethod: Record<string, string[]>;
};

export const PAYMENT_PRODUCT_LINES = [
  { id: "pos", label: "POS" },
  { id: "kiosk", label: "Kiosk" },
  { id: "emenu", label: "eMenu" },
  { id: "paypad", label: "Paypad" },
] as const;

export type PaymentProductLineId = (typeof PAYMENT_PRODUCT_LINES)[number]["id"];

export const BUILTIN_PAYMENT_METHODS: ReadonlyArray<{
  code: BuiltinPaymentMethodCode;
  label: string;
}> = [
  { code: "cash", label: "现金" },
  { code: "credit-card", label: "信用卡" },
  { code: "gift-card", label: "礼品卡" },
  { code: "member-card", label: "会员卡" },
  { code: "wechat", label: "微信" },
  { code: "alipay", label: "阿里" },
];

const BUILTIN_CODES = new Set<string>(BUILTIN_PAYMENT_METHODS.map((m) => m.code));

const SKIP_SEQS = new Set<number>(PAYMENT_METHODS_MEMBER_SEQS);

const ALL_LINE_IDS = PAYMENT_PRODUCT_LINES.map((l) => l.id);

/** 默认：各支付方式适用的产线 */
const DEFAULT_BY_METHOD: Record<string, PaymentProductLineId[]> = {
  cash: ["pos", "kiosk", "emenu", "paypad"],
  "credit-card": ["pos", "kiosk", "emenu", "paypad"],
  "gift-card": ["pos", "emenu", "paypad"],
  "member-card": ["pos", "emenu", "paypad"],
  wechat: ["pos", "emenu", "paypad"],
  alipay: ["pos", "emenu", "paypad"],
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newCustomMethodId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeCustom(raw: Partial<CustomPaymentMethod>): CustomPaymentMethod {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newCustomMethodId(),
    name: typeof raw.name === "string" ? raw.name : "",
    openDrawer: Boolean(raw.openDrawer),
  };
}

function defaultByMethod(): Record<string, string[]> {
  const byMethod: Record<string, string[]> = {};
  for (const m of BUILTIN_PAYMENT_METHODS) {
    byMethod[m.code] = [...(DEFAULT_BY_METHOD[m.code] ?? ALL_LINE_IDS)];
  }
  return byMethod;
}

function defaultConfig(): PaymentMethodsConfig {
  return { customMethods: [], byMethod: defaultByMethod() };
}

function invertByProductLine(byProductLine: Record<string, string[]>): Record<string, string[]> {
  const byMethod: Record<string, Set<string>> = {};
  for (const line of PAYMENT_PRODUCT_LINES) {
    for (const methodId of byProductLine[line.id] ?? []) {
      if (!byMethod[methodId]) byMethod[methodId] = new Set();
      byMethod[methodId].add(line.id);
    }
  }
  const out: Record<string, string[]> = { ...defaultByMethod() };
  for (const [methodId, lines] of Object.entries(byMethod)) {
    out[methodId] = [...lines];
  }
  return out;
}

function readLegacyWechatAlipay(): { wechat: boolean; alipay: boolean } {
  const wechat =
    readModuleSettingCheckbox("233-wechat", false) ||
    readModuleSettingCheckbox("233-payment-wechat", false);
  const alipay =
    readModuleSettingCheckbox("233-alipay", false) ||
    readModuleSettingCheckbox("233-payment-alipay", false);
  return { wechat, alipay };
}

type LegacyPartial = Partial<PaymentMethodsConfig> & {
  byProductLine?: Record<string, string[]>;
};

function migrateFromLegacy(partial: LegacyPartial): PaymentMethodsConfig {
  const customMethods = Array.isArray(partial.customMethods)
    ? partial.customMethods.map((c) => normalizeCustom(c))
    : [];

  const hadByMethod =
    partial.byMethod &&
    typeof partial.byMethod === "object" &&
    Object.keys(partial.byMethod).length > 0;

  const hadByProductLine =
    partial.byProductLine &&
    typeof partial.byProductLine === "object" &&
    Object.keys(partial.byProductLine).length > 0;

  let byMethod: Record<string, string[]> = defaultByMethod();

  if (hadByMethod) {
    byMethod = { ...defaultByMethod() };
    for (const [methodId, lines] of Object.entries(partial.byMethod!)) {
      if (Array.isArray(lines)) {
        byMethod[methodId] = lines.filter((id): id is PaymentProductLineId =>
          ALL_LINE_IDS.includes(id as PaymentProductLineId),
        );
      }
    }
  } else if (hadByProductLine) {
    byMethod = invertByProductLine(partial.byProductLine!);
  }

  if (!hadByMethod && !hadByProductLine) {
    const legacy = readLegacyWechatAlipay();
    if (legacy.wechat) {
      const set = new Set(byMethod.wechat ?? []);
      ALL_LINE_IDS.forEach((id) => set.add(id));
      byMethod.wechat = [...set];
    }
    if (legacy.alipay) {
      const set = new Set(byMethod.alipay ?? []);
      ALL_LINE_IDS.forEach((id) => set.add(id));
      byMethod.alipay = [...set];
    }
  }

  for (const m of BUILTIN_PAYMENT_METHODS) {
    if (!byMethod[m.code]?.length) {
      byMethod[m.code] = [...(DEFAULT_BY_METHOD[m.code] ?? ALL_LINE_IDS)];
    }
  }

  for (const custom of customMethods) {
    if (!byMethod[custom.id]?.length) {
      byMethod[custom.id] = ["pos"];
    }
  }

  return { customMethods, byMethod };
}

export function readPaymentMethodsConfig(): PaymentMethodsConfig {
  const raw = readModuleSettingJson<LegacyPartial>(STORAGE_FIELD_ID, {});
  if (!raw || typeof raw !== "object") return defaultConfig();
  return migrateFromLegacy(raw);
}

export function writePaymentMethodsConfig(config: PaymentMethodsConfig): void {
  writeModuleSettingJson(STORAGE_FIELD_ID, migrateFromLegacy(config));
}

export function isPaymentMethodsHostSeq(seq: number): boolean {
  return seq === PAYMENT_METHODS_HOST_SEQ;
}

export function shouldSkipPaymentMethodsMemberRow(seq: number): boolean {
  return SKIP_SEQS.has(seq);
}

export function isMethodOnProductLine(
  config: PaymentMethodsConfig,
  methodId: string,
  lineId: string,
): boolean {
  return (config.byMethod[methodId] ?? []).includes(lineId);
}

type MethodRow = {
  id: string;
  label: string;
  isCustom: boolean;
  openDrawer?: boolean;
};

function methodRows(config: PaymentMethodsConfig): MethodRow[] {
  const builtins: MethodRow[] = BUILTIN_PAYMENT_METHODS.map((m) => ({
    id: m.code,
    label: m.label,
    isCustom: false,
  }));
  const custom: MethodRow[] = config.customMethods.map((c) => ({
    id: c.id,
    label: c.name.trim() || "（未命名）",
    isCustom: true,
    openDrawer: c.openDrawer,
  }));
  return [...builtins, ...custom];
}

function renderProductLineHeaderCells(): string {
  return PAYMENT_PRODUCT_LINES.map(
    (line) =>
      `<th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">${escapeHtml(line.label)}</th>`,
  ).join("");
}

function renderMethodLineCheckboxes(methodId: string, config: PaymentMethodsConfig): string {
  return PAYMENT_PRODUCT_LINES.map((line) => {
    const checked = isMethodOnProductLine(config, methodId, line.id);
    return `
      <td class="border-t border-border px-2 py-2 text-center align-middle">
        <input
          type="checkbox"
          class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
          ${checked ? "checked" : ""}
          data-payment-method-id="${escapeHtml(methodId)}"
          data-payment-product-line="${escapeHtml(line.id)}"
          aria-label="${escapeHtml(line.label)}"
        />
      </td>`;
  }).join("");
}

function renderMethodsMatrixTable(config: PaymentMethodsConfig): string {
  const rows = methodRows(config);
  const bodyRows = rows
    .map((row) => {
      const customCells = row.isCustom
        ? `
        <td class="border-t border-border px-2 py-2 text-center align-middle">
          <input
            type="checkbox"
            class="${MODULE_SETTING_CHOICE_CONTROL_CLASS} rounded-sm"
            ${row.openDrawer ? "checked" : ""}
            data-payment-custom-open-drawer
            data-custom-id="${escapeHtml(row.id)}"
            aria-label="可开钱箱"
          />
        </td>
        <td class="border-t border-border px-2 py-2 text-right align-middle">
          <button type="button" class="text-sm text-destructive hover:underline" data-payment-custom-remove>删除</button>
        </td>`
        : `
        <td class="border-t border-border px-2 py-2 text-center text-muted-foreground">—</td>
        <td class="border-t border-border px-2 py-2 text-center text-muted-foreground">—</td>`;

      const nameCell = row.isCustom
        ? `<input
            type="text"
            class="h-8 w-full min-w-[6rem] rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value="${escapeHtml(config.customMethods.find((c) => c.id === row.id)?.name ?? "")}"
            placeholder="支付方式名称"
            data-payment-custom-name
            data-custom-id="${escapeHtml(row.id)}"
          />`
        : `<span class="text-sm font-medium text-foreground">${escapeHtml(row.label)}</span>`;

      return `
      <tr data-payment-method-row data-method-id="${escapeHtml(row.id)}" ${row.isCustom ? "data-payment-custom-row" : ""} ${row.isCustom ? `data-custom-id="${escapeHtml(row.id)}"` : ""}>
        <th scope="row" class="border-t border-border px-3 py-2.5 text-left align-middle font-normal">${nameCell}</th>
        ${renderMethodLineCheckboxes(row.id, config)}
        ${customCells}
      </tr>`;
    })
    .join("");

  return `
    <div class="overflow-x-auto rounded-md border border-border" data-payment-methods-matrix>
      <table class="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr class="bg-muted/50">
            <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">支付方式</th>
            ${renderProductLineHeaderCells()}
            <th scope="col" class="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">可开钱箱</th>
            <th scope="col" class="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-14">操作</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

export function renderPaymentMethodsEditorHtml(): string {
  const config = readPaymentMethodsConfig();
  return `
    <div class="space-y-3" data-payment-methods-editor>
      <p class="m-0 text-xs text-muted-foreground">每种支付方式勾选适用的产线终端（多选）。例：现金、刷卡可同时用于 POS 与 Kiosk，会员卡仅 POS。</p>
      ${renderMethodsMatrixTable(config)}
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
        data-payment-custom-add
      >新增支付方式</button>
    </div>`;
}

function collectConfigFromEditor(editor: HTMLElement): PaymentMethodsConfig {
  const config = readPaymentMethodsConfig();
  const byMethod: Record<string, string[]> = { ...config.byMethod };

  const methodIds = new Set<string>([
    ...BUILTIN_PAYMENT_METHODS.map((m) => m.code),
    ...config.customMethods.map((c) => c.id),
  ]);

  for (const methodId of methodIds) {
    const lines: string[] = [];
    editor
      .querySelectorAll<HTMLInputElement>(
        `input[data-payment-method-id="${methodId}"][data-payment-product-line]:checked`,
      )
      .forEach((input) => {
        const lineId = input.getAttribute("data-payment-product-line");
        if (lineId) lines.push(lineId);
      });
    byMethod[methodId] = lines;
  }

  const customMethods: CustomPaymentMethod[] = [];
  editor.querySelectorAll<HTMLElement>("[data-payment-custom-row]").forEach((row) => {
    const id = row.getAttribute("data-custom-id") ?? newCustomMethodId();
    const name = row.querySelector<HTMLInputElement>("[data-payment-custom-name]")?.value.trim() ?? "";
    const openDrawer = Boolean(
      row.querySelector<HTMLInputElement>("[data-payment-custom-open-drawer]")?.checked,
    );
    customMethods.push({ id, name, openDrawer });
    if (!byMethod[id]?.length) {
      byMethod[id] = ["pos"];
    }
  });

  return { customMethods, byMethod };
}

function rerenderEditor(editor: HTMLElement): void {
  const parent = editor.parentElement;
  if (!parent) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = renderPaymentMethodsEditorHtml().trim();
  const next = wrap.firstElementChild as HTMLElement | null;
  if (!next) return;
  editor.replaceWith(next);
  bindPaymentMethodsEditor(next);
}

function persistEditor(editor: HTMLElement): void {
  writePaymentMethodsConfig(collectConfigFromEditor(editor));
}

export function bindPaymentMethodsEditor(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-payment-methods-editor]").forEach((editor) => {
    if (editor.dataset.paymentMethodsEditorBound === "1") return;
    editor.dataset.paymentMethodsEditorBound = "1";

    editor.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (
        el.matches("[data-payment-product-line]") ||
        el.matches("[data-payment-custom-open-drawer]")
      ) {
        persistEditor(editor);
      }
    });

    editor.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (el.matches("[data-payment-custom-name]")) {
        persistEditor(editor);
      }
    });

    editor.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-payment-custom-add]")) {
        const config = collectConfigFromEditor(editor);
        const id = newCustomMethodId();
        config.customMethods.push({ id, name: "", openDrawer: false });
        config.byMethod[id] = ["pos", "kiosk", "emenu", "paypad"];
        writePaymentMethodsConfig(config);
        rerenderEditor(editor);
        return;
      }
      const removeBtn = target.closest("[data-payment-custom-remove]");
      if (removeBtn) {
        const row = removeBtn.closest<HTMLElement>("[data-payment-custom-row]");
        const customId = row?.getAttribute("data-custom-id");
        if (!customId) return;
        const config = collectConfigFromEditor(editor);
        config.customMethods = config.customMethods.filter((c) => c.id !== customId);
        delete config.byMethod[customId];
        writePaymentMethodsConfig(config);
        rerenderEditor(editor);
      }
    });
  });
}

export function isBuiltinPaymentMethodCode(code: string): code is BuiltinPaymentMethodCode {
  return BUILTIN_CODES.has(code);
}

/** 查询某产线可用支付方式 id 列表（运行时辅助） */
export function getPaymentMethodIdsForProductLine(
  config: PaymentMethodsConfig,
  lineId: string,
): string[] {
  return Object.entries(config.byMethod)
    .filter(([, lines]) => lines.includes(lineId))
    .map(([methodId]) => methodId);
}
