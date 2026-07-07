/** M 平台 · 品牌管理中心 · 类型 */

export type MerchantStatus = "draft" | "onboarding" | "active" | "suspended" | "closing" | "closed";

export type MerchantOrgType = "single-store" | "chain";

export type MerchantOrgStoreStatus = "preparing" | "open" | "closed" | "archived";

export type MerchantLicenseStatus = "active" | "expiring" | "expired" | "suspended";

export type CrmContractStatus = "draft" | "signed" | "active" | "renewal" | "expired";

export interface EnterpriseTenant {
  enterpriseId: string;
  name: string;
  code: string;
  region: string;
}

export type EnterpriseGroupStatus = "active" | "inactive";

/** M 平台 · 集团（一个集团可包含多个入驻品牌） */
export interface EnterpriseGroup {
  groupId: string;
  enterpriseId: string;
  name: string;
  code: string;
  description?: string;
  status: EnterpriseGroupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseMerchant {
  merchantId: string;
  enterpriseId: string;
  /** 所属集团 */
  groupId: string;
  /** 品牌 Business Id（B00000000） */
  bid?: string;
  name: string;
  code: string;
  orgType: MerchantOrgType;
  status: MerchantStatus;
  timezone: string;
  locale: string;
  /** 门店地址（POS 申请 / 档案同步） */
  address?: string;
  contactName?: string;
  contactPhone?: string;
  contractExpiresAt?: string;
  crmContractId?: string;
  crmAccountId?: string;
  contractStatus?: CrmContractStatus;
  crmLastSyncedAt?: string;
  licenseAutoSuspend?: boolean;
  licenseStatus?: MerchantLicenseStatus;
  suspendedReason?: string;
  primaryAdminEmail?: string;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  onboardingInviteSentAt?: string;
  onboardingCompletedAt?: string;
  closingStartedAt?: string;
  closingEndsAt?: string;
  closedAt?: string;
  notes?: string;
}

export interface MerchantOrgBrand {
  brandId: string;
  merchantId: string;
  name: string;
  code: string;
  status: "active" | "inactive";
}

export interface MerchantOrgRegion {
  regionId: string;
  merchantId: string;
  brandId: string;
  name: string;
  code: string;
}

export interface MerchantOrgStore {
  /** 门店 MID（M00000000） */
  storeId: string;
  /** 组织归属品牌（连锁总部等） */
  merchantId: string;
  /** 挂载的入驻品牌 */
  linkedMerchantId: string;
  brandId: string;
  regionId: string;
  name: string;
  code: string;
  status: MerchantOrgStoreStatus;
  address?: string;
  openedAt?: string;
  mountedAt?: string;
}

export type MerchantServiceBillingType = "included" | "paid";

export interface MerchantServiceSubscription {
  serviceId: string;
  enabled: boolean;
  /** 节点键（permission-registry / 平台预设四级树 key） */
  nodeKey?: string;
  billingType?: MerchantServiceBillingType;
  effectiveFrom?: string;
  effectiveTo?: string;
  storeScope: "all" | "regions" | "stores";
  scopeIds?: string[];
}

export interface MerchantCapabilitySnapshot {
  merchantId: string;
  businessTypeIds: string[];
  productLineIds: string[];
  presetCombos: { businessTypeId: string; productLineId: string; version: number }[];
  services: MerchantServiceSubscription[];
  syncedPresetAt?: string;
}

export interface MerchantChangeLogEntry {
  id: string;
  enterpriseId?: string;
  merchantId: string;
  action: string;
  operatorEmail: string;
  detail: string;
  at: string;
}

export type MerchantRequestStatus = "pending" | "approved" | "rejected";

/** 本地 POS 发起的门店开通申请（通过后分配 BID 并创建入驻品牌） */
export interface PosStoreProvisioningRequest {
  requestId: string;
  enterpriseId: string;
  /** 品牌名（M 平台入驻主体）；缺省时勿用门店地址名 */
  brandName?: string;
  storeName: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  posDeviceId?: string;
  posLocation?: string;
  applicantNote?: string;
  status: MerchantRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdBid?: string;
  createdMerchantId?: string;
  rejectReason?: string;
}

export interface MerchantProvisioningRequest {
  requestId: string;
  enterpriseId: string;
  merchantName: string;
  orgType: MerchantOrgType;
  contactName: string;
  contactPhone?: string;
  primaryAdminEmail: string;
  applicantEmail: string;
  applicantOrg?: string;
  notes?: string;
  status: MerchantRequestStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdMerchantId?: string;
  rejectReason?: string;
}

export interface MerchantImpersonationLog {
  id: string;
  merchantId: string;
  merchantName: string;
  operatorEmail: string;
  startedAt: string;
  endedAt?: string;
  endedReason?: "manual" | "timeout";
}

export type MerchantTodoKind = "request" | "onboarding" | "contract" | "closing" | "license";

export interface MerchantSlaMetrics {
  merchantId: string;
  uptimePct: number;
  openTickets: number;
  p1Tickets: number;
  avgResponseMin: number;
  monthOrders: number;
  lastIncidentAt?: string;
}

export interface MerchantReportSummary {
  merchantCount: number;
  activeCount: number;
  avgUptimePct: number;
  openTickets: number;
  p1Tickets: number;
  licenseExpiredCount: number;
  licenseExpiringCount: number;
}

export interface EnterpriseMerchantSnapshot {
  enterprises: EnterpriseTenant[];
  groups: EnterpriseGroup[];
  merchants: EnterpriseMerchant[];
  brands: MerchantOrgBrand[];
  regions: MerchantOrgRegion[];
  stores: MerchantOrgStore[];
  capabilities: MerchantCapabilitySnapshot[];
  changelog: MerchantChangeLogEntry[];
  requests: MerchantProvisioningRequest[];
  posStoreRequests: PosStoreProvisioningRequest[];
  /** BID 序号（用于生成 B00000000） */
  bidSeq?: number;
  /** MID 序号（用于生成 M00000000） */
  midSeq?: number;
  impersonationLogs: MerchantImpersonationLog[];
  slaMetrics: MerchantSlaMetrics[];
}

export interface MerchantFilter {
  status?: MerchantStatus | "";
  orgType?: MerchantOrgType | "";
  groupId?: string;
  query?: string;
  /** 为 true 时不按当前 Enterprise 过滤（品牌列表展示全部） */
  allEnterprises?: boolean;
  /** 排除连锁 org 挂载的门店租户（linkedMerchantId，非独立品牌） */
  excludeLinkedStoreTenants?: boolean;
}

export interface GroupFilter {
  status?: EnterpriseGroupStatus | "";
  query?: string;
  /** 指定 Enterprise；集团管理等场景可固定为米聚企业 */
  enterpriseId?: string;
  /** 为 true 时不按 Enterprise 过滤 */
  allEnterprises?: boolean;
}

export interface EnterpriseStoreListFilter {
  groupId?: string;
  merchantId?: string;
  status?: MerchantOrgStoreStatus | "";
  query?: string;
  /** 为 true 时不按当前 Enterprise 过滤（门店列表展示全部） */
  allEnterprises?: boolean;
}

export interface EnterpriseStoreListRow {
  store: MerchantOrgStore;
  enterpriseId: string;
  enterpriseName: string;
  groupId: string;
  groupName: string;
  merchantId: string;
  merchantName: string;
  merchantBid?: string;
  regionName?: string;
  linkedMerchantName?: string;
}

export interface UpdateMerchantCapabilityInput {
  businessTypeIds: string[];
  productLineIds: string[];
  services?: { serviceId: string; enabled: boolean; billingType?: MerchantServiceBillingType; nodeKey?: string }[];
  includedSelection?: Record<string, import("./platform-preset-node-selection").PlatformPresetNodeSelection>;
  paidSelection?: Record<string, import("./platform-preset-node-selection").PlatformPresetNodeSelection>;
  syncToMerchant?: boolean;
  forceSync?: boolean;
}

/** @deprecated 请使用 MountMerchantStoreInput */
export interface AddMerchantStoreInput {
  merchantId: string;
  name: string;
  address?: string;
  brandId?: string;
  regionId?: string;
  status?: MerchantOrgStoreStatus;
}

/** 将企业下已有入驻品牌挂载为组织门店 */
export interface MountMerchantStoreInput {
  orgMerchantId: string;
  linkedMerchantId: string;
  brandId?: string;
  regionId?: string;
  status?: MerchantOrgStoreStatus;
}

export interface SubmitPosStoreRequestInput {
  brandName?: string;
  storeName: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  posDeviceId?: string;
  posLocation?: string;
  applicantNote?: string;
}

export interface CreateMerchantInput {
  name: string;
  code: string;
  groupId: string;
  orgType: MerchantOrgType;
  timezone: string;
  contactName: string;
  contactPhone?: string;
  primaryAdminEmail: string;
  businessTypeIds: string[];
  productLineIds: string[];
  /** 指定 BID（POS 审批通过时使用） */
  bid?: string;
  firstStoreName?: string;
  firstStoreAddress?: string;
  activateImmediately?: boolean;
  sendInviteEmail?: boolean;
}

export interface CreateGroupInput {
  name: string;
  code?: string;
  description?: string;
}

export interface UpdateGroupInput {
  name: string;
  description?: string;
  status?: EnterpriseGroupStatus;
}

export interface SubmitProvisioningRequestInput {
  merchantName: string;
  orgType: MerchantOrgType;
  contactName: string;
  contactPhone?: string;
  primaryAdminEmail: string;
  applicantEmail: string;
  applicantOrg?: string;
  notes?: string;
}

export interface MerchantTodoItem {
  id: string;
  kind: MerchantTodoKind;
  title: string;
  detail: string;
  href: string;
  merchantId?: string;
  requestId?: string;
  priority: "high" | "normal";
  at?: string;
}

export interface RenewMerchantContractInput {
  contractExpiresAt: string;
  crmContractId?: string;
  contractStatus?: CrmContractStatus;
  restoreActive?: boolean;
}

/** @deprecated 请使用 enterprise-merchant-services · MERCHANT_PAID_SERVICE_MODULES */
export const MERCHANT_SERVICE_CATALOG: {
  serviceId: string;
  name: string;
  description: string;
}[] = [
  { serviceId: "svc-advanced-report", name: "高级报表", description: "多店对比、自定义报表" },
  { serviceId: "svc-member-plus", name: "会员 Plus", description: "等级、储值、营销自动化" },
  { serviceId: "svc-delivery-hub", name: "外卖聚合", description: "多平台订单接入" },
  { serviceId: "svc-hardware-monitor", name: "硬件监控", description: "企业级硬件资产中心" },
  { serviceId: "svc-api-open", name: "Open API", description: "第三方对接配额" },
];
