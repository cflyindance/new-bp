/** Shared real merchant navigation; presentation groups are not permission gates. */
export const BREAKS_OVERTIME_NAV_GROUPS:ReadonlyArray<{label:string;items:ReadonlyArray<{key:string;title:string}>}> = [
  {label:'休息',items:[{key:'custom-breaks',title:'自定义休息'},{key:'break-rules',title:'休息规则'}]},
  {label:'加班',items:[{key:'work-week',title:'工作周设置'},{key:'overtime-rules',title:'加班规则'}]},
] as const;
