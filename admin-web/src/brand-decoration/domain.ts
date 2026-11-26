import { validatePageContent, type PageContent } from './page-content';
import { DEFAULT_PALETTE_ID, PALETTES, describePalette, type PaletteId } from './palette';
import type { PlanRules } from './plans';
import type { DecorationSchedule } from './schedule';
export type Channel = 'kiosk' | 'emenu';
export type Theme = 'jade' | 'noir' | 'terra';
export const THEMES: Record<Theme, {
    name: string;
    color: string;
    note: string;
}> = {
    jade: { name: '松石雅宴', color: '#254e40', note: '温润留白，适合中餐与轻食' },
    noir: { name: '曜石金序', color: '#dbc18d', note: '深色与黄铜，适合精品餐饮' },
    terra: { name: '赤陶食集', color: '#ad432e', note: '暖色与自然质感，适合咖啡烘焙' },
};
export const PAGE_TEMPLATES: Record<Theme, { name: string; note: string }> = {
    jade: { name: '留白图文', note: '主图与内容分区，留出阅读空间' },
    noir: { name: '紧凑列表', note: '收紧间距，突出信息与操作顺序' },
    terra: { name: '大图卡片', note: '突出图片和卡片层次' },
};
export const KIOSK_PAGES = [
    ['screensaver', '屏保／待机页'], ['home', '首页'], ['orderType', '用餐方式页'], ['menu', '菜单页'], ['detail', '商品详情'], ['combo', '套餐选择'], ['review', '购物车／订单确认'], ['payment', '支付方式页'], ['finish', '完成页'], ['waitList', '等位登记'], ['tableService', '取餐／送餐方式'], ['phoneInput', '手机号输入'], ['reward', '会员奖励'], ['enterName', '姓名输入'], ['partySizeSelection', '用餐人数'], ['togoOption', '打包选项'], ['chooseTable', '选择桌台'], ['tippingPanel', '小费选择'], ['cardPayment', '刷卡支付过程'], ['afterCreditCardPay', '支付后处理'], ['signature', '签名'], ['login', '会员登录'], ['paymentMember', '支付后会员'], ['connectionError', '连接异常'],
] as const;
export const EMENU_PAGES = [['home', '首页'], ['menu', '菜单页'], ['detail', '商品详情'], ['review', '购物车'], ['payment', '支付方式页'], ['finish', '完成页'], ['login', '会员登录']] as const;
export const pages = (channel: Channel): ReadonlyArray<readonly [
    string,
    string
]> => channel === 'kiosk' ? KIOSK_PAGES : EMENU_PAGES;
export interface Style {
    mode: 'default' | 'custom';
    theme: Theme;
}
export const SHARED_HEADER_STYLES = { layout: '系统布局', custom: '自定义布局' } as const;
export type SharedHeaderStyle = keyof typeof SHARED_HEADER_STYLES;
export function sharedHeaderLayout(style: Scheme['sharedHeader']): SharedHeaderStyle {
    return style === 'brand' || style === 'custom' ? 'custom' : 'layout';
}

