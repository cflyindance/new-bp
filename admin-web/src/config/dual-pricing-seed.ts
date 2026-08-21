/**
 * Dual Pricing 演示种子（对齐中台原型：上海/北京有值、南京 `/`）。
 * 供 dual-pricing-store 初始化；非真实接口数据。
 *
 * 任务双层状态：upstreamStatus（上游同步）+ posStatus（POS 下发）。
 */
import { DEFAULT_DEMO_STORE_ID } from "../permissions/m-platform-store-scope";
import type { DpStoreSnapshot, DpTask } from "./dual-pricing-types";

/**
 * 上海店 storeId 对齐默认演示门店，便于设置页 454/172 锁定联调。
 * MID 仍用原型示意值。
 */
export const DP_SEED_STORE_SHANGHAI = DEFAULT_DEMO_STORE_ID;
export const DP_SEED_STORE_BEIJING = "store-beijing";
export const DP_SEED_STORE_NANJING = "store-nanjing";

export const DP_SEED_STORES: DpStoreSnapshot[] = [
  {
    storeId: DP_SEED_STORE_SHANGHAI,
    storeName: "上海店",
    mid: "M00002222",
    rate: 3.6,
    receiptUnpaidDisplay: "Card Price",
    sourceCaseId: "00253914",
    lockedBySfdc: true,
    updatedAt: "2026-06-02 10:00:00",
  },
  {
    storeId: DP_SEED_STORE_BEIJING,
    storeName: "北京店",
    mid: "M000033333",
    rate: 3.6,
    receiptUnpaidDisplay: "Card Price",
    sourceCaseId: "00253913",
    lockedBySfdc: true,
    updatedAt: "2026-06-05 10:00:00",
  },
  {
    storeId: DP_SEED_STORE_NANJING,
    storeName: "南京店",
    mid: "M000044444",
    rate: null,
    receiptUnpaidDisplay: null,
    sourceCaseId: null,
    lockedBySfdc: false,
    updatedAt: "2026-06-01 09:00:00",
  },
];

/**
 * 覆盖双层状态组合；含可「更新」的同步失败 / 下发失败。
 * 任务 ID / case number 对齐原型示意。
 */
export const DP_SEED_TASKS: DpTask[] = [
  {
    taskId: "12241432",
    caseNumber: "00253912",
    storeId: DP_SEED_STORE_SHANGHAI,
    mid: "M00002222",
    type: "open",
    rate: 3.65,
    upstreamStatus: "failed",
    posStatus: "none",
    autoRetryCount: 3,
    manualRetryCount: 0,
    lastError: "写入卡付加价策略失败：MID 校验未通过",
    deploymentJobId: null,
    updatedAt: "2026-06-06 10:00:00",
  },
  {
    taskId: "4141414",
    caseNumber: "00253913",
    storeId: DP_SEED_STORE_BEIJING,
    mid: "M000033333",
    type: "close",
    rate: 3.65,
    upstreamStatus: "received",
    posStatus: "ok",
    autoRetryCount: 0,
    manualRetryCount: 0,
    lastError: null,
    deploymentJobId: "dep-dp-4141414",
    updatedAt: "2026-06-05 10:00:00",
  },
  {
    taskId: "1411441",
    caseNumber: "00253914",
    storeId: DP_SEED_STORE_SHANGHAI,
    mid: "M00002222",
    type: "open",
    rate: 3.65,
    upstreamStatus: "received",
    posStatus: "ok",
    autoRetryCount: 0,
    manualRetryCount: 0,
    lastError: null,
    deploymentJobId: "dep-dp-1411441",
    updatedAt: "2026-06-02 10:00:00",
  },
  {
    taskId: "15001001",
    caseNumber: "00253920",
    storeId: DP_SEED_STORE_NANJING,
    mid: "M000044444",
    type: "open",
    rate: 3.5,
    upstreamStatus: "pending",
    posStatus: "none",
    autoRetryCount: 0,
    manualRetryCount: 0,
    lastError: null,
    deploymentJobId: null,
    updatedAt: "2026-06-07 08:30:00",
  },
  {
    taskId: "15001002",
    caseNumber: "00253921",
    storeId: DP_SEED_STORE_BEIJING,
    mid: "M000033333",
    type: "open",
    rate: 3.6,
    upstreamStatus: "received",
    posStatus: "pending",
    autoRetryCount: 0,
    manualRetryCount: 0,
    lastError: null,
    deploymentJobId: "dep-dp-15001002",
    updatedAt: "2026-06-07 09:00:00",
  },
  {
    taskId: "15001003",
    caseNumber: "00253922",
    storeId: DP_SEED_STORE_NANJING,
    mid: "M000044444",
    type: "open",
    rate: 3.5,
    upstreamStatus: "received",
    posStatus: "failed",
    autoRetryCount: 3,
    manualRetryCount: 0,
    lastError: "POS 离线超时，下发未 ACK",
    deploymentJobId: "dep-dp-15001003",
    updatedAt: "2026-06-07 11:20:00",
  },
];

/** 深拷贝种子，避免 store 突变污染模块常量 */
export function cloneDpSeedStores(): DpStoreSnapshot[] {
  return DP_SEED_STORES.map((s) => ({ ...s }));
}

export function cloneDpSeedTasks(): DpTask[] {
  return DP_SEED_TASKS.map((t) => ({ ...t }));
}
