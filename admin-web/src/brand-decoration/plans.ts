import { formatLocal } from './schedule';
import { copy, pages, requirePageSuitePurchase, type Channel, type DecorationData, type Release, type Scheme } from './domain';

export interface PlanRules {
    kind: 'default' | 'activity';
    storeIds: string[];
    timezone: string;
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
    if (!Number.isFinite(rules.starts) || !Number.isFinite(rules.ends) || rules.starts! >= rules.ends!) {
        throw Error('结束时间须晚于开始时间');
    }
    const pageIds = new Set(pages(channel).map(([id]) => id));
    if (!rules.pageIds.length || rules.pageIds.some(id => !pageIds.has(id))) throw Error('请选择至少一个活动页面');
}

export function planAt(data: DecorationData, store: string, channel: Channel, at: number) {
    const releases = latestPlanReleases(data).filter(release =>
        release.snapshot.channel === channel && release.rules.storeIds.includes(store));
    const order = new Map(data.releases.map((release, index) => [release.id, index]));
    const defaultPriority = (candidate: PlanRelease) => {
        let priority = order.get(candidate.id)!;
        let version: Release = candidate;
        // Retained stores keep the precedence they had before a store-only update.
        for (let index = priority + 1; version.storeScopeOnly && index < data.releases.length; index++) {
            const prior = data.releases[index];
            if (prior.snapshot.id !== candidate.snapshot.id) continue;
            if (prior.offShelf || !prior.rules?.storeIds.includes(store)) break;
            priority = index;
            version = prior;
        }
        return priority;
    };
    let fallback: PlanRelease | undefined;
    let priority = Infinity;
    for (const release of releases) {
        if (release.rules.kind !== 'default') continue;
        const index = defaultPriority(release);
        if (index < priority) { fallback = release; priority = index; }
    }
    return {
        fallback,
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
    checkActivityOverlap(data, scheme.id, scheme.channel, rules, stores, rules.starts!);
}

function checkActivityOverlap(data: DecorationData, id: string, channel: Channel, rules: PlanRules, stores: PlanStore[], starts: number) {
    if (starts >= rules.ends!) return;
    for (const release of latestPlanReleases(data)) {
        const previous = release.rules;
        if (release.snapshot.id === id || release.snapshot.channel !== channel || previous.kind !== 'activity') continue;
        if (starts >= previous.ends! || previous.starts! >= rules.ends!) continue;
        const collisions = stores.filter(store => rules.storeIds.includes(store.id) && previous.storeIds.includes(store.id));
        if (collisions.length) throw Error('门店「' + collisions.map(store => store.name).join('、') + '」与方案「' + release.snapshot.name + '」时段重叠（' + formatLocal(previous.starts!, rules.timezone).replace('T', ' ') + ' 至 ' + formatLocal(previous.ends!, rules.timezone).replace('T', ' ') + '）');
    }
}

export function publishPlan(data: DecorationData, scheme: Scheme, stores: PlanStore[], actor: string) {
    requirePageSuitePurchase(data, scheme.channel, scheme.pageSuite);
    checkPlanPublication(data, scheme, stores);
    appendPlanRelease(data, scheme, stores, actor);
}

function appendPlanRelease(data: DecorationData, scheme: Scheme, stores: PlanStore[], actor: string, storeScopeOnly?: true) {
    const previous = data.releases.find(release => release.snapshot.channel === scheme.channel);
    const scopeName = stores.filter(store => scheme.rules!.storeIds.includes(store.id)).map(store => store.name).join('、');
    data.releases.unshift({
        storeScopeOnly,
        id: crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: new Date().toISOString(),
        actor, scopeName,
        snapshot: copy(scheme),
        rules: copy(scheme.rules!),
    });
}

export function updatePublishedPlanStores(data: DecorationData, id: string, releaseId: string, storeIds: string[], stores: PlanStore[], actor: string, now = Date.now()) {
    const current = data.schemes.find(scheme => scheme.id === id);
    const release = latestPlanReleases(data).find(item => item.snapshot.id === id);
    if (!current?.rules || release?.id !== releaseId) throw Error('方案上架状态已变化，请返回列表重试');
    const allowed = new Set(stores.map(store => store.id));
    if ([...current.rules.storeIds, ...release.rules.storeIds].some(storeId => !allowed.has(storeId)))
        throw Error('暂无管理该方案所有门店的权限');
    const rules = { ...release.rules, storeIds: [...storeIds] };
    validatePlanRules(rules, current.channel, stores);
    const added = storeIds.filter(storeId => !release.rules.storeIds.includes(storeId));
    if (!added.length && storeIds.length === release.rules.storeIds.length) throw Error('适用门店没有变化');
    if (rules.kind === 'activity')
        checkActivityOverlap(data, id, current.channel, { ...rules, storeIds: added }, stores, Math.max(now, rules.starts!));
    current.rules = { ...current.rules, storeIds: [...storeIds] };
    current.updatedAt = new Date(now).toISOString();
    appendPlanRelease(data, { ...release.snapshot, rules, updatedAt: current.updatedAt }, stores, actor, true);
}

export function updateUnpublishedPlanStores(data: DecorationData, id: string, storeIds: string[], stores: PlanStore[], now = Date.now()) {
    const scheme = data.schemes.find(item => item.id === id);
    if (!scheme?.rules || latestPlanReleases(data).some(release => release.snapshot.id === id))
        throw Error('方案状态已变化，请返回列表重试');
    const previous = scheme.rules;
    const allowed = new Map(stores.map(store => [store.id, store]));
    if (!storeIds.length || new Set(storeIds).size !== storeIds.length ||
        [...previous.storeIds, ...storeIds].some(storeId => !allowed.has(storeId)))
        throw Error('请选择有权使用的门店');
    if (previous.storeIds.length === storeIds.length && storeIds.every(storeId => previous.storeIds.includes(storeId)))
        throw Error('适用门店没有变化');
    const timezone = allowed.get(storeIds[0])!.timezone;
    if (previous.kind === 'activity') {
        if (!timezone || storeIds.some(storeId => allowed.get(storeId)!.timezone !== timezone))
            throw Error('活动门店须使用同一时区，请按时区分批创建');
        if ((previous.starts !== undefined || previous.ends !== undefined) && previous.timezone !== timezone)
            throw Error('新门店与已设置的有效期时区不同，请在编辑方案时重新设置有效期');
    }
    scheme.rules = { ...previous, storeIds: [...storeIds], timezone };
    scheme.updatedAt = new Date(now).toISOString();
}