export interface Scheme {
    sharedHeader?: SharedHeaderStyle | 'light' | 'brand';
    sharedHeaderAppearance?: { background?: string; divider?: true };
    pageContent?: PageContent;
    paletteId?: PaletteId;
    draftStep?: 'rules' | 'editor' | 'stores' | 'period' | 'review';
    rules?: PlanRules;
    id: string;
    name: string;
    channel: Channel;
    brandName: string;
    primary: string;
    updatedAt: string;
    styles: Record<string, Style>;
}
export interface Release {
    offShelf?: true;
    rules?: PlanRules;
    id: string;
    version: number;
    createdAt: string;
    actor: string;
    scopeName: string;
    snapshot: Scheme;
}
export interface DecorationData {
    schedule?: DecorationSchedule;
    schema: 1;
    revision: number;
    schemes: Scheme[];
    releases: Release[];
}
export const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function newScheme(channel: Channel, name: string, brandName: string): Scheme {
    return { id: crypto.randomUUID(), name, channel, brandName: brandName.slice(0, 20), primary: PALETTES[DEFAULT_PALETTE_ID].primary, paletteId: DEFAULT_PALETTE_ID, updatedAt: new Date().toISOString(), styles: Object.fromEntries(pages(channel).map(([id]) => [id, { mode: 'default', theme: 'jade' }])) };
}
export function validateScheme(s: Scheme): void {
    if (!s || !['kiosk', 'emenu'].includes(s.channel) || typeof s.id !== 'string' || !s.id || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 40 || typeof s.brandName !== 'string' || !s.brandName.trim() || s.brandName.length > 20 || !/^#[\da-f]{6}$/i.test(s.primary))
        throw Error('方案名称需为 1–40 字，品牌名称需为 1–20 字，主色需为有效颜色');
    // Older drafts and release snapshots stored the former system preset alongside its ID.
    const legacySystemPrimary = s.paletteId === DEFAULT_PALETTE_ID && s.primary === '#0958d9';
    if (!legacySystemPrimary && s.paletteId !== undefined && s.paletteId !== 'custom' &&
        (!Object.hasOwn(PALETTES, s.paletteId) || s.primary !== PALETTES[s.paletteId].primary))
        throw Error('方案主题色无效');
    if (s.sharedHeader !== undefined && !['layout', 'custom', 'light', 'brand'].includes(s.sharedHeader))
        throw Error('共用组件顶部样式无效');
    const appearance = s.sharedHeaderAppearance;
    if (appearance !== undefined && (!appearance || typeof appearance !== 'object' || Array.isArray(appearance) ||
        (appearance.background !== undefined && (typeof appearance.background !== 'string' || !/^#[0-9a-f]{6}$/i.test(appearance.background))) ||
        (appearance.divider !== undefined && appearance.divider !== true)))
        throw Error('顶部导航属性无效');
    if (s.pageContent !== undefined && !validatePageContent(s.channel, s.pageContent))
        throw Error('页面内容配置无效');
    if (!s.styles || Object.keys(s.styles).length !== pages(s.channel).length)
        throw Error('页面配置不完整');
    for (const [id] of pages(s.channel)) {
        const style = s.styles[id];
        if (!style || !['default', 'custom'].includes(style.mode) || !Object.hasOwn(THEMES, style.theme))
            throw Error('页面样式无效');
    }
}
export function validateData(data: DecorationData): void {
    if (!data || data.schema !== 1 || !Number.isInteger(data.revision) || !Array.isArray(data.schemes) || !Array.isArray(data.releases))
        throw Error('装修数据无法读取，请保留当前数据并联系管理员');
    const ids = new Set<string>();
    for (const scheme of data.schemes) {
        validateScheme(scheme);
        if (ids.has(scheme.id))
            throw Error('方案编号重复');
        ids.add(scheme.id);
    }
    for (const release of data.releases) {
        if (!release || !Number.isInteger(release.version) || release.version < 1 || typeof release.id !== 'string' || typeof release.actor !== 'string' || typeof release.scopeName !== 'string' || typeof release.createdAt !== 'string' || !Number.isFinite(Date.parse(release.createdAt)))
            throw Error('版本记录无效');
        validateScheme(release.snapshot);
    }
}
export function changes(before: Scheme | undefined, after: Scheme): Array<{
    label: string;
    before: string;
    after: string;
}> {
    const output: Array<{
        label: string;
        before: string;
        after: string;
    }> = [];
    for (const [key, label] of [['name', '方案名称'], ['brandName', '品牌名称']] as const) {
        if (before?.[key] !== after[key])
            output.push({ label, before: before?.[key] ?? '未发布', after: after[key] });
    }
    const header = SHARED_HEADER_STYLES[sharedHeaderLayout(after.sharedHeader)];
    const previousHeader = before ? SHARED_HEADER_STYLES[sharedHeaderLayout(before.sharedHeader)] : '未发布';
    if (header !== previousHeader) output.push({ label: '页面顶部', before: previousHeader, after: header });
    const previousAppearance = before?.sharedHeaderAppearance;
    const appearance = after.sharedHeaderAppearance;
    if (appearance?.background !== previousAppearance?.background)
        output.push({ label: '顶栏背景色', before: previousAppearance?.background ?? '跟随方案主题', after: appearance?.background ?? '跟随方案主题' });
    if (appearance?.divider !== previousAppearance?.divider)
        output.push({ label: '顶栏分隔线', before: previousAppearance?.divider ? '显示' : '隐藏', after: appearance?.divider ? '显示' : '隐藏' });
    const palette = describePalette(after.paletteId, after.primary);
    const previousPalette = before ? describePalette(before.paletteId, before.primary) : '未发布';
    if (palette !== previousPalette) output.push({ label: '方案主题色', before: previousPalette, after: palette });
    const text = (s: Style | undefined) => s ? (s.mode === 'default' ? '项目默认' : PAGE_TEMPLATES[s.theme].name) : '未发布';
    for (const [id, label] of pages(after.channel)) {
        const prev = before?.styles[id], next = after.styles[id];
        const previousContent = before?.pageContent?.[id] ?? {};
        const content = after.pageContent?.[id] ?? {};
        const fields = new Set([...Object.keys(previousContent), ...Object.keys(content)]);
        if ([...fields].some(key => previousContent[key] !== content[key]))
            output.push({ label: label + ' · 页面内容', before: Object.keys(previousContent).length ? '已配置' : '默认内容', after: Object.keys(content).length ? '已配置' : '默认内容' });
        if (text(prev) !== text(next))
            output.push({ label, before: text(prev), after: text(next) });
    }
    return output;
}
export function publish(data: DecorationData, id: string, actor: string, scopeName: string): Release {
    const scheme = data.schemes.find(s => s.id === id);
    if (!scheme)
        throw Error('方案不存在');
    validateScheme(scheme);
    const previous = data.releases.find(r => r.snapshot.channel === scheme.channel);
    if (!changes(previous?.snapshot, scheme).length)
        throw Error('与当前演示版本一致，无需重复发布');
    const release = { id: crypto.randomUUID(), version: (previous?.version ?? 0) + 1, createdAt: new Date().toISOString(), actor, scopeName, snapshot: copy(scheme) };
    data.releases.unshift(release);
    return release;
}
