import type {
  PitAssigneeInput,
  PitPriority,
  PitRequirement,
  PitRequirementPatchInput,
  PitRequirementStatus,
  PitRequirementWriteInput,
  PitRole,
  PitTransitionAction,
} from "./pit-types";

export type PitRequirementForm = {
  rowVersion?: number;
  jiraTicket: string;
  title: string;
  description: string;
  useCase: string;
  notes: string;
  priority: PitPriority | "";
  requirementTypeId: string;
  sourceId: string;
  problemCategoryId: string;
  industryId: string;
  customerManager: string;
  implementationSide: "frontend" | "backend" | "both" | "";
  proposedAt: string;
  plannedYear: string;
  plannedMonth: string;
  versionNo: string;
  developmentStartedAt: string;
  developmentCompletedAt: string;
  posMergeVersion: string;
  isHighlighted: boolean;
  productLineIds: string[];
  mids: string[];
  assignees: PitAssigneeInput[];
};

export type PitRequirementFormErrors = Partial<Record<keyof PitRequirementForm, string>>;
export type PitRequirementAction = { action: PitTransitionAction; label: string; targetStatus?: PitRequirementStatus; reasonRequired: boolean; danger?: boolean };

const ADVANCE: Partial<Record<PitRequirementStatus, PitRequirementStatus>> = {
  review_pending: "design_pending", design_pending: "scheduling_pending", scheduling_pending: "development",
  development: "testing", testing: "completed",
};

export function emptyPitRequirementForm(): PitRequirementForm {
  return {
    jiraTicket: "", title: "", description: "", useCase: "", notes: "", priority: "",
    requirementTypeId: "", sourceId: "", problemCategoryId: "", industryId: "", customerManager: "",
    implementationSide: "", proposedAt: "", plannedYear: "", plannedMonth: "", versionNo: "",
    developmentStartedAt: "", developmentCompletedAt: "", posMergeVersion: "", isHighlighted: false,
    productLineIds: [], mids: [], assignees: [],
  };
}

export function requirementToForm(requirement: PitRequirement): PitRequirementForm {
  return {
    rowVersion: requirement.rowVersion,
    jiraTicket: requirement.jiraTicket ?? "", title: requirement.title, description: requirement.description,
    useCase: requirement.useCase ?? "", notes: requirement.notes ?? "", priority: requirement.priority ?? "",
    requirementTypeId: requirement.requirementTypeId ?? "", sourceId: requirement.sourceId ?? "",
    problemCategoryId: requirement.problemCategoryId ?? "", industryId: requirement.industryId ?? "",
    customerManager: requirement.customerManager ?? "", implementationSide: requirement.implementationSide ?? "",
    proposedAt: requirement.proposedAt ?? "", plannedYear: requirement.plannedYear?.toString() ?? "",
    plannedMonth: requirement.plannedMonth?.toString() ?? "", versionNo: requirement.versionNo ?? "",
    developmentStartedAt: requirement.developmentStartedAt ?? "", developmentCompletedAt: requirement.developmentCompletedAt ?? "",
    posMergeVersion: requirement.posMergeVersion ?? "", isHighlighted: requirement.isHighlighted,
    productLineIds: requirement.productLines.map((item) => item.id), mids: [...requirement.mids],
    assignees: requirement.assignees.map(({ role, userId, displayName }) => ({ role, userId, displayName })),
  };
}

export function validatePitRequirementForm(form: PitRequirementForm): PitRequirementFormErrors {
  const errors: PitRequirementFormErrors = {};
  if (!form.title.trim()) errors.title = "请填写需求标题";
  else if (form.title.trim().length > 500) errors.title = "标题不能超过 500 个字符";
  if (!form.description.trim()) errors.description = "请填写需求描述";
  if (form.assignees.filter((item) => item.role === "owner").length > 1) errors.assignees = "负责人最多一人";
  if (form.assignees.some((item) => !item.displayName.trim())) errors.assignees = "人员姓名不能为空";
  if (form.plannedYear && (!/^\d{4}$/.test(form.plannedYear) || Number(form.plannedYear) < 1900)) errors.plannedYear = "计划年度不合法";
  if (form.plannedMonth && (!/^\d{1,2}$/.test(form.plannedMonth) || Number(form.plannedMonth) < 1 || Number(form.plannedMonth) > 12)) errors.plannedMonth = "计划月份应为 1–12";
  if (new Set(form.productLineIds).size !== form.productLineIds.length) errors.productLineIds = "产品线不能重复";
  if (form.mids.some((mid) => !mid.trim()) || new Set(form.mids.map((mid) => mid.trim())).size !== form.mids.length) errors.mids = "MID 不能为空或重复";
  return errors;
}

const nullable = (value: string): string | null => value.trim() || null;
export function formToCreateOrPatchBody(form: PitRequirementForm, mode: "create"): PitRequirementWriteInput;
export function formToCreateOrPatchBody(form: PitRequirementForm, mode: "patch"): PitRequirementPatchInput;
export function formToCreateOrPatchBody(form: PitRequirementForm, mode: "create" | "patch"): PitRequirementWriteInput | PitRequirementPatchInput {
  const body: PitRequirementWriteInput = {
    jiraTicket: nullable(form.jiraTicket), title: form.title.trim(), description: form.description.trim(),
    useCase: nullable(form.useCase), notes: nullable(form.notes), priority: form.priority || null,
    requirementTypeId: nullable(form.requirementTypeId), sourceId: nullable(form.sourceId),
    problemCategoryId: nullable(form.problemCategoryId), industryId: nullable(form.industryId),
    customerManager: nullable(form.customerManager), implementationSide: form.implementationSide || null,
    proposedAt: nullable(form.proposedAt), plannedYear: form.plannedYear ? Number(form.plannedYear) : null,
    plannedMonth: form.plannedMonth ? Number(form.plannedMonth) : null, versionNo: nullable(form.versionNo),
    developmentStartedAt: nullable(form.developmentStartedAt), developmentCompletedAt: nullable(form.developmentCompletedAt),
    posMergeVersion: nullable(form.posMergeVersion), isHighlighted: form.isHighlighted,
    productLineIds: [...new Set(form.productLineIds)], mids: [...new Set(form.mids.map((mid) => mid.trim()).filter(Boolean))],
    assignees: form.assignees.map(({ role, userId, displayName }) => ({ role, userId: userId || null, displayName: displayName.trim() })),
  };
  if (mode === "patch") return { ...body, rowVersion: form.rowVersion ?? 0 };
  return body;
}

export function getPitRequirementActions(status: PitRequirementStatus, role: PitRole): PitRequirementAction[] {
  if (role === "viewer") return [];
  if ((status === "completed" || status === "rejected")) return role === "admin" ? [{ action: "reopen", label: "重新开启", reasonRequired: true }] : [];
  if (status === "paused") return [
    { action: "resume", label: "恢复", reasonRequired: false },
    { action: "reject", label: "拒绝", reasonRequired: true, danger: true },
  ];
  const actions: PitRequirementAction[] = [];
  if (ADVANCE[status]) actions.push({ action: "advance", label: status === "testing" ? "标记完成" : "推进下一阶段", targetStatus: ADVANCE[status], reasonRequired: false });
  if (["design_pending", "scheduling_pending", "development", "testing"].includes(status)) actions.push({ action: "return", label: "打回评审", reasonRequired: true });
  actions.push({ action: "pause", label: "暂停", reasonRequired: true });
  actions.push({ action: "reject", label: "拒绝", reasonRequired: true, danger: true });
  return actions;
}
