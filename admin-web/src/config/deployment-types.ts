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

/** 变更预览结构化子行（逐行改前 → 改后） */
export interface ChangeDetailRow {
  key: string;
  label: string;
  before: string;
  after: string;
}

/** 集合内实体操作类型 */
export type EntityChangeOp = "create" | "update" | "delete";

/** 实体字段差异行 */
export interface EntityFieldChange {
  key: string;
  label: string;
  before: string;
  after: string;
}

/** 集合变更中的单个实体块 */
export interface EntityChangeBlock {
  /** 稳定 id，如 employee:e_12、table:t_3 */
  entityKey: string;
  /** 展示名，如「张三」「A1」 */
  entityLabel: string;
  operation: EntityChangeOp;
  fields: EntityFieldChange[];
}

/** 单次配置变更快照（修改前 → 修改后） */
export interface DeploymentConfigChange {
  fieldKey?: string;
  /** 功能设置名称（含子项，如「展示清桌按钮 · 适用产线」） */
  label: string;
  /** 操作类型（如「勾选产线 eMenu」「修改数值」）；集合可为「新增 2 · 修改 1」 */
  operation?: string;
  before: string;
  after: string;
  /** 发起菜单路径（用于配置域与导航解析） */
  settingsPath?: string;
  /** 导航分组路径，如 ["前厅管理中心", "设置", "账户安全与授权"] */
  groupPath?: string[];
  /** 结构化子行；设置项预览优先使用 */
  details?: ChangeDetailRow[];
  /** CRUD 集合结构化明细；预览优先于 details */
  entities?: EntityChangeBlock[];
  /** 缺省：有 entities → collection，否则 setting */
  changeKind?: "setting" | "collection";
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
  /** 操作人姓名（创建时快照，与 triggeredBy 邮箱对应） */
  triggeredByName?: string;
  triggeredAt: string;
  triggerSource: DeploymentTriggerSource;

  scopeLevel: DeploymentScopeLevel;
  brandId?: string;
  brandName?: string;
  storeIds: string[];
  /** 下发目标门店名称（创建时快照，便于记录页展示） */
  targetStoreNames?: string[];

  configVersions: Record<string, number>;
  originNav: DeploymentOriginNav;
  /** 本次下发关联的配置变更明细 */
  configChanges?: DeploymentConfigChange[];

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
  configChanges?: DeploymentConfigChange[];
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
