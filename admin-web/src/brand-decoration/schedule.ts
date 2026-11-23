import { pages, type Channel, type DecorationData } from './domain';

export interface DecorationActivity {
    id: string;
    channel: Channel;
    name: string;
    releaseId: string;
    starts: number;
    ends: number;
    endedAt?: number;
    pageIds: string[];
}

export interface DecorationSchedule {
    defaults: Partial<Record<Channel, string>>;
    activities: DecorationActivity[];
}

export const emptySchedule = (): DecorationSchedule => ({ defaults: {}, activities: [] });
export const effectiveEnd = (activity: DecorationActivity) => Math.min(activity.ends, activity.endedAt ?? Infinity);

export function resolveSchedule(data: DecorationData, channel: Channel, at: number) {
    const schedule = data.schedule ?? emptySchedule();
    const activities = schedule.activities.filter(activity => activity.channel === channel);
    const active = activities.find(activity => activity.starts <= at && at < effectiveEnd(activity));
    const upcoming = activities.filter(activity => activity.starts > at && activity.starts < effectiveEnd(activity))
        .sort((left, right) => left.starts - right.starts)[0];
    return {
        active,
        upcoming,
        fallback: data.releases.find(release => release.id === schedule.defaults[channel] && release.snapshot.channel === channel),
        activeRelease: data.releases.find(release => release.id === active?.releaseId && release.snapshot.channel === channel),
    };
}

export function saveActivity(data: DecorationData, activity: DecorationActivity) {
    const release = data.releases.find(item => item.id === activity.releaseId && item.snapshot.channel === activity.channel);
    if (!release) throw Error('请选择当前渠道的已发布版本');
    if (!activity.name.trim() || activity.name.length > 40) throw Error('活动名称需为 1–40 字');
    if (!Number.isFinite(activity.starts) || !Number.isFinite(activity.ends) || activity.ends <= activity.starts) {
        throw Error('结束时间须晚于开始时间');
    }
    const validPages = new Set(pages(activity.channel).map(([id]) => id));
    if (!activity.pageIds.length || activity.pageIds.some(id => !validPages.has(id))) throw Error('请选择要应用活动版本的页面');
    const schedule = data.schedule ??= emptySchedule();
    const conflict = schedule.activities.find(item => item.channel === activity.channel && item.id !== activity.id &&
        item.starts < activity.ends && activity.starts < effectiveEnd(item));
    if (conflict) throw Error('排期与「' + conflict.name + '」重叠，请调整起止时间');
    schedule.activities = [...schedule.activities.filter(item => item.id !== activity.id), activity];
}
const formatLocal = (at: number, zone: string) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(at);
    const get = (type: string) => parts.find(part => part.type === type)?.value;
    return [get('year'), get('month'), get('day')].join('-') + 'T' + get('hour') + ':' + get('minute');
};
export { formatLocal };

export function parseLocal(value: string, zone: string): number {
    const nominal = Date.parse(value + 'Z');
    if (!Number.isFinite(nominal)) throw Error('请选择完整的日期和时间');
    // Check offsets on both sides of a possible daylight-saving transition.
    const candidates = new Set([-86400000, 0, 86400000].map(delta => {
        const probe = nominal + delta;
        const offset = Date.parse(formatLocal(probe, zone) + 'Z') - probe;
        return nominal - offset;
    }).filter(candidate => formatLocal(candidate, zone) === value));
    if (candidates.size !== 1) throw Error('该时间在门店时区不存在或重复，请选择其他时间');
    return candidates.values().next().value!;
}
