/**
 * PayRoll P0 — ADP CSV 列映射配置（客户定稿后仅改此文件）
 * @see docs/项目文档/PayRoll-P0-设计与开发规格.md §5
 */
(function (global) {
  "use strict";

  /** @type {import('./payroll-adp-mapping.types').PayrollAdpMapping} */
  const PAYROLL_ADP_MAPPING = {
    version: "koi-default-v1",
    coCode: "X0L",
    batchIdSource: "paycheckDate",
    missingFilePolicy: "block",
    declarationVersion: "demo-v1",
    declarationBodyEn:
      "I hereby certify that the above time and gratuity ${svc_amount} and tips ${tips_amount} are correct. I further certify, under penalty of perjury, that I have been provided rest breaks as required by California law and that any meal period or rest break missed was purely voluntary. (Demo text — replace with counsel-approved version ${declaration_version}.)",
    disclaimerZh:
      "本系统提供的金额为薪酬计算与报税准备结果，不构成税务或法律意见。实际预扣税、工资发放及向政府申报由您自行或委托 ADP、会计师等第三方完成。",
    disclaimerEn:
      "Amounts shown are for payroll calculation and tax preparation only, not tax or legal advice. Actual withholding, payments, and filings are your responsibility or your payroll provider's.",
    csvColumns: [
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
    ],
    buildRow(ctx) {
      const { coCode, period, employee, sums } = ctx;
      const adj = employee.adjustments || {};
      return [
        coCode,
        period.paycheckDate,
        employee.adpFile,
        employee.name,
        String(employee.rate),
        String(sums.reg),
        "OHR",
        String(sums.ot),
        "CCT",
        String(adj.tips != null ? adj.tips : 0),
        "SVC",
        String(adj.svcw != null ? adj.svcw : 0),
      ];
    },
  };

  global.PAYROLL_ADP_MAPPING = PAYROLL_ADP_MAPPING;
})(typeof window !== "undefined" ? window : globalThis);
