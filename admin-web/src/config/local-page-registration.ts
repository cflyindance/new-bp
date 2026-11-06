import { validatePageRegistrations, type PageRegistration } from './page-registration-domain';

export const LOCAL_PAGE_REGISTRATIONS_KEY = 'menusifu:local-page-registrations:v1';
export const LOCAL_PAGE_REGISTRATION_SOURCE = '本地注册（当前浏览器）';
export interface LocalPageRegistrationInput {
  id: string; title: string; titleEn?: string; module: string; type: string; path: string;
  url?: string; microName?: string; microUrl?: string;
}
export interface RegistrationStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface LocalPageRegistrationState { pages: PageRegistration[]; error?: string }
const readError = '本地注册数据不可读取，已保留原数据；当前仅展示内置目录，请检查浏览器存储后重试。';

export function buildLocalPageRegistration(input: LocalPageRegistrationInput): PageRegistration {
  if (!['inner', 'iframe', 'external', 'micro-app'].includes(input.type)) throw new Error('请选择有效页面类型。');
  const type = input.type as PageRegistration['routing']['type'];
  const page: PageRegistration = {
    id: input.id.trim(), title: input.title.trim(), module: input.module.trim(),
    status: 'active', source: LOCAL_PAGE_REGISTRATION_SOURCE,
    routing: { type, path: input.path.trim() },
  };
  if (input.titleEn?.trim()) page.titleEn = input.titleEn.trim();
  if (type === 'iframe' || type === 'external') page.routing.url = input.url?.trim() ?? '';
  if (type === 'micro-app') page.routing.microAppConfig = { name: input.microName?.trim() ?? '', url: input.microUrl?.trim() ?? '' };
  const errors = validatePageRegistrations([page]);
  if (errors.length) throw new Error(errors.join('；'));
  return page;
}

function text(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value !== 'string') throw new Error('Invalid local registration field');
  return value;
}
function decodePage(value: unknown): PageRegistration {
  if (!value || typeof value !== 'object') throw new Error('Invalid local registration');
  const record = value as Record<string, unknown>;
  if (record.status !== 'active' || record.source !== LOCAL_PAGE_REGISTRATION_SOURCE || !record.routing || typeof record.routing !== 'object') throw new Error('Invalid local registration metadata');
  const routing = record.routing as Record<string, unknown>;
  const micro = routing.microAppConfig && typeof routing.microAppConfig === 'object' ? routing.microAppConfig as Record<string, unknown> : {};
  return buildLocalPageRegistration({ id: text(record.id), title: text(record.title), titleEn: text(record.titleEn), module: text(record.module), type: text(routing.type), path: text(routing.path), url: text(routing.url), microName: text(micro.name), microUrl: text(micro.url) });
}
function browserStorage(): RegistrationStorage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
export function readLocalPageRegistrations(builtIn: readonly PageRegistration[], storage?: RegistrationStorage): LocalPageRegistrationState {
  try {
    const raw = (storage ?? browserStorage())?.getItem(LOCAL_PAGE_REGISTRATIONS_KEY);
    if (raw == null) return { pages: [] };
    const record = JSON.parse(raw);
    if (record?.version !== 1 || !Array.isArray(record.pages)) throw new Error('Invalid local registration version');
    const pages = record.pages.map(decodePage) as PageRegistration[];
    if (validatePageRegistrations([...builtIn, ...pages]).length) throw new Error('Local registration conflict');
    return { pages };
  } catch { return { pages: [], error: readError }; }
}
export function saveLocalPageRegistration(input: LocalPageRegistrationInput, builtIn: readonly PageRegistration[], storage?: RegistrationStorage): PageRegistration {
  const previous = readLocalPageRegistrations(builtIn, storage);
  if (previous.error) throw new Error(previous.error);
  const page = buildLocalPageRegistration(input);
  const errors = validatePageRegistrations([...builtIn, ...previous.pages, page]);
  if (errors.length) throw new Error(errors.join('；'));
  try {
    const target = storage ?? browserStorage();
    if (!target) throw new Error('Storage unavailable');
    target.setItem(LOCAL_PAGE_REGISTRATIONS_KEY, JSON.stringify({ version: 1, pages: [...previous.pages, page] }));
  } catch { throw new Error('本地保存失败，请检查浏览器存储空间或权限；输入内容已保留。'); }
  return page;
}
