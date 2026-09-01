import { randomUUID } from "node:crypto";
import { withImmediateTransaction } from "./pit-database.mjs";
import { notFound, permissionDenied, validationFailed, versionConflict } from "./pit-errors.mjs";
import { listAuditEvents, recordAuditEvent } from "./pit-audit-service.mjs";

const NORMAL_STATUSES = [
  "review_pending",
  "design_pending",
  "scheduling_pending",
  "development",
  "testing",
  "completed",
];
const NORMAL_STATUS_SET = new Set(NORMAL_STATUSES);
const STATUS_SET = new Set([...NORMAL_STATUSES, "paused", "rejected"]);
const PRIORITY_SET = new Set(["urgent", "high", "medium", "low"]);
const IMPLEMENTATION_SIDE_SET = new Set(["frontend", "backend", "both"]);
const ASSIGNEE_ROLE_SET = new Set(["owner", "developer", "tester"]);
const REQUIRED_REASON_ACTIONS = new Set(["return", "pause", "reject", "reopen"]);
const ADVANCE_TARGET = new Map([
  ["review_pending", "design_pending"],
  ["design_pending", "scheduling_pending"],
  ["scheduling_pending", "development"],
  ["development", "testing"],
  ["testing", "completed"],
]);
const SORTS = new Map([
  ["updatedAt", "requirements.updated_at"],
  ["createdAt", "requirements.created_at"],
  ["priority", "CASE requirements.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END"],
  ["plannedDate", "requirements.planned_year"],
]);
const REQUIREMENT_LIST_QUERY_KEYS = new Set([
  "page", "pageSize", "q", "productLine", "status", "priority", "requirementType",
  "problemCategory", "source", "owner", "highlighted", "plannedYear", "plannedMonth",
  "proposedFrom", "proposedTo", "mine", "followed", "active", "overdue", "deleted", "sort",
]);
const SCALAR_FIELDS = new Map([
  ["jiraTicket", "jira_ticket"],
  ["title", "title"],
  ["description", "description"],
  ["useCase", "use_case"],
  ["notes", "notes"],
  ["priority", "priority"],
  ["requirementTypeId", "requirement_type_id"],
  ["sourceId", "source_id"],
  ["problemCategoryId", "problem_category_id"],
  ["industryId", "industry_id"],
  ["customerManager", "customer_manager"],
  ["implementationSide", "implementation_side"],
  ["proposedAt", "proposed_at"],
  ["plannedYear", "planned_year"],
  ["plannedMonth", "planned_month"],
  ["versionNo", "version_no"],
  ["developmentStartedAt", "development_started_at"],
  ["developmentCompletedAt", "development_completed_at"],
  ["posMergeVersion", "pos_merge_version"],
  ["isHighlighted", "is_highlighted"],
]);
const DICTIONARY_FIELDS = new Map([
  ["requirementTypeId", "requirement_type"],
  ["sourceId", "requirement_source"],
  ["problemCategoryId", "problem_category"],
  ["industryId", "industry"],
]);
const REQUIREMENT_SELECT = `
  requirements.*,
  deleted_user.display_name AS deleted_by_name,
  requirement_type_dictionary.id AS requirement_type_dictionary_id,
  requirement_type_dictionary.code AS requirement_type_dictionary_code,
  requirement_type_dictionary.label AS requirement_type_dictionary_label,
  requirement_type_dictionary.active AS requirement_type_dictionary_active,
  source_dictionary.id AS source_dictionary_id,
  source_dictionary.code AS source_dictionary_code,
  source_dictionary.label AS source_dictionary_label,
  source_dictionary.active AS source_dictionary_active,
  problem_category_dictionary.id AS problem_category_dictionary_id,
  problem_category_dictionary.code AS problem_category_dictionary_code,
  problem_category_dictionary.label AS problem_category_dictionary_label,
  problem_category_dictionary.active AS problem_category_dictionary_active,
  industry_dictionary.id AS industry_dictionary_id,
  industry_dictionary.code AS industry_dictionary_code,
  industry_dictionary.label AS industry_dictionary_label,
  industry_dictionary.active AS industry_dictionary_active
`;
const REQUIREMENT_JOINS = `
  LEFT JOIN users AS deleted_user ON deleted_user.id = requirements.deleted_by
  LEFT JOIN dictionaries AS requirement_type_dictionary
    ON requirement_type_dictionary.id = requirements.requirement_type_id
  LEFT JOIN dictionaries AS source_dictionary
    ON source_dictionary.id = requirements.source_id
  LEFT JOIN dictionaries AS problem_category_dictionary
    ON problem_category_dictionary.id = requirements.problem_category_id
  LEFT JOIN dictionaries AS industry_dictionary
    ON industry_dictionary.id = requirements.industry_id
`;

