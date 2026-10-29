/** M 平台自己的菜单和真实操作；不读取商家后台资源目录。 */
export type MAccess = 'hidden' | 'read' | 'edit';
export interface MAction { id: string; title: string; selector: string; write: boolean }
export interface MPage { id: string; title: string; path: string; editable: boolean; actions: MAction[] }
export interface MModule { id: string; title: string; pages: MPage[] }
const action = (id: string, title: string, selector: string, write = true): MAction => ({ id, title, selector, write });
const page = (id: string, title: string, path: string, editable = true, actions: MAction[] = []): MPage => ({ id, title, path, editable, actions });
const merchants = '/m-platform/merchants';
const permissions = '/m-platform/permissions';
export const M_MODULES: MModule[] = [
  { id: 'routing', title: '菜单路由配置', pages: [page('routing', '菜单路由配置', '/m-platform/nav-blueprint', true, [
    action('publish', '发布路由', '[data-nb-publish],[data-nb-publish-sync]'),
    action('restore', '恢复默认路由', '[data-nb-restore-custom],[data-nb-restore-system]'),
    action('sync', '同步平台预设', '[data-nb-sync-presets]'),
    action('delete', '删除一级导航', '[data-nb-delete-l1]'),
  ])] },
  { id: 'services', title: '服务包管理', pages: [page('services', '服务包管理', `${permissions}/subscription-services`, true, [
    action('create', '新增服务包', '[data-sub-open-create]'),
    action('publish', '发布服务包', '[data-sub-publish],[data-sub-confirm-publish]'),
    action('disable', '停用服务包', '[data-sub-disable-package],[data-sub-disable-form][data-kind="package"]'),
    action('rollback', '回滚服务包', '[data-sub-rollback]'),
  ]), page('subscriptions', '商家订阅', `${permissions}/merchant-subscriptions`, true, [
    action('create', '创建订阅', '[data-sub-create-subscription]'),
    action('extend', '延长订阅', '[data-sub-extend],[data-sub-extend-form]'),
    action('disable', '停用订阅', '[data-sub-disable],[data-sub-disable-form][data-kind="subscription"]'),
  ])] },
  { id: 'merchants', title: '商户管理中心', pages: [
    page('merchant-overview', '总览', `${merchants}/overview`, false),
    page('merchant-activity', '门店活跃分析', `${merchants}/activity`, false),
    page('device-activity', '设备活跃分析', `${merchants}/device-activity`, false),
    page('brands', '品牌管理', merchants, true, [
      action('impersonate', '进入商家后台', '[data-merchant-impersonate]'),
      action('lifecycle', '变更品牌状态', '[data-merchant-lifecycle]'),
      action('sync', '同步 CRM', '[data-merchant-crm-sync]'),
      action('capability-sync', '同步品牌能力', '[data-merchant-capability-sync]'),
    ]),
    page('stores', '门店管理', `${merchants}/stores`, true, [action('status', '变更门店状态', '[data-merchant-store-status]')]),
    page('org-tree', '组织树', `${merchants}/org-tree`, false),
    page('reports', '报表 / SLA', `${merchants}/reports`, false),
    page('merchant-log', '变更记录', `${merchants}/change-log`, false),
  ] },
  { id: 'hardware', title: '硬件资产中心', pages: [
    page('hardware-overview', '总览', '/m-platform/hardware/overview', false),
    page('devices', '全量设备', '/m-platform/hardware/devices', false, [action('export', '导出设备', '[data-enterprise-hw-export]', false)]),
    page('alerts', '告警', '/m-platform/hardware/alerts', false),
  ] },
  { id: 'presets', title: '平台预设', pages: [page('presets', '平台预设', '/m-platform/platform-preset', true, [
    action('publish', '发布预设', '[data-pp-publish]'),
    action('sync', '同步商家', '[data-pp-sync-merchant]'),
    action('restore', '恢复默认预设', '[data-pp-restore-defaults]'),
  ])] },
  { id: 'permissions', title: '权限管理中心', pages: [
    page('permission-overview', '权限总览', `${permissions}/overview`, false),
    page('roles', '角色与功能权限', `${permissions}/roles`, true, [
      action('create', '新建 / 复制角色', '[data-mp-do="new-role"],[data-mp-copy]'),
      action('edit', '编辑角色与权限', '[data-mp-edit],[data-mp-do="save-role"],[data-mp-do="save-grants"]'),
      action('delete', '删除角色', '[data-mp-delete]'),
    ]),
    page('staff', '员工与账号', `${permissions}/staff`, true, [
      action('assign', '分配角色', '[data-mp-assign],[data-mp-do="save-assignment"]'),
      action('account', '管理员工账号', '[data-mp-do="new-account"],[data-mp-account],[data-mp-toggle]'),
    ]),
    page('permission-log', '变更记录', `${permissions}/change-log`, false),
  ] },
];
export const mModuleKey = (id: string): string => `m:module:${id}`;
export const mPageKey = (id: string): string => `m:page:${id}`;
export const mActionKey = (pageId: string, id: string): string => `m:action:${pageId}:${id}`;
export const M_PAGES = M_MODULES.flatMap(module => module.pages.map(p => ({ ...p, moduleId: module.id })));
export const M_RESOURCES = new Map<string, { kind: 'module' | 'page' | 'action'; parent: string; editable: boolean }>(M_MODULES.flatMap(module => [
  [mModuleKey(module.id), { kind: 'module', parent: '', editable: false }] as const,
  ...module.pages.flatMap(p => [
    [mPageKey(p.id), { kind: 'page', parent: mModuleKey(module.id), editable: p.editable }] as const,
    ...p.actions.map(a => [mActionKey(p.id, a.id), { kind: 'action', parent: mPageKey(p.id), editable: a.write }] as const),
  ]),
]));
export function mPageForPath(path: string): typeof M_PAGES[number] | undefined {
  const exact = M_PAGES.find(p => p.path === path);
  if (exact) return exact;
  if (path === permissions) return M_PAGES.find(p => p.id === 'permission-overview');
  if (path === `${permissions}/staff-accounts`) return M_PAGES.find(p => p.id === 'staff');
  if (path === '/m-platform/hardware') return M_PAGES.find(p => p.id === 'hardware-overview');
  const prefixes: [string, string][] = [
    [`${merchants}/device-activity/`, 'device-activity'],
    [`${merchants}/activity/`, 'merchant-activity'],
    [`${permissions}/subscription-services/`, 'services'], [`${permissions}/merchant-subscriptions/`, 'subscriptions'],
    [`${permissions}/roles/`, 'roles'], [`${permissions}/staff/`, 'staff'],
    [`${merchants}/stores/`, 'stores'],
    ['/m-platform/hardware/devices/', 'devices'], ['/m-platform/nav-blueprint/', 'routing'],
    ['/m-platform/platform-preset/', 'presets'],
  ];
  const prefix = prefixes.find(([start]) => path.startsWith(start));
  if (prefix) return M_PAGES.find(p => p.id === prefix[1]);
  // 品牌详情使用品牌 ID 作为第一段；保留字不落入品牌权限。
  if (path.startsWith(`${merchants}/`)) return M_PAGES.find(p => p.id === 'brands');
  return undefined;
}
