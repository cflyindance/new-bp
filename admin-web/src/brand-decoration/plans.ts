import { formatLocal } from './schedule';
import { copy, pages, type Channel, type DecorationData, type Release, type Scheme } from './domain';

export interface PlanRules {
    kind: 'default' | 'activity';
    storeIds: string[];
    timezone: string;
    activityName?: string;
    starts?: number;
    ends?: number;
    pageIds: string[];
}

export type PlanStore = { id: string; name: string; timezone: string };
export type PlanRelease = Release & { rules: PlanRules };

export function latestPlanReleases(data: DecorationData): PlanRelease[] {
    const seen = new Set<string>();
    return data.releases.flatMap(release => {
        if (!release.rules || seen.has(release.snapshot.id)) return [];
        seen.add(release.snapshot.id);
        return release.offShelf ? [] : [{ ...release, rules: release.rules }];
    });
}

export function validatePlanRules(rules: PlanRules, channel: Channel, stores: PlanStore[]) {
    const targets = rules.storeIds.map(id => stores.find(store => store.id === id));
    if (!targets.length || targets.some(store => !store) || new Set(rules.storeIds).size !== targets.length) {
        throw Error('请选择有权使用的门店');
    }
    if (rules.kind !== 'default' && rules.kind !== 'activity') throw Error('请选择使用方式');
    if (rules.kind === 'default') return;
    if (targets.some(store => !store!.timezone || store!.timezone !== rules.timezone)) {
        throw Error('活动门店须使用同一时区，请按时区分批创建');
    }
    if (!rules.activityName?.trim() || rules.activityName.length > 40) throw Error('活动名称需为 1–40 字');
    if (!Number.isFinite(rules.starts) || !Number.isFinite(rules.ends) || rules.starts! >= rules.ends!) {
        throw Error('结束时间须晚于开始时间');
    }
    const pageIds = new Set(pages(channel).map(([id]) => id));
    if (!rules.pageIds.length || rules.pageIds.some(id => !pageIds.has(id))) throw Error('请选择至少一个活动页面');
}

export function planAt(data: DecorationData, store: string, channel: Channel, at: number) {
    const releases = latestPlanReleases(data).filter(release =>
        release.snapshot.channel === channel && release.rules.storeIds.includes(store));
    return {
        fallback: releases.find(release => release.rules.kind === 'default'),
        active: releases.find(release => release.rules.kind === 'activity' &&
            release.rules.starts! <= at && at < release.rules.ends!),
    };
}

export function planPage(data: DecorationData, store: string, channel: Channel, page: string, at: number) {
    const { active, fallback } = planAt(data, store, channel, at);
    return active?.rules.pageIds.includes(page) ? active : fallback;
}

export function checkPlanPublication(data: DecorationData, scheme: Scheme, stores: PlanStore[], now = Date.now()) {
    const rules = scheme.rules;
    if (!rules) throw Error('请先设置使用规则');
    validatePlanRules(rules, scheme.channel, stores);
    if (rules.kind === 'default') return;
    if (rules.starts! < now) throw Error('开始时间须晚于当前时间');
    for (const release of latestPlanReleases(data)) {
        const previous = release.rules;
        if (release.snapshot.id === scheme.id || release.snapshot.channel !== scheme.channel || previous.kind !== 'activity') continue;
        if (rules.starts! >= previous.ends! || previous.starts! >= rules.ends!) continue;
        const collisions = stores.filter(store => rules.storeIds.includes(store.id) && previous.storeIds.includes(store.id));
        if (collisions.length) throw Error('门店「' + collisions.map(store => store.name).join('、') + '」与活动「' + previous.activityName + '」时段重叠（' + formatLocal(previous.starts!, rules.timezone).replace('T', ' ') + ' 至 ' + formatLocal(previous.ends!, rules.timezone).replace('T', ' ') + '）');
    }
}

export function publishPlan(data: DecorationData, scheme: Scheme, stores: PlanStore[], actor: string) {
    checkPlanPublication(data, scheme, stores);
    const previous = data.releases.find(release => release.snapshot.channel === scheme.channel);
    const scopeName = stores.filter(store => scheme.rules!.storeIds.includes(store.id)).map(store => store.name).join('、');
    data.releases.unshift({
        id: crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: new Date().toISOString(),
        actor, scopeName,
        snapshot: copy(scheme),
        rules: copy(scheme.rules!),
    });
}