function fail(message, field) {
  throw validationFailed(message, field ? { fields: { [field]: message } } : undefined);
}

function normalizeReason(reason, required) {
  if (reason === undefined || reason === null) {
    if (required) fail("该状态动作必须填写原因", "reason");
    return null;
  }
  if (typeof reason !== "string") fail("原因必须是文本", "reason");
  const value = reason.trim();
  if (required && !value) fail("该状态动作必须填写原因", "reason");
  if (value.length > 2000) fail("原因不能超过 2000 个字符", "reason");
  return value || null;
}

export function resolvePitTransition({
  action,
  status,
  targetStatus,
  pausedFromStatus,
  actorRole,
  reason,
}) {
  if (typeof action !== "string" || !["advance", "return", "pause", "resume", "reject", "reopen"].includes(action)) {
    fail("状态动作不合法", "action");
  }
  if (!STATUS_SET.has(status)) fail("当前状态不合法", "status");
  const normalizedReason = normalizeReason(reason, REQUIRED_REASON_ACTIONS.has(action));
  if (action !== "advance" && targetStatus !== undefined) {
    fail("该状态动作不接受目标状态", "targetStatus");
  }

  if (action === "advance") {
    const expected = ADVANCE_TARGET.get(status);
    if (!expected || targetStatus !== expected) fail("推进目标与当前状态不匹配", "targetStatus");
    return { status: expected, pausedFromStatus: null, reason: normalizedReason };
  }
  if (action === "return") {
    if (!["design_pending", "scheduling_pending", "development", "testing"].includes(status)) {
      fail("当前状态不能打回", "action");
    }
    return { status: "review_pending", pausedFromStatus: null, reason: normalizedReason };
  }
  if (action === "pause") {
    if (!NORMAL_STATUS_SET.has(status)) fail("当前状态不能暂停", "action");
    return { status: "paused", pausedFromStatus: status, reason: normalizedReason };
  }
  if (action === "resume") {
    if (status !== "paused" || !NORMAL_STATUS_SET.has(pausedFromStatus)) fail("暂停来源状态无效，无法恢复", "action");
    return { status: pausedFromStatus, pausedFromStatus: null, reason: normalizedReason };
  }
  if (action === "reject") {
    if (!NORMAL_STATUS_SET.has(status) && status !== "paused") fail("当前状态不能拒绝", "action");
    return { status: "rejected", pausedFromStatus: null, reason: normalizedReason };
  }
  if (actorRole !== "admin") throw permissionDenied("只有管理员可以重新开启需求");
  if (status !== "rejected" && status !== "completed") fail("当前状态不能重新开启", "action");
  return { status: "review_pending", pausedFromStatus: null, reason: normalizedReason };
}

function dateFromClock(clock) {
  const value = clock();
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
  return date;
}

function stringValue(value, field, { required = false, max = 10000 } = {}) {
  if (value === null && !required) return null;
  if (typeof value !== "string") fail(`${field} 必须是文本`, field);
  const normalized = value.trim();
  if (required && !normalized) fail(`${field} 不能为空`, field);
  if (normalized.length > max) fail(`${field} 内容过长`, field);
  return normalized || (required ? normalized : null);
}

function nullableInteger(value, field, { min, max } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || (min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
    fail(`${field} 不合法`, field);
  }
  return parsed;
}

function validateIsoDate(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}(?:-\d{2})?$/.test(value)) fail(`${field} 日期不合法`, field);
  const [year, month, day = 1] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`${field} 日期不合法`, field);
  }
  return value;
}

