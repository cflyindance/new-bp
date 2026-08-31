import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { recordAuditEvent } from "./pit-audit-service.mjs";
import { withImmediateTransaction } from "./pit-database.mjs";
import { PitApiError, exportExpired, notFound, permissionDenied, validationFailed } from "./pit-errors.mjs";
import {
  buildRequirementListSql,
  parseRequirementListQuery,
  requirementFromListRow,
} from "./pit-requirement-service.mjs";

export const PIT_EXPORT_COLUMNS = [
  "提出时间", "实现月份", "实现年度", "Jira Ticket", "需求描述", "产品需求名称",
  "使用场景描述", "补充说明", "需求来源", "需求类别", "状态", "产品线", "前后端",
  "研发", "优先级", "问题分类", "MID", "版本号", "研发开始时间", "研发完成时间", "测试", "合入POS",
];

const STATUS_LABELS = {
  review_pending: "待评审",
  design_pending: "待设计",
  scheduling_pending: "待排期",
  development: "研发中",
  testing: "测试中",
  completed: "已完成",
  paused: "已暂停",
  rejected: "已拒绝",
};
const PRIORITY_LABELS = { urgent: "紧急", high: "高", medium: "中", low: "低" };
const SIDE_LABELS = { frontend: "前端", backend: "后端", both: "前后端" };
const EXPORT_JOB_COLUMNS = `
  id, filter_json, row_count, file_name, status, error_message,
  created_by, created_at, completed_at, expires_at
`;

function dateFromClock(clock) {
  const date = new Date(clock());
  if (Number.isNaN(date.getTime())) throw new TypeError("clock must return a valid date");
  return date;
}

function exportDirectory(config) {
  const directory = path.resolve(config?.exportsDir || path.join(config?.dataDir || ".data/pit", "exports"));
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function safeStoredPath(directory, fileName) {
  if (typeof fileName !== "string" || !fileName || path.basename(fileName) !== fileName) {
    throw notFound("导出文件不存在");
  }
  const resolved = path.resolve(directory, fileName);
  const relative = path.relative(directory, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw notFound("导出文件不存在");
  return resolved;
}

function cleanFilter(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationFailed("导出筛选必须是对象");
  }
  const { page: _page, pageSize: _pageSize, ...result } = input;
  return result;
}

function toExportJob(row, now) {
  const expired = Boolean(row.expires_at && new Date(row.expires_at).getTime() <= now.getTime());
  return {
    id: row.id,
    filter: JSON.parse(row.filter_json),
    rowCount: row.row_count,
    fileName: row.file_name,
    status: row.status,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    expired,
    downloadable: row.status === "completed" && !expired && Boolean(row.file_name),
  };
}

function statusValue(requirement) {
  const normalized = `${STATUS_LABELS[requirement.status] || requirement.status} [${requirement.status}]`;
  return requirement.sourceStatus ? `${normalized}；源状态：${requirement.sourceStatus}` : normalized;
}

function joinNames(requirement, role) {
  return requirement.assignees
    .filter((item) => item.role === role)
    .map((item) => item.displayName)
    .join("、");
}

function exportRow(requirement) {
  return [
    requirement.proposedAt || "",
    requirement.plannedMonth || "",
    requirement.plannedYear || "",
    requirement.jiraTicket || "",
    requirement.description || "",
    requirement.title || "",
    requirement.useCase || "",
    requirement.notes || "",
    requirement.source?.label || "",
    requirement.requirementType?.label || "",
    statusValue(requirement),
    requirement.productLines.map((item) => item.label).join("、"),
    SIDE_LABELS[requirement.implementationSide] || requirement.implementationSide || "",
    joinNames(requirement, "developer"),
    PRIORITY_LABELS[requirement.priority] || requirement.priority || "",
    requirement.problemCategory?.label || "",
    requirement.mids.join("、"),
    requirement.versionNo || "",
    requirement.developmentStartedAt || "",
    requirement.developmentCompletedAt || "",
    joinNames(requirement, "tester"),
    requirement.posMergeVersion || "",
  ];
}

async function writeWorkbook(filePath, requirements) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PIT 需求池";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("PIT需求池", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.addRow(PIT_EXPORT_COLUMNS);
  for (const requirement of requirements) sheet.addRow(exportRow(requirement));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: PIT_EXPORT_COLUMNS.length } };
  sheet.getRow(1).height = 24;
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2457C5" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  const widths = [14, 10, 10, 18, 38, 30, 32, 32, 16, 16, 28, 18, 12, 18, 10, 16, 24, 16, 14, 14, 18, 16];
  sheet.columns.forEach((column, index) => {
    column.width = widths[index];
    column.font = { name: "Arial", size: 10 };
    column.alignment = { vertical: "top", wrapText: true };
  });
  await workbook.xlsx.writeFile(filePath);

  const check = new ExcelJS.Workbook();
  await check.xlsx.readFile(filePath);
  const checkSheet = check.getWorksheet("PIT需求池");
  if (!checkSheet || checkSheet.columnCount !== PIT_EXPORT_COLUMNS.length) {
    throw new Error("生成的导出工作簿结构不完整");
  }
}

