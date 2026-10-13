/** Explicit controls audited against the existing screens. Not a generated CRUD template. */
export interface ActionRegistration { id: string; title: string; source: string; control: string }
type Entry = [id:string,title:string,control:string];
const from = (source:string, entries:Entry[]):ActionRegistration[] => entries.map(([id,title,control])=>({id,title,source,control}));
export const additionalPageActions:Record<string,ActionRegistration[]> = {
  '/permissions/roles':from('src/permissions/center-ui.ts',[
    ['edit-role','编辑角色','data-role-info'],['copy','复制角色','data-copy'],
  ]),
  '/permissions/staff':from('src/permissions/center-ui.ts',[
    ['invite','邀请员工','invite()'],['assign-role','分配角色','assign()'],['remove-binding','移除角色','data-remove-binding'],['personal-override','设置个人例外',"case 'exception'"],['toggle-account','启用 / 停用账号',"case 'toggle-account'"],['resend-invite','重新发送邀请',"case 'resend'"],['revoke-invite','撤销邀请',"case 'revoke'"],
  ]),
  '/team/breaks-overtime':from('src/config/team-breaks-overtime-ui.ts',[
    ['create-break','添加休息','data-custom-break-add'],['edit-break','编辑休息','data-custom-break-edit'],['delete-break','删除休息','data-custom-break-remove'],['create-overtime','新增加班规则','data-overtime-rule-add'],['edit-overtime','编辑加班规则','data-overtime-rule-edit'],['delete-overtime','删除加班规则','data-overtime-rule-remove'],
  ]),
  '/team/clock-in':from('src/config/team-clock-in-ui.ts',[
    ['adjust-clock','补卡','data-clock-adjust'],['break','记录休息','data-clock-break-confirm'],
  ]),
  '/team/shift-scheduling':from('src/config/team-shift-scheduling-ui.ts',[
    ['create-shift','新增班次','data-shift-type-add'],['edit-shift','编辑班次','data-shift-list-edit'],['delete-shift','删除班次','data-shift-list-delete'],['save-schedule','保存 / 批量保存排班','data-shift-edit-save'],['clear-schedule','清除排班','data-shift-edit-clear'],['reset-schedule','恢复默认排班','data-shift-edit-reset'],['copy-week','同步下周排班','data-shift-sync-next-week'],
  ]),
  '/team/training-performance':from('src/config/team-training-performance-ui.ts',[
    ['create-course','新增课程','data-course-add'],['edit-course','编辑课程','data-course-edit'],['publish-course','发布课程','data-course-publish'],['delete-course','删除课程','data-course-delete'],['create-review','新建评估','data-review-add'],['edit-review','编辑评估','data-review-edit'],['start-course','开始学习','data-progress-start'],['complete-course','标记完成','data-progress-complete'],
  ]),
  '/operations/queue-call/floor-plan':from('src/config/floor-plan-ui.ts',[
    ['create-area','新增区域','data-floor-plan-area-add'],['edit-area','编辑区域','data-floor-plan-area-edit'],['delete-area','删除区域','data-floor-plan-area-delete'],['create-table','新增桌台','data-floor-plan-table-add'],['edit-table','编辑桌台','data-floor-plan-dialog-save'],['delete-table','删除桌台','data-floor-plan-dialog-delete'],['layout','调整桌台布局','data-floor-plan-geometry-action'],['save-layout','保存区域布局','data-floor-plan-save-area'],
  ]),
  '/operations/queue-call/category-settings':from('src/config/foh-category-settings-ui.ts',[
    ['create-age','新增年龄分组','data-foh-category-age-add'],['edit-age','修改年龄分组','data-foh-category-age-edit'],['delete-age','删除年龄分组','data-foh-category-age-delete'],['create-category','新增品类','data-foh-category-cat-add'],['edit-category','编辑品类','data-foh-category-cat-edit'],['delete-category','删除品类','data-foh-category-cat-delete'],['edit-menu','编辑菜单配置','data-foh-menu-edit-save'],['copy-menu','复制并覆盖菜单','data-foh-menu-copy-confirm'],
  ]),
  '/operations/queue-call/classification-settings':from('src/config/foh-classification-settings-ui.ts',[
    ['create','新增分类','data-cls-create'],['edit','编辑分类','data-cls-edit'],['delete','删除分类','data-cls-delete'],['edit-menu','编辑菜单配置','data-cls-menu-edit-save'],
  ]),
  '/notifications/templates':from('src/config/notifications-hub-pages.ts',[
    ['create','新增模板','data-template-add'],['edit','编辑模板','data-template-edit'],['toggle','启用 / 禁用模板','data-template-toggle-status'],
  ]),
  '/notifications/scene-config':from('src/config/notifications-hub-pages.ts',[
    ['select-template','修改场景模板','data-scene-template-select'],['apply-preset','使用行业方案','data-scene-industry-preset'],
  ]),
  '/finance/register-audit/payments':from('src/config/finance-register-audit-pages.ts',[
    ['create','新增付款记录','data-register-audit-add'],
  ]),
  '/finance/register-audit/cash-drawer':from('src/config/finance-register-audit-pages.ts',[
    ['create','新增钱箱记录','data-register-audit-add'],
  ]),
  '/device-management/hardware/payments':from('src/config/device-management-payment-hardware-ui.ts',[
    ['create','新增 PAX 终端','data-payment-pax-add'],['edit','编辑支付设备','data-payment-device-edit'],['delete','删除支付设备','data-payment-device-delete'],
  ]),
  '/device-management/hardware/printers':from('src/config/device-management-printer-hardware-ui.ts',[
    ['create','新增打印机','data-printer-add'],['edit','编辑打印机','data-printer-edit'],['delete','删除打印机','data-printer-delete'],
  ]),
  '/device-management/hardware/cash-drawer':from('src/config/device-management-cash-drawer-hardware-ui.ts',[
    ['create','新增钱箱','data-cash-drawer-add'],['edit','编辑钱箱','data-cash-drawer-edit'],['delete','删除钱箱','data-cash-drawer-delete'],['policy','修改钱箱策略','data-cash-drawer-policy-toggle'],
  ]),
  '/device-management/hardware/emenu':from('src/config/device-management-emenu-hardware-ui.ts',[
    ['edit','编辑 eMenu 设备','data-emenu-device-edit'],['delete','删除 eMenu 设备','data-emenu-device-delete'],['toggle','启用 / 停用 eMenu 设备','data-emenu-device-toggle'],
  ]),
  '/device-management/hardware/kiosk':from('src/config/device-management-kiosk-hardware-ui.ts',[
    ['edit','编辑 Kiosk 设备','data-kiosk-device-edit'],['delete','删除 Kiosk 设备','data-kiosk-device-delete'],
  ]),
  '/device-management/hardware/cds':from('src/config/device-management-cds-hardware-ui.ts',[
    ['edit','编辑 CDS 设备','data-cds-device-edit'],['delete','删除 CDS 设备','data-cds-device-delete'],
  ]),
  '/device-management/hardware/fiscal':from('src/config/device-management-fiscal-hardware-ui.ts',[
    ['create','新增税控机','data-fiscal-add'],['edit','编辑税控机','data-fiscal-edit'],['delete','删除税控机','data-fiscal-delete'],['toggle','启用 / 停用税控机','data-fiscal-toggle'],
  ]),
  '/device-management/hardware/caller-id':from('src/config/device-management-caller-id-hardware-ui.ts',[
    ['create','新增来电显示','data-caller-id-add'],['edit','编辑来电显示','data-caller-id-edit'],['delete','删除来电显示','data-caller-id-delete'],['toggle','启用 / 停用来电显示','data-caller-id-toggle'],
  ]),
  '/settings/platform-preset':from('src/config/platform-preset-ui.ts',[
    ['publish','发布配置预设','data-pp-publish'],
  ]),
  '/team/roles-employees':from('dist/TipOut/employees.html',[
    ['create-employee','新增员工','btn-add-employee'],['save-employee','保存员工信息','btn-submit-employee'],['delete-employee','删除员工','btn-employee-delete-confirm'],['create-role','新增岗位','btn-add-role-manage'],
  ]),
  '/team/tips/rules':from('dist/TipOut/rules.html',[
    ['create','新建分配规则','openAddRuleModal()'],['edit','编辑分配规则','rule-add.html?mode=edit'],['copy','复制分配规则','copyRule(this)'],['delete','删除分配规则','deleteRule(this)'],
  ]),
  '/asset-center/materials':from('dist/Configuration center/material.html',[
    ['upload','添加图片','btnAddImage'],['create-category','新建分类','btnNewCategory'],['rename','重命名素材','modalConfirmRename'],['move','移动素材','modalConfirmMove'],['crop','裁剪图片','modalCropConfirm'],
  ]),
  '/operations/queue-call/menu-order-limits':from('dist/Configuration center/order-limit.html',[
    ['create','新增下单限制规则','btnOpenCreate'],['edit-dimensions','编辑人数 / 轮次区间','data-dim-edit-save'],['copy-quantities','复制并覆盖数量配置','data-qty-copy-apply'],
  ]),
  '/operations/queue-call/buffet-rules':from('dist/Configuration center/buffet-rule.html',[
    ['create','新增自助餐规则','createRule'],['edit','编辑自助餐规则','data-edit'],['copy','复制自助餐规则','data-copy'],['toggle','启用 / 禁用自助餐规则','data-toggle'],['delete','删除自助餐规则','data-delete'],
  ]),
};
