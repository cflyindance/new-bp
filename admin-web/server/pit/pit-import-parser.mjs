import fs from "node:fs";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import JSZip from "jszip";

export const PIT_STANDARD_SHEETS = [
  "Kiosk",
  "E-Menu",
  "TipOut",
  "PayRoll",
  "云报表",
  "壳子",
  "PayPad",
  "新B平台",
  "其他",
];

export const PIT_SOURCE_HEADERS = [
  "提出时间",
  "实现月份",
  "实现年度",
  "Jira Ticket",
  "需求描述",
  "产品需求名称",
  "使用场景描述",
  "补充说明",
  "需求来源",
  "需求类别",
  "状态",
  "产品线",
  "前后端",
  "研发",
  "优先级",
  "问题分类",
  "MID",
  "版本号",
  "研发开始时间",
  "研发完成时间",
  "测试",
  "合入POS",
];

const FORMULA_TYPE = 6;
const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_SIGNATURE = 0x04034b50;
const MAX_ZIP_ENTRIES = 10_000;
const MAX_SINGLE_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 256 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 300;
const MAX_WORKSHEET_ROWS = 100_000;
const MAX_WORKSHEET_COLUMNS = 512;
const MAX_STANDARD_ROWS = 250_000;
const MAX_CELL_TEXT_LENGTH = 100_000;
const DATE_HEADERS = new Set(["提出时间", "研发开始时间", "研发完成时间"]);
const OPTIONAL_SOURCE_HEADERS = ["业态", "客户经理"];
const HEADER_ALIASES = new Map([
  ["合入POS", ["合入POS", "已合入版本", "合入POS基线建议"]],
]);
const OPTIONAL_CANONICAL_HEADERS = new Set(["合入POS"]);
const PRIORITIES = new Map([
  ["紧急", "urgent"],
  ["急", "urgent"],
  ["最高", "urgent"],
  ["高", "high"],
  ["中", "medium"],
  ["普通", "medium"],
  ["低", "low"],
]);

function unsafeWorkbook(message) {
  const error = new Error(message);
  error.code = "unsafe_workbook_archive";
  throw error;
}

function containsZip64Extra(buffer, start, length) {
  const end = start + length;
  let offset = start;
  while (offset + 4 <= end) {
    const id = buffer.readUInt16LE(offset);
    const size = buffer.readUInt16LE(offset + 2);
    offset += 4;
    if (offset + size > end) unsafeWorkbook("ZIP extra field is truncated");
    if (id === 0x0001) return true;
    offset += size;
  }
  if (offset !== end) unsafeWorkbook("ZIP extra field is malformed");
  return false;
}

