/**
 * Dual Pricing 上游同步到商家后台的门店费率 Snapshot（设置页只读 + 演示模拟）。
 * 正式环境由 SFDC Case → DP 任务 → 写配置 → 触发云端下发；P0 demo 用内存状态。
 */
import { DEFAULT_DEMO_STORE_ID } from "../permissions/m-platform-store-scope";
import { resolveAutoDeploymentScope } from "./deployment-mock-devices";
import { createDeploymentBatch } from "./deployment-store";
import type { DeploymentBatch } from "./deployment-types";

/** 演示用的三种同步场景 */
export type DualPricingSyncScene =
  | "upstream_not_configured"
  | "sync_failed"
  | "synced";

export type DualPricingUpstreamSnapshot = {
  storeId: string;
  storeName: string;
  scene: DualPricingSyncScene;
  /** 商家后台已落库费率；未落库为 null，UI 显示 `/` */
  rate: number | null;
  /** 上游已配置但尚未成功落库时的费率（仅 sync_failed 有值） */
  pendingUpstreamRate: number | null;
  /** 上游驱动开通且落库成功后锁定（设置页隐藏 543） */
  lockedBySfdc: boolean;
  lastError: string | null;
  lastDeploymentBatchId: string | null;
  updatedAt: string;
};

export const DP_SETTINGS_DEMO_STORE_ID = DEFAULT_DEMO_STORE_ID;
export const DP_DEMO_DEFAULT_RATE = 3.5;

const PAYMENT_CARD_PRICING_DOMAIN = "payment.card-pricing";

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function createInitialSnapshot(storeId: string, storeName: string): DualPricingUpstreamSnapshot {
  return {
    storeId,
    storeName,
    scene: "synced",
    rate: DP_DEMO_DEFAULT_RATE,
    pendingUpstreamRate: null,
    lockedBySfdc: true,
    lastError: null,
    lastDeploymentBatchId: null,
    updatedAt: "2026-07-14 10:00:00",
  };
}

const snapshots: DualPricingUpstreamSnapshot[] = [
  createInitialSnapshot(DP_SETTINGS_DEMO_STORE_ID, "上海陆家嘴店"),
  {
    storeId: "store-demo-nanjing",
    storeName: "南京演示店",
    scene: "upstream_not_configured",
    rate: null,
    pendingUpstreamRate: null,
    lockedBySfdc: false,
    lastError: null,
    lastDeploymentBatchId: null,
    updatedAt: "2026-07-01 09:00:00",
  },
];

let activeStoreId = DP_SETTINGS_DEMO_STORE_ID;

export function getDualPricingSettingsStoreId(): string {
  return activeStoreId;
}

export function setDualPricingSettingsStoreId(storeId: string): void {
  activeStoreId = storeId;
}

export function getDualPricingUpstreamSnapshot(
  storeId: string = activeStoreId,
): DualPricingUpstreamSnapshot | undefined {
  return snapshots.find((s) => s.storeId === storeId);
}

function ensureSnapshot(storeId: string = activeStoreId): DualPricingUpstreamSnapshot {
  let snap = getDualPricingUpstreamSnapshot(storeId);
  if (!snap) {
    snap = {
      storeId,
      storeName: storeId,
      scene: "upstream_not_configured",
      rate: null,
      pendingUpstreamRate: null,
      lockedBySfdc: false,
      lastError: null,
      lastDeploymentBatchId: null,
      updatedAt: nowStamp(),
    };
    snapshots.push(snap);
  }
  return snap;
}

function writeSnapshot(next: DualPricingUpstreamSnapshot): DualPricingUpstreamSnapshot {
  const idx = snapshots.findIndex((s) => s.storeId === next.storeId);
  if (idx >= 0) snapshots[idx] = next;
  else snapshots.push(next);
  return next;
}

/** 当前作用域是否已由上游开通双重定价（设置页应隐藏卡加价策略行） */
export function isDualPricingActiveFromUpstream(
  storeId: string = activeStoreId,
): boolean {
  const snap = getDualPricingUpstreamSnapshot(storeId);
  return Boolean(
    snap &&
      snap.scene === "synced" &&
      snap.lockedBySfdc &&
      snap.rate != null &&
      snap.rate > 0,
  );
}

