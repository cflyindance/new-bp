/** Shared real merchant navigation; presentation groups are not permission gates. */
export const BREAKS_OVERTIME_NAV_GROUPS: ReadonlyArray<{label: string; items: ReadonlyArray<{key: string; title: string}>}> = [
  {label: '休息与加班', items: [
    {key: 'custom-breaks', title: '自定义休息'},
    {key: 'overtime-rules', title: '加班规则'},
    {key: 'settings', title: '设置'},
  ]},
] as const;

/** Category IDs and labels are shared by merchant settings and permission editing. */
export const BREAKS_OVERTIME_SETTING_GROUPS = [
  { key: 'break-rules', title: '休息设置', fields: ['paid-break-minutes', 'convert-excess', 'block-early'] },
  { key: 'work-week', title: '工作周设置', fields: ['week-start'] },
] as const;
