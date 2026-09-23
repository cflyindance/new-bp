export type IsoDate = string;
export type PayrollFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'custom';
export type PlannedPayDatePolicy =
  | {kind:'daysAfterEnd';days:number}
  | {kind:'weekdayAfterEnd';weekday:number}
  | {kind:'semiMonthlyFixed';firstHalfDay:number;secondHalfNextMonthDay:number}
  | {kind:'monthlyFixed';nextMonthDay:number};
export interface PayrollScheduleRule {
  id:string; storeId:string; version:number; effectiveFrom:IsoDate;
  frequency:PayrollFrequency; customDays?:number; anchorDate?:IsoDate;
  plannedPayDatePolicy?:PlannedPayDatePolicy;
  timezone:string; status:'pending'|'active'|'expired'|'withdrawn';
}
export interface ScheduledPeriod {
  id?:string;storeId:string;ruleVersionId:string;startDate:IsoDate;endDate:IsoDate;
  plannedPayDate?:IsoDate;periodYear?:number;periodNumber?:number;
  numberingBasis?:'legacy'|'period-end';status:'draft';
}
