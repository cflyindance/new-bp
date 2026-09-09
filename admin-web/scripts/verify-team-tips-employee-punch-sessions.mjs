import fs from "node:fs";
import vm from "node:vm";

const attendanceCode = fs.readFileSync("src/team/tips/legacy/attendanceMock.js.txt", "utf8");
const detailTemplate = fs.readFileSync("src/team/tips/templates/employee-reconciliation.html", "utf8");
const detailProgram = fs.readFileSync("src/team/tips/programs/employee-reconciliation.js.txt", "utf8");
const distributionProgram = fs.readFileSync("src/team/tips/programs/distribution.js.txt", "utf8");
const summaryUi = fs.readFileSync("src/team/tips/legacy/tipout-summary-ui.js.txt", "utf8");
const failures = [];
const sandbox = {};
vm.runInNewContext(attendanceCode, sandbox);
const attendance = sandbox.TipOutAttendance;

if (!attendance || typeof attendance.summarizeDayAttendance !== "function") {
  failures.push("attendance presentation helper missing");
} else {
  const multi = attendance.summarizeDayAttendance({ punchSessions: [
    { clockIn: "17:01", clockOut: "21:13", durationHours: 4.2, status: "complete" },
    { clockIn: "09:02", clockOut: "14:10", durationHours: 5.13, status: "complete" }
  ] });
  if (multi.status !== "已打卡" || multi.shifts !== 2 || multi.hours !== 9.33) failures.push("multi-session totals incorrect");
  if (multi.clockIns.join(",") !== "09:02,17:01" || multi.clockOuts.join(",") !== "14:10,21:13") failures.push("sessions not stably sorted and paired");

  const mixed = attendance.summarizeDayAttendance({ punchSessions: [
    { clockIn: "09:00", clockOut: "13:00", durationHours: 4, status: "complete" },
    { clockIn: "17:00", clockOut: null, durationHours: null, status: "missing-clock-out" }
  ] });
  if (mixed.status !== "打卡异常" || mixed.shifts !== 1 || mixed.hours !== 4) failures.push("invalid session must not affect totals");
  if (mixed.clockOuts.join(",") !== "13:00,—") failures.push("missing clock-out placeholder incorrect");

  const invalid = attendance.summarizeDayAttendance({ punchSessions: [
    { clockIn: null, clockOut: "12:00", durationHours: -1, status: "complete" }
  ] });
  if (invalid.status !== "打卡异常" || invalid.shifts !== 0 || invalid.hours !== 0) failures.push("malformed session must be abnormal");

  const legacy = attendance.summarizeDayAttendance({ clockStatus: "已打卡", hours: 8 });
  if (legacy.status !== "已打卡" || legacy.shifts !== 1 || legacy.clockIns[0] !== "—" || legacy.clockOuts[0] !== "—") failures.push("legacy fallback fabricated or lost data");

  const manual = attendance.summarizeDayAttendance({ manualHourEntries: [
    { poolId: "front", poolName: "前厅小费池", ruleId: "r1", ruleName: "前厅按工时分配", hours: 6 }
  ] });
  if (manual.status !== "手动工时" || manual.shifts !== 0 || manual.hourLines[0].hours !== 6) failures.push("manual-only status incorrect");

  const unclocked = attendance.summarizeDayAttendance({ clockStatus: "未打卡", hours: 0 });
  if (unclocked.hourLines[0].label !== "手动录入工时" || unclocked.hourLines[0].hours !== 0) failures.push("unclocked manual-hours default missing");

  const mixedHours = attendance.summarizeDayAttendance({ punchSessions: [
    { clockIn: "09:00", clockOut: "17:00", durationHours: 8, status: "complete" }
  ], manualHourEntries: [{ poolId: "front", poolName: "前厅小费池", ruleId: "r1", ruleName: "前厅按工时分配", hours: 6 }] });
  if (mixedHours.status !== "混合工时" || mixedHours.hourLines.length !== 2 || mixedHours.hasPunchException) failures.push("mixed source status incorrect");

  const mixedAbnormal = attendance.summarizeDayAttendance({ punchSessions: [
    { clockIn: "09:00", clockOut: null, durationHours: null, status: "missing-clock-out" }
  ], manualHourEntries: [{ poolId: "front", poolName: "前厅小费池", ruleId: "r1", ruleName: "规则", hours: 6 }] });
  if (mixedAbnormal.status !== "混合工时" || !mixedAbnormal.hasPunchException) failures.push("mixed abnormal marker missing");
}

if (!detailTemplate.includes('<option value="打卡异常">打卡异常</option>')) failures.push("abnormal attendance filter missing");
if (!detailTemplate.includes("<th>上班时间</th><th>下班时间</th>")) failures.push("punch time columns missing");
if (!detailProgram.includes("summarizeDayAttendance")) failures.push("detail page does not use shared attendance presentation");
if (!detailProgram.includes("clockIns.join('\\n')")) failures.push("detail export does not preserve multiline clock-ins");
if (!distributionProgram.includes("punchSessions")) failures.push("daily result does not carry punch sessions");
if (!summaryUi.includes("punchSessions.map")) failures.push("snapshot does not clone nested punch sessions");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Employee reconciliation punch-session verification passed.");