function removeIfPresent(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export function cleanupExpiredPitExports({ db, config, clock = () => new Date() }) {
  if (!db) throw new TypeError("cleanupExpiredPitExports requires db");
  const directory = exportDirectory(config);
  const now = dateFromClock(clock);
  const rows = db.prepare(`
    SELECT id, file_name
    FROM export_jobs
    WHERE expires_at IS NOT NULL AND expires_at <= ? AND file_name IS NOT NULL
  `).all(now.toISOString());
  const removed = [];
  const skipped = [];
  for (const row of rows) {
    try {
      removeIfPresent(safeStoredPath(directory, row.file_name));
      removed.push(row.id);
    } catch {
      // Preserve the history row and skip unsafe/corrupt catalog paths.
      skipped.push(row.id);
    }
  }
  return { removed, skipped };
}

export function scheduleExpiredPitExportCleanup({
  db,
  config,
  logger = console,
  clock = () => new Date(),
  intervalMs = 60 * 60 * 1000,
}) {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1_000) {
    throw new TypeError("intervalMs must be an integer of at least 1000 milliseconds");
  }
  let stopped = false;
  let timer = null;
  let currentRun = null;
  function runNow() {
    if (currentRun) return currentRun;
    currentRun = Promise.resolve()
      .then(() => cleanupExpiredPitExports({ db, config, clock }))
      .finally(() => { currentRun = null; });
    return currentRun;
  }
  function arm() {
    if (stopped) return;
    timer = setTimeout(async () => {
      try {
        await runNow();
      } catch (error) {
        logger?.error?.("PIT expired export cleanup failed", error);
      } finally {
        arm();
      }
    }, intervalMs);
    timer.unref?.();
  }
  const ready = runNow().catch((error) => {
    logger?.error?.("PIT expired export cleanup failed", error);
    return { removed: [], skipped: [], failed: true };
  }).finally(arm);
  return {
    ready,
    runNow,
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      await currentRun?.catch(() => undefined);
    },
  };
}

