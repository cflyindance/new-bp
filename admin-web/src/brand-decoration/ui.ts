import { MAX_PAGE_IMAGE_BYTES, MAX_PAGE_TEXT, pageElements } from './page-content';
import { PALETTES, describePalette, resolvePalette, type PaletteId } from './palette';
import { latestPlanReleases, planAt, publishPlan, validatePlanRules, type PlanRules } from './plans';
import { effectiveEnd, emptySchedule, formatLocal, parseLocal, resolveSchedule, saveActivity, type DecorationActivity } from './schedule';
import './style.css';
import '../config/deployment-change-preview.css';
import { renderStandalonePageHeader } from '../ui/standalone-page-header';
import { renderChangePreviewDialog } from '../config/deployment-change-preview';
import { getAuthenticatedEmail } from '../auth/login';
import { decorationScope } from './scope';
import { readData, writeData } from './store';
import { PAGE_TEMPLATES, SHARED_HEADER_STYLES, sharedHeaderLayout, type SharedHeaderStyle, copy, newScheme, pages, changes, publish, validateScheme, type Channel, type Theme, type Scheme, type DecorationData } from './domain';
const ROOT = '/brand-decoration';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const date = (s: string) => new Date(s).toLocaleString('zh-CN', { hour12: false });
const lineLabel: Record<Channel, string> = { kiosk: 'Kiosk', emenu: 'eMenu' };
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
    let channel: Channel = query.get('channel') === 'emenu' ? 'emenu' : 'kiosk', page = 'home', orientation = 'portrait';
    let message = query.get('draft') === 'saved' ? '草稿已保存' : query.get('saved') === '1' ? '方案已保存' : '', messageError = false, modal: HTMLElement | undefined;
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
    const listNotice = () => `<div data-bd-notice class="bd-notice ${messageError ? 'bd-error' : ''}" role="${messageError ? 'alert' : 'status'}">${esc(message)}</div>`;
    const tip = () => `<div class="bd-scope"><span>当前范围：<b>${esc(scope.name)}</b></span>${scope.canWrite ? '' : '<span class="bd-tag">只读</span>'}</div>${listNotice()}`;
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
        return `<section class="bd-card bd-schedule"><h2>日常装修与活动排期</h2>
            <div class="bd-toolbar"><label>日常装修<select data-bd-default ${writable()}><option value="">项目原生样式</option>${versionOptions(fallback?.id)}</select></label>
            <button data-bd-action="default-save" ${writable()}>保存日常装修</button>
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
            <fieldset><legend>应用活动版本的页面</legend><p>未选页面沿用门店日常装修。已选页面使用活动版本中配置的样式。</p>
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
            })) { message = '日常装修已保存'; draw(); }
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
                }, '确认后恢复当前日常装修。');
        }
        return true;
    }

    const planUrl = (id: string, step = '', targetChannel = channel) => `#${ROOT}/pages/edit/${id}?flow=1&channel=${targetChannel}${step ? '&step=' + step : ''}`;
    const returnAfterDraft = (target: Channel) => { location.hash = `${ROOT}/pages?channel=${target}&draft=saved`; };
    const draftButton = (form?: string) => form
        ? `<button class="bd-draft-action" type="submit" form="${form}" name="destination" value="draft" formnovalidate>保存草稿</button>`
        : '<button class="bd-draft-action" type="button" data-bd-action="save-flow-draft">保存草稿</button>';
    const resumeStep = (s: Scheme) => {
        const step = s.draftStep;
        if (step === 'period' && s.rules?.kind !== 'activity') return 'stores';
        return step === 'rules' || step === 'stores' || step === 'period' || step === 'review' ? step : '';
    };
    const flowProgress = (step: number, activity: boolean) => {
        const titles = ['方案信息', '装修页面', '选择门店', ...(activity ? ['活动有效期'] : []), '核对并保存'];
        return `<nav class="bd-flow-progress" aria-label="创建装修方案进度">
            <ol class="bd-flow-steps" style="--bd-step-count:${titles.length}">${titles.map((title, index) =>
                `<li ${step === index + 1 ? 'aria-current="step"' : ''}><span class="bd-step-number" aria-hidden="true">${index + 1}</span>${title}</li>`).join('')}</ol>
            <p class="bd-flow-progress-compact" aria-current="step">第 ${step} 步 / 共 ${titles.length} 步 · ${titles[step - 1]}</p>
        </nav><div class="bd-flow-meter" aria-hidden="true"><i style="width:${step / titles.length * 100}%"></i></div>`;
    };
    const flowHeader = (step: number, options: Parameters<typeof renderStandalonePageHeader>[0]) =>
        renderStandalonePageHeader({ ...options, className: 'bd-flow-header',
            progressHtml: flowProgress(step, scheme()?.rules?.kind === 'activity') });
    const storeNames = (ids: string[]) => ids.map(id => scope.stores.find(store => store.id === id)?.name ?? '门店已不可用').join('、');
    const period = (rules: PlanRules) => rules.kind === 'default' ? '长期' : !rules.starts || !rules.ends ? '待设置' :
        `${formatLocal(rules.starts!, rules.timezone).replace('T', ' ')} 至 ${formatLocal(rules.ends!, rules.timezone).replace('T', ' ')} · ${rules.timezone}`;
    function drawRules() {
        const current = scheme();
        if (current) channel = current.channel;
        const rules = current?.rules;
        const locked = current ? 'disabled' : '';
        root.innerHTML = flowHeader(1, {
            titleHtml: current ? '方案信息' : '新建装修方案',
            backHtml: `<a href="${current ? planUrl(current.id) : '#' + ROOT + '/pages?channel=' + channel}">返回</a>`,
            actionsHtml: `<button type="submit" form="bd-plan-rules" class="bd-primary">下一步：装修页面</button>${draftButton('bd-plan-rules')}`,
        }) + `<div class="bd-flow-content"><form id="bd-plan-rules" class="bd-card bd-plan-form">
            <div class="bd-flow-grid"><label>方案名称<input name="name" required maxlength="40" value="${esc(current?.name ?? '')}"></label>
            <label>渠道<select name="channel" ${locked}><option value="kiosk" ${channel === 'kiosk' ? 'selected' : ''}>Kiosk</option><option value="emenu" ${channel === 'emenu' ? 'selected' : ''}>eMenu</option></select></label>
            </div>
            <fieldset class="bd-flow-fieldset"><legend>使用方式</legend><div class="bd-flow-grid">
            <div class="bd-choice-help">
                <label class="bd-choice"><input type="radio" name="kind" value="default" ${rules?.kind !== 'activity' ? 'checked' : ''}><span class="bd-choice-icon" aria-hidden="true">◷</span><span>日常装修</span></label>
                <div class="bd-usage-help"><button type="button" aria-label="日常装修说明" aria-describedby="bd-usage-daily">?</button>
                    <span id="bd-usage-daily" role="tooltip">门店平时使用的装修。</span></div>
            </div>
            <div class="bd-choice-help">
                <label class="bd-choice"><input type="radio" name="kind" value="activity" ${rules?.kind === 'activity' ? 'checked' : ''}><span class="bd-choice-icon" aria-hidden="true">◈</span><span>限时装修</span></label>
                <div class="bd-usage-help"><button type="button" aria-label="限时装修说明" aria-describedby="bd-usage-timed">?</button>
                    <span id="bd-usage-timed" role="tooltip">在指定时间内展示，到期后恢复门店的日常装修。</span></div>
            </div>
            </div></fieldset>
            <div data-bd-activity-fields>
            <label>活动名称<input name="activityName" maxlength="40" value="${esc(rules?.activityName ?? '')}"></label>
            </div>
            <div data-bd-notice class="bd-notice" role="status"></div>
            </form></div>`;
        const form = root.querySelector<HTMLFormElement>('#bd-plan-rules')!;
        const update = () => {
            const activity = new FormData(form).get('kind') === 'activity';
            form.querySelector<HTMLElement>('[data-bd-activity-fields]')!.hidden = !activity;
            form.querySelector<HTMLInputElement>('[name=activityName]')!.required = activity;
            const progress = root.querySelector('.bd-flow-progress');
            if (progress) {
                root.querySelector('.bd-flow-meter')?.remove();
                progress.outerHTML = flowProgress(1, activity);
            }
        };
        form.addEventListener('change', update);
        update();
        form.addEventListener('submit', event => {
            event.preventDefault();
            const fields = new FormData(form);
            const draftOnly = (event.submitter as HTMLButtonElement | null)?.value === 'draft';
            const nextChannel = current?.channel ?? (fields.get('channel') === 'emenu' ? 'emenu' : 'kiosk');
            try {
                const kind = fields.get('kind') === 'activity' ? 'activity' : 'default';
                const name = String(fields.get('name')).trim();
                const activityName = String(fields.get('activityName')).trim();
                if (!draftOnly && kind === 'activity' && !activityName) throw Error('请输入活动名称');
                const nextRules: PlanRules = {
                    ...rules, kind, activityName,
                    timezone: rules?.timezone ?? '',
                    storeIds: rules?.storeIds ?? [],
                    pageIds: rules?.pageIds ?? pages(nextChannel).map(([id]) => id),
                };
                const next = { ...(current ?? newScheme(nextChannel, name, scope.brandName)), name, rules: nextRules, draftStep: draftOnly ? 'rules' as const : current?.draftStep ?? 'editor' as const, updatedAt: new Date().toISOString() };
                validateScheme(next);
                const save = () => {
                    if (mutate(draft => { draft.schemes = [...draft.schemes.filter(item => item.id !== next.id), next]; })) {
                        closeModal();
                        channel = nextChannel;
                        if (draftOnly) returnAfterDraft(nextChannel);
                        else location.hash = planUrl(next.id);
                    }
                };
                const inherited = rules?.kind === 'activity' && kind === 'default'
                    ? pages(nextChannel).filter(([id]) => !rules.pageIds.includes(id)) : [];
                if (inherited.length) {
                    confirm('切换为日常装修', inherited.map(([id, title]) => ({
                        label: title, before: '沿用日常装修',
                        after: next.styles[id].mode === 'custom' ? PAGE_TEMPLATES[next.styles[id].theme].name : '系统布局',
                    })), '确认切换', save, '以下页面将使用本方案中保留的样式。');
                } else save();
            } catch (error) { notice((error as Error).message, true); }
        });
    }

    function drawStores(s: Scheme) {
        channel = s.channel;
        const rules = s.rules!;
        const activity = rules.kind === 'activity';
        const picked = rules.storeIds.length ? rules.storeIds : scope.stores.length === 1 ? [scope.stores[0].id] : [];
        const regions = [...new Set(scope.stores.map(store => store.region))].sort();
        root.innerHTML = flowHeader(3, {
            titleHtml: '选择门店', subtitleHtml: channel === 'kiosk' ? undefined : esc(s.name + ' · ' + label(channel)),
            backHtml: '<button type="submit" form="bd-plan-stores" name="destination" value="editor">保存并返回装修页面</button>',
            actionsHtml: `<button type="submit" form="bd-plan-stores" class="bd-primary" name="destination" value="review">下一步：${activity ? '活动有效期' : '核对并保存'}</button>${draftButton('bd-plan-stores')}`,
        }) + `<div class="bd-store-page"><form id="bd-plan-stores" class="bd-store-form">
            <div class="bd-store-layout">
              <section class="bd-card bd-store-catalog" aria-labelledby="bd-store-list-title">
                <h2 id="bd-store-list-title">门店列表</h2>
                <div class="bd-store-filters">
                  <input type="search" data-bd-store-search aria-label="搜索门店" placeholder="门店名称 / MID" autocomplete="off">
                  <select data-bd-store-region aria-label="区域"><option value="">全部区域</option>${regions.map(region => `<option value="${esc(region)}">${esc(region)}</option>`).join('')}</select>
                  <button type="button" data-bd-store-reset>重置</button>
                </div>
                <div class="bd-table-wrap bd-store-table"><table>
                  <thead><tr><th scope="col"><input type="checkbox" data-bd-store-all aria-label="全选当前筛选结果"></th><th scope="col">门店名称</th><th scope="col">MID</th><th scope="col">区域</th></tr></thead>
                  <tbody>${scope.stores.map(store => `<tr data-bd-store-item data-region="${esc(store.region)}">
                    <td><input type="checkbox" name="store" value="${esc(store.id)}" aria-label="${esc(store.name)}" ${picked.includes(store.id) ? 'checked' : ''}></td>
                    <td>${esc(store.name)}</td><td>${esc(store.id)}</td><td>${esc(store.region)}</td>
                  </tr>`).join('')}<tr data-bd-store-empty hidden><td colspan="4" class="bd-empty">没有符合条件的门店</td></tr></tbody>
                </table></div>
                <p class="bd-help" data-bd-store-total></p>
              </section>
              <section class="bd-card bd-store-selection" aria-labelledby="bd-picked-title">
                <h2 id="bd-picked-title">已选门店 <span class="bd-muted" data-bd-store-count></span></h2>
                <div data-bd-picked></div>
              </section>
            </div>
            <p data-bd-notice class="bd-notice" role="status"></p>
            </form></div>`;
        const form = root.querySelector<HTMLFormElement>('#bd-plan-stores')!;
        const selected = () => {
            const ids = new FormData(form).getAll('store');
            return scope.stores.filter(store => ids.includes(store.id));
        };
        const searchInput = form.querySelector<HTMLInputElement>('[data-bd-store-search]')!;
        const regionInput = form.querySelector<HTMLSelectElement>('[data-bd-store-region]')!;
        const all = form.querySelector<HTMLInputElement>('[data-bd-store-all]')!;
        const chosenPanel = form.querySelector<HTMLElement>('[data-bd-picked]')!;
        const nextButton = root.querySelector<HTMLButtonElement>('[form=bd-plan-stores][value=review]')!;
        const rows = Array.from(form.querySelectorAll<HTMLTableRowElement>('[data-bd-store-item]'));
        const visibleChecks = () => rows.filter(row => !row.hidden)
            .map(row => row.querySelector<HTMLInputElement>('input[name=store]')!);
        let selectionSignature = "";
        const renderSelection = () => {
            const chosen = selected();
            const visible = visibleChecks();
            const checkedCount = visible.filter(input => input.checked).length;
            all.disabled = !visible.length;
            all.checked = !!visible.length && checkedCount === visible.length;
            all.indeterminate = checkedCount > 0 && checkedCount < visible.length;
            nextButton.disabled = !chosen.length;
            form.querySelector('[data-bd-store-count]')!.textContent = '(' + chosen.length + ')';
            const selectionHtml = chosen.length ? `<ul class="bd-picked-stores">${chosen.map(store => `<li>
                <span><strong>${esc(store.name)}</strong><small>${esc(store.id)}</small></span>
                <button type="button" class="bd-link" data-bd-store-remove="${esc(store.id)}" aria-label="移除 ${esc(store.name)}">移除</button>
            </li>`).join('')}</ul>` : '<p class="bd-store-empty">请从门店列表勾选适用门店</p>';
            const signature = JSON.stringify(chosen.map(store => store.id));
            if (signature !== selectionSignature) {
                chosenPanel.innerHTML = selectionHtml;
                selectionSignature = signature;
            }
        };
        const filterStores = () => {
            const search = searchInput.value.trim().toLowerCase();
            const region = regionInput.value;
            rows.forEach(row => {
                row.hidden = ![row.cells[1], row.cells[2]].some(cell => cell.textContent!.toLowerCase().includes(search)) || (!!region && row.dataset.region !== region);
            });
            const visible = visibleChecks().length;
            form.querySelector<HTMLElement>('[data-bd-store-empty]')!.hidden = visible > 0;
            form.querySelector('[data-bd-store-total]')!.textContent = '共 ' + visible + ' 家门店';
            renderSelection();
        };
        searchInput.addEventListener('input', filterStores);
        regionInput.addEventListener('change', filterStores);
        form.querySelector('[data-bd-store-reset]')!.addEventListener('click', () => {
            searchInput.value = '';
            regionInput.value = '';
            filterStores();
        });
        all.addEventListener('change', () => {
            visibleChecks().forEach(input => { input.checked = all.checked; });
            renderSelection();
        });
        form.addEventListener('change', event => {
            if ((event.target as HTMLInputElement).name === 'store') renderSelection();
        });
        chosenPanel.addEventListener('click', event => {
            const remove = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bd-store-remove]');
            if (!remove) return;
            const input = rows.flatMap(row => Array.from(row.querySelectorAll<HTMLInputElement>('input[name=store]')))
                .find(option => option.value === remove.dataset.bdStoreRemove);
            if (!input) return;
            input.checked = false;
            renderSelection();
            if (input.closest('tr')?.hidden) searchInput.focus();
            else input.focus();
        });
        filterStores();
        form.addEventListener('submit', event => {
            event.preventDefault();
            const targets = selected();
            const timezone = targets[0]?.timezone ?? '';
            const destination = (event.submitter as HTMLButtonElement | null)?.value;
            const draftOnly = destination === 'draft';
            const review = destination !== 'editor' && !draftOnly;
            try {
                if (review && !targets.length) throw Error('请至少选择一家门店');
                const proposed: PlanRules = { ...rules, timezone, storeIds: targets.map(store => store.id) };
                if (activity && rules.timezone !== timezone) {
                    proposed.starts = undefined;
                    proposed.ends = undefined;
                }
                const next = { ...s, rules: proposed, draftStep: draftOnly ? 'stores' as const : s.draftStep, updatedAt: new Date().toISOString() };
                if (review && !activity) validatePlanRules(proposed, s.channel, scope.stores);
                if (mutate(draft => { draft.schemes = draft.schemes.map(item => item.id === s.id ? next : item); })) {
                    if (draftOnly) returnAfterDraft(s.channel);
                    else location.hash = planUrl(s.id, review ? (activity ? 'period' : 'review') : '');
                }
            } catch (error) { notice((error as Error).message, true); }
        });
    }

    function drawPeriod(s: Scheme) {
        channel = s.channel;
        const rules = s.rules!;
        const targets = scope.stores.filter(store => rules.storeIds.includes(store.id));
        const zones = [...new Set(targets.map(store => store.timezone))];
        const timezone = zones.length === 1 ? zones[0] : '';
        root.innerHTML = flowHeader(4, {
            titleHtml: '活动有效期', subtitleHtml: channel === 'kiosk' ? undefined : esc(s.name + ' · ' + label(channel)),
            backHtml: `<a href="${planUrl(s.id, 'stores')}">返回选择门店</a>`,
            actionsHtml: `<button type="submit" form="bd-plan-period" class="bd-primary">下一步：核对并保存</button>${draftButton('bd-plan-period')}`,
        }) + `<div class="bd-flow-content"><form id="bd-plan-period" class="bd-card bd-plan-form">
            <dl class="bd-review-summary">
                <div><dt>适用门店</dt><dd>${esc(storeNames(rules.storeIds))}</dd></div>
                <div><dt>门店时区</dt><dd>${esc(timezone || '所选门店时区不同或未配置')}</dd></div>
            </dl>
            <div class="bd-flow-grid">
                <label>开始时间<input type="datetime-local" name="starts" required value="${timezone && rules.starts ? formatLocal(rules.starts, timezone) : ''}"></label>
                <label>结束时间<input type="datetime-local" name="ends" required value="${timezone && rules.ends ? formatLocal(rules.ends, timezone) : ''}"></label>
            </div>
            ${timezone ? '' : '<p class="bd-error">请返回选择同一时区的门店，跨时区活动请分批设置。</p>'}
            <p data-bd-notice class="bd-notice" role="status"></p>
        </form></div>`;
        const form = root.querySelector<HTMLFormElement>('#bd-plan-period')!;
        if (!timezone) root.querySelector<HTMLButtonElement>('[form=bd-plan-period].bd-primary')!.disabled = true;
        form.addEventListener('submit', event => {
            event.preventDefault();
            const fields = new FormData(form);
            const draftOnly = (event.submitter as HTMLButtonElement | null)?.value === 'draft';
            try {
                if (!timezone && !draftOnly) throw Error('请选择同一时区的门店');
                const start = String(fields.get('starts') ?? '');
                const end = String(fields.get('ends') ?? '');
                const proposed = { ...rules, timezone,
                    starts: timezone && start ? parseLocal(start, timezone) : undefined,
                    ends: timezone && end ? parseLocal(end, timezone) : undefined,
                };
                const next = { ...s, rules: proposed, draftStep: draftOnly ? 'period' as const : s.draftStep, updatedAt: new Date().toISOString() };
                if (!draftOnly) validatePlanRules(proposed, s.channel, scope.stores);
                if (mutate(draft => { draft.schemes = draft.schemes.map(item => item.id === s.id ? next : item); })) {
                    if (draftOnly) returnAfterDraft(s.channel);
                    else location.hash = planUrl(s.id, 'review');
                }
            } catch (error) { notice((error as Error).message, true); }
        });
    }

    const previewRoute = query.get('step') === 'preview';
    let previewStore = '';
    let previewDraft = false;
    function previewRelease(s: Scheme) {
        if (!flow) return data.releases.find(record => record.snapshot.id === s.id);
        return latestPlanReleases(data).find(record => record.snapshot.id === s.id &&
            record.rules.storeIds.every(id => scope.stores.some(store => store.id === id)));
    }
    function previewVersion(s: Scheme) {
        const release = previewRelease(s);
        return previewDraft || !release ? s : release.snapshot;
    }
    function previewPage(s: Scheme, version = previewVersion(s)) {
        const rules = version.rules;
        if (rules?.kind !== 'activity' || rules.pageIds.includes(page)) return version;
        const store = rules.storeIds.includes(previewStore) ? previewStore : rules.storeIds[0];
        if (!store) return newScheme(s.channel, '项目原生样式', scope.brandName);
        const now = Date.now();
        return planAt(data, store, s.channel, now).fallback?.snapshot ??
            resolveSchedule(legacyForStore(store), s.channel, now).fallback?.snapshot ??
            newScheme(s.channel, '项目原生样式', scope.brandName);
    }
    function drawPlanPreview(s: Scheme) {
        channel = s.channel;
        const release = previewRelease(s);
        const version = previewVersion(s);
        const storeOptions = scope.stores.filter(store => version.rules?.storeIds.includes(store.id));
        if (!storeOptions.some(store => store.id === previewStore)) previewStore = storeOptions[0]?.id ?? '';
        const inherited = version.rules?.kind === 'activity' && !version.rules.pageIds.includes(page);
        root.innerHTML = renderStandalonePageHeader({
            titleHtml: esc(s.name) + ' · 效果预览',
            subtitleHtml: esc(label(channel)),
            backHtml: `<a href="#${ROOT}/pages?channel=${channel}${legacy ? '&legacy=1' : ''}">返回方案列表</a>`,
        }) + `<section class="bd-card bd-schedule bd-plan-preview">
            <div class="bd-toolbar">
            ${release ? `<label>版本<select data-bd-field="preview-version"><option value="published">已发布 · V${release.version}</option><option value="draft" ${previewDraft ? 'selected' : ''}>当前草稿</option></select></label>` : '<span class="bd-tag">草稿</span>'}
            ${storeOptions.length ? `<label>门店<select data-bd-field="plan-store">${storeOptions.map(store => `<option value="${esc(store.id)}" ${store.id === previewStore ? 'selected' : ''}>${esc(store.name)}</option>`).join('')}</select></label>` : ''}
            <label>页面<select data-bd-field="schedule-page">${pages(channel).map(([id, title]) => `<option value="${id}" ${id === page ? 'selected' : ''}>${title}</option>`).join('')}</select></label>
            ${channel === 'kiosk' ? `<label>设备方向<select data-bd-field="orientation"><option value="portrait">竖屏</option><option value="landscape" ${orientation === 'landscape' ? 'selected' : ''}>横屏</option></select></label>` : ''}
            </div>${inherited ? `<p class="bd-help">本页沿用门店日常装修 · ${esc(previewPage(s).name)}</p>` : ''}
            <div class="bd-preview-stage"><iframe title="${esc(s.name)}效果预览" src="/brand-decoration-preview/index.html" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div></section>`;
    }
    type ListFilters = { channel: string; kind: string; name: string; published: string };
    const emptyListFilters = (): ListFilters => ({ channel: '', kind: '', name: '', published: '' });
    const listFilterKey = 'menusifu:brand-decoration:filters:' + dataKey;
    let listFilters = emptyListFilters();
    try { listFilters = { ...listFilters, ...JSON.parse(sessionStorage.getItem(listFilterKey) ?? '{}') }; }
    catch { /* Use the default filters when browser storage is unavailable. */ }
    const listToolbar = (legacyList = false) => {
        const options = (items: [string, string][], value: string) => items.map(([id, title]) =>
            `<option value="${id}" ${value === id ? 'selected' : ''}>${title}</option>`).join('');
        return `<form class="bd-toolbar" data-bd-list-filters>
            <label>方案名称<input type="search" name="name" maxlength="40" placeholder="搜索方案名称" value="${esc(listFilters.name)}"></label>
            <label>产线<select name="channel">${options([['','全部产线'],['kiosk',lineLabel.kiosk],['emenu',lineLabel.emenu]], listFilters.channel)}</select></label>
            ${legacyList ? '' : `<label>使用方式<select name="kind">${options([['','全部方式'],['default','日常装修'],['activity','限时装修']], listFilters.kind)}</select></label>`}
            <label>${legacyList ? '发布状态' : '上架状态'}<select name="published">${options([['','全部状态'],['draft',legacyList ? '未发布' : '未上架'],['published',legacyList ? '有发布版本' : '已上架']], listFilters.published)}</select></label>
            <button type="submit" class="bd-primary">查询</button><button type="button" data-bd-action="reset-plan-filters">重置</button>
        </form>`;
    };
    const matchesList = (s: Scheme, published: boolean, rules = s.rules) =>
        (!listFilters.channel || s.channel === listFilters.channel) &&
        (!listFilters.kind || rules?.kind === listFilters.kind) &&
        (!listFilters.published || published === (listFilters.published === 'published')) &&
        s.name.toLowerCase().includes(listFilters.name.toLowerCase());
    function applyListFilters(filters: ListFilters) {
        listFilters = filters;
        try { sessionStorage.setItem(listFilterKey, JSON.stringify(filters)); } catch { /* Keep filters for this view. */ }
        draw();
    }
    function drawPlanList() {
        const releases = latestPlanReleases(data);
        const plans = data.schemes.flatMap(item => {
            if (!item.rules || !item.rules.storeIds.every(id => scope.stores.some(store => store.id === id))) return [];
            const release = releases.find(record => record.snapshot.id === item.id);
            const rules = release?.rules ?? item.rules;
            if (!rules.storeIds.every(id => scope.stores.some(store => store.id === id)) || !matchesList(item, !!release, rules)) return [];
            return [{ item, release, rules }];
        });
        const createChannel = listFilters.channel === 'emenu' || listFilters.channel === 'kiosk' ? listFilters.channel : channel;
        root.innerHTML = `<header class="bd-heading bd-plan-list-header">
            <h1>页面装修</h1>
            ${scope.canWrite ? `<a class="bd-button bd-primary" href="${planUrl('new', '', createChannel)}">新建装修方案</a>`
                : '<span class="bd-tag">只读</span>'}
        </header>${listNotice()}` + listToolbar() +
            `<div class="bd-table-wrap"><table><thead><tr><th>方案名称</th><th>使用方式</th><th>渠道</th><th>适用门店</th><th>生效时间</th><th>状态</th><th>操作</th></tr></thead><tbody>
            ${plans.map(({ item, release, rules }) => {
                const now = Date.now();
                const activeStores = rules.storeIds.filter(id => planAt(data, id, item.channel, now).fallback?.snapshot.id === item.id);
                const state = !release ? (item.draftStep ? '草稿' : '未上架') : rules.kind === 'activity' ?
                    (now < rules.starts! ? '待开始' : now >= rules.ends! ? '已结束' : '进行中') :
                    activeStores.length === rules.storeIds.length ? '日常使用中' : activeStores.length ? '部分门店使用中' : '已被替换';
                return `<tr><td>${esc(item.name)}${rules.activityName ? `<small>${esc(rules.activityName)}</small>` : ''}</td><td>${rules.kind === 'activity' ? '限时装修' : '日常装修'}</td><td>${lineLabel[item.channel]}</td><td>${esc(storeNames(rules.storeIds))}</td><td>${esc(period(rules))}</td><td>${release ? '已上架 · ' : ''}${state}</td><td><a class="bd-link" href="${planUrl(item.id, 'preview', item.channel)}" aria-label="${esc(item.name)}效果预览">效果预览</a>${scope.canWrite ? `
                    ${release ? '' : `<a class="bd-link" href="${planUrl(item.id, resumeStep(item), item.channel)}">编辑</a>`}
                    <button class="bd-link" data-bd-action="${release ? 'plan-off-shelf' : 'plan-on-shelf'}" data-id="${esc(item.id)}" ${!release && item.draftStep ? 'disabled' : ''}>${release ? '下架' : '上架'}</button>
                    <button class="bd-link" data-bd-action="duplicate" data-id="${esc(item.id)}">复制</button>
                    ${release ? '' : `<button class="bd-link" data-bd-action="plan-delete" data-id="${esc(item.id)}">删除</button>`}` : ''}</td></tr>`;
            }).join('') || '<tr><td colspan="7" class="bd-empty">没有符合条件的装修方案</td></tr>'}
            </tbody></table></div><div class="bd-pagination">共 ${plans.length} 个方案</div>${legacyAvailable ? `<p><a class="bd-link" href="#${ROOT}/pages?channel=${channel}&legacy=1">查看已有装修数据</a></p>` : ''}`;
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
    function drawReview(s: Scheme) {
        channel = s.channel;
        const rules = s.rules!;
        const activity = rules.kind === 'activity';
        const now = Date.now();
        const selected = pages(channel).filter(([id]) => !activity || rules.pageIds.includes(id));
        const summary = [
            ['使用方式', activity ? '限时装修' : '日常装修'],
            ['渠道', label(channel)],
            ['方案主题色', describePalette(s.paletteId, s.primary)],
            ['页面顶部', SHARED_HEADER_STYLES[sharedHeaderLayout(s.sharedHeader)]],
            ['适用门店', storeNames(rules.storeIds)],
            ['生效时间', activity ? period(rules) : '长期有效'],
            ...(activity && rules.activityName ? [['活动名称', rules.activityName]] : []),
            ['装修页面', selected.length === pages(channel).length ? '全部 ' + selected.length + ' 页' : selected.map(([, name]) => name).join('、')],
        ];
        root.innerHTML = flowHeader(activity ? 5 : 4, {
            titleHtml: esc(s.name),
            subtitleHtml: esc(scope.brandName),
            backHtml: `<a href="${planUrl(s.id, activity ? 'period' : 'stores')}">返回上一步</a>`,
            actionsHtml: scope.canWrite ? `<button class="bd-primary" data-bd-action="save-reviewed">保存</button>${draftButton()}` : '',
        }) + `<div class="bd-flow-content">
            <section class="bd-card bd-review-card"><h2>发布摘要</h2>
            <dl class="bd-review-summary">${summary.map(([title, value]) => `<div><dt>${title}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></section>
            <section class="bd-card bd-review-card"><h2>门店生效预览</h2>
            <div class="bd-table-wrap"><table><thead><tr><th>门店</th><th>${activity ? '活动期间' : '当前日常装修'}</th><th>${activity ? '结束后恢复' : '上架后日常装修'}</th></tr></thead>
            <tbody>${rules.storeIds.map(id => {
                const fallback = planAt(data, id, channel, now).fallback?.snapshot.name ??
                    resolveSchedule(legacyForStore(id), channel, now).fallback?.snapshot.name ?? '项目原生样式';
                return `<tr><td>${esc(storeNames([id]))}</td><td>${esc(activity ? s.name : fallback)}</td><td>${esc(activity ? fallback : s.name)}</td></tr>`;
            }).join('')}</tbody></table></div>
            ${activity ? '<p class="bd-help">活动结束时恢复届时生效的日常装修。</p>' : ''}
            <div data-bd-notice class="bd-notice ${messageError ? 'bd-error' : ''}" role="${messageError ? 'alert' : 'status'}">${esc(message)}</div></section></div>`;
    }

    function draw() {
        const editing = flow && !previewRoute ? scheme() : undefined;
        if (editing && latestPlanReleases(data).some(release => release.snapshot.id === editing.id)) {
            location.hash = planUrl(editing.id, 'preview', editing.channel);
            return;
        }
        const currentPath = route();
        if (flow && (editorId === 'new' || (query.get('step') === 'rules' && scheme()))) {
            if (scope.canWrite) drawRules();
            else root.innerHTML = '<p role="alert">暂无装修编辑权限</p><a href="#/brand-decoration/pages">返回方案列表</a>';
            return;
        }
        const storeScheme = flow && query.get('step') === 'stores' ? scheme() : undefined;
        if (storeScheme?.rules && scope.canWrite) { drawStores(storeScheme); return; }
        const periodScheme = flow && query.get('step') === 'period' ? scheme() : undefined;
        if (periodScheme?.rules?.kind === 'activity' && scope.canWrite) {
            if (!periodScheme.rules.storeIds.length) drawStores(periodScheme);
            else drawPeriod(periodScheme);
            return;
        }
        const reviewScheme = flow && query.get('step') === 'review' ? scheme() : undefined;
        if (reviewScheme?.rules) {
            if (scope.canWrite && (!reviewScheme.rules.storeIds.length ||
                (reviewScheme.rules.kind === 'activity' && (!reviewScheme.rules.starts || !reviewScheme.rules.ends)))) {
                if (reviewScheme.rules.storeIds.length) drawPeriod(reviewScheme);
                else drawStores(reviewScheme);
                return;
            }
            drawReview(reviewScheme);
            return;
        }
        if (editorId) {
            const selected = scheme();
            if (previewRoute && selected) { drawPlanPreview(selected); return; }
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
        const schemes = data.schemes.filter(s => matchesList(s, data.releases.some(r => r.snapshot.id === s.id)));
        root.innerHTML = heading('页面装修', '统一品牌形象，分别管理 Kiosk 与 eMenu 的页面体验。', `<button data-bd-action="schedule-toggle">日常装修与活动排期</button><a class="bd-button" href="#${ROOT}/pages?channel=${channel}">返回装修方案</a>`) + tip() + listToolbar(true) + `<div class="bd-table-wrap"><table><thead><tr><th>方案名称</th><th>页面数量</th><th>自定义页面</th><th>演示版本</th><th>草稿更新时间</th><th>操作</th></tr></thead><tbody>${schemes.map(s => { const release = data.releases.find(r => r.snapshot.id === s.id); return `<tr><td><strong>${esc(s.name)}</strong><small>${lineLabel[s.channel]}</small></td><td>${pages(s.channel).length} 页</td><td>${Object.values(s.styles).filter(s => s.mode === 'custom').length} 页</td><td>${release ? `<span class="bd-tag">V${release.version}</span>` : '<span class="bd-muted">未发布</span>'}</td><td>${date(s.updatedAt)}</td><td><a class="bd-link" href="#${ROOT}/pages/edit/${s.id}">${scope.canWrite ? '装修' : '查看'}</a><a class="bd-link" href="#${ROOT}/pages/edit/${esc(s.id)}?step=preview" aria-label="${esc(s.name)}效果预览">效果预览</a><button class="bd-link" data-bd-action="duplicate" data-id="${s.id}" ${writable()}>复制</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="bd-empty">没有符合条件的装修方案，请调整筛选条件。</td></tr>'}</tbody></table></div><div class="bd-pagination">共 ${schemes.length} 个方案</div>`;
    }
    function paletteControls(s: Scheme) {
        const selected = s.paletteId;
        const options = Object.entries(PALETTES).map(([id, palette]) => {
            const colors = resolvePalette(id as PaletteId, palette.primary)!;
            return `<button type="button" class="bd-palette-option"
                data-bd-action="palette" data-value="${id}" aria-pressed="${selected === id}" ${writable()}>
                <span class="bd-palette-swatches" aria-hidden="true">${[colors.primary, colors.background, colors.ink, colors.successText].map(color =>
                    `<i style="background:${color}"></i>`).join('')}</span>${palette.name}</button>`;
        }).join('');
        return `<section class="bd-card bd-palette-panel" aria-label="方案主题">
            <div><h2>方案主题</h2>${selected ? '' : '<p class="bd-help">当前沿用原配色，选择主题色后统一应用。</p>'}</div>
            <div class="bd-palette-options">${options}
                <button type="button" class="bd-palette-option" data-bd-action="palette" data-value="custom"
                    aria-pressed="${selected === 'custom'}" ${writable()}>自定义</button>
                ${!selected || selected === 'custom' ? `<label class="bd-palette-custom"><span>主色</span><input type="color"
                    data-bd-field="primary" value="${s.primary}" ${writable()}><code>${s.primary}</code></label>` : ''}
            </div></section>`;
    }
    function sendPreview(s: Scheme, frame = root.querySelector<HTMLIFrameElement>('[data-bd-frame]')) {
        frame?.contentWindow?.postMessage({
            type: 'bd-render', scheme: { ...s, brandName: scope.brandName },
            palette: resolvePalette(s.paletteId, s.primary),
            headerPalette: sharedHeaderLayout(s.sharedHeader) === 'custom' ? resolvePalette(s.paletteId ?? 'custom', s.primary) : undefined,
            elements: s.channel === 'kiosk' ? pageElements(page).flatMap(field => {
                const selector = s.styles[page].mode === 'custom' ? field.custom : field.native;
                return selector ? [{ id: field.id, kind: field.kind, selector, value: s.pageContent?.[page]?.[field.id] }] : [];
            }) : [],
            page, orientation,
        }, location.origin);
    }
    function updateEditorPreview(s: Scheme) {
        const inherits = flow && s.rules?.kind === 'activity' && !s.rules.pageIds.includes(page);
        if (!inherits) sendPreview(s);
    }
    function sharedComponentControls(s: Scheme) {
        const selected = sharedHeaderLayout(s.sharedHeader);
        const options = Object.entries(SHARED_HEADER_STYLES).map(([id, name]) =>
            `<option value="${id}" ${id === selected ? 'selected' : ''}>${name}</option>`).join('');
        return `<fieldset class="bd-shared-components" ${writable()}><legend>共用组件</legend>
            <label>顶栏布局<select data-bd-field="shared-header">${options}</select></label></fieldset>`;
    }
    const wideWorkbench = window.matchMedia('(min-width: 1280px)');
    let narrowContentOpen = false;
    function syncContentPanel() {
        const panel = root.querySelector<HTMLDetailsElement>('.bd-content-panel');
        if (panel) panel.open = wideWorkbench.matches || narrowContentOpen;
    }
    function pageContentPanel(s: Scheme, mode: string) {
        const fields = pageContentControls(s, mode);
        const empty = mode === 'inherit' ? '此页沿用门店日常装修。' : '当前页面布局暂无可编辑内容。';
        return `<details class="bd-card bd-content-panel" ${wideWorkbench.matches || narrowContentOpen ? 'open' : ''}>
            <summary data-bd-action="toggle-content-panel">页面内容</summary>
            <div class="bd-content-panel-body">
                <h2>页面内容</h2>
                ${fields || `<p class="bd-help">${empty}</p>`}
            </div>
        </details>`;
    }
    function pageContentControls(s: Scheme, mode: string) {
        if (s.channel !== 'kiosk' || mode === 'inherit') return '';
        const content = s.pageContent?.[page] ?? {};
        const elements = pageElements(page).filter(field => mode === 'custom' ? field.custom : field.native);
        if (!elements.length) return '';
        return `<fieldset class="bd-page-content" aria-label="页面内容" ${writable()}>
            ${elements.map(field => {
                const value = content[field.id];
                const attrs = `data-bd-field="element" data-element="${field.id}"`;
                const control = field.kind === 'image'
                    ? `<input type="file" ${attrs} accept="image/png,image/jpeg,image/webp"><small>${value ? '已替换图片' : 'PNG、JPEG、WebP，最大 120 KB'}</small>`
                    : field.kind === 'hidden'
                        ? `<input type="checkbox" ${attrs} ${value ? 'checked' : ''}>`
                        : `<input ${attrs} maxlength="${MAX_PAGE_TEXT}" placeholder="使用默认文案" value="${esc(typeof value === 'string' ? value : '')}">`;
                const reset = value === undefined ? '' : `<button type="button" class="bd-link" data-bd-action="reset-element" data-value="${field.id}" aria-label="恢复${field.label}">恢复默认</button>`;
                return `<div><label>${field.label}${control}</label>${reset}</div>`;
            }).join('')}
            ${Object.keys(content).length ? '<button type="button" class="bd-link" data-bd-action="reset-page-content">恢复整页内容</button>' : ''}
        </fieldset>`;
    }
    function savePageElement(s: Scheme, targetPage: string, id?: string, value?: string | true) {
        if (mutate(next => {
            const current = next.schemes.find(item => item.id === s.id)!;
            const overrides = { ...current.pageContent };
            const values = { ...overrides[targetPage] };
            if (id && value) values[id] = value;
            else if (id) delete values[id];
            if (id && Object.keys(values).length) overrides[targetPage] = values;
            else delete overrides[targetPage];
            current.pageContent = Object.keys(overrides).length ? overrides : undefined;
            current.updatedAt = new Date().toISOString();
            validateScheme(current);
        })) {
            const updated = scheme()!;
            const mode = updated.styles[page].mode;
            const controls = root.querySelector('.bd-page-content');
            if (controls) controls.outerHTML = pageContentControls(updated, mode);
            updateEditorPreview(updated);
        }
    }
    function drawEditor() {
        const s = scheme();
        if (!s) {
            root.innerHTML = '<div class="bd-empty">方案不存在或已移除。<a href="#/brand-decoration/pages">返回方案列表</a></div>';
            return;
        }
        channel = s.channel;
        const style = s.styles[page];
        const activity = s.rules?.kind === 'activity';
        const inherited = activity && !s.rules!.pageIds.includes(page);
        const previewStores = scope.stores.filter(store => s.rules?.storeIds.includes(store.id));
        if (!previewStores.some(store => store.id === previewStore)) previewStore = previewStores[0]?.id ?? '';
        const storePicker = inherited && previewStores.length ? `<label>预览门店<select data-bd-field="plan-store">${previewStores.map(store =>
            `<option value="${esc(store.id)}" ${store.id === previewStore ? 'selected' : ''}>${esc(store.name)}</option>`).join('')}</select></label>` : '';
        const pageOptions = pages(channel).map(([id, name]) => {
            const inherits = activity && !s.rules!.pageIds.includes(id);
            const suffix = inherits ? ' · 沿用日常装修' : s.styles[id].mode === 'custom' ? ' · 自定义布局' : '';
            return `<option value="${id}" ${id === page ? 'selected' : ''}>${name}${suffix}</option>`;
        }).join('');
        const currentMode = inherited ? 'inherit' : style.mode;
        const modes = activity
            ? [['inherit', '沿用日常装修'], ['default', '系统布局'], ['custom', '自定义布局']]
            : [['default', '系统布局'], ['custom', '自定义布局']];
        const modeControls = modes.map(([value, title]) =>
            `<label class="bd-radio"><input type="radio" name="bd-mode" data-bd-field="mode" value="${value}" ${currentMode === value ? 'checked' : ''}>${title}</label>`).join('');
        root.innerHTML = (flow ? flowHeader.bind(null, 2) : renderStandalonePageHeader)({ titleHtml: esc(s.name), backHtml: `<a href="#${ROOT}/pages?channel=${channel}${legacy ? "&legacy=1" : ""}">返回方案列表</a>`, subtitleHtml: channel === 'kiosk' ? undefined : esc(label(channel)), actionsHtml: `${flow && scope.canWrite ? `<a class="bd-button" href="${planUrl(s.id, "rules")}">上一步：方案信息</a>` : ""}<button data-bd-action="publish" class="bd-primary" ${writable()}>${flow ? "下一步：选择门店" : "发布演示版本"}</button>${flow && scope.canWrite ? draftButton() : ''}` }) + (flow ? `<div data-bd-notice class="bd-notice ${messageError ? 'bd-error' : ''}" role="${messageError ? 'alert' : 'status'}">${esc(message)}</div>` : tip()) + paletteControls(s) + `<div class="bd-workbench"><aside class="bd-card bd-config"><h2>页面与样式</h2>${sharedComponentControls(s)}<label>装修页面<select data-bd-field="page">${pageOptions}</select></label><fieldset ${writable()}><legend>页面布局</legend>${modeControls}</fieldset>${currentMode === 'custom' ? `<div class="bd-themes" role="group" aria-label="当前页面模板"><h3>页面模板</h3>${(Object.keys(PAGE_TEMPLATES) as Theme[]).map(id => `<button class="bd-theme ${style.theme === id ? 'is-selected' : ''}" data-bd-action="theme" data-value="${id}" aria-pressed="${style.theme === id}" ${writable()}><i class="bd-template-mark" data-layout="${id}" aria-hidden="true"></i><span><b>${PAGE_TEMPLATES[id].name}</b><small>${PAGE_TEMPLATES[id].note}</small></span><span>${style.theme === id ? '✓' : ''}</span></button>`).join('')}</div><button class="bd-wide" data-bd-action="suite" ${writable()}>将当前模板应用到全部 ${pages(channel).length} 页</button>` : ''} ${storePicker}${legacy ? `<label>方案名称<input data-bd-field="name" value="${esc(s.name)}" maxlength="40" ${writable()}></label>` : ''}</aside><section class="bd-preview"><div class="bd-preview-toolbar"><strong>顾客端效果预览</strong><label>${channel === 'kiosk' ? `<select data-bd-field="orientation"><option value="portrait" ${orientation === 'portrait' ? 'selected' : ''}>24 寸 · 1080 × 1920</option><option value="landscape" ${orientation === 'landscape' ? 'selected' : ''}>14 寸 · 1920 × 1080</option></select>` : '移动端 · 390 × 844'}</label></div><div class="bd-preview-stage">${inherited && !previewStores.length ? '<p class="bd-help">选择门店后可预览日常装修</p>' : `<iframe title="${label(channel)}页面样式预览" src="/brand-decoration-preview/index.html" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe>`}</div></section>${pageContentPanel(s, currentMode)}</div>`;
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
        if (scheduleAction(action, el)) return;
        if (action === 'channel') {
            previewAt = undefined;
            page = 'home';
            channel = el.dataset.value as Channel;
            draw();
            return;
        }
        if (action === 'reset-plan-filters') { applyListFilters(emptyListFilters()); return; }
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
        if (action === 'plan-on-shelf' || action === 'plan-off-shelf' || action === 'plan-delete') {
            const id = el.dataset.id;
            const title = action === 'plan-on-shelf' ? '上架' : action === 'plan-off-shelf' ? '下架' : '删除';
            const plan = data.schemes.find(item => item.id === id);
            if (legacy || !plan?.rules || !plan.rules.storeIds.every(store => scope.stores.some(item => item.id === store))) return;
            const active = latestPlanReleases(data).find(release => release.snapshot.id === id);
            if (active && !active.rules.storeIds.every(store => scope.stores.some(item => item.id === store))) return;
            confirm(title + '方案', [{ label: '方案名称', before: plan.name, after: title }], title, () => {
                if (mutate(next => {
                    const current = next.schemes.find(item => item.id === id)!;
                    const release = next.releases.find(item => item.rules && item.snapshot.id === id);
                    const onShelf = release && !release.offShelf;
                    if (action === 'plan-off-shelf') {
                        if (!onShelf) throw Error('方案已下架');
                        release.offShelf = true;
                    } else if (action === 'plan-delete') {
                        if (onShelf) throw Error('请先下架方案');
                        next.schemes = next.schemes.filter(item => item.id !== id);
                    } else {
                        if (onShelf || current.draftStep) throw Error('请先完成并保存方案');
                        checkLegacyConflicts(current);
                        publishPlan(next, current, decorationScope().stores, getAuthenticatedEmail() || '当前账号');
                    }
                })) {
                    closeModal();
                    notice('方案已' + title);
                    draw();
                } else {
                    closeModal();
                }
            }, action === 'plan-delete' ? '删除后无法恢复该方案。' : action === 'plan-off-shelf' ? '下架后，门店将使用其他符合条件的装修。' : '上架后按适用门店和生效时间展示。');
            return;
        }
        if (action === 'duplicate') {
            const source = data.schemes.find(s => s.id === el.dataset.id);
            if (!source || (!legacy && !source.rules?.storeIds.every(id => scope.stores.some(store => store.id === id))))
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
        if (action === 'reset-page-content' || action === 'reset-element') {
            const id = action === 'reset-element' ? el.dataset.value : undefined;
            if (id) savePageElement(s, page, id);
            else {
                const target = page;
                confirm('恢复整页内容', [{ label: '页面内容', before: '已配置', after: '默认内容' }], '恢复', () => {
                    closeModal();
                    savePageElement(s, target);
                }, '当前页已修改的文案、图片和显示设置将恢复默认。');
            }
            return;
        }
        if (action === 'palette') {
            const id = el.dataset.value as PaletteId;
            if (id !== 'custom' && !Object.hasOwn(PALETTES, id)) return;
            if (mutate(next => {
                const current = next.schemes.find(item => item.id === s.id)!;
                current.primary = id === 'custom'
                    ? resolvePalette(current.paletteId, current.primary)?.primary ?? current.primary
                    : PALETTES[id].primary;
                current.paletteId = id;
                current.updatedAt = new Date().toISOString();
            })) {
                const updated = scheme()!;
                const panel = root.querySelector('.bd-palette-panel');
                if (panel) panel.outerHTML = paletteControls(updated);
                if (document.activeElement === document.body) {
                    root.querySelector<HTMLElement>(`[data-bd-action="palette"][data-value="${id}"]`)?.focus();
                }
                updateEditorPreview(updated);
            }
            return;
        }
        if (action === 'theme') {
            if (mutate(next => { const current = next.schemes.find(s => s.id === editorId)!; current.styles[page] = { mode: 'custom', theme: el.dataset.value as Theme }; current.updatedAt = new Date().toISOString(); }))
                draw();
            return;
        }
        if (action === 'suite') {
            const theme = s.styles[page].theme;
            confirm('应用整套模板', pages(channel).filter(([id]) => s.styles[id].mode !== 'custom' || s.styles[id].theme !== theme).map(([id, name]) => ({ label: name, before: s.styles[id].mode === 'default' ? '系统布局' : PAGE_TEMPLATES[s.styles[id].theme].name, after: PAGE_TEMPLATES[theme].name })), '应用到全部页面', () => { if (mutate(next => { const current = next.schemes.find(s => s.id === editorId)!; for (const [id] of pages(channel))
                current.styles[id] = { mode: 'custom', theme }; current.updatedAt = new Date().toISOString(); })) {
                closeModal();
                draw();
            } });
            return;
        }
        if (action === 'save-flow-draft' && flow && s.rules) {
            if (mutate(next => {
                const current = next.schemes.find(item => item.id === s.id)!;
                current.draftStep = query.get('step') === 'review' ? 'review' : 'editor';
                current.updatedAt = new Date().toISOString();
            })) returnAfterDraft(s.channel);
            return;
        }
        if (action === 'save-reviewed'  && flow && query.get('step') === 'review' && s.rules) {
            if (mutate(next => {
                const current = next.schemes.find(item => item.id === s.id)!;
                validatePlanRules(current.rules!, current.channel, decorationScope().stores);
                delete current.draftStep;
                current.updatedAt = new Date().toISOString();
            })) location.hash = `${ROOT}/pages?channel=${s.channel}&saved=1`;
            return;
        }
        if (action === 'publish') {
            try {
                ensureWrite();
                validateScheme(s);
                if (flow) {
                    location.hash = planUrl(s.id, 'stores');
                    return;
                }
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
    const toggleContentPanel = (event: Event) => {
        const summary = (event.target as Element).closest('[data-bd-action="toggle-content-panel"]');
        if (!summary || wideWorkbench.matches) return;
        event.preventDefault();
        narrowContentOpen = !narrowContentOpen;
        syncContentPanel();
    };
    const click = (event: Event) => { const button = (event.target as HTMLElement).closest<HTMLElement>('[data-bd-action]'); if (button && !button.hasAttribute('disabled'))
        act(button.dataset.bdAction!, button); };
    const change = (event: Event) => { const input = event.target as HTMLInputElement; const field = input.dataset.bdField; if (!field)
        return; if (field === 'preview-version') { previewDraft = input.value === 'draft'; draw(); return; } if (field === 'plan-store') { previewStore = input.value; draw(); return; } if (field === 'page' || field === 'schedule-page') {
        page = input.value;
        draw();
        return;
    } if (field === 'orientation') {
        orientation = input.value;
        draw();
        return;
    } const s = scheme();
    if (!s) return;
    if (field === 'element') {
        const id = input.dataset.element;
        const element = pageElements(page).find(item => item.id === id);
        if (!element || s.channel !== 'kiosk') return;
        if (element.kind === 'image') {
            const file = input.files?.[0];
            if (!file) return;
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > MAX_PAGE_IMAGE_BYTES) {
                input.value = '';
                notice('请选择 120 KB 以内的 PNG、JPEG 或 WebP 图片', true);
                return;
            }
            const targetPage = page;
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (root.isConnected && typeof reader.result === 'string')
                    savePageElement(s, targetPage, element.id, reader.result);
            });
            reader.addEventListener('error', () => notice('图片读取失败，请重新选择', true));
            reader.readAsDataURL(file);
        } else savePageElement(s, page, element.id, element.kind === 'hidden' ? (input.checked ? true : undefined) : input.value.trim());
        return;
    }
    if (field === 'shared-header') {
        const value = input.value as SharedHeaderStyle;
        if (mutate(next => {
            const current = next.schemes.find(item => item.id === s.id)!;
            current.sharedHeader = value;
            current.updatedAt = new Date().toISOString();
            validateScheme(current);
        })) updateEditorPreview(scheme()!);
        else input.value = sharedHeaderLayout(s.sharedHeader);
        return;
    }
    const value = input.value.trim(); if (mutate(next => { const current = next.schemes.find(item => item.id === s.id)!; if (field === 'mode') {
        if (current.rules?.kind === 'activity') {
            current.rules.pageIds = value === 'inherit' ? current.rules.pageIds.filter(id => id !== page)
                : [...new Set([...current.rules.pageIds, page])];
        }
        if (value !== 'inherit') current.styles[page].mode = value as 'default' | 'custom';
    }
    else if (field === 'name' || field === 'primary') {
        current[field] = value;
        if (field === 'primary') current.paletteId = 'custom';
    } current.updatedAt = new Date().toISOString(); validateScheme(current); })) {
        if (field === 'mode')
            draw();
        else {
            const updated = scheme()!;
            const title = root.querySelector('.standalone-page-title h1');
            if (title)
                title.textContent = updated.name;
            const code = root.querySelector('.bd-palette-custom code');
            if (code)
                code.textContent = updated.primary;
            updateEditorPreview(updated);
        }
    }
    else if (field === 'mode') draw();
    else input.value = String(s[field as 'name' | 'primary'] ?? ''); };
    const frameMessage = (event: MessageEvent) => { const frame = root.querySelector<HTMLIFrameElement>('[data-bd-frame]'); if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'bd-ready')
        return; let s = showSchedule ? selectedPreview() : scheme();
        if (s?.rules?.kind === 'activity' && !s.rules.storeIds.length && !s.rules.pageIds.includes(page)) {
            if (frame) frame.hidden = true;
            return;
        }
        if (previewRoute && s) s = previewPage(s);
        else if (flow && s?.rules?.kind === 'activity' && !s.rules.pageIds.includes(page)) {
            s = previewPage(s, s);
        }
        if (s) sendPreview(s, frame);
    };
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
    const filterSubmit = (event: SubmitEvent) => {
        const form = event.target as HTMLFormElement;
        if (!form.matches('[data-bd-list-filters]')) return;
        event.preventDefault();
        const fields = new FormData(form);
        applyListFilters({
            name: String(fields.get('name') ?? '').trim(),
            channel: String(fields.get('channel') ?? ''),
            kind: String(fields.get('kind') ?? ''),
            published: String(fields.get('published') ?? ''),
        });
    };
    root.addEventListener('submit', filterSubmit);
    root.addEventListener('click', click);
    root.addEventListener('click', toggleContentPanel);
    wideWorkbench.addEventListener('change', syncContentPanel);
    root.addEventListener('change', change);
    window.addEventListener('message', frameMessage);
    window.addEventListener('storage', storage);
    dispose = () => { window.clearInterval(scheduleClock); closeModal(); root.removeEventListener('submit', filterSubmit); root.removeEventListener('click', click); root.removeEventListener('click', toggleContentPanel); wideWorkbench.removeEventListener('change', syncContentPanel); root.removeEventListener('change', change); window.removeEventListener('message', frameMessage); window.removeEventListener('storage', storage); };
    draw();
}