function normalizeRangeDate(value, field, endOfMonth = false) {
  const validated = validateIsoDate(value, field);
  if (!validated || validated.length === 10) return validated;
  if (!endOfMonth) return `${validated}-01`;
  const [year, month] = validated.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${validated}-${String(lastDay).padStart(2, "0")}`;
}

function validateScalarInput(input, { creating = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("请求内容必须是对象");
  const values = {};
  for (const [property, column] of SCALAR_FIELDS) {
    if (!creating && input[property] === undefined) continue;
    const value = input[property];
    if (property === "title" || property === "description") {
      values[column] = stringValue(value, property, { required: true, max: property === "title" ? 500 : 50000 });
    } else if (["jiraTicket", "useCase", "notes", "customerManager", "versionNo", "posMergeVersion"].includes(property)) {
      values[column] = value === undefined ? null : stringValue(value, property, { max: property === "notes" || property === "useCase" ? 50000 : 500 });
    } else if (["proposedAt", "developmentStartedAt", "developmentCompletedAt"].includes(property)) {
      values[column] = validateIsoDate(value, property);
    } else if (property === "plannedYear") {
      values[column] = nullableInteger(value, property, { min: 1900, max: 9999 });
    } else if (property === "plannedMonth") {
      values[column] = nullableInteger(value, property, { min: 1, max: 12 });
    } else if (property === "isHighlighted") {
      if (value === undefined && creating) values[column] = 0;
      else if (typeof value !== "boolean") fail("isHighlighted 必须是布尔值", property);
      else values[column] = value ? 1 : 0;
    } else if (property === "priority") {
      if (value !== null && value !== undefined && !PRIORITY_SET.has(value)) fail("优先级不合法", property);
      values[column] = value ?? null;
    } else if (property === "implementationSide") {
      if (value !== null && value !== undefined && !IMPLEMENTATION_SIDE_SET.has(value)) fail("实现端不合法", property);
      values[column] = value ?? null;
    } else {
      values[column] = value === undefined || value === "" ? null : value;
    }
  }
  return values;
}

function uniqueStrings(value, field, { maxItems = 1000, maxLength = 500 } = {}) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) fail(`${field} 必须是数组`, field);
  const result = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string" || !item.trim() || item.trim().length > maxLength) fail(`${field} 包含不合法值`, field);
    const normalized = item.trim();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

function validateAssignees(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 200) fail("assignees 必须是数组", "assignees");
  const result = value.map((item, index) => {
    if (!item || typeof item !== "object" || !ASSIGNEE_ROLE_SET.has(item.role)) fail("人员角色不合法", "assignees");
    const displayName = stringValue(item.displayName, "assignees", { required: true, max: 100 });
    const userId = item.userId === undefined || item.userId === null || item.userId === ""
      ? null
      : stringValue(item.userId, "assignees", { required: true, max: 200 });
    return { role: item.role, userId, displayName, sortOrder: index };
  });
  if (result.filter((item) => item.role === "owner").length > 1) fail("负责人最多一人", "assignees");
  return result;
}

function assertDictionary(db, id, type, field) {
  if (id === null) return;
  const row = db.prepare("SELECT type, active FROM dictionaries WHERE id = ?").get(id);
  if (!row || row.type !== type || !row.active) fail(`${field} 字典值不存在、已停用或类型错误`, field);
}

function validateRelations(db, input) {
  const productLineIds = uniqueStrings(input.productLineIds, "productLineIds", { maxItems: 100, maxLength: 200 });
  const mids = uniqueStrings(input.mids, "mids", { maxItems: 1000, maxLength: 200 });
  const assignees = validateAssignees(input.assignees);
  if (productLineIds) for (const id of productLineIds) assertDictionary(db, id, "product_line", "productLineIds");
  if (assignees) {
    for (const assignee of assignees) {
      if (assignee.userId && !db.prepare("SELECT 1 FROM users WHERE id = ?").get(assignee.userId)) {
        fail("人员账号不存在", "assignees");
      }
    }
  }
  return { productLineIds, mids, assignees };
}

function replaceRelations(db, requirementId, relations) {
  if (relations.productLineIds !== undefined) {
    db.prepare("DELETE FROM requirement_product_lines WHERE requirement_id = ?").run(requirementId);
    const insert = db.prepare("INSERT INTO requirement_product_lines (requirement_id, dictionary_id) VALUES (?, ?)");
    for (const id of relations.productLineIds) insert.run(requirementId, id);
  }
  if (relations.mids !== undefined) {
    db.prepare("DELETE FROM requirement_mids WHERE requirement_id = ?").run(requirementId);
    const insert = db.prepare("INSERT INTO requirement_mids (requirement_id, mid) VALUES (?, ?)");
    for (const mid of relations.mids) insert.run(requirementId, mid);
  }
  if (relations.assignees !== undefined) {
    db.prepare("DELETE FROM requirement_assignees WHERE requirement_id = ?").run(requirementId);
    const insert = db.prepare(`
      INSERT INTO requirement_assignees (id, requirement_id, role, user_id, display_name, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of relations.assignees) {
      insert.run(randomUUID(), requirementId, item.role, item.userId, item.displayName, item.sortOrder);
    }
  }
}

