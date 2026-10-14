/** Shared real tab IDs; these are views of /team/clock-in, not new URL routes. */
export const TEAM_CLOCK_IN_TABS = [
  {key:'live',label:'打卡管理'},
  {key:'records',label:'考勤记录'},
  {key:'rules',label:'规则设置'},
] as const;
export type ClockTab = typeof TEAM_CLOCK_IN_TABS[number]['key'];
export const TEAM_CLOCK_IN_SETTING_SEQS = [72,73,71,67,68,69,241,70] as const;
export const TEAM_CLOCK_IN_SETTING_GROUPS = [
  {key:'clock-hours',title:'开收工与工时',seqs:[72,73,71,67,241]},
  {key:'logout-gates',title:'登出门禁',seqs:[68,69]},
  {key:'punch-receipt',title:'打卡凭证',seqs:[70]},
] as const;
