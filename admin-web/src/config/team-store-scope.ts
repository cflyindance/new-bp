/**
 * 团队管理 · 品牌多门店视角下需页内先选门店的路径
 *
 * 注：
 * - 角色与员工（/team/roles-employees）：门店筛选在 TipOut「员工列表」标题下方
 * - 员工打卡（/team/clock-in）：门店筛选在各 Tab 工具栏（日期左侧 / 规则设置顶部）
 * - 排班（/team/shift-scheduling）：门店筛选在日期选择器左侧
 * 以上不走外层 page-store-picker 条。
 */
import { TEAM_BREAKS_OVERTIME_PATH } from "./team-breaks-overtime-ui";

/** 角色与员工（iframe · 门店筛选在员工列表页内） */
export const TEAM_ROLES_EMPLOYEES_PATH = "/team/roles-employees";

/** 团队管理 · 设置 hub */
export const TEAM_SETTINGS_PATH = "/team/settings";

/** 品牌多门店视角下须在页内选择门店后再操作的团队管理入口（不含角色与员工、员工打卡、排班） */
export const TEAM_STORE_SCOPED_PATH_PREFIXES = [
  TEAM_BREAKS_OVERTIME_PATH,
  TEAM_SETTINGS_PATH,
] as const;

export function isTeamStoreScopedNavigationPath(path: string): boolean {
  return TEAM_STORE_SCOPED_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