function relationData(db, requirementId) {
  const productLines = db.prepare(`
    SELECT dictionaries.id, dictionaries.code, dictionaries.label
    FROM requirement_product_lines
    JOIN dictionaries ON dictionaries.id = requirement_product_lines.dictionary_id
    WHERE requirement_product_lines.requirement_id = ?
    ORDER BY dictionaries.sort_order, dictionaries.label, dictionaries.id
  `).all(requirementId).map((row) => ({ id: row.id, code: row.code, label: row.label }));
  const mids = db.prepare("SELECT mid FROM requirement_mids WHERE requirement_id = ? ORDER BY mid").all(requirementId).map((row) => row.mid);
  const assignees = db.prepare(`
    SELECT id, role, user_id, display_name, sort_order
    FROM requirement_assignees WHERE requirement_id = ?
    ORDER BY sort_order, id
  `).all(requirementId).map((row) => ({
    id: row.id,
    role: row.role,
    userId: row.user_id,
    displayName: row.display_name,
    sortOrder: row.sort_order,
  }));
  return { productLines, mids, assignees };
}

function toRequirement(db, row, actor, { includeEvents = false } = {}) {
  const relations = relationData(db, row.id);
  const following = actor?.id
    ? Boolean(db.prepare("SELECT 1 FROM requirement_followers WHERE requirement_id = ? AND user_id = ?").get(row.id, actor.id))
    : false;
  const dictionary = (prefix) => row[`${prefix}_dictionary_id`] ? {
    id: row[`${prefix}_dictionary_id`],
    code: row[`${prefix}_dictionary_code`],
    label: row[`${prefix}_dictionary_label`],
    active: Boolean(row[`${prefix}_dictionary_active`]),
  } : null;
  const value = {
    id: row.id,
    requirementNo: row.requirement_no,
    jiraTicket: row.jira_ticket,
    title: row.title,
    description: row.description,
    useCase: row.use_case,
    notes: row.notes,
    status: row.status,
    priority: row.priority,
    requirementTypeId: row.requirement_type_id,
    requirementType: dictionary("requirement_type"),
    sourceId: row.source_id,
    source: dictionary("source"),
    problemCategoryId: row.problem_category_id,
    problemCategory: dictionary("problem_category"),
    industryId: row.industry_id,
    industry: dictionary("industry"),
    customerManager: row.customer_manager,
    implementationSide: row.implementation_side,
    proposedAt: row.proposed_at,
    plannedYear: row.planned_year,
    plannedMonth: row.planned_month,
    versionNo: row.version_no,
    developmentStartedAt: row.development_started_at,
    developmentCompletedAt: row.development_completed_at,
    posMergeVersion: row.pos_merge_version,
    isHighlighted: Boolean(row.is_highlighted),
    pausedFromStatus: row.paused_from_status,
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
    sourceStatus: row.source_status,
    importJobId: row.import_job_id,
    rowVersion: row.row_version,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by ? { id: row.deleted_by, displayName: row.deleted_by_name } : null,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    following,
    ...relations,
  };
  if (includeEvents) {
    value.recentEvents = listAuditEvents(db, {
      resourceType: "requirement",
      resourceId: row.id,
      pageSize: 20,
    }).items;
  }
  return value;
}

function rowById(db, id, deletedMode = "exclude") {
  let condition = "requirements.deleted_at IS NULL";
  if (deletedMode === "include") condition = "1 = 1";
  else if (deletedMode === "only") condition = "requirements.deleted_at IS NOT NULL";
  return db.prepare(`
    SELECT ${REQUIREMENT_SELECT}
    FROM requirements
    ${REQUIREMENT_JOINS}
    WHERE requirements.id = ? AND ${condition}
  `).get(id);
}

function currentConflict(db, id, submittedVersion, actor) {
  const currentRow = rowById(db, id, "include");
  if (!currentRow) throw notFound("需求不存在");
  throw versionConflict("需求已被其他用户修改", {
    fields: {
      submittedVersion,
      currentVersion: currentRow.row_version,
      current: toRequirement(db, currentRow, actor),
    },
  });
}

