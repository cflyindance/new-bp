/**
 * 支付中心 · Dual Pricing 开通自动化 — 类型与文案。
 * 见 docs/项目文档/支付中心-DualPricing开通流程自动化设计方案.md
 */

/** 上游同步：SFDC → 商家后台 */
export type DpUpstreamStatus = "pending" | "received" | "failed";

/** POS 下发：商家后台 → POS；none = 上游未成功，UI 显示 `/` */
export type DpPosStatus = "none" | "pending" | "ok" | "failed";

export type DpTaskType = "open" | "close";

/** Receipt (Unpaid) Display；开启默认 Card Price（POS DisplayCardPrice / 172=card） */
export type DpReceiptUnpaidDisplay = "Card Price" | "Cash Price" | string;

export type DpStoreSnapshot = {
  storeId: string;
  storeName: string;
  mid: string;
  /** 未开通为空；UI 展示 `/` */
  rate: number | null;
  /** 未开通为空；UI 展示 `/` */
  receiptUnpaidDisplay: DpReceiptUnpaidDisplay | null;
  sourceCaseId: string | null;
  /** true 时设置页 454/172 只读 */
  lockedBySfdc: boolean;
  updatedAt: string;
};

export type DpTask = {
  taskId: string;
  caseNumber: string;
  storeId: string;
  mid: string;
  type: DpTaskType;
  /** 开启必填；关闭可保留 Case 费率便于审计 */
  rate: number | null;
  upstreamStatus: DpUpstreamStatus;
  posStatus: DpPosStatus;
  /** 自动重试已用次数 0–3 */
  autoRetryCount: number;
  /** 人工「更新」次数（无上限） */
  manualRetryCount: number;
  lastError: string | null;
  deploymentJobId: string | null;
  updatedAt: string;
};

export const DP_UPSTREAM_STATUS_LABEL_ZH: Record<DpUpstreamStatus, string> = {
  pending: "待同步",
  received: "已接收",
  failed: "同步失败",
};

export const DP_UPSTREAM_STATUS_LABEL_EN: Record<DpUpstreamStatus, string> = {
  pending: "Pending sync",
  received: "Received",
  failed: "Sync failed",
};

export const DP_POS_STATUS_LABEL_ZH: Record<DpPosStatus, string> = {
  none: "/",
  pending: "待下发",
  ok: "下发成功",
  failed: "下发失败",
};

export const DP_POS_STATUS_LABEL_EN: Record<DpPosStatus, string> = {
  none: "/",
  pending: "Pending dispatch",
  ok: "Dispatch OK",
  failed: "Dispatch failed",
};

export const DP_TASK_TYPE_LABEL_ZH: Record<DpTaskType, string> = {
  open: "开启",
  close: "关闭",
};

export const DP_TASK_TYPE_LABEL_EN: Record<DpTaskType, string> = {
  open: "Open",
  close: "Close",
};

export function isDpRetryableTask(task: Pick<DpTask, "upstreamStatus" | "posStatus">): boolean {
  return task.upstreamStatus === "failed" || task.posStatus === "failed";
}

export function formatDpUpstreamStatus(status: DpUpstreamStatus): string {
  return DP_UPSTREAM_STATUS_LABEL_ZH[status];
}

export function formatDpPosStatus(status: DpPosStatus): string {
  return DP_POS_STATUS_LABEL_ZH[status];
}

export function formatDpRate(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "/";
  return `${rate}%`;
}

export function formatDpReceiptDisplay(
  value: DpReceiptUnpaidDisplay | null | undefined,
): string {
  if (value == null || value === "") return "/";
  return value;
}
