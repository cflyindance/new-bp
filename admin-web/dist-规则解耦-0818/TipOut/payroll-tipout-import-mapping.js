/**
 * TipOut → Payroll 导入列映射（P0）
 * 支持两种 CSV：
 * 1) tipout_native — TipOut 小费分配导出（export.js 格式，按员工汇总 Tips After）
 * 2) payroll_aggregate — 每期一行：employee_name, tips, service_charge, adp_file
 */
(function (global) {
  "use strict";

  var PAYROLL_TIPOUT_IMPORT = {
    version: "p0-v1",
    formats: {
      tipout_native: {
        id: "tipout_native",
        label: "TipOut 小费分配导出",
        detect: function (headerLine) {
          var h = headerLine.toLowerCase();
          return h.indexOf("employee") >= 0 && h.indexOf("tips after") >= 0;
        },
        columns: {
          name: "Employee",
          tipsAfter: "Tips After($)",
          tipsReceived: "Received($)",
          role: "Role",
        },
        aggregate: "tipsAfter",
      },
      payroll_aggregate: {
        id: "payroll_aggregate",
        label: "Payroll 汇总模板",
        detect: function (headerLine) {
          var h = headerLine.toLowerCase().replace(/\s/g, "");
          return (
            (h.indexOf("employee_name") >= 0 || h.indexOf("姓名") >= 0) &&
            (h.indexOf("tips") >= 0 || h.indexOf("小费") >= 0)
          );
        },
        columns: {
          name: ["employee_name", "name", "姓名", "Employee"],
          tips: ["tips", "tips_amount", "小费", "Tips"],
          svc: ["service_charge", "svc", "svcw", "服务费", "Service Charge"],
          adpFile: ["adp_file", "file#", "file_number", "ADP File#"],
        },
      },
    },
    templateCsv:
      "employee_name,adp_file,tips,service_charge\r\n" +
      "Maria Garcia,101,245.50,120.00\r\n" +
      "Jason Chen,102,198.25,95.50\r\n",
  };

  global.PAYROLL_TIPOUT_IMPORT = PAYROLL_TIPOUT_IMPORT;
})(typeof window !== "undefined" ? window : globalThis);