function listValues(value) {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function validateChoiceList(value, field, allowed) {
  const values = listValues(value).map(String);
  if (values.some((item) => !allowed.has(item))) fail(`${field} 筛选值不合法`, field);
  return [...new Set(values)];
}

function validateIdList(value, field) {
  const values = listValues(value);
  if (values.some((item) => typeof item !== "string" || !item.trim() || item.length > 200)) fail(`${field} 筛选值不合法`, field);
  return [...new Set(values.map((item) => item.trim()))];
}

function booleanQuery(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  fail(`${field} 必须是 true 或 false`, field);
}

function positiveQuery(value, field, fallback, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) fail(`${field} 不合法`, field);
  return parsed;
}

function addIn(where, params, expression, values) {
  if (!values.length) return;
  where.push(`${expression} IN (${values.map(() => "?").join(", ")})`);
  params.push(...values);
}

export function parseRequirementListQuery(query = {}, actor, { clock = () => new Date() } = {}) {
  for (const key of Object.keys(query)) {
    if (!REQUIREMENT_LIST_QUERY_KEYS.has(key)) fail(`不支持的需求列表参数：${key}`, key);
  }
  const page = positiveQuery(query.page, "page", 1);
  const pageSize = positiveQuery(query.pageSize, "pageSize", 20, 100);
  const where = [];
  const params = [];
  const deleted = query.deleted || "exclude";
  if (!["exclude", "only", "include"].includes(deleted)) fail("deleted 筛选值不合法", "deleted");
  if (deleted !== "exclude" && actor.role !== "admin") throw permissionDenied("只有管理员可以查看回收站");
  if (deleted === "exclude") where.push("requirements.deleted_at IS NULL");
  else if (deleted === "only") where.push("requirements.deleted_at IS NOT NULL");

  const q = query.q === undefined ? "" : stringValue(query.q, "q", { max: 200 });
  if (q) {
    const term = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    where.push(`(
      requirements.requirement_no LIKE ? ESCAPE '\\' OR requirements.jira_ticket LIKE ? ESCAPE '\\'
      OR requirements.title LIKE ? ESCAPE '\\' OR requirements.description LIKE ? ESCAPE '\\'
      OR requirements.use_case LIKE ? ESCAPE '\\' OR requirements.notes LIKE ? ESCAPE '\\'
      OR EXISTS (SELECT 1 FROM requirement_mids search_mids WHERE search_mids.requirement_id = requirements.id AND search_mids.mid LIKE ? ESCAPE '\\')
    )`);
    params.push(term, term, term, term, term, term, term);
  }

  addIn(where, params, "requirements.status", validateChoiceList(query.status, "status", STATUS_SET));
  addIn(where, params, "requirements.priority", validateChoiceList(query.priority, "priority", PRIORITY_SET));
  const directFilters = [
    ["requirementType", "requirement_type_id"],
    ["problemCategory", "problem_category_id"],
    ["source", "source_id"],
  ];
  for (const [property, column] of directFilters) {
    addIn(where, params, `requirements.${column}`, validateIdList(query[property], property));
  }
  const productLine = validateIdList(query.productLine, "productLine");
  if (productLine.length) {
    where.push(`EXISTS (
      SELECT 1 FROM requirement_product_lines filter_products
      WHERE filter_products.requirement_id = requirements.id
      AND filter_products.dictionary_id IN (${productLine.map(() => "?").join(", ")})
    )`);
    params.push(...productLine);
  }
  const owners = validateIdList(query.owner, "owner");
  if (owners.length) {
    where.push(`EXISTS (
      SELECT 1 FROM requirement_assignees filter_owner
      WHERE filter_owner.requirement_id = requirements.id AND filter_owner.role = 'owner'
      AND filter_owner.user_id IN (${owners.map(() => "?").join(", ")})
    )`);
    params.push(...owners);
  }
  const highlighted = booleanQuery(query.highlighted, "highlighted");
  if (highlighted !== null) {
    where.push("requirements.is_highlighted = ?");
    params.push(highlighted ? 1 : 0);
  }
  const plannedYears = listValues(query.plannedYear).map((item) => nullableInteger(item, "plannedYear", { min: 1900, max: 9999 }));
  addIn(where, params, "requirements.planned_year", [...new Set(plannedYears)]);
  const plannedMonths = listValues(query.plannedMonth).map((item) => nullableInteger(item, "plannedMonth", { min: 1, max: 12 }));
  addIn(where, params, "requirements.planned_month", [...new Set(plannedMonths)]);
  const proposedFrom = normalizeRangeDate(query.proposedFrom, "proposedFrom");
  const proposedTo = normalizeRangeDate(query.proposedTo, "proposedTo", true);
  if (proposedFrom && proposedTo && proposedFrom > proposedTo) fail("建议日期范围不合法", "proposedFrom");
  if (proposedFrom) {
    where.push("date(CASE WHEN length(requirements.proposed_at) = 7 THEN requirements.proposed_at || '-01' ELSE requirements.proposed_at END) >= date(?)");
    params.push(proposedFrom);
  }
  if (proposedTo) {
    where.push("date(CASE WHEN length(requirements.proposed_at) = 7 THEN requirements.proposed_at || '-01' ELSE requirements.proposed_at END) <= date(?)");
    params.push(proposedTo);
  }
  if (booleanQuery(query.mine, "mine") === true) {
    where.push("EXISTS (SELECT 1 FROM requirement_assignees mine WHERE mine.requirement_id = requirements.id AND mine.user_id = ?)");
    params.push(actor.id);
  }
  if (booleanQuery(query.followed, "followed") === true) {
    where.push("EXISTS (SELECT 1 FROM requirement_followers followed WHERE followed.requirement_id = requirements.id AND followed.user_id = ?)");
    params.push(actor.id);
  }
  if (booleanQuery(query.active, "active") === true) {
    where.push("requirements.status NOT IN ('completed', 'rejected')");
  }
  if (booleanQuery(query.overdue, "overdue") === true) {
    const current = dateFromClock(clock);
    const currentYearMonth = current.getUTCFullYear() * 100 + current.getUTCMonth() + 1;
    where.push(`requirements.status NOT IN ('completed', 'rejected')
      AND requirements.planned_year IS NOT NULL
      AND requirements.planned_month IS NOT NULL
      AND requirements.planned_year * 100 + requirements.planned_month < ?`);
    params.push(currentYearMonth);
  }

  const requestedSort = query.sort || "-updatedAt";
  if (typeof requestedSort !== "string") fail("sort 不合法", "sort");
  const descending = requestedSort.startsWith("-");
  const sortName = descending ? requestedSort.slice(1) : requestedSort;
  const sortExpression = SORTS.get(sortName);
  if (!sortExpression) fail("sort 不在允许范围内", "sort");
  const direction = descending ? "DESC" : "ASC";
  let orderBy = `${sortExpression} ${direction}`;
  if (sortName === "plannedDate") orderBy += `, requirements.planned_month ${direction}`;
  orderBy += ", requirements.id ASC";
  return { page, pageSize, where: where.length ? where.join(" AND ") : "1 = 1", params, orderBy };
}

