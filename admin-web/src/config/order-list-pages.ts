/**
 * 订单中心 · 订单列表（模拟数据页）
 * 表头与金额口径见 order-list-columns / order-list-amounts。
 * 支持列设置：勾选显示/隐藏，偏好写入 localStorage。
 */
import { getUiLocale } from "../i18n";
import { calcTotalCollected, calcTotalDue, formatUsd } from "./order-list-amounts";
import {
  ORDER_LIST_COLUMNS,
  ORDER_LIST_LOCKED_COLUMN_KEY,
  getVisibleOrderListColumns,
  readOrderListVisibleKeys,
  resetOrderListVisibleKeys,
  writeOrderListVisibleKeys,
  type OrderListChannel,
  type OrderListColumnDef,
  type OrderListColumnKey,
} from "./order-list-columns";

export const ORDER_LIST_PATH = "/orders/all";

export type MockOrderRow = {
  orderNumber: string;
  statusZh: string;
  statusEn: string;
  orderTypeZh: string;
  orderTypeEn: string;
  orderChannel: OrderListChannel;
  tableOrPickupNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  cardTip: number;
  cashTip: number;
  /** true = 已结账/已收款 */
  settled: boolean;
  serverName: string;
  closerName: string;
  openedAt: string;
  closedAt: string | null;
  paymentMethodSummary: string;
  guestCount: number;
  storeName: string;
};

