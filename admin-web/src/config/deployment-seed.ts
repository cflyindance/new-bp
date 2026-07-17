/**
 * 模拟下发 · 演示种子数据
 */
import { listAllMockStores, type MockStoreRef } from "./deployment-mock-devices";
import { saveDeploymentBatch } from "./deployment-store";
import type { DeploymentBatch } from "./deployment-types";

function daysAgo(days: number, hours = 10, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function minutesAgo(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toISOString();
}

/**
 * 下发记录页默认展示的种子：
 * - DEP-SEED-007：首店执行中
 * - DEP-SEED-008 / 003 / 009：广州天河店 · 执行中 / 失败 / 成功
 */
export const DEFAULT_VISIBLE_DEPLOYMENT_SEED_IDS = new Set([
  "DEP-SEED-007",
  "DEP-SEED-008",
  "DEP-SEED-003",
  "DEP-SEED-009",
]);

const GUANGZHOU_TIANHE_STORE_IDS = ["M00000002", "guangzhou-tzh"] as const;
const GUANGZHOU_TIANHE_STORE_NAMES = ["广州天河店"] as const;

function pickStore(
  stores: MockStoreRef[],
  preferredIds: readonly string[],
  preferredNames: readonly string[],
  fallback?: MockStoreRef,
): MockStoreRef {
  const byId = stores.find((s) => preferredIds.includes(s.storeId));
  if (byId) return byId;
  const byName = stores.find((s) => preferredNames.includes(s.storeName));
  if (byName) return byName;
  return fallback ?? stores[0]!;
}

function buildDeploymentSeedBatches(
  stores: ReturnType<typeof listAllMockStores>,
): DeploymentBatch[] {
  const s0 = stores[0]!;
  const s1 = stores[1] ?? s0;
  const s2 = stores[2] ?? s1;
  const gz = pickStore(stores, GUANGZHOU_TIANHE_STORE_IDS, GUANGZHOU_TIANHE_STORE_NAMES, s1);

  const seeds: DeploymentBatch[] = [
    {
      id: "DEP-SEED-007",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "brand.ops.east@menusifu.cn",
      triggeredByName: "李华东运营",
      triggeredAt: minutesAgo(2),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      brandName: s0.brandName,
      storeIds: [s0.storeId],
      targetStoreNames: [s0.storeName],
      configVersions: { "module.settings": 9 },
      configChanges: [
        {
          label: "展示输入手机号",
          before: "关闭",
          after: "开启",
        },
      ],
      originNav: {
        l1Key: "orders",
        l1Title: "订单中心",
        l2Key: "orders-settings",
        l2Title: "订单设置",
        pagePath: "/orders/settings",
      },
      status: "in_progress",
      totalItems: 1,
      successCount: 0,
      failedCount: 0,
      pendingCount: 1,
      simulatorMeta: {
        progressPercent: 38,
        currentPhase: "acking",
        startedAt: minutesAgo(2),
      },
      items: [
        {
          id: "ITM-SEED-071",
          storeId: s0.storeId,
          storeName: s0.storeName,
          domainKey: "module.settings",
          domainDisplayName: "模块设置",
          configVersion: 9,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "pushing",
          retryCount: 0,
          pushedAt: minutesAgo(2),
          targets: [
            {
              id: "TGT-S71",
              productLine: "POS",
              deviceId: `${s0.storeId}-pos-01`,
              deviceName: `${s0.storeName}-POS-01`,
              status: "success",
              localVersion: 9,
              ackedAt: minutesAgo(1),
            },
            {
              id: "TGT-S72",
              productLine: "Kiosk",
              deviceId: `${s0.storeId}-kiosk-01`,
              deviceName: `${s0.storeName}-Kiosk-01`,
              status: "syncing",
            },
            {
              id: "TGT-S73",
              productLine: "eMenu",
              deviceId: `${s0.storeId}-emenu-01`,
              deviceName: `${s0.storeName}-eMenu-01`,
              status: "pending",
            },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-008",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "xiaoming.wang@menusifu.cn",
      triggeredByName: "王小明",
      triggeredAt: minutesAgo(1),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      brandName: gz.brandName ?? s0.brandName,
      storeIds: [gz.storeId],
      targetStoreNames: [gz.storeName],
      configVersions: { "foh.floor-plan": 4 },
      configChanges: [
        {
          label: "餐位平面图",
          before: "2 个区域，18 张桌位",
          after: "3 个区域，22 张桌位",
        },
      ],
      originNav: {
        l1Key: "queue-call",
        l1Title: "前厅管理中心",
        l2Key: "qc-floor-plan",
        l2Title: "餐位平面图",
        pagePath: "/operations/queue-call/floor-plan",
      },
      status: "in_progress",
      totalItems: 1,
      successCount: 0,
      failedCount: 0,
      pendingCount: 1,
      simulatorMeta: {
        progressPercent: 72,
        currentPhase: "acking",
        startedAt: minutesAgo(1),
      },
      items: [
        {
          id: "ITM-SEED-081",
          storeId: gz.storeId,
          storeName: gz.storeName,
          domainKey: "foh.floor-plan",
          domainDisplayName: "餐位平面图",
          configVersion: 4,
          productLines: ["POS", "eMenu"],
          status: "pushing",
          retryCount: 0,
          pushedAt: minutesAgo(1),
          targets: [
            {
              id: "TGT-S81",
              productLine: "POS",
              deviceId: `${gz.storeId}-pos-01`,
              deviceName: `${gz.storeName}-POS-01`,
              status: "success",
              localVersion: 4,
              ackedAt: minutesAgo(1),
            },
            {
              id: "TGT-S82",
              productLine: "eMenu",
              deviceId: `${gz.storeId}-emenu-01`,
              deviceName: `${gz.storeName}-eMenu-01`,
              status: "syncing",
            },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-009",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "brand.ops.east@menusifu.cn",
      triggeredByName: "李华东运营",
      triggeredAt: daysAgo(0, 10, 20),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      brandName: gz.brandName ?? s0.brandName,
      storeIds: [gz.storeId],
      targetStoreNames: [gz.storeName],
      configVersions: { "module.settings": 6 },
      configChanges: [
        {
          label: "展示清桌按钮",
          before: "关闭",
          after: "开启",
        },
      ],
      originNav: {
        l1Key: "orders",
        l1Title: "订单中心",
        l2Key: "orders-settings",
        l2Title: "订单设置",
        pagePath: "/orders/settings",
      },
      status: "success",
      totalItems: 1,
      successCount: 1,
      failedCount: 0,
      pendingCount: 0,
      simulatorMeta: {
        progressPercent: 100,
        currentPhase: "done",
        completedAt: daysAgo(0, 10, 21),
      },
      items: [
        {
          id: "ITM-SEED-091",
          storeId: gz.storeId,
          storeName: gz.storeName,
          domainKey: "module.settings",
          domainDisplayName: "模块设置",
          configVersion: 6,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "success",
          retryCount: 0,
          completedAt: daysAgo(0, 10, 21),
          targets: [
            {
              id: "TGT-S91",
              productLine: "POS",
              deviceId: `${gz.storeId}-pos-01`,
              deviceName: `${gz.storeName}-POS-01`,
              status: "success",
              localVersion: 6,
              ackedAt: daysAgo(0, 10, 21),
            },
            {
              id: "TGT-S92",
              productLine: "Kiosk",
              deviceId: `${gz.storeId}-kiosk-01`,
              deviceName: `${gz.storeName}-Kiosk-01`,
              status: "success",
              localVersion: 6,
              ackedAt: daysAgo(0, 10, 21),
            },
            {
              id: "TGT-S93",
              productLine: "eMenu",
              deviceId: `${gz.storeId}-emenu-01`,
              deviceName: `${gz.storeName}-eMenu-01`,
              status: "success",
              localVersion: 6,
              ackedAt: daysAgo(0, 10, 21),
            },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-001",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "admin@zhangji.com",
      triggeredByName: "张集团管理员",
      triggeredAt: daysAgo(0, 9, 15),
      triggerSource: "demo-seed",
      scopeLevel: stores.length > 1 ? "brand" : "store",
      brandName: s0.brandName,
      storeIds: [s0.storeId],
      targetStoreNames: [s0.storeName],
      configVersions: { "store.hours": 3 },
      configChanges: [
        {
          label: "营业时段",
          before: "周一至周五 10:00–22:00",
          after: "周一至周五 10:00–23:00",
        },
      ],
      originNav: {
        l1Key: "store-mgmt",
        l1Title: "门店信息",
        l2Key: "store-hours",
        l2Title: "营业时间",
        pagePath: "/stores/hours",
      },
      status: "success",
      totalItems: 1,
      successCount: 1,
      failedCount: 0,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(0, 9, 16) },
      items: [
        {
          id: "ITM-SEED-001",
          storeId: s0.storeId,
          storeName: s0.storeName,
          domainKey: "store.hours",
          domainDisplayName: "营业时间",
          configVersion: 3,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "success",
          retryCount: 0,
          pushedAt: daysAgo(0, 9, 15),
          completedAt: daysAgo(0, 9, 16),
          targets: [
            { id: "TGT-S1", productLine: "POS", deviceId: `${s0.storeId}-pos-01`, deviceName: `${s0.storeName}-POS-01`, status: "success", localVersion: 3, ackedAt: daysAgo(0, 9, 16) },
            { id: "TGT-S2", productLine: "Kiosk", deviceId: `${s0.storeId}-kiosk-01`, deviceName: `${s0.storeName}-Kiosk-01`, status: "success", localVersion: 3, ackedAt: daysAgo(0, 9, 16) },
            { id: "TGT-S3", productLine: "eMenu", deviceId: `${s0.storeId}-emenu-01`, deviceName: `${s0.storeName}-eMenu-01`, status: "success", localVersion: 3, ackedAt: daysAgo(0, 9, 16) },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-002",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "ops@zhangji.com",
      triggeredByName: "李华东运营",
      triggeredAt: daysAgo(1, 14, 32),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      brandName: s0.brandName,
      storeIds: [s0.storeId],
      targetStoreNames: [s0.storeName],
      configVersions: { "brand.menu": 12, "brand.menu.channel": 5 },
      configChanges: [
        {
          label: "菜单可见性",
          before: "堂食、外卖",
          after: "堂食、外卖、自取",
        },
      ],
      originNav: {
        l1Key: "product-center-main",
        l1Title: "商品中心",
        l2Key: "bm-menus",
        l2Title: "品牌菜单",
        pagePath: "/brand-menu/menus",
      },
      status: "failed",
      totalItems: 1,
      successCount: 0,
      failedCount: 1,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(1, 14, 33) },
      items: [
        {
          id: "ITM-SEED-021",
          storeId: s0.storeId,
          storeName: s0.storeName,
          domainKey: "brand.menu",
          domainDisplayName: "品牌菜单",
          configVersion: 12,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "failed",
          errorMessage: "设备离线，超过 30s 未响应",
          retryCount: 0,
          completedAt: daysAgo(1, 14, 33),
          targets: [
            { id: "TGT-S21", productLine: "POS", deviceId: `${s0.storeId}-pos-01`, deviceName: `${s0.storeName}-POS-01`, status: "offline", errorDetail: "设备离线，超过 30s 未响应" },
            { id: "TGT-S22", productLine: "Kiosk", deviceId: `${s0.storeId}-kiosk-01`, deviceName: `${s0.storeName}-Kiosk-01`, status: "failed", errorDetail: "跳过（前置失败）" },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-003",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "manager@store.com",
      triggeredByName: "门店经理",
      triggeredAt: daysAgo(2, 11, 5),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      brandName: gz.brandName ?? s0.brandName,
      storeIds: [gz.storeId],
      targetStoreNames: [gz.storeName],
      configVersions: { "module.settings": 2 },
      configChanges: [
        {
          label: "展示输入手机号",
          before: "开启",
          after: "关闭",
        },
      ],
      originNav: {
        l1Key: "orders",
        l1Title: "订单中心",
        l2Key: "orders-settings",
        l2Title: "订单设置",
        pagePath: "/orders/settings",
      },
      status: "failed",
      totalItems: 1,
      successCount: 0,
      failedCount: 1,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(2, 11, 6) },
      items: [
        {
          id: "ITM-SEED-031",
          storeId: gz.storeId,
          storeName: gz.storeName,
          domainKey: "module.settings",
          domainDisplayName: "模块设置",
          configVersion: 2,
          productLines: ["POS"],
          status: "failed",
          errorMessage: "网络超时（模拟）",
          retryCount: 1,
          completedAt: daysAgo(2, 11, 6),
          targets: [
            { id: "TGT-S31", productLine: "POS", deviceId: `${gz.storeId}-pos-01`, deviceName: `${gz.storeName}-POS-01`, status: "failed", errorDetail: "网络超时（模拟）" },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-004",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "hr@zhangji.com",
      triggeredByName: "人事专员",
      triggeredAt: daysAgo(0, 8, 40),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      storeIds: [s0.storeId],
      configVersions: { "team.shift-scheduling": 5 },
      originNav: {
        l1Key: "team",
        l1Title: "团队管理",
        l2Key: "team-shifts",
        l2Title: "排班",
        pagePath: "/team/shift-scheduling",
      },
      status: "success",
      totalItems: 1,
      successCount: 1,
      failedCount: 0,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(0, 8, 41) },
      items: [
        {
          id: "ITM-SEED-041",
          storeId: s0.storeId,
          storeName: s0.storeName,
          domainKey: "team.shift-scheduling",
          domainDisplayName: "排班",
          configVersion: 5,
          productLines: ["POS"],
          status: "success",
          retryCount: 0,
          completedAt: daysAgo(0, 8, 41),
          targets: [
            { id: "TGT-S41", productLine: "POS", deviceId: `${s0.storeId}-pos-01`, deviceName: `${s0.storeName}-POS-01`, status: "success", localVersion: 5, ackedAt: daysAgo(0, 8, 41) },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-006",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "marketing@zhangji.com",
      triggeredByName: "市场运营",
      triggeredAt: daysAgo(0, 7, 5),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      storeIds: [s0.storeId],
      configVersions: { "promo.lottery": 3 },
      originNav: {
        l1Key: "promotions",
        l1Title: "促销中心",
        l2Key: "promo-lottery",
        l2Title: "抽奖活动",
        pagePath: "/promotions/lottery",
      },
      status: "failed",
      totalItems: 1,
      successCount: 0,
      failedCount: 1,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(0, 7, 6) },
      configChanges: [
        {
          label: "抽奖活动开关",
          before: "关闭",
          after: "开启",
        },
      ],
      items: [
        {
          id: "ITM-SEED-061",
          storeId: s0.storeId,
          storeName: s0.storeName,
          domainKey: "promo.lottery",
          domainDisplayName: "抽奖活动",
          configVersion: 3,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "failed",
          errorMessage: "终端存储空间不足",
          retryCount: 0,
          completedAt: daysAgo(0, 7, 6),
          targets: [
            { id: "TGT-S61", productLine: "POS", deviceId: `${s0.storeId}-pos-01`, deviceName: `${s0.storeName}-POS-01`, status: "failed", errorDetail: "终端存储空间不足" },
            { id: "TGT-S62", productLine: "eMenu", deviceId: `${s0.storeId}-emenu-01`, deviceName: `${s0.storeName}-eMenu-01`, status: "offline", errorDetail: "设备离线" },
          ],
        },
      ],
    },
  ];

  return seeds;
}

function persistDeploymentSeedBatches(seeds: DeploymentBatch[]): void {
  for (const batch of seeds) {
    for (const item of batch.items) {
      for (const target of item.targets) {
        if ((target.status as string) === "skipped") {
          (target as { status: string }).status = "failed";
        }
      }
    }
    saveDeploymentBatch(batch);
  }
}

/** 首次进入：写入默认展示种子（含广州天河店成功/失败/执行中） */
export function ensureDeploymentSeedData(): void {
  const stores = listAllMockStores();
  if (stores.length === 0) return;

  const defaults = buildDeploymentSeedBatches(stores).filter((batch) =>
    DEFAULT_VISIBLE_DEPLOYMENT_SEED_IDS.has(batch.id),
  );
  persistDeploymentSeedBatches(defaults);
}

/** 重置演示数据：写入全部种子记录 */
export function seedFullDeploymentDemoData(): void {
  const stores = listAllMockStores();
  if (stores.length === 0) return;

  persistDeploymentSeedBatches(buildDeploymentSeedBatches(stores));
}

/** 已有数据时补全/纠正默认展示记录（幂等；广州天河店固定补齐成功/失败/执行中） */
export function ensureDefaultVisibleDeploymentSeeds(existingBatches: DeploymentBatch[]): DeploymentBatch[] {
  const stores = listAllMockStores();
  if (stores.length === 0) return [];

  const gz = pickStore(stores, GUANGZHOU_TIANHE_STORE_IDS, GUANGZHOU_TIANHE_STORE_NAMES, stores[1] ?? stores[0]);
  const defaults = buildDeploymentSeedBatches(stores).filter((batch) =>
    DEFAULT_VISIBLE_DEPLOYMENT_SEED_IDS.has(batch.id),
  );
  const byId = new Map(existingBatches.map((b) => [b.id, b]));
  const guangzhouSeedIds = new Set(["DEP-SEED-008", "DEP-SEED-003", "DEP-SEED-009"]);

  return defaults.filter((seed) => {
    const cur = byId.get(seed.id);
    if (!cur) return true;
    if (!guangzhouSeedIds.has(seed.id)) return false;
    const storeOk = cur.storeIds.includes(gz.storeId);
    const statusOk = cur.status === seed.status;
    return !storeOk || !statusOk;
  });
}