export function buildRequirementListSql(compiled, { paginate = true } = {}) {
  if (!compiled || typeof compiled.where !== "string" || !Array.isArray(compiled.params) || typeof compiled.orderBy !== "string") {
    throw new TypeError("buildRequirementListSql requires a compiled requirement query");
  }
  const selectSql = `
    SELECT ${REQUIREMENT_SELECT}
    FROM requirements
    ${REQUIREMENT_JOINS}
    WHERE ${compiled.where}
    ORDER BY ${compiled.orderBy}
    ${paginate ? "LIMIT ? OFFSET ?" : ""}
  `;
  return {
    countSql: `SELECT count(*) AS count FROM requirements WHERE ${compiled.where}`,
    countParams: [...compiled.params],
    selectSql,
    selectParams: paginate
      ? [...compiled.params, compiled.pageSize, (compiled.page - 1) * compiled.pageSize]
      : [...compiled.params],
  };
}

export function requirementFromListRow(db, row, actor) {
  return toRequirement(db, row, actor);
}

function listItem(db, row, actor) {
  const requirement = toRequirement(db, row, actor);
  const owner = requirement.assignees.find((item) => item.role === "owner") || null;
  return {
    id: requirement.id,
    requirementNo: requirement.requirementNo,
    jiraTicket: requirement.jiraTicket,
    title: requirement.title,
    summary: requirement.description.length > 240 ? `${requirement.description.slice(0, 237)}...` : requirement.description,
    productLines: requirement.productLines,
    requirementType: requirement.requirementType,
    source: requirement.source,
    problemCategory: requirement.problemCategory,
    industry: requirement.industry,
    status: requirement.status,
    priority: requirement.priority,
    owner: owner ? { id: owner.userId, displayName: owner.displayName } : null,
    isHighlighted: requirement.isHighlighted,
    following: requirement.following,
    sourceStatus: requirement.sourceStatus,
    rowVersion: requirement.rowVersion,
    deletedAt: requirement.deletedAt,
    updatedAt: requirement.updatedAt,
  };
}

