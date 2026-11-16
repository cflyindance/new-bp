import { buildLocalPageRegistration, readLocalPageRegistrations, type LocalPageRegistrationInput, type RegistrationStorage } from './local-page-registration';
import { validatePageRegistrations, type PageRegistration } from './page-registration-domain';
import { seedProductRegistry } from './page-registry-product-seed';
import { seedBusinessRegistries } from './page-registry-business-seeds';

export const REGISTRY_PROJECTS_KEY = 'menusifu:page-registry:v2';
export interface RegistryProject { id: string; name: string; microName?: string; microUrl?: string; microRoute?: string; status?: 'active' | 'disabled' }
export function validateProjectMicroApp(p: RegistryProject): void {
  if (!p.microName?.trim()) throw new Error('请填写微应用标识');
  try { if (!['http:', 'https:'].includes(new URL(p.microUrl ?? '').protocol)) throw new Error(); } catch { throw new Error('应用入口 URL 必须是 HTTP(S) 地址'); }
  if (!p.microRoute?.startsWith('/') || p.microRoute.startsWith('//') || /[?#]/.test(p.microRoute)) throw new Error('微应用路由须为不含查询和 hash 的绝对路径');
}
export interface RegistryDirectory { id: string; name: string; projectId: string; parentId: string | null; pageId?: string }
export interface RegistryAssignment { pageId: string; projectId: string; directoryId: string | null }
export interface RegistryWorkspace { version: 2; projects: RegistryProject[]; directories: RegistryDirectory[]; pages: PageRegistration[]; assignments: RegistryAssignment[] }
const empty = (): RegistryWorkspace => ({ version: 2, projects: [], directories: [], pages: [], assignments: [] });
const storage = (): RegistrationStorage => localStorage;
export function validateWorkspace(w: RegistryWorkspace, builtIn: readonly PageRegistration[]): void {
  if (w.version !== 2 || ![w.projects, w.directories, w.pages, w.assignments].every(Array.isArray)) throw new Error('注册中心存储格式无效');
  const projects = new Set<string>(), names = new Set<string>(), dirs = new Map<string, RegistryDirectory>();
  for (const p of w.projects) {
    if (typeof p.id !== 'string' || !p.id || typeof p.name !== 'string' || !p.name.trim() || projects.has(p.id) || names.has(p.name.trim())) throw new Error('项目名称为空或重复');
    projects.add(p.id); names.add(p.name.trim());
    if (p.status !== undefined && !['active','disabled'].includes(p.status)) throw new Error('项目状态无效');
    if (p.microName !== undefined || p.microUrl !== undefined || p.microRoute !== undefined) validateProjectMicroApp(p);
  }
  const siblingNames = new Set<string>();
  for (const d of w.directories) {
    const key = JSON.stringify([d.projectId, d.parentId, d.name]);
    if (!d.id || dirs.has(d.id) || !projects.has(d.projectId) || typeof d.name !== 'string' || !d.name.trim() || siblingNames.has(key)) throw new Error('目录名称为空、重复或归属无效');
    dirs.set(d.id, d); siblingNames.add(key);
  }
  for (const d of w.directories) {
    const seen = new Set([d.id]); let parent = d.parentId;
    while (parent !== null) {
      const p = dirs.get(parent);
      if (!p || p.projectId !== d.projectId || seen.has(parent)) throw new Error('目录归属无效或存在循环');
      seen.add(parent); parent = p.parentId;
    }
  }
  const errors = validatePageRegistrations([...builtIn, ...w.pages]);
  if (errors.length) throw new Error(errors.join('；'));
  const assigned = new Set<string>();
  for (const a of w.assignments) {
    if (assigned.has(a.pageId) || !w.pages.some(p => p.id === a.pageId) || !projects.has(a.projectId) || (a.directoryId !== null && dirs.get(a.directoryId)?.projectId !== a.projectId)) throw new Error('页面归属无效');
    assigned.add(a.pageId);
  }
}
export function readRegistryWorkspace(builtIn: readonly PageRegistration[], target?: RegistrationStorage): { workspace: RegistryWorkspace; error?: string } {
  try {
    target ??= storage();
    const raw = target.getItem(REGISTRY_PROJECTS_KEY);
    if (raw !== null) { const workspace = JSON.parse(raw) as RegistryWorkspace; validateWorkspace(workspace, builtIn); const seeded=seedBusinessRegistries(seedProductRegistry(workspace)); validateWorkspace(seeded,builtIn); return { workspace: seeded }; }
    const legacy = readLocalPageRegistrations(builtIn, target);
    if (legacy.error) throw new Error(legacy.error);
    const workspace=seedBusinessRegistries(seedProductRegistry({ ...empty(), pages: legacy.pages })); validateWorkspace(workspace,builtIn); return { workspace };
  } catch { return { workspace: empty(), error: '注册中心数据无法读取，原数据已保留；请修复存储后重试，当前禁止新增。' }; }
}
export function updateRegistryWorkspace(builtIn: readonly PageRegistration[], mutate: (w: RegistryWorkspace) => void, target: RegistrationStorage = storage()): RegistryWorkspace {
  const state = readRegistryWorkspace(builtIn, target);
  if (state.error) throw new Error(state.error);
  const next = structuredClone(state.workspace); mutate(next); validateWorkspace(next, builtIn);
  try { target.setItem(REGISTRY_PROJECTS_KEY, JSON.stringify(next)); } catch { throw new Error('本地保存失败，输入内容已保留，请检查存储空间或权限。'); }
  return next;
}
export function registerProjectPage(input: LocalPageRegistrationInput, projectId: string, directoryId: string | null, builtIn: readonly PageRegistration[], target?: RegistrationStorage, replaceId?: string, nodeId?: string): PageRegistration {
  let result: PageRegistration | undefined;
  updateRegistryWorkspace(builtIn, w => {
    const project = w.projects.find(p => p.id === projectId);
    if (!project) throw new Error('项目不存在');
    if (project.status === 'disabled') throw new Error('项目已停用，不能保存注册页面');
    const configured = Boolean(project.microName || project.microUrl || project.microRoute);
    if (configured) validateProjectMicroApp(project);
    const page = buildLocalPageRegistration(configured ? { ...input, type: 'micro-app', microName: project.microName, microUrl: project.microUrl } : input);
    if (configured && page.routing.microAppConfig) page.routing.microAppConfig.path = project.microRoute;
    if (replaceId) { if (!w.assignments.some(a => a.pageId === replaceId && a.projectId === projectId)) throw new Error('页面不存在或不属于当前项目'); w.pages = w.pages.filter(p => p.id !== replaceId); w.assignments = w.assignments.filter(a => a.pageId !== replaceId); }
    if (nodeId) { const node = w.directories.find(d => d.id === nodeId && d.projectId === projectId); if (!node) throw new Error('页面节点不存在'); node.pageId = page.id; node.name = page.title; }
    w.pages.push(page); w.assignments.push({ pageId: page.id, projectId, directoryId }); result = page;
  }, target);
  return result!;
}
