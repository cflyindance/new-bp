import { copy, newScheme, pages, type DecorationData, type Scheme, type Theme } from './domain';
import { PALETTES, type PaletteId } from './palette';
import { validatePlanRules, type PlanRules, type PlanStore } from './plans';
import type { HomeTemplate } from './reference-template';

const DAY = 24 * 60 * 60 * 1000;
const HOME_TEMPLATES: HomeTemplate[] = [
    { id: '6900a0f9-775d-4b44-9ecb-bf53a08bfb01', name: '大图迎宾', version: 1,
        layout: { imageFirst: true, align: 'center', imageShare: 60, radius: 24 } },
    { id: '6900a0f9-775d-4b44-9ecb-bf53a08bfb02', name: '留白迎宾', version: 1,
        layout: { imageFirst: false, align: 'start', imageShare: 44, radius: 12 } },
];

export function createDecorationDemo(brandName: string, stores: PlanStore[], now = Date.now()): DecorationData | undefined {
    if (!stores.length) return undefined;
    const data: DecorationData = { schema: 1, revision: 0, schemes: [], releases: [], homeTemplates: copy(HOME_TEMPLATES) };
    const zonedStore = stores.find(store => store.timezone);
    const activityStores = zonedStore ? stores.filter(store => store.timezone === zonedStore.timezone) : [];
    const actor = '门店运营';
    for (const channel of ['kiosk', 'emenu'] as const) {
        const pageIds = pages(channel).map(([id]) => id);
        const featuredPages = ['home', 'menu'];
        let version = 0;
        const dailyRules = (targets: PlanStore[]): PlanRules => ({
            kind: 'default', storeIds: targets.map(store => store.id), timezone: targets[0].timezone, pageIds,
        });
        const add = (key: string, name: string, rules: PlanRules, paletteId: Exclude<PaletteId, 'custom'>, theme: Theme,
            customized: string[], releaseAge?: number, offShelf = false, draftStep?: Scheme['draftStep']) => {
            validatePlanRules(rules, channel, stores);
            const scheme: Scheme = {
                ...newScheme(channel, name, brandName), id: 'sample-' + channel + '-' + key,
                updatedAt: new Date(now - (releaseAge ?? 0) * DAY).toISOString(),
                rules, paletteId, primary: PALETTES[paletteId].primary, draftStep,
            };
            for (const id of customized) scheme.styles[id] = { mode: 'custom', theme };
            if (customized.includes('home')) {
                scheme.pageContent = { home: { title: '欢迎光临', subtitle: '当季好味，现点现做' } };
            }
            if (key === 'house') {
                scheme.sharedHeader = 'custom';
                scheme.sharedHeaderAppearance = { divider: true };
                if (channel === 'kiosk') scheme.styles.home.referenceTemplate = copy(HOME_TEMPLATES[0]);
            }
            data.schemes.unshift(scheme);
            if (releaseAge !== undefined) {
                data.releases.unshift({
                    id: scheme.id + '-v1', version: ++version, createdAt: scheme.updatedAt, actor,
                    scopeName: stores.filter(store => rules.storeIds.includes(store.id)).map(store => store.name).join('、'),
                    snapshot: copy(scheme), rules: copy(rules), ...(offShelf ? { offShelf: true } : {}),
                });
            }
        };
        const line = channel === 'kiosk' ? 'Kiosk' : 'eMenu';
        const dailyPages = channel === 'emenu' ? pageIds : ['home', 'menu', 'finish'];
        add('previous', line + ' · 经典迎宾', dailyRules([stores[0]]), 'graphite', 'jade', dailyPages, 30);
        if (stores.length > 1) {
            add('regional', line + ' · 门店日常', dailyRules(stores), 'indigo', 'jade', dailyPages, 24);
        }
        add('house', line + ' · 品牌日常', dailyRules([stores[0]]), 'pine', 'jade', dailyPages, 20);
        if (zonedStore) {
            const activityRules = (activityName: string, from: number, to: number): PlanRules => ({
                kind: 'activity', activityName, starts: now + from * DAY, ends: now + to * DAY,
                storeIds: activityStores.map(store => store.id), timezone: zonedStore.timezone, pageIds: featuredPages,
            });
            add('past', line + ' · 会员回馈', activityRules('会员回馈周', -14, -10), 'amber', 'noir', featuredPages, 16);
            add('active', line + ' · 当季新品', activityRules('当季新品季', -2, 3), 'clay', 'terra', featuredPages, 5);
            add('upcoming', line + ' · 周末团聚', activityRules('周末团聚日', 7, 11), 'indigo', 'jade', featuredPages, 1);
            add('offline', line + ' · 下午茶', activityRules('下午茶时段', 17, 20), 'amber', 'noir', featuredPages, 0, true);
        } else {
            add('offline', line + ' · 周末限定', dailyRules([stores[0]]), 'amber', 'noir', dailyPages, 0, true);
        }
        add('ready', line + ' · 午间推荐', dailyRules([stores[0]]), 'clay', 'terra', pageIds);
        add('draft', line + ' · 新店开业', dailyRules([stores[0]]), 'indigo', 'jade', dailyPages, undefined, false, 'editor');
    }
    return data;
}