/** 美国餐馆场景演示数据（非真实接口） */
export const MOCK_ORDER_LIST: MockOrderRow[] = [
  {
    orderNumber: "CHK-10482",
    statusZh: "已结账",
    statusEn: "Closed",
    orderTypeZh: "堂食",
    orderTypeEn: "Dine-in",
    orderChannel: "POS",
    tableOrPickupNo: "T12",
    subtotal: 86.0,
    discount: 5.0,
    tax: 7.29,
    serviceCharge: 0,
    cardTip: 14.0,
    cashTip: 0,
    settled: true,
    serverName: "Alex Kim",
    closerName: "Jordan Lee",
    openedAt: "07/13/2026 11:42",
    closedAt: "07/13/2026 12:18",
    paymentMethodSummary: "Card",
    guestCount: 2,
    storeName: "Downtown LA",
  },
  {
    orderNumber: "CHK-10483",
    statusZh: "开单中",
    statusEn: "Open",
    orderTypeZh: "堂食",
    orderTypeEn: "Dine-in",
    orderChannel: "EMENU",
    tableOrPickupNo: "T7",
    subtotal: 124.5,
    discount: 0,
    tax: 11.21,
    serviceCharge: 22.41,
    cardTip: 0,
    cashTip: 0,
    settled: false,
    serverName: "Sam Rivera",
    closerName: "",
    openedAt: "07/13/2026 12:05",
    closedAt: null,
    paymentMethodSummary: "",
    guestCount: 6,
    storeName: "Downtown LA",
  },
  {
    orderNumber: "CHK-10471",
    statusZh: "已结账",
    statusEn: "Closed",
    orderTypeZh: "自取",
    orderTypeEn: "Pickup",
    orderChannel: "KIOSK",
    tableOrPickupNo: "P-218",
    subtotal: 42.0,
    discount: 0,
    tax: 3.78,
    serviceCharge: 0,
    cardTip: 6.0,
    cashTip: 2.0,
    settled: true,
    serverName: "Casey Ng",
    closerName: "Casey Ng",
    openedAt: "07/13/2026 10:15",
    closedAt: "07/13/2026 10:28",
    paymentMethodSummary: "Card + Cash",
    guestCount: 1,
    storeName: "Pasadena",
  },
  {
    orderNumber: "CHK-10455",
    statusZh: "已结账",
    statusEn: "Closed",
    orderTypeZh: "外卖",
    orderTypeEn: "Delivery",
    orderChannel: "三方外卖",
    tableOrPickupNo: "D-091",
    subtotal: 58.75,
    discount: 8.0,
    tax: 4.57,
    serviceCharge: 3.0,
    cardTip: 9.5,
    cashTip: 0,
    settled: true,
    serverName: "Online",
    closerName: "Jordan Lee",
    openedAt: "07/13/2026 09:40",
    closedAt: "07/13/2026 09:55",
    paymentMethodSummary: "Card",
    guestCount: 0,
    storeName: "Downtown LA",
  },
  {
    orderNumber: "CHK-10440",
    statusZh: "已退款",
    statusEn: "Refunded",
    orderTypeZh: "堂食",
    orderTypeEn: "Dine-in",
    orderChannel: "PAYPAD",
    tableOrPickupNo: "B2",
    subtotal: 31.0,
    discount: 0,
    tax: 2.79,
    serviceCharge: 0,
    cardTip: 0,
    cashTip: 0,
    settled: true,
    serverName: "Alex Kim",
    closerName: "Alex Kim",
    openedAt: "07/12/2026 19:10",
    closedAt: "07/12/2026 19:22",
    paymentMethodSummary: "Card",
    guestCount: 2,
    storeName: "Pasadena",
  },
  {
    orderNumber: "CHK-10491",
    statusZh: "已结账",
    statusEn: "Closed",
    orderTypeZh: "自取",
    orderTypeEn: "Pickup",
    orderChannel: "OO",
    tableOrPickupNo: "P-301",
    subtotal: 27.5,
    discount: 0,
    tax: 2.48,
    serviceCharge: 0,
    cardTip: 4.0,
    cashTip: 0,
    settled: true,
    serverName: "Online",
    closerName: "Casey Ng",
    openedAt: "07/13/2026 13:02",
    closedAt: "07/13/2026 13:08",
    paymentMethodSummary: "Card",
    guestCount: 1,
    storeName: "Downtown LA",
  },
  {
    orderNumber: "CHK-10492",
    statusZh: "已结账",
    statusEn: "Closed",
    orderTypeZh: "堂食",
    orderTypeEn: "Dine-in",
    orderChannel: "SDI",
    tableOrPickupNo: "T3",
    subtotal: 64.0,
    discount: 0,
    tax: 5.76,
    serviceCharge: 0,
    cardTip: 10.0,
    cashTip: 0,
    settled: true,
    serverName: "Guest",
    closerName: "Jordan Lee",
    openedAt: "07/13/2026 12:40",
    closedAt: "07/13/2026 13:15",
    paymentMethodSummary: "Card",
    guestCount: 3,
    storeName: "Pasadena",
  },
  {
    orderNumber: "CHK-10493",
    statusZh: "开单中",
    statusEn: "Open",
    orderTypeZh: "堂食",
    orderTypeEn: "Dine-in",
    orderChannel: "POS GO",
    tableOrPickupNo: "Patio-2",
    subtotal: 39.0,
    discount: 0,
    tax: 3.51,
    serviceCharge: 0,
    cardTip: 0,
    cashTip: 0,
    settled: false,
    serverName: "Sam Rivera",
    closerName: "",
    openedAt: "07/13/2026 13:20",
    closedAt: null,
    paymentMethodSummary: "",
    guestCount: 2,
    storeName: "Downtown LA",
  },
];

export function isOrderListPath(path: string): boolean {
  return path === ORDER_LIST_PATH || path.startsWith(`${ORDER_LIST_PATH}/`);
}

