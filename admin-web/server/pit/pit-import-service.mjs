import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { recordAuditEvent } from "./pit-audit-service.mjs";
import {
  createPitBackup,
  resolvePitBackupDownload,
  verifyPitBackup,
} from "./pit-backup-service.mjs";
import { getSystemSetting, withImmediateTransaction } from "./pit-database.mjs";
import { PitApiError, notFound, unsupportedFileType, validationFailed } from "./pit-errors.mjs";
import { parsePitWorkbook } from "./pit-import-parser.mjs";

export const PIT_IMPORT_MAX_BYTES = 20 * 1024 * 1024;

const STATUS_SET = new Set([
  "review_pending",
  "design_pending",
  "scheduling_pending",
  "development",
  "testing",
  "completed",
  "paused",
  "rejected",
]);
const ROW_ACTIONS = new Set(["keep_separate", "merge", "skip"]);
const DICTIONARY_ACTIONS = new Set(["create", "map", "clear"]);
const EXISTING_MERGE_FIELDS = [
  "jiraTicket", "title", "description", "useCase", "notes", "status", "priority",
  "requirementType", "requirementSource", "problemCategory", "industry", "customerManager",
  "implementationSide", "proposedAt", "plannedYear", "plannedMonth", "versionNo",
  "developmentStartedAt", "developmentCompletedAt", "posMergeVersion",
  "productLines", "mids", "developers", "testers",
];
const DICTIONARY_SOURCES = [
  ["requirement_source", "requirementSource"],
  ["requirement_type", "requirementType"],
  ["problem_category", "problemCategory"],
  ["industry", "industry"],
];

function dateFromClock(clock) {
  const date = new Date(clock());
  if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
  return date;
}

function publicSummary(summary) {
  return {
    totalRows: summary.totalRows,
    importableRows: summary.importableRows,
    missingTicketCount: summary.missingTicketCount,
    duplicateGroupCount: summary.duplicateGroupCount,
    unknownStatusCount: summary.unknownStatusCount,
    unknownDictionaryCount: summary.unknownDictionaryCount,
    highlightMatches: summary.highlightMatches,
    ignoredSheets: summary.ignoredSheets,
    blockingIssueCount: summary.blockingIssueCount,
  };
}

function parseSummary(row) {
  try {
    return JSON.parse(row.summary_json);
  } catch (error) {
    throw new Error(`Import job ${row.id} contains invalid summary JSON`, { cause: error });
  }
}

function toJob(row) {
  const summary = parseSummary(row);
  return {
    id: row.id,
    fileName: row.file_name,
    fileHash: row.file_hash,
    status: row.status,
    summary: publicSummary(summary),
    decisions: summary.decisions || {
      rows: [], duplicateGroups: [], statusMappings: [], dictionaryMappings: [], highlights: [],
    },
    sourcePath: row.source_path ? path.basename(row.source_path) : null,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    createdAt: row.created_at,
    committedAt: row.committed_at,
  };
}

function importJobRow(db, id) {
  return db.prepare(`
    SELECT id, file_name, file_hash, status, summary_json, source_path,
      error_message, created_by, created_at, committed_at
    FROM import_jobs WHERE id = ?
  `).get(id);
}

function failValidation(message, field) {
  throw validationFailed(message, field ? { fields: { [field]: [message] } } : undefined);
}

function positiveInteger(value, field, fallback, maximum = 100) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) failValidation(`${field} 不合法`, field);
  return parsed;
}

function safeMessage(error, fallback) {
  const message = String(error?.message || fallback).replace(/[\r\n]+/g, " ").slice(0, 1000);
  return message || fallback;
}

