import fs from "node:fs";

const main = fs.readFileSync("src/main.ts", "utf8");
const failures = [];
const requireText = (text, label) => {
  if (!main.includes(text)) failures.push(`missing ${label}: ${text}`);
};
const forbidText = (text, label) => {
  if (main.includes(text)) failures.push(`unexpected ${label}: ${text}`);
};

requireText('import { mountPayrollPage', "native Payroll import");
requireText('data-team-payroll-root', "native Payroll root");
requireText('mountPayrollPage(payrollRoot, createPayrollPageContext())', "native Payroll mount");
requireText('isTeamPayrollReportPath', "non-iframe route predicate");
forbidText('TEAM_PAYROLL_REPORT_IFRAME_SRC', "Payroll iframe URL");
forbidText('renderTeamPayrollReportIframePanel', "Payroll iframe renderer");

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("Team Payroll native route verification passed.");
