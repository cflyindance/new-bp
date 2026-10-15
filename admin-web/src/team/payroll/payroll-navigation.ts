export type PayrollView = 'report' | 'schedule' | 'declarations';
export const PAYROLL_REPORT_PATH = '/team/payroll-report';
export function payrollViewFromPath(path: string): PayrollView {
  const normalized = path.replace(/^#/, '').split('?')[0].replace(/\/$/, '');
  if (normalized === `${PAYROLL_REPORT_PATH}/schedule-settings`) return 'schedule';
  if (normalized === `${PAYROLL_REPORT_PATH}/declaration-settings`) return 'declarations';
  return 'report';
}
