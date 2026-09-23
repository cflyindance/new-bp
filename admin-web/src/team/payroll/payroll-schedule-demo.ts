import type { PayrollData, PayrollEmployee, PayrollPeriod, PayrollSegment } from './payroll-types';

export type PayrollDemoScenario = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'custom' | 'switch' | 'transition';
const date = (value: string) => new Date(`${value}T12:00:00Z`);
const iso = (value: Date) => value.toISOString().slice(0, 10);
export function addScheduleDays(value: string, count: number): string {
  const result = date(value); result.setUTCDate(result.getUTCDate() + count); return iso(result);
}
const distance = (a: string, b: string) => Math.round((date(b).getTime() - date(a).getTime()) / 86400000);
const mdy = (s: string) => `${s.slice(5, 7)}/${s.slice(8, 10)}/${s.slice(0, 4)}`;
export const payrollFrequencyLabels: Record<string, string> = { weekly: '单周', biweekly: '双周', semimonthly: '半月', monthly: '一月', custom: '自定义 10 天' };

export function generateDemoPeriods(scenario: PayrollDemoScenario, year: number): PayrollPeriod[] {
  const result: PayrollPeriod[] = [];
  for (let start = `${year - 1}-12-01`; start <= `${year}-12-31`;) {
    const frequency = scenario === 'switch' ? (start < '2027-07-01' ? 'biweekly' : 'semimonthly')
      : scenario === 'transition' ? (start < '2027-09-01' ? 'biweekly' : 'custom') : scenario;
    let end: string;
    const d = date(start);
    if (frequency === 'monthly' || frequency === 'semimonthly') {
      end = frequency === 'semimonthly' && d.getUTCDate() <= 15 ? `${start.slice(0, 8)}15`
        : iso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)));
    } else {
      const length = frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 10;
      const anchor = frequency === 'custom' ? (scenario === 'transition' ? '2027-09-05' : '2027-01-01') : '2025-12-21';
      end = addScheduleDays(start, length - ((distance(anchor, start) % length + length) % length) - 1);
    }
    let transition = false;
    const cut = scenario === 'switch' ? '2027-07-01' : scenario === 'transition' ? '2027-09-01' : null;
    if (cut && start < cut && end >= cut) { end = addScheduleDays(cut, -1); transition = true; }
    if (scenario === 'transition' && start === '2027-09-01') { end = '2027-09-04'; transition = true; }
    if (Number(end.slice(0, 4)) === year) result.push({
      id: `demo:${scenario}:${start}`, year, periodNumber: result.length + 1,
      startDate: start, endDate: end, frequency, transition, demo: true, workweekStartDay: 0,
      rangeLabel: `${mdy(start)} – ${mdy(end)}`, paycheckDate: mdy(addScheduleDays(end, 6)), status: 'draft',
    });
    start = addScheduleDays(end, 1);
  }
  return result;
}

function demoEmployee(period: PayrollPeriod, store: string, index: number): PayrollEmployee {
  const start = period.startDate!, end = period.endDate!, rate = index === 0 ? 20 : 18;
  const segments: PayrollSegment[] = [];
  // Complete-week classification is fixture data, never a replacement for the real payroll engine.
  for (let day = start; day <= end; day = addScheduleDays(day, 1)) {
    const weekday = date(day).getUTCDay();
    const hours = index === 2 || weekday === 0 ? 0 : index === 1 ? (weekday === 6 ? 0 : 6) : weekday === 6 ? 4 : 8.5;
    const preceding = index === 0 ? Math.max(0, weekday - 1) * 8.5 : Math.max(0, weekday - 1) * 6;
    const reg = Math.min(hours, Math.max(0, 40 - preceding));
    if (index !== 2) segments.push({ date: mdy(day), reg, ot: hours - reg, ot2: 0, rate, otRate: rate * 1.5, ot2Rate: rate * 2,
      paidMealBreak: '', unpaidMealBreak: hours > 4 ? '0:30' : '',
      slots: [{ in: hours ? '09:00' : '', out: hours === 8.5 ? '18:00' : hours === 6 ? '15:30' : hours ? '13:00' : '' }],
    });
  }
  return { id: `demo-employee-${index}`, name: ['示例员工 王', '示例员工 陈', '示例员工 李'][index], role: 'Server', store,
    adpFile: `DEMO-${index + 1}`, ssn: '', hireDate: '01/01/2025', rate, otRate: rate * 1.5, ot2Rate: rate * 2,
    confirmed: false, segments, adjustments: { tips: index === 2 ? 15 : segments.filter(s => Number(s.reg) + Number(s.ot) > 0).length * 12 },
  };
}

export function createPayrollScheduleDemo(scenario: PayrollDemoScenario, store: string): PayrollData {
  if (!['weekly', 'biweekly', 'semimonthly', 'monthly', 'custom', 'switch', 'transition'].includes(scenario)) throw new Error('Unknown payroll scenario');
  const periods = [2026, 2027, 2028].flatMap(year => generateDemoPeriods(scenario, year));
  return { periods, employees: Object.fromEntries(periods.map(p => [p.id, [0, 1, 2].map(i => demoEmployee(p, store, i))])), auditLog: [], demo: true };
}