function preflightWorkbookArchive(buffer) {
  const minimumEocd = Math.max(0, buffer.length - 65_557);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= minimumEocd; offset -= 1) {
    if (buffer.readUInt32LE(offset) !== ZIP_EOCD_SIGNATURE) continue;
    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + 22 + commentLength === buffer.length) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) unsafeWorkbook("ZIP end-of-central-directory record is missing");
  const disk = buffer.readUInt16LE(eocd + 4);
  const centralDisk = buffer.readUInt16LE(eocd + 6);
  const diskEntries = buffer.readUInt16LE(eocd + 8);
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (disk !== 0 || centralDisk !== 0 || diskEntries !== totalEntries) unsafeWorkbook("Multi-disk ZIP files are not accepted");
  if (totalEntries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) unsafeWorkbook("Zip64 workbooks are not accepted");
  if (totalEntries < 1 || totalEntries > MAX_ZIP_ENTRIES) unsafeWorkbook("Workbook ZIP entry count exceeds the safe limit");
  const centralEnd = centralOffset + centralSize;
  if (!Number.isSafeInteger(centralEnd) || centralOffset < 0 || centralEnd !== eocd || centralEnd > buffer.length) {
    unsafeWorkbook("ZIP central-directory offsets are invalid");
  }

  const names = new Set();
  const localOffsets = new Set();
  let totalUncompressed = 0;
  let pointer = centralOffset;
  for (let index = 0; index < totalEntries; index += 1) {
    if (pointer + 46 > centralEnd || buffer.readUInt32LE(pointer) !== ZIP_CENTRAL_SIGNATURE) {
      unsafeWorkbook("ZIP central-directory entry is malformed");
    }
    const flags = buffer.readUInt16LE(pointer + 8);
    const method = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const uncompressedSize = buffer.readUInt32LE(pointer + 24);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const diskStart = buffer.readUInt16LE(pointer + 34);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const entryEnd = pointer + 46 + nameLength + extraLength + commentLength;
    if (entryEnd > centralEnd) unsafeWorkbook("ZIP central-directory entry extends out of bounds");
    if (flags & 0x0001) unsafeWorkbook("Encrypted workbook entries are not accepted");
    if (method !== 0 && method !== 8) unsafeWorkbook("Workbook uses an unsupported ZIP compression method");
    if (diskStart !== 0 || localOffset === 0xffffffff || compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      unsafeWorkbook("Zip64 or multi-disk workbook entries are not accepted");
    }
    if (containsZip64Extra(buffer, pointer + 46 + nameLength, extraLength)) unsafeWorkbook("Zip64 workbook entries are not accepted");
    if (uncompressedSize > MAX_SINGLE_UNCOMPRESSED_BYTES) unsafeWorkbook("A workbook entry exceeds the uncompressed size limit");
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) unsafeWorkbook("Workbook uncompressed size exceeds the safe limit");
    if (uncompressedSize > 1024 * 1024 && uncompressedSize / Math.max(1, compressedSize) > MAX_COMPRESSION_RATIO) {
      unsafeWorkbook("Workbook compression ratio exceeds the safe limit");
    }
    const name = buffer.subarray(pointer + 46, pointer + 46 + nameLength).toString("utf8").replace(/\\/g, "/");
    if (!name || name.includes("\0") || name.startsWith("/") || name.split("/").includes("..") || names.has(name)) {
      unsafeWorkbook("Workbook ZIP entry name is unsafe or duplicated");
    }
    names.add(name);
    if (localOffsets.has(localOffset) || localOffset + 30 > centralOffset || buffer.readUInt32LE(localOffset) !== ZIP_LOCAL_SIGNATURE) {
      unsafeWorkbook("Workbook ZIP local-header offset is invalid or duplicated");
    }
    localOffsets.add(localOffset);
    const localFlags = buffer.readUInt16LE(localOffset + 6);
    const localMethod = buffer.readUInt16LE(localOffset + 8);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if ((localFlags & 0x0001) || localMethod !== method || dataOffset + compressedSize > centralOffset) {
      unsafeWorkbook("Workbook ZIP local entry is inconsistent or out of bounds");
    }
    pointer = entryEnd;
  }
  if (pointer !== centralEnd) unsafeWorkbook("ZIP central-directory size does not match its entries");
}

function assertCellTextLength(value, field) {
  const visit = (item) => {
    if (typeof item === "string" && item.length > MAX_CELL_TEXT_LENGTH) {
      unsafeWorkbook(`Cell ${field} exceeds the text length limit`);
    }
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    for (const child of Object.values(item)) visit(child);
  };
  visit(value);
}

function toHalfWidth(value) {
  return String(value)
    .replace(/\u3000/g, " ")
    .replace(/[！-～]/g, (character) => String.fromCharCode(character.charCodeAt(0) - 0xfee0));
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return toHalfWidth(value)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, ""))
    .join("\n")
    .replace(/^[\s\u00a0]+|[\s\u00a0]+$/g, "");
}