export function findOrderListTitle(path: string): { title: string; module: string } | null {
  if (!isOrderListPath(path)) return null;
  const en = getUiLocale() === "en";
  return {
    title: en ? "Order list" : "订单列表",
    module: en ? "Order center · Order list" : "订单中心 · 订单列表",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellValue(row: MockOrderRow, key: OrderListColumnKey, en: boolean): string {
  const due = calcTotalDue(row);
  const collected = calcTotalCollected(row);
  switch (key) {
    case "orderNumber":
      return row.orderNumber;
    case "status":
      return en ? row.statusEn : row.statusZh;
    case "orderType":
      return en ? row.orderTypeEn : row.orderTypeZh;
    case "orderChannel":
      return row.orderChannel === "三方外卖" && en ? "3rd-party delivery" : row.orderChannel;
    case "tableOrPickupNo":
      return row.tableOrPickupNo || "—";
    case "subtotal":
      return formatUsd(row.subtotal);
    case "totalDue":
      return formatUsd(due);
    case "totalCollected":
      return formatUsd(collected);
    case "cardTip":
      return formatUsd(row.cardTip);
    case "cashTip":
      return formatUsd(row.cashTip);
    case "serviceCharge":
      return formatUsd(row.serviceCharge);
    case "tax":
      return formatUsd(row.tax);
    case "serverName":
      return row.serverName || "—";
    case "openedAt":
      return row.openedAt;
    case "closerName":
      return row.closerName || "—";
    case "closedAt":
      return row.closedAt || "—";
    case "paymentMethodSummary":
      return row.paymentMethodSummary || "—";
    case "discount":
      return formatUsd(row.discount);
    case "guestCount":
      return String(row.guestCount);
    case "storeName":
      return row.storeName || "—";
    default:
      return "—";
  }
}

function isMoneyKey(key: OrderListColumnKey): boolean {
  return (
    key === "subtotal" ||
    key === "totalDue" ||
    key === "totalCollected" ||
    key === "cardTip" ||
    key === "cashTip" ||
    key === "serviceCharge" ||
    key === "tax" ||
    key === "discount"
  );
}

function renderHead(cols: OrderListColumnDef[], en: boolean): string {
  return `<tr class="border-b border-border bg-muted/40">${cols
    .map((c) => {
      const label = en ? c.titleEn : c.titleZh;
      const align = isMoneyKey(c.key) ? "text-right" : "text-left";
      return `<th class="whitespace-nowrap px-3 py-2.5 ${align} text-xs font-medium text-muted-foreground">${escapeHtml(label)}</th>`;
    })
    .join("")}</tr>`;
}

function renderBody(rows: MockOrderRow[], cols: OrderListColumnDef[], en: boolean): string {
  if (!rows.length) {
    return `<tr><td colspan="${cols.length}" class="px-4 py-10 text-center text-sm text-muted-foreground">${en ? "No mock orders" : "暂无模拟订单"}</td></tr>`;
  }
  return rows
    .map((row) => {
      const cells = cols
        .map((c) => {
          const align = isMoneyKey(c.key) ? "text-right tabular-nums" : "text-left";
          return `<td class="whitespace-nowrap px-3 py-2.5 text-sm ${align}">${escapeHtml(cellValue(row, c.key, en))}</td>`;
        })
        .join("");
      return `<tr class="border-b border-border/60 hover:bg-muted/30">${cells}</tr>`;
    })
    .join("");
}

function renderColumnSettingsPanel(visibleKeys: Set<OrderListColumnKey>, en: boolean): string {
  const items = ORDER_LIST_COLUMNS.map((c) => {
    const locked = c.key === ORDER_LIST_LOCKED_COLUMN_KEY;
    const checked = visibleKeys.has(c.key);
    const label = en ? c.titleEn : c.titleZh;
    const hint = locked ? (en ? " (required)" : "（必显）") : "";
    return `
      <label class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60${locked ? " opacity-80" : ""}">
        <input
          type="checkbox"
          class="size-4 rounded border-input"
          data-order-list-col-toggle
          value="${escapeHtml(c.key)}"
          ${checked ? "checked" : ""}
          ${locked ? "disabled" : ""}
        />
        <span>${escapeHtml(label)}${escapeHtml(hint)}</span>
      </label>`;
  }).join("");

  return `
    <div
      class="absolute right-0 top-full z-20 mt-1 hidden w-64 rounded-lg border border-border bg-card p-2 shadow-lg"
      data-order-list-col-panel
      role="dialog"
      aria-label="${en ? "Column settings" : "列设置"}"
    >
      <div class="mb-1 flex items-center justify-between gap-2 border-b border-border px-2 pb-2">
        <span class="text-xs font-medium text-muted-foreground">${en ? "Show / hide columns" : "显示 / 隐藏列"}</span>
        <div class="flex gap-1">
          <button type="button" class="rounded px-1.5 py-0.5 text-xs text-foreground hover:bg-muted" data-order-list-col-all>${en ? "All" : "全选"}</button>
          <button type="button" class="rounded px-1.5 py-0.5 text-xs text-foreground hover:bg-muted" data-order-list-col-reset>${en ? "Reset" : "恢复默认"}</button>
        </div>
      </div>
      <div class="max-h-72 overflow-y-auto py-1">${items}</div>
    </div>`;
}

export function renderOrderListPageContent(_path: string): string {
  const en = getUiLocale() === "en";
  const visibleKeys = readOrderListVisibleKeys();
  const cols = getVisibleOrderListColumns(visibleKeys);
  const minW = Math.max(720, cols.length * 88);
  const note = en
    ? "Mock data only · toggle columns via Column settings"
    : "仅模拟数据 · 可通过「列设置」显示/隐藏表头字段";

  return `
    <div class="order-list-page flex min-h-0 flex-1 flex-col gap-3" data-order-list-page>
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-muted-foreground">${escapeHtml(note)}</p>
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">${MOCK_ORDER_LIST.length} ${en ? "orders" : "笔"} · ${cols.length}/${ORDER_LIST_COLUMNS.length} ${en ? "cols" : "列"}</span>
          <div class="relative" data-order-list-col-wrap>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
              data-order-list-col-btn
              aria-expanded="false"
              aria-haspopup="dialog"
            >
              ${en ? "Columns" : "列设置"}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            ${renderColumnSettingsPanel(visibleKeys, en)}
          </div>
        </div>
      </div>
      <div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table class="w-full border-collapse" style="min-width:${minW}px">
          <thead class="sticky top-0 z-[1]">${renderHead(cols, en)}</thead>
          <tbody>${renderBody(MOCK_ORDER_LIST, cols, en)}</tbody>
        </table>
      </div>
    </div>`;
}

function collectCheckedKeys(root: HTMLElement): Set<OrderListColumnKey> {
  const keys = new Set<OrderListColumnKey>();
  root.querySelectorAll<HTMLInputElement>("[data-order-list-col-toggle]").forEach((input) => {
    if (input.checked) keys.add(input.value as OrderListColumnKey);
  });
  keys.add(ORDER_LIST_LOCKED_COLUMN_KEY);
  return keys;
}

let orderListDocCloseBound = false;

export function bindOrderListUi(remount?: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-order-list-page]");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  const wrap = root.querySelector<HTMLElement>("[data-order-list-col-wrap]");
  const btn = root.querySelector<HTMLButtonElement>("[data-order-list-col-btn]");
  const panel = root.querySelector<HTMLElement>("[data-order-list-col-panel]");
  if (!wrap || !btn || !panel) return;

  const setOpen = (open: boolean) => {
    panel.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(panel.classList.contains("hidden"));
  });

  panel.addEventListener("click", (e) => e.stopPropagation());

  if (!orderListDocCloseBound) {
    orderListDocCloseBound = true;
    document.addEventListener(
      "click",
      (e) => {
        const page = document.querySelector<HTMLElement>("[data-order-list-page]");
        const openPanel = page?.querySelector<HTMLElement>("[data-order-list-col-panel]");
        const openBtn = page?.querySelector<HTMLButtonElement>("[data-order-list-col-btn]");
        if (!openPanel || !openBtn || openPanel.classList.contains("hidden")) return;
        const t = e.target;
        if (t instanceof Node && (openPanel.contains(t) || openBtn.contains(t))) return;
        openPanel.classList.add("hidden");
        openBtn.setAttribute("aria-expanded", "false");
      },
      true,
    );
  }

  root.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement) || !t.matches("[data-order-list-col-toggle]")) return;
    writeOrderListVisibleKeys(collectCheckedKeys(root));
    remount?.();
  });

  root.querySelector("[data-order-list-col-all]")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    writeOrderListVisibleKeys(ORDER_LIST_COLUMNS.map((c) => c.key));
    remount?.();
  });

  root.querySelector("[data-order-list-col-reset]")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetOrderListVisibleKeys();
    remount?.();
  });
}