export function createPitExportService({ db, config, clock = () => new Date() }) {
  const directory = exportDirectory(config);

  async function createExport(input, actor) {
    const filter = cleanFilter(input || {});
    const compiled = parseRequirementListQuery({ ...filter, page: 1, pageSize: 100 }, actor);
    const built = buildRequirementListSql(compiled, { paginate: false });
    const id = randomUUID();
    const createdAt = dateFromClock(clock);
    const fileName = `pit-requirements-${createdAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${id}.xlsx`;
    const filePath = safeStoredPath(directory, fileName);
    withImmediateTransaction(db, () => {
      db.prepare(`
        INSERT INTO export_jobs (
          id, filter_json, row_count, file_name, status, error_message,
          created_by, created_at, completed_at, expires_at
        ) VALUES (?, ?, NULL, NULL, 'processing', NULL, ?, ?, NULL, NULL)
      `).run(id, JSON.stringify(filter), actor.id, createdAt.toISOString());
      recordAuditEvent(db, {
        actorUserId: actor.id,
        action: "export.create",
        resourceType: "export",
        resourceId: id,
        after: { id, filter, status: "processing" },
        createdAt: createdAt.toISOString(),
      });
    });

    try {
      const rows = db.prepare(built.selectSql).all(...built.selectParams);
      const requirements = rows.map((row) => requirementFromListRow(db, row, actor));
      await writeWorkbook(filePath, requirements);
      const completedAt = dateFromClock(clock);
      const expiresAt = new Date(completedAt.getTime() + 24 * 60 * 60 * 1000);
      withImmediateTransaction(db, () => {
        db.prepare(`
          UPDATE export_jobs
          SET row_count = ?, file_name = ?, status = 'completed', error_message = NULL,
            completed_at = ?, expires_at = ?
          WHERE id = ?
        `).run(requirements.length, fileName, completedAt.toISOString(), expiresAt.toISOString(), id);
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "export.complete",
          resourceType: "export",
          resourceId: id,
          after: { rowCount: requirements.length, fileName, expiresAt: expiresAt.toISOString() },
          createdAt: completedAt.toISOString(),
        });
      });
      return toExportJob(db.prepare(`SELECT ${EXPORT_JOB_COLUMNS} FROM export_jobs WHERE id = ?`).get(id), completedAt);
    } catch (error) {
      removeIfPresent(filePath);
      const failedAt = dateFromClock(clock).toISOString();
      const readable = String(error?.message || "导出生成失败").slice(0, 1000);
      withImmediateTransaction(db, () => {
        db.prepare(`
          UPDATE export_jobs SET row_count = NULL, file_name = NULL, status = 'failed',
            error_message = ?, completed_at = NULL, expires_at = NULL WHERE id = ?
        `).run(readable, id);
        recordAuditEvent(db, {
          actorUserId: actor.id,
          action: "export.fail",
          resourceType: "export",
          resourceId: id,
          after: { status: "failed", errorMessage: readable },
          createdAt: failedAt,
        });
      });
      throw new PitApiError(500, "export_failed", `导出失败：${readable}`);
    }
  }

  function expireFile(row, now) {
    if (!row.expires_at || new Date(row.expires_at).getTime() > now.getTime() || !row.file_name) return;
    removeIfPresent(safeStoredPath(directory, row.file_name));
  }

  function listExports(query, actor) {
    const scope = query?.scope || "mine";
    if (!new Set(["mine", "all"]).has(scope)) throw validationFailed("scope 不合法");
    if (scope === "all" && actor.role !== "admin") throw permissionDenied("只有管理员可以查看全部导出历史");
    const rows = scope === "all"
      ? db.prepare(`SELECT ${EXPORT_JOB_COLUMNS} FROM export_jobs ORDER BY created_at DESC, id DESC`).all()
      : db.prepare(`SELECT ${EXPORT_JOB_COLUMNS} FROM export_jobs WHERE created_by = ? ORDER BY created_at DESC, id DESC`).all(actor.id);
    const now = dateFromClock(clock);
    for (const row of rows) expireFile(row, now);
    return { items: rows.map((row) => toExportJob(row, now)) };
  }

  function resolveDownload(id, actor) {
    const row = db.prepare(`SELECT ${EXPORT_JOB_COLUMNS} FROM export_jobs WHERE id = ?`).get(id);
    if (!row) throw notFound("导出任务不存在");
    if (row.created_by !== actor.id && actor.role !== "admin") throw permissionDenied("不能下载其他用户的导出文件");
    const now = dateFromClock(clock);
    if (row.expires_at && new Date(row.expires_at).getTime() <= now.getTime()) {
      expireFile(row, now);
      throw exportExpired();
    }
    if (row.status !== "completed" || !row.file_name) throw notFound("导出文件不可用");
    const filePath = safeStoredPath(directory, row.file_name);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) throw notFound("导出文件不存在");
    return { filePath, fileName: row.file_name, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  }

  return { createExport, listExports, resolveDownload };
}