function serializableValue(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(serializableValue);
  if (Object.hasOwn(value, "richText")) {
    return value.richText.map((part) => part.text || "").join("");
  }
  if (Object.hasOwn(value, "text") && Object.hasOwn(value, "hyperlink")) return value.text;
  if (Object.hasOwn(value, "error")) return { error: value.error };
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializableValue(item)]));
}

function readableCell(cell, issues, field) {
  const value = cell.value;
  assertCellTextLength(value, field);
  const isFormula = cell.type === FORMULA_TYPE
    || (value && typeof value === "object" && (Object.hasOwn(value, "formula") || Object.hasOwn(value, "sharedFormula")));
  if (!isFormula) {
    if (value && typeof value === "object" && Object.hasOwn(value, "error")) {
      issues.push({ code: "cell_error", severity: "blocking", field, sourceValue: value.error });
      return { raw: serializableValue(value), value: null };
    }
    const readable = value && typeof value === "object" && Object.hasOwn(value, "richText")
      ? value.richText.map((part) => part.text || "").join("")
      : value && typeof value === "object" && Object.hasOwn(value, "text")
        ? value.text
        : value;
    return { raw: serializableValue(value), value: readable };
  }

  const raw = {
    ...(value?.formula === undefined ? {} : { formula: value.formula }),
    ...(value?.sharedFormula === undefined ? {} : { sharedFormula: value.sharedFormula }),
    ...(value?.result === undefined ? {} : { result: serializableValue(value.result) }),
  };
  if (value?.result === undefined || value?.result === null) {
    issues.push({ code: "formula_result_missing", severity: "blocking", field });
    return { raw, value: null };
  }
  if (value.result && typeof value.result === "object" && Object.hasOwn(value.result, "error")) {
    issues.push({ code: "formula_result_error", severity: "blocking", field, sourceValue: value.result.error });
    return { raw, value: null };
  }
  return { raw, value: value.result };
}

function excelSerialToIso(serial) {
  if (!Number.isFinite(serial)) return null;
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + Math.floor(serial) * 86_400_000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function dateToIso(value) {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  if (typeof value === "number") return excelSerialToIso(value);
  const text = normalizeText(value);
  if (!text) return null;
  const monthMatch = /^(\d{4})[-/.年](\d{1,2})(?:月)?$/.exec(text);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    if (month >= 1 && month <= 12) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    }
  }
  const match = /^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function yearValue(value) {
  const text = normalizeText(value);
  const match = /^(\d{4})(?:年)?$/.exec(text);
  return match ? Number(match[1]) : null;
}

function monthValue(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= 12) return value;
  const text = normalizeText(value);
  const match = /^(\d{1,2})(?:月)?$/.exec(text);
  if (!match) return null;
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? month : null;
}

