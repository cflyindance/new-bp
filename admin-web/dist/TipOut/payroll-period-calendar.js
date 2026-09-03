(function (global) {
  "use strict";

  const FIRST_SUPPORTED_YEAR = 2025;
  const ANCHOR_START_UTC = Date.UTC(2025, 11, 21);
  const DAY_MS = 24 * 60 * 60 * 1000;

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
  }

  function isoDate(date) {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
  }

  function formatRangeDate(date) {
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
    return `${pad2(date.getUTCMonth() + 1)}/${pad2(date.getUTCDate())}/${date.getUTCFullYear()} (${weekday})`;
  }

  function formatPaycheckDate(end) {
    const date = addDays(end, 6);
    return `${pad2(date.getUTCMonth() + 1)}.${pad2(date.getUTCDate())}.${String(date.getUTCFullYear()).slice(-2)}`;
  }

  function parseCalendarDate(value) {
    const match = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date;
  }

  function parsePeriodRange(period) {
    if (!period || typeof period !== "object") return null;
    let start = parseCalendarDate(period.startDate);
    let end = parseCalendarDate(period.endDate);
    if (!start || !end) {
      const matches = String(period.rangeLabel || "").match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
      start = parseCalendarDate(matches[0]);
      end = parseCalendarDate(matches[1]);
    }
    if (!start || !end || end.getTime() - start.getTime() !== 13 * DAY_MS) return null;
    if (start.getUTCDay() !== 0 || end.getUTCDay() !== 6) return null;
    return { start, end };
  }

  function reconstructLegacyRange(period) {
    const match = String(period && period.id || "").match(/^p(\d{4})-(\d{1,2})$/i);
    if (!match) return null;
    const year = Number(match[1]);
    const number = Number(match[2]);
    if (number < 1 || number > 27) return null;
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const firstSunday = addDays(jan1, (7 - jan1.getUTCDay()) % 7);
    const start = addDays(firstSunday, (number - 1) * 14);
    return { start, end: addDays(start, 13) };
  }

  function periodDateKey(period) {
    const range = parsePeriodRange(period);
    return range ? `${isoDate(range.start)}/${isoDate(range.end)}` : "";
  }

  function buildSupportedPeriods(now, statusById) {
    const current = now && typeof now.getTime === "function" && !Number.isNaN(now.getTime()) ? now : new Date();
    const lastYear = current.getFullYear() + 1;
    const starts = [];
    let cursor = new Date(ANCHOR_START_UTC);
    while (addDays(cursor, 13).getUTCFullYear() >= FIRST_SUPPORTED_YEAR) {
      starts.unshift(cursor);
      cursor = addDays(cursor, -14);
    }
    cursor = addDays(new Date(ANCHOR_START_UTC), 14);
    while (addDays(cursor, 13).getUTCFullYear() <= lastYear) {
      starts.push(cursor);
      cursor = addDays(cursor, 14);
    }
    const counts = new Map();
    return starts.flatMap((start) => {
      const end = addDays(start, 13);
      const year = end.getUTCFullYear();
      if (year < FIRST_SUPPORTED_YEAR || year > lastYear) return [];
      const periodNumber = (counts.get(year) || 0) + 1;
      counts.set(year, periodNumber);
      const id = `p${year}-${pad2(periodNumber)}`;
      return [{
        id,
        year,
        periodNumber,
        startDate: `${pad2(start.getUTCMonth() + 1)}/${pad2(start.getUTCDate())}/${start.getUTCFullYear()}`,
        endDate: `${pad2(end.getUTCMonth() + 1)}/${pad2(end.getUTCDate())}/${end.getUTCFullYear()}`,
        rangeLabel: `${formatRangeDate(start)} – ${formatRangeDate(end)}`,
        paycheckDate: formatPaycheckDate(end),
        status: statusById && statusById[id] || "draft",
      }];
    });
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function migrateSnapshot(snapshot, selection, now, statusById) {
    const source = clone(snapshot && typeof snapshot === "object" ? snapshot : {});
    const sourceSelection = clone(selection && typeof selection === "object" ? selection : {});
    const oldPeriods = Array.isArray(source.periods) ? source.periods : [];
    const oldEmployees = source.employees && typeof source.employees === "object" ? source.employees : {};
    const targetPeriods = buildSupportedPeriods(now, statusById);
    const targetByKey = new Map(targetPeriods.map((item) => [periodDateKey(item), item]));
    const seenKeys = new Set();
    const idMap = new Map();
    const legacyPeriods = clone(Array.isArray(source.legacyPayrollPeriods) ? source.legacyPayrollPeriods : []);

    for (const oldPeriod of oldPeriods) {
      let key = periodDateKey(oldPeriod);
      if (!key) {
        const reconstructed = reconstructLegacyRange(oldPeriod);
        if (reconstructed) key = `${isoDate(reconstructed.start)}/${isoDate(reconstructed.end)}`;
      }
      const target = key && !seenKeys.has(key) ? targetByKey.get(key) : null;
      if (!target) {
        legacyPeriods.push({ period: clone(oldPeriod), employees: clone(oldEmployees[oldPeriod && oldPeriod.id] || []) });
        continue;
      }
      seenKeys.add(key);
      idMap.set(oldPeriod.id, target.id);
      if (oldPeriod.status != null) target.status = oldPeriod.status;
    }

    const nextEmployees = {};
    for (const target of targetPeriods) nextEmployees[target.id] = [];
    for (const oldPeriod of oldPeriods) {
      const targetId = idMap.get(oldPeriod && oldPeriod.id);
      if (targetId) nextEmployees[targetId] = clone(oldEmployees[oldPeriod.id] || []);
    }
    const knownOldIds = new Set(oldPeriods.map((item) => item && item.id).filter(Boolean));
    for (const oldId of Object.keys(oldEmployees)) {
      if (!knownOldIds.has(oldId)) legacyPeriods.push({ period: { id: oldId, unrecognized: true }, employees: clone(oldEmployees[oldId]) });
    }

    const auditLog = (Array.isArray(source.auditLog) ? source.auditLog : []).map((entry) => {
      const nextId = idMap.get(entry && entry.periodId);
      if (nextId) return { ...entry, periodId: nextId, legacyPeriodReference: false };
      return entry && entry.periodId ? { ...entry, legacyPeriodReference: true } : { ...entry };
    });
    const nextSnapshot = { ...source, periods: targetPeriods, employees: nextEmployees, auditLog, legacyPayrollPeriods: legacyPeriods };

    const oldSelected = oldPeriods.find((item) => item && item.id === sourceSelection.periodId);
    const selectedKey = periodDateKey(oldSelected);
    let selectedPeriod = selectedKey ? targetByKey.get(selectedKey) : null;
    if (!selectedPeriod && sourceSelection.periodId) {
      const mappedId = idMap.get(sourceSelection.periodId);
      selectedPeriod = targetPeriods.find((item) => item.id === mappedId);
    }
    if (!selectedPeriod) {
      selectedPeriod = targetPeriods.slice().reverse().find((item) => (nextEmployees[item.id] || []).length > 0) || targetPeriods[targetPeriods.length - 1] || null;
    }
    const selectedEmployees = selectedPeriod ? nextEmployees[selectedPeriod.id] || [] : [];
    const employeeId = selectedEmployees.some((item) => item && item.id === sourceSelection.employeeId) ? sourceSelection.employeeId : selectedEmployees[0] && selectedEmployees[0].id || null;
    const nextSelection = {
      ...sourceSelection,
      periodId: selectedPeriod && selectedPeriod.id || null,
      employeeId,
      periodYearFilter: sourceSelection.periodYearFilter === "" ? "" : String(selectedPeriod && selectedPeriod.year || ""),
      workspacePeriodYearFilter: sourceSelection.workspacePeriodYearFilter === "" ? "" : String(selectedPeriod && selectedPeriod.year || ""),
      periodNumberFilter: sourceSelection.periodNumberFilter === "" ? "" : String(selectedPeriod && selectedPeriod.periodNumber || ""),
    };
    return { snapshot: nextSnapshot, selection: nextSelection, legacyPeriods };
  }

  global.PayrollPeriodCalendar = { buildSupportedPeriods, migrateSnapshot, periodDateKey };
})(window);
