/** California standard nonexempt workdays; input is already split at the employer's workday boundary. */
export type CaHourKind = 'regular' | 'daily' | 'daily-double' | 'weekly' | 'seventh-day';
export interface CaWorkday {
  date: string;
  workedMinutes: number;
  /** Regular rate verified by payroll, not inferred from base wage. */
  regularRate: number;
}
export interface CaOvertimeInput {
  jurisdiction: 'US-CA';
  eligibility: 'standard-nonexempt' | 'exempt' | 'unknown' | 'alternative-workweek';
  workWeekStartDay: number;
  workdayBoundaryVerified: boolean;
  periodStart: string;
  periodEnd: string;
  /** Every date in affected workweeks, including explicit zero-work days. */
  days: CaWorkday[];
}
export interface CaPaySlice {
  date: string;
  weekStart: string;
  kind: CaHourKind;
  fromMinute: number;
  toMinute: number;
  minutes: number;
  multiplier: 1 | 1.5 | 2;
  regularRate: number;
  amount: number;
  evidence: string;
}
export type CaOvertimeResult =
  | { status: 'blocked'; reason: string; slices: []; totalHours: null; totalAmount: null }
  | { status: 'ready'; slices: CaPaySlice[]; totalHours: number; totalAmount: number };
const DAY = 86400000;
function dateNumber(text: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return NaN;
  const n = Date.parse(text + 'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === text ? n : NaN;
}
function iso(n: number): string { return new Date(n).toISOString().slice(0, 10); }
function rounded(n: number): number { return Math.round((n + Number.EPSILON) * 100) / 100; }
function blocked(reason: string): CaOvertimeResult { return { status: 'blocked', reason, slices: [], totalHours: null, totalAmount: null }; }

export function calculateCaliforniaOvertime(input: CaOvertimeInput): CaOvertimeResult {
  if (input.jurisdiction !== 'US-CA' || input.eligibility !== 'standard-nonexempt') return blocked('需要核实加州标准非豁免员工适用资格；特殊工时制不可套用标准算法。');
  if (!input.workdayBoundaryVerified) return blocked('需要按雇主固定工作日边界拆分考勤。');
  if (!Number.isInteger(input.workWeekStartDay) || input.workWeekStartDay < 0 || input.workWeekStartDay > 6) return blocked('工作周起点无效。');
  const start = dateNumber(input.periodStart), end = dateNumber(input.periodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 366 * DAY) return blocked('薪资周期日期无效。');
  const weekStart = (n: number) => n - ((new Date(n).getUTCDay() - input.workWeekStartDay + 7) % 7) * DAY;
  const firstWeek = weekStart(start), lastWeek = weekStart(end);
  const byDate = new Map<string, CaWorkday>();
  for (const d of input.days) {
    if (!Number.isFinite(dateNumber(d.date)) || byDate.has(d.date)) return blocked('考勤日期无效或重复，需先合并同工作日记录。');
    if (!Number.isInteger(d.workedMinutes) || d.workedMinutes < 0 || d.workedMinutes > 1440) return blocked('工作分钟数无效。');
    if (d.workedMinutes > 0 && (!Number.isFinite(d.regularRate) || d.regularRate <= 0)) return blocked('缺少已核实的 regular rate，不能用基础时薪猜测。');
    byDate.set(d.date, d);
  }
  for (let n = firstWeek; n <= lastWeek + 6 * DAY; n += DAY) {
    if (!byDate.has(iso(n))) return blocked(`缺少完整工作周记录：${iso(n)}；不能把未知考勤当作休息日。`);
  }
  const slices: CaPaySlice[] = [];
  for (let week = firstWeek; week <= lastWeek; week += 7 * DAY) {
    const workdays = Array.from({ length: 7 }, (_, i) => byDate.get(iso(week + i * DAY))!);
    // Contract deliberately requires a payroll-verified single regular rate for the whole workweek.
    const rates = new Set(workdays.filter(d => d.workedMinutes > 0).map(d => d.regularRate));
    if (rates.size > 1) return blocked('同一工作周的 regular rate 不一致，需先由薪资数据源核实统一计薪基数。');
    const seventh = workdays.every(d => d.workedMinutes > 0);
    let straightMinutes = 0;
    workdays.forEach((day, dayIndex) => {
      const onSeventh = seventh && dayIndex === 6;
      const cuts = [0, day.workedMinutes];
      for (const cut of [480, 720]) if (cut > 0 && cut < day.workedMinutes) cuts.push(cut);
      if (!onSeventh) {
        const remaining = 2400 - straightMinutes;
        if (remaining > 0 && remaining < Math.min(480, day.workedMinutes)) cuts.push(remaining);
      }
      cuts.sort((a,b) => a-b);
      for (let i = 0; i < cuts.length - 1; i++) {
        const from = cuts[i], to = cuts[i+1], minutes = to-from;
        if (!minutes) continue;
        let kind: CaHourKind = 'regular', multiplier: 1 | 1.5 | 2 = 1;
        let evidence = '工作日内前8小时，且未超过每周40小时普通工时。';
        if (onSeventh) {
          kind = 'seventh-day'; multiplier = from < 480 ? 1.5 : 2;
          evidence = from < 480 ? '同一工作周连续工作第7天，前8小时按1.5倍。' : '同一工作周连续工作第7天，超过8小时按2倍。';
        } else if (from >= 720) {
          kind = 'daily-double'; multiplier = 2; evidence = '单工作日超过12小时，按2倍。';
        } else if (from >= 480) {
          kind = 'daily'; multiplier = 1.5; evidence = '单工作日超过8至12小时，按1.5倍。';
        } else if (straightMinutes >= 2400) {
          kind = 'weekly'; multiplier = 1.5; evidence = '剔除已计每日加班的工时后，每周超过40小时部分按1.5倍。';
        }
        // Daily/seventh-day premium hours do not produce another weekly premium.
        if (kind === 'regular' || kind === 'weekly') straightMinutes += minutes;
        const dayN = dateNumber(day.date);
        if (dayN >= start && dayN <= end) slices.push({
          date: day.date, weekStart: iso(week), kind, fromMinute: from, toMinute: to,
          minutes, multiplier, regularRate: day.regularRate,
          amount: rounded(minutes / 60 * day.regularRate * multiplier), evidence,
        });
      }
    });
  }
  return { status: 'ready', slices, totalHours: rounded(slices.reduce((n,s) => n+s.minutes,0)/60), totalAmount: rounded(slices.reduce((n,s) => n+s.amount,0)) };
}
