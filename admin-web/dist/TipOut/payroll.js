/**
 * TipOut Payroll — 报税报表演示逻辑（本地静态数据，源自 taxreport 项目）
 */
(function () {
  "use strict";

  const STORAGE_KEY = "tipout-payroll-state-v4";
  const ROSTER_STORAGE_KEY = "tipout-employees-roster-v1";
  const DISCLAIMER_ACCEPT_KEY = "tipout-payroll-disclaimer-accepted-v1";

  function T(key, vars) {
    return typeof payrollT === "function" ? payrollT(key, vars) : key;
  }

  function getAdpMapping() {
    return typeof PAYROLL_ADP_MAPPING !== "undefined" && PAYROLL_ADP_MAPPING ? PAYROLL_ADP_MAPPING : null;
  }

  function applyAdpMappingToData(data) {
    const m = getAdpMapping();
    if (m && m.coCode && data) data.coCode = m.coCode;
  }

  function appendAudit(action, meta) {
    if (!state.data.auditLog || !Array.isArray(state.data.auditLog)) state.data.auditLog = [];
    state.data.auditLog.unshift({
      at: new Date().toISOString(),
      action,
      periodId: state.periodId || (meta && meta.periodId) || "",
      employeeId: state.employeeId || (meta && meta.employeeId) || "",
      actor: "demo-user",
      meta: meta || {},
    });
    if (state.data.auditLog.length > 200) state.data.auditLog.length = 200;
  }

  function getDeclarationTemplate() {
    const m = getAdpMapping();
    return (
      (m && m.declarationBodyEn) ||
      "Service charge ${svc_amount} and tips ${tips_amount} are from Manage Payroll."
    );
  }

  function getDeclarationAmounts(emp) {
    const svc = emp && emp.adjustments ? fmtMoney(emp.adjustments.svcw) : "0.00";
    const tips = emp && emp.adjustments ? fmtMoney(emp.adjustments.tips) : "0.00";
    return { svc: "$" + svc, tips: "$" + tips };
  }

  function renderDeclarationText(emp) {
    const tpl = getDeclarationTemplate();
    const { svc, tips } = getDeclarationAmounts(emp);
    return tpl
      .replace(/\$\{svc_amount\}/g, svc)
      .replace(/\$\{tips_amount\}/g, tips);
  }

  /** 声明正文 HTML：gratuity / tips 金额加粗、加大并下划线，便于员工核对 */
  function renderDeclarationHtml(emp) {
    const tpl = getDeclarationTemplate();
    const { svc, tips } = getDeclarationAmounts(emp);
    const SVC_TOKEN = "@@PAYROLL_DECL_SVC@@";
    const TIPS_TOKEN = "@@PAYROLL_DECL_TIPS@@";
    const marked = tpl
      .replace(/\$\{svc_amount\}/g, SVC_TOKEN)
      .replace(/\$\{tips_amount\}/g, TIPS_TOKEN);
    const amountHtml = (amount) =>
      `<span class="payroll-decl-amount">${escapeHtml(amount)}</span>`;
    return escapeHtml(marked)
      .replace(SVC_TOKEN, amountHtml(svc))
      .replace(TIPS_TOKEN, amountHtml(tips));
  }

  function csvEscapeCell(c) {
    const s = String(c);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function buildAdpCsvContent(rows, header) {
    const lines = [header.map(csvEscapeCell).join(",")];
    rows.forEach((row) => lines.push(row.map(csvEscapeCell).join(",")));
    return lines.join("\r\n");
  }

  function downloadCsvFile(filename, csv) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  let pendingExportAction = null;

  function showExportConfirmDialog(hint) {
    return new Promise((resolve) => {
      const modal = $("#payrollExportConfirmModal");
      const hintEl = $("#payroll-export-confirm-hint");
      if (hintEl) hintEl.textContent = hint || "";
      if (!modal) {
        resolve(true);
        return;
      }
      modal.classList.add("show");
      const onOk = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        modal.classList.remove("show");
        $("#btn-export-confirm-ok")?.removeEventListener("click", onOk);
        $("#btn-export-confirm-cancel")?.removeEventListener("click", onCancel);
        $("#btn-export-confirm-close")?.removeEventListener("click", onCancel);
      };
      $("#btn-export-confirm-ok")?.addEventListener("click", onOk);
      $("#btn-export-confirm-cancel")?.addEventListener("click", onCancel);
      $("#btn-export-confirm-close")?.addEventListener("click", onCancel);
    });
  }

  function initDisclaimerModal() {
    const m = getAdpMapping();
    const bodyZh = $("#payroll-disclaimer-modal-body");
    const bodyEn = $("#payroll-disclaimer-modal-body-en");
    const isEn = typeof isPayrollEn === "function" && isPayrollEn();
    if (bodyZh) {
      bodyZh.textContent =
        (m && m.disclaimerZh) || "本系统仅提供薪酬报税相关功能，不构成税务或法律意见。";
      bodyZh.style.display = isEn ? "none" : "";
    }
    if (bodyEn) {
      bodyEn.textContent =
        (m && m.disclaimerEn) ||
        "This tool provides payroll calculation and tax prep data only. It does not constitute tax or legal advice.";
      bodyEn.style.display = isEn ? "" : "none";
    }

    if (localStorage.getItem(DISCLAIMER_ACCEPT_KEY) === "1") return;

    const modal = $("#payrollDisclaimerModal");
    const agree = $("#payroll-disclaimer-agree");
    const acceptBtn = $("#btn-payroll-disclaimer-accept");
    if (!modal || !agree || !acceptBtn) return;

    modal.classList.add("show");
    agree.addEventListener("change", () => {
      acceptBtn.disabled = !agree.checked;
    });
    acceptBtn.addEventListener("click", () => {
      if (!agree.checked) return;
      localStorage.setItem(DISCLAIMER_ACCEPT_KEY, "1");
      modal.classList.remove("show");
    });
  }

  const DEFAULT_STORE_NAME = "Golden Dragon Chinese Kitchen - Dallas, TX 75231";
  const EXTRA_PAYROLL_STORES = [
    "Lone Star BBQ House - Austin, TX 78701",
    "Pacific Bowl & Grill - San Diego, CA 92101",
  ];
  const UNIFIED_ROSTER_SEED = [
    { id: "roster-seed-1", name: "小飞鸽", role: "Floor", store: "Golden Dragon Chinese Kitchen - Dallas, TX 75231", adpFile: "924", department: "Floor", rate: 48.07, otRate: 72.11, ot2Rate: 96.14 },
    { id: "roster-seed-2", name: "Maria Garcia", role: "Server", store: "Golden Dragon Chinese Kitchen - Dallas, TX 75231", adpFile: "101", department: "Floor", rate: 15.5, otRate: 23.25, ot2Rate: 31 },
    { id: "roster-seed-3", name: "Jason Chen", role: "Server", store: "Sakura Sushi & Ramen House - Dallas, TX 75247", adpFile: "102", department: "Floor", rate: 16.2, otRate: 24.3, ot2Rate: 32.4 },
    { id: "roster-seed-4", name: "Emily Watson", role: "Server", store: "Sakura Sushi & Ramen House - Dallas, TX 75247", adpFile: "103", department: "Floor", rate: 15.8, otRate: 23.7, ot2Rate: 31.6 },
    { id: "roster-seed-5", name: "Mike Johnson", role: "Bartender", store: "Golden Dragon Chinese Kitchen - Dallas, TX 75231", adpFile: "104", department: "Bar", rate: 18.5, otRate: 27.75, ot2Rate: 37 },
    { id: "roster-seed-6", name: "Tom Wilson", role: "Kitchen", store: "Sakura Sushi & Ramen House - Dallas, TX 75247", adpFile: "105", department: "Kitchen", rate: 22.5, otRate: 33.75, ot2Rate: 45 },
    { id: "roster-seed-7", name: "Carlos Lopez", role: "Busser", store: "Lone Star BBQ House - Austin, TX 78701", adpFile: "106", department: "Floor", rate: 14.2, otRate: 21.3, ot2Rate: 28.4 },
    { id: "roster-seed-8", name: "Linda Nguyen", role: "Cashier", store: "Lone Star BBQ House - Austin, TX 78701", adpFile: "107", department: "Front", rate: 17.1, otRate: 25.65, ot2Rate: 34.2 },
    { id: "roster-seed-9", name: "Daniel Ortiz", role: "Runner", store: "Pacific Bowl & Grill - San Diego, CA 92101", adpFile: "108", department: "Floor", rate: 15.1, otRate: 22.65, ot2Rate: 30.2 },
    { id: "roster-seed-10", name: "Rachel Scott", role: "Host", store: "Pacific Bowl & Grill - San Diego, CA 92101", adpFile: "109", department: "Front", rate: 16.4, otRate: 24.6, ot2Rate: 32.8 },
  ];

  function addDays(base, days) {
    if (!base) return null;
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatMdyDot(d) {
    return `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}.${String(d.getFullYear()).slice(-2)}`;
  }

  function formatRangeDate(d) {
    const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()} (${w})`;
  }

  /** Paycheck (Batch) = 薪资区间结束日 + 6 天（ADP BATCH ID 格式 MM.DD.YY） */
  function buildPaycheckDate(periodEndDate) {
    return formatMdyDot(addDays(periodEndDate, 6));
  }

  /** 生成指定自然年的 26 期（双周 Sun–Sat，每期 14 天） */
  function buildYearPeriods(year, startDate, statusMap) {
    const periods = [];
    const sm = statusMap && typeof statusMap === "object" ? statusMap : {};
    for (let i = 1; i <= 26; i++) {
      const s = addDays(startDate, (i - 1) * 14);
      const e = addDays(s, 13);
      periods.push({
        id: `p${year}-${pad2(i)}`,
        year,
        periodNumber: i,
        rangeLabel: `${formatRangeDate(s)} – ${formatRangeDate(e)}`,
        paycheckDate: buildPaycheckDate(e),
        status: sm[i] || "draft",
      });
    }
    return periods;
  }

  /** Payroll 预设期数：2025 / 2026 各 26 期（自然年、双周 Sun–Sat） */
  function buildPresetPeriods() {
    const statusMap2026 = { 8: "draft", 9: "confirmed", 10: "draft" };
    return [
      ...buildYearPeriods(2025, new Date(2025, 0, 5)), // 2025 第 1 期：01/05/2025 (Sun) – 01/18/2025 (Sat)
      ...buildYearPeriods(2026, new Date(2026, 0, 4), statusMap2026), // 2026 第 1 期：01/04/2026 (Sun) – 01/17/2026 (Sat)
    ];
  }

  function formatMdySlash(d) {
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  }

  function parseMdyDate(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const month = parseInt(m[1], 10) - 1;
    const day = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  function mdyToIsoDateInput(dateStr) {
    const d = parseMdyDate(dateStr);
    if (!d) return "";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function isoDateInputToMdy(isoStr) {
    const raw = String(isoStr || "").trim();
    if (!raw) return "";
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    return `${m[2]}/${m[3]}/${m[1]}`;
  }

  function getPeriodDateRange(rangeLabel) {
    if (!rangeLabel) return { start: null, end: null };
    const matches = String(rangeLabel).match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
    const start = matches[0] ? parseMdyDate(matches[0]) : null;
    const end = matches[1] ? parseMdyDate(matches[1]) : null;
    return { start, end };
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const BIWEEKLY_DEMO_DAY_OFFSETS = [1, 3, 5, 8, 10, 12];

  function buildBiweeklyDemoSegmentDates(start, end) {
    if (!start || !end) return [];
    const endDay = startOfDay(end).getTime();
    return BIWEEKLY_DEMO_DAY_OFFSETS.map((off) => addDays(start, off))
      .filter((d) => d && startOfDay(d).getTime() <= endDay)
      .map(formatMdySlash);
  }

  function buildDemoSegmentDatesForRange(start, end) {
    return buildBiweeklyDemoSegmentDates(start, end);
  }

  function buildDemoSegmentDatesForPeriod(period) {
    const { start, end } = getPeriodDateRange(period && period.rangeLabel);
    return buildDemoSegmentDatesForRange(start, end);
  }

  function periodHasStarted(period, refDate) {
    const start = getPeriodStartDate(period && period.rangeLabel);
    if (!start) return false;
    return startOfDay(start).getTime() <= startOfDay(refDate || new Date()).getTime();
  }

  function isPayrollYear2026(period) {
    if (!period) return false;
    if (String(period.year) === "2026") return true;
    return /^p2026-/i.test(String(period.id || ""));
  }

  function segmentsMatchPeriod(segments, start, end) {
    if (!Array.isArray(segments) || segments.length === 0 || !start || !end) return false;
    const s = startOfDay(start).getTime();
    const e = startOfDay(end).getTime();
    return segments.some((seg) => {
      const d = parseMdyDate(seg && seg.date);
      if (!d) return false;
      const t = startOfDay(d).getTime();
      return t >= s && t <= e;
    });
  }

  function getEmployeesSeedTemplate(employeesMap) {
    const preferred = ["p2026-08", "p2026-01", "p2026-12"];
    for (let i = 0; i < preferred.length; i++) {
      const pid = preferred[i];
      if (Array.isArray(employeesMap[pid]) && employeesMap[pid].length > 0) return employeesMap[pid];
    }
    const any = Object.values(employeesMap).find((arr) => Array.isArray(arr) && arr.length > 0);
    if (any) return any;
    const dates = buildDemoSegmentDatesForRange(new Date(2026, 0, 4), addDays(new Date(2026, 0, 4), 13));
    return buildSeedEmployees(dates);
  }

  /** 2026 年：当前日期之前及当期（含进行中）的期数均补全员工与考勤演示数据 */
  function fillElapsed2026PeriodEmployees(employeesMap, periods, refDate) {
    if (!employeesMap || typeof employeesMap !== "object") return;
    const today = refDate || new Date();
    const template = getEmployeesSeedTemplate(employeesMap);
    const list = Array.isArray(periods) ? periods : [];
    list.forEach((period) => {
      if (!isPayrollYear2026(period) || !periodHasStarted(period, today)) return;
      const { start, end } = getPeriodDateRange(period.rangeLabel);
      if (!start || !end) return;
      const dates = buildDemoSegmentDatesForRange(start, end);
      const pid = period.id;
      if (!pid) return;
      const existing = employeesMap[pid];
      if (!Array.isArray(existing) || existing.length === 0) {
        employeesMap[pid] = applySegmentDatesToEmployees(cloneEmployeesTemplate(template), dates);
        return;
      }
      const needsRefresh = existing.some((emp) => segmentsNeedBiweeklyRefresh(emp && emp.segments, start, end));
      if (!needsRefresh) return;
      employeesMap[pid] = existing.map((emp) => {
        if (!emp || typeof emp !== "object") return emp;
        if (!segmentsNeedBiweeklyRefresh(emp.segments, start, end)) return emp;
        return { ...emp, segments: buildSeedSegments(getEmployeeSeedIndex(emp), dates, emp.rate) };
      });
    });
  }

  function getPeriodStartDate(rangeLabel) {
    if (!rangeLabel) return null;
    const m = String(rangeLabel).match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    return m ? parseMdyDate(m[1]) : null;
  }

  function segmentsNeedBiweeklyRefresh(segments, start, end) {
    if (!segmentsMatchPeriod(segments, start, end)) return true;
    const periodStart = start;
    let hasWeek0 = false;
    let hasWeek1 = false;
    (segments || []).forEach((seg, dayIdx) => {
      const wk = resolveWeekIndex(seg && seg.date, periodStart, dayIdx);
      if (wk === 0) hasWeek0 = true;
      if (wk === 1) hasWeek1 = true;
    });
    return !hasWeek0 || !hasWeek1;
  }

  function compareSegmentDayDates(a, b) {
    const da = parseMdyDate(a && a.date);
    const db = parseMdyDate(b && b.date);
    if (da && db) return da.getTime() - db.getTime();
    if (da) return -1;
    if (db) return 1;
    return 0;
  }

  function shouldGroupManageSegmentsByWeek(period) {
    return periodHasStarted(period, new Date());
  }

  function buildManageSegmentWeekGroups(segments, period) {
    const periodStart = getPeriodStartDate(period && period.rangeLabel);
    const items = (Array.isArray(segments) ? segments : []).map((raw, dayIdx) => ({
      raw,
      day: normalizeDay(raw),
      dayIdx,
    }));
    items.sort((a, b) => compareSegmentDayDates(a.day, b.day));
    const weeks = [[], []];
    items.forEach((item, sortedIdx) => {
      const wk = resolveWeekIndex(item.day.date, periodStart, sortedIdx);
      weeks[wk].push(item);
    });
    return weeks;
  }

  const MANAGE_SEG_ROOT = "#manage-segments-wrap";

  function renderManageSegmentTableHeadHtml() {
    return `<thead>
      <tr>
        <th rowspan="2" scope="col"><span class="payroll-th-label">Date<button type="button" class="payroll-field-help" data-field-help="seg-date" aria-label="Date">?</button></span></th>
        <th colspan="2" scope="colgroup" style="text-align:center">In/Out</th>
        <th rowspan="2" scope="col"><span class="payroll-th-label">Meal<button type="button" class="payroll-field-help" data-field-help="seg-meal" aria-label="Meal">?</button></span></th>
        <th rowspan="2" scope="col" style="text-align:right"><span class="payroll-th-label">Rate<button type="button" class="payroll-field-help" data-field-help="seg-rate" aria-label="Rate">?</button></span></th>
        <th rowspan="2" scope="col" style="text-align:right"><span class="payroll-th-label">Regular<button type="button" class="payroll-field-help" data-field-help="seg-regular" aria-label="Regular">?</button></span></th>
        <th rowspan="2" scope="col" style="text-align:right"><span class="payroll-th-label">OT<button type="button" class="payroll-field-help" data-field-help="seg-ot" aria-label="OT">?</button></span></th>
        <th rowspan="2" scope="col" style="text-align:right"><span class="payroll-th-label">OT2<button type="button" class="payroll-field-help" data-field-help="seg-ot2" aria-label="OT2">?</button></span></th>
      </tr>
      <tr>
        <th style="text-align:center;font-weight:400"><span class="payroll-th-label">In<button type="button" class="payroll-field-help" data-field-help="seg-in" aria-label="In">?</button></span></th>
        <th style="text-align:center;font-weight:400"><span class="payroll-th-label">Out<button type="button" class="payroll-field-help" data-field-help="seg-out" aria-label="Out">?</button></span></th>
      </tr>
    </thead>`;
  }

  function renderManageWeekTitleHtml(period, weekIndex) {
    const rangeText = getWeekRangeTextFromPeriod(period && period.rangeLabel, weekIndex);
    const title = rangeText
      ? T("detail.weekRange", { n: weekIndex + 1, range: rangeText })
      : T("detail.weekN", { n: weekIndex + 1 });
    return `<h4 class="payroll-seg-week-title">${escapeHtml(title)}</h4>`;
  }

  function sumWeekSegmentTotals(group) {
    let reg = 0;
    let ot = 0;
    let ot2 = 0;
    (group || []).forEach(({ day }) => {
      if (!day) return;
      reg += Number(day.reg) || 0;
      ot += Number(day.ot) || 0;
      ot2 += Number(day.ot2) || 0;
    });
    return { reg, ot, ot2, total: reg + ot + ot2 };
  }

  function renderManageWeekSummaryHtml(totals, weekIndex) {
    return `<div class="payroll-seg-week-summary" data-week-summary="${weekIndex}">
      <span>${escapeHtml(T("manage.weekTotalHours"))}<strong data-week-total-hours>${fmtMoney(totals.total)}</strong></span>
      <span>${escapeHtml(T("manage.weekRegular"))}<strong data-week-reg>${fmtMoney(totals.reg)}</strong></span>
      <span>${escapeHtml(T("manage.weekOt"))}<strong data-week-ot>${fmtMoney(totals.ot)}</strong></span>
      <span>${escapeHtml(T("manage.weekOt2"))}<strong data-week-ot2>${fmtMoney(totals.ot2)}</strong></span>
    </div>`;
  }

  function updateManageWeekSummaries(emp, period) {
    if (!emp || !period || !shouldGroupManageSegmentsByWeek(period)) return;
    const weekGroups = buildManageSegmentWeekGroups(emp.segments, period);
    weekGroups.forEach((group, weekIndex) => {
      if (!group.length) return;
      const el = document.querySelector(`${MANAGE_SEG_ROOT} [data-week-summary="${weekIndex}"]`);
      if (!el) return;
      const totals = sumWeekSegmentTotals(group);
      const h = el.querySelector("[data-week-total-hours]");
      const r = el.querySelector("[data-week-reg]");
      const o = el.querySelector("[data-week-ot]");
      const o2 = el.querySelector("[data-week-ot2]");
      if (h) h.textContent = fmtMoney(totals.total);
      if (r) r.textContent = fmtMoney(totals.reg);
      if (o) o.textContent = fmtMoney(totals.ot);
      if (o2) o2.textContent = fmtMoney(totals.ot2);
    });
  }

  function renderManageBiweeklySegmentsHtml(period, weekGroups, emp) {
    const blocks = [];
    weekGroups.forEach((group, weekIndex) => {
      if (!group.length) return;
      const rowHtml = [];
      group.forEach(({ day, dayIdx }) => {
        appendManageSegmentDayRows(rowHtml, day, dayIdx, emp);
      });
      const totals = sumWeekSegmentTotals(group);
      blocks.push(`<section class="payroll-seg-week-block">
        ${renderManageWeekTitleHtml(period, weekIndex)}
        <table class="payroll-seg-table">
          ${renderManageSegmentTableHeadHtml()}
          <tbody>${rowHtml.join("")}</tbody>
        </table>
        ${renderManageWeekSummaryHtml(totals, weekIndex)}
      </section>`);
    });
    return `<div class="payroll-seg-biweekly">${blocks.join("")}</div>`;
  }

  function renderManageSingleSegmentTableHtml(rowHtml) {
    return `<table class="payroll-seg-table">
      ${renderManageSegmentTableHeadHtml()}
      <tbody id="segment-rows">${rowHtml.join("")}</tbody>
    </table>`;
  }

  function appendManageSegmentDayRows(rowHtml, day, dayIdx, emp) {
    const dayRate = getDayRate(day, emp);
    const filledSlotIndexes = day.slots
      .map((sl, idx) => ({ sl, idx }))
      .filter((x) => hasSlotClock(x.sl))
      .map((x) => x.idx);
    const targetRows = Math.max(day.slotRows || 0, filledSlotIndexes.length || 1);
    const visibleSlotIndexes = filledSlotIndexes.slice(0);
    for (let i = 0; visibleSlotIndexes.length < targetRows; i++) {
      if (!visibleSlotIndexes.includes(i)) visibleSlotIndexes.push(i);
    }
    const rowsForDay = visibleSlotIndexes.length;
    visibleSlotIndexes.forEach((slotIdx, renderIdx) => {
      if (!day.slots[slotIdx]) day.slots[slotIdx] = { in: "", out: "" };
      const sl = day.slots[slotIdx];
      const isLastRow = renderIdx === rowsForDay - 1;
      const actionsHtml = `<div style="display:flex;gap:8px;align-items:center">
            ${
              isLastRow
                ? `<button type="button" class="btn btn-sm" data-action="add-slot-row" data-day-index="${dayIdx}">${escapeHtml(T("seg.addInOut"))}</button>`
                : ""
            }
            <button type="button" class="btn btn-sm" data-action="remove-slot-row" data-day-index="${dayIdx}" data-row-order="${renderIdx}">${escapeHtml(T("seg.removeRow"))}</button>
          </div>`;
      if (renderIdx === 0) {
        rowHtml.push(`<tr data-day-index="${dayIdx}" data-slot-index="${slotIdx}" data-row-order="${renderIdx}" data-primary="1">
        <td rowspan="${rowsForDay}" style="vertical-align:top">
          <input type="text" class="field-seg form-control" data-field="date" value="${escapeHtml(day.date)}" aria-label="Date" style="font-family:ui-monospace,Menlo,monospace" />
        </td>
        <td><input type="text" class="field-seg form-control" data-field="in" value="${escapeHtml(sl.in)}" placeholder="In" style="font-family:ui-monospace,Menlo,monospace" /></td>
        <td><div style="display:flex;gap:8px;align-items:center"><input type="text" class="field-seg form-control" data-field="out" value="${escapeHtml(sl.out)}" placeholder="Out" style="font-family:ui-monospace,Menlo,monospace" />${actionsHtml}</div></td>
        <td rowspan="${rowsForDay}" style="vertical-align:top"><input type="text" class="field-seg form-control" data-field="meal" value="${escapeHtml(day.meal)}" aria-label="Meal" /></td>
        <td rowspan="${rowsForDay}" style="vertical-align:top"><input type="number" step="0.01" min="0" class="field-seg form-control" data-field="rate" value="${dayRate}" aria-label="Rate" /></td>
        <td rowspan="${rowsForDay}" style="vertical-align:top"><input type="number" step="0.01" class="field-seg form-control" data-field="reg" value="${day.reg}" aria-label="Regular" /></td>
        <td rowspan="${rowsForDay}" style="vertical-align:top"><input type="number" step="0.01" class="field-seg form-control" data-field="ot" value="${day.ot}" aria-label="OT" /></td>
        <td rowspan="${rowsForDay}" style="vertical-align:top"><input type="number" step="0.01" class="field-seg form-control" data-field="ot2" value="${day.ot2}" aria-label="OT2" /></td>
      </tr>`);
      } else {
        rowHtml.push(`<tr data-day-index="${dayIdx}" data-slot-index="${slotIdx}" data-row-order="${renderIdx}" data-primary="0">
        <td><input type="text" class="field-seg form-control" data-field="in" value="${escapeHtml(sl.in)}" placeholder="In" style="font-family:ui-monospace,Menlo,monospace" /></td>
        <td><div style="display:flex;gap:8px;align-items:center"><input type="text" class="field-seg form-control" data-field="out" value="${escapeHtml(sl.out)}" placeholder="Out" style="font-family:ui-monospace,Menlo,monospace" />${actionsHtml}</div></td>
      </tr>`);
      }
    });
  }

  function buildDemoDaySegment(dateStr, empIdx, dayIdx) {
    const day1In = `${String(8 + (empIdx % 3)).padStart(2, "0")}:00`;
    const day1Out = `${String(16 + (empIdx % 3)).padStart(2, "0")}:00`;
    const patterns = [
      {
        slots: [
          { in: day1In, out: day1Out },
          { in: "", out: "" },
          { in: "", out: "" },
        ],
        meal: "0:30",
        reg: 7.5,
        ot: 0,
        ot2: 0,
      },
      {
        slots: [
          { in: "10:00", out: "18:30" },
          { in: "", out: "" },
          { in: "", out: "" },
        ],
        meal: "0:30",
        reg: 8,
        ot: empIdx % 2 === 0 ? 0.5 : 0,
        ot2: 0,
      },
      {
        slots: [
          { in: "11:00", out: "15:00" },
          { in: "16:00", out: "21:00" },
          { in: "", out: "" },
        ],
        meal: "0:45",
        reg: 8.25,
        ot: empIdx % 3 === 0 ? 1 : 0.25,
        ot2: 0,
      },
    ];
    const p = patterns[dayIdx % patterns.length];
    return {
      date: dateStr,
      slots: p.slots.map((s) => ({ ...s })),
      meal: p.meal,
      reg: p.reg,
      ot: p.ot,
      ot2: p.ot2,
      slotRows: 1,
    };
  }

  function buildSeedSegments(empIdx, dates, baseRate) {
    const fallbackStart = new Date(2026, 3, 12);
    const rosterRate = Number(UNIFIED_ROSTER_SEED[empIdx % UNIFIED_ROSTER_SEED.length]?.rate) || 15;
    const resolvedRate =
      Number.isFinite(Number(baseRate)) && Number(baseRate) > 0 ? Number(baseRate) : rosterRate;
    const d =
      dates && dates.length > 0
        ? dates
        : buildBiweeklyDemoSegmentDates(fallbackStart, addDays(fallbackStart, 13));
    return d.map((dateStr, dayIdx) => ({
      ...buildDemoDaySegment(dateStr, empIdx, dayIdx),
      rate: resolvedRate,
    }));
  }

  function getEmployeeSeedIndex(emp) {
    if (!emp) return 0;
    const adp = String(emp.adpFile || "").trim();
    if (adp) {
      const idx = UNIFIED_ROSTER_SEED.findIndex((r) => String(r.adpFile || "").trim() === adp);
      if (idx >= 0) return idx;
    }
    const name = String(emp.name || "").trim().toLowerCase();
    if (name) {
      const idx = UNIFIED_ROSTER_SEED.findIndex((r) => String(r.name || "").trim().toLowerCase() === name);
      if (idx >= 0) return idx;
    }
    return 0;
  }

  function ensureManageBiweeklySegments(emp, period) {
    if (!emp || !period || !shouldGroupManageSegmentsByWeek(period)) return;
    const { start, end } = getPeriodDateRange(period.rangeLabel);
    if (!start || !end) return;
    if (!segmentsNeedBiweeklyRefresh(emp.segments, start, end)) return;
    const dates = buildBiweeklyDemoSegmentDates(start, end);
    emp.segments = buildSeedSegments(getEmployeeSeedIndex(emp), dates, emp.rate);
  }

  function buildSeedEmployees(dates) {
    const baseAdj = {
      exempt: "",
      incentive: 0,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      sickHours: 0,
      svcw: 0,
      tips: 0,
      childSup: 0,
      medDed: 0,
      eee40: 0,
      eer60: 0,
    };
    return UNIFIED_ROSTER_SEED.map((r, idx) => ({
      id: `emp-${String(r.id || idx + 1).replace(/^roster-seed-/, "seed-")}`,
      name: r.name,
      store: r.store || DEFAULT_STORE_NAME,
      adpFile: r.adpFile || "",
      ssn: "",
      department: r.department || r.role || "Floor",
      role: r.role || r.department || "Floor",
      hireDate: r.hireDate || demoHireDateForSeedIndex(idx),
      confirmed: false,
      rate: Number(r.rate) || 0,
      otRate: Number(r.otRate) || 0,
      ot2Rate: Number(r.ot2Rate) || 0,
      segments: buildSeedSegments(idx, dates, Number(r.rate) || 0),
      adjustments: { ...baseAdj, tips: idx === 0 ? 85 : 0, svcw: idx === 0 ? 120.5 : 0 },
    }));
  }

  function applySegmentDatesToEmployees(list, dates) {
    if (!Array.isArray(list) || !dates) return list;
    return list.map((emp, idx) => {
      if (!emp || typeof emp !== "object") return emp;
      return {
        ...emp,
        segments: buildSeedSegments(idx, dates, Number(emp.rate) || 0),
      };
    });
  }

  const DEFAULT_DATA = {
    coCode: "X0L",
    periods: buildPresetPeriods(),
    employees: {
      "p2026-08": buildSeedEmployees(
        buildDemoSegmentDatesForRange(addDays(new Date(2026, 0, 4), 7 * 14), addDays(new Date(2026, 0, 4), 7 * 14 + 13))
      ),
    },
    auditLog: [],
  };

  function cloneEmployeesTemplate(list) {
    if (typeof structuredClone === "function") return structuredClone(list);
    return JSON.parse(JSON.stringify(list));
  }

  function cloneData(obj) {
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  }

  /** 补全“已确认”周期的数据：仅在该期数据为空时按模板填充 */
  function fillConfirmedPeriodsData(employeesMap, periods) {
    if (!employeesMap || typeof employeesMap !== "object") return;
    const list = Array.isArray(periods) ? periods : [];
    const baseTemplate =
      (Array.isArray(employeesMap["p2026-08"]) && employeesMap["p2026-08"].length > 0 && employeesMap["p2026-08"]) ||
      Object.values(employeesMap).find((arr) => Array.isArray(arr) && arr.length > 0) ||
      [];
    list.forEach((p) => {
      if (!p || p.status !== "confirmed") return;
      const pid = p.id;
      if (!pid) return;
      if (!Array.isArray(employeesMap[pid]) || employeesMap[pid].length === 0) {
        employeesMap[pid] = cloneEmployeesTemplate(baseTemplate);
      }
      employeesMap[pid].forEach((emp) => {
        if (emp) emp.confirmed = true;
      });
    });
  }

  /** 补“部分未确认”演示场景：确保某一期出现部分已确认、部分未确认 */
  function fillPartialConfirmedScenario(employeesMap, periods, refDate) {
    if (!employeesMap || typeof employeesMap !== "object") return;
    const targetPid = "p2026-10";
    const periodList = Array.isArray(periods) ? periods : [];
    const period10 = periodList.find((p) => p && p.id === targetPid);
    if (period10 && !periodHasStarted(period10, refDate || new Date())) return;
    const template = getEmployeesSeedTemplate(employeesMap);
    if (!Array.isArray(employeesMap[targetPid]) || employeesMap[targetPid].length === 0) {
      const dates = period10 ? buildDemoSegmentDatesForPeriod(period10) : buildDemoSegmentDatesForRange(new Date(2026, 4, 10), addDays(new Date(2026, 4, 10), 13));
      employeesMap[targetPid] = applySegmentDatesToEmployees(cloneEmployeesTemplate(template), dates);
    }
    const list = employeesMap[targetPid];
    if (!Array.isArray(list) || list.length === 0) return;
    list.forEach((emp, idx) => {
      if (!emp) return;
      emp.confirmed = idx < 4;
    });
  }

  /** 补“未确认”演示场景：确保某一期全部未确认 */
  function fillDraftScenario(employeesMap) {
    if (!employeesMap || typeof employeesMap !== "object") return;
    const targetPid = "p2026-08";
    const list = employeesMap[targetPid];
    if (!Array.isArray(list)) return;
    list.forEach((emp) => {
      if (emp) emp.confirmed = false;
    });
  }

  function getUnifiedRoster() {
    try {
      const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
      if (!raw) return cloneEmployeesTemplate(UNIFIED_ROSTER_SEED);
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed.filter((e) => e && String((e.name || "")).trim()) : [];
      const byId = new Set(list.map((e) => String((e && e.id) || "")));
      UNIFIED_ROSTER_SEED.forEach((s) => {
        if (!byId.has(s.id)) list.push(cloneEmployeesTemplate(s));
      });
      return list;
    } catch (_) {
      return cloneEmployeesTemplate(UNIFIED_ROSTER_SEED);
    }
  }

  function demoHireDateForSeedIndex(idx) {
    const base = new Date(2019, 2, 15);
    return formatMdyDate(addDays(base, (Number(idx) || 0) * 47));
  }

  function findUnifiedRosterMatch(emp) {
    if (!emp) return null;
    const roster = getUnifiedRoster();
    const adp = String((emp.adpFile || "")).trim();
    const name = String((emp.name || "")).trim().toLowerCase();
    if (adp) {
      const hit = roster.find((r) => String((r && r.adpFile) || "").trim() === adp);
      if (hit) return hit;
    }
    if (name) {
      const hit = roster.find((r) => String((r && r.name) || "").trim().toLowerCase() === name);
      if (hit) return hit;
    }
    return null;
  }

  function resolveEmployeeRole(emp) {
    const match = findUnifiedRosterMatch(emp);
    if (match && match.role) return String(match.role).trim();
    if (emp && emp.role) return String(emp.role).trim();
    if (emp && emp.department) return String(emp.department).trim();
    return "—";
  }

  function resolveEmployeeHireDate(emp) {
    if (emp && emp.hireDate) return String(emp.hireDate).trim();
    const match = findUnifiedRosterMatch(emp);
    if (match && match.hireDate) return String(match.hireDate).trim();
    return demoHireDateForSeedIndex(getEmployeeSeedIndex(emp));
  }

  function formatPayrollPeriodReportTitle(period) {
    const n = period && period.periodNumber != null ? period.periodNumber : "—";
    return T("detail.periodReport", { n });
  }

  function formatDetailEmployeeDisplay(emp) {
    const name = String((emp && emp.name) || "").trim();
    const adp = String((emp && emp.adpFile) || "").trim();
    if (name && adp) return `${name} · ${adp}`;
    if (name) return name;
    if (adp) return adp;
    return "—";
  }

  function resolveEmployeeStore(emp) {
    const match = findUnifiedRosterMatch(emp);
    if (match && match.store) return String(match.store).trim();
    if (emp && emp.store) return String(emp.store).trim();
    return DEFAULT_STORE_NAME;
  }

  function parseEmployeeStoreLocation(storeStr) {
    const raw = String(storeStr || "").trim();
    if (!raw) return { name: "—", address: "—" };
    const sep = " - ";
    const idx = raw.indexOf(sep);
    if (idx === -1) return { name: raw, address: "—" };
    return {
      name: raw.slice(0, idx).trim() || raw,
      address: raw.slice(idx + sep.length).trim() || "—",
    };
  }

  function syncDetailSignFooter(emp) {
    const { name, address } = parseEmployeeStoreLocation(resolveEmployeeStore(emp));
    const nameEl = $("#detail-store-name");
    const addrEl = $("#detail-store-address");
    if (nameEl) nameEl.textContent = name;
    if (addrEl) addrEl.textContent = address;
  }

  function syncDetailMetaFields(emp, period) {
    const roleEl = $("#detail-meta-role");
    const hireEl = $("#detail-meta-hire-date");
    const employeeEl = $("#detail-meta-employee");
    const ssnEl = $("#detail-meta-ssn");
    const payDateEl = $("#detail-meta-pay-date");
    const payPeriodEl = $("#detail-meta-pay-period");
    const periodReportEl = $("#detail-meta-period-report");
    if (roleEl) roleEl.textContent = resolveEmployeeRole(emp);
    if (hireEl) hireEl.textContent = resolveEmployeeHireDate(emp) || "—";
    if (employeeEl) employeeEl.textContent = formatDetailEmployeeDisplay(emp);
    if (ssnEl) ssnEl.textContent = String((emp && emp.ssn) || "").trim() || "—";
    if (payDateEl) payDateEl.textContent = (period && period.paycheckDate) || "—";
    if (payPeriodEl) payPeriodEl.textContent = (period && period.rangeLabel) || "—";
    if (periodReportEl) periodReportEl.textContent = formatPayrollPeriodReportTitle(period);
  }

  /** 报税报表中的员工姓名/角色(部门)来源统一到员工列表 */
  function syncEmployeesFromUnifiedRoster(employeesMap) {
    if (!employeesMap || typeof employeesMap !== "object") return;
    const roster = getUnifiedRoster();
    if (!Array.isArray(roster) || roster.length === 0) return;
    Object.keys(employeesMap).forEach((pid) => {
      const current = Array.isArray(employeesMap[pid]) ? employeesMap[pid] : [];
      const byAdp = new Map();
      const byName = new Map();
      current.forEach((e) => {
        if (!e) return;
        const adp = String((e.adpFile || "")).trim();
        const name = String((e.name || "")).trim().toLowerCase();
        if (adp && !byAdp.has(adp)) byAdp.set(adp, e);
        if (name && !byName.has(name)) byName.set(name, e);
      });
      const next = roster.map((r, idx) => {
        const rosterAdp = String((r.adpFile || "")).trim();
        const rosterName = String((r.name || "")).trim();
        const existing =
          (rosterAdp && byAdp.get(rosterAdp)) || byName.get(rosterName.toLowerCase()) || current[idx] || null;
        return {
          id: (existing && existing.id) || `emp-roster-${idx + 1}`,
          name: rosterName || ((existing && existing.name) || `员工${idx + 1}`),
          store: String((r.store || (existing && existing.store) || DEFAULT_STORE_NAME)).trim() || DEFAULT_STORE_NAME,
          adpFile: rosterAdp || String((existing && existing.adpFile) || "").trim(),
          ssn: String((existing && existing.ssn) || "").trim(),
          department: String((r.department || r.role || (existing && existing.department) || "")).trim(),
          role: String((r.role || (existing && existing.role) || r.department || "")).trim(),
          hireDate: String(
            (r.hireDate || (existing && existing.hireDate) || demoHireDateForSeedIndex(idx) || ""),
          ).trim(),
          confirmed: !!(existing && existing.confirmed),
          rate: Number.isFinite(Number(r.rate)) ? Number(r.rate) : Number((existing && existing.rate) || 0),
          otRate: Number.isFinite(Number(r.otRate)) ? Number(r.otRate) : Number((existing && existing.otRate) || 0),
          ot2Rate: Number.isFinite(Number(r.ot2Rate)) ? Number(r.ot2Rate) : Number((existing && existing.ot2Rate) || 0),
          segments: Array.isArray(existing && existing.segments)
            ? existing.segments.map((s) => migrateLegacySegmentToDay(s))
            : [],
          adjustments: {
            exempt: "",
            incentive: 0,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            sickHours: 0,
            svcw: 0,
            tips: 0,
            childSup: 0,
            medDed: 0,
            eee40: 0,
            eer60: 0,
            ...((existing && existing.adjustments) || {}),
          },
        };
      });
      employeesMap[pid] = next;
    });
  }

  function calcPeriodStatus(periodId, employeesMap) {
    const list = (employeesMap && employeesMap[periodId]) || [];
    if (!Array.isArray(list) || list.length === 0) return "draft";
    let confirmedCount = 0;
    list.forEach((e) => {
      if (e && e.confirmed) confirmedCount += 1;
    });
    if (confirmedCount === 0) return "draft";
    if (confirmedCount === list.length) return "confirmed";
    return "partial";
  }

  function syncPeriodStatuses(periods, employeesMap) {
    if (!Array.isArray(periods)) return;
    periods.forEach((p) => {
      if (!p || !p.id) return;
      p.status = calcPeriodStatus(p.id, employeesMap);
    });
  }

  fillElapsed2026PeriodEmployees(DEFAULT_DATA.employees, DEFAULT_DATA.periods);
  syncEmployeesFromUnifiedRoster(DEFAULT_DATA.employees);
  fillDraftScenario(DEFAULT_DATA.employees);
  fillConfirmedPeriodsData(DEFAULT_DATA.employees, DEFAULT_DATA.periods);
  fillPartialConfirmedScenario(DEFAULT_DATA.employees, DEFAULT_DATA.periods);
  syncPeriodStatuses(DEFAULT_DATA.periods, DEFAULT_DATA.employees);

  let state = {
    data: cloneData(DEFAULT_DATA),
    view: "periods",
    periodId: null,
    employeeId: null,
    periodYearFilter: String(new Date().getFullYear()),
    workspacePeriodYearFilter: "",
    periodNumberFilter: "",
    periodStatusFilter: "",
    employeeStoreFilter: "",
    workspaceEntrySnapshot: "",
    workspaceConfirmedInSession: false,
    workspaceDraft: null,
    activeTab: "manage",
  };

  function emptySlots(count) {
    const n = Math.max(1, Number(count) || 1);
    return Array.from({ length: n }, () => ({ in: "", out: "" }));
  }

  function hasSlotClock(slot) {
    if (!slot) return false;
    const cin = String(slot.in != null ? slot.in : "").trim();
    const cout = String(slot.out != null ? slot.out : "").trim();
    return !!(cin || cout);
  }

  function getDayRate(day, emp) {
    const dayRate = day && day.rate != null && day.rate !== "" ? Number(day.rate) : NaN;
    if (Number.isFinite(dayRate) && dayRate >= 0) return dayRate;
    return Number(emp && emp.rate) || 0;
  }

  function sumSegmentPayAmounts(emp) {
    let regAmt = 0;
    let otAmt = 0;
    let ot2Amt = 0;
    (emp && emp.segments ? emp.segments : []).forEach((raw) => {
      const day = normalizeDay(raw);
      const rate = getDayRate(day, emp);
      const reg = Number(day.reg) || 0;
      const ot = Number(day.ot) || 0;
      const ot2 = Number(day.ot2) || 0;
      regAmt += reg * rate;
      otAmt += ot * (Number(emp.otRate) || 0);
      ot2Amt += ot2 * (Number(emp.ot2Rate) || 0);
    });
    return {
      regAmt,
      otAmt,
      ot2Amt,
      totalAmt: regAmt + otAmt + ot2Amt,
    };
  }

  function getEffectiveRegularRate(emp) {
    const sums = sumSegments(emp);
    if (!sums.reg) return Number(emp && emp.rate) || 0;
    return sumSegmentPayAmounts(emp).regAmt / sums.reg;
  }

  function applyDefaultRateToAllDays(emp, rate) {
    if (!emp) return;
    const nextRate = Number(rate) || 0;
    emp.rate = nextRate;
    (emp.segments || []).forEach((seg) => {
      const day = normalizeDay(seg);
      day.rate = nextRate;
      Object.assign(seg, day);
    });
  }

  const DETAIL_SUMMARY_SEP = " · ";

  function formatDetailLabeledTriplet(regVal, otVal, ot2Val) {
    return `R: ${fmtMoney(regVal)}${DETAIL_SUMMARY_SEP}OT: ${fmtMoney(otVal)}${DETAIL_SUMMARY_SEP}OT2: ${fmtMoney(ot2Val)}`;
  }

  function formatDetailRateSummary(emp) {
    const rates = new Set();
    (emp.segments || []).forEach((raw) => {
      rates.add(getDayRate(normalizeDay(raw), emp).toFixed(2));
    });
    const otText = fmtMoney(emp.otRate);
    const ot2Text = fmtMoney(emp.ot2Rate);
    const regText = rates.size <= 1 ? fmtMoney(emp.rate) : [...rates].map((r) => fmtMoney(Number(r))).join(", ");
    return `R: ${regText}${DETAIL_SUMMARY_SEP}OT: ${otText}${DETAIL_SUMMARY_SEP}OT2: ${ot2Text}`;
  }

  function formatDetailWeekAmountSummary(totals) {
    const regAmt = totals && totals.regAmt != null ? totals.regAmt : 0;
    const otAmt = totals && totals.otAmt != null ? totals.otAmt : 0;
    const ot2Amt = totals && totals.ot2Amt != null ? totals.ot2Amt : 0;
    const total =
      totals && totals.amount != null ? totals.amount : Number(regAmt) + Number(otAmt) + Number(ot2Amt);
    return `T: ${fmtMoney(total)}${DETAIL_SUMMARY_SEP}${formatDetailLabeledTriplet(regAmt, otAmt, ot2Amt)}`;
  }

  function formatDetailWeekHoursSummary(totals) {
    const reg = totals && totals.reg != null ? totals.reg : 0;
    const ot = totals && totals.ot != null ? totals.ot : 0;
    const ot2 = totals && totals.ot2 != null ? totals.ot2 : 0;
    const total =
      totals && totals.hours != null ? totals.hours : Number(reg) + Number(ot) + Number(ot2);
    return `T: ${fmtMoney(total)}${DETAIL_SUMMARY_SEP}${formatDetailLabeledTriplet(reg, ot, ot2)}`;
  }

  /** 每日一条：3 行 In/Out + 当日 Meal / Rate / Reg / OT / OT2 */
  function normalizeDay(d) {
    const slotRows = Number(d && d.slotRows);
    const rateRaw = d && d.rate != null && d.rate !== "" ? Number(d.rate) : null;
    const o = {
      date: d && d.date != null ? d.date : "",
      meal: d && d.meal != null ? d.meal : "",
      rate: Number.isFinite(rateRaw) && rateRaw >= 0 ? rateRaw : null,
      reg: Number(d && d.reg) || 0,
      ot: Number(d && d.ot) || 0,
      ot2: Number(d && d.ot2) || 0,
      slots: emptySlots(),
      slotRows: Number.isFinite(slotRows) && slotRows > 0 ? Math.floor(slotRows) : 0,
    };
    if (d && Array.isArray(d.slots)) {
      o.slots = d.slots
        .map((sl) => ({
          in: sl && sl.in != null ? sl.in : "",
          out: sl && sl.out != null ? sl.out : "",
        }))
        .filter((sl) => sl && typeof sl === "object");
      if (o.slots.length === 0) o.slots = emptySlots();
    }
    return o;
  }

  /** 旧版扁平 in1–out4 → 每日 3 条 slot */
  function migrateLegacySegmentToDay(s) {
    if (!s || typeof s !== "object") return normalizeDay({});
    if (Array.isArray(s.slots) && s.slots.length >= 1) {
      return normalizeDay(s);
    }
    const slots = emptySlots(3);
    slots[0] = { in: s.in1 || "", out: s.out1 || "" };
    slots[1] = { in: s.in2 || "", out: s.out2 || "" };
    slots[2] = {
      in: s.in3 || s.in4 || "",
      out: s.out3 || s.out4 || "",
    };
    return normalizeDay({
      date: s.date || "",
      slots,
      meal: s.meal ?? "",
      reg: s.reg ?? 0,
      ot: s.ot ?? 0,
      ot2: s.ot2 ?? 0,
      rate: s.rate ?? null,
    });
  }

  /** HH:MM 24h → 当日分钟数，无效返回 null */
  function clockToMinutes(str) {
    if (str == null || String(str).trim() === "") return null;
    const m = String(str)
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) return null;
    return h * 60 + min;
  }

  /** 一对 In/Out 的间隔分钟数；支持跨午夜（Out < In） */
  function pairNetMinutes(inStr, outStr) {
    const a = clockToMinutes(inStr);
    const b = clockToMinutes(outStr);
    if (a === null || b === null) return 0;
    let d = b - a;
    if (d < 0) d += 24 * 60;
    return d;
  }

  /** Meal：支持 "1:00"、"0:30"；纯数字按「分钟」计（如 30） */
  function mealMinutes(str) {
    if (str == null || String(str).trim() === "") return 0;
    const s = String(str).trim();
    if (s.includes(":")) {
      const parts = s.split(":");
      const hh = parseFloat(parts[0]) || 0;
      const mm = parseFloat((parts[1] || "").replace(/\D/g, "")) || 0;
      return Math.round(hh * 60 + mm);
    }
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : Math.round(n);
  }

  /** 根据当日 3 组 In/Out 与 Meal 计算 Regular（小时，两位小数） */
  function computeRegularHoursFromDay(day) {
    let work = 0;
    day.slots.forEach((sl) => {
      work += pairNetMinutes(sl.in, sl.out);
    });
    const meal = mealMinutes(day.meal);
    const net = Math.max(0, work - meal);
    return Math.round((net / 60) * 100) / 100;
  }

  function applyAutoRegularHours(emp) {
    if (!emp || !Array.isArray(emp.segments)) return;
    emp.segments.forEach((day) => {
      day.reg = computeRegularHoursFromDay(day);
    });
  }

  function writeSegmentRegInputs(emp) {
    if (!emp || !Array.isArray(emp.segments)) return;
    $all(`${MANAGE_SEG_ROOT} tr[data-primary="1"]`).forEach((row) => {
      const d = parseInt(row.getAttribute("data-day-index"), 10);
      const inp = row.querySelector('.field-seg[data-field="reg"]');
      if (inp && emp.segments[d] != null) {
        inp.value = emp.segments[d].reg;
      }
    });
  }

  const CLOCK_MEAL_FIELDS = new Set(["in", "out", "meal"]);

  const DEFAULT_ADJUSTMENTS = {
    exempt: "",
    incentive: 0,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    sickHours: 0,
    svcw: 0,
    tips: 0,
    childSup: 0,
    medDed: 0,
    eee40: 0,
    eer60: 0,
  };

  function mergeAdjustments(adj) {
    const a = adj && typeof adj === "object" ? adj : {};
    return { ...DEFAULT_ADJUSTMENTS, ...a };
  }

  function migratePeriods(data) {
    const preset = buildPresetPeriods();
    const old = Array.isArray(data && data.periods) ? data.periods : [];
    const map = new Map(old.map((p) => [p && p.id, p]));
    data.periods = preset.map((p) => {
      const ex = map.get(p.id);
      if (!ex || typeof ex !== "object") return p;
      return {
        ...p,
        status: ex.status != null ? ex.status : p.status,
      };
    });
  }

  function migratePayrollData(data) {
    if (!data || typeof data !== "object") return;
    if (!data.employees || typeof data.employees !== "object") data.employees = {};
    if (!Array.isArray(data.periods)) data.periods = [];
    if (!Array.isArray(data.auditLog)) data.auditLog = [];
    applyAdpMappingToData(data);
    fillElapsed2026PeriodEmployees(data.employees, data.periods);
    migratePeriods(data);
    syncEmployeesFromUnifiedRoster(data.employees);
    fillDraftScenario(data.employees);
    fillConfirmedPeriodsData(data.employees, data.periods);
    fillPartialConfirmedScenario(data.employees, data.periods);
    syncPeriodStatuses(data.periods, data.employees);
    const tipOutStores = getTipOutStores();
    const defaultStore = tipOutStores[0] || DEFAULT_STORE_NAME;
    Object.keys(data.employees).forEach((pid) => {
      const list = Array.isArray(data.employees[pid]) ? data.employees[pid] : [];
      if (!Array.isArray(data.employees[pid])) data.employees[pid] = list;
      list.forEach((emp) => {
        if (!emp || typeof emp !== "object") return;
        if (Array.isArray(emp.segments)) {
          emp.segments = emp.segments.map((seg) => {
            const day = migrateLegacySegmentToDay(seg);
            if (day.rate == null) day.rate = Number(emp.rate) || 0;
            return day;
          });
        }
        emp.adjustments = mergeAdjustments(emp.adjustments);
        if (!emp.store || String(emp.store).trim() === "") emp.store = defaultStore;
        if (emp.adjustments.incentive === "" || emp.adjustments.incentive === null) emp.adjustments.incentive = 0;
        if (!emp.role) emp.role = resolveEmployeeRole(emp);
        if (!emp.hireDate) emp.hireDate = resolveEmployeeHireDate(emp);
      });
    });

    // 兼容旧版 localStorage：为示例员工补齐第2周演示数据
    const p = data.employees["p2026-08"];
    if (Array.isArray(p)) {
      const a29 = p.find((e) => e && e.id === "emp-a29");
      if (a29 && a29.name === "A29") a29.name = "小飞鸽";
      if (a29 && Array.isArray(a29.segments)) {
        const hasWeek2 = a29.segments.some((seg) => seg && seg.date === "04/22/2026");
        if (!hasWeek2) {
          a29.segments.push(
            migrateLegacySegmentToDay({
              date: "04/22/2026",
              slots: [
                { in: "11:00", out: "15:00" },
                { in: "16:00", out: "21:00" },
                { in: "", out: "" },
              ],
              meal: "0:45",
              reg: 8.25,
              ot: 1,
              ot2: 0,
            })
          );
        }
      }
    }

    // 最终兜底：任何情况下都保证 periods 可渲染
    if (!Array.isArray(data.periods) || data.periods.length === 0) {
      data.periods = buildPresetPeriods();
    }
  }

  let remoteSaveTimer = null;

  function buildSnapshot() {
    return {
      data: state.data,
      view: state.view,
      periodId: state.periodId,
      employeeId: state.employeeId,
      periodYearFilter: state.periodYearFilter,
      workspacePeriodYearFilter: state.workspacePeriodYearFilter,
      periodNumberFilter: state.periodNumberFilter,
      periodStatusFilter: state.periodStatusFilter,
      employeeStoreFilter: state.employeeStoreFilter,
      activeTab: state.activeTab,
    };
  }

  function applySnapshot(parsed) {
    if (!parsed || typeof parsed !== "object") return;
    if (parsed.data) {
      state.data = parsed.data;
      try {
        migratePayrollData(state.data);
      } catch (_) {
        state.data = cloneData(DEFAULT_DATA);
      }
    }
    if (parsed.view) state.view = parsed.view;
    if (parsed.periodId) state.periodId = parsed.periodId;
    if (parsed.employeeId) state.employeeId = parsed.employeeId;
    if (typeof parsed.periodYearFilter === "string") state.periodYearFilter = parsed.periodYearFilter;
    if (typeof parsed.workspacePeriodYearFilter === "string") {
      state.workspacePeriodYearFilter = parsed.workspacePeriodYearFilter;
    }
    if (typeof parsed.periodNumberFilter === "string") state.periodNumberFilter = parsed.periodNumberFilter;
    if (typeof parsed.periodStatusFilter === "string") state.periodStatusFilter = parsed.periodStatusFilter;
    if (typeof parsed.employeeStoreFilter === "string") state.employeeStoreFilter = parsed.employeeStoreFilter;
    if (parsed.activeTab) {
      state.activeTab = parsed.activeTab === "detail" ? "manage" : parsed.activeTab;
      if (state.activeTab !== "manage" && state.activeTab !== "adp") state.activeTab = "manage";
    }
    ensureDataShape();
  }

  function ensureDataShape() {
    if (!state.data || typeof state.data !== "object") {
      state.data = cloneData(DEFAULT_DATA);
    }
    if (!Array.isArray(state.data.periods) || state.data.periods.length === 0) {
      state.data.periods = buildPresetPeriods();
    } else {
      migratePeriods(state.data);
    }
    if (!state.data.employees || typeof state.data.employees !== "object") {
      state.data.employees = {};
    }
    if (!Array.isArray(state.data.auditLog)) state.data.auditLog = [];
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applySnapshot(JSON.parse(raw));
      }
    } catch (_) {
      /* ignore */
    }
    ensureDataShape();
  }

  function scheduleRemoteSave() {
    if (typeof PayrollApiClient === "undefined") return;
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(() => {
      PayrollApiClient.saveSnapshot(buildSnapshot()).catch(() => {});
    }, 400);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot()));
    } catch (_) {
      /* ignore */
    }
    scheduleRemoteSave();
  }

  function formatAuditTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const loc = typeof getPayrollLocale === "function" && getPayrollLocale() === "en" ? "en-US" : "zh-CN";
      return d.toLocaleString(loc, { hour12: false });
    } catch (_) {
      return iso;
    }
  }

  function auditActionLabel(action) {
    const map = {
      confirm: T("audit.confirm"),
      export_csv: T("audit.exportCsv"),
      export_batch: T("audit.exportBatch"),
      export_detail_pdf: T("audit.exportDetailPdf"),
      export_detail_csv: T("audit.exportDetailCsv"),
      export_detail_email: T("audit.exportDetailEmail"),
      tipout_import: T("audit.tipoutImport"),
      field_change: T("audit.fieldChange"),
    };
    return map[action] || action;
  }

  function renderAuditLogRows(items) {
    const tbody = $("#payroll-audit-rows");
    if (!tbody) return;
    if (!items || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--text-tertiary)">${escapeHtml(T("audit.empty"))}</td></tr>`;
      return;
    }
    tbody.innerHTML = items
      .map((row) => {
        const meta = row.meta || {};
        const note = meta.employeeName
          ? meta.employeeName
          : meta.count != null
            ? T("audit.countPeople", { n: meta.count })
            : "";
        return `<tr>
          <td style="white-space:nowrap">${escapeHtml(formatAuditTime(row.at))}</td>
          <td>${escapeHtml(auditActionLabel(row.action))}</td>
          <td style="font-family:ui-monospace,Menlo,monospace;font-size:11px">${escapeHtml(row.periodId || "—")}<br>${escapeHtml(row.employeeId || "")}</td>
          <td>${escapeHtml(note)}</td>
        </tr>`;
      })
      .join("");
  }

  function showAuditLogModal() {
    const modal = $("#payrollAuditLogModal");
    if (!modal) return;
    const localItems = Array.isArray(state.data.auditLog) ? state.data.auditLog.slice(0, 50) : [];
    renderAuditLogRows(localItems);
    modal.classList.add("show");
    if (typeof PayrollApiClient !== "undefined") {
      PayrollApiClient.fetchAuditLog(50).then((remote) => {
        if (remote && Array.isArray(remote.items) && remote.items.length > 0) {
          renderAuditLogRows(remote.items);
        }
      });
    }
  }

  function hideAuditLogModal() {
    $("#payrollAuditLogModal")?.classList.remove("show");
  }

  function showEmployeesDetailModal() {
    syncDerived();
    const source = document.querySelector("#tab-panel-detail .payroll-detail-print");
    const target = $("#employeesDetailModalBody");
    if (!source || !target) return;
    const clone = source.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    target.innerHTML = "";
    target.appendChild(clone);
    const modalId = "employeesDetailPreviewModal";
    if (typeof openModal === "function") openModal(modalId);
    else {
      const modal = $("#" + modalId);
      if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    }
  }

  function hideEmployeesDetailModal() {
    if (typeof closePayrollDetailExportMenus === "function") closePayrollDetailExportMenus();
    const modalId = "employeesDetailPreviewModal";
    if (typeof closeModal === "function") closeModal(modalId);
    else {
      const modal = $("#" + modalId);
      if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "";
      }
    }
  }

  function showAdpReportModal() {
    syncDerived();
    const source = document.querySelector("#tab-panel-adp .payroll-adp-preview-source");
    const target = $("#adpReportModalBody");
    if (!source || !target) return;
    const clone = source.cloneNode(true);
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    clone.querySelector(".payroll-adp-preview-hint")?.remove();
    target.innerHTML = "";
    target.appendChild(clone);
    const hint = $("#adp-report-modal-hint");
    const sourceHint = $("#adp-preview-hint");
    if (hint && sourceHint) hint.textContent = sourceHint.textContent;
    const emp = getEmployee(state.periodId, state.employeeId);
    const exportBtn = $("#btn-adp-report-modal-export");
    if (exportBtn) exportBtn.disabled = !emp || !emp.adpFile;
    const modalId = "adpReportPreviewModal";
    if (typeof openModal === "function") openModal(modalId);
    else {
      const modal = $("#" + modalId);
      if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
      }
    }
  }

  function hideAdpReportModal() {
    const modalId = "adpReportPreviewModal";
    if (typeof closeModal === "function") closeModal(modalId);
    else {
      const modal = $("#" + modalId);
      if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "";
      }
    }
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function getPeriod(id) {
    return state.data.periods.find((p) => p.id === id);
  }

  function getPeriodEmployeesNavTitle(periodId) {
    const period = getPeriod(periodId);
    const n = period && period.periodNumber != null ? period.periodNumber : "—";
    return T("nav.periodEmployees", { n });
  }

  function syncPayrollMainTitle(viewName) {
    const mainTitle = $("#payroll-main-title");
    if (!mainTitle) return;
    if (viewName === "workspace") {
      mainTitle.hidden = true;
      return;
    }
    mainTitle.hidden = false;
    if (viewName === "periods") {
      mainTitle.textContent = T("nav.periods");
      return;
    }
    if (viewName === "employees") {
      mainTitle.textContent = getPeriodEmployeesNavTitle(state.periodId);
      return;
    }
    mainTitle.textContent = T("nav.employees");
  }

  function getEmployee(periodId, empId) {
    const list = state.data.employees[periodId] || [];
    return list.find((e) => e.id === empId);
  }

  function formatEmployeeRoleTagHtml(role) {
    const label = String(role || "").trim();
    if (!label || label === "—") return "";
    return `<span class="tag tag-blue payroll-employee-role-tag">${escapeHtml(label)}</span>`;
  }

  function formatEmployeeListNameCell(emp) {
    if (!emp) return "—";
    const name = String(emp.name || "").trim() || "—";
    const role = resolveEmployeeRole(emp);
    const adpWarn = !emp.adpFile
      ? `<span class="text-danger payroll-employee-adp-warn" title="${escapeHtml(T("employee.missingAdp"))}">⚠</span>`
      : "";
    return `<div class="payroll-employee-name-cell"><strong class="payroll-employee-name-text">${escapeHtml(name)}</strong>${formatEmployeeRoleTagHtml(role)}${adpWarn}</div>`;
  }

  function formatWorkspaceEmployeeOptionLabel(emp) {
    if (!emp) return "";
    const adp = String(emp.adpFile || "").trim();
    return adp ? `${emp.name} · #${adp}` : emp.name;
  }

  function syncWorkspaceEmployeeRoleTag(emp) {
    const tag = $("#ws-employee-role-tag");
    if (!tag) return;
    const role = resolveEmployeeRole(emp);
    if (!role || role === "—") {
      tag.hidden = true;
      tag.textContent = "";
      return;
    }
    tag.hidden = false;
    tag.textContent = role;
    tag.className = "tag tag-blue payroll-employee-role-tag";
  }

  function renderWorkspaceEmployeeSwitch(selectedId) {
    const sel = $("#ws-employee-switch");
    if (!sel) return;
    const list = filterEmployeesByStore(state.data.employees[state.periodId] || [], state.employeeStoreFilter);
    const currentId = selectedId || state.employeeId;
    sel.innerHTML = list
      .map((e) => {
        return `<option value="${escapeHtml(e.id)}">${escapeHtml(formatWorkspaceEmployeeOptionLabel(e))}</option>`;
      })
      .join("");
    if (currentId && list.some((e) => e.id === currentId)) {
      sel.value = currentId;
    } else if (list.length > 0) {
      sel.value = list[0].id;
    }
    syncWorkspaceEmployeeRoleTag(getEmployee(state.periodId, sel.value));
  }

  function navigateWorkspaceEmployee(empId) {
    if (!empId || empId === state.employeeId) return;
    const apply = () => {
      state.employeeId = empId;
      markWorkspaceEntrySnapshot();
      renderManageForm();
      syncWorkspaceDirtyBaseline();
    };
    readFormIntoDraft();
    if (hasUnconfirmedWorkspaceChanges()) {
      showUnsavedConfirmDialog().then((ok) => {
        if (!ok) {
          const sel = $("#ws-employee-switch");
          if (sel) sel.value = state.employeeId;
          return;
        }
        apply();
      });
      return;
    }
    apply();
  }

  function buildEmployeeSnapshot(emp) {
    if (!emp) return "";
    const safe = {
      adpFile: emp.adpFile || "",
      ssn: emp.ssn || "",
      hireDate: emp.hireDate || "",
      confirmed: !!emp.confirmed,
      rate: Number(emp.rate) || 0,
      otRate: Number(emp.otRate) || 0,
      ot2Rate: Number(emp.ot2Rate) || 0,
      segments: Array.isArray(emp.segments)
        ? emp.segments.map((d) => {
            const day = normalizeDay(d);
            return {
              date: day.date || "",
              meal: day.meal || "",
              reg: Number(day.reg) || 0,
              ot: Number(day.ot) || 0,
              ot2: Number(day.ot2) || 0,
              rate: getDayRate(day, emp),
              slots: day.slots.map((s) => ({ in: s.in || "", out: s.out || "" })),
            };
          })
        : [],
      adjustments: mergeAdjustments(emp.adjustments),
    };
    return JSON.stringify(safe);
  }

  function markWorkspaceEntrySnapshot() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) {
      state.workspaceEntrySnapshot = "";
      state.workspaceDraft = null;
      state.workspaceConfirmedInSession = false;
      return;
    }
    state.workspaceEntrySnapshot = buildEmployeeSnapshot(emp);
    initWorkspaceDraft();
    state.workspaceConfirmedInSession = false;
  }

  function initWorkspaceDraft() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) {
      state.workspaceDraft = null;
      return;
    }
    const segments = (Array.isArray(emp.segments) ? emp.segments : []).map((seg) => {
      const day = migrateLegacySegmentToDay(seg);
      if (day.rate == null) day.rate = Number(emp.rate) || 0;
      return normalizeDay(day);
    });
    state.workspaceDraft = {
      adpFile: emp.adpFile || "",
      ssn: emp.ssn || "",
      hireDate: emp.hireDate || "",
      segments: cloneData(segments),
      adjustments: mergeAdjustments(emp.adjustments),
    };
  }

  function ensureWorkspaceDraft() {
    if (!state.workspaceDraft) initWorkspaceDraft();
    return state.workspaceDraft;
  }

  function getDraftAsEmployeeShape() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) return null;
    const draft = state.workspaceDraft;
    if (!draft) return emp;
    return {
      ...emp,
      adpFile: draft.adpFile,
      ssn: draft.ssn,
      hireDate: draft.hireDate,
      segments: draft.segments,
      adjustments: draft.adjustments,
    };
  }

  function formatChangeValue(value) {
    if (value == null || value === "") return "—";
    if (typeof value === "number") return fmtMoney(value);
    return String(value);
  }

  function pushWorkspaceChangeItem(items, time, type, beforeVal, afterVal) {
    const before = formatChangeValue(beforeVal);
    const after = formatChangeValue(afterVal);
    if (before === after) return;
    items.push({
      time: String(time || "").trim() || "—",
      type: String(type || "").trim() || "—",
      before,
      after,
    });
  }

  function getSaveConfirmPeriodScope() {
    return T("saveConfirm.periodScope");
  }

  function getSaveConfirmChangeTypes() {
    return {
      adpFile: T("saveConfirm.typeAdpFile"),
      ssn: T("saveConfirm.typeSsn"),
      hireDate: T("saveConfirm.typeHireDate"),
      date: "Date",
      meal: "Meal",
      rate: "Rate",
      reg: "Regular",
      ot: "OT",
      ot2: "OT2",
      in: "In",
      out: "Out",
      exempt: "Exempt",
      incentive: "Incentive",
      svcw: "SVCW",
      tips: "Tips",
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      sickHours: "Sick",
      childSup: "Child sup",
      medDed: "Med Ded",
      eee40: "Eee 40",
      eer60: "Eer 60",
    };
  }

  function getSaveConfirmTypeTagClass(type) {
    const t = String(type || "").toLowerCase();
    if (t === "in" || t === "out" || t.startsWith("in ") || t.startsWith("out ")) return "payroll-save-change-type--clock";
    if (t === "meal") return "payroll-save-change-type--meal";
    if (t === "regular" || t === "ot" || t === "ot2") return "payroll-save-change-type--hours";
    if (t === "rate" || t === "date") return "payroll-save-change-type--meta";
    if (t === "tips" || t === "svcw") return "payroll-save-change-type--tip";
    return "payroll-save-change-type--adj";
  }

  function formatSaveConfirmSlotType(baseType, slotIndex, totalSlots) {
    if (totalSlots <= 1) return baseType;
    return `${baseType} ${slotIndex + 1}`;
  }

  function buildWorkspaceChangeSummary() {
    readFormIntoDraft();
    let before;
    try {
      before = state.workspaceEntrySnapshot ? JSON.parse(state.workspaceEntrySnapshot) : null;
    } catch (_) {
      before = null;
    }
    const after = JSON.parse(buildEmployeeSnapshot(getDraftAsEmployeeShape()));
    const items = [];
    if (!before) return items;

    const types = getSaveConfirmChangeTypes();
    const periodScope = getSaveConfirmPeriodScope();

    pushWorkspaceChangeItem(items, periodScope, types.adpFile, before.adpFile, after.adpFile);
    pushWorkspaceChangeItem(items, periodScope, types.ssn, before.ssn, after.ssn);
    pushWorkspaceChangeItem(items, periodScope, types.hireDate, before.hireDate, after.hireDate);

    const adjKeys = [
      "exempt",
      "incentive",
      "svcw",
      "tips",
      "breakfast",
      "lunch",
      "dinner",
      "sickHours",
      "childSup",
      "medDed",
      "eee40",
      "eer60",
    ];
    adjKeys.forEach((key) => {
      const bAdj = before.adjustments || {};
      const aAdj = after.adjustments || {};
      pushWorkspaceChangeItem(items, periodScope, types[key], bAdj[key], aAdj[key]);
    });

    const segKeys = ["date", "meal", "rate", "reg", "ot", "ot2"];
    const maxDays = Math.max((before.segments || []).length, (after.segments || []).length);
    for (let i = 0; i < maxDays; i++) {
      const bDay = (before.segments || [])[i] || {};
      const aDay = (after.segments || [])[i] || {};
      const dayTime = aDay.date || bDay.date || "—";
      segKeys.forEach((field) => {
        pushWorkspaceChangeItem(items, dayTime, types[field], bDay[field], aDay[field]);
      });
      const maxSlots = Math.max((bDay.slots || []).length, (aDay.slots || []).length);
      for (let s = 0; s < maxSlots; s++) {
        const bSlot = (bDay.slots || [])[s] || {};
        const aSlot = (aDay.slots || [])[s] || {};
        pushWorkspaceChangeItem(
          items,
          dayTime,
          formatSaveConfirmSlotType(types.in, s, maxSlots),
          bSlot.in,
          aSlot.in
        );
        pushWorkspaceChangeItem(
          items,
          dayTime,
          formatSaveConfirmSlotType(types.out, s, maxSlots),
          bSlot.out,
          aSlot.out
        );
      }
    }
    return items;
  }

  function renderWorkspaceSaveConfirmBody(items) {
    const bodyEl = $("#workspace-save-confirm-body");
    if (!bodyEl) return;
    if (!items || items.length === 0) {
      bodyEl.innerHTML = `<p class="payroll-save-change-empty">${escapeHtml(T("saveConfirm.noChanges"))}</p>`;
      return;
    }
    bodyEl.innerHTML = `
      <div class="payroll-save-change-wrap">
        <table class="payroll-save-change-table">
          <thead>
            <tr>
              <th>${escapeHtml(T("saveConfirm.time"))}</th>
              <th>${escapeHtml(T("saveConfirm.type"))}</th>
              <th>${escapeHtml(T("saveConfirm.before"))}</th>
              <th class="payroll-save-change-arrow-col" aria-hidden="true"></th>
              <th>${escapeHtml(T("saveConfirm.after"))}</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                const tagClass = getSaveConfirmTypeTagClass(item.type);
                return `<tr>
                  <td class="payroll-save-change-time">${escapeHtml(item.time)}</td>
                  <td><span class="payroll-save-change-type ${tagClass}">${escapeHtml(item.type)}</span></td>
                  <td class="payroll-save-change-val payroll-save-change-val--before">${escapeHtml(item.before)}</td>
                  <td class="payroll-save-change-arrow-col" aria-hidden="true">→</td>
                  <td class="payroll-save-change-val payroll-save-change-val--after">${escapeHtml(item.after)}</td>
                </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <p class="payroll-save-change-footnote">${escapeHtml(T("saveConfirm.changeCount", { n: items.length }))}</p>`;
  }

  function showWorkspaceSaveConfirmDialog(items) {
    const modalId = "workspaceSaveConfirmModal";
    const modal = $("#" + modalId);
    const btnOk = $("#btn-save-confirm-ok");
    const btnCancel = $("#btn-save-confirm-cancel");
    const btnClose = $("#btn-save-confirm-close");
    if (!modal || !btnOk || !btnCancel || !btnClose) return Promise.resolve(false);
    renderWorkspaceSaveConfirmBody(items);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (typeof closeModal === "function") closeModal(modalId);
        else modal.classList.remove("show");
        resolve(ok);
      };
      const onOk = () => finish(true);
      const onCancel = () => finish(false);
      const onOverlay = (e) => {
        if (e.target === modal) finish(false);
      };
      const cleanup = () => {
        btnOk.removeEventListener("click", onOk);
        btnCancel.removeEventListener("click", onCancel);
        btnClose.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onOverlay);
      };
      btnOk.addEventListener("click", onOk);
      btnCancel.addEventListener("click", onCancel);
      btnClose.addEventListener("click", onCancel);
      modal.addEventListener("click", onOverlay);
      if (typeof openModal === "function") openModal(modalId);
      else modal.classList.add("show");
    });
  }

  function simulatePayrollBackendCalculation(emp) {
    if (!emp) return;
    applyAutoRegularHours(emp);
  }

  function commitDraftToEmployee() {
    const emp = getEmployee(state.periodId, state.employeeId);
    const draft = state.workspaceDraft;
    if (!emp || !draft) return;
    emp.adpFile = draft.adpFile;
    emp.ssn = draft.ssn;
    emp.hireDate = draft.hireDate;
    emp.segments = cloneData(draft.segments);
    emp.adjustments = mergeAdjustments(draft.adjustments);
    simulatePayrollBackendCalculation(emp);
    initWorkspaceDraft();
  }

  function hasUnconfirmedWorkspaceChanges() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp || !state.workspaceEntrySnapshot) return false;
    readFormIntoDraft();
    const draftEmp = getDraftAsEmployeeShape();
    if (!draftEmp) return false;
    const changed = buildEmployeeSnapshot(draftEmp) !== state.workspaceEntrySnapshot;
    return changed && !state.workspaceConfirmedInSession;
  }

  /** 将当前表单/草稿设为「无未保存变更」基线（放弃修改或导航完成后调用） */
  function syncWorkspaceDirtyBaseline() {
    readFormIntoDraft();
    const draftEmp = getDraftAsEmployeeShape();
    if (!draftEmp) {
      state.workspaceEntrySnapshot = "";
      state.workspaceConfirmedInSession = false;
      return;
    }
    state.workspaceEntrySnapshot = buildEmployeeSnapshot(draftEmp);
    state.workspaceConfirmedInSession = false;
  }

  /** 离开工作区前拦截未保存修改 */
  function shouldWarnBeforeLeavingManage() {
    return state.view === "workspace" && hasUnconfirmedWorkspaceChanges();
  }

  /** 放弃当前工作区草稿并恢复为已保存数据 */
  function discardUnsavedWorkspaceDraft() {
    initWorkspaceDraft();
    renderManageForm();
    syncWorkspaceDirtyBaseline();
  }

  /** 有未保存修改时弹出提示；确认离开后执行 actionFn，取消时执行 onCancel */
  function runAfterUnsavedWorkspaceConfirm(actionFn, onCancel) {
    readFormIntoDraft();
    if (!shouldWarnBeforeLeavingManage()) {
      actionFn();
      return;
    }
    showUnsavedConfirmDialog().then((ok) => {
      if (!ok) {
        if (typeof onCancel === "function") onCancel();
        return;
      }
      discardUnsavedWorkspaceDraft();
      actionFn();
    });
  }

  function showUnsavedConfirmDialog() {
    const modalId = "workspaceUnsavedConfirmModal";
    const modal = $("#" + modalId);
    const btnStay = $("#btn-unsaved-stay");
    const btnLeave = $("#btn-unsaved-leave");
    const btnClose = $("#btn-unsaved-close");
    if (!modal || !btnStay || !btnLeave || !btnClose) return Promise.resolve(false);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (typeof closeModal === "function") closeModal(modalId);
        else modal.classList.remove("show");
        resolve(ok);
      };
      const onStay = () => finish(false);
      const onLeave = () => finish(true);
      const onClose = () => finish(false);
      const onOverlay = (e) => {
        if (e.target === modal) finish(false);
      };
      const cleanup = () => {
        btnStay.removeEventListener("click", onStay);
        btnLeave.removeEventListener("click", onLeave);
        btnClose.removeEventListener("click", onClose);
        modal.removeEventListener("click", onOverlay);
      };
      btnStay.addEventListener("click", onStay);
      btnLeave.addEventListener("click", onLeave);
      btnClose.addEventListener("click", onClose);
      modal.addEventListener("click", onOverlay);
      if (typeof openModal === "function") openModal(modalId);
      else modal.classList.add("show");
    });
  }

  function getTipOutStores() {
    const rules = window.ruleData && typeof ruleData.getRules === "function" ? ruleData.getRules() : [];
    const seen = {};
    const stores = [];
    rules.forEach((r) => {
      const s = String((r && r.store) || "").trim();
      if (s && !seen[s]) {
        seen[s] = 1;
        stores.push(s);
      }
    });
    EXTRA_PAYROLL_STORES.forEach((s) => {
      if (s && !seen[s]) {
        seen[s] = 1;
        stores.push(s);
      }
    });
    if (!seen[DEFAULT_STORE_NAME]) stores.unshift(DEFAULT_STORE_NAME);
    return stores;
  }

  /** 薪资门店筛选项：小费规则门店 + 员工主档/本期员工门店（去重） */
  function getPayrollStoreOptions(employeeList) {
    const seen = {};
    const stores = [];
    const push = (s) => {
      const v = String(s || "").trim();
      if (!v || seen[v]) return;
      seen[v] = 1;
      stores.push(v);
    };
    getTipOutStores().forEach(push);
    UNIFIED_ROSTER_SEED.forEach((r) => push(r.store));
    (Array.isArray(employeeList) ? employeeList : []).forEach((e) => push(e && e.store));
    return stores;
  }

  function resolveEmployeeStoreFilter(employeeList) {
    const stores = getPayrollStoreOptions(employeeList);
    const current = String(state.employeeStoreFilter || "").trim();
    if (current && stores.includes(current)) return current;
    const next = stores[0] || "";
    state.employeeStoreFilter = next;
    return next;
  }

  function filterEmployeesByStore(list, storeFilter) {
    const active = String(storeFilter || "").trim();
    if (!active || !Array.isArray(list)) return list || [];
    return list.filter((e) => String((e && e.store) || "").trim() === active);
  }

  function getEmployeesForActiveStore(periodId) {
    const pid = periodId != null ? periodId : state.periodId;
    const list = (state.data && state.data.employees && state.data.employees[pid]) || [];
    return filterEmployeesByStore(list, state.employeeStoreFilter);
  }

  function renderEmployeeStoreFilterSelect(selectEl, employeeList) {
    if (!selectEl) return;
    const stores = getPayrollStoreOptions(employeeList);
    const active = resolveEmployeeStoreFilter(employeeList);
    if (stores.length === 0) {
      selectEl.innerHTML = "";
      return;
    }
    selectEl.innerHTML = stores
      .map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`)
      .join("");
    selectEl.value = active;
  }

  function syncEmployeeStoreFilterControls(employeeList) {
    renderEmployeeStoreFilterSelect($("#payroll-store-filter"), employeeList);
  }

  function handleEmployeeStoreFilterChange() {
    const list = state.data.employees[state.periodId] || [];
    const filtered = filterEmployeesByStore(list, state.employeeStoreFilter);
    syncEmployeeStoreFilterControls(list);
    if (state.view === "employees") {
      renderEmployees();
      saveState();
      return;
    }
    if (state.view !== "workspace") {
      saveState();
      return;
    }
    if (filtered.length === 0) {
      renderWorkspaceEmployeeSwitch(state.employeeId);
      saveState();
      return;
    }
    if (!filtered.some((e) => e.id === state.employeeId)) {
      state.employeeId = filtered[0].id;
      renderManageForm();
    } else {
      renderWorkspaceEmployeeSwitch(state.employeeId);
    }
    saveState();
  }

  function sumSegments(emp) {
    return emp.segments.reduce(
      (acc, s) => {
        acc.reg += Number(s.reg) || 0;
        acc.ot += Number(s.ot) || 0;
        acc.ot2 += Number(s.ot2) || 0;
        return acc;
      },
      { reg: 0, ot: 0, ot2: 0 }
    );
  }

  function fmtMoney(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return "—";
    return x.toFixed(2);
  }

  /** Payroll 年度：以 period.year / id（p2026-01）为准，不按 rangeLabel 日历日期拆分 */
  function getPeriodYear(period) {
    if (!period) return "";
    if (period.year != null && String(period.year).trim() !== "") {
      return String(period.year);
    }
    const idMatch = String(period.id || "").match(/^p(\d{4})-/i);
    if (idMatch) return idMatch[1];
    if (!period.rangeLabel) return "";
    const m = String(period.rangeLabel).match(/^\s*\d{1,2}\/\d{1,2}\/(\d{4})/);
    if (m && m[1]) return m[1];
    const all = String(period.rangeLabel).match(/\d{4}/g);
    return all && all.length ? all[0] : "";
  }

  function getRecentYears(count = 10) {
    const current = new Date().getFullYear();
    const years = [];
    const n = Math.max(1, Number(count) || 10);
    for (let i = 0; i < n; i++) {
      years.push(String(current - i));
    }
    return years;
  }

  function resolvePeriodIdForYear(year, preferPeriodNumber) {
    const periods = (Array.isArray(state.data.periods) ? state.data.periods : [])
      .filter((p) => getPeriodYear(p) === String(year))
      .sort((a, b) => Number(a.periodNumber || 0) - Number(b.periodNumber || 0));
    if (periods.length === 0) return null;
    if (preferPeriodNumber != null && String(preferPeriodNumber).trim() !== "") {
      const match = periods.find((p) => String(p.periodNumber || "") === String(preferPeriodNumber));
      if (match) return match.id;
    }
    const today = new Date();
    for (let i = periods.length - 1; i >= 0; i--) {
      const p = periods[i];
      if (!periodHasStarted(p, today)) continue;
      const list = state.data.employees[p.id];
      if (Array.isArray(list) && list.length > 0) return p.id;
    }
    for (let i = periods.length - 1; i >= 0; i--) {
      const p = periods[i];
      const list = state.data.employees[p.id];
      if (Array.isArray(list) && list.length > 0) return p.id;
    }
    return periods[0].id;
  }

  function renderManagePeriodNav() {
    const grid = $("#manage-period-nav-grid");
    const yearEl = $("#manage-period-nav-year");
    if (!grid) return;
    const current = getPeriod(state.periodId);
    const currentYear = current ? getPeriodYear(current) : "";
    const years = getRecentYears();
    const yearSuffix = T("year.suffix");
    let navYear = currentYear || years[0] || "";
    if (yearEl) {
      if (yearEl.tagName === "SELECT") {
        yearEl.innerHTML = years
          .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}${escapeHtml(yearSuffix)}</option>`)
          .join("");
        const preferred =
          state.workspacePeriodYearFilter && years.includes(state.workspacePeriodYearFilter)
            ? state.workspacePeriodYearFilter
            : currentYear && years.includes(currentYear)
              ? currentYear
              : years[0];
        navYear = preferred;
        yearEl.value = preferred;
        state.workspacePeriodYearFilter = preferred;
      } else {
        yearEl.textContent = navYear ? `${navYear}${yearSuffix}` : "—";
      }
    }
    if (!current && !navYear) {
      grid.innerHTML = "";
      return;
    }
    const periods = (Array.isArray(state.data.periods) ? state.data.periods : [])
      .filter((p) => getPeriodYear(p) === navYear)
      .sort((a, b) => Number(a.periodNumber || 0) - Number(b.periodNumber || 0));
    if (periods.length === 0) {
      grid.innerHTML = `<p class="payroll-workspace-period-empty">${escapeHtml(T("empty.periods"))}</p>`;
      return;
    }
    grid.innerHTML = periods
      .map((p) => {
        const isActive = p.id === state.periodId;
        return `<button type="button" class="payroll-manage-period-cell${isActive ? " is-active" : ""}" data-action="switch-workspace-period" data-period-id="${escapeHtml(p.id)}" aria-current="${isActive ? "true" : "false"}" aria-label="${escapeHtml(T("filter.periodN", { n: p.periodNumber != null ? p.periodNumber : "—" }))}">
          <span class="payroll-manage-period-no">${escapeHtml(String(p.periodNumber != null ? p.periodNumber : "—"))}</span>
        </button>`;
      })
      .join("");
  }

  function resolveEmployeeIdForPeriod(targetPeriodId, currentEmp) {
    const list = getEmployeesForActiveStore(targetPeriodId);
    if (!Array.isArray(list) || list.length === 0) return null;
    if (!currentEmp) return list[0].id;
    const adp = String(currentEmp.adpFile || "").trim();
    if (adp) {
      const byAdp = list.find((e) => e && String(e.adpFile || "").trim() === adp);
      if (byAdp) return byAdp.id;
    }
    const name = String(currentEmp.name || "").trim().toLowerCase();
    if (name) {
      const byName = list.find((e) => e && String(e.name || "").trim().toLowerCase() === name);
      if (byName) return byName.id;
    }
    return list[0].id;
  }

  function navigateWorkspacePeriod(periodId) {
    if (!periodId || periodId === state.periodId) return;
    const apply = () => {
      const currentEmp = getEmployee(state.periodId, state.employeeId);
      state.periodId = periodId;
      state.employeeId = resolveEmployeeIdForPeriod(periodId, currentEmp);
      state.workspacePeriodYearFilter = getPeriodYear(getPeriod(periodId));
      renderManagePeriodNav();
      markWorkspaceEntrySnapshot();
      renderManageForm();
      syncWorkspaceDirtyBaseline();
    };
    readFormIntoDraft();
    if (hasUnconfirmedWorkspaceChanges()) {
      showUnsavedConfirmDialog().then((ok) => {
        if (!ok) {
          renderManagePeriodNav();
          return;
        }
        apply();
      });
      return;
    }
    apply();
  }

  function resolveDefaultPeriodId() {
    const periods = Array.isArray(state.data.periods) ? state.data.periods : [];
    if (periods.length === 0) return null;
    syncPeriodStatuses(periods, state.data.employees);
    const currentYear = String(new Date().getFullYear());
    const recentYears = getRecentYears();
    const targetYear = recentYears.includes(currentYear) ? currentYear : recentYears[0];
    const yearPeriods = periods
      .filter((p) => getPeriodYear(p) === targetYear)
      .sort((a, b) => Number(a.periodNumber || 0) - Number(b.periodNumber || 0));
    const pool = yearPeriods.length > 0 ? yearPeriods : periods.slice();
    const today = new Date();
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i];
      if (!periodHasStarted(p, today)) continue;
      const list = state.data.employees[p.id];
      if (Array.isArray(list) && list.length > 0) return p.id;
    }
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i];
      const list = state.data.employees[p.id];
      if (Array.isArray(list) && list.length > 0) return p.id;
    }
    return pool[pool.length - 1].id;
  }

  function resolveDefaultEmployeeId(periodId) {
    const list = getEmployeesForActiveStore(periodId);
    if (!Array.isArray(list) || list.length === 0) return null;
    return list[0].id;
  }

  /** 进入 Manage Payroll 工作区（侧栏入口默认落点） */
  function enterManagePayrollWorkspace() {
    let periodId = state.periodId;
    if (!periodId || !getPeriod(periodId)) {
      periodId = resolveDefaultPeriodId();
    }
    if (!periodId) return false;

    let employeeId = state.employeeId;
    if (!employeeId || !getEmployee(periodId, employeeId)) {
      employeeId = resolveDefaultEmployeeId(periodId);
    }
    if (!employeeId) return false;

    state.periodId = periodId;
    state.employeeId = employeeId;
    state.view = "workspace";
    state.workspacePeriodYearFilter = getPeriodYear(getPeriod(periodId));
    renderManagePeriodNav();
    markWorkspaceEntrySnapshot();
    renderManageForm();
    syncWorkspaceDirtyBaseline();
    showView("workspace");
    return true;
  }

  function renderPeriods() {
    const tbody = $("#period-rows");
    const yearSelect = $("#period-year-filter");
    const numberSelect = $("#period-number-filter");
    const statusSelect = $("#period-status-filter");
    if (!tbody) return;
    if (!state.data || typeof state.data !== "object") state.data = cloneData(DEFAULT_DATA);
    if (!state.data.employees || typeof state.data.employees !== "object") state.data.employees = {};
    syncEmployeeStoreFilterControls(state.periodId ? state.data.employees[state.periodId] || [] : []);
    let periods = Array.isArray(state.data.periods) ? state.data.periods : [];
    if (periods.length === 0) {
      state.data.periods = buildPresetPeriods();
      periods = state.data.periods;
    }
    syncPeriodStatuses(periods, state.data.employees);
    const years = getRecentYears();
    const yearSuffix = T("year.suffix");
    if (yearSelect) {
      const opts = years
        .map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}${escapeHtml(yearSuffix)}</option>`)
        .join("");
      yearSelect.innerHTML = opts;
      if (years.includes(state.periodYearFilter)) {
        yearSelect.value = state.periodYearFilter;
      } else {
        state.periodYearFilter = years[0];
        yearSelect.value = years[0];
      }
    }
    let activeYear = state.periodYearFilter;
    let yearFiltered = periods.filter((p) => getPeriodYear(p) === activeYear);
    if (yearFiltered.length === 0 && periods.length > 0) {
      const allYears = [...new Set(periods.map((p) => getPeriodYear(p)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
      const fallbackYear = years.find((y) => allYears.includes(y)) || allYears[0] || years[0];
      activeYear = fallbackYear;
      state.periodYearFilter = fallbackYear;
      yearFiltered = periods.filter((p) => getPeriodYear(p) === fallbackYear);
      if (yearSelect) yearSelect.value = fallbackYear;
    }
    const periodNumbers = [...new Set(yearFiltered.map((p) => String(p.periodNumber || "")).filter(Boolean))].sort(
      (a, b) => Number(a) - Number(b)
    );
    if (numberSelect) {
      const opts = [`<option value="">${escapeHtml(T("filter.allPeriods"))}</option>`]
        .concat(
          periodNumbers.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(T("filter.periodN", { n }))}</option>`)
        )
        .join("");
      numberSelect.innerHTML = opts;
      if (state.periodNumberFilter && periodNumbers.includes(state.periodNumberFilter)) {
        numberSelect.value = state.periodNumberFilter;
      } else {
        state.periodNumberFilter = "";
        numberSelect.value = "";
      }
    }
    const activePeriodNo = state.periodNumberFilter;
    const validStatuses = ["draft", "partial", "confirmed"];
    if (state.periodStatusFilter && !validStatuses.includes(state.periodStatusFilter)) {
      state.periodStatusFilter = "";
    }
    const activeStatus = state.periodStatusFilter;
    let filtered = activePeriodNo
      ? yearFiltered.filter((p) => String(p.periodNumber || "") === activePeriodNo)
      : yearFiltered;
    if (statusSelect) {
      statusSelect.value = activeStatus || "";
    }
    if (activeStatus) filtered = filtered.filter((p) => (p && p.status) === activeStatus);
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:48px;text-align:center;color:var(--text-tertiary)">${escapeHtml(T("empty.periods"))}</td></tr>`;
      saveState();
      return;
    }
    tbody.innerHTML = filtered
      .map((p) => {
        const st =
          p.status === "confirmed"
            ? `<span class="tag tag-blue">${escapeHtml(T("status.confirmed"))}</span>`
            : p.status === "partial"
            ? `<span class="tag tag-green">${escapeHtml(T("status.partial"))}</span>`
            : `<span class="tag tag-orange">${escapeHtml(T("status.draft"))}</span>`;
        return `
        <tr>
          <td style="font-family:ui-monospace,Menlo,monospace">${escapeHtml(String(p.periodNumber || "—"))}</td>
          <td>${escapeHtml(p.rangeLabel)}</td>
          <td style="font-family:ui-monospace,Menlo,monospace">${escapeHtml(p.paycheckDate)}</td>
          <td>${st}</td>
          <td style="text-align:right">
            <button type="button" class="btn btn-primary btn-sm" data-action="open-period" data-period-id="${escapeHtml(p.id)}">${escapeHtml(T("table.enter"))}</button>
          </td>
        </tr>`;
      })
      .join("");
    saveState();
  }

  function getEmployeesForListExport() {
    const period = getPeriod(state.periodId);
    if (!period) return { period: null, filtered: [], exportable: [], skipped: [] };
    const list = filterEmployeesByStore(state.data.employees[state.periodId] || [], state.employeeStoreFilter);
    const exportable = list.filter((e) => e && String(e.adpFile || "").trim());
    const skipped = list.filter((e) => e && !String(e.adpFile || "").trim());
    return { period, filtered: list, exportable, skipped };
  }

  function updateEmployeeBatchExportButton() {
    const btn = $("#btn-export-batch-adp");
    if (!btn) return;
    const { exportable } = getEmployeesForListExport();
    btn.disabled = exportable.length === 0;
  }

  function renderEmployees() {
    const period = getPeriod(state.periodId);
    const tbody = $("#employee-rows");
    const title = $("#employee-period-title");
    if (!period || !tbody) return;
    if (title)
      title.textContent = T("employee.periodTitle", { range: period.rangeLabel, date: period.paycheckDate });
    const list = state.data.employees[state.periodId] || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:48px;text-align:center;color:var(--text-tertiary)">${escapeHtml(T("empty.employees"))}</td></tr>`;
      updateEmployeeBatchExportButton();
      return;
    }
    syncEmployeeStoreFilterControls(list);
    const filtered = filterEmployeesByStore(list, state.employeeStoreFilter);
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding:48px;text-align:center;color:var(--text-tertiary)">${escapeHtml(T("empty.storeEmployees"))}</td></tr>`;
      updateEmployeeBatchExportButton();
      saveState();
      return;
    }
    tbody.innerHTML = filtered
      .map((e) => {
        const sums = sumSegments(e);
        const conf = e.confirmed
          ? `<span style="color:var(--primary);font-size:12px;font-weight:500">${escapeHtml(T("employee.confirmed"))}</span>`
          : `<span style="color:var(--text-tertiary);font-size:12px">${escapeHtml(T("employee.unconfirmed"))}</span>`;
        return `
        <tr>
          <td>${formatEmployeeListNameCell(e)}</td>
          <td>${escapeHtml(e.store || DEFAULT_STORE_NAME)}</td>
          <td style="color:var(--text-secondary)">${escapeHtml(e.department)}</td>
          <td style="font-family:ui-monospace,Menlo,monospace">${escapeHtml(e.adpFile || "—")}</td>
          <td>${fmtMoney(sums.reg + sums.ot + sums.ot2)} h</td>
          <td>${conf}</td>
          <td style="text-align:right">
            <button type="button" class="btn btn-sm" data-action="open-employee" data-employee-id="${escapeHtml(e.id)}">${escapeHtml(T("employee.editPayroll"))}</button>
          </td>
        </tr>`;
      })
      .join("");
    updateEmployeeBatchExportButton();
    saveState();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function slotInOutParts(sl) {
    if (!sl) return ["—", "—"];
    const a = String(sl.in != null ? sl.in : "").trim();
    const b = String(sl.out != null ? sl.out : "").trim();
    return [a || "—", b || "—"];
  }

  function createWeekTotals() {
    return { reg: 0, ot: 0, ot2: 0, hours: 0, amount: 0, regAmt: 0, otAmt: 0, ot2Amt: 0 };
  }

  function formatMdyDate(date) {
    if (!date) return "";
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }

  /** 周标题按周期自然周段展示：第1周(start~start+6) 第2周(start+7~end) */
  function getWeekRangeTextFromPeriod(rangeLabel, weekIndex) {
    const { start, end } = getPeriodDateRange(rangeLabel);
    if (!start) return "";
    const weekStart = addDays(start, weekIndex * 7);
    if (!weekStart) return "";
    const rawWeekEnd = addDays(weekStart, 6);
    const weekEnd = end && rawWeekEnd && rawWeekEnd.getTime() > end.getTime() ? end : rawWeekEnd;
    if (!weekEnd) return "";
    return `${formatMdyDate(weekStart)} - ${formatMdyDate(weekEnd)}`;
  }

  function resolveWeekIndex(dayDateStr, periodStartDate, fallbackDayIdx) {
    const d = parseMdyDate(dayDateStr);
    if (d && periodStartDate) {
      const diff = Math.floor((d.getTime() - periodStartDate.getTime()) / (24 * 60 * 60 * 1000));
      if (diff >= 0 && diff <= 6) return 0;
      return 1;
    }
    return fallbackDayIdx <= 6 ? 0 : 1;
  }

  function buildDayRowsHtml(day, emp) {
    const s = day.slots && day.slots.length ? day.slots : emptySlots();
    const regNum = Number(day.reg) || 0;
    const otNum = Number(day.ot) || 0;
    const ot2Num = Number(day.ot2) || 0;
    const hoursNum = regNum + otNum + ot2Num;
    const rate = getDayRate(day, emp);
    const otRate = Number(emp && emp.otRate) || 0;
    const ot2Rate = Number(emp && emp.ot2Rate) || 0;
    const regAmtNum = regNum * rate;
    const otAmtNum = otNum * otRate;
    const ot2AmtNum = ot2Num * ot2Rate;
    const totalAmtNum = regAmtNum + otAmtNum + ot2AmtNum;
    const meal = escapeHtml(String(day.meal || "").trim() || "—");
    const visibleSlots = s.filter((slot) => {
      if (!slot) return false;
      const cin = String(slot.in != null ? slot.in : "").trim();
      const cout = String(slot.out != null ? slot.out : "").trim();
      return !!(cin || cout);
    });
    const rowsForDay = visibleSlots.length || 1;
    const dateCell = `<td class="payroll-detail-daily-date" rowspan="${rowsForDay}">${escapeHtml(day.date || "—")}</td>`;
    const mealCell = `<td rowspan="${rowsForDay}">${meal}</td>`;
    const rateCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(rate)}</td>`;
    const regCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(regNum)}</td>`;
    const otCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(otNum)}</td>`;
    const ot2Cell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(ot2Num)}</td>`;
    const hoursCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}" style="font-weight:600">${fmtMoney(hoursNum)}</td>`;
    const regAmtCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(regAmtNum)}</td>`;
    const otAmtCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(otAmtNum)}</td>`;
    const ot2AmtCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}">${fmtMoney(ot2AmtNum)}</td>`;
    const totalAmtCell = `<td class="payroll-detail-num" rowspan="${rowsForDay}" style="font-weight:600">${fmtMoney(totalAmtNum)}</td>`;
    const rows = [];
    for (let i = 0; i < rowsForDay; i++) {
      const [cin, cout] = slotInOutParts(visibleSlots[i]);
      if (i === 0) {
        rows.push(`<tr>
      ${dateCell}
      <td class="payroll-detail-clock">${escapeHtml(cin)}</td>
      <td class="payroll-detail-clock">${escapeHtml(cout)}</td>
      ${mealCell}
      ${rateCell}
      ${regCell}
      ${otCell}
      ${ot2Cell}
      ${hoursCell}
      ${regAmtCell}
      ${otAmtCell}
      ${ot2AmtCell}
      ${totalAmtCell}
    </tr>`);
      } else {
        rows.push(`<tr>
      <td class="payroll-detail-clock">${escapeHtml(cin)}</td>
      <td class="payroll-detail-clock">${escapeHtml(cout)}</td>
    </tr>`);
      }
    }
    return rows.join("");
  }

  /** Employees Detail：按周分组展示每天数据，并补充每周考勤汇总 */
  function buildEmployeesDetailDailyHtml(emp, period) {
    const segments = Array.isArray(emp.segments) ? emp.segments : [];
    if (segments.length === 0) {
      return `<section class="payroll-detail-daily">
        <h4 class="payroll-detail-daily-title">${escapeHtml(T("detail.dailyEmptyTitle"))}</h4>
        <p class="payroll-detail-daily-empty">${escapeHtml(T("detail.dailyEmpty"))}</p>
      </section>`;
    }

    const periodStartDate = getPeriodStartDate(period && period.rangeLabel);
    const weeks = [
      { index: 0, totals: createWeekTotals(), items: [] },
      { index: 1, totals: createWeekTotals(), items: [] },
    ];

    segments.forEach((raw, dayIdx) => {
      const day = normalizeDay(raw);
      const regNum = Number(day.reg) || 0;
      const otNum = Number(day.ot) || 0;
      const ot2Num = Number(day.ot2) || 0;
      const hoursNum = regNum + otNum + ot2Num;
      const regAmtNum = regNum * getDayRate(day, emp);
      const otAmtNum = otNum * (Number(emp.otRate) || 0);
      const ot2AmtNum = ot2Num * (Number(emp.ot2Rate) || 0);
      const amountNum = regAmtNum + otAmtNum + ot2AmtNum;
      const weekIdx = resolveWeekIndex(day.date, periodStartDate, dayIdx);
      const wk = weeks[weekIdx];
      wk.items.push({ day, dayIdx });
      wk.totals.reg += regNum;
      wk.totals.ot += otNum;
      wk.totals.ot2 += ot2Num;
      wk.totals.hours += hoursNum;
      wk.totals.regAmt += regAmtNum;
      wk.totals.otAmt += otAmtNum;
      wk.totals.ot2Amt += ot2AmtNum;
      wk.totals.amount += amountNum;
    });

    const rateText = formatDetailRateSummary(emp);
    const weekBlocks = weeks
      .filter((wk) => wk.items.length > 0)
      .map((wk) => {
        const body = wk.items.map((it) => buildDayRowsHtml(it.day, emp)).join("");
        const amountText = formatDetailWeekAmountSummary(wk.totals);
        const hoursText = formatDetailWeekHoursSummary(wk.totals);
        const rangeText = getWeekRangeTextFromPeriod(period && period.rangeLabel, wk.index);
        const weekTitle = rangeText
          ? T("detail.weekRange", { n: wk.index + 1, range: rangeText })
          : T("detail.weekN", { n: wk.index + 1 });
        return `<section class="payroll-detail-week-block">
          <h5 class="payroll-detail-week-title">${escapeHtml(weekTitle)}</h5>
          <div class="payroll-detail-daily-wrap">
            <table class="data-table payroll-detail-daily-table">
              <thead>
                <tr>
                  <th rowspan="2">Date</th>
                  <th rowspan="2">In</th>
                  <th rowspan="2">Out</th>
                  <th rowspan="2">Meal</th>
                  <th rowspan="2" style="text-align:right">${escapeHtml(T("detail.colRate"))}</th>
                  <th rowspan="2" style="text-align:right">Regular (h)</th>
                  <th rowspan="2" style="text-align:right">OT (h)</th>
                  <th rowspan="2" style="text-align:right">OT2 (h)</th>
                  <th rowspan="2" style="text-align:right">Hours (h)</th>
                  <th colspan="3" style="text-align:center">${escapeHtml(T("detail.colAmountGroup"))}</th>
                  <th rowspan="2" style="text-align:right">${escapeHtml(T("detail.colTotalAmt"))}</th>
                </tr>
                <tr>
                  <th style="text-align:right">${escapeHtml(T("detail.colRegAmt"))}</th>
                  <th style="text-align:right">${escapeHtml(T("detail.colOtAmt"))}</th>
                  <th style="text-align:right">${escapeHtml(T("detail.colOt2Amt"))}</th>
                </tr>
              </thead>
              <tbody>${body}</tbody>
            </table>
          </div>
          <div class="payroll-detail-week-summary">
            <span>${escapeHtml(T("detail.sumHoursParts"))}<strong class="payroll-detail-summary-compact">${escapeHtml(hoursText)}</strong></span>
            <span>${escapeHtml(T("detail.sumRate"))}<strong class="payroll-detail-summary-compact">${escapeHtml(rateText)}</strong></span>
            <span>${escapeHtml(T("detail.sumAmountParts"))}<strong class="payroll-detail-summary-compact">${escapeHtml(amountText)}</strong></span>
          </div>
        </section>`;
      })
      .join("");

    return `<section class="payroll-detail-daily">
      ${weekBlocks}
    </section>`;
  }

  function buildDetailExportPayload(emp, period) {
    if (!emp || !period) return null;
    const sums = sumSegments(emp);
    const payAmounts = sumSegmentPayAmounts(emp);
    const regAmt = payAmounts.regAmt;
    const otAmt = payAmounts.otAmt;
    const ot2Amt = payAmounts.ot2Amt;
    const totalHours = sums.reg + sums.ot + sums.ot2;
    const totalAmt = payAmounts.totalAmt;
    const mapping = getAdpMapping();
    const segments = Array.isArray(emp.segments) ? emp.segments : [];
    const periodStartDate = getPeriodStartDate(period.rangeLabel);
    const dailyRows = [];
    const weekSummaries = [];
    const weeks = [
      { index: 0, totals: createWeekTotals(), items: [] },
      { index: 1, totals: createWeekTotals(), items: [] },
    ];

    segments.forEach((raw, dayIdx) => {
      const day = normalizeDay(raw);
      const regNum = Number(day.reg) || 0;
      const otNum = Number(day.ot) || 0;
      const ot2Num = Number(day.ot2) || 0;
      const hoursNum = regNum + otNum + ot2Num;
      const regAmtNum = regNum * getDayRate(day, emp);
      const dayRate = getDayRate(day, emp);
      const otAmtNum = otNum * (Number(emp.otRate) || 0);
      const ot2AmtNum = ot2Num * (Number(emp.ot2Rate) || 0);
      const amountNum = regAmtNum + otAmtNum + ot2AmtNum;
      const weekIdx = resolveWeekIndex(day.date, periodStartDate, dayIdx);
      const wk = weeks[weekIdx];
      wk.items.push({ day });
      wk.totals.reg += regNum;
      wk.totals.ot += otNum;
      wk.totals.ot2 += ot2Num;
      wk.totals.hours += hoursNum;
      wk.totals.regAmt += regAmtNum;
      wk.totals.otAmt += otAmtNum;
      wk.totals.ot2Amt += ot2AmtNum;
      wk.totals.amount += amountNum;

      const slots = day.slots && day.slots.length ? day.slots : emptySlots();
      const visibleSlots = slots.filter((slot) => hasSlotClock(slot));
      const rowsForExport = visibleSlots.length ? visibleSlots : [slots[0] || { in: "", out: "" }];
      rowsForExport.forEach((slot, slotIdx) => {
        const [cin, cout] = slotInOutParts(slot);
        dailyRows.push({
          date: slotIdx === 0 ? day.date || "" : "",
          in: cin,
          out: cout,
          meal: slotIdx === 0 ? String(day.meal || "").trim() : "",
          rate: slotIdx === 0 ? dayRate : "",
          reg: slotIdx === 0 ? regNum : "",
          ot: slotIdx === 0 ? otNum : "",
          ot2: slotIdx === 0 ? ot2Num : "",
          hours: slotIdx === 0 ? hoursNum : "",
          regAmt: slotIdx === 0 ? regAmtNum : "",
          otAmt: slotIdx === 0 ? otAmtNum : "",
          ot2Amt: slotIdx === 0 ? ot2AmtNum : "",
          totalAmt: slotIdx === 0 ? amountNum : "",
        });
      });
    });

    weeks
      .filter((wk) => wk.items.length > 0)
      .forEach((wk) => {
        const rangeText = getWeekRangeTextFromPeriod(period.rangeLabel, wk.index);
        weekSummaries.push({
          title: T("detail.weekN", { n: wk.index + 1 }),
          range: rangeText || "",
          totalHours: wk.totals.hours,
          reg: wk.totals.reg,
          ot: wk.totals.ot,
          ot2: wk.totals.ot2,
          regAmt: wk.totals.regAmt,
          otAmt: wk.totals.otAmt,
          ot2Amt: wk.totals.ot2Amt,
          amount: wk.totals.amount,
        });
      });

    return {
      employeeName: emp.name,
      employeeDisplay: formatDetailEmployeeDisplay(emp),
      ssn: String(emp.ssn || "").trim(),
      role: resolveEmployeeRole(emp),
      hireDate: resolveEmployeeHireDate(emp),
      department: emp.department || "",
      store: emp.store || "",
      adpFile: emp.adpFile || "",
      confirmed: !!emp.confirmed,
      periodRange: period.rangeLabel,
      periodNumber: period.periodNumber,
      paycheckDate: period.paycheckDate,
      payDate: period.paycheckDate,
      payPeriod: period.rangeLabel,
      periodReportTitle: formatPayrollPeriodReportTitle(period),
      declarationVersion: (mapping && mapping.declarationVersion) || "",
      declarationText: renderDeclarationText(emp),
      summary: {
        regH: sums.reg,
        otH: sums.ot,
        ot2H: sums.ot2,
        totalH: totalHours,
        regAmt,
        otAmt,
        ot2Amt,
        totalAmt,
        rate: getEffectiveRegularRate(emp),
        otRate: emp.otRate,
        ot2Rate: emp.ot2Rate,
        svcw: Number(emp.adjustments && emp.adjustments.svcw) || 0,
        tips: Number(emp.adjustments && emp.adjustments.tips) || 0,
      },
      dailyRows,
      weekSummaries,
    };
  }

  /** 与「打印 / PDF」相同：克隆 Employees Detail 打印模板 HTML */
  function buildPayrollDetailPrintDocumentHtml() {
    syncDerived();
    const article = document.querySelector(".payroll-detail-print");
    if (!article) return null;
    const clone = article.cloneNode(true);
    clone.querySelectorAll(".print-only").forEach((el) => {
      el.style.display = "block";
    });
    const baseUrl = new URL(".", window.location.href).href;
    const htmlLang = typeof getPayrollLocale === "function" && getPayrollLocale() === "en" ? "en-US" : "zh-CN";
    return `<!DOCTYPE html><html lang="${htmlLang}"><head><meta charset="UTF-8"><title>${escapeHtml(T("detail.title"))}</title>
<link rel="stylesheet" href="${baseUrl}common.css">
<link rel="stylesheet" href="${baseUrl}payroll.css">
<style>
body{margin:0;padding:24px;background:#fff;}
.payroll-page .payroll-detail-print{max-width:none;width:100%;margin:0;border:none;border-radius:0;box-shadow:none;}
.payroll-page .payroll-detail-daily-wrap{overflow:visible!important;}
.payroll-page .payroll-detail-daily-table{min-width:1080px;width:max-content;max-width:none;font-size:11px;}
.payroll-page .payroll-detail-daily-table th,
.payroll-page .payroll-detail-daily-table td{padding:6px 8px;white-space:nowrap;}
.payroll-page .payroll-decl-amount{display:inline-block;font-size:1.35em;font-weight:800;color:#111;line-height:1.25;padding:0 2px 3px;border-bottom:2px solid #111;text-decoration:none;letter-spacing:.02em;}
.print-only{display:block !important;}
@media print{body{padding:15px 20px}@page{margin:10mm}}
</style></head><body class="payroll-page payroll-entered payroll-detail-export-doc">${clone.outerHTML}</body></html>`;
  }

  function applyTipOutBridgeForCurrentPeriod() {
    if (typeof TipOutPayrollBridge === "undefined" || !state.data || !state.periodId) return;
    if (TipOutPayrollBridge.applyBridgeToPeriod(state.data, state.periodId)) {
      saveState();
      const emp = getEmployee(state.periodId, state.employeeId);
      if (emp && state.workspaceDraft) {
        state.workspaceDraft.adjustments = mergeAdjustments({
          ...state.workspaceDraft.adjustments,
          tips: emp.adjustments.tips,
          svcw: emp.adjustments.svcw,
        });
      }
    }
  }

  function renderManageForm() {
    applyTipOutBridgeForCurrentPeriod();
    const emp = getEmployee(state.periodId, state.employeeId);
    const period = getPeriod(state.periodId);
    if (!emp || !period) return;
    ensureWorkspaceDraft();
    const editEmp = getDraftAsEmployeeShape();

    $("#ws-breadcrumb-period").textContent = T("employee.periodTitle", {
      range: period.rangeLabel,
      date: period.paycheckDate,
    });
    syncEmployeeStoreFilterControls(state.data.employees[state.periodId] || []);
    renderWorkspaceEmployeeSwitch(emp.id);
    renderManagePeriodNav();
    $("#field-adp-file").value = editEmp.adpFile;
    const ssnInput = $("#field-ssn");
    if (ssnInput) ssnInput.value = editEmp.ssn || "";
    const hireInput = $("#field-hire-date");
    if (hireInput) hireInput.value = mdyToIsoDateInput(resolveEmployeeHireDate(editEmp));
    $("#field-ot-rate").value = emp.otRate;
    $("#field-ot2-rate").value = emp.ot2Rate;

    editEmp.segments = editEmp.segments.map((seg) => {
      const day = migrateLegacySegmentToDay(seg);
      if (day.rate == null) day.rate = Number(editEmp.rate) || 0;
      return day;
    });
    ensureManageBiweeklySegments(editEmp, period);
    state.workspaceDraft.segments = editEmp.segments.map((d) => normalizeDay(d));

    const segWrap = $("#manage-segments-wrap");
    const rowHtml = [];
    const segments = state.workspaceDraft.segments;
    if (shouldGroupManageSegmentsByWeek(period)) {
      const weekGroups = buildManageSegmentWeekGroups(segments, period);
      if (segWrap) segWrap.innerHTML = renderManageBiweeklySegmentsHtml(period, weekGroups, editEmp);
    } else {
      segments.forEach((rawDay, dayIdx) => {
        appendManageSegmentDayRows(rowHtml, normalizeDay(rawDay), dayIdx, editEmp);
      });
      if (segWrap) segWrap.innerHTML = renderManageSingleSegmentTableHtml(rowHtml);
    }

    const adj = mergeAdjustments(state.workspaceDraft.adjustments);
    state.workspaceDraft.adjustments = adj;
    const ex = $("#adj-exempt");
    if (ex) ex.value = adj.exempt ?? "";
    $("#adj-incentive").value = adj.incentive ?? 0;
    $("#adj-svcw").value = adj.svcw;
    $("#adj-tips").value = adj.tips;
    $("#adj-breakfast").value = adj.breakfast;
    $("#adj-lunch").value = adj.lunch;
    $("#adj-dinner").value = adj.dinner;
    $("#adj-sick").value = adj.sickHours;
    $("#adj-child-sup").value = adj.childSup;
    $("#adj-med-ded").value = adj.medDed;
    $("#adj-eee40").value = adj.eee40;
    $("#adj-eer60").value = adj.eer60;

    syncDerived();
  }

  function readFormIntoDraft() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) return;
    const draft = ensureWorkspaceDraft();
    draft.adpFile = $("#field-adp-file").value.trim();
    draft.ssn = ($("#field-ssn") && $("#field-ssn").value.trim()) || "";
    draft.hireDate = isoDateInputToMdy($("#field-hire-date") && $("#field-hire-date").value);

    const dayIdxList = [
      ...new Set(
        $all(`${MANAGE_SEG_ROOT} tr[data-day-index]`).map((r) => parseInt(r.getAttribute("data-day-index"), 10))
      ),
    ]
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);
    const nextSegments = [];
    dayIdxList.forEach((dIdx) => {
      const dayRows = $all(`${MANAGE_SEG_ROOT} tr[data-day-index="${dIdx}"]`).sort((a, b) => {
        const ra = parseInt(a.getAttribute("data-row-order"), 10);
        const rb = parseInt(b.getAttribute("data-row-order"), 10);
        if (!Number.isNaN(ra) && !Number.isNaN(rb)) return ra - rb;
        return parseInt(a.getAttribute("data-slot-index"), 10) - parseInt(b.getAttribute("data-slot-index"), 10);
      });
      const day = normalizeDay({});
      day.slots = [];
      dayRows.forEach((row) => {
        const slot = parseInt(row.getAttribute("data-slot-index"), 10);
        if (Number.isNaN(slot) || slot < 0) return;
        const inEl = row.querySelector('.field-seg[data-field="in"]');
        const outEl = row.querySelector('.field-seg[data-field="out"]');
        const slotValue = {
          in: (inEl && inEl.value) || "",
          out: (outEl && outEl.value) || "",
        };
        day.slots.push(slotValue);
        if (row.getAttribute("data-primary") === "1") {
          const dateEl = row.querySelector('.field-seg[data-field="date"]');
          const mealEl = row.querySelector('.field-seg[data-field="meal"]');
          const regEl = row.querySelector('.field-seg[data-field="reg"]');
          const otEl = row.querySelector('.field-seg[data-field="ot"]');
          const ot2El = row.querySelector('.field-seg[data-field="ot2"]');
          const rateEl = row.querySelector('.field-seg[data-field="rate"]');
          if (dateEl) day.date = dateEl.value;
          if (mealEl) day.meal = mealEl.value;
          if (rateEl) day.rate = parseFloat(rateEl.value) || 0;
          if (regEl) day.reg = parseFloat(regEl.value) || 0;
          if (otEl) day.ot = parseFloat(otEl.value) || 0;
          if (ot2El) day.ot2 = parseFloat(ot2El.value) || 0;
        }
      });
      day.slotRows = Math.max(1, dayRows.length);
      if (day.slots.length === 0) day.slots = emptySlots();
      nextSegments.push(day);
    });
    if (nextSegments.length > 0) draft.segments = nextSegments;

    draft.adjustments = mergeAdjustments(draft.adjustments);
    draft.adjustments.exempt = ($("#adj-exempt") && $("#adj-exempt").value.trim()) || "";
    draft.adjustments.incentive = parseFloat($("#adj-incentive").value) || 0;
    draft.adjustments.svcw = parseFloat($("#adj-svcw").value) || 0;
    draft.adjustments.tips = parseFloat($("#adj-tips").value) || 0;
    draft.adjustments.breakfast = parseFloat($("#adj-breakfast").value) || 0;
    draft.adjustments.lunch = parseFloat($("#adj-lunch").value) || 0;
    draft.adjustments.dinner = parseFloat($("#adj-dinner").value) || 0;
    draft.adjustments.sickHours = parseFloat($("#adj-sick").value) || 0;
    draft.adjustments.childSup = parseFloat($("#adj-child-sup").value) || 0;
    draft.adjustments.medDed = parseFloat($("#adj-med-ded").value) || 0;
    draft.adjustments.eee40 = parseFloat($("#adj-eee40").value) || 0;
    draft.adjustments.eer60 = parseFloat($("#adj-eer60").value) || 0;
  }

  function syncDerived() {
    readFormIntoDraft();
    const emp = getDraftAsEmployeeShape();
    const period = getPeriod(state.periodId);
    if (!emp || !period) return;

    simulatePayrollBackendCalculation(emp);
    writeSegmentRegInputs(emp);

    const sums = sumSegments(emp);
    const payAmounts = sumSegmentPayAmounts(emp);
    const regAmt = payAmounts.regAmt;
    const otAmt = payAmounts.otAmt;
    const ot2Amt = payAmounts.ot2Amt;
    const totalHours = sums.reg + sums.ot + sums.ot2;
    const totalAmt = payAmounts.totalAmt;

    $("#sum-reg-h").textContent = fmtMoney(sums.reg);
    $("#sum-ot-h").textContent = fmtMoney(sums.ot);
    $("#sum-ot2-h").textContent = fmtMoney(sums.ot2);
    $("#sum-total-h").textContent = fmtMoney(totalHours);

    $("#sum-reg-amt").textContent = fmtMoney(regAmt);
    $("#sum-ot-amt").textContent = fmtMoney(otAmt);
    $("#sum-ot2-amt").textContent = fmtMoney(ot2Amt);
    $("#sum-total-amt").textContent = fmtMoney(totalAmt);

    syncDetailMetaFields(emp, period);
    syncDetailSignFooter(emp);
    const declBody = $("#detail-declaration-body");
    if (declBody) declBody.innerHTML = renderDeclarationHtml(emp);

    $("#detail-hours-grid").innerHTML = `
      <div class="payroll-detail-period-summary">
        <h4 class="payroll-detail-daily-title">${escapeHtml(T("detail.periodSummary"))}</h4>
        <div class="payroll-detail-grid">
        <div class="head">Regular</div>
        <div class="head">OT</div>
        <div class="head">OT2</div>
        <div class="head highlight">${escapeHtml(T("detail.totalHoursHead"))}</div>
        <div class="cell">${fmtMoney(sums.reg)}</div>
        <div class="cell">${fmtMoney(sums.ot)}</div>
        <div class="cell">${fmtMoney(sums.ot2)}</div>
        <div class="cell" style="font-weight:600">${fmtMoney(totalHours)}</div>
      </div>
      <div class="payroll-detail-grid" style="margin-top:12px">
        <div style="color:var(--text-tertiary);font-size:12px">${escapeHtml(T("manage.amount"))}</div>
        <div style="color:var(--text-tertiary);font-size:12px">${escapeHtml(T("manage.amount"))}</div>
        <div style="color:var(--text-tertiary);font-size:12px">${escapeHtml(T("manage.amount"))}</div>
        <div style="color:var(--text-tertiary);font-size:12px">${escapeHtml(T("detail.totalAmountHead"))}</div>
        <div class="cell">${fmtMoney(regAmt)}</div>
        <div class="cell">${fmtMoney(otAmt)}</div>
        <div class="cell">${fmtMoney(ot2Amt)}</div>
        <div class="cell" style="font-weight:600">${fmtMoney(totalAmt)}</div>
      </div>
      </div>
      ${buildEmployeesDetailDailyHtml(emp, period)}`;

    const missingAdpFile = !emp.adpFile;
    const adpRow = $("#adp-preview-row");
    if (adpRow) {
      adpRow.innerHTML = `<tr>
        <td style="font-family:ui-monospace,Menlo,monospace">${escapeHtml((getAdpMapping() && getAdpMapping().coCode) || state.data.coCode)}</td>
        <td style="font-family:ui-monospace,Menlo,monospace">${escapeHtml(period.paycheckDate)}</td>
        <td style="font-family:ui-monospace,Menlo,monospace" class="${missingAdpFile ? "text-danger" : ""}">${escapeHtml(emp.adpFile || "—")}</td>
        <td>${escapeHtml(emp.name)}</td>
        <td style="text-align:right;font-family:ui-monospace,Menlo,monospace">${fmtMoney(getEffectiveRegularRate(emp))}</td>
        <td style="text-align:right;font-family:ui-monospace,Menlo,monospace">${fmtMoney(sums.reg)}</td>
        <td style="font-family:ui-monospace,Menlo,monospace;font-size:12px">OHR</td>
        <td style="text-align:right;font-family:ui-monospace,Menlo,monospace">${fmtMoney(sums.ot)}</td>
        <td style="font-family:ui-monospace,Menlo,monospace;font-size:12px">CCT</td>
        <td style="text-align:right;font-family:ui-monospace,Menlo,monospace">${fmtMoney(emp.adjustments.tips)}</td>
        <td style="font-family:ui-monospace,Menlo,monospace;font-size:12px">SVC</td>
        <td style="text-align:right;font-family:ui-monospace,Menlo,monospace">${fmtMoney(emp.adjustments.svcw)}</td>
      </tr>`;
    }

    const exportBtn = $("#btn-adp-report-modal-export");
    if (exportBtn) exportBtn.disabled = missingAdpFile;
    updateManageWeekSummaries(emp, period);
    updateEmployeeBatchExportButton();
  }

  function showView(name) {
    state.view = name;
    const pageRoot = document.querySelector(".payroll-page");
    if (pageRoot) {
      pageRoot.classList.toggle("payroll-entered", name === "employees" || name === "workspace");
      pageRoot.classList.toggle("payroll-workspace-active", name === "workspace");
    }
    $("#view-periods").hidden = name !== "periods";
    $("#view-employees").hidden = name !== "employees";
    $("#view-workspace").hidden = name !== "workspace";
    const mainTitle = $("#payroll-main-title");
    const backPeriods = $("#btn-back-periods");
    const backWrap = $("#payroll-heading-back");
    const headingRow = document.querySelector(".payroll-heading-row");
    const modeBanner = $("#payroll-mode-banner");
    syncPayrollMainTitle(name);
    if (modeBanner) modeBanner.hidden = name === "workspace";
    if (headingRow) headingRow.hidden = name === "workspace";
    if (backWrap) backWrap.hidden = name === "periods" || name === "workspace";
    if (backPeriods) backPeriods.hidden = name !== "employees";
    saveState();
  }

  function applyConfirmEmployeeSave(changeCount) {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) return;
    commitDraftToEmployee();
    emp.confirmed = true;
    emp.confirmedAt = new Date().toISOString();
    state.workspaceConfirmedInSession = true;
    state.workspaceEntrySnapshot = buildEmployeeSnapshot(emp);
    initWorkspaceDraft();
    appendAudit("confirm", { employeeName: emp.name, changeCount: changeCount || 0 });
    saveState();
    renderManageForm();
    renderManagePeriodNav();
    if (typeof showNotification === "function") {
      showNotification(T("confirm.success"), "success");
    } else {
      alert(T("confirm.success"));
    }
  }

  function confirmEmployee() {
    const emp = getEmployee(state.periodId, state.employeeId);
    if (!emp) return;
    readFormIntoDraft();
    const changes = buildWorkspaceChangeSummary();
    if (changes.length === 0) {
      applyConfirmEmployeeSave(0);
      return;
    }
    showWorkspaceSaveConfirmDialog(changes).then((ok) => {
      if (!ok) return;
      applyConfirmEmployeeSave(changes.length);
    });
  }

  function showFieldHelp(fieldKey) {
    const meta = typeof getPayrollFieldHelp === "function" ? getPayrollFieldHelp(fieldKey) : null;
    if (!meta) return;
    const titleEl = $("#field-help-title");
    const bodyEl = $("#field-help-body");
    const modal = $("#fieldHelpModal");
    if (!titleEl || !bodyEl || !modal) return;
    titleEl.textContent = meta.title;
    let html = `<p style="margin:0">${escapeHtml(meta.body)}</p>`;
    if (meta.adp) {
      html += `<div class="field-help-adp"><strong>${escapeHtml(T("fieldHelp.adpMap"))}</strong>${escapeHtml(meta.adp)}</div>`;
    }
    bodyEl.innerHTML = html;
    modal.classList.add("show");
  }

  function hideFieldHelp() {
    const modal = $("#fieldHelpModal");
    if (modal) modal.classList.remove("show");
  }

  function bindFieldHelp() {
    document.body.addEventListener("click", (e) => {
      const helpBtn = e.target.closest("[data-field-help]");
      if (helpBtn) {
        e.preventDefault();
        e.stopPropagation();
        const key = helpBtn.getAttribute("data-field-help");
        if (key) showFieldHelp(key);
        return;
      }
      if (e.target.id === "btn-field-help-close" || e.target.id === "btn-field-help-ok") {
        hideFieldHelp();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideFieldHelp();
    });
  }

  function buildAdpRow(period, emp) {
    const m = getAdpMapping();
    const sums = sumSegments(emp);
    const coCode = (m && m.coCode) || state.data.coCode;
    const adj = mergeAdjustments(emp.adjustments);
    if (m && typeof m.buildRow === "function") {
      return m.buildRow({ coCode, period, employee: { ...emp, adjustments: adj }, sums });
    }
    return [
      coCode,
      period.paycheckDate,
      emp.adpFile,
      emp.name,
      String(getEffectiveRegularRate(emp)),
      String(sums.reg),
      "OHR",
      String(sums.ot),
      "CCT",
      String(adj.tips),
      "SVC",
      String(adj.svcw),
    ];
  }

  function getAdpCsvHeader() {
    const m = getAdpMapping();
    if (m && Array.isArray(m.csvColumns)) return m.csvColumns.slice();
    return [
      "CO CODE",
      "BATCH ID",
      "FILE #",
      "Employee Name",
      "Rate",
      "Reg Hours",
      "Hours 3 code",
      "Hours 3 amount",
      "Earnings 3 Code",
      "Earnings 3 Amount",
      "Earnings 3 Code",
      "Earnings 3 Amount",
    ];
  }

  function exportBatchAdpCsv() {
    const { period, exportable, skipped } = getEmployeesForListExport();
    if (!period || exportable.length === 0) {
      if (typeof showNotification === "function") showNotification(T("export.batchNoAdp"), "warning");
      return;
    }
    let hint = T("exportConfirm.hintBatch", { n: exportable.length });
    if (skipped.length > 0) hint += " " + T("exportConfirm.hintBatchSkipped", { n: skipped.length });
    showExportConfirmDialog(hint).then((ok) => {
      if (!ok) return;
      const header = getAdpCsvHeader();
      const rows = exportable.map((emp) => buildAdpRow(period, emp));
      const csv = buildAdpCsvContent(rows, header);
      const periodNo = period.periodNumber != null ? period.periodNumber : "period";
      downloadCsvFile(`ADP_PAYROLL_P${periodNo}_${period.paycheckDate}_BATCH.csv`, csv);
      appendAudit("export_batch", { count: exportable.length, skipped: skipped.length });
      if (typeof showNotification === "function") {
        showNotification(T("export.batchSuccess", { n: exportable.length }), "success");
      }
      saveState();
    });
  }

  function exportAdpCsv() {
    runAfterUnsavedWorkspaceConfirm(() => {
      const emp = getEmployee(state.periodId, state.employeeId);
      const period = getPeriod(state.periodId);
      if (!emp || !period || !emp.adpFile) return;

      showExportConfirmDialog(T("exportConfirm.hintSingle", { name: emp.name })).then((ok) => {
        if (!ok) return;
        const header = getAdpCsvHeader();
        const row = buildAdpRow(period, emp);
        const csv = buildAdpCsvContent([row], header);
        downloadCsvFile(`ADP_PAYROLL_${period.paycheckDate}_${emp.adpFile}.csv`, csv);
        appendAudit("export_csv", { employeeName: emp.name, batch: false });
        saveState();
      });
    });
  }

  function bind() {
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const act = btn.getAttribute("data-action");
      if (act === "open-period") {
        state.periodId = btn.getAttribute("data-period-id");
        const filtered = getEmployeesForActiveStore(state.periodId);
        if (filtered.length > 0) state.employeeId = filtered[0].id;
        renderEmployees();
        showView("employees");
      }
      if (act === "back-periods") {
        showView("periods");
      }
      if (act === "open-employee") {
        state.employeeId = btn.getAttribute("data-employee-id");
        state.workspacePeriodYearFilter = getPeriodYear(getPeriod(state.periodId));
        renderManagePeriodNav();
        markWorkspaceEntrySnapshot();
        renderManageForm();
        syncWorkspaceDirtyBaseline();
        showView("workspace");
      }
      if (act === "confirm-employee") {
        confirmEmployee();
      }
      if (act === "preview-employees-detail") {
        runAfterUnsavedWorkspaceConfirm(() => showEmployeesDetailModal());
      }
      if (act === "preview-adp-report") {
        runAfterUnsavedWorkspaceConfirm(() => showAdpReportModal());
      }
      if (act === "switch-workspace-period") {
        navigateWorkspacePeriod(btn.getAttribute("data-period-id"));
      }
      if (act === "export-csv") {
        exportAdpCsv();
      }
      if (act === "export-batch-adp") {
        runAfterUnsavedWorkspaceConfirm(() => exportBatchAdpCsv());
      }
      if (act === "show-audit-log") {
        showAuditLogModal();
      }
      if (act === "add-slot-row") {
        const dayIdx = parseInt(btn.getAttribute("data-day-index"), 10);
        if (Number.isNaN(dayIdx) || dayIdx < 0) return;
        readFormIntoDraft();
        const draft = state.workspaceDraft;
        if (!draft || !Array.isArray(draft.segments) || !draft.segments[dayIdx]) return;
        const day = normalizeDay(draft.segments[dayIdx]);
        day.slots.push({ in: "", out: "" });
        day.slotRows = Math.max(day.slotRows || 0, day.slots.length);
        draft.segments[dayIdx] = day;
        renderManageForm();
      }
      if (act === "remove-slot-row") {
        const dayIdx = parseInt(btn.getAttribute("data-day-index"), 10);
        const rowOrder = parseInt(btn.getAttribute("data-row-order"), 10);
        if (Number.isNaN(dayIdx) || dayIdx < 0) return;
        readFormIntoDraft();
        const draft = state.workspaceDraft;
        if (!draft || !Array.isArray(draft.segments) || !draft.segments[dayIdx]) return;
        const day = normalizeDay(draft.segments[dayIdx]);
        const removeIndex = !Number.isNaN(rowOrder) && rowOrder >= 0 ? rowOrder : day.slots.length - 1;
        if (day.slots.length <= 1) {
          day.slots = [{ in: "", out: "" }];
          day.slotRows = 1;
        } else {
          if (removeIndex >= 0 && removeIndex < day.slots.length) {
            day.slots.splice(removeIndex, 1);
          } else {
            day.slots.pop();
          }
          if (day.slots.length === 0) day.slots = [{ in: "", out: "" }];
          day.slotRows = Math.min(Math.max(1, (day.slotRows || day.slots.length) - 1), day.slots.length);
        }
        draft.segments[dayIdx] = day;
        renderManageForm();
      }
    });

    document.body.addEventListener("input", (e) => {
      const t = e.target;
      const isSeg = t.classList && t.classList.contains("field-seg");
      const field = t.getAttribute && t.getAttribute("data-field");

      if (isSeg && field && CLOCK_MEAL_FIELDS.has(field)) {
        readFormIntoDraft();
        const emp = getDraftAsEmployeeShape();
        if (emp) {
          simulatePayrollBackendCalculation(emp);
          writeSegmentRegInputs(emp);
        }
        syncDerived();
        return;
      }

      if (
        isSeg ||
        t.id === "field-adp-file" ||
        t.id === "field-ssn" ||
        t.id === "field-hire-date" ||
        (t.id && t.id.startsWith("adj-"))
      ) {
        syncDerived();
      }
    });

    $("#field-hire-date")?.addEventListener("change", () => {
      readFormIntoDraft();
      syncDerived();
    });

    $("#ws-employee-switch")?.addEventListener("change", (e) => {
      navigateWorkspaceEmployee(e.target.value);
    });

    $("#manage-period-nav-year")?.addEventListener("change", (e) => {
      const select = e.target;
      const year = select.value;
      const prevYear = state.workspacePeriodYearFilter || getPeriodYear(getPeriod(state.periodId));
      state.workspacePeriodYearFilter = year;
      const preferNo = getPeriod(state.periodId)?.periodNumber;
      const targetPeriodId = resolvePeriodIdForYear(year, preferNo);
      if (!targetPeriodId) {
        if (typeof showNotification === "function") showNotification(T("empty.periods"), "warning");
        state.workspacePeriodYearFilter = prevYear;
        renderManagePeriodNav();
        return;
      }
      if (targetPeriodId === state.periodId) {
        renderManagePeriodNav();
        return;
      }
      readFormIntoDraft();
      if (hasUnconfirmedWorkspaceChanges()) {
        showUnsavedConfirmDialog().then((ok) => {
          if (!ok) {
            state.workspacePeriodYearFilter = prevYear;
            renderManagePeriodNav();
            return;
          }
          discardUnsavedWorkspaceDraft();
          const currentEmp = getEmployee(state.periodId, state.employeeId);
          state.periodId = targetPeriodId;
          state.employeeId = resolveEmployeeIdForPeriod(targetPeriodId, currentEmp);
          state.workspacePeriodYearFilter = getPeriodYear(getPeriod(targetPeriodId));
          renderManagePeriodNav();
          markWorkspaceEntrySnapshot();
          renderManageForm();
          syncWorkspaceDirtyBaseline();
        });
        return;
      }
      const currentEmp = getEmployee(state.periodId, state.employeeId);
      state.periodId = targetPeriodId;
      state.employeeId = resolveEmployeeIdForPeriod(targetPeriodId, currentEmp);
      state.workspacePeriodYearFilter = getPeriodYear(getPeriod(targetPeriodId));
      renderManagePeriodNav();
      markWorkspaceEntrySnapshot();
      renderManageForm();
      syncWorkspaceDirtyBaseline();
    });

    document.body.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) return;
      if (!shouldWarnBeforeLeavingManage()) return;
      e.preventDefault();
      const targetUrl = href;
      showUnsavedConfirmDialog().then((ok) => {
        if (!ok) return;
        window.location.href = targetUrl;
      });
    });

    $("#payroll-store-filter")?.addEventListener("change", (e) => {
      const select = e.target;
      const list = state.data.employees[state.periodId] || [];
      const stores = getPayrollStoreOptions(list);
      const newValue = select.value || stores[0] || "";
      const prevValue = state.employeeStoreFilter;

      runAfterUnsavedWorkspaceConfirm(
        () => {
          state.employeeStoreFilter = newValue;
          handleEmployeeStoreFilterChange();
        },
        () => {
          select.value = prevValue || stores[0] || "";
        }
      );
    });

    $("#period-year-filter")?.addEventListener("change", (e) => {
      state.periodYearFilter = e.target.value || "";
      state.periodNumberFilter = "";
      renderPeriods();
    });

    $("#period-number-filter")?.addEventListener("change", (e) => {
      state.periodNumberFilter = e.target.value || "";
      renderPeriods();
    });

    $("#period-status-filter")?.addEventListener("change", (e) => {
      state.periodStatusFilter = e.target.value || "";
      renderPeriods();
    });

    $("#btn-print-detail")?.addEventListener("click", () => {
      syncDerived();
      window.print();
    });

    $("#btn-show-audit-log")?.addEventListener("click", () => showAuditLogModal());
    $("#btn-audit-log-close")?.addEventListener("click", () => hideAuditLogModal());
    $("#btn-audit-log-ok")?.addEventListener("click", () => hideAuditLogModal());
    $("#btn-employees-detail-modal-close")?.addEventListener("click", () => hideEmployeesDetailModal());
    $("#btn-employees-detail-export-toggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof toggleEmployeesDetailExportMenu === "function") toggleEmployeesDetailExportMenu();
    });
    $("#employeesDetailExportMenu")?.querySelectorAll(".export-menu-item[data-export-type]").forEach((item) => {
      item.addEventListener("click", () => {
        syncDerived();
        const type = item.getAttribute("data-export-type");
        if (type === "email") {
          if (typeof openPayrollDetailEmailModal === "function") openPayrollDetailEmailModal();
        } else if (typeof exportPayrollDetailAs === "function") {
          exportPayrollDetailAs(type);
        }
      });
    });
    $("#btn-employees-detail-modal-ok")?.addEventListener("click", () => hideEmployeesDetailModal());
    $("#btn-adp-report-modal-close")?.addEventListener("click", () => hideAdpReportModal());
    $("#btn-adp-report-modal-ok")?.addEventListener("click", () => hideAdpReportModal());
  }

  function refreshPayrollLocale() {
    renderPeriods();
    renderEmployees();
    if (state.view === "workspace" && state.periodId && state.employeeId) {
      renderManageForm();
      syncDerived();
      renderManagePeriodNav();
    }
    showView(state.view);
    const auditModal = $("#payrollAuditLogModal");
    if (auditModal && auditModal.classList.contains("show")) {
      const localItems = Array.isArray(state.data.auditLog) ? state.data.auditLog.slice(0, 50) : [];
      renderAuditLogRows(localItems);
    }
  }

  function finishBootstrap() {
    applyAdpMappingToData(state.data);
    if (typeof initPayrollI18n === "function") {
      initPayrollI18n(refreshPayrollLocale);
    }
    if (typeof registerPayrollDetailExportCollector === "function") {
      registerPayrollDetailExportCollector(() => {
        readFormIntoDraft();
        return buildDetailExportPayload(getEmployee(state.periodId, state.employeeId), getPeriod(state.periodId));
      });
    }
    if (typeof registerPayrollDetailPrintDocumentBuilder === "function") {
      registerPayrollDetailPrintDocumentBuilder(buildPayrollDetailPrintDocumentHtml);
    }
    window.onPayrollDetailExported = function (type, data) {
      const actionMap = {
        pdf: "export_detail_pdf",
        csv: "export_detail_csv",
        email: "export_detail_email",
      };
      appendAudit(actionMap[type] || "export_detail", {
        employeeName: data && data.employeeName,
        format: type,
      });
      saveState();
    };
    renderPeriods();
    renderEmployees();
    bindFieldHelp();
    bind();
    initDisclaimerModal();
    if (!enterManagePayrollWorkspace()) {
      state.view = "periods";
      state.periodId = null;
      state.employeeId = null;
      showView("periods");
    }
  }

  function bootstrapApp() {
    if (typeof PayrollApiClient === "undefined") {
      loadState();
      finishBootstrap();
      return;
    }
    PayrollApiClient.loadSnapshot()
      .then((result) => {
        if (result && result.snapshot) {
          applySnapshot(result.snapshot);
        } else {
          loadState();
          PayrollApiClient.saveSnapshot(buildSnapshot()).catch(() => {});
        }
        finishBootstrap();
      })
      .catch(() => {
        loadState();
        finishBootstrap();
      });
  }

  bootstrapApp();
})();
