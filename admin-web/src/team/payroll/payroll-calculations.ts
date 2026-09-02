import type { PayrollEmployee, PayrollPeriod, PayrollSegment } from "./payroll-types";

export interface PayrollTotals {
  regularHours: number;
  paidBreakHours: number;
  overtimeHours: number;
  overtime2Hours: number;
  totalHours: number;
  regularSalary: number;
  paidBreakSalary: number;
  overtimeSalary: number;
  overtime2Salary: number;
  totalSalary: number;
}

export interface PayrollWeek {
  index: number;
  startDate: string;
  endDate: string;
  segments: PayrollSegment[];
  totals: PayrollTotals;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function breakHours(value: unknown): number {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  if (text.includes(":")) {
    const [hours, minutes] = text.split(":");
    return roundMoney(numberValue(hours) + numberValue(minutes) / 60);
  }
  return roundMoney(numberValue(text) / 60);
}

export function calculatePayrollTotals(employee: PayrollEmployee): PayrollTotals {
  let regularHours = 0;
  let paidBreakHours = 0;
  let overtimeHours = 0;
  let overtime2Hours = 0;
  let regularSalary = 0;
  let paidBreakSalary = 0;
  let overtimeSalary = 0;
  let overtime2Salary = 0;

  for (const segment of employee.segments ?? []) {
    const regular = numberValue(segment.reg ?? segment.regular);
    const overtime = numberValue(segment.ot);
    const overtime2 = numberValue(segment.ot2);
    const paidBreak = breakHours(segment.paidMealBreak);
    const rate = numberValue(segment.rate ?? employee.rate ?? employee.hourlyRate);
    const overtimeRate = numberValue(segment.otRate ?? employee.otRate) || rate * 1.5;
    const overtime2Rate = numberValue(segment.ot2Rate ?? employee.ot2Rate) || rate * 2;
    regularHours += regular;
    paidBreakHours += paidBreak;
    overtimeHours += overtime;
    overtime2Hours += overtime2;
    regularSalary += regular * rate;
    paidBreakSalary += paidBreak * rate;
    overtimeSalary += overtime * overtimeRate;
    overtime2Salary += overtime2 * overtime2Rate;
  }

  const totalHours = regularHours + paidBreakHours + overtimeHours + overtime2Hours;
  const totalSalary = regularSalary + paidBreakSalary + overtimeSalary + overtime2Salary;
  return {
    regularHours: roundMoney(regularHours),
    paidBreakHours: roundMoney(paidBreakHours),
    overtimeHours: roundMoney(overtimeHours),
    overtime2Hours: roundMoney(overtime2Hours),
    totalHours: roundMoney(totalHours),
    regularSalary: roundMoney(regularSalary),
    paidBreakSalary: roundMoney(paidBreakSalary),
    overtimeSalary: roundMoney(overtimeSalary),
    overtime2Salary: roundMoney(overtime2Salary),
    totalSalary: roundMoney(totalSalary),
  };
}

function parseDate(value: unknown): Date | null {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
}

function formatDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function groupAttendanceByWeek(period: PayrollPeriod, employee: PayrollEmployee): PayrollWeek[] {
  const start = parseDate(period.startDate ?? String(period.rangeLabel ?? "").split("-")[0]?.trim());
  const groups = new Map<number, PayrollSegment[]>();
  for (const segment of employee.segments ?? []) {
    const date = parseDate(segment.date);
    const index = start && date ? Math.max(0, Math.floor((date.getTime() - start.getTime()) / 86_400_000 / 7)) : 0;
    const bucket = groups.get(index) ?? [];
    bucket.push(segment);
    groups.set(index, bucket);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => left - right)
    .map(([index, segments]) => {
      const weekStart = start ? addDays(start, index * 7) : parseDate(segments[0]?.date) ?? new Date(0);
      const totals = calculatePayrollTotals({ ...employee, segments });
      return {
        index,
        startDate: formatDate(weekStart),
        endDate: formatDate(addDays(weekStart, 6)),
        segments,
        totals,
      };
    });
}