function splitValues(value) {
  const text = normalizeText(value);
  if (!text) return [];
  const result = [];
  const seen = new Set();
  for (const item of text.split(/[\n,，、;；]+/)) {
    const normalized = normalizeText(item);
    const key = normalized.toLocaleLowerCase("zh-CN");
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function implementationSide(value) {
  const text = normalizeText(value).toLowerCase();
  if (!text) return null;
  if (/前.*后|后.*前|both|全栈/.test(text)) return "both";
  if (/前端|frontend/.test(text)) return "frontend";
  if (/后端|backend/.test(text)) return "backend";
  return null;
}

function cleanTicket(value) {
  const ticket = normalizeText(value).replace(/\s+/g, "");
  return ticket || null;
}

export function suggestNormalizedStatus(sourceStatus) {
  const status = normalizeText(sourceStatus).replace(/[，；;]/g, ",");
  if (!status) return "review_pending";
  if (/拒绝/.test(status)) return "rejected";
  if (/暂停/.test(status)) return "paused";
  if (/已完成|已实现/.test(status)) return "completed";
  if (/开发中/.test(status)) return "development";
  if (/测试中|待测试/.test(status)) return "testing";
  if (/已设计|待排期/.test(status)) return "scheduling_pending";
  if (/待设计|设计中|沟通中/.test(status)) return "design_pending";
  if (/待分配|已打回/.test(status)) return "review_pending";
  return null;
}

function normalizeRow(sheetName, rowNumber, cells, optionalCells = {}) {
  const issues = [];
  const raw = {};
  const values = {};
  for (let index = 0; index < PIT_SOURCE_HEADERS.length; index += 1) {
    const header = PIT_SOURCE_HEADERS[index];
    const cell = cells[index];
    const readable = readableCell(cell, issues, header);
    raw[header] = readable.raw;
    values[header] = readable.value;
    if (DATE_HEADERS.has(header) && readable.value !== null && readable.value !== "" && !dateToIso(readable.value)) {
      issues.push({ code: "invalid_date", severity: "blocking", field: header, sourceValue: serializableValue(readable.value) });
    }
  }
  for (const header of OPTIONAL_SOURCE_HEADERS) {
    const cell = optionalCells[header];
    if (!cell) {
      raw[header] = null;
      values[header] = null;
      continue;
    }
    const readable = readableCell(cell, issues, header);
    raw[header] = readable.raw;
    values[header] = readable.value;
  }

  const description = normalizeText(values["需求描述"]);
  const explicitTitle = normalizeText(values["产品需求名称"]);
  const jiraTicket = cleanTicket(values["Jira Ticket"]);
  const sourceStatus = normalizeText(values["状态"]);
  const proposedAt = dateToIso(values["提出时间"]);
  const developmentStartedAt = dateToIso(values["研发开始时间"]);
  const developmentCompletedAt = dateToIso(values["研发完成时间"]);
  const plannedMonth = monthValue(values["实现月份"]);
  const plannedMonthText = normalizeText(values["实现月份"]);
  const priorityText = normalizeText(values["优先级"]);
  const priority = PRIORITIES.get(priorityText) || null;
  const rowProductLines = splitValues(values["产品线"]);
  const productLines = splitValues([sheetName, ...rowProductLines].join(","));
  const statusSuggestion = sourceStatus
    ? suggestNormalizedStatus(sourceStatus)
    : (suggestNormalizedStatus(plannedMonthText) || "review_pending");

  if (!jiraTicket) issues.push({ code: "missing_ticket", severity: "warning", field: "Jira Ticket" });
  if (!explicitTitle && !description) issues.push({ code: "missing_title", severity: "blocking", field: "产品需求名称" });
  if (sourceStatus && !statusSuggestion) {
    issues.push({ code: "unknown_status", severity: "blocking", field: "状态", sourceValue: sourceStatus });
  }
  if (priorityText && !priority) {
    issues.push({ code: "unknown_priority", severity: "warning", field: "优先级", sourceValue: priorityText });
  }

  return {
    id: randomUUID(),
    sheetName,
    rowNumber,
    raw,
    normalized: {
      jiraTicket,
      title: explicitTitle || description,
      description,
      useCase: normalizeText(values["使用场景描述"]) || null,
      notes: normalizeText(values["补充说明"]) || null,
      requirementSource: normalizeText(values["需求来源"]) || null,
      requirementType: normalizeText(values["需求类别"]) || null,
      industry: normalizeText(values["业态"]) || null,
      customerManager: normalizeText(values["客户经理"]) || null,
      sourceStatus,
      statusSuggestion,
      productLines,
      implementationSide: implementationSide(values["前后端"]),
      developers: splitValues(values["研发"]),
      testers: splitValues(values["测试"]),
      priority,
      prioritySource: priorityText || null,
      problemCategory: normalizeText(values["问题分类"]) || null,
      mids: splitValues(values["MID"]),
      versionNo: normalizeText(values["版本号"]) || null,
      proposedAt,
      plannedYear: yearValue(values["实现年度"]),
      plannedMonth,
      plannedMonthSource: plannedMonth === null && plannedMonthText ? plannedMonthText : null,
      developmentStartedAt,
      developmentCompletedAt,
      posMergeVersion: normalizeText(values["合入POS"]) || null,
    },
    issues,
  };
}

function isBlankDataRow(cells) {
  return cells.every((cell) => {
    const value = cell.value;
    if (value && typeof value === "object" && (Object.hasOwn(value, "formula") || Object.hasOwn(value, "sharedFormula"))) {
      return false;
    }
    if (value instanceof Date) return false;
    if (value && typeof value === "object" && Object.hasOwn(value, "richText")) {
      return normalizeText(value.richText.map((part) => part.text || "").join("")) === "";
    }
    return normalizeText(value) === "";
  });
}

function parseHighlights(workbook, rows) {
  const sheet = workbook.getWorksheet("重点需求");
  if (!sheet) return [];
  const headerIndexes = new Map();
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, column) => {
    headerIndexes.set(normalizeText(cell.value), column);
  });
  const ticketColumn = headerIndexes.get("Jira Ticket");
  const titleColumn = headerIndexes.get("需求标题")
    || headerIndexes.get("产品需求名称")
    || headerIndexes.get("需求描述");
  const highlights = [];
  for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const issues = [];
    const ticketValue = ticketColumn
      ? readableCell(row.getCell(ticketColumn), issues, "Jira Ticket").value
      : null;
    const titleValue = titleColumn
      ? readableCell(row.getCell(titleColumn), issues, "产品需求名称").value
      : null;
    const jiraTicket = cleanTicket(ticketValue);
    const title = normalizeText(titleValue);
    if (!jiraTicket && !title && issues.length === 0) continue;
    let candidates = jiraTicket
      ? rows.filter((item) => item.normalized.jiraTicket === jiraTicket)
      : rows.filter((item) => item.normalized.title === title);
    if (jiraTicket && title && candidates.length !== 1) {
      const titleCandidates = candidates.filter((item) => item.normalized.title === title);
      if (titleCandidates.length > 0) candidates = titleCandidates;
    }
    const match = candidates.length === 1 ? "matched" : candidates.length > 1 ? "ambiguous" : "unmatched";
    if (match !== "matched" && (jiraTicket || title)) {
      issues.push({
        code: match === "ambiguous" ? "highlight_ambiguous" : "highlight_unmatched",
        severity: "blocking",
        jiraTicket,
        title: title || null,
        matchedRowIds: candidates.map((item) => item.id),
      });
    }
    highlights.push({
      rowNumber,
      jiraTicket,
      title: title || null,
      match,
      matchedRowIds: candidates.map((item) => item.id),
      issues,
    });
  }
  return highlights;
}

