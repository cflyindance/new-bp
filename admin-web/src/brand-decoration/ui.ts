import { checkPlanPublication, latestPlanReleases, planAt, publishPlan, validatePlanRules, type PlanRules } from './plans';
import { effectiveEnd, emptySchedule, formatLocal, parseLocal, resolveSchedule, saveActivity, type DecorationActivity } from './schedule';
import './style.css';
import '../config/deployment-change-preview.css';
import { renderStandalonePageHeader } from '../ui/standalone-page-header';
import { renderChangePreviewDialog } from '../config/deployment-change-preview';
import { getAuthenticatedEmail } from '../auth/login';
import { decorationScope } from './scope';
import { readData, writeData } from './store';
import { THEMES, copy, newScheme, pages, changes, publish, validateScheme, type Channel, type Theme, type Scheme, type DecorationData } from './domain';
const ROOT = '/brand-decoration';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const date = (s: string) => new Date(s).toLocaleString('zh-CN', { hour12: false });
const label = (c: Channel) => c === 'kiosk' ? 'Kiosk 自助点餐' : 'eMenu 电子菜单';
const route = () => location.hash.replace(/^#/, '').split('?')[0];
let dispose: undefined | (() => void);
export const isBrandDecorationPath = (path: string) => path === ROOT || path.startsWith(ROOT + '/');
export function renderBrandDecorationPage(path: string): string {
    return `<section class="bd" data-brand-decoration data-path="${esc(path)}"><div role="status">正在载入品牌装修…</div></section>`;
}
export function bindBrandDecorationPage(app: HTMLElement): void {
    dispose?.();
    dispose = undefined;
    const container = app.querySelector<HTMLElement>('[data-brand-decoration]');
    if (!container)
        return;
    const root: HTMLElement = container;
    const scope = decorationScope();
    if (!scope.key) {
        root.innerHTML = '<div class="bd-empty">请先选择有权访问的品牌或门店，再管理装修方案。</div>';
        return;
    }
    const query = new URLSearchParams(location.hash.split('?')[1] || '');
    const flow = query.get('flow') === '1';
    const legacy = query.get('legacy') === '1' || (route().includes('/pages/edit/') && !flow) || route().endsWith('/assets');
    const dataKey = legacy ? scope.key : scope.brand + '/plan-flow';
    let legacyAvailable = false;
    let data: DecorationData;
    try {
        data = readData(dataKey, scope.brandName);
        if (!legacy) {
            try { legacyAvailable = readData(scope.key, scope.brandName).revision > 0; }
            catch { legacyAvailable = true; }
        }
    }
    catch (error) {
        root.innerHTML = `<div class="bd-empty" role="alert">${esc(String((error as Error).message))}</div>`;
        return;
    }
    let channel: Channel = query.get('channel') === 'emenu' ? 'emenu' : 'kiosk', page = 'home', orientation = 'portrait', search = '', status = 'all';
    let message = '', messageError = false, modal: HTMLElement | undefined;
    const editorId = route().startsWith(ROOT + '/pages/edit/') ? decodeURIComponent(route().split('/').pop()!) : undefined;
    const scheme = () => data.schemes.find(s => s.id === editorId && (!flow || s.rules?.storeIds.every(id => scope.stores.some(store => store.id === id))));
    const ensureWrite = () => { const current = decorationScope(); if (current.key !== scope.key)
        throw Error('品牌或门店范围已变化，请重新打开装修页面'); if (!current.canWrite)
        throw Error('暂无装修编辑权限，请联系管理员分配权限'); };
    const notice = (text: string, error = false) => { message = text; messageError = error; const el = root.querySelector('[data-bd-notice]'); if (el) {
        el.textContent = text;
        el.setAttribute('role', error ? 'alert' : 'status');
        el.classList.toggle('bd-error', error);
    } };
    function mutate(fn: (next: DecorationData) => void): boolean {
        try {
            ensureWrite();
            const next = copy(data);
            fn(next);
            data = writeData(dataKey, next, data.revision);
            notice('草稿已保存');
            return true;
        }
        catch (error) {
            notice((error as Error).message, true);
            return false;
        }
    }
    const writable = () => scope.canWrite ? '' : 'disabled';
    const heading = (title: string, note: string, actions = '') => `<header class="bd-heading"><div><h1>${title}</h1><p>${note}</p></div><div class="bd-actions">${actions}</div></header>`;
    const tip = () => `<div class="bd-scope"><span>当前范围：<b>${esc(scope.name)}</b></span>${scope.canWrite ? '' : '<span class="bd-tag">只读</span>'}</div><div data-bd-notice class="bd-notice ${messageError ? 'bd-error' : ''}" role="${messageError ? 'alert' : 'status'}">${esc(message)}</div>`;
    const channelTabs = () => `<div class="bd-tabs" role="tablist" aria-label="点餐渠道">${(['kiosk', 'emenu'] as Channel[]).map(c => `<button role="tab" aria-selected="${channel === c}" data-bd-action="channel" data-value="${c}">${label(c)}</button>`).join('')}</div>`;
    let previewAt: number | undefined;
    let showSchedule = false;
    const zone = scope.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const releaseName = (id?: string) => {
        const release = data.releases.find(item => item.id === id);
        return release ? release.snapshot.name + ' · V' + release.version : '项目原生样式';
    };
    const versionOptions = (selected?: string) => data.releases.filter(item => item.snapshot.channel === channel)
        .map(item => `<option value="${esc(item.id)}" ${selected === item.id ? 'selected' : ''}>${esc(releaseName(item.id))}</option>`).join('');
    const scheduleState = () => resolveSchedule(data, channel, previewAt ?? Date.now());
    function selectedPreview() {
        const { active, activeRelease, fallback } = scheduleState();
        if (active?.pageIds.includes(page) && activeRelease) return activeRelease.snapshot;
        return fallback?.snapshot ?? data.schemes.find(item => item.channel === channel && item.id === 'initial-' + channel
            && Object.values(item.styles).every(style => style.mode === 'default')) ?? newScheme(channel, '项目原生样式', scope.brandName);
    }
    function renderSchedule() {
        const { active, upcoming, fallback } = scheduleState();
        const activities = (data.schedule?.activities ?? []).filter(item => item.channel === channel)
            .sort((left, right) => left.starts - right.starts);
        const now = Date.now();
        return `<section class="bd-card bd-schedule"><h2>默认装修与活动排期</h2>
            <div class="bd-toolbar"><label>默认装修<select data-bd-default ${writable()}><option value="">项目原生样式</option>${versionOptions(fallback?.id)}</select></label>
            <button data-bd-action="default-save" ${writable()}>保存默认装修</button>
            <button class="bd-primary" data-bd-action="activity-edit" ${writable()}>新建活动</button></div>
            <p>时区 <strong>${esc(zone)}</strong>${scope.timezone ? '' : '（浏览器时区）'}</p>
            <div class="bd-toolbar"><label>预览时间<input type="datetime-local" data-bd-time value="${previewAt === undefined ? '' : formatLocal(previewAt, zone)}"></label>
            <button data-bd-action="schedule-preview">预览</button><button data-bd-action="schedule-now">返回当前时间</button>
            <label>预览页面<select data-bd-field="schedule-page">${pages(channel).map(([id, name]) => `<option value="${id}" ${page === id ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div>
            <p>${previewAt === undefined ? '当前展示' : '指定时间展示'} <strong>${active ? esc(active.name + ' · ' + releaseName(active.releaseId)) : esc(releaseName(fallback?.id))}</strong></p>
            <p>下一场活动 ${upcoming ? esc(upcoming.name + ' · ' + formatLocal(upcoming.starts, zone).replace('T', ' ')) : '暂无'}</p>
            <p>活动结束后恢复 ${esc(releaseName(fallback?.id))}</p>
            <div class="bd-table-wrap"><table><thead><tr><th>活动名称</th><th>方案版本</th><th>开始时间</th><th>结束时间</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>${activities.map(item => {
                const status = effectiveEnd(item) <= now ? '已结束' : item.starts > now ? '待开始' : '进行中';
                return `<tr><td>${esc(item.name)}</td><td>${esc(releaseName(item.releaseId))}</td><td>${formatLocal(item.starts, zone).replace('T', ' ')}</td><td>${formatLocal(effectiveEnd(item), zone).replace('T', ' ')}</td><td>${status}</td><td>${status === '已结束' ? '—' : `<button class="bd-link" data-bd-action="activity-edit" data-id="${esc(item.id)}" ${writable()}>${status === '待开始' ? '编辑' : '替换版本'}</button>${status === '进行中' ? `<button class="bd-link" data-bd-action="activity-end" data-id="${esc(item.id)}" ${writable()}>提前结束</button>` : ''}`}</td></tr>`;
            }).join('') || '<tr><td colspan="6" class="bd-empty">暂无活动排期</td></tr>'}</tbody></table></div>
            <div class="bd-preview-stage"><iframe title="排期效果预览" src="/brand-decoration-preview/index.html" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div></section>`;
    }
    function editActivity(existing?: DecorationActivity) {
        const running = !!existing && existing.starts <= Date.now();
        const title = running ? '替换活动版本' : existing ? '编辑活动' : '新建活动';
        openModal(`<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-activity-title">
            <button class="bd-modal-backdrop" data-bd-modal-close tabindex="-1" aria-label="关闭"></button>
            <section class="bd-modal-panel"><header><button data-bd-modal-close aria-label="关闭">×</button><h2 id="bd-activity-title">${title}</h2><button class="bd-primary" type="submit" form="bd-activity-form">保存排期</button></header>
            <form id="bd-activity-form" class="bd-activity-form">
            <label>活动名称<input name="name" required maxlength="40" value="${esc(existing?.name ?? '')}" ${running ? 'readonly' : ''}></label>
            <label>已发布版本<select name="version" required><option value="">请选择</option>${versionOptions(existing?.releaseId)}</select></label>
            <label>开始时间（${esc(zone)}）<input name="starts" type="datetime-local" required value="${existing ? formatLocal(existing.starts, zone) : ''}" ${running ? 'readonly' : ''}></label>
            <label>结束时间（${esc(zone)}）<input name="ends" type="datetime-local" required value="${existing ? formatLocal(existing.ends, zone) : ''}" ${running ? 'readonly' : ''}></label>
            <fieldset><legend>应用活动版本的页面</legend><p>未选页面沿用默认装修。已选页面使用活动版本中配置的样式。</p>
            <div class="bd-page-checks">${pages(channel).map(([id, name]) => `<label><input type="checkbox" name="pageId" value="${id}" ${(!existing || existing.pageIds.includes(id)) ? 'checked' : ''} ${running ? 'disabled' : ''}>${name}</label>`).join('')}</div></fieldset>
            <p data-bd-form-error role="alert"></p></form></section></div>`, () => {
            const form = modal!.querySelector<HTMLFormElement>('form')!;
            const fields = new FormData(form);
            const saved = mutate(next => {
                const now = Date.now();
                if (existing && (effectiveEnd(existing) <= now || (!running && existing.starts <= now))) {
                    throw Error('活动状态已变化，请重新打开');
                }
                const starts = running ? existing!.starts : parseLocal(String(fields.get('starts')), zone);
                if (!running && starts < now) throw Error('开始时间须晚于当前时间');
                saveActivity(next, {
                    id: existing?.id ?? crypto.randomUUID(), channel,
                    name: String(fields.get('name')).trim(), releaseId: String(fields.get('version')),
                    starts, ends: running ? existing!.ends : parseLocal(String(fields.get('ends')), zone),
                    pageIds: running ? existing!.pageIds : fields.getAll('pageId').map(String),
                });
            });
            if (saved) { closeModal(); message = '活动排期已保存'; draw(); }
            else modal!.querySelector('[data-bd-form-error]')!.textContent = message;
        });
    }
    function scheduleAction(action: string, el: HTMLElement): boolean {
        if (action === 'schedule-toggle') { showSchedule = !showSchedule; draw(); return true; }
        if (action === 'schedule-preview' || action === 'schedule-now') {
            try {
                previewAt = action === 'schedule-now' ? undefined : parseLocal(root.querySelector<HTMLInputElement>('[data-bd-time]')!.value, zone);
                draw();
            } catch (error) { notice((error as Error).message, true); }
            return true;
        }
        if (action === 'default-save') {
            const id = root.querySelector<HTMLSelectElement>('[data-bd-default]')!.value;
            if (mutate(next => {
                if (id && !next.releases.some(item => item.id === id && item.snapshot.channel === channel)) throw Error('请选择当前渠道的已发布版本');
                const config = next.schedule ??= emptySchedule();
                if (id) config.defaults[channel] = id;
                else delete config.defaults[channel];
            })) { message = '默认装修已保存'; draw(); }
            return true;
        }
        if (action !== 'activity-edit' && action !== 'activity-end') return false;
        const existing = data.schedule?.activities.find(item => item.id === el.dataset.id && item.channel === channel);
        if (action === 'activity-edit') editActivity(existing);
        if (action === 'activity-end' && existing) {
            confirm('提前结束活动', [{ label: '展示方案', before: existing.name, after: releaseName(data.schedule?.defaults[channel]) }],
                '结束活动', () => {
                    if (mutate(next => {
                        const now = Date.now();
                        if (existing.starts > now || effectiveEnd(existing) <= now) throw Error('该活动当前未生效');
                        next.schedule!.activities.find(item => item.id === existing.id)!.endedAt = now;
                    })) { closeModal(); message = '活动已结束'; draw(); }
                    else modal?.querySelector('[data-bd-modal-confirm]')?.insertAdjacentText('afterend', message);
                }, '确认后恢复当前默认装修。');
        }
        return true;
    }

    const planUrl = (id: string, step = '') => `#${ROOT}/pages/edit/${id}?flow=1&channel=${channel}${step ? '&step=' + step : ''}`;
    const stepBar = (step: number) => `<ol class="bd-flow-steps" aria-label="创建装修方案">${['设置使用规则', '装修页面', '核对并发布'].map((name, index) => `<li ${step === index + 1 ? 'aria-current="step"' : ''}>${index + 1}. ${name}</li>`).join('')}</ol>`;
    const storeNames = (ids: string[]) => ids.map(id => scope.stores.find(store => store.id === id)?.name ?? '门店已不可用').join('、');
    const period = (rules: PlanRules) => rules.kind === 'default' ? '长期' :
        `${formatLocal(rules.starts!, rules.timezone).replace('T', ' ')} 至 ${formatLocal(rules.ends!, rules.timezone).replace('T', ' ')} · ${rules.timezone}`;
    function drawRules() {
        const current = scheme();
        if (current) channel = current.channel;
        const rules = current?.rules;
        const picked = rules?.storeIds ?? (scope.stores.length === 1 ? [scope.stores[0].id] : []);
        const locked = current ? 'disabled' : '';
        root.innerHTML = renderStandalonePageHeader({
            titleHtml: current ? '设置使用规则' : '新建装修方案',
            backHtml: `<a href="${current ? planUrl(current.id) : '#' + ROOT + '/pages?channel=' + channel}">返回</a>`,
            actionsHtml: '<button class="bd-primary" type="submit" form="bd-plan-rules">下一步：装修页面</button>',
        }) + tip() + stepBar(1) + `<form id="bd-plan-rules" class="bd-card bd-plan-form">
            <label>方案名称<input name="name" required maxlength="40" value="${esc(current?.name ?? '')}"></label>
            <label>渠道<select name="channel" ${locked}><option value="kiosk" ${channel === 'kiosk' ? 'selected' : ''}>Kiosk</option><option value="emenu" ${channel === 'emenu' ? 'selected' : ''}>eMenu</option></select></label>
            <label>方案类型<select name="kind"><option value="default">默认方案 · 长期使用</option><option value="activity" ${rules?.kind === 'activity' ? 'selected' : ''}>活动方案 · 限时使用</option></select></label>
            <fieldset><legend>适用门店</legend><div class="bd-page-checks">${scope.stores.map(store => `<label><input type="checkbox" name="store" value="${esc(store.id)}" ${picked.includes(store.id) ? 'checked' : ''}>${esc(store.name)}</label>`).join('') || '当前范围没有可选门店'}</div></fieldset>
            <div data-bd-activity-fields>
            <label>活动名称<input name="activityName" maxlength="40" value="${esc(rules?.activityName ?? '')}"></label>
            <p>门店时区 <strong data-bd-zone></strong></p>
            <label>开始时间<input name="starts" type="datetime-local" value="${rules?.starts ? formatLocal(rules.starts, rules.timezone) : ''}"></label>
            <label>结束时间<input name="ends" type="datetime-local" value="${rules?.ends ? formatLocal(rules.ends, rules.timezone) : ''}"></label>
            </div></form>`;
        const form = root.querySelector<HTMLFormElement>('#bd-plan-rules')!;
        const selectedStores = () => scope.stores.filter(store => new FormData(form).getAll('store').includes(store.id));
        const update = () => {
            const activity = new FormData(form).get('kind') === 'activity';
            form.querySelector<HTMLElement>('[data-bd-activity-fields]')!.hidden = !activity;
            form.querySelector('[data-bd-zone]')!.textContent = [...new Set(selectedStores().map(store => store.timezone || '时区未配置'))].join('、') || '请先选择门店';
        };
        form.addEventListener('change', update);
        update();
        form.addEventListener('submit', event => {
            event.preventDefault();
            const fields = new FormData(form);
            const nextChannel = current?.channel ?? (fields.get('channel') === 'emenu' ? 'emenu' : 'kiosk');
            const targets = selectedStores();
            const timezone = targets[0]?.timezone ?? '';
            try {
                const kind = fields.get('kind') === 'activity' ? 'activity' : 'default';
                if (kind === 'activity' && (!timezone || targets.some(store => store.timezone !== timezone))) throw Error('请选择同一时区的门店');
                const name = String(fields.get('name')).trim();
                const nextRules: PlanRules = {
                    kind, timezone, storeIds: targets.map(store => store.id),
                    pageIds: rules?.kind === 'activity' ? rules.pageIds : pages(nextChannel).map(([id]) => id),
                };
                if (kind === 'activity') {
                    nextRules.activityName = String(fields.get('activityName')).trim();
                    nextRules.starts = parseLocal(String(fields.get('starts')), timezone);
                    nextRules.ends = parseLocal(String(fields.get('ends')), timezone);
                }
                const next = { ...(current ?? newScheme(nextChannel, name, scope.brandName)), name, rules: nextRules, updatedAt: new Date().toISOString() };
                validateScheme(next);
                validatePlanRules(nextRules, nextChannel, scope.stores);
                if (mutate(draft => {
                    draft.schemes = [...draft.schemes.filter(item => item.id !== next.id), next];
                })) {
                    channel = nextChannel;
                    location.hash = planUrl(next.id);
                }
            } catch (error) { notice((error as Error).message, true); }
        });
    }

    let previewStore = '';
    let planPreviewAt: number | undefined;
    let planPreviewOpen = false;
    function planPreviewScheme() {
        const at = planPreviewAt ?? Date.now();
        const { active, fallback } = planAt(data, previewStore, channel, at);
        const legacy = resolveSchedule(legacyForStore(previewStore), channel, at);
        return (active?.rules.pageIds.includes(page) ? active.snapshot : undefined) ??
            (!active && legacy.active?.pageIds.includes(page) ? legacy.activeRelease?.snapshot : undefined) ??
            fallback?.snapshot ?? legacy.fallback?.snapshot ?? newScheme(channel, '项目原生样式', scope.brandName);
    }
    function drawPlanPreview() {
        if (!planPreviewOpen || !scope.stores.length) return '';
        const store = scope.stores.find(item => item.id === previewStore) ?? scope.stores[0];
        previewStore = store.id;
        const zone = store.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        return `<section class="bd-card bd-schedule"><h2>门店效果预览</h2><div class="bd-toolbar">
            <label>门店<select data-bd-field="plan-store">${scope.stores.map(item => `<option value="${esc(item.id)}" ${item.id === previewStore ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}</select></label>
            <label>预览时间（${esc(zone)}）<input type="datetime-local" data-bd-plan-time value="${planPreviewAt === undefined ? '' : formatLocal(planPreviewAt, zone)}"></label>
            <button data-bd-action="plan-preview-time">预览</button><button data-bd-action="plan-preview-now">当前时间</button>
            <label>页面<select data-bd-field="schedule-page">${pages(channel).map(([id, title]) => `<option value="${id}" ${id === page ? 'selected' : ''}>${title}</option>`).join('')}</select></label>
            </div><p>页面使用方案 <strong>${esc(planPreviewScheme().name)}</strong></p>
            <div class="bd-preview-stage"><iframe title="门店装修预览" src="/brand-decoration-preview/index.html" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div></section>`;
    }
    function drawPlanList() {
        const plans = data.schemes.filter(item => item.rules && item.channel === channel &&
            item.rules.storeIds.every(id => scope.stores.some(store => store.id === id)));
        const releases = latestPlanReleases(data);
        root.innerHTML = heading('页面装修', '管理各门店的默认方案和活动方案。',
            `${scope.canWrite ? `<a class="bd-button bd-primary" href="${planUrl('new')}">新建装修方案</a>` : ''}<button data-bd-action="plan-preview-toggle">门店效果预览</button>`) + tip() + channelTabs() +
            `<div class="bd-table-wrap"><table><thead><tr><th>方案名称</th><th>类型</th><th>渠道</th><th>适用门店</th><th>生效时间</th><th>状态</th><th>操作</th></tr></thead><tbody>
            ${plans.map(item => {
                const release = releases.find(record => record.snapshot.id === item.id);
                const rules = release?.rules ?? item.rules!;
                const now = Date.now();
                const activeStores = rules.storeIds.filter(id => planAt(data, id, channel, now).fallback?.snapshot.id === item.id);
                const state = !release ? '草稿' : rules.kind === 'activity' ?
                    (now < rules.starts! ? '待开始' : now >= rules.ends! ? '已结束' : '进行中') :
                    activeStores.length === rules.storeIds.length ? '默认使用中' : activeStores.length ? '部分门店使用中' : '已被替换';
                return `<tr><td>${esc(item.name)}${rules.activityName ? `<small>${esc(rules.activityName)}</small>` : ''}</td><td>${rules.kind === 'activity' ? '活动方案' : '默认方案'}</td><td>${label(channel)}</td><td>${esc(storeNames(rules.storeIds))}</td><td>${esc(period(rules))}</td><td>${state}</td><td><a class="bd-link" href="${planUrl(item.id)}">${scope.canWrite ? '装修' : '查看'}</a></td></tr>`;
            }).join('') || '<tr><td colspan="7" class="bd-empty">暂无装修方案</td></tr>'}
            </tbody></table></div>${legacyAvailable ? `<p><a class="bd-link" href="#${ROOT}/pages?channel=${channel}&legacy=1">查看已有装修数据</a></p>` : ''}${drawPlanPreview()}`;
    }

    function legacyForStore(id: string) {
        return readData(scope.brand + '/' + id, scope.brandName);
    }
    function checkLegacyConflicts(s: Scheme) {
        const rules = s.rules!;
        if (rules.kind !== 'activity') return;
        for (const id of rules.storeIds) {
            const conflict = legacyForStore(id).schedule?.activities.find(item =>
                item.channel === s.channel && item.starts < rules.ends! && rules.starts! < effectiveEnd(item));
            if (conflict) throw Error('门店「' + storeNames([id]) + '」与已有活动「' + conflict.name + '」时段重叠');
        }
    }
    function reviewPlan(s: Scheme) {
        const rules = s.rules!;
        const rows = [
            { label: '方案类型', before: '—', after: rules.kind === 'activity' ? '活动方案' : '默认方案' },
            { label: '渠道', before: '—', after: label(s.channel) },
            { label: '适用门店', before: '—', after: storeNames(rules.storeIds) },
            { label: '生效时间', before: '—', after: period(rules) },
            ...(rules.activityName ? [{ label: '活动名称', before: '—', after: rules.activityName }] : []),
            { label: '装修页面', before: '—', after: pages(s.channel).filter(([id]) => rules.kind === 'default' || rules.pageIds.includes(id)).map(([, name]) => name).join('、') },
            ...rules.storeIds.map(id => {
                const current = planAt(data, id, s.channel, Date.now()).fallback?.snapshot.name ?? resolveSchedule(legacyForStore(id), s.channel, Date.now()).fallback?.snapshot.name ?? '项目原生样式';
                return { label: storeNames([id]), before: current, after: rules.kind === 'default' ? s.name : s.name + '（结束后恢复届时的默认方案）' };
            }),
        ];
        checkPlanPublication(data, s, scope.stores);
        checkLegacyConflicts(s);
        confirm('第 3 步：核对并发布', rows, '确认发布演示版本', () => {
            if (mutate(next => {
                checkLegacyConflicts(s);
                publishPlan(next, s, decorationScope().stores, getAuthenticatedEmail() || '当前账号');
            })) {
                closeModal();
                location.hash = `${ROOT}/pages?channel=${s.channel}`;
            } else {
                const error = modal?.querySelector('[data-bd-publish-error]') ?? document.createElement('p');
                error.setAttribute('data-bd-publish-error', '');
                error.setAttribute('role', 'alert');
                error.textContent = message;
                modal?.querySelector('[data-bd-modal-confirm]')?.after(error);
            }
        });
    }

    function draw() {
        const currentPath = route();
        if (flow && (editorId === 'new' || (query.get('step') === 'rules' && scheme()))) {
            if (scope.canWrite) drawRules();
            else root.innerHTML = '<p role="alert">暂无装修编辑权限</p><a href="#/brand-decoration/pages">返回方案列表</a>';
            return;
        }
        if (editorId) {
            drawEditor();
            return;
        }
        if (currentPath === ROOT + '/assets') {
            root.innerHTML = heading('品牌素材', '共用品牌资产，按终端需要选择合适的尺寸。') + tip() + `<div class="bd-assets"><article class="bd-card"><div class="bd-asset-icon">▧</div><h2>图片素材</h2><p>品牌标识、品牌图片与营销图片，沿用现有素材中心管理。</p><a class="bd-button bd-primary" href="#/asset-center/materials">进入图片素材</a></article><article class="bd-card"><div class="bd-asset-icon">▷</div><h2>视频素材</h2><p>屏保与品牌视频沿用视频库；不同渠道的展示规则分别配置。</p><a class="bd-button" href="#/asset-center/videos">进入视频库</a></article></div>`;
            return;
        }
        if (currentPath === ROOT + '/releases') {
            root.innerHTML = heading('发布记录', '查看各渠道的演示版本及当时的配置快照。') + tip() + channelTabs() + `<div class="bd-table-wrap"><table><thead><tr><th>版本</th><th>装修方案</th><th>发布范围</th><th>发布时间</th><th>操作人</th><th>结果</th><th>操作</th></tr></thead><tbody>${data.releases.filter(r => r.snapshot.channel === channel && (!r.rules || r.rules.storeIds.every(id => scope.stores.some(store => store.id === id)))).map(r => `<tr><td>V${r.version}</td><td>${esc(r.snapshot.name)}</td><td>${esc(r.scopeName)}</td><td>${date(r.createdAt)}</td><td>${esc(r.actor)}</td><td><span class="bd-tag">演示版本已生成</span></td><td><button class="bd-link" data-bd-action="record" data-id="${r.id}">查看快照</button></td></tr>`).join('') || '<tr><td colspan="7" class="bd-empty">暂无发布记录。请先进入页面装修，发布一个演示版本。</td></tr>'}</tbody></table></div><div class="bd-pagination">共 ${data.releases.filter(r => r.snapshot.channel === channel && (!r.rules || r.rules.storeIds.every(id => scope.stores.some(store => store.id === id)))).length} 条记录</div>`;
            return;
        }
        if (showSchedule) {
            lastActive = scheduleState().active?.id ?? '';
            root.innerHTML = heading('页面装修', '', '<button data-bd-action="schedule-toggle">返回方案列表</button>') + tip() + channelTabs() + renderSchedule();
            return;
        }
        if (!legacy) { drawPlanList(); return; }
        const schemes = data.schemes.filter(s => s.channel === channel && s.name.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || (status === 'published' ? data.releases.some(r => r.snapshot.id === s.id) : !data.releases.some(r => r.snapshot.id === s.id))));
        root.innerHTML = heading('页面装修', '统一品牌形象，分别管理 Kiosk 与 eMenu 的页面体验。', `<button data-bd-action="schedule-toggle">默认装修与活动排期</button><a class="bd-button" href="#${ROOT}/pages?channel=${channel}">返回装修方案</a>`) + tip() + channelTabs() + `<div class="bd-toolbar"><label>方案名称<input type="search" data-bd-filter="search" placeholder="搜索方案名称" value="${esc(search)}" maxlength="40"></label><label>发布状态<select data-bd-filter="status"><option value="all">全部状态</option><option value="draft" ${status === 'draft' ? 'selected' : ''}>未发布</option><option value="published" ${status === 'published' ? 'selected' : ''}>有演示版本</option></select></label><button data-bd-action="filter">查询</button><button data-bd-action="reset">重置</button></div><div class="bd-table-wrap"><table><thead><tr><th>方案名称</th><th>页面数量</th><th>自定义页面</th><th>演示版本</th><th>草稿更新时间</th><th>操作</th></tr></thead><tbody>${schemes.map(s => { const release = data.releases.find(r => r.snapshot.id === s.id); return `<tr><td><strong>${esc(s.name)}</strong><small>${label(s.channel)}</small></td><td>${pages(s.channel).length} 页</td><td>${Object.values(s.styles).filter(s => s.mode === 'custom').length} 页</td><td>${release ? `<span class="bd-tag">V${release.version}</span>` : '<span class="bd-muted">未发布</span>'}</td><td>${date(s.updatedAt)}</td><td><a class="bd-link" href="#${ROOT}/pages/edit/${s.id}">${scope.canWrite ? '装修' : '查看'}</a><button class="bd-link" data-bd-action="duplicate" data-id="${s.id}" ${writable()}>复制</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="bd-empty">没有符合条件的装修方案，请调整筛选条件。</td></tr>'}</tbody></table></div><div class="bd-pagination">共 ${schemes.length} 个方案</div>`;
    }
    function drawEditor() {
        const s = scheme();
        if (!s) {
            root.innerHTML = '<div class="bd-empty">方案不存在或已移除。<a href="#/brand-decoration/pages">返回方案列表</a></div>';
            return;
        }
        channel = s.channel;
        const style = s.styles[page];
        root.innerHTML = renderStandalonePageHeader({ titleHtml: esc(s.name), backHtml: `<a href="#${ROOT}/pages?channel=${channel}${legacy ? "&legacy=1" : ""}">返回方案列表</a>`, subtitleHtml: `${label(channel)}`, actionsHtml: `${flow && scope.canWrite ? `<a class="bd-button" href="${planUrl(s.id, "rules")}">上一步：使用规则</a>` : ""}<button data-bd-action="publish" class="bd-primary" ${writable()}>${flow ? "下一步：核对并发布" : "发布演示版本"}</button>` }) + tip() + (flow ? stepBar(2) : "") + `<div class="bd-workbench"><aside class="bd-card bd-config"><h2>页面与样式</h2><label>装修页面<select data-bd-field="page">${pages(channel).map(([id, name]) => `<option value="${id}" ${id === page ? 'selected' : ''}>${name} · ${s.styles[id].mode === 'default' ? '默认' : '自定义'}</option>`).join('')}</select></label><fieldset ${writable()}><legend>当前页面样式</legend><label class="bd-radio"><input type="radio" name="bd-mode" data-bd-field="mode" value="default" ${style.mode === 'default' ? 'checked' : ''}>项目默认</label><label class="bd-radio"><input type="radio" name="bd-mode" data-bd-field="mode" value="custom" ${style.mode === 'custom' ? 'checked' : ''}>自定义装修</label></fieldset>${style.mode === 'custom' ? `<div class="bd-themes">${(Object.keys(THEMES) as Theme[]).map(id => `<button class="bd-theme ${style.theme === id ? 'is-selected' : ''}" data-bd-action="theme" data-value="${id}" aria-pressed="${style.theme === id}" ${writable()}><i style="background:${THEMES[id].color}"></i><span><b>${THEMES[id].name}</b><small>${THEMES[id].note}</small></span><span>${style.theme === id ? '✓' : ''}</span></button>`).join('')}</div><button class="bd-wide" data-bd-action="suite" ${writable()}>将当前模板应用到全部 ${pages(channel).length} 页</button>` : ''}${s.rules?.kind === 'activity' ? `<label class="bd-radio"><input type="checkbox" data-bd-field="activity-page" ${s.rules.pageIds.includes(page) ? 'checked' : ''} ${writable()}>活动期间应用此页</label>${s.rules.pageIds.includes(page) ? "" : `<p class="bd-help">沿用默认装修 · 预览门店：${esc(storeNames(s.rules.storeIds.slice(0, 1)))}</p>`} ` : ''}<hr><h2>方案与品牌</h2><label>方案名称<input data-bd-field="name" value="${esc(s.name)}" maxlength="40" ${writable()}></label><label>品牌名称<input data-bd-field="brandName" value="${esc(s.brandName)}" maxlength="20" ${writable()}></label><label>自定义主色<span class="bd-color"><input type="color" data-bd-field="primary" value="${s.primary}" ${writable()}><code>${s.primary}</code></span></label><p class="bd-help">品牌名称与主色仅作用于此方案的自定义页面。</p></aside><section class="bd-preview"><div class="bd-preview-toolbar"><strong>顾客端效果预览</strong><label>${channel === 'kiosk' ? `<select data-bd-field="orientation"><option value="portrait" ${orientation === 'portrait' ? 'selected' : ''}>24 寸 · 1080 × 1920</option><option value="landscape" ${orientation === 'landscape' ? 'selected' : ''}>14 寸 · 1920 × 1080</option></select>` : '移动端 · 390 × 844'}</label></div><div class="bd-preview-stage"><iframe title="${label(channel)}页面样式预览" src="/brand-decoration-preview/index.html" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div></section></div>`;
    }
    function closeModal() { if (!modal)
        return; modal.dispatchEvent(new Event('bd-dismiss')); }
    function openModal(html: string, onConfirm?: () => void) {
        closeModal();
        const focus = document.activeElement as HTMLElement | null;
        const host = document.createElement('div');
        host.innerHTML = html;
        modal = host.firstElementChild as HTMLElement;
        document.body.append(modal);
        const siblings = Array.from(document.body.children).filter((el): el is HTMLElement => el instanceof HTMLElement && el !== modal);
        const states = siblings.map(el => [el, el.inert] as const);
        siblings.forEach(el => el.inert = true);
        const panel = modal;
        panel.addEventListener('submit', event => { event.preventDefault(); onConfirm?.(); });
        const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]')).filter(el => el.getClientRects().length > 0);
        panel.addEventListener('bd-dismiss', () => { panel.remove(); states.forEach(([el, inert]) => el.inert = inert); modal = undefined; focus?.isConnected && focus.focus(); }, { once: true });
        panel.addEventListener('keydown', ev => { if (ev.key === 'Escape') {
            ev.preventDefault();
            closeModal();
        } if (ev.key === 'Tab') {
            const list = controls(), first = list[0], last = list[list.length - 1];
            if (ev.shiftKey && document.activeElement === first) {
                ev.preventDefault();
                last?.focus();
            }
            else if (!ev.shiftKey && document.activeElement === last) {
                ev.preventDefault();
                first?.focus();
            }
        } });
        panel.addEventListener('click', event => { const target = event.target as HTMLElement; if (target.closest('[data-bd-modal-close]'))
            closeModal(); if (target.closest('[data-bd-modal-confirm]'))
            onConfirm?.(); });
        controls()[0]?.focus();
    }
    const confirm = (title: string, rows: Array<{
        label: string;
        before: string;
        after: string;
    }>, action: string, callback: () => void, subtitle = '确认后仅更新本机演示配置，不向设备下发。') => openModal(renderChangePreviewDialog({ mode: 'confirm', dialogId: 'bd-confirm', title, subtitle, changes: rows, confirmLabel: action, closeAttr: 'data-bd-modal-close', backdropAttr: 'data-bd-modal-close', confirmAttr: 'data-bd-modal-confirm', zClass: 'z-[10060]' }), callback);
    function act(action: string, el: HTMLElement) {
        if (action === 'plan-preview-toggle') { planPreviewOpen = !planPreviewOpen; draw(); return; }
        if (action === 'plan-preview-time' || action === 'plan-preview-now') {
            try {
                const zone = scope.stores.find(item => item.id === previewStore)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                planPreviewAt = action === 'plan-preview-now' ? undefined :
                    parseLocal(root.querySelector<HTMLInputElement>('[data-bd-plan-time]')!.value, zone);
                draw();
            } catch (error) { notice((error as Error).message, true); }
            return;
        }
        if (scheduleAction(action, el)) return;
        if (action === 'channel') {
            previewAt = undefined;
            page = 'home';
            channel = el.dataset.value as Channel;
            search = '';
            status = 'all';
            draw();
            return;
        }
        if (action === 'filter') {
            search = (root.querySelector('[data-bd-filter="search"]') as HTMLInputElement).value.trim();
            status = (root.querySelector('[data-bd-filter="status"]') as HTMLSelectElement).value;
            draw();
            return;
        }
        if (action === 'reset') {
            search = '';
            status = 'all';
            draw();
            return;
        }
        if (action === 'create' && legacy) {
            const html = `<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-create-title"><button class="bd-modal-backdrop" data-bd-modal-close tabindex="-1" aria-label="取消新建"></button><section class="bd-modal-panel"><header><button data-bd-modal-close aria-label="取消新建">×</button><h2 id="bd-create-title">新建${channel === 'kiosk' ? ' Kiosk' : ' eMenu'}方案</h2><button class="bd-primary" data-bd-modal-confirm>创建方案</button></header><form data-bd-create><label>方案名称<input name="name" required maxlength="40" placeholder="例如：冬季品牌方案"></label><p class="bd-help">创建 ${pages(channel).length} 个默认页面，后续可逐页切换自定义装修。</p><p data-bd-form-error role="alert"></p></form></section></div>`;
            openModal(html, () => { const input = modal!.querySelector<HTMLInputElement>('[name="name"]')!; if (!input.reportValidity())
                return; const name = input.value.trim(); if (!name) {
                input.setCustomValidity('请输入方案名称');
                input.reportValidity();
                input.setCustomValidity('');
                return;
            } const created = newScheme(channel, name, scope.brandName); if (mutate(next => { if (next.schemes.length >= 20)
                throw Error('演示最多保存 20 个方案'); next.schemes.push(created); })) {
                closeModal();
                location.hash = `${ROOT}/pages/edit/${created.id}`;
            }
            else
                modal!.querySelector('[data-bd-form-error]')!.textContent = message; });
            return;
        }
        if (action === 'duplicate') {
            const source = data.schemes.find(s => s.id === el.dataset.id);
            if (!source)
                return;
            if (mutate(next => { if (next.schemes.length >= 20)
                throw Error('演示最多保存 20 个方案'); next.schemes.push({ ...copy(source), id: crypto.randomUUID(), name: source.name.slice(0, 35) + ' 副本', updatedAt: new Date().toISOString() }); }))
                draw();
            return;
        }
        if (action === 'record') {
            const record = data.releases.find(r => r.id === el.dataset.id);
            if (!record)
                return;
            openModal(renderChangePreviewDialog({ mode: 'view', dialogId: 'bd-snapshot', title: `V${record.version} · ${record.snapshot.name}`, subtitle: `${record.scopeName} · ${date(record.createdAt)} · 演示快照，未向设备下发`, changes: changes(undefined, record.snapshot), closeAttr: 'data-bd-modal-close', backdropAttr: 'data-bd-modal-close', zClass: 'z-[10060]' }));
            return;
        }
        const s = scheme();
        if (!s)
            return;
        if (action === 'theme') {
            if (mutate(next => { const current = next.schemes.find(s => s.id === editorId)!; current.styles[page] = { mode: 'custom', theme: el.dataset.value as Theme }; current.primary = THEMES[el.dataset.value as Theme].color; current.updatedAt = new Date().toISOString(); }))
                draw();
            return;
        }
        if (action === 'suite') {
            const theme = s.styles[page].theme;
            confirm('应用整套模板', pages(channel).filter(([id]) => s.styles[id].mode !== 'custom' || s.styles[id].theme !== theme).map(([id, name]) => ({ label: name, before: s.styles[id].mode === 'default' ? '项目默认' : THEMES[s.styles[id].theme].name, after: THEMES[theme].name })), '应用到全部页面', () => { if (mutate(next => { const current = next.schemes.find(s => s.id === editorId)!; for (const [id] of pages(channel))
                current.styles[id] = { mode: 'custom', theme }; current.updatedAt = new Date().toISOString(); })) {
                closeModal();
                draw();
            } });
            return;
        }
        if (action === 'publish') {
            try {
                ensureWrite();
                validateScheme(s);
                if (flow) { reviewPlan(s); return; }
                const previous = data.releases.find(r => r.snapshot.channel === channel && (!r.rules || r.rules.storeIds.every(id => scope.stores.some(store => store.id === id))));
                const rows = changes(previous?.snapshot, s);
                if (!rows.length) {
                    notice('与当前演示版本一致，无需重复发布');
                    return;
                }
                confirm('发布演示版本', rows, '确认发布演示版本', () => { if (mutate(next => publish(next, s.id, getAuthenticatedEmail() || '当前账号', scope.name))) {
                    closeModal();
                    message = '演示版本已生成，可在发布记录中查看。';
                    draw();
                } });
            }
            catch (error) {
                notice((error as Error).message, true);
            }
        }
    }
    const click = (event: Event) => { const button = (event.target as HTMLElement).closest<HTMLElement>('[data-bd-action]'); if (button && !button.hasAttribute('disabled'))
        act(button.dataset.bdAction!, button); };
    const change = (event: Event) => { const input = event.target as HTMLInputElement; const field = input.dataset.bdField; if (!field)
        return; if (field === 'plan-store') { previewStore = input.value; planPreviewAt = undefined; draw(); return; } if (field === 'page' || field === 'schedule-page') {
        page = input.value;
        draw();
        return;
    } if (field === 'orientation') {
        orientation = input.value;
        draw();
        return;
    } const s = scheme();
    if (field === 'activity-page' && s?.rules) {
        if (mutate(next => {
            const rules = next.schemes.find(item => item.id === s.id)!.rules!;
            rules.pageIds = input.checked ? [...new Set([...rules.pageIds, page])] : rules.pageIds.filter(id => id !== page);
        })) draw();
        else input.checked = !input.checked;
        return;
    }
    if (!s)
        return; const value = input.value.trim(); if (mutate(next => { const current = next.schemes.find(item => item.id === s.id)!; if (field === 'mode')
        current.styles[page].mode = value as 'default' | 'custom';
    else if (field === 'name' || field === 'brandName' || field === 'primary')
        current[field] = value; current.updatedAt = new Date().toISOString(); validateScheme(current); })) {
        if (field === 'mode')
            draw();
        else {
            const updated = scheme()!;
            const title = root.querySelector('.standalone-page-title h1');
            if (title)
                title.textContent = updated.name;
            const code = root.querySelector('.bd-color code');
            if (code)
                code.textContent = updated.primary;
            root.querySelector<HTMLIFrameElement>('[data-bd-frame]')?.contentWindow?.postMessage({ type: 'bd-render', scheme: updated, page, orientation }, location.origin);
        }
    }
    else
        input.value = field === 'mode' ? s.styles[page].mode : String(s[field as 'name' | 'brandName' | 'primary'] ?? ''); };
    const frameMessage = (event: MessageEvent) => { const frame = root.querySelector<HTMLIFrameElement>('[data-bd-frame]'); if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'bd-ready')
        return; let s = showSchedule ? selectedPreview() : planPreviewOpen ? planPreviewScheme() : scheme();
        if (flow && s?.rules?.kind === 'activity' && !s.rules.pageIds.includes(page)) {
            const store = s.rules.storeIds[0];
            s = planAt(data, store, channel, Date.now()).fallback?.snapshot ??
                resolveSchedule(legacyForStore(store), channel, Date.now()).fallback?.snapshot ??
                newScheme(channel, '项目原生样式', scope.brandName);
        }
        if (s)
        frame.contentWindow?.postMessage({ type: 'bd-render', scheme: s, page, orientation }, location.origin); };
    const storage = (event: StorageEvent) => { if (event.key?.startsWith('menusifu:brand-decoration:v1:'))
        notice('其他窗口的装修数据已变化，请刷新后继续编辑', true); };
    let lastActive = '';
    const scheduleClock = window.setInterval(() => {
        if (!showSchedule || previewAt !== undefined || modal) return;
        const activeId = scheduleState().active?.id ?? '';
        if (activeId === lastActive) return;
        lastActive = activeId;
        draw();
    }, 1000);
    root.addEventListener('click', click);
    root.addEventListener('change', change);
    window.addEventListener('message', frameMessage);
    window.addEventListener('storage', storage);
    dispose = () => { window.clearInterval(scheduleClock); closeModal(); root.removeEventListener('click', click); root.removeEventListener('change', change); window.removeEventListener('message', frameMessage); window.removeEventListener('storage', storage); };
    draw();
}
