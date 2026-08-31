export type PitRole = "admin" | "editor" | "viewer";
export type PitRequirementStatus =
  | "review_pending"
  | "design_pending"
  | "scheduling_pending"
  | "development"
  | "testing"
  | "completed"
  | "paused"
  | "rejected";
export type PitPriority = "urgent" | "high" | "medium" | "low";
export type PitAssigneeRole = "owner" | "developer" | "tester";
export type PitTransitionAction = "advance" | "return" | "pause" | "resume" | "reject" | "reopen";

export type PitApiMeta = { requestId: string; [key: string]: unknown };
export type PitApiEnvelope<T> = { data: T; meta: PitApiMeta };
export type PitApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, unknown>;
  requestId?: string;
};
export type PitApiErrorEnvelope = { error: PitApiErrorBody };

export type PitUser = {
  id: string;
  username: string;
  displayName: string;
  role: PitRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PitSetupStatus = { needsBootstrap: boolean };
export type PitBootstrapInput = { token: string; username: string; displayName: string; password: string };
export type PitLoginInput = { username: string; password: string };
export type PitAuthMe = { user: PitUser; csrfToken: string };

export type PitDictionaryType = "product_line" | "requirement_source" | "requirement_type" | "problem_category" | "industry";
export type PitDictionaryItem = {
  id: string;
  type: PitDictionaryType;
  code: string;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type PitDictionaryCreateInput = Pick<PitDictionaryItem, "type" | "code" | "label"> & Partial<Pick<PitDictionaryItem, "sortOrder" | "active">>;
export type PitDictionaryUpdateInput = Partial<Pick<PitDictionaryItem, "label" | "sortOrder" | "active">>;

export type PitAssignee = {
  id: string;
  role: PitAssigneeRole;
  userId: string | null;
  displayName: string;
  sortOrder: number;
};
export type PitRequirementRelation = { id: string; code: string; label: string; active?: boolean };
export type PitRequirementListItem = {
  id: string;
  requirementNo: string;
  jiraTicket: string | null;
  title: string;
  summary: string;
  productLines: PitRequirementRelation[];
  requirementType: PitRequirementRelation | null;
  source: PitRequirementRelation | null;
  problemCategory: PitRequirementRelation | null;
  industry: PitRequirementRelation | null;
  status: PitRequirementStatus;
  priority: PitPriority | null;
  owner: { id: string | null; displayName: string } | null;
  isHighlighted: boolean;
  following: boolean;
  rowVersion: number;
  deletedAt: string | null;
  updatedAt: string;
};
export type PitRequirement = Omit<PitRequirementListItem, "summary" | "owner"> & {
  description: string;
  requirementTypeId: string | null;
  sourceId: string | null;
  problemCategoryId: string | null;
  industryId: string | null;
  useCase: string | null;
  notes: string | null;
  requirementType: PitRequirementRelation | null;
  source: PitRequirementRelation | null;
  problemCategory: PitRequirementRelation | null;
  industry: PitRequirementRelation | null;
  customerManager: string | null;
  implementationSide: "frontend" | "backend" | "both" | null;
  proposedAt: string | null;
  plannedYear: number | null;
  plannedMonth: number | null;
  versionNo: string | null;
  developmentStartedAt: string | null;
  developmentCompletedAt: string | null;
  posMergeVersion: string | null;
  pausedFromStatus: PitRequirementStatus | null;
  sourceSheet: string | null;
  sourceRow: number | null;
  sourceStatus: string | null;
  importJobId: string | null;
  mids: string[];
  assignees: PitAssignee[];
  deletedBy: { id: string; displayName: string } | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  recentEvents?: PitAuditEvent[];
};

export type PitAssigneeInput = { role: PitAssigneeRole; userId?: string | null; displayName: string };

export type PitRequirementWriteInput = {
  jiraTicket?: string | null;
  title: string;
  description: string;
  useCase?: string | null;
  notes?: string | null;
  priority?: PitPriority | null;
  requirementTypeId?: string | null;
  sourceId?: string | null;
  problemCategoryId?: string | null;
  industryId?: string | null;
  customerManager?: string | null;
  implementationSide?: "frontend" | "backend" | "both" | null;
  proposedAt?: string | null;
  plannedYear?: number | null;
  plannedMonth?: number | null;
  versionNo?: string | null;
  developmentStartedAt?: string | null;
  developmentCompletedAt?: string | null;
  posMergeVersion?: string | null;
  isHighlighted?: boolean;
  productLineIds?: string[];
  mids?: string[];
  assignees?: PitAssigneeInput[];
};
export type PitRequirementPatchInput = Partial<PitRequirementWriteInput> & { rowVersion: number };
export type PitRequirementTransitionInput = {
  action: PitTransitionAction;
  targetStatus?: PitRequirementStatus;
  reason?: string;
  rowVersion: number;
};

export type PitRequirementListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  productLine?: string[];
  status?: PitRequirementStatus[];
  priority?: PitPriority[];
  requirementType?: string[];
  problemCategory?: string[];
  source?: string[];
  owner?: string[];
  highlighted?: boolean;
  plannedYear?: number[];
  plannedMonth?: number[];
  proposedFrom?: string;
  proposedTo?: string;
  mine?: boolean;
  followed?: boolean;
  deleted?: "only" | "include";
  sort?: "updatedAt" | "-updatedAt" | "createdAt" | "-createdAt" | "priority" | "-priority" | "plannedDate" | "-plannedDate";
};
export type PitRequirementList = { items: PitRequirementListItem[]; page: number; pageSize: number; total: number };

export type PitDashboardSummary = {
  total: number;
  review: number;
  schedulingPending: number;
  development: number;
  testing: number;
  completed: number;
  highlighted: number;
  mine: number;
  followed: number;
  overdue: number;
  byStatus: Partial<Record<PitRequirementStatus, number>>;
  [key: string]: unknown;
};

export type PitAuditEvent = {
  id: string;
  actor?: Pick<PitUser, "id" | "username" | "displayName"> | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  before: unknown | null;
  after: unknown | null;
  metadata: unknown | null;
  createdAt: string;
};
export type PitAuditQuery = {
  page?: number;
  pageSize?: number;
  actorUserId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  from?: string;
  to?: string;
};

export type PitUserCreateInput = { username: string; displayName: string; password: string; role: PitRole; active?: boolean };
export type PitUserUpdateInput = Partial<Pick<PitUser, "username" | "displayName" | "role" | "active">>;

export type PitImportRowAction = "keep_separate" | "merge" | "skip";
export type PitImportRowDecision = {
  rowId: string;
  action: PitImportRowAction;
  mergeTargetRowId?: string;
  existingRequirementId?: string;
  fieldPriority?: string[];
  fieldStrategy?: Record<string, "existing" | "source">;
};
export type PitImportDuplicateDecision = {
  jiraTicket: string;
  action: PitImportRowAction;
  targetRowId?: string;
  fieldPriority?: string[];
};
export type PitImportStatusMapping = { source: string; status: PitRequirementStatus };
export type PitImportDictionaryMapping = {
  type: PitDictionaryType;
  source: string;
  action: "create" | "map" | "clear";
  label?: string;
  dictionaryId?: string;
};
export type PitImportHighlightDecision = { rowNumber: number; action: "match" | "skip"; targetRowId?: string };
export type PitImportDecisionsInput = {
  rows?: PitImportRowDecision[];
  duplicateGroups?: PitImportDuplicateDecision[];
  statusMappings?: PitImportStatusMapping[];
  dictionaryMappings?: PitImportDictionaryMapping[];
  highlights?: PitImportHighlightDecision[];
};
export type PitImportDecision = PitImportRowDecision;
export type PitImportIssue = {
  code: string;
  severity: "blocking" | "warning" | string;
  message?: string;
  field?: string;
  sourceValue?: string;
  dictionaryType?: PitDictionaryType;
  suggestion?: string;
  [key: string]: unknown;
};
export type PitImportNormalizedRow = {
  jiraTicket: string | null;
  title: string | null;
  description: string;
  useCase: string | null;
  notes: string | null;
  requirementSource: string | null;
  requirementType: string | null;
  industry: string | null;
  customerManager: string | null;
  sourceStatus: string;
  statusSuggestion: PitRequirementStatus | null;
  productLines: string[];
  implementationSide: "frontend" | "backend" | "both" | null;
  developers: string[];
  testers: string[];
  priority: PitPriority | null;
  problemCategory: string | null;
  mids: string[];
  versionNo: string | null;
  proposedAt: string | null;
  plannedYear: number | null;
  plannedMonth: number | null;
  developmentStartedAt: string | null;
  developmentCompletedAt: string | null;
  posMergeVersion: string | null;
  [key: string]: unknown;
};
export type PitImportSummary = {
  totalRows: number;
  importableRows: number;
  missingTicketCount: number;
  duplicateGroupCount: number;
  unknownStatusCount: number;
  unknownDictionaryCount: number;
  highlightMatches: { matched: number; ambiguous: number; unmatched: number };
  ignoredSheets: string[];
  blockingIssueCount: number;
};
export type PitImportJob = {
  id: string;
  fileName: string;
  fileHash: string;
  status: string;
  summary: PitImportSummary;
  decisions: PitImportDecisionsInput;
  sourcePath: string | null;
  createdBy: string;
  createdAt: string;
  committedAt: string | null;
  errorMessage: string | null;
};
export type PitImportRow = {
  id: string;
  sheetName: string;
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: PitImportNormalizedRow;
  issues: PitImportIssue[];
  decision?: PitImportDecision | null;
};
export type PitImportDetail = {
  job: PitImportJob;
  rows: PitImportRow[];
  page: number;
  pageSize: number;
  total: number;
  issues: PitImportIssue[];
  duplicateGroups: Array<{ jiraTicket: string; rowIds: string[]; [key: string]: unknown }>;
  highlights: Array<{ rowNumber: number; match: "matched" | "ambiguous" | "unmatched"; matchedRowIds: string[]; issues: PitImportIssue[]; [key: string]: unknown }>;
};

export type PitExportJob = {
  id: string;
  filter: PitRequirementListQuery;
  rowCount: number | null;
  fileName: string | null;
  status: string;
  errorMessage: string | null;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  expired: boolean;
  downloadable: boolean;
};
export type PitBackupRecord = {
  id: string;
  kind: string;
  fileName: string;
  manifestName: string;
  sha256: string;
  byteSize: number;
  schemaVersion: number;
  createdBy: string | null;
  createdAt: string;
};
export type PitHealth = {
  status: "ok" | "degraded";
  database: { status: "ok" | "error"; integrity: "ok" | "failed" | "unavailable"; schemaVersion: number | null };
  backup: { status: string; lastCreatedAt: string | null; schemaVersion?: number; byteSize?: number };
  process: { status: "ok"; uptimeSeconds: number; runtime: string; runtimeVersion: string };
};

export type PitPage<T> = { items: T[]; page: number; pageSize: number; total: number };