export function getDualPricingSyncedRate(
  storeId: string = activeStoreId,
): number | null {
  const snap = getDualPricingUpstreamSnapshot(storeId);
  if (!snap || snap.scene !== "synced") return null;
  if (snap.rate == null || Number.isNaN(snap.rate)) return null;
  return snap.rate;
}

export function formatDualPricingSyncSceneLabel(scene: DualPricingSyncScene): string {
  if (scene === "upstream_not_configured") return "未配置";
  if (scene === "sync_failed") return "配置失败";
  return "已同步";
}

/** 场景 1：上游系统还没有配置 */
export function simulateDualPricingUpstreamNotConfigured(
  storeId: string = activeStoreId,
): DualPricingUpstreamSnapshot {
  const prev = ensureSnapshot(storeId);
  return writeSnapshot({
    ...prev,
    scene: "upstream_not_configured",
    rate: null,
    pendingUpstreamRate: null,
    lockedBySfdc: false,
    lastError: null,
    lastDeploymentBatchId: null,
    updatedAt: nowStamp(),
  });
}

/**
 * 场景 2：上游已配置，但同步到商家后台失败。
 * 商家后台不落库费率；保留 pendingUpstreamRate 便于说明。
 */
export function simulateDualPricingSyncFailed(
  storeId: string = activeStoreId,
  upstreamRate: number = DP_DEMO_DEFAULT_RATE,
): DualPricingUpstreamSnapshot {
  const prev = ensureSnapshot(storeId);
  return writeSnapshot({
    ...prev,
    scene: "sync_failed",
    rate: null,
    pendingUpstreamRate: upstreamRate,
    lockedBySfdc: false,
    lastError: "上游已配置，同步至商家后台失败（演示）",
    lastDeploymentBatchId: null,
    updatedAt: nowStamp(),
  });
}

/**
 * 同步成功：落库费率并触发 POS 下发，写入「下发记录」。
 */
export function simulateDualPricingSyncSuccess(
  storeId: string = activeStoreId,
  rate: number = DP_DEMO_DEFAULT_RATE,
): { snapshot: DualPricingUpstreamSnapshot; batch: DeploymentBatch | null } {
  const prev = ensureSnapshot(storeId);
  const beforeRate = prev.scene === "synced" && prev.rate != null ? `${prev.rate}%` : "/";
  const afterRate = `${rate}%`;

  const batch = triggerDualPricingDispatchAfterSync({
    storeId,
    storeName: prev.storeName,
    beforeRate,
    afterRate,
  });

  const snapshot = writeSnapshot({
    ...prev,
    scene: "synced",
    rate,
    pendingUpstreamRate: null,
    lockedBySfdc: true,
    lastError: null,
    lastDeploymentBatchId: batch?.id ?? null,
    updatedAt: nowStamp(),
  });

  return { snapshot, batch };
}

function triggerDualPricingDispatchAfterSync(input: {
  storeId: string;
  storeName: string;
  beforeRate: string;
  afterRate: string;
}): DeploymentBatch | null {
  const scope = resolveAutoDeploymentScope();
  const storeIds = scope?.storeIds?.length ? scope.storeIds : [input.storeId];
  const settingsPath = "/transactions/settings/card-fees";

  return createDeploymentBatch({
    domainKeys: [PAYMENT_CARD_PRICING_DOMAIN],
    storeIds,
    brandId: scope?.brandId,
    brandName: scope?.brandName,
    scopeLevel: "store",
    triggerSource: "auto",
    originNav: {
      l1Key: "transactions",
      l1Title: "支付中心",
      l2Key: "tx-settings",
      l2Title: "设置",
      l3GroupKey: "card-fees",
      pagePath: settingsPath,
    },
    configChanges: [
      {
        fieldKey: "454-dual-pricing-rate",
        label: "双重定价 · 比例",
        operation: "上游同步落库",
        before: input.beforeRate,
        after: input.afterRate,
        settingsPath,
      },
    ],
  });
}