export function createPitRequirementService({ db, clock = () => new Date() }) {
  function now() {
    return dateFromClock(clock).toISOString();
  }

  function list(query, actor) {
    const compiled = parseRequirementListQuery(query || {}, actor, { clock });
    const built = buildRequirementListSql(compiled);
    const total = db.prepare(built.countSql).get(...built.countParams).count;
    const rows = db.prepare(built.selectSql).all(...built.selectParams);
    return {
      items: rows.map((row) => listItem(db, row, actor)),
      page: compiled.page,
      pageSize: compiled.pageSize,
      total,
    };
  }

  function getById(id, actor, { deleted = "exclude" } = {}) {
    if (!["exclude", "include", "only"].includes(deleted)) fail("deleted 筛选值不合法", "deleted");
    if (deleted !== "exclude" && actor.role !== "admin") throw permissionDenied("只有管理员可以查看回收站");
    const row = rowById(db, id, deleted);
    if (!row) throw notFound("需求不存在");
    return toRequirement(db, row, actor, { includeEvents: true });
  }

  function create(input, actor) {
    const scalars = validateScalarInput(input, { creating: true });
    for (const [property, type] of DICTIONARY_FIELDS) assertDictionary(db, scalars[SCALAR_FIELDS.get(property)], type, property);
    const relations = validateRelations(db, input);
    if (relations.productLineIds === undefined) relations.productLineIds = [];
    if (relations.mids === undefined) relations.mids = [];
    if (relations.assignees === undefined) relations.assignees = [];
    const id = randomUUID();
    const timestamp = now();
    return withImmediateTransaction(db, () => {
      const last = db.prepare(`
        SELECT max(CAST(substr(requirement_no, 5) AS INTEGER)) AS value FROM requirements
        WHERE requirement_no GLOB 'REQ-[0-9][0-9][0-9][0-9][0-9][0-9]'
      `).get().value || 0;
      const requirementNo = `REQ-${String(last + 1).padStart(6, "0")}`;
      const columns = [...SCALAR_FIELDS.values()];
      db.prepare(`
        INSERT INTO requirements (
          id, requirement_no, ${columns.join(", ")}, status, paused_from_status,
          row_version, deleted_at, deleted_by, created_by, updated_by, created_at, updated_at
        ) VALUES (
          ?, ?, ${columns.map(() => "?").join(", ")}, 'review_pending', NULL,
          1, NULL, NULL, ?, ?, ?, ?
        )
      `).run(
        id,
        requirementNo,
        ...columns.map((column) => scalars[column] ?? null),
        actor.id,
        actor.id,
        timestamp,
        timestamp,
      );
      replaceRelations(db, id, relations);
      const result = toRequirement(db, rowById(db, id), actor);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "requirement.create",
        resourceType: "requirement",
        resourceId: id,
        after: result,
        createdAt: timestamp,
      });
      return result;
    });
  }

  function update(id, input, actor) {
    const submittedVersion = positiveQuery(input?.rowVersion, "rowVersion", null);
    if (submittedVersion === null) fail("rowVersion 必填", "rowVersion");
    const scalars = validateScalarInput(input);
    for (const [property, type] of DICTIONARY_FIELDS) {
      const column = SCALAR_FIELDS.get(property);
      if (Object.hasOwn(scalars, column)) assertDictionary(db, scalars[column], type, property);
    }
    const relations = validateRelations(db, input || {});
    return withImmediateTransaction(db, () => {
      const currentRow = rowById(db, id);
      if (!currentRow) throw notFound("需求不存在");
      if (currentRow.row_version !== submittedVersion) currentConflict(db, id, submittedVersion, actor);
      const before = toRequirement(db, currentRow, actor);
      const assignments = Object.entries(scalars);
      const timestamp = now();
      const set = assignments.map(([column]) => `${column} = ?`);
      set.push("updated_by = ?", "updated_at = ?", "row_version = row_version + 1");
      const result = db.prepare(`
        UPDATE requirements SET ${set.join(", ")}
        WHERE id = ? AND row_version = ? AND deleted_at IS NULL
      `).run(...assignments.map(([, value]) => value), actor.id, timestamp, id, submittedVersion);
      if (result.changes !== 1) currentConflict(db, id, submittedVersion, actor);
      replaceRelations(db, id, relations);
      const after = toRequirement(db, rowById(db, id), actor);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "requirement.update",
        resourceType: "requirement",
        resourceId: id,
        before,
        after,
        createdAt: timestamp,
      });
      return after;
    });
  }

  function transition(id, input, actor) {
    const submittedVersion = positiveQuery(input?.rowVersion, "rowVersion", null);
    if (submittedVersion === null) fail("rowVersion 必填", "rowVersion");
    return withImmediateTransaction(db, () => {
      const currentRow = rowById(db, id);
      if (!currentRow) throw notFound("需求不存在");
      if (currentRow.row_version !== submittedVersion) currentConflict(db, id, submittedVersion, actor);
      const resolved = resolvePitTransition({
        action: input?.action,
        status: currentRow.status,
        targetStatus: input?.targetStatus,
        pausedFromStatus: currentRow.paused_from_status,
        actorRole: actor.role,
        reason: input?.reason,
      });
      const before = toRequirement(db, currentRow, actor);
      const timestamp = now();
      const result = db.prepare(`
        UPDATE requirements
        SET status = ?, paused_from_status = ?, row_version = row_version + 1,
            updated_by = ?, updated_at = ?
        WHERE id = ? AND row_version = ? AND deleted_at IS NULL
      `).run(resolved.status, resolved.pausedFromStatus, actor.id, timestamp, id, submittedVersion);
      if (result.changes !== 1) currentConflict(db, id, submittedVersion, actor);
      const after = toRequirement(db, rowById(db, id), actor);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: `requirement.transition.${input.action}`,
        resourceType: "requirement",
        resourceId: id,
        before,
        after,
        metadata: {
          action: input.action,
          fromStatus: currentRow.status,
          toStatus: resolved.status,
          reason: resolved.reason,
        },
        createdAt: timestamp,
      });
      return after;
    });
  }

  function softDelete(id, actor) {
    return withImmediateTransaction(db, () => {
      const currentRow = rowById(db, id);
      if (!currentRow) throw notFound("需求不存在");
      const before = toRequirement(db, currentRow, actor);
      const timestamp = now();
      db.prepare(`
        UPDATE requirements SET deleted_at = ?, deleted_by = ?, updated_by = ?,
          updated_at = ?, row_version = row_version + 1 WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, actor.id, actor.id, timestamp, id);
      const after = toRequirement(db, rowById(db, id, "only"), actor);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "requirement.delete",
        resourceType: "requirement",
        resourceId: id,
        before,
        after,
        createdAt: timestamp,
      });
      return after;
    });
  }

  function restore(id, actor) {
    return withImmediateTransaction(db, () => {
      const currentRow = rowById(db, id, "only");
      if (!currentRow) throw notFound("已删除需求不存在");
      const before = toRequirement(db, currentRow, actor);
      const timestamp = now();
      db.prepare(`
        UPDATE requirements SET deleted_at = NULL, deleted_by = NULL, updated_by = ?,
          updated_at = ?, row_version = row_version + 1 WHERE id = ? AND deleted_at IS NOT NULL
      `).run(actor.id, timestamp, id);
      const after = toRequirement(db, rowById(db, id), actor);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "requirement.restore",
        resourceType: "requirement",
        resourceId: id,
        before,
        after,
        createdAt: timestamp,
      });
      return after;
    });
  }

  function setFollowing(id, actor, following) {
    return withImmediateTransaction(db, () => {
      const row = rowById(db, id);
      if (!row) throw notFound("需求不存在");
      const existed = Boolean(db.prepare("SELECT 1 FROM requirement_followers WHERE requirement_id = ? AND user_id = ?").get(id, actor.id));
      const timestamp = now();
      if (following) {
        db.prepare(`
          INSERT INTO requirement_followers (requirement_id, user_id, created_at)
          VALUES (?, ?, ?) ON CONFLICT(requirement_id, user_id) DO NOTHING
        `).run(id, actor.id, timestamp);
      } else {
        db.prepare("DELETE FROM requirement_followers WHERE requirement_id = ? AND user_id = ?").run(id, actor.id);
      }
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: following ? "requirement.follow" : "requirement.unfollow",
        resourceType: "requirement",
        resourceId: id,
        before: { following: existed },
        after: { following },
        metadata: { idempotent: existed === following },
        createdAt: timestamp,
      });
      return { following };
    });
  }

  return {
    list,
    getById,
    create,
    update,
    transition,
    softDelete,
    restore,
    follow(id, actor) {
      return setFollowing(id, actor, true);
    },
    unfollow(id, actor) {
      return setFollowing(id, actor, false);
    },
  };
}
