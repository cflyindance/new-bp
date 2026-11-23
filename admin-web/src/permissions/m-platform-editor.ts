import type { Resource } from './center-domain';
import { esc, renderPermissionEditor } from './center-editor';
import { M_RESOURCES, type MAccess } from './m-platform-catalog';
import type { MRole } from './m-platform-domain';

import { mEditorGrantKey, mEditorValue, type MEditorCatalog } from './m-editor-tree';
export { buildMEditorCatalog, mEditorGrantKey, mEditorValue } from './m-editor-tree';

export function mEditorChoices(key: string): [MAccess, string][] {
  const resource = M_RESOURCES.get(key);
  if (resource?.kind === 'action') return [['hidden', '禁止'], ['edit', '允许']];
  return resource?.kind === 'page' && resource.editable
    ? [['hidden', '不可见'], ['read', '可见不可编辑'], ['edit', '可编辑']]
    : [['hidden', '不可见'], ['read', '可见']];
}

export function mEditorBlocked(key: string, value: (key: string) => MAccess): string {
  const resource = M_RESOURCES.get(key);
  if (resource?.parent && value(resource.parent) === 'hidden') return '上级菜单不可见，配置保留但暂不生效';
  if (resource?.kind === 'action' && resource.editable && value(resource.parent) !== 'edit') return '页面只读，不能配置写操作';
  return '';
}

export function applyMEditorGrant(role: MRole, key: string, value: string | undefined, effective: (key: string) => MAccess): void {
  if (!M_RESOURCES.has(key) || !mEditorChoices(key).some(([choice]) => choice === value)) throw Error('权限状态与资源类型不匹配');
  const blocked = mEditorBlocked(key, effective);
  if (blocked) throw Error(blocked);
  role.grants[key] = value as MAccess;
}

export function renderMRolePermissionEditor(options: {
  catalog: MEditorCatalog; selected: string; preview: boolean; readonly: boolean; search: string;
  own: (key: string) => MAccess; value: (key: string) => MAccess;
}): string {
  const { catalog, selected, preview, readonly, search, own, value } = options;
  const control = (resource: Resource, compact = false): string => {
    const grantKey = mEditorGrantKey(catalog,resource.key);
    if(!grantKey)return '<span class="pc-muted">按子菜单配置</span>';
    const choices = mEditorChoices(grantKey);
    if (preview || readonly) return `<span class="pc-tag">${esc(choices.find(([choice]) => choice === value(grantKey))?.[1] ?? '不可见')}</span>`;
    const blocked = mEditorBlocked(grantKey, value);
    const tag = compact ? 'span' : 'div';
    return `<${tag} class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${choices.map(([choice, label]) => `<button type="button" data-grant="${esc(grantKey)}" data-value="${choice}" aria-pressed="${own(grantKey) === choice}" ${blocked ? `disabled title="${esc(blocked)}"` : ''}>${label}</button>`).join('')}</${tag}>`;
  };
  return renderPermissionEditor({ catalog, page: selected, group: '', preview, readonly, staff: false,
    search, own:key=>own(mEditorGrantKey(catalog,key)??key), value:key=>mEditorValue(catalog,key,value),
    presentation: { control, notice: (()=>{
      const key=mEditorGrantKey(catalog,selected);
      if(key==='m:page:routing')return '菜单配置与页面注册中心共用菜单与页面管理权限；修改会同步影响这些入口。';
      if(key==='m:page:presets')return '业态与菜单模板、广告位管理与平台预设共用平台预设权限；修改会同步影响这些入口。';
      if(catalog.grantKeys.has(selected)&&!key)return '此目录用于组织菜单，请在下级页面配置权限。';
      return undefined;
    })() } });
}