function removeIfPresent(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

function importDirectory(config) {
  const directory = path.resolve(config?.importsDir || path.join(config?.dataDir || ".data/pit", "imports"));
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function finalSkippedRows(parsed, decisions) {
  const skipped = new Set(decisions.rows.filter((item) => item.action === "skip").map((item) => item.rowId));
  const groupByTicket = new Map(parsed.duplicateGroups.map((group) => [group.jiraTicket, group]));
  for (const decision of decisions.duplicateGroups.filter((item) => item.action === "skip")) {
    const group = groupByTicket.get(decision.jiraTicket);
    if (group) for (const rowId of group.rowIds) skipped.add(rowId);
  }
  return skipped;
}

function unresolvedIssue(issue, row, decisions, skippedRows) {
  if (issue.severity !== "blocking") return false;
  if (skippedRows.has(row?.id)) return false;
  if (issue.code === "unknown_status") {
    return !decisions.statusMappings.some((item) => item.source === issue.sourceValue);
  }
  if (issue.code === "unknown_dictionary") {
    return !decisions.dictionaryMappings.some(
      (item) => item.type === issue.dictionaryType && item.source === issue.sourceValue,
    );
  }
  return true;
}

function summarize(parsed, decisions = {}) {
  const normalizedDecisions = {
    rows: decisions.rows || [],
    duplicateGroups: decisions.duplicateGroups || [],
    statusMappings: decisions.statusMappings || [],
    dictionaryMappings: decisions.dictionaryMappings || [],
    highlights: decisions.highlights || [],
  };
  const skippedRows = finalSkippedRows(parsed, normalizedDecisions);
  let blockingIssueCount = parsed.issues.filter((issue) => issue.severity === "blocking").length;
  let importableRows = 0;
  for (const row of parsed.rows) {
    const unresolved = row.issues.filter((issue) => unresolvedIssue(issue, row, normalizedDecisions, skippedRows));
    blockingIssueCount += unresolved.length;
    if (!skippedRows.has(row.id) && unresolved.length === 0) importableRows += 1;
  }
  for (const highlight of parsed.highlights) {
    const decision = normalizedDecisions.highlights.find((item) => item.rowNumber === highlight.rowNumber);
    if (highlight.issues.some((issue) => issue.severity === "blocking") && !decision) blockingIssueCount += 1;
  }
  const highlightMatches = { matched: 0, ambiguous: 0, unmatched: 0 };
  for (const item of parsed.highlights) highlightMatches[item.match] += 1;
  const dictionaryIssues = parsed.rows.flatMap((row) => row.issues).filter((issue) => issue.code === "unknown_dictionary");
  const dictionaryKeys = new Set(dictionaryIssues.map((issue) => `${issue.dictionaryType}\u0000${issue.sourceValue}`));
  return {
    totalRows: parsed.rows.length,
    importableRows,
    missingTicketCount: parsed.rows.flatMap((row) => row.issues).filter((issue) => issue.code === "missing_ticket").length,
    duplicateGroupCount: parsed.duplicateGroups.length,
    unknownStatusCount: parsed.rows.flatMap((row) => row.issues).filter((issue) => issue.code === "unknown_status").length,
    unknownDictionaryCount: dictionaryKeys.size,
    highlightMatches,
    ignoredSheets: parsed.ignoredSheets,
    blockingIssueCount,
    decisions: normalizedDecisions,
    parser: {
      issues: parsed.issues,
      duplicateGroups: parsed.duplicateGroups,
      highlights: parsed.highlights,
      processedSheets: parsed.processedSheets,
    },
  };
}

function parsedFromDatabase(db, jobRow) {
  const summary = parseSummary(jobRow);
  const rows = db.prepare(`
    SELECT id, sheet_name, row_number, raw_json, normalized_json, issue_json, decision_json
    FROM import_rows WHERE import_job_id = ? ORDER BY sheet_name, row_number, id
  `).all(jobRow.id).map((row) => ({
    id: row.id,
    sheetName: row.sheet_name,
    rowNumber: row.row_number,
    raw: JSON.parse(row.raw_json),
    normalized: JSON.parse(row.normalized_json),
    issues: JSON.parse(row.issue_json),
    decision: row.decision_json ? JSON.parse(row.decision_json) : null,
  }));
  return {
    rows,
    issues: summary.parser?.issues || [],
    duplicateGroups: summary.parser?.duplicateGroups || [],
    highlights: summary.parser?.highlights || [],
    processedSheets: summary.parser?.processedSheets || [],
    ignoredSheets: summary.ignoredSheets || [],
  };
}

function enrichDictionaryIssues(db, parsed) {
  const dictionaries = db.prepare(`
    SELECT id, type, label, active FROM dictionaries WHERE active = 1
  `).all();
  const known = new Set(dictionaries.map((item) => `${item.type}\u0000${item.label.trim().toLocaleLowerCase("zh-CN")}`));
  function check(row, type, value) {
    if (!value) return;
    const label = String(value).trim();
    const key = `${type}\u0000${label.toLocaleLowerCase("zh-CN")}`;
    if (known.has(key)) return;
    if (row.issues.some((issue) => issue.code === "unknown_dictionary" && issue.dictionaryType === type && issue.sourceValue === label)) return;
    row.issues.push({
      code: "unknown_dictionary",
      severity: "blocking",
      dictionaryType: type,
      sourceValue: label,
      suggestion: "create",
    });
  }
  for (const row of parsed.rows) {
    for (const [type, property] of DICTIONARY_SOURCES) check(row, type, row.normalized[property]);
    for (const productLine of row.normalized.productLines) check(row, "product_line", productLine);
  }
}

function validateDecisions(db, parsed, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) failValidation("导入决策必须是对象");
  const rowIds = new Set(parsed.rows.map((row) => row.id));
  const rows = input.rows ?? [];
  const duplicateGroups = input.duplicateGroups ?? [];
  const statusMappings = input.statusMappings ?? [];
  const dictionaryMappings = input.dictionaryMappings ?? [];
  const highlights = input.highlights ?? [];
  for (const [field, value] of Object.entries({ rows, duplicateGroups, statusMappings, dictionaryMappings, highlights })) {
    if (!Array.isArray(value)) failValidation(`${field} 必须是数组`, field);
  }

  const rowDecisionIds = new Set();
  const rowDecisionById = new Map();
  for (const item of rows) {
    if (!item || typeof item !== "object" || !rowIds.has(item.rowId)) failValidation("rows 包含未知行", "rows");
    if (rowDecisionIds.has(item.rowId)) failValidation("同一行不能提交多个决策", "rows");
    if (!ROW_ACTIONS.has(item.action)) failValidation("行决策 action 不合法", "rows");
    if (item.action === "merge") {
      const hasRowTarget = item.mergeTargetRowId && rowIds.has(item.mergeTargetRowId) && item.mergeTargetRowId !== item.rowId;
      const hasExistingTarget = typeof item.existingRequirementId === "string"
        && Boolean(db.prepare("SELECT 1 FROM requirements WHERE id = ? AND deleted_at IS NULL").get(item.existingRequirementId));
      if (Number(Boolean(hasRowTarget)) + Number(Boolean(hasExistingTarget)) !== 1) {
        failValidation("merge 必须且只能指定一个有效目标行或现有需求", "rows");
      }
      if (hasRowTarget) {
        const expected = new Set([item.rowId, item.mergeTargetRowId]);
        if (!Array.isArray(item.fieldPriority)
          || item.fieldPriority.length !== 2
          || new Set(item.fieldPriority).size !== 2
          || item.fieldPriority.some((id) => !expected.has(id))) {
          failValidation("行合并 fieldPriority 必须明确包含来源行和目标行", "rows");
        }
      }
      if (hasExistingTarget) {
        const strategy = item.fieldStrategy;
        if (!strategy || typeof strategy !== "object" || Array.isArray(strategy)
          || Object.keys(strategy).length !== EXISTING_MERGE_FIELDS.length
          || EXISTING_MERGE_FIELDS.some((field) => !new Set(["existing", "source"]).has(strategy[field]))) {
          failValidation("合并到现有需求必须为全部字段提交 existing/source 策略", "rows");
        }
      }
    }
    rowDecisionIds.add(item.rowId);
    rowDecisionById.set(item.rowId, item);
  }

  const groupByTicket = new Map(parsed.duplicateGroups.map((group) => [group.jiraTicket, group]));
  const decidedGroups = new Set();
  for (const item of duplicateGroups) {
    const group = groupByTicket.get(item?.jiraTicket);
    if (!group || decidedGroups.has(item.jiraTicket)) failValidation("duplicateGroups 包含未知或重复分组", "duplicateGroups");
    if (!ROW_ACTIONS.has(item.action)) failValidation("重复组 action 不合法", "duplicateGroups");
    if (item.action === "merge") {
      if (!group.rowIds.includes(item.targetRowId)) failValidation("重复组合并目标必须属于该组", "duplicateGroups");
      if (!Array.isArray(item.fieldPriority)
        || item.fieldPriority.length !== group.rowIds.length
        || new Set(item.fieldPriority).size !== group.rowIds.length
        || item.fieldPriority.some((id) => !group.rowIds.includes(id))) {
        failValidation("fieldPriority 必须包含重复组全部行", "duplicateGroups");
      }
    }
    decidedGroups.add(item.jiraTicket);
  }

  const skippedRows = new Set(rows.filter((item) => item.action === "skip").map((item) => item.rowId));
  const duplicateMergedRows = new Set();
  const duplicateDecisionByRow = new Map();
  for (const decision of duplicateGroups) {
    const group = groupByTicket.get(decision.jiraTicket);
    for (const rowId of group.rowIds) duplicateDecisionByRow.set(rowId, decision.action);
    if (decision.action === "skip") for (const rowId of group.rowIds) skippedRows.add(rowId);
    if (decision.action === "merge") for (const rowId of group.rowIds) duplicateMergedRows.add(rowId);
  }
  for (const group of duplicateGroups.filter((item) => item.action !== "keep_separate")) {
    const source = groupByTicket.get(group.jiraTicket);
    if (source.rowIds.some((rowId) => rowDecisionById.has(rowId))) {
      failValidation("重复组 merge/skip 不能与行级决策重叠", "rows");
    }
  }
  const mergeParticipants = new Set();
  const existingTargets = new Set();
  for (const decision of rows.filter((item) => item.action === "merge")) {
    const participants = [decision.rowId, ...(decision.mergeTargetRowId ? [decision.mergeTargetRowId] : [])];
    if (participants.some((rowId) => skippedRows.has(rowId))) failValidation("merge 来源或目标不能同时 skip", "rows");
    if (participants.some((rowId) => duplicateMergedRows.has(rowId))) failValidation("行合并不能与重复组合并重叠", "rows");
    if (participants.some((rowId) => duplicateDecisionByRow.get(rowId) === "keep_separate")) {
      failValidation("重复组 keep_separate 不能被行级 merge 覆盖", "rows");
    }
    if (decision.mergeTargetRowId && rowDecisionById.get(decision.mergeTargetRowId)?.action === "keep_separate") {
      failValidation("显式 keep_separate 的行不能作为 merge 目标", "rows");
    }
    if (participants.some((rowId) => mergeParticipants.has(rowId))) failValidation("merge 存在循环、链式或多对一歧义", "rows");
    for (const rowId of participants) mergeParticipants.add(rowId);
    if (decision.existingRequirementId) {
      if (existingTargets.has(decision.existingRequirementId)) failValidation("多个来源不能隐式合并到同一现有需求", "rows");
      existingTargets.add(decision.existingRequirementId);
    }
  }

  const unknownStatuses = new Set(parsed.rows.flatMap((row) => row.issues)
    .filter((issue) => issue.code === "unknown_status").map((issue) => issue.sourceValue));
  const statusSources = new Set();
  for (const item of statusMappings) {
    if (!item || !unknownStatuses.has(item.source) || statusSources.has(item.source) || !STATUS_SET.has(item.status)) {
      failValidation("statusMappings 不合法", "statusMappings");
    }
    statusSources.add(item.source);
  }

  const unknownDictionaries = new Set(parsed.rows.flatMap((row) => row.issues)
    .filter((issue) => issue.code === "unknown_dictionary")
    .map((issue) => `${issue.dictionaryType}\u0000${issue.sourceValue}`));
  const dictionaryKeys = new Set();
  for (const item of dictionaryMappings) {
    const key = `${item?.type}\u0000${item?.source}`;
    if (!item || !unknownDictionaries.has(key) || dictionaryKeys.has(key) || !DICTIONARY_ACTIONS.has(item.action)) {
      failValidation("dictionaryMappings 不合法", "dictionaryMappings");
    }
    if (item.action === "create" && !String(item.label || item.source || "").trim()) {
      failValidation("创建字典时 label 必填", "dictionaryMappings");
    }
    if (item.action === "map") {
      const target = db.prepare("SELECT id, type FROM dictionaries WHERE id = ? AND active = 1").get(item.dictionaryId);
      if (!target || target.type !== item.type) failValidation("字典映射目标无效", "dictionaryMappings");
    }
    dictionaryKeys.add(key);
  }

  const highlightRows = new Map(parsed.highlights.map((item) => [item.rowNumber, item]));
  const highlightNumbers = new Set();
  for (const item of highlights) {
    const source = highlightRows.get(item?.rowNumber);
    if (!source || highlightNumbers.has(item.rowNumber) || !new Set(["match", "skip"]).has(item.action)) {
      failValidation("highlights 决策不合法", "highlights");
    }
    if (item.action === "match" && !rowIds.has(item.targetRowId)) failValidation("重点需求目标行无效", "highlights");
    highlightNumbers.add(item.rowNumber);
  }
  for (const source of parsed.highlights) {
    const decision = highlights.find((item) => item.rowNumber === source.rowNumber);
    if (decision?.action === "skip") continue;
    const targetRowId = decision?.action === "match"
      ? decision.targetRowId
      : source.match === "matched" ? source.matchedRowIds[0] : null;
    if (targetRowId && skippedRows.has(targetRowId)) {
      failValidation("重点需求目标不能被 skip 或属于跳过的重复组", "highlights");
    }
  }
  return { rows, duplicateGroups, statusMappings, dictionaryMappings, highlights };
}

function dictionaryCode(db, type, label) {
  const base = String(label)
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "imported";
  let candidate = base;
  let suffix = 2;
  while (db.prepare("SELECT 1 FROM dictionaries WHERE type = ? AND code = ?").get(type, candidate)) {
    candidate = `${base.slice(0, 44)}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function union(values) {
  const result = [];
  const seen = new Set();
  for (const value of values.flat()) {
    const normalized = String(value || "").trim();
    const key = normalized.toLocaleLowerCase("zh-CN");
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function mergeRows(rows, priorityIds) {
  const order = priorityIds
    ? priorityIds.map((id) => rows.find((row) => row.id === id)).filter(Boolean)
    : rows;
  const scalar = (property) => order.map((row) => row.normalized[property]).find((value) => value !== null && value !== undefined && value !== "") ?? null;
  return {
    sourceRows: rows,
    normalized: {
      jiraTicket: scalar("jiraTicket"),
      title: scalar("title"),
      description: scalar("description") || "",
      useCase: scalar("useCase"),
      notes: scalar("notes"),
      requirementSource: scalar("requirementSource"),
      requirementType: scalar("requirementType"),
      industry: scalar("industry"),
      customerManager: scalar("customerManager"),
      sourceStatus: scalar("sourceStatus") || "",
      statusSuggestion: scalar("statusSuggestion"),
      productLines: union(order.map((row) => row.normalized.productLines)),
      implementationSide: scalar("implementationSide"),
      developers: union(order.map((row) => row.normalized.developers)),
      testers: union(order.map((row) => row.normalized.testers)),
      priority: scalar("priority"),
      problemCategory: scalar("problemCategory"),
      mids: union(order.map((row) => row.normalized.mids)),
      versionNo: scalar("versionNo"),
      proposedAt: scalar("proposedAt"),
      plannedYear: scalar("plannedYear"),
      plannedMonth: scalar("plannedMonth"),
      developmentStartedAt: scalar("developmentStartedAt"),
      developmentCompletedAt: scalar("developmentCompletedAt"),
      posMergeVersion: scalar("posMergeVersion"),
    },
  };
}

function buildImportUnits(parsed, decisions) {
  const byId = new Map(parsed.rows.map((row) => [row.id, row]));
  const skipped = new Set(decisions.rows.filter((item) => item.action === "skip").map((item) => item.rowId));
  const used = new Set();
  const units = [];
  for (const group of parsed.duplicateGroups) {
    const decision = decisions.duplicateGroups.find((item) => item.jiraTicket === group.jiraTicket);
    if (decision?.action === "skip") {
      for (const id of group.rowIds) skipped.add(id);
      continue;
    }
    if (decision?.action === "merge") {
      const rows = group.rowIds.map((id) => byId.get(id));
      units.push({ ...mergeRows(rows, decision.fieldPriority), existingRequirementId: null, fieldStrategy: null });
      for (const id of group.rowIds) used.add(id);
    }
  }
  for (const decision of decisions.rows.filter((item) => item.action === "merge")) {
    if (used.has(decision.rowId) || skipped.has(decision.rowId)) throw new Error("Validated merge source became unavailable");
    const source = byId.get(decision.rowId);
    if (decision.existingRequirementId) {
      units.push({
        ...mergeRows([source]),
        existingRequirementId: decision.existingRequirementId,
        fieldStrategy: decision.fieldStrategy,
      });
      used.add(source.id);
      continue;
    }
    const target = byId.get(decision.mergeTargetRowId);
    if (!target || used.has(target.id) || skipped.has(target.id)) throw new Error("Validated merge target became unavailable");
    units.push({
      ...mergeRows([target, source], decision.fieldPriority),
      existingRequirementId: null,
      fieldStrategy: null,
    });
    used.add(source.id);
    used.add(target.id);
  }
  for (const row of parsed.rows) {
    if (used.has(row.id) || skipped.has(row.id)) continue;
    units.push({ ...mergeRows([row]), existingRequirementId: null });
  }
  return units;
}

function resolveUser(db, displayName) {
  const normalized = String(displayName).trim().toLocaleLowerCase("zh-CN");
  const matches = db.prepare(`
    SELECT id FROM users
    WHERE active = 1 AND (lower(username) = ? OR lower(display_name) = ?)
  `).all(normalized, normalized);
  const ids = [...new Set(matches.map((row) => row.id))];
  return ids.length === 1 ? ids[0] : null;
}

function existingDictionaryId(db, type, label) {
  if (!label) return null;
  const rows = db.prepare("SELECT id FROM dictionaries WHERE type = ? AND active = 1 AND lower(label) = lower(?) ORDER BY sort_order, id").all(type, label);
  return rows[0]?.id || null;
}

export function assertInitialImportOpen(db) {
  if (getSystemSetting(db, "initial_import_completed_at")) {
    throw new PitApiError(409, "initial_import_completed", "首次导入已完成，不能再次导入");
  }
}

export function createPitImportService({
  db,
  config,
  backupService = createPitBackup,
  workbookParser = parsePitWorkbook,
  backupVerifier = verifyPitBackup,
  clock = () => new Date(),
}) {
  if (!db) throw new TypeError("createPitImportService requires db");
  const directory = importDirectory(config);
  const committingJobs = new Set();

  async function preview({ fileName, bytes }, actor) {
    assertInitialImportOpen(db);
    if (!Buffer.isBuffer(bytes) || bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
      throw unsupportedFileType("文件不是有效的 XLSX ZIP 容器");
    }
    const fileHash = createHash("sha256").update(bytes).digest("hex");
    const existing = db.prepare(`
      SELECT id FROM import_jobs WHERE file_hash = ? AND status IN ('parsing', 'previewed', 'committing', 'committed')
      ORDER BY created_at DESC LIMIT 1
    `).get(fileHash);
    if (existing) {
      throw new PitApiError(409, "duplicate_preview", "相同文件已有预检批次", {
        fields: { existingImportId: existing.id },
      });
    }

    const id = randomUUID();
    const sourcePath = path.join(directory, `${id}.xlsx`);
    const createdAt = dateFromClock(clock).toISOString();
    db.prepare(`
      INSERT INTO import_jobs (
        id, file_name, file_hash, status, summary_json, source_path,
        error_message, created_by, created_at, committed_at
      ) VALUES (?, ?, ?, 'parsing', '{}', ?, NULL, ?, ?, NULL)
    `).run(id, fileName, fileHash, sourcePath, actor.id, createdAt);

    try {
      fs.writeFileSync(sourcePath, bytes, { flag: "wx" });
      const parsed = await workbookParser(sourcePath);
      enrichDictionaryIssues(db, parsed);
      const summary = summarize(parsed);
      withImmediateTransaction(db, () => {
        assertInitialImportOpen(db);
        const current = importJobRow(db, id);
        if (!current || current.status !== "parsing") failValidation("导入预检状态已变化");
        const insert = db.prepare(`
          INSERT INTO import_rows (
            id, import_job_id, sheet_name, row_number, raw_json,
            normalized_json, issue_json, decision_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
        `);
        for (const row of parsed.rows) {
          insert.run(
            row.id,
            id,
            row.sheetName,
            row.rowNumber,
            JSON.stringify(row.raw),
            JSON.stringify(row.normalized),
            JSON.stringify(row.issues),
          );
        }
        db.prepare(`
          UPDATE import_jobs SET status = 'previewed', summary_json = ?, error_message = NULL WHERE id = ? AND status = 'parsing'
        `).run(JSON.stringify(summary), id);
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "import.preview",
          resourceType: "import",
          resourceId: id,
          after: { fileName, fileHash, summary: publicSummary(summary) },
          createdAt,
        });
      });
      return toJob(importJobRow(db, id));
    } catch (error) {
      removeIfPresent(sourcePath);
      const message = safeMessage(error, "工作簿解析失败");
      db.prepare(`
        UPDATE import_jobs SET status = 'failed', source_path = NULL, error_message = ?
        WHERE id = ? AND status = 'parsing'
      `).run(message, id);
      if (error instanceof PitApiError) throw error;
      throw new PitApiError(422, "import_parse_failed", "工作簿解析失败", { cause: error });
    }
  }

  function get(id, query = {}) {
    const row = importJobRow(db, id);
    if (!row) throw notFound("导入批次不存在");
    const page = positiveInteger(query.page, "page", 1, Number.MAX_SAFE_INTEGER);
    const pageSize = positiveInteger(query.pageSize, "pageSize", 20, 100);
    const total = db.prepare("SELECT count(*) AS count FROM import_rows WHERE import_job_id = ?").get(id).count;
    const rows = db.prepare(`
      SELECT id, sheet_name, row_number, raw_json, normalized_json, issue_json, decision_json
      FROM import_rows WHERE import_job_id = ?
      ORDER BY sheet_name, row_number, id LIMIT ? OFFSET ?
    `).all(id, pageSize, (page - 1) * pageSize).map((item) => ({
      id: item.id,
      sheetName: item.sheet_name,
      rowNumber: item.row_number,
      raw: JSON.parse(item.raw_json),
      normalized: JSON.parse(item.normalized_json),
      issues: JSON.parse(item.issue_json),
      decision: item.decision_json ? JSON.parse(item.decision_json) : null,
    }));
    const summary = parseSummary(row);
    return {
      job: toJob(row),
      rows,
      total,
      page,
      pageSize,
      issues: summary.parser?.issues || [],
      duplicateGroups: summary.parser?.duplicateGroups || [],
      highlights: summary.parser?.highlights || [],
    };
  }

  function list() {
    return {
      items: db.prepare(`
        SELECT id, file_name, file_hash, status, summary_json, source_path,
          error_message, created_by, created_at, committed_at
        FROM import_jobs ORDER BY created_at DESC, id DESC
      `).all().map(toJob),
    };
  }

  function saveDecisions(id, input, actor) {
    assertInitialImportOpen(db);
    if (committingJobs.has(id)) {
      throw new PitApiError(409, "import_commit_in_progress", "导入批次正在提交，不能修改决策");
    }
    const jobRow = importJobRow(db, id);
    if (!jobRow) throw notFound("导入批次不存在");
    if (jobRow.status !== "previewed") failValidation("只有预检完成的批次可以保存决策");
    const parsed = parsedFromDatabase(db, jobRow);
    const decisions = validateDecisions(db, parsed, input);
    const summary = summarize(parsed, decisions);
    const timestamp = dateFromClock(clock).toISOString();
    withImmediateTransaction(db, () => {
      const rowDecision = new Map(decisions.rows.map((item) => [item.rowId, { ...item }]));
      for (const group of decisions.duplicateGroups) {
        const source = parsed.duplicateGroups.find((item) => item.jiraTicket === group.jiraTicket);
        for (const rowId of source.rowIds) {
          rowDecision.set(rowId, {
            ...(rowDecision.get(rowId) || {}),
            duplicateAction: group.action,
            ...(group.targetRowId ? { duplicateTargetRowId: group.targetRowId } : {}),
            ...(group.fieldPriority ? { fieldPriority: group.fieldPriority } : {}),
          });
        }
      }
      const update = db.prepare("UPDATE import_rows SET decision_json = ? WHERE id = ? AND import_job_id = ?");
      for (const row of parsed.rows) {
        const decision = rowDecision.get(row.id);
        update.run(decision ? JSON.stringify(decision) : null, row.id, id);
      }
      db.prepare("UPDATE import_jobs SET summary_json = ?, error_message = NULL WHERE id = ?")
        .run(JSON.stringify(summary), id);
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "import.decisions.update",
        resourceType: "import",
        resourceId: id,
        after: { decisions, blockingIssueCount: summary.blockingIssueCount },
        createdAt: timestamp,
      });
    });
    return toJob(importJobRow(db, id));
  }

  function markCommitFailed(id, actor, message, backupId, createdAt) {
    try {
      withImmediateTransaction(db, () => {
        const changed = db.prepare(`
          UPDATE import_jobs SET status = 'failed', error_message = ?
          WHERE id = ? AND status = 'previewed'
        `).run(message, id);
        if (changed.changes !== 1) return;
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "import.fail",
          resourceType: "import",
          resourceId: id,
          after: { status: "failed" },
          metadata: backupId ? { backupId } : undefined,
          createdAt,
        });
      });
      return null;
    } catch (auditError) {
      try {
        withImmediateTransaction(db, () => {
          db.prepare(`
            UPDATE import_jobs SET status = 'failed', error_message = ?
            WHERE id = ? AND status = 'previewed'
          `).run(message, id);
        });
      } catch (statusError) {
        auditError.statusError = statusError;
      }
      return auditError;
    }
  }

  async function commit(id, actor) {
    assertInitialImportOpen(db);
    if (committingJobs.has(id)) {
      throw new PitApiError(409, "import_commit_in_progress", "导入批次正在提交");
    }
    const initialJob = importJobRow(db, id);
    if (!initialJob) throw notFound("导入批次不存在");
    if (initialJob.status !== "previewed") failValidation("只有预检完成的批次可以提交");
    if (parseSummary(initialJob).blockingIssueCount !== 0) {
      failValidation("仍有阻断问题未处理，不能提交", "decisions");
    }
    committingJobs.add(id);
    let backup;
    try {
      try {
        backup = await backupService({
          db,
          config,
          kind: "pre_import",
          actorId: actor.id,
          clock,
        });
        const resolvedBackup = resolvePitBackupDownload({ db, config, id: backup.id });
        backup = resolvedBackup.backup;
        const verifiedBackup = await backupVerifier(resolvedBackup.filePath, backup.schemaVersion);
        if (verifiedBackup.size !== backup.byteSize || verifiedBackup.sha256 !== backup.sha256) {
          throw new Error("Verified backup does not match its catalog record");
        }
      } catch (error) {
        throw new PitApiError(500, "pre_import_backup_failed", "导入前备份失败或验证未通过，已阻止导入", { cause: error });
      }

      const timestamp = dateFromClock(clock).toISOString();
      try {
        const imported = withImmediateTransaction(db, () => {
        assertInitialImportOpen(db);
        const current = importJobRow(db, id);
        if (!current || current.status !== "previewed") failValidation("导入批次状态已变化");
        const summary = parseSummary(current);
        if (summary.blockingIssueCount !== 0) failValidation("仍有阻断问题未处理，不能提交", "decisions");
        const parsed = parsedFromDatabase(db, current);
        const decisions = summary.decisions;

        const decisionDictionaryIds = new Map();
        for (const decision of decisions.dictionaryMappings) {
          const key = `${decision.type}\u0000${decision.source}`;
          if (decision.action === "clear") {
            decisionDictionaryIds.set(key, null);
            continue;
          }
          if (decision.action === "map") {
            decisionDictionaryIds.set(key, decision.dictionaryId);
            continue;
          }
          const idValue = randomUUID();
          const label = String(decision.label || decision.source).trim();
          const maxOrder = db.prepare("SELECT max(sort_order) AS value FROM dictionaries WHERE type = ?").get(decision.type).value || 0;
          db.prepare(`
            INSERT INTO dictionaries (id, type, code, label, sort_order, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
          `).run(idValue, decision.type, dictionaryCode(db, decision.type, label), label, maxOrder + 10, timestamp, timestamp);
          decisionDictionaryIds.set(key, idValue);
          recordAuditEvent(db, {
            actorUserId: actor.id,
            action: "dictionary.import.create",
            resourceType: "dictionary",
            resourceId: idValue,
            after: { type: decision.type, label, active: true },
            metadata: { importJobId: id },
            createdAt: timestamp,
          });
        }

        const dictionaryId = (type, label) => {
          if (!label) return null;
          const key = `${type}\u0000${label}`;
          return decisionDictionaryIds.has(key)
            ? decisionDictionaryIds.get(key)
            : existingDictionaryId(db, type, label);
        };
        const statusMappings = new Map(decisions.statusMappings.map((item) => [item.source, item.status]));
        const highlightedRows = new Set();
        for (const highlight of parsed.highlights) {
          const decision = decisions.highlights.find((item) => item.rowNumber === highlight.rowNumber);
          if (decision?.action === "skip") continue;
          if (decision?.action === "match") highlightedRows.add(decision.targetRowId);
          else if (highlight.match === "matched") highlightedRows.add(highlight.matchedRowIds[0]);
        }

        const units = buildImportUnits(parsed, decisions);
        let lastNumber = db.prepare(`
          SELECT max(CAST(substr(requirement_no, 5) AS INTEGER)) AS value FROM requirements
          WHERE requirement_no GLOB 'REQ-[0-9][0-9][0-9][0-9][0-9][0-9]'
        `).get().value || 0;
        let insertedCount = 0;
        for (const unit of units) {
          const source = unit.normalized;
          const status = statusMappings.get(source.sourceStatus) || source.statusSuggestion;
          if (!STATUS_SET.has(status)) throw new Error(`Unresolved status for import row ${unit.sourceRows[0].id}`);
          const requirementTypeId = dictionaryId("requirement_type", source.requirementType);
          const sourceId = dictionaryId("requirement_source", source.requirementSource);
          const problemCategoryId = dictionaryId("problem_category", source.problemCategory);
          const industryId = dictionaryId("industry", source.industry);
          const productLineIds = union(source.productLines.map((label) => dictionaryId("product_line", label)).filter(Boolean));
          const isHighlighted = unit.sourceRows.some((row) => highlightedRows.has(row.id)) ? 1 : 0;
          let requirementId = unit.existingRequirementId;
          let requirementNo;
          let requirementBefore = null;
          let relationStrategy = {
            productLines: "source",
            mids: "source",
            developers: "source",
            testers: "source",
          };
          if (requirementId) {
            const existing = db.prepare(`
              SELECT requirement_no, jira_ticket, title, description, use_case, notes,
                status, priority, requirement_type_id, source_id, problem_category_id,
                industry_id, customer_manager, implementation_side, proposed_at,
                planned_year, planned_month, version_no, development_started_at,
                development_completed_at, pos_merge_version, is_highlighted, paused_from_status
              FROM requirements WHERE id = ? AND deleted_at IS NULL
            `).get(requirementId);
            if (!existing) throw new Error(`Merge target ${requirementId} no longer exists`);
            requirementBefore = { ...existing };
            requirementNo = existing.requirement_no;
            const strategy = unit.fieldStrategy;
            if (!strategy) throw new Error(`Merge target ${requirementId} is missing an explicit field strategy`);
            const choose = (field, existingValue, sourceValue) => strategy[field] === "source" ? sourceValue : existingValue;
            db.prepare(`
              UPDATE requirements SET
                jira_ticket = ?, title = ?, description = ?, use_case = ?, notes = ?,
                status = ?, priority = ?, requirement_type_id = ?, source_id = ?,
                problem_category_id = ?, industry_id = ?, customer_manager = ?,
                implementation_side = ?, proposed_at = ?, planned_year = ?, planned_month = ?,
                version_no = ?, development_started_at = ?, development_completed_at = ?,
                pos_merge_version = ?, paused_from_status = ?, is_highlighted = max(is_highlighted, ?),
                source_sheet = ?, source_row = ?, source_status = ?, import_job_id = ?,
                updated_by = ?, updated_at = ?, row_version = row_version + 1
              WHERE id = ? AND deleted_at IS NULL
            `).run(
              choose("jiraTicket", existing.jira_ticket, source.jiraTicket),
              choose("title", existing.title, source.title),
              choose("description", existing.description, source.description),
              choose("useCase", existing.use_case, source.useCase),
              choose("notes", existing.notes, source.notes),
              choose("status", existing.status, status),
              choose("priority", existing.priority, source.priority),
              choose("requirementType", existing.requirement_type_id, requirementTypeId),
              choose("requirementSource", existing.source_id, sourceId),
              choose("problemCategory", existing.problem_category_id, problemCategoryId),
              choose("industry", existing.industry_id, industryId),
              choose("customerManager", existing.customer_manager, source.customerManager),
              choose("implementationSide", existing.implementation_side, source.implementationSide),
              choose("proposedAt", existing.proposed_at, source.proposedAt),
              choose("plannedYear", existing.planned_year, source.plannedYear),
              choose("plannedMonth", existing.planned_month, source.plannedMonth),
              choose("versionNo", existing.version_no, source.versionNo),
              choose("developmentStartedAt", existing.development_started_at, source.developmentStartedAt),
              choose("developmentCompletedAt", existing.development_completed_at, source.developmentCompletedAt),
              choose("posMergeVersion", existing.pos_merge_version, source.posMergeVersion),
              strategy.status === "source"
                ? status === "paused" ? "review_pending" : null
                : existing.paused_from_status,
              isHighlighted,
              unit.sourceRows.map((row) => row.sheetName).join(","),
              unit.sourceRows[0].rowNumber,
              source.sourceStatus,
              id,
              actor.id,
              timestamp,
              requirementId,
            );
            relationStrategy = {
              productLines: strategy.productLines,
              mids: strategy.mids,
              developers: strategy.developers,
              testers: strategy.testers,
            };
          } else {
            requirementId = randomUUID();
            lastNumber += 1;
            requirementNo = `REQ-${String(lastNumber).padStart(6, "0")}`;
            db.prepare(`
              INSERT INTO requirements (
                id, requirement_no, jira_ticket, title, description, use_case, notes,
                status, priority, requirement_type_id, source_id, problem_category_id,
                industry_id, customer_manager, implementation_side, proposed_at,
                planned_year, planned_month, version_no, development_started_at,
                development_completed_at, pos_merge_version, is_highlighted,
                paused_from_status, source_sheet, source_row, source_status, import_job_id,
                row_version, deleted_at, deleted_by, created_by, updated_by, created_at, updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, 1, NULL, NULL, ?, ?, ?, ?
              )
            `).run(
              requirementId,
              requirementNo,
              source.jiraTicket,
              source.title,
              source.description,
              source.useCase,
              source.notes,
              status,
              source.priority,
              requirementTypeId,
              sourceId,
              problemCategoryId,
              industryId,
              source.customerManager,
              source.implementationSide,
              source.proposedAt,
              source.plannedYear,
              source.plannedMonth,
              source.versionNo,
              source.developmentStartedAt,
              source.developmentCompletedAt,
              source.posMergeVersion,
              isHighlighted,
              status === "paused" ? "review_pending" : null,
              unit.sourceRows.map((row) => row.sheetName).join(","),
              unit.sourceRows[0].rowNumber,
              source.sourceStatus,
              id,
              actor.id,
              actor.id,
              timestamp,
              timestamp,
            );
            insertedCount += 1;
          }

          if (relationStrategy.productLines === "source") {
            db.prepare("DELETE FROM requirement_product_lines WHERE requirement_id = ?").run(requirementId);
            const productLineInsert = db.prepare(`
              INSERT INTO requirement_product_lines (requirement_id, dictionary_id) VALUES (?, ?)
            `);
            for (const dictionaryIdValue of productLineIds) productLineInsert.run(requirementId, dictionaryIdValue);
          }
          if (relationStrategy.mids === "source") {
            db.prepare("DELETE FROM requirement_mids WHERE requirement_id = ?").run(requirementId);
            const midInsert = db.prepare("INSERT INTO requirement_mids (requirement_id, mid) VALUES (?, ?)");
            for (const mid of source.mids) midInsert.run(requirementId, mid);
          }
          const assigneeInsert = db.prepare(`
            INSERT INTO requirement_assignees (
              id, requirement_id, role, user_id, display_name, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?)
          `);
          for (const [role, names] of [["developer", source.developers], ["tester", source.testers]]) {
            const strategyKey = role === "developer" ? "developers" : "testers";
            if (relationStrategy[strategyKey] !== "source") continue;
            db.prepare("DELETE FROM requirement_assignees WHERE requirement_id = ? AND role = ?").run(requirementId, role);
            let sortOrder = 0;
            for (const displayName of names) {
              sortOrder += 10;
              assigneeInsert.run(randomUUID(), requirementId, role, resolveUser(db, displayName), displayName, sortOrder);
            }
          }
          const actualRequirement = db.prepare(`
            SELECT requirement_no, jira_ticket, title, description, use_case, notes,
              status, priority, requirement_type_id, source_id, problem_category_id,
              industry_id, customer_manager, implementation_side, proposed_at,
              planned_year, planned_month, version_no, development_started_at,
              development_completed_at, pos_merge_version, is_highlighted, paused_from_status,
              source_sheet, source_row, source_status, import_job_id
            FROM requirements WHERE id = ?
          `).get(requirementId);
          const actualRelations = {
            productLineIds: db.prepare(`
              SELECT dictionary_id FROM requirement_product_lines WHERE requirement_id = ? ORDER BY dictionary_id
            `).all(requirementId).map((row) => row.dictionary_id),
            mids: db.prepare("SELECT mid FROM requirement_mids WHERE requirement_id = ? ORDER BY mid")
              .all(requirementId).map((row) => row.mid),
            assignees: db.prepare(`
              SELECT role, user_id, display_name, sort_order FROM requirement_assignees
              WHERE requirement_id = ? ORDER BY role, sort_order, id
            `).all(requirementId),
          };
          recordAuditEvent(db, {
            actorUserId: actor.id,
            action: "requirement.import",
            resourceType: "requirement",
            resourceId: requirementId,
            before: requirementBefore,
            after: { ...actualRequirement, relations: actualRelations },
            metadata: {
              importJobId: id,
              sourceRows: unit.sourceRows.map((row) => ({ id: row.id, sheetName: row.sheetName, rowNumber: row.rowNumber })),
              mergedIntoExisting: Boolean(unit.existingRequirementId),
              ...(unit.fieldStrategy ? { fieldStrategy: unit.fieldStrategy } : {}),
            },
            createdAt: timestamp,
          });
        }

        const committedSummary = { ...summary, importedCount: units.length, backupId: backup.id };
        const committedJob = db.prepare(`
          UPDATE import_jobs SET status = 'committed', summary_json = ?, error_message = NULL, committed_at = ?
          WHERE id = ? AND status = 'previewed'
        `).run(JSON.stringify(committedSummary), timestamp, id);
        if (committedJob.changes !== 1) failValidation("导入批次状态已变化");
        db.prepare(`
          INSERT INTO system_settings (key, value_json, updated_at)
          VALUES ('initial_import_completed_at', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
        `).run(JSON.stringify(timestamp), timestamp);
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "import.commit",
          resourceType: "import",
          resourceId: id,
          after: { status: "committed", importedCount: units.length, insertedCount, backupId: backup.id },
          createdAt: timestamp,
        });
        return { importedCount: units.length, insertedCount };
      });
      return { job: toJob(importJobRow(db, id)), ...imported, backup };
    } catch (error) {
      const message = safeMessage(error, "导入提交失败");
      const markError = markCommitFailed(id, actor, message, backup.id, timestamp);
      if (markError) error.markFailedError = markError;
      if (error instanceof PitApiError) throw error;
      throw new PitApiError(500, "import_commit_failed", "导入提交失败，业务数据已回滚，导入前备份已保留", { cause: error });
      }
    } finally {
      committingJobs.delete(id);
    }
  }

  return { preview, get, list, saveDecisions, commit };
}
