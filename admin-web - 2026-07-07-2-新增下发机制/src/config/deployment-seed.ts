/**
 * 模拟下发 · 演示种子数据
 */
import { listAllMockStores } from "./deployment-mock-devices";
import { saveDeploymentBatch } from "./deployment-store";
import type { DeploymentBatch } from "./deployment-types";

function daysAgo(days: number, hours = 10, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function ensureDeploymentSeedData(): void {
  const stores = listAllMockStores();
  if (stores.length === 0) return;

  const s0 = stores[0]!;
  const s1 = stores[1] ?? s0;
  const s2 = stores[2] ?? s1;

  const seeds: DeploymentBatch[] = [
    {
      id: "DEP-SEED-001",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "admin@zhangji.com",
      triggeredAt: daysAgo(0, 9, 15),
      triggerSource: "demo-seed",
      scopeLevel: stores.length > 1 ? "brand" : "store",
      brandName: s0.brandName,
      storeIds: [s0.storeId],
      configVersions: { "store.hours": 3 },
      originNav: {
        l1Key: "store-mgmt",
        l1Title: "门店管理",
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
      triggeredAt: daysAgo(1, 14, 32),
      triggerSource: "demo-seed",
      scopeLevel: stores.length > 2 ? "group" : "brand",
      brandName: s0.brandName,
      storeIds: [s0.storeId, s1.storeId, s2.storeId],
      configVersions: { "brand.menu": 12, "brand.menu.channel": 5 },
      originNav: {
        l1Key: "product-center-main",
        l1Title: "商品中心",
        l2Key: "bm-menus",
        l2Title: "品牌菜单",
        pagePath: "/brand-menu/menus",
      },
      status: "partial_success",
      totalItems: 3,
      successCount: 2,
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
          status: "success",
          retryCount: 0,
          completedAt: daysAgo(1, 14, 33),
          targets: [
            { id: "TGT-S21", productLine: "POS", deviceId: `${s0.storeId}-pos-01`, deviceName: `${s0.storeName}-POS-01`, status: "success", localVersion: 12, ackedAt: daysAgo(1, 14, 33) },
            { id: "TGT-S22", productLine: "Kiosk", deviceId: `${s0.storeId}-kiosk-01`, deviceName: `${s0.storeName}-Kiosk-01`, status: "success", localVersion: 12, ackedAt: daysAgo(1, 14, 33) },
          ],
        },
        {
          id: "ITM-SEED-022",
          storeId: s1.storeId,
          storeName: s1.storeName,
          domainKey: "brand.menu",
          domainDisplayName: "品牌菜单",
          configVersion: 12,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "success",
          retryCount: 0,
          completedAt: daysAgo(1, 14, 33),
          targets: [
            { id: "TGT-S23", productLine: "POS", deviceId: `${s1.storeId}-pos-01`, deviceName: `${s1.storeName}-POS-01`, status: "success", localVersion: 12, ackedAt: daysAgo(1, 14, 33) },
          ],
        },
        {
          id: "ITM-SEED-023",
          storeId: s2.storeId,
          storeName: s2.storeName,
          domainKey: "brand.menu",
          domainDisplayName: "品牌菜单",
          configVersion: 12,
          productLines: ["POS", "Kiosk", "eMenu"],
          status: "failed",
          errorMessage: "设备离线，超过 30s 未响应",
          retryCount: 0,
          completedAt: daysAgo(1, 14, 33),
          targets: [
            { id: "TGT-S24", productLine: "POS", deviceId: `${s2.storeId}-pos-01`, deviceName: `${s2.storeName}-POS-01`, status: "offline", errorDetail: "设备离线，超过 30s 未响应" },
            { id: "TGT-S25", productLine: "Kiosk", deviceId: `${s2.storeId}-kiosk-01`, deviceName: `${s2.storeName}-Kiosk-01`, status: "failed", errorDetail: "跳过（前置失败）" },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-003",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "manager@store.com",
      triggeredAt: daysAgo(2, 11, 5),
      triggerSource: "demo-seed",
      scopeLevel: "store",
      storeIds: [s1.storeId],
      configVersions: { "module.settings": 2 },
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
          storeId: s1.storeId,
          storeName: s1.storeName,
          domainKey: "module.settings",
          domainDisplayName: "模块设置",
          configVersion: 2,
          productLines: ["POS"],
          status: "failed",
          errorMessage: "网络超时（模拟）",
          retryCount: 1,
          completedAt: daysAgo(2, 11, 6),
          targets: [
            { id: "TGT-S31", productLine: "POS", deviceId: `${s1.storeId}-pos-01`, deviceName: `${s1.storeName}-POS-01`, status: "failed", errorDetail: "网络超时（模拟）" },
          ],
        },
      ],
    },
    {
      id: "DEP-SEED-004",
      merchantId: "demo-merchant",
      isMock: true,
      triggeredBy: "hr@zhangji.com",
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
      status: "partial_success",
      totalItems: 1,
      successCount: 0,
      failedCount: 1,
      pendingCount: 0,
      simulatorMeta: { progressPercent: 100, currentPhase: "done", completedAt: daysAgo(0, 7, 6) },
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
