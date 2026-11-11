export interface ContinuousRuleCandidate {
  id: string;
  scope: string;
  dayNumber?: number;
  hoursBeforeOvertime: number;
  secondaryHoursBeforeOvertime?: number;
  wageMultiplier: number;
  secondaryWageMultiplier?: number;
}
export function validateContinuousRule(rule: ContinuousRuleCandidate): string | null {
  if (rule.scope !== 'continuous') return null;
  if (!Number.isInteger(rule.dayNumber) || Number(rule.dayNumber) < 1 || Number(rule.dayNumber) > 365) return '连续工作天数需为1至365的整数。';
  if (!Number.isFinite(rule.hoursBeforeOvertime) || rule.hoursBeforeOvertime <= 0) return '第一档累计工时必须大于0。';
  if (!Number.isFinite(rule.secondaryHoursBeforeOvertime) || Number(rule.secondaryHoursBeforeOvertime) <= rule.hoursBeforeOvertime) return '第二档累计工时必须大于第一档。';
  if (!Number.isFinite(rule.wageMultiplier) || rule.wageMultiplier < 1 || !Number.isFinite(rule.secondaryWageMultiplier) || Number(rule.secondaryWageMultiplier) < rule.wageMultiplier) return '两档倍率不得小于1，第二档倍率不得小于第一档。';
  return null;
}
/** No read-time migration. Caller must explicitly save the reviewed candidate. */
export function prepareContinuousMigration<T extends ContinuousRuleCandidate>(
  source: T, candidate: T, reviewed: boolean, newId: string,
): { candidate: T; archived: T } {
  if (!reviewed) throw new Error('请重新确认连勤天数、累计工时区间和两档倍率。');
  if (source.scope !== 'nth-day' && source.scope !== 'seventh-day') throw new Error('仅旧第N天规则可执行此迁移。');
  if (candidate.scope !== 'continuous' || !newId || newId === source.id) throw new Error('迁移必须创建独立的新版本。');
  const error=validateContinuousRule(candidate);if(error)throw new Error(error);
  return { candidate: structuredClone({...candidate,id:newId}), archived:structuredClone(source) };
}
