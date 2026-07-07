/**
 * 模拟下发 · 类型定义（对齐云端下发本地方案，演示环境 isMock 恒为 true）
 */

export type DeploymentBatchStatus =
  | "pending"
  | "in_progress"
  | "partial_success"
  | "success"
  | "failed"
  | "cancelled";

export type DeploymentItemStatus =
  | "pending"
  | "pushing"
  | "success"
  | "failed"
  | "skipped"
  | "timeout";

export type DeploymentTargetStatus =
  | "pending"
  | "syncing"
  | "success"
  | "failed"
  | "offline";

export type DeploymentTriggerSource =
  | "manual"
  | "auto"
  | "scheduled"
  | "rollback"
  | "bulk"
  | "demo-seed";

export type DeploymentScopeLevel = "group" | "brand" | "store";

export type DeploymentSimulatorPhase = "creating" | "pushing" | "acking" | "done";

export interface DeploymentOriginNav {
  l1Key: string;
  l1Title: string;
  l2Key: string;
  l2Title: string;
  l3GroupKey?: string;
  pagePath: string;
}

export interface DeploymentSimulatorMeta {
  startedAt?: string;
  completedAt?: string;
  progressPercent: number;
  currentPhase: DeploymentSimulatorPhase;
}

export interface DeploymentTarget {
  id: string;
  productLine: string;
  deviceId: string;
  deviceName: string;
  status: DeploymentTargetStatus;
  localVersion?: number;
  ackedAt?: string;
  errorDetail?: string;
}

export interface DeploymentItem {
  id: string;
  storeId: string;
  storeName: string;
  domainKey: string;
  domainDisplayName: string;
  configVersion: number;
  productLines: string[];
  status: DeploymentItemStatus;
  errorCode?: string;
  errorMessage?: string;
  pushedAt?: string;
  completedAt?: string;
  retryCount: number;
  targets: DeploymentTarget[];
}

export interface DeploymentBatch {
  id: string;
  merchantId: string;
  isMock: true;

  triggeredBy: string;
  triggeredAt: string;
  triggerSource: DeploymentTriggerSource;

  scopeLevel: DeploymentScopeLevel;
  brandId?: string;
  brandName?: string;
  storeIds: string[];

  configVersions: Record<string, number>;
  originNav: DeploymentOriginNav;

  status: DeploymentBatchStatus;
  totalItems: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;

  items: DeploymentItem[];

  simulatorMeta?: DeploymentSimulatorMeta;
}

export interface StoreDomainCursor {
  cloudVersion: number;
  deployedVersion: number;
  lastDeployedAt?: string;
}

export interface StoreConfigCursor {
  storeId: string;
  domains: Record<string, StoreDomainCursor>;
}

export interface DeploymentListFilter {
  domainKey?: string;
  status?: DeploymentBatchStatus | "";
  storeId?: string;
  keyword?: string;
}

export interface CreateDeploymentInput {
  domainKeys: string[];
  storeIds: string[];
  originNav: DeploymentOriginNav;
  scopeLevel: DeploymentScopeLevel;
  brandId?: string;
  brandName?: string;
  triggerSource?: DeploymentTriggerSource;
}

export interface DeploymentScopeOption {
  id: "current" | "brand_all";
  label: string;
  storeIds: string[];
  scopeLevel: DeploymentScopeLevel;
  brandId?: string;
  brandName?: string;
}

export interface DeploymentPreview {
  domains: Array<{ domainKey: string; displayName: string; version: number }>;
  storeCount: number;
  deviceCounts: Record<string, number>;
  totalDevices: number;
}
