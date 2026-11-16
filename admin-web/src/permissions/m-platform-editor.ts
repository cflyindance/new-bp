import type { Catalog } from './center-catalog';
import type { Resource } from './center-domain';
import { esc, renderPermissionEditor } from './center-editor';
import { M_MODULES, M_RESOURCES, mModuleKey, mPageKey, mActionKey, type MAccess } from './m-platform-catalog';
import type { MRole } from './m-platform-domain';

/** Presentation adapter only. Persisted M keys and mResolve remain authoritative. */
export function buildMEditorCatalog(): Catalog {
  const resources = new Map<string, Resource>();
  const tree = M_MODULES.map(module => {
    const key = mModuleKey(module.id);
    resources.set(key, { key, title: module.title, type: 'module' });
    return { id: key, key, title: module.title, children: module.pages.map(page => {
      const pageKey = mPageKey(page.id);
      resources.set(pageKey, { key: pageKey, title: page.title, type: 'page', parent: key, path: page.path });
      for (const action of page.actions) {
        const actionKey = mActionKey(page.id, action.id);
        resources.set(actionKey, { key: actionKey, title: action.title, type: 'action', parent: pageKey });
      }
      return { id: pageKey, key: pageKey, title: page.title, children: [] };
    }) };
  });
  return { tree, resources, groups: new Map() };
}

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
  catalog: Catalog; selected: string; preview: boolean; readonly: boolean; search: string;
  own: (key: string) => MAccess; value: (key: string) => MAccess;
}): string {
  const { catalog, selected, preview, readonly, search, own, value } = options;
  const control = (resource: Resource, compact = false): string => {
    const choices = mEditorChoices(resource.key);
    if (preview || readonly) return `<span class="pc-tag">${esc(choices.find(([choice]) => choice === value(resource.key))?.[1] ?? '不可见')}</span>`;
    const blocked = mEditorBlocked(resource.key, value);
    const tag = compact ? 'span' : 'div';
    return `<${tag} class="pc-segment" role="group" aria-label="${esc(resource.title)}权限">${choices.map(([choice, label]) => `<button type="button" data-grant="${esc(resource.key)}" data-value="${choice}" aria-pressed="${own(resource.key) === choice}" ${blocked ? `disabled title="${esc(blocked)}"` : ''}>${label}</button>`).join('')}</${tag}>`;
  };
  return renderPermissionEditor({ catalog, page: selected, group: '', preview, readonly, staff: false,
    search, own, value, presentation: { control } });
}