export async function parsePitWorkbook(filePath) {
  const sourceBytes = fs.readFileSync(filePath);
  preflightWorkbookArchive(sourceBytes);
  const zip = await JSZip.loadAsync(sourceBytes);
  const sharedStringsEntry = zip.file("xl/sharedStrings.xml");
  let workbookBytes = sourceBytes;
  if (sharedStringsEntry) {
    const sharedStrings = await sharedStringsEntry.async("string");
    // Some spreadsheet producers emit a leading empty direct-text node before
    // rich-text runs. Excel accepts it, while ExcelJS 4.4 otherwise throws while
    // parsing. Removing only that semantically empty node preserves every run.
    const compatibleSharedStrings = sharedStrings
      .replace(/(<si(?:\s[^>]*)?>)\s*<t(?:\s[^>]*)?>\s*<\/t>(?=\s*<r(?:\s|>))/g, "$1")
      .replace(/(<si(?:\s[^>]*)?>)\s*<t(?:\s[^>]*)?\s*\/>\s*(?=<r(?:\s|>))/g, "$1");
    if (compatibleSharedStrings !== sharedStrings) {
      zip.file("xl/sharedStrings.xml", compatibleSharedStrings);
      workbookBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    }
  }
  const workbook = new ExcelJS.Workbook();
  workbook.calcProperties.fullCalcOnLoad = false;
  await workbook.xlsx.load(workbookBytes, { ignoreNodes: ["picture"] });
  let standardRows = 0;
  for (const sheet of workbook.worksheets) {
    if (sheet.actualRowCount > MAX_WORKSHEET_ROWS || sheet.actualColumnCount > MAX_WORKSHEET_COLUMNS) {
      unsafeWorkbook(`Worksheet ${sheet.name} exceeds safe dimensions`);
    }
    if (PIT_STANDARD_SHEETS.includes(sheet.name)) standardRows += Math.max(0, sheet.actualRowCount - 1);
  }
  if (standardRows > MAX_STANDARD_ROWS) unsafeWorkbook("Standard worksheet rows exceed the safe limit");

  const issues = [];
  const rows = [];
  const processedSheets = [];
  for (const sheetName of PIT_STANDARD_SHEETS) {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      issues.push({ code: "standard_sheet_missing", severity: "blocking", sheetName });
      continue;
    }
    processedSheets.push(sheetName);
    const actualHeaders = [];
    const columnsByHeader = new Map();
    for (let column = 1; column <= sheet.actualColumnCount; column += 1) {
      const header = normalizeText(sheet.getCell(1, column).value);
      actualHeaders.push(header || null);
      if (header && !columnsByHeader.has(header)) columnsByHeader.set(header, column);
    }
    const canonicalColumns = new Map();
    const missingHeaders = [];
    for (const header of PIT_SOURCE_HEADERS) {
      const aliases = HEADER_ALIASES.get(header) || [header];
      const column = aliases.map((alias) => columnsByHeader.get(alias)).find(Boolean);
      if (column) canonicalColumns.set(header, column);
      else if (!OPTIONAL_CANONICAL_HEADERS.has(header)) missingHeaders.push(header);
    }
    if (missingHeaders.length > 0) {
      issues.push({
        code: "source_headers_invalid",
        severity: "blocking",
        sheetName,
        expected: PIT_SOURCE_HEADERS,
        actual: actualHeaders,
        missing: missingHeaders,
      });
      continue;
    }
    for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
      const cells = PIT_SOURCE_HEADERS.map((header) => {
        const column = canonicalColumns.get(header);
        return column ? sheet.getCell(rowNumber, column) : { value: null, type: 0 };
      });
      if (isBlankDataRow(cells)) continue;
      const optionalCells = Object.fromEntries(OPTIONAL_SOURCE_HEADERS.map((header) => {
        const column = columnsByHeader.get(header);
        return [header, column ? sheet.getCell(rowNumber, column) : null];
      }));
      rows.push(normalizeRow(sheetName, rowNumber, cells, optionalCells));
    }
  }

  const duplicateGroups = [];
  const byTicket = new Map();
  for (const row of rows) {
    if (!row.normalized.jiraTicket) continue;
    const group = byTicket.get(row.normalized.jiraTicket) || [];
    group.push(row);
    byTicket.set(row.normalized.jiraTicket, group);
  }
  for (const [jiraTicket, group] of byTicket) {
    if (group.length < 2) continue;
    duplicateGroups.push({ jiraTicket, rowIds: group.map((item) => item.id) });
    for (const row of group) {
      row.issues.push({ code: "duplicate_ticket", severity: "warning", jiraTicket, rowIds: group.map((item) => item.id) });
    }
  }
  duplicateGroups.sort((left, right) => left.jiraTicket.localeCompare(right.jiraTicket));

  const highlights = parseHighlights(workbook, rows);
  const allowed = new Set([...PIT_STANDARD_SHEETS, "重点需求"]);
  const ignoredSheets = workbook.worksheets.map((sheet) => sheet.name).filter((name) => !allowed.has(name));

  return {
    processedSheets,
    ignoredSheets,
    rows,
    issues,
    duplicateGroups,
    highlights,
  };
}
