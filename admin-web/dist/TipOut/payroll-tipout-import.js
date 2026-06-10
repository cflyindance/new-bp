/**
 * TipOut CSV → Manage Payroll SVC/Tips 导入
 */
(function (global) {
  "use strict";

  function normalizeName(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function parseCsvLine(line) {
    var out = [];
    var cur = "";
    var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQ = false;
        } else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  }

  function parseCsv(text) {
    var lines = String(text || "")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map(function (l) {
        return l.trim();
      })
      .filter(function (l) {
        return l.length > 0;
      });
    return lines;
  }

  function findHeaderIndex(lines, mapping) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (mapping.detect(line)) return i;
      if (line.indexOf(",") >= 0 && !/^"?(tip distribution|store|date range)/i.test(line)) {
        var cols = parseCsvLine(line.replace(/^"/, "").replace(/"$/, ""));
        if (cols.length >= 3) return i;
      }
    }
    return -1;
  }

  function colIndex(headers, names) {
    var list = Array.isArray(names) ? names : [names];
    var lower = headers.map(function (h) {
      return String(h).trim().toLowerCase();
    });
    for (var n = 0; n < list.length; n++) {
      var key = String(list[n]).toLowerCase();
      var idx = lower.indexOf(key);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function parseTipOutNative(lines, headerIdx, mapping) {
    var headerLine = lines[headerIdx];
    var headers = parseCsvLine(headerLine);
    var cfg = mapping.columns;
    var iName = colIndex(headers, cfg.name);
    var iAfter = colIndex(headers, [cfg.tipsAfter, "Tips After", "tips after($)"]);
    var iRecv = colIndex(headers, [cfg.tipsReceived, "Received($)"]);
    if (iName < 0) throw new Error("无法识别 Employee 列");

    var byName = Object.create(null);
    for (var i = headerIdx + 1; i < lines.length; i++) {
      var row = parseCsvLine(lines[i]);
      if (!row.length || row.length <= iName) continue;
      var name = String(row[iName] || "").replace(/^"|"$/g, "").trim();
      if (!name || /subtotal/i.test(name) || /grand total/i.test(name)) continue;
      if (name.indexOf("(Subtotal)") >= 0) {
        name = name.replace(/\s*\(Subtotal\)\s*/i, "").trim();
      }
      var tips = 0;
      if (iAfter >= 0 && row[iAfter] != null && row[iAfter] !== "") {
        tips = parseFloat(String(row[iAfter]).replace(/[$,]/g, "")) || 0;
      } else if (iRecv >= 0) {
        tips = parseFloat(String(row[iRecv]).replace(/[$,]/g, "")) || 0;
      }
      if (!byName[name]) byName[name] = { name: name, tips: 0, svc: 0, adpFile: "" };
      byName[name].tips += tips;
    }
    return Object.keys(byName).map(function (k) {
      return byName[k];
    });
  }

  function parseAggregate(lines, headerIdx, mapping) {
    var headers = parseCsvLine(lines[headerIdx]);
    var cfg = mapping.columns;
    var iName = colIndex(headers, cfg.name);
    var iTips = colIndex(headers, cfg.tips);
    var iSvc = colIndex(headers, cfg.svc);
    var iFile = colIndex(headers, cfg.adpFile);
    if (iName < 0 || iTips < 0) throw new Error("无法识别 employee_name / tips 列");

    var rows = [];
    for (var i = headerIdx + 1; i < lines.length; i++) {
      var row = parseCsvLine(lines[i]);
      if (!row.length) continue;
      var name = String(row[iName] || "").trim();
      if (!name) continue;
      rows.push({
        name: name,
        tips: parseFloat(String(row[iTips]).replace(/[$,]/g, "")) || 0,
        svc: iSvc >= 0 ? parseFloat(String(row[iSvc]).replace(/[$,]/g, "")) || 0 : 0,
        adpFile: iFile >= 0 ? String(row[iFile] || "").trim() : "",
      });
    }
    return rows;
  }

  function detectFormat(lines) {
    var cfg = global.PAYROLL_TIPOUT_IMPORT;
    if (!cfg) return null;
    var sample = lines.slice(0, 12).join("\n");
    if (cfg.formats.payroll_aggregate.detect(sample)) return cfg.formats.payroll_aggregate;
    if (cfg.formats.tipout_native.detect(sample)) return cfg.formats.tipout_native;
    for (var i = 0; i < Math.min(lines.length, 20); i++) {
      if (cfg.formats.tipout_native.detect(lines[i])) return cfg.formats.tipout_native;
      if (cfg.formats.payroll_aggregate.detect(lines[i])) return cfg.formats.payroll_aggregate;
    }
    return null;
  }

  function parseTipOutCsv(text) {
    var lines = parseCsv(text);
    if (lines.length < 2) throw new Error("CSV 为空或行数不足");
    var format = detectFormat(lines);
    if (!format) throw new Error("无法识别 CSV 格式，请使用 TipOut 导出或汇总模板");
    var headerIdx = findHeaderIndex(lines, format);
    if (headerIdx < 0) throw new Error("未找到表头行");
    if (format.id === "tipout_native") return { format: format, rows: parseTipOutNative(lines, headerIdx, format) };
    return { format: format, rows: parseAggregate(lines, headerIdx, format) };
  }

  function matchEmployee(empList, importRow) {
    var key = normalizeName(importRow.name);
    if (importRow.adpFile) {
      var byFile = empList.find(function (e) {
        return e && String(e.adpFile || "").trim() === String(importRow.adpFile).trim();
      });
      if (byFile) return byFile;
    }
    return empList.find(function (e) {
      return e && normalizeName(e.name) === key;
    });
  }

  function buildImportPlan(empList, parsed) {
    var plan = [];
    var unmatched = [];
    parsed.rows.forEach(function (row) {
      var emp = matchEmployee(empList, row);
      if (!emp) {
        unmatched.push(row.name);
        return;
      }
      plan.push({
        employeeId: emp.id,
        employeeName: emp.name,
        before: {
          tips: emp.adjustments && emp.adjustments.tips != null ? emp.adjustments.tips : 0,
          svcw: emp.adjustments && emp.adjustments.svcw != null ? emp.adjustments.svcw : 0,
        },
        after: {
          tips: row.tips,
          svcw: row.svc != null && row.svc > 0 ? row.svc : emp.adjustments ? emp.adjustments.svcw : 0,
        },
      });
    });
    return { plan: plan, unmatched: unmatched, formatId: parsed.format.id };
  }

  function applyImportPlan(empList, plan) {
    plan.forEach(function (item) {
      var emp = empList.find(function (e) {
        return e && e.id === item.employeeId;
      });
      if (!emp) return;
      if (!emp.adjustments) emp.adjustments = {};
      emp.adjustments.tips = item.after.tips;
      if (item.after.svcw != null) emp.adjustments.svcw = item.after.svcw;
      emp.tipoutImportedAt = new Date().toISOString();
    });
  }

  function downloadTemplate() {
    var cfg = global.PAYROLL_TIPOUT_IMPORT;
    var csv = (cfg && cfg.templateCsv) || "employee_name,tips,service_charge\n";
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "payroll-tipout-import-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  global.PayrollTipOutImport = {
    parseTipOutCsv: parseTipOutCsv,
    buildImportPlan: buildImportPlan,
    applyImportPlan: applyImportPlan,
    downloadTemplate: downloadTemplate,
  };
})(typeof window !== "undefined" ? window : globalThis);
