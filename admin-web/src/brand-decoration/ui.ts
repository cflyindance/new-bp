import { analyzeReferenceImage, isReferenceImage, referenceTheme, templateMatches, type HomeLayout, type HomeTemplate } from './reference-template';
import { MAX_PAGE_IMAGE_BYTES, MAX_PAGE_TEXT, PAGE_CONTENT_GROUPS, pageContentGroup, pageElements } from './page-content';
import { PALETTES, describePalette, resolvePalette, type PaletteId } from './palette';
import { latestPlanReleases, planAt, publishPlan, updatePublishedPlanStores, updateUnpublishedPlanStores, validatePlanRules, type PlanRelease, type PlanRules } from './plans';
import { effectiveEnd, emptySchedule, formatLocal, parseLocal, resolveSchedule, saveActivity, type DecorationActivity } from './schedule';
import './style.css';
import '../config/deployment-change-preview.css';
import { renderStandalonePageHeader } from '../ui/standalone-page-header';
import { renderChangePreviewDialog } from '../config/deployment-change-preview';
import { getAuthenticatedEmail } from '../auth/login';
import { decorationScope } from './scope';
import { readData, writeData } from './store';
import { createDecorationDemo } from './demo-data';
import { PAGE_TEMPLATES, SHARED_HEADER_STYLES, sharedHeaderLayout, type SharedHeaderStyle, copy, newScheme, pages, changes, publish, validateScheme, type Channel, type Theme, type Scheme, type DecorationData } from './domain';
const ROOT = '/brand-decoration';
const PAGE_STAGES = [
    { id: 'start', label: '点餐前', pages: ['screensaver', 'home', 'orderType', 'waitList', 'phoneInput', 'enterName', 'partySizeSelection', 'login'] },
    { id: 'browse', label: '浏览与选购', pages: ['menu', 'detail', 'combo', 'reward'] },
    { id: 'checkout', label: '订单与支付', pages: ['review', 'payment', 'tippingPanel', 'cardPayment', 'afterCreditCardPay', 'signature', 'connectionError'] },
    { id: 'service', label: '完成与服务', pages: ['finish', 'tableService', 'togoOption', 'chooseTable', 'paymentMember'] },
] as const;
function pageThumbnail(id: string) {
    if (['screensaver', 'home', 'detail'].includes(id)) return 'hero';
    if (['menu', 'combo', 'chooseTable', 'partySizeSelection'].includes(id)) return 'grid';
    if (['phoneInput', 'enterName', 'login', 'waitList', 'signature'].includes(id)) return 'form';
    if (['finish', 'cardPayment', 'afterCreditCardPay', 'connectionError'].includes(id)) return 'result';
    return 'cards';
}

const PREVIEW_URL = `${import.meta.env.BASE_URL}brand-decoration-preview/index.html`;
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
        const initialize = !legacy && scope.demo && scope.canWrite
            ? () => createDecorationDemo(scope.brandName, scope.stores)
            : undefined;
        data = readData(dataKey, scope.brandName, localStorage, initialize);
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
    let message = query.get('saved') === '1' ? '方案已保存' : '', messageError = false, modal: HTMLElement | undefined;
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
            notice('');
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
    const postPaymentScenes = [['both', '小费与签名'], ['tip', '仅小费'], ['signature', '仅签名']] as const;
    let postPaymentScene: typeof postPaymentScenes[number][0] = 'both';
    const postPaymentScenePicker = () => channel === 'kiosk' && page === 'afterCreditCardPay'
        ? `<label class="bd-post-payment-scene">预览场景<select data-bd-field="post-payment-scene">
            ${postPaymentScenes.map(([id, name]) => `<option value="${id}" ${id === postPaymentScene ? 'selected' : ''}>${name}</option>`).join('')}
          </select></label>`
        : '';
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
            <div class="bd-preview-stage"><iframe title="排期效果预览" src="${PREVIEW_URL}" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div></section>`;
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
    const backToPlans = () => `<a href="#${ROOT}/pages?channel=${channel}">返回方案列表</a>`;
    const previousStep = (id: string, step: string, title: string) =>
        `<a class="bd-button" href="${planUrl(id, step)}">上一步：${title}</a>`;
    const previousStepSubmit = (form: string, destination: string, title: string) =>
        `<button type="submit" form="${form}" name="destination" value="${destination}" formnovalidate>上一步：${title}</button>`;
    const returnAfterDraft = (target: Channel) => { location.hash = `${ROOT}/pages?channel=${target}`; };
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
    const period = (rules: PlanRules, showTimezone = true) => rules.kind === 'default' ? '长期' : !rules.starts || !rules.ends ? '待设置' :
        `${formatLocal(rules.starts!, rules.timezone).replace('T', ' ')} 至 ${formatLocal(rules.ends!, rules.timezone).replace('T', ' ')}${showTimezone ? ' · ' + rules.timezone : ''}`;
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
            <div data-bd-notice class="bd-notice" role="status"></div>
            </form></div>`;
        const form = root.querySelector<HTMLFormElement>('#bd-plan-rules')!;
        const update = () => {
            const activity = new FormData(form).get('kind') === 'activity';
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
                const nextRules: PlanRules = {
                    kind, starts: rules?.starts, ends: rules?.ends,
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

    function drawStores(s: Scheme, adjustment?: { release?: PlanRelease }) {
        const release = adjustment?.release;
        channel = s.channel;
        const rules = release?.rules ?? s.rules!;
        const activity = rules.kind === 'activity';
        const picked = adjustment || rules.storeIds.length ? rules.storeIds : scope.stores.length === 1 ? [scope.stores[0].id] : [];
        const regions = [...new Set(scope.stores.map(store => store.region))].sort();
        const header = adjustment ? renderStandalonePageHeader({
            titleHtml: '调整门店',
            subtitleHtml: esc(s.name),
            backHtml: backToPlans(),
            actionsHtml: '<button type="submit" form="bd-plan-stores" class="bd-primary" value="review">保存</button>',
        }) : flowHeader(3, {
            titleHtml: '选择门店', subtitleHtml: channel === 'kiosk' ? undefined : esc(s.name + ' · ' + label(channel)),
            backHtml: backToPlans(),
            actionsHtml: `<button type="submit" form="bd-plan-stores" class="bd-primary" name="destination" value="review">下一步：${activity ? '活动有效期' : '核对并保存'}</button>${previousStepSubmit('bd-plan-stores', 'editor', '装修页面')}${draftButton('bd-plan-stores')}`,
        });
        root.innerHTML = header + `<div class="bd-store-page"><form id="bd-plan-stores" class="bd-store-form">
            <div class="bd-store-layout">
              <section class="bd-card bd-store-catalog" aria-labelledby="bd-store-list-title">
                <h2 id="bd-store-list-title">门店列表</h2>
                <div class="bd-store-filters">
                  <input type="search" data-bd-store-search aria-label="搜索门店" placeholder="门店名称 / MID / 区域 / 邮编" autocomplete="off">
                  <select data-bd-store-region aria-label="区域"><option value="">全部区域</option>${regions.map(region => `<option value="${esc(region)}">${esc(region)}</option>`).join('')}</select>
                  <button type="button" data-bd-store-reset>重置</button>
                </div>
                <div class="bd-table-wrap bd-store-table"><table>
                  <thead><tr><th scope="col"><input type="checkbox" data-bd-store-all aria-label="全选当前筛选结果"></th><th scope="col">门店名称</th><th scope="col">MID</th><th scope="col">区域</th><th scope="col">邮编</th></tr></thead>
                  <tbody>${scope.stores.map(store => `<tr data-bd-store-item data-region="${esc(store.region)}">
                    <td><input type="checkbox" name="store" value="${esc(store.id)}" aria-label="${esc(store.name)}" ${picked.includes(store.id) ? 'checked' : ''}></td>
                    <td>${esc(store.name)}</td><td>${esc(store.id)}</td><td>${esc(store.region)}</td><td>${esc(store.postalCode || '—')}</td>
                  </tr>`).join('')}<tr data-bd-store-empty hidden><td colspan="5" class="bd-empty">没有符合条件的门店</td></tr></tbody>
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
            nextButton.disabled = !chosen.length || Boolean(adjustment && chosen.length === rules.storeIds.length &&
                chosen.every(store => rules.storeIds.includes(store.id)));
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
                row.hidden = ![...row.cells].slice(1).some(cell => cell.textContent!.toLowerCase().includes(search)) || (!!region && row.dataset.region !== region);
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
            if (adjustment) {
                confirmStoreAdjustment(s, release, targets.map(store => store.id));
                return;
            }
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
            backHtml: backToPlans(),
            actionsHtml: `<button type="submit" form="bd-plan-period" class="bd-primary">下一步：核对并保存</button>${previousStepSubmit('bd-plan-period', 'stores', '选择门店')}${draftButton('bd-plan-period')}`,
        }) + `<div class="bd-flow-content"><form id="bd-plan-period" class="bd-card bd-plan-form">
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
            const destination = (event.submitter as HTMLButtonElement | null)?.value;
            const draftOnly = destination === 'draft';
            const goingBack = destination === 'stores';
            if (goingBack && !timezone) {
                location.hash = planUrl(s.id, 'stores');
                return;
            }
            try {
                if (!timezone && !draftOnly) throw Error('请选择同一时区的门店');
                const start = String(fields.get('starts') ?? '');
                const end = String(fields.get('ends') ?? '');
                const proposed = { ...rules, timezone,
                    starts: timezone && start ? parseLocal(start, timezone) : undefined,
                    ends: timezone && end ? parseLocal(end, timezone) : undefined,
                };
                const next = { ...s, rules: proposed, draftStep: draftOnly ? 'period' as const : s.draftStep, updatedAt: new Date().toISOString() };
                if (!draftOnly && !goingBack) validatePlanRules(proposed, s.channel, scope.stores);
                if (mutate(draft => { draft.schemes = draft.schemes.map(item => item.id === s.id ? next : item); })) {
                    if (draftOnly) returnAfterDraft(s.channel);
                    else location.hash = planUrl(s.id, goingBack ? 'stores' : 'review');
                }
            } catch (error) { notice((error as Error).message, true); }
        });
    }

    const previewRoute = query.get('step') === 'preview';
    let previewStore = '';
    function previewRelease(s: Scheme) {
        if (!flow) return data.releases.find(record => record.snapshot.id === s.id);
        return latestPlanReleases(data).find(record => record.snapshot.id === s.id &&
            record.rules.storeIds.every(id => scope.stores.some(store => store.id === id)));
    }
    function previewVersion(s: Scheme) {
        const release = previewRelease(s);
        return release?.snapshot ?? s;
    }
    function previewPage(s: Scheme, version = previewVersion(s)) {
        const rules = version.rules;
        if (rules?.kind !== 'activity' || rules.pageIds.includes(page)) return version;
        const store = rules.storeIds.includes(previewStore) ? previewStore : previewRoute ? undefined : rules.storeIds[0];
        if (!store) return newScheme(s.channel, '项目原生样式', scope.brandName);
        const now = Date.now();
        return planAt(data, store, s.channel, now).fallback?.snapshot ??
            resolveSchedule(legacyForStore(store), s.channel, now).fallback?.snapshot ??
            newScheme(s.channel, '项目原生样式', scope.brandName);
    }
    const workbenchViewport = root.closest<HTMLElement>('[data-decoration-workbench]');
    function fitPreviewStage() {
        const stage = root.querySelector<HTMLElement>('.bd-workbench .bd-preview-stage');
        if (!stage) return;
        const viewportTop = workbenchViewport?.getBoundingClientRect().top ?? 0;
        const viewportHeight = workbenchViewport?.clientHeight ?? window.innerHeight;
        const scrollTop = workbenchViewport?.scrollTop ?? window.scrollY;
        const stageTop = stage.getBoundingClientRect().top - viewportTop + scrollTop;
        const height = Math.max(220, Math.floor(viewportHeight - stageTop - 16));
        const value = height + 'px';
        if (stage.style.getPropertyValue('--bd-preview-height') !== value)
            stage.style.setProperty('--bd-preview-height', value);
    }
    const previewResize = new ResizeObserver(fitPreviewStage);
    function observePreviewLayout() {
        previewResize.disconnect();
        if (workbenchViewport) previewResize.observe(workbenchViewport);
        previewResize.observe(root);
        for (const element of root.querySelectorAll('.standalone-page-header,.bd-palette-panel,.bd-preview-toolbar,.bd-preview > .bd-help,.bd-content-panel'))
            previewResize.observe(element);
        fitPreviewStage();
    }

    function previewDirectionControls(selected = orientation, groupName = 'bd-preview-direction') {
        return `<fieldset class="bd-preview-direction" aria-label="预览方向"><div>
                <label><input type="radio" name="${groupName}" data-bd-field="orientation" value="portrait" ${selected === 'portrait' ? 'checked' : ''}><span>竖版</span></label>
                <label><input type="radio" name="${groupName}" data-bd-field="orientation" value="landscape" ${selected === 'landscape' ? 'checked' : ''}><span>横版</span></label>
            </div></fieldset>`;
    }
    function drawPlanPreview(s: Scheme) {
        channel = s.channel;
        const version = previewVersion(s);
        previewStore = scope.stores.find(store => version.rules?.storeIds.includes(store.id))?.id ?? '';
        const scrollRegions = ['.bd-plan-preview', '.bd-plan-preview > .bd-config'];
        const scrollOffsets = scrollRegions.map(selector => root.querySelector(selector)?.scrollTop ?? 0);
        const previousGrid = root.querySelector<HTMLElement>('[data-bd-page-cards]');
        if (previousGrid) pageCardsScroll = previousGrid.scrollTop;
        const inherited = version.rules?.kind === 'activity' && !version.rules.pageIds.includes(page);
        root.innerHTML = renderStandalonePageHeader({
            titleHtml: esc(s.name) + ' · 效果预览',
            subtitleHtml: channel === 'kiosk' ? undefined : esc(label(channel)),
            backHtml: `<a href="#${ROOT}/pages?channel=${channel}${legacy ? '&legacy=1' : ''}">返回方案列表</a>`,
        }) + `<div class="bd-plan-preview">
            <aside class="bd-card bd-config">${pagePicker(s, true)}</aside>
            <section class="bd-preview">
            <div class="bd-preview-toolbar">
            <strong>顾客端效果预览</strong>
            ${postPaymentScenePicker()}
            ${previewDirectionControls()}
            </div>${inherited ? `<p class="bd-help">本页沿用日常装修 · ${esc(previewPage(s, version).name)}</p>` : ''}
            <div class="bd-preview-stage"><iframe title="${esc(s.name)}效果预览" src="${PREVIEW_URL}" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe></div>
            </section></div>`;
        restorePagePicker();
        scrollRegions.forEach((selector, index) => {
            const region = root.querySelector(selector);
            if (region) region.scrollTop = scrollOffsets[index];
        });
    }
    type ListFilters = { channel: string; kind: string; name: string; published: string };
    const emptyListFilters = (): ListFilters => ({ channel: '', kind: '', name: '', published: '' });
    const releasesView = route() === ROOT + '/releases';
    const listFilterKey = 'menusifu:brand-decoration:filters:' + dataKey + (releasesView ? ':releases' : '');
    let listFilters = emptyListFilters();
    try { listFilters = { ...listFilters, ...JSON.parse(sessionStorage.getItem(listFilterKey) ?? '{}') }; }
    catch { /* Use the default filters when browser storage is unavailable. */ }
    const listToolbar = (legacyList = false) => {
        const options = (items: [string, string][], value: string) => items.map(([id, title]) =>
            `<option value="${id}" ${value === id ? 'selected' : ''}>${title}</option>`).join('');
        return `<form class="bd-toolbar" data-bd-list-filters>
            <label>方案名称<input type="search" name="name" maxlength="40" placeholder="搜索方案名称" value="${esc(listFilters.name)}"></label>
            <label>产线<select name="channel">${options([['','全部产线'],['kiosk',lineLabel.kiosk],['emenu',lineLabel.emenu]], listFilters.channel)}</select></label>
            ${legacyList || releasesView ? '' : `<label>使用方式<select name="kind">${options([['','全部方式'],['default','日常装修'],['activity','限时装修']], listFilters.kind)}</select></label>`}
            ${releasesView ? '' : `<label>${legacyList ? '发布状态' : '上架状态'}<select name="published">${options([['','全部状态'],['draft',legacyList ? '未发布' : '未上架'],['published',legacyList ? '有发布版本' : '已上架']], listFilters.published)}</select></label>`}
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
    const releaseInScope = (record: DecorationData['releases'][number]) =>
        !record.rules || record.rules.storeIds.every(id => scope.stores.some(store => store.id === id));
    function drawReleaseList() {
        const records = data.releases.filter(record => releaseInScope(record) &&
            (!listFilters.channel || record.snapshot.channel === listFilters.channel) &&
            record.snapshot.name.toLowerCase().includes(listFilters.name.toLowerCase()));
        root.innerHTML = `<header class="bd-heading bd-plan-list-header"><h1>发布记录</h1></header>` + listNotice() + listToolbar() +
            `<div class="bd-table-wrap"><table>
                <thead><tr><th>版本</th><th>装修方案</th><th>产线</th><th>发布范围</th><th>发布时间</th><th>操作人</th><th>结果</th><th>操作</th></tr></thead>
                <tbody>${records.map(record => `<tr><td>V${record.version}</td><td>${esc(record.snapshot.name)}</td>
                    <td>${lineLabel[record.snapshot.channel]}</td><td>${esc(record.scopeName)}</td><td>${date(record.createdAt)}</td>
                    <td>${esc(record.actor)}</td><td><span class="bd-tag">演示版本已生成</span></td>
                    <td><button class="bd-link" data-bd-action="record" data-id="${esc(record.id)}">查看快照</button></td></tr>`).join('')
                    || `<tr><td colspan="8" class="bd-empty">${listFilters.channel || listFilters.name ? '没有符合条件的发布记录' : '暂无发布记录'}</td></tr>`}</tbody>
            </table></div><div class="bd-pagination">共 ${records.length} 条记录</div>`;
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
                return `<tr><td>${esc(item.name)}</td><td>${rules.kind === 'activity' ? '限时装修' : '日常装修'}</td><td>${lineLabel[item.channel]}</td><td>${(scope.canWrite || rules.storeIds.length) ? `<button type="button" class="bd-link bd-store-count" data-bd-action="plan-stores" data-id="${esc(item.id)}" aria-haspopup="dialog" aria-label="${esc(item.name)}适用门店，${rules.storeIds.length} 家">${rules.storeIds.length} 家</button>` : '0 家'}</td><td>${esc(period(rules, false))}</td><td>${release ? '已上架 · ' : ''}${state}</td><td><a class="bd-link" href="${planUrl(item.id, 'preview', item.channel)}" aria-label="${esc(item.name)}效果预览">效果预览</a>${scope.canWrite ? `
                    ${release ? '' : `<a class="bd-link" href="${planUrl(item.id, resumeStep(item), item.channel)}">编辑</a>`}
                    <button class="bd-link" data-bd-action="${release ? 'plan-off-shelf' : 'plan-on-shelf'}" data-id="${esc(item.id)}" ${!release && item.draftStep ? 'disabled' : ''}>${release ? '下架' : '上架'}</button>
                    <button class="bd-link" data-bd-action="duplicate" data-id="${esc(item.id)}">复制</button>
                    ${release ? '' : `<button class="bd-link" data-bd-action="plan-delete" data-id="${esc(item.id)}">删除</button>`}` : ''}</td></tr>`;
            }).join('') || '<tr><td colspan="7" class="bd-empty">没有符合条件的装修方案</td></tr>'}
            </tbody></table></div><div class="bd-pagination">共 ${plans.length} 个方案</div>${legacyAvailable ? `<p><a class="bd-link" href="#${ROOT}/pages?channel=${channel}&legacy=1">查看已有装修数据</a></p>` : ''}`;
    }

    function openPlanStores(id: string) {
        const plan = data.schemes.find(item => item.id === id);
        const storesById = new Map(scope.stores.map(store => [store.id, store]));
        if (!plan?.rules || !plan.rules.storeIds.every(storeId => storesById.has(storeId))) return;
        const release = latestPlanReleases(data).find(item => item.snapshot.id === id);
        const rule = release?.rules ?? plan.rules;
        const stores = rule.storeIds.map(storeId => storesById.get(storeId));
        if (!stores.every(store => store !== undefined) || (!stores.length && !scope.canWrite)) return;
        openModal(`<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-plan-stores-title">
            <div class="bd-modal-backdrop" data-bd-modal-close aria-hidden="true"></div>
            <section class="bd-modal-panel bd-plan-stores-dialog">
                <header><button type="button" data-bd-modal-close aria-label="关闭">×</button><h2 id="bd-plan-stores-title">适用门店</h2>
                    ${scope.canWrite ? `<a class="bd-button bd-primary" href="${planUrl(id, 'adjust-stores', plan.channel)}">调整门店</a>` : ''}</header>
                <div class="bd bd-plan-stores-dialog-body">
                    <input type="search" class="bd-plan-stores-search" data-bd-plan-stores-search ${stores.length ? '' : 'hidden'} aria-label="搜索门店" placeholder="门店名称 / MID / 区域 / 邮编">
                    <div class="bd-table-wrap" tabindex="0" role="region" aria-label="适用门店列表"><table>
                        <thead><tr><th scope="col">门店名称</th><th scope="col">MID</th><th scope="col">区域</th><th scope="col">邮编</th></tr></thead>
                        <tbody>${stores.map(store => `<tr data-bd-plan-store-row><td>${esc(store.name)}</td><td>${esc(store.id)}</td><td>${esc(store.region)}</td><td>${esc(store.postalCode || '—')}</td></tr>`).join('')}
                        <tr data-bd-plan-stores-empty ${stores.length ? 'hidden' : ''}><td class="bd-empty" colspan="4">${stores.length ? '没有符合条件的门店' : '尚未选择门店'}</td></tr></tbody>
                    </table></div>
                </div>
            </section>
        </div>`);
        const search = modal!.querySelector<HTMLInputElement>('[data-bd-plan-stores-search]')!;
        const rows = Array.from(modal!.querySelectorAll<HTMLTableRowElement>('[data-bd-plan-store-row]'));
        const empty = modal!.querySelector<HTMLTableRowElement>('[data-bd-plan-stores-empty]')!;
        search.addEventListener('input', () => {
            const query = search.value.trim().toLocaleLowerCase();
            rows.forEach((row, index) => {
                const { name, id, region, postalCode } = stores[index];
                row.hidden = ![name, id, region, postalCode].some(value => value?.toLocaleLowerCase().includes(query));
            });
            empty.hidden = rows.some(row => !row.hidden);
        });
    }

    function legacyForStore(id: string) {
        return readData(scope.brand + '/' + id, scope.brandName);
    }
    function confirmStoreAdjustment(s: Scheme, release: PlanRelease | undefined, storeIds: string[]) {
        const rules = release?.rules ?? s.rules!;
        const added = storeIds.filter(id => !rules.storeIds.includes(id));
        const removed = rules.storeIds.filter(id => !storeIds.includes(id));
        if (!storeIds.length || (!added.length && !removed.length)) return;
        const rows = [
            ...(added.length ? [{ label: '新增门店', before: '—', after: storeNames(added) }] : []),
            ...(removed.length ? [{ label: '移除门店', before: storeNames(removed), after: '—' }] : []),
        ];
        confirm('确认调整门店', rows, '确认保存', () => {
            if (mutate(next => {
                const now = Date.now();
                const stores = decorationScope().stores;
                if (!release) {
                    updateUnpublishedPlanStores(next, s.id, storeIds, stores, now);
                    return;
                }
                if (release.rules.kind === 'activity' && release.rules.ends! > now && added.length)
                    checkLegacyConflicts({ ...release.snapshot, rules: { ...release.rules, storeIds: added, starts: Math.max(now, release.rules.starts!) } });
                updatePublishedPlanStores(next, release.snapshot.id, release.id, storeIds, stores, getAuthenticatedEmail() || '当前账号', now);
            })) {
                closeModal();
                location.hash = `${ROOT}/pages?channel=${s.channel}&saved=1`;
            } else {
                closeModal();
            }
        }, release ? '保存后按调整后的门店范围生效。' : '');
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
            ['装修页面', selected.length === pages(channel).length ? '全部 ' + selected.length + ' 页' : selected.map(([, name]) => name).join('、')],
        ];
        root.innerHTML = flowHeader(activity ? 5 : 4, {
            titleHtml: esc(s.name),
            subtitleHtml: esc(scope.brandName),
            backHtml: backToPlans(),
            actionsHtml: previousStep(s.id, activity ? 'period' : 'stores', activity ? '活动有效期' : '选择门店') +
                (scope.canWrite ? `<button class="bd-primary" data-bd-action="save-reviewed">保存</button>${draftButton()}` : ''),
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
        if (editing && query.get('step') === 'adjust-stores') {
            const release = latestPlanReleases(data).find(item => item.snapshot.id === editing.id);
            if (scope.canWrite && (!release || release.rules.storeIds.every(id => scope.stores.some(store => store.id === id)))) {
                drawStores(editing, { release });
                return;
            }
            location.hash = planUrl(editing.id, 'preview', editing.channel);
            return;
        }
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
            drawReleaseList();
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
    let defaultCopyRequest = 0;
    let defaultCopyKey = '';
    let defaultCopy: Record<string, string> = {};
    const copyKey = (s: Scheme, pageId: string) =>
        [s.id, pageId, s.styles[pageId].mode, s.styles[pageId].theme, orientation].join(':');
    type ContentRegion = ReturnType<typeof pageContentGroup>;
    let contentRegion: ContentRegion | undefined;
    let contentRegionPage = '';
    let selectedField: string | undefined;
    let highlightContent = true;
    function editablePageElements(s: Scheme, mode: string) {
        return pageElements(s.channel, page).filter(field => mode === 'custom' ? field.custom : field.native);
    }
    function currentContentRegion(s: Scheme, mode: string = s.styles[page].mode) {
        const key = [s.channel, page, mode].join(':');
        const available = editablePageElements(s, mode).map(field => pageContentGroup(field, mode === 'default'));
        if (contentRegionPage !== key || !contentRegion || !available.includes(contentRegion)) {
            contentRegionPage = key;
            contentRegion = (Object.keys(PAGE_CONTENT_GROUPS) as ContentRegion[]).find(group => available.includes(group));
            selectedField = undefined;
            highlightContent = true;
        }
        return contentRegion;
    }
    function selectContentRegion(s: Scheme, region: ContentRegion, fieldId?: string) {
        const picker = root.querySelector<HTMLSelectElement>('[data-bd-field=content-region]');
        if (!picker || !Array.from(picker.options).some(option => option.value === region)) return;
        contentRegion = region;
        selectedField = fieldId;
        highlightContent = true;
        picker.value = region;
        const fields = root.querySelector('.bd-page-content');
        if (fields) fields.outerHTML = pageContentControls(s, s.styles[page].mode);
        if (fieldId) {
            narrowContentOpen = true;
            const panel = root.querySelector<HTMLDetailsElement>('.bd-content-panel');
            if (panel) panel.open = true;
            root.querySelector<HTMLElement>(`[data-bd-field=element][data-element="${fieldId}"]`)
                ?.focus({ preventScroll: wideWorkbench.matches });
        }
        sendPreview(s);
    }
    function clearContentSelection(s: Scheme) {
        if (!highlightContent && !selectedField) return;
        highlightContent = false;
        selectedField = undefined;
        root.querySelector('.bd-selected-content-field')?.classList.remove('bd-selected-content-field');
        updateEditorPreview(s);
    }
    function sendPreview(s: Scheme, frame = root.querySelector<HTMLIFrameElement>('[data-bd-frame]'),
        comparison?: { layout?: HomeLayout; orientation: string }) {
        const style = s.styles[page];
        const referenceLayout = comparison?.layout ?? (style.mode === 'custom'
            ? style.referenceLayout ?? style.referenceTemplate?.layout
            : undefined);
        // Compare a generated layout without changing the saved plan or its page content.
        const previewStyle = comparison?.layout ? { ...style, mode: 'custom' as const } : style;
        const previewScheme = referenceLayout
            ? { ...s, styles: { ...s.styles, [page]: { ...previewStyle,
                theme: s.channel === 'kiosk' && page === 'home' ? style.theme : referenceTheme(referenceLayout) } } }
            : s;
        const request = comparison ? undefined : ++defaultCopyRequest;
        if (!comparison) {
            const key = copyKey(s, page);
            if (defaultCopyKey !== key) {
                defaultCopyKey = key;
                defaultCopy = {};
            }
        }
        const header = s.sharedHeaderAppearance;
        const headerColors = header?.background
            ? resolvePalette('custom', header.background)
            : resolvePalette(s.paletteId ?? 'custom', s.primary);
        const selecting = !comparison && !previewRoute && workbenchMode === 'page' &&
            scheme()?.id === s.id && !!root.querySelector('[data-bd-field=content-region]');
        const region = selecting ? currentContentRegion(s) : undefined;
        frame?.contentWindow?.postMessage({
            selection: selecting ? { region: highlightContent ? region : undefined, field: selectedField, request } : undefined,
            type: 'bd-render', defaultCopyRequest: root.querySelector('.bd-page-content') ? request : undefined, scheme: { ...previewScheme, brandName: scope.brandName },
            palette: resolvePalette(s.paletteId, s.primary),
            headerPalette: sharedHeaderLayout(s.sharedHeader) === 'custom' ? { ...headerColors, divider: header?.divider } : undefined,
            elements: pageElements(s.channel, page).flatMap(field => {
                const selector = previewStyle.mode === 'custom' ? field.custom : field.native;
                return selector ? [{ id: field.id, kind: field.kind, group: pageContentGroup(field, previewStyle.mode === 'default'), selector,
                    hitArea: field.previewHitArea, attribute: field.attribute, original: field.nativeOriginal, value: s.pageContent?.[page]?.[field.id] }] : [];
            }),
            referenceLayout,
            page, orientation: comparison?.orientation ?? orientation,
            postPaymentScene: page === 'afterCreditCardPay' ? postPaymentScene : undefined,
        }, location.origin);
    }
    function updateEditorPreview(s: Scheme) {
        const headerBackground = root.querySelector<HTMLInputElement>('[data-bd-field=header-background]');
        if (headerBackground && !s.sharedHeaderAppearance?.background)
            headerBackground.value = resolvePalette(s.paletteId, s.primary)?.primary ?? s.primary;
        const inherits = flow && s.rules?.kind === 'activity' && !s.rules.pageIds.includes(page);
        if (!inherits) sendPreview(s);
    }
    let workbenchMode: 'page' | 'components' = 'page';
    let pageBeforeComponents = page;
    function switchWorkbench(mode: typeof workbenchMode, keepPreviewPage = false) {
        if (mode === workbenchMode) return;
        if (mode === 'components') {
            pageBeforeComponents = page;
            if (!keepPreviewPage && channel === 'kiosk' && (page === 'home' || page === 'screensaver')) {
                const current = scheme();
                const candidates = ['finish', 'orderType', 'menu'];
                page = current?.rules?.kind === 'activity'
                    ? candidates.find(id => current.rules!.pageIds.includes(id)) ?? page
                    : 'finish';
            }
        } else page = pageBeforeComponents;
        workbenchMode = mode;
        draw();
        root.querySelector<HTMLElement>(`#bd-workbench-${mode}-tab`)?.focus();
    }
    function workbenchTabs() {
        const tabs = [['page', '页面装修'], ['components', '共用组件']] as const;
        return `<div class="bd-tabs bd-workbench-tabs" role="tablist" aria-label="装修工作台">
            ${tabs.map(([id, label]) => `<button type="button" id="bd-workbench-${id}-tab" role="tab"
                data-bd-action="workbench-mode" data-value="${id}" aria-controls="bd-workbench-panel"
                aria-selected="${workbenchMode === id}" tabindex="${workbenchMode === id ? 0 : -1}">${label}</button>`).join('')}
        </div>`;
    }
    function sharedComponentControls(s: Scheme) {
        const selected = sharedHeaderLayout(s.sharedHeader);
        const choices = Object.entries(SHARED_HEADER_STYLES).map(([id, name]) =>
            `<label class="bd-radio"><input type="radio" name="bd-header-mode" data-bd-field="shared-header"
                value="${id}" ${id === selected ? 'checked' : ''}>${name}</label>`).join('');
        return `<fieldset class="bd-shared-components" ${writable()}><legend>顶栏布局</legend>${choices}</fieldset>`;
    }
    const wideWorkbench = window.matchMedia('(min-width: 1280px)');
    let narrowContentOpen = false;
    function syncContentPanel() {
        const panel = root.querySelector<HTMLDetailsElement>('.bd-content-panel');
        if (panel) panel.open = wideWorkbench.matches || narrowContentOpen;
    }
    function contentPanel(title: string, content: string) {
        return `<details class="bd-card bd-content-panel" ${wideWorkbench.matches || narrowContentOpen ? 'open' : ''}>
            <summary data-bd-action="toggle-content-panel">${title}</summary>
            <div class="bd-content-panel-body">
                <h2>${title}</h2>
                ${content}
            </div>
        </details>`;
    }
    function componentProperties(s: Scheme) {
        const appearance = s.sharedHeaderAppearance;
        const custom = sharedHeaderLayout(s.sharedHeader) === 'custom';
        const background = appearance?.background ?? resolvePalette(s.paletteId, s.primary)?.primary ?? s.primary;
        return contentPanel('组件属性', `<fieldset class="bd-page-content bd-component-properties" aria-label="顶部导航属性"
            ${!custom || !scope.canWrite ? 'disabled' : ''}>
            <section class="bd-content-group" aria-label="外观"><h3>外观</h3>
                <div><label>背景色<small>默认：跟随方案主题</small>
                    <input type="color" data-bd-field="header-background" value="${esc(background)}"></label>
                    ${appearance?.background ? '<button type="button" class="bd-link" data-bd-action="reset-header-background">恢复默认</button>' : ''}
                </div>
                <label class="bd-radio"><input type="checkbox" data-bd-field="header-divider" ${appearance?.divider ? 'checked' : ''}>显示底部分隔线</label>
            </section></fieldset>
            ${custom ? '' : '<p class="bd-help">切换到自定义布局后可调整</p>'}`);
    }
    function saveHeaderAppearance(s: Scheme, patch: NonNullable<Scheme['sharedHeaderAppearance']>) {
        if (sharedHeaderLayout(s.sharedHeader) !== 'custom') return;
        const saved = mutate(next => {
            const current = next.schemes.find(item => item.id === s.id)!;
            current.sharedHeaderAppearance = { ...current.sharedHeaderAppearance, ...patch };
            current.updatedAt = new Date().toISOString();
            validateScheme(current);
        });
        const updated = scheme()!;
        const properties = root.querySelector('.bd-content-panel');
        if (properties) properties.outerHTML = componentProperties(updated);
        if (saved) updateEditorPreview(updated);
    }
    function pageContentPanel(s: Scheme, mode: string) {
        const empty = mode === 'inherit' ? '此页沿用门店日常装修。' : '当前页面布局暂无可编辑内容。';
        const switchLayout = mode === 'default' && scope.canWrite && pageElements(s.channel, page).some(field => field.custom)
            ? '<button type="button" class="bd-link" data-bd-action="enable-page-content">切换自定义布局</button>'
            : '';
        const regions = mode === 'inherit' ? [] : editablePageElements(s, mode).map(field => pageContentGroup(field, mode === 'default'));
        const selected = regions.length ? currentContentRegion(s, mode) : undefined;
        const picker = selected ? `<label>编辑区域<select data-bd-field="content-region">${
            Object.entries(PAGE_CONTENT_GROUPS).filter(([group]) => regions.includes(group as ContentRegion))
                .map(([group, name]) => `<option value="${group}" ${selected === group ? 'selected' : ''}>${name}</option>`).join('')
        }</select></label>` : '';
        return contentPanel('页面内容', picker + pageContentControls(s, mode) || `<p class="bd-help">${empty}</p>${switchLayout}`);
    }
    function pageContentControls(s: Scheme, mode: string) {
        if (mode === 'inherit') return '';
        const content = s.pageContent?.[page] ?? {};
        const elements = editablePageElements(s, mode);
        if (!elements.length) return '';
        const region = currentContentRegion(s, mode);
        if (!region) return '';
        const fields = elements.filter(field => pageContentGroup(field, mode === 'default') === region);
        const controls = fields.map(field => {
            const fieldLabel = (mode === 'default' ? field.nativeLabel ?? field.label : field.label).replace(/按钮文案$/, '按钮');
            const value = content[field.id];
            const modified = value !== undefined;
            const inputId = `bd-content-field-${field.id}`;
            const attrs = `id="${inputId}" data-bd-field="element" data-element="${field.id}"`;
            const reset = modified ? `<button type="button" class="bd-link bd-field-reset" data-bd-action="reset-element"
                data-value="${field.id}" aria-label="恢复${esc(fieldLabel)}默认值">恢复默认</button>` : '';
            const selected = selectedField === field.id ? ' bd-selected-content-field' : '';
            const label = `<label for="${inputId}">${esc(fieldLabel)}</label>`;
            if (field.kind === 'hidden') {
                return `<div class="bd-content-field bd-content-toggle${selected}">
                    ${label}<input type="checkbox" role="switch" ${attrs} ${value ? 'checked' : ''}>${reset}
                </div>`;
            }
            const original = defaultCopyKey === copyKey(s, page) ? defaultCopy[field.id] : undefined;
            const copyTarget = `data-bd-default-copy="${field.id}"`;
            const control = field.kind === 'image'
                ? `<div class="bd-content-image-controls">
                    ${typeof value === 'string' ? `<img src="${esc(value)}" alt="">` : ''}
                    <input class="bd-content-file" type="file" ${attrs} accept="image/png,image/jpeg,image/webp" aria-label="替换${esc(fieldLabel)}">
                    <label class="bd-button" for="${inputId}" title="PNG、JPEG 或 WebP，最大 120 KB">替换图片</label>
                </div><small class="bd-error" data-bd-field-error role="alert" hidden></small>`
                : `<input ${attrs} maxlength="${MAX_PAGE_TEXT}" placeholder="${esc(modified ? '输入文案' : original || '输入文案')}"
                    ${modified ? '' : copyTarget} value="${esc(typeof value === 'string' ? value : '')}">
                    ${modified ? `<small class="bd-default-copy" ${original ? '' : 'hidden'}>默认：<span ${copyTarget}>${esc(original ?? '')}</span></small>` : ''}`;
            return `<div class="bd-content-field${selected}">
                <div class="bd-content-field-heading">${label}${reset || (field.kind === 'text' ? '<span class="bd-field-default">默认</span>' : '')}</div>
                ${control}
            </div>`;
        }).join('');
        return `<fieldset class="bd-page-content" aria-label="页面内容" ${writable()}>
            <section class="bd-content-group" data-bd-content-group="${region}" aria-label="${PAGE_CONTENT_GROUPS[region]}">${controls}</section>
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
    function templateCard(action: 'theme' | 'reference-template', id: string, name: string, selected: boolean, layout: string, note?: string) {
        return `<button type="button" class="bd-theme ${selected ? 'is-selected' : ''}" data-bd-action="${action}" data-value="${esc(id)}" aria-pressed="${selected}" ${writable()}>
            <i class="bd-template-mark" data-layout="${layout}" aria-hidden="true"></i>
            <span><b>${esc(name)}</b>${note ? `<small>${esc(note)}</small>` : ''}</span>
            <span aria-hidden="true">${selected ? '✓' : ''}</span>
        </button>`;
    }
    function pageTemplates(channel: Channel, pageId: string, source = data) {
        return (source.homeTemplates ?? []).filter(item => templateMatches(item, channel, pageId));
    }
    const referenceDesignerTitle = scope.demo ? 'AI 生成模板' : '用参考图生成模板';
    function referenceTemplateControls(s: Scheme, active: boolean) {
        const style = s.styles[page];
        const selected = active ? style.referenceTemplate : undefined;
        const items = pageTemplates(s.channel, page);
        return `<div class="bd-themes" role="group" aria-label="我的模板">
            <div class="bd-template-heading"><h3>我的模板</h3>
                <button type="button" class="bd-link" data-bd-action="reference-designer" ${writable()}>${referenceDesignerTitle}</button>
            </div>
            ${active && style.referenceLayout && scope.canWrite ? '<div class="bd-reference-actions"><button type="button" class="bd-link" data-bd-action="save-reference-template">保存为模板</button></div>' : ''}
            ${items.length ? items.map(item => `<div class="bd-saved-template">
                ${templateCard('reference-template', item.id, item.name, item.id === selected?.id, referenceTheme(item.layout))}
                ${scope.canWrite ? `<button type="button" class="bd-link" data-bd-action="rename-reference-template" data-value="${esc(item.id)}" aria-label="重命名 ${esc(item.name)}">重命名</button>` : ''}
            </div>`).join('') : '<p class="bd-help">暂无已保存的模板</p>'}
        </div>`;
    }
    function selectReferenceTemplate(s: Scheme, template: HomeTemplate, saveNew: boolean) {
        const pageId = page;
        if (!templateMatches(template, s.channel, pageId)) return false;
        if (!mutate(next => {
            const current = next.schemes.find(item => item.id === s.id)!;
            if (saveNew) {
                next.homeTemplates ??= [];
                const items = pageTemplates(s.channel, pageId, next);
                if (items.length >= 50) throw Error('我的模板最多保存 50 个');
                if (items.some(item => item.name.toLowerCase() === template.name.toLowerCase()))
                    throw Error('已有同名模板');
                next.homeTemplates.push(template);
            }
            const style = current.styles[pageId];
            delete style.referenceLayout;
            style.mode = 'custom';
            style.referenceTemplate = copy(template);
            if (current.rules?.kind === 'activity' && !current.rules.pageIds.includes(pageId))
                current.rules.pageIds.push(pageId);
            current.updatedAt = new Date().toISOString();
            validateScheme(current);
        })) return false;
        closeModal();
        if (saveNew) notice('布局已应用并保存到我的模板');
        draw();
        return true;
    }
    function openReferenceDesigner(s: Scheme) {
        let generated: HomeLayout | undefined;
        let imageUrl: string | undefined;
        let selectedFile: File | undefined;
        let comparing = false;
        let compareOrientation = orientation;
        let generation = 0;
        openModal(`<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-reference-title">
            <button type="button" class="bd-modal-backdrop" data-bd-modal-close tabindex="-1" aria-label="关闭"></button>
            <section class="bd-modal-panel bd-reference-designer">
                <header><button type="button" data-bd-modal-close aria-label="关闭">×</button><h2 id="bd-reference-title">${referenceDesignerTitle}</h2>
                    <button type="button" class="bd-primary" data-bd-modal-confirm disabled>生成模板</button></header>
                <div class="bd-reference-dialog-body">
                    <div data-reference-upload>
                        <p class="bd-help">当前在浏览器内分析参考图，沿用本页文案、图片和主题。</p>
                        <input type="file" data-reference-file accept="image/png,image/jpeg,image/webp" hidden>
                        <div class="bd-reference-picker" data-reference-empty>
                            <button type="button" class="bd-reference-pick" data-reference-select>上传参考图</button>
                            <small>可拖入 JPG、PNG 或 WebP，最大 10 MB</small>
                        </div>
                        <div class="bd-reference-selected" data-reference-selected hidden>
                            <img data-reference-thumbnail alt="参考图">
                            <div class="bd-reference-file-details"><strong data-reference-filename></strong>
                                <div class="bd-reference-actions">
                                    <button type="button" data-reference-select>更换参考图</button>
                                    <button type="button" class="bd-link" data-reference-remove>移除</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-reference-comparison hidden>
                        <div class="bd-preview-toolbar">
                            ${previewDirectionControls(compareOrientation, 'bd-reference-direction')}
                            <button type="button" class="bd-link" data-reference-replace>更换参考图</button>
                        </div>
                        <div class="bd-reference-comparison-grid">
                            <section aria-labelledby="bd-reference-current-title">
                                <h3 id="bd-reference-current-title">当前布局</h3>
                                <iframe data-reference-preview="current" title="当前布局" sandbox="allow-scripts allow-same-origin"></iframe>
                            </section>
                            <section aria-labelledby="bd-reference-result-title">
                                <h3 id="bd-reference-result-title">生成结果</h3>
                                <iframe data-reference-preview="generated" title="生成结果" sandbox="allow-scripts allow-same-origin"></iframe>
                            </section>
                        </div>
                    </div>
                    <p data-reference-status role="status"></p>
                </div>
            </section>
        </div>`, () => {
            if (primary.disabled) return;
            if (comparing && generated) {
                if (!saveReferenceTemplate(s, generated)) status.textContent = message;
                return;
            }
            const file = selectedFile;
            if (!file) return;
            const request = ++generation;
            primary.disabled = true;
            setPickerEnabled(false);
            status.textContent = '正在生成模板';
            analyzeReferenceImage(file).then(layout => {
                if (!dialog.isConnected || request !== generation) return;
                generated = layout;
                comparing = true;
                upload.hidden = true;
                comparison.hidden = false;
                status.textContent = '';
                primary.textContent = '应用到当前页';
                primary.disabled = false;
                refreshComparison();
                primary.focus({ preventScroll: true });
            }).catch(error => {
                if (!dialog.isConnected || request !== generation) return;
                primary.disabled = false;
                setPickerEnabled(true);
                status.textContent = error.name === 'InvalidStateError' ? '无法读取图片，请更换参考图' : error.message;
            });
        });
        const dialog = modal!;
        const primary = dialog.querySelector<HTMLButtonElement>('[data-bd-modal-confirm]')!;
        const upload = dialog.querySelector<HTMLElement>('[data-reference-upload]')!;
        const comparison = dialog.querySelector<HTMLElement>('[data-reference-comparison]')!;
        const fileInput = dialog.querySelector<HTMLInputElement>('[data-reference-file]')!;
        const thumbnail = dialog.querySelector<HTMLImageElement>('[data-reference-thumbnail]')!;
        const status = dialog.querySelector<HTMLElement>('[data-reference-status]')!;
        const frames = Array.from(dialog.querySelectorAll<HTMLIFrameElement>('[data-reference-preview]'));
        const direction = dialog.querySelector<HTMLFieldSetElement>('.bd-preview-direction')!;
        const currentScheme = previewPage(s, s);
        const renderView = (frame: HTMLIFrameElement) => {
            if (!comparing || !generated) return;
            const isGenerated = frame.dataset.referencePreview === 'generated';
            sendPreview(isGenerated ? s : currentScheme, frame, {
                layout: isGenerated ? generated : undefined, orientation: compareOrientation,
            });
        };
        const refreshComparison = () => {
            for (const frame of frames) {
                if (frame.hasAttribute('src')) renderView(frame);
                else frame.src = PREVIEW_URL;
            }
        };
        for (const frame of frames) frame.addEventListener('load', () => renderView(frame));
        const emptyPicker = dialog.querySelector<HTMLElement>('[data-reference-empty]')!;
        const selectedPicker = dialog.querySelector<HTMLElement>('[data-reference-selected]')!;
        const filename = dialog.querySelector<HTMLElement>('[data-reference-filename]')!;
        const chooseButtons = [...dialog.querySelectorAll<HTMLButtonElement>('[data-reference-select]')];
        const remove = dialog.querySelector<HTMLButtonElement>('[data-reference-remove]')!;
        const setPickerEnabled = (enabled: boolean) => {
            fileInput.disabled = !enabled;
            remove.disabled = !enabled;
            for (const button of chooseButtons) button.disabled = !enabled;
        };
        const chooseFile = (file?: File) => {
            if (file && !isReferenceImage(file)) {
                status.textContent = '请选择 10 MB 以内的 JPG、PNG 或 WebP 图片';
                return;
            }
            if (imageUrl) URL.revokeObjectURL(imageUrl);
            selectedFile = file;
            imageUrl = file ? URL.createObjectURL(file) : undefined;
            if (imageUrl) thumbnail.src = imageUrl;
            else thumbnail.removeAttribute('src');
            filename.textContent = file?.name ?? '';
            emptyPicker.hidden = Boolean(file);
            selectedPicker.hidden = !file;
            primary.disabled = !file;
            status.textContent = '';
            (file ? chooseButtons[1] : chooseButtons[0]).focus();
        };
        for (const button of chooseButtons) button.addEventListener('click', () => fileInput.click());
        chooseButtons[0].focus();
        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            fileInput.value = '';
            if (file) chooseFile(file);
        });
        remove.addEventListener('click', () => chooseFile());
        for (const eventName of ['dragover', 'drop']) upload.addEventListener(eventName, event => {
            const transfer = (event as DragEvent).dataTransfer;
            if (!transfer?.types.includes('Files')) return;
            event.preventDefault();
            if (fileInput.disabled || eventName !== 'drop') return;
            if (transfer.files.length !== 1) { status.textContent = '请选择一张参考图'; return; }
            chooseFile(transfer.files[0]);
        });
        direction.addEventListener('change', event => {
            const input = event.target;
            if (!(input instanceof HTMLInputElement) || !input.checked) return;
            compareOrientation = input.value;
            refreshComparison();
        });
        dialog.querySelector<HTMLButtonElement>('[data-reference-replace]')!.addEventListener('click', () => {
            comparing = false;
            comparison.hidden = true;
            upload.hidden = false;
            setPickerEnabled(true);
            primary.textContent = '生成模板';
            primary.disabled = !selectedFile;
            (selectedFile ? chooseButtons[1] : chooseButtons[0]).focus();
        });
        dialog.addEventListener('bd-dismiss', () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, { once: true });
    }
    function saveReferenceTemplate(s: Scheme, layout: HomeLayout) {
        const pageName = pages(s.channel).find(([id]) => id === page)![1];
        const names = new Set(pageTemplates(s.channel, page).map(item => item.name.toLowerCase()));
        let number = 1;
        while (names.has(`${pageName}参考模板 ${number}`)) number++;
        return selectReferenceTemplate(s, { id: crypto.randomUUID(), target: { channel: s.channel, page }, name: `${pageName}参考模板 ${number}`, version: 1, layout }, true);
    }
    function renameReferenceTemplate(template: HomeTemplate) {
        openModal(`<div class="bd-modal" role="dialog" aria-modal="true" aria-labelledby="bd-template-name-title">
            <button type="button" class="bd-modal-backdrop" data-bd-modal-close tabindex="-1" aria-label="关闭"></button>
            <section class="bd-modal-panel"><header><button type="button" data-bd-modal-close aria-label="关闭">×</button>
            <h2 id="bd-template-name-title">重命名模板</h2><button type="button" class="bd-primary" data-bd-modal-confirm>保存</button></header>
            <form><label>模板名称<input data-bd-reference-name maxlength="32" required value="${esc(template.name)}"></label><p data-reference-status role="alert"></p></form></section>
        </div>`, () => {
            const input = modal!.querySelector<HTMLInputElement>('[data-bd-reference-name]')!;
            input.value = input.value.trim();
            if (!input.reportValidity()) return;
            if (input.value === template.name) { closeModal(); return; }
            if (!mutate(next => {
                const items = next.homeTemplates!;
                if (items.some(item => item.id !== template.id && templateMatches(item, channel, page) && item.name.toLowerCase() === input.value.toLowerCase()))
                    throw Error('已有同名模板');
                items.find(item => item.id === template.id)!.name = input.value;
            })) {
                modal!.querySelector<HTMLElement>('[data-reference-status]')!.textContent = message;
                return;
            }
            closeModal();
            notice('模板名称已更新');
            draw();
            root.querySelector<HTMLButtonElement>(`[data-bd-action="rename-reference-template"][data-value="${template.id}"]`)?.focus();
        });
        modal!.querySelector<HTMLInputElement>('[data-bd-reference-name]')!.select();
    }
    let pageStage = '';
    let pageSearch = '';
    let pageCardsScroll = 0;
    function updatePageCards() {
        const grid = root.querySelector<HTMLElement>('[data-bd-page-cards]');
        if (!grid) return;
        const stage = PAGE_STAGES.find(item => item.id === pageStage);
        const stagePages: readonly string[] | undefined = stage?.pages;
        const search = pageSearch.trim().toLowerCase();
        let count = 0;
        let currentShown = false;
        for (const card of grid.querySelectorAll<HTMLButtonElement>('[data-bd-action=select-editor-page]')) {
            const id = card.dataset.value!;
            card.hidden = Boolean(stagePages && !stagePages.includes(id)) || !card.textContent!.trim().toLowerCase().includes(search);
            if (!card.hidden) {
                count++;
                if (id === page) currentShown = true;
            }
        }
        root.querySelector<HTMLElement>('[data-bd-page-empty]')!.hidden = count > 0;
        root.querySelector<HTMLElement>('[data-bd-page-current]')!.hidden = currentShown;
    }
    function restorePagePicker() {
        updatePageCards();
        root.querySelector<HTMLElement>('[data-bd-page-cards]')!.scrollTop = pageCardsScroll;
    }
    function pagePicker(s: Scheme, preview = false) {
        const title = preview ? '预览页面' : '装修页面';
        const catalog = pages(s.channel);
        return `<section class="bd-page-picker" aria-label="${title}">
            <label>${title}<select data-bd-field="page-stage">
                <option value="">全部页面</option>
                ${PAGE_STAGES.map(stage => `<option value="${stage.id}" ${pageStage === stage.id ? 'selected' : ''}>${stage.label}</option>`).join('')}
            </select></label>
            ${s.channel === 'kiosk' ? `<input type="search" aria-label="搜索页面名称" placeholder="搜索页面名称" data-bd-page-search value="${esc(pageSearch)}">` : ''}
            <div class="bd-page-cards" data-bd-page-cards role="group" aria-label="${preview ? title : '可装修页面'}">
                ${catalog.map(([id, name]) => `<button type="button" class="bd-page-card" data-bd-action="select-editor-page" data-value="${id}" aria-pressed="${id === page}">
                    <span class="bd-page-thumbnail" data-thumbnail="${pageThumbnail(id)}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                    <span>${esc(name)}</span>
                </button>`).join('')}
            </div>
            <p class="bd-help" data-bd-page-empty hidden>没有符合条件的页面</p>
            <p class="bd-help" data-bd-page-current hidden>${preview ? '当前预览' : '当前编辑'}：${esc(catalog.find(([id]) => id === page)?.[1] ?? '')}</p>
        </section>`;
    }
    function drawEditor() {
        const s = scheme();
        if (!s) {
            root.innerHTML = '<div class="bd-empty">方案不存在或已移除。<a href="#/brand-decoration/pages">返回方案列表</a></div>';
            return;
        }
        channel = s.channel;
        const previousGrid = root.querySelector<HTMLElement>('[data-bd-page-cards]');
        if (previousGrid) pageCardsScroll = previousGrid.scrollTop;
        const samePage = previousGrid?.querySelector<HTMLElement>('[aria-pressed=true]')?.dataset.value === page;
        const scrollRegions = ['.bd-workbench', '.bd-workbench > .bd-config'];
        if (samePage) scrollRegions.push('.bd-workbench > .bd-content-panel');
        const scrollOffsets = scrollRegions.map(selector => root.querySelector(selector)?.scrollTop ?? 0);
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
        const pageName = pages(channel).find(([id]) => id === page)?.[1] ?? '页面';
        const layoutTitle = pageName + (pageName.endsWith('页') || pageName.endsWith('页面') ? '布局' : '页面布局');
        const currentMode = inherited ? 'inherit' : style.mode;
        const modes = activity
            ? [['inherit', '沿用日常装修'], ['default', '系统布局'], ['custom', '自定义布局']]
            : [['default', '系统布局'], ['custom', '自定义布局']];
        const modeControls = modes.map(([value, title]) =>
            `<label class="bd-radio"><input type="radio" name="bd-mode" data-bd-field="mode" value="${value}" ${currentMode === value ? 'checked' : ''}>${title}</label>`).join('');
        const components = workbenchMode === 'components';
        const sidebar = components
            ? `<label>共用组件<select data-bd-component-picker><option value="top-navigation">顶部导航</option></select></label>
                ${sharedComponentControls(s)}`
            : `<h2>页面与布局</h2>${pagePicker(s)}<fieldset ${writable()}><legend>${esc(layoutTitle)}</legend>${modeControls}</fieldset>${currentMode === 'custom' ? `<div class="bd-themes" role="group" aria-label="当前页面模板"><h3>页面模板</h3>${(Object.keys(PAGE_TEMPLATES) as Theme[]).map(id => templateCard('theme', id, PAGE_TEMPLATES[id].name, !style.referenceTemplate && !style.referenceLayout && style.theme === id, id, PAGE_TEMPLATES[id].note)).join('')}</div>${!style.referenceTemplate && !style.referenceLayout ? `<button class="bd-wide" data-bd-action="suite" ${writable()}>将当前模板应用到全部 ${pages(channel).length} 页</button>` : ''}` : ''}${referenceTemplateControls(s, currentMode === 'custom')} ${storePicker}${legacy ? `<label>方案名称<input data-bd-field="name" value="${esc(s.name)}" maxlength="40" ${writable()}></label>` : ''}`;
        root.innerHTML = (flow ? flowHeader.bind(null, 2) : renderStandalonePageHeader)({ titleHtml: esc(s.name), backHtml: `<a href="#${ROOT}/pages?channel=${channel}${legacy ? "&legacy=1" : ""}">返回方案列表</a>`, subtitleHtml: channel === 'kiosk' ? undefined : esc(label(channel)), actionsHtml: `${flow && scope.canWrite ? previousStep(s.id, "rules", "方案信息") : ""}<button data-bd-action="publish" class="bd-primary" ${writable()}>${flow ? "下一步：选择门店" : "发布演示版本"}</button>${flow && scope.canWrite ? draftButton() : ''}` }) + (flow ? `<div data-bd-notice class="bd-notice ${messageError ? 'bd-error' : ''}" role="${messageError ? 'alert' : 'status'}">${esc(message)}</div>` : tip()) + paletteControls(s) + `<div class="bd-workbench"><aside class="bd-card bd-config">${workbenchTabs()}<div class="bd-sidebar-panel" id="bd-workbench-panel" role="tabpanel" aria-labelledby="bd-workbench-${workbenchMode}-tab">${sidebar}</div></aside><section class="bd-preview"><div class="bd-preview-toolbar"><strong>顾客端效果预览</strong>${components ? `<select aria-label="预览页面" data-bd-field="page">${pageOptions}</select>${storePicker}` : ''}${postPaymentScenePicker()}${previewDirectionControls()}</div><div class="bd-preview-stage">${inherited && !previewStores.length ? '<p class="bd-help">选择门店后可预览日常装修</p>' : `<iframe title="${label(channel)}页面样式预览" src="${PREVIEW_URL}" data-bd-frame sandbox="allow-scripts allow-same-origin"></iframe>`}</div></section>${components ? componentProperties(s) : pageContentPanel(s, currentMode)}</div>`;
        if (!components) restorePagePicker();
        scrollRegions.forEach((selector, index) => {
            const region = root.querySelector(selector);
            if (region) region.scrollTop = scrollOffsets[index];
        });
        if (!flow) observePreviewLayout();
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
        const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]')).filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
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
        if (action === 'select-editor-page') {
            const current = scheme();
            const id = el.dataset.value;
            if (!current || (!previewRoute && workbenchMode !== 'page') || id === page || !pages(current.channel).some(([key]) => key === id)) return;
            page = id!;
            draw();
            root.querySelector<HTMLButtonElement>('[data-bd-page-cards] [aria-pressed="true"]')?.focus({ preventScroll: true });
            return;
        }
        if (action === 'workbench-mode') {
            switchWorkbench(el.dataset.value === 'components' ? 'components' : 'page');
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
        if (action === 'plan-stores') { openPlanStores(el.dataset.id ?? ''); return; }
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
            const record = data.releases.find(r => r.id === el.dataset.id && releaseInScope(r));
            if (!record)
                return;
            openModal(renderChangePreviewDialog({ mode: 'view', dialogId: 'bd-snapshot', title: `V${record.version} · ${record.snapshot.name}`, subtitle: `${record.scopeName} · ${date(record.createdAt)} · 演示快照，未向设备下发`, changes: changes(undefined, record.snapshot), closeAttr: 'data-bd-modal-close', backdropAttr: 'data-bd-modal-close', zClass: 'z-[10060]' }));
            return;
        }
        const s = scheme();
        if (!s)
            return;
        if (action === 'reset-header-background') {
            saveHeaderAppearance(s, { background: undefined });
            return;
        }
        if (action === 'enable-page-content') {
            const layout = root.querySelector<HTMLInputElement>('[name="bd-mode"][value="custom"]');
            if (layout && !layout.checked) layout.click();
            return;
        }
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
        if (action === 'reference-designer' || action === 'save-reference-template' || action === 'reference-template' || action === 'rename-reference-template') {
            if (!scope.canWrite) return;
            const style = s.styles[page];
            const layout = style.referenceLayout;
            if (action === 'reference-designer') openReferenceDesigner(s);
            else if (action === 'save-reference-template' && layout) saveReferenceTemplate(s, layout);
            else if (action === 'reference-template' || action === 'rename-reference-template') {
                const template = pageTemplates(s.channel, page).find(item => item.id === el.dataset.value);
                if (!template) return;
                if (action === 'rename-reference-template') renameReferenceTemplate(template);
                else if (selectReferenceTemplate(s, template, false)) {
                    root.querySelector<HTMLButtonElement>(`[data-bd-action="reference-template"][data-value="${template.id}"]`)?.focus();
                }
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
    const click = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.matches('.bd-workbench .bd-preview-stage') && !previewRoute && workbenchMode === 'page') {
            const current = scheme();
            if (current && root.querySelector('[data-bd-field=content-region]')) clearContentSelection(current);
            return;
        }
        const button = target.closest<HTMLElement>('[data-bd-action]');
        if (button && !button.hasAttribute('disabled')) act(button.dataset.bdAction!, button);
    };
    const searchEditorPages = (event: Event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-bd-page-search')) return;
        pageSearch = input.value;
        updatePageCards();
        root.querySelector<HTMLElement>('[data-bd-page-cards]')!.scrollTop = 0;
    };
    const change = (event: Event) => { const input = event.target as HTMLInputElement; const field = input.dataset.bdField; if (!field)
        return;
    if (field === 'page-stage') {
        pageStage = input.value;
        updatePageCards();
        root.querySelector<HTMLElement>('[data-bd-page-cards]')!.scrollTop = 0;
        return;
    }
    if (field === 'post-payment-scene') {
        const scene = postPaymentScenes.find(([id]) => id === input.value);
        if (scene) {
            postPaymentScene = scene[0];
            draw();
            root.querySelector<HTMLSelectElement>('[data-bd-field=post-payment-scene]')?.focus({ preventScroll: true });
        }
        return;
    }
    if (field === 'plan-store') { previewStore = input.value; draw(); return; } if (field === 'page' || field === 'schedule-page') {
        page = input.value;
        draw();
        return;
    } if (field === 'orientation') {
        if (input.value !== 'portrait' && input.value !== 'landscape') return;
        orientation = input.value;
        draw();
        root.querySelector<HTMLInputElement>('[name="bd-preview-direction"]:checked')?.focus({ preventScroll: true });
        return;
    } const s = scheme();
    if (!s) return;
    if (field === 'content-region') {
        selectContentRegion(s, input.value as ContentRegion);
        return;
    }
    if (field === 'element') {
        const id = input.dataset.element;
        const element = pageElements(s.channel, page).find(item => item.id === id);
        if (!element) return;
        if (element.kind === 'image') {
            const file = input.files?.[0];
            if (!file) return;
            const error = input.closest('.bd-content-field')?.querySelector<HTMLElement>('[data-bd-field-error]');
            const showError = (message: string) => {
                if (!error) return;
                error.textContent = message;
                error.hidden = !message;
            };
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > MAX_PAGE_IMAGE_BYTES) {
                input.value = '';
                showError('请选择 120 KB 以内的 PNG、JPEG 或 WebP 图片');
                return;
            }
            showError('');
            const targetPage = page;
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (root.isConnected && typeof reader.result === 'string')
                    savePageElement(s, targetPage, element.id, reader.result);
            });
            reader.addEventListener('error', () => { input.value = ''; showError('图片读取失败，请重新选择'); });
            reader.readAsDataURL(file);
        } else savePageElement(s, page, element.id, element.kind === 'hidden' ? (input.checked ? true : undefined) : input.value.trim());
        return;
    }
    if (field === 'header-background' || field === 'header-divider') {
        saveHeaderAppearance(s, field === 'header-background'
            ? { background: input.value }
            : { divider: input.checked ? true : undefined });
        return;
    }
    if (field === 'shared-header') {
        const value = input.value as SharedHeaderStyle;
        if (mutate(next => {
            const current = next.schemes.find(item => item.id === s.id)!;
            current.sharedHeader = value;
            current.updatedAt = new Date().toISOString();
            validateScheme(current);
        })) {
            const updated = scheme()!;
            const properties = root.querySelector('.bd-content-panel');
            if (properties) properties.outerHTML = componentProperties(updated);
            updateEditorPreview(updated);
        } else {
            const previous = root.querySelector<HTMLInputElement>(`[name="bd-header-mode"][value="${sharedHeaderLayout(s.sharedHeader)}"]`);
            if (previous) previous.checked = true;
        }
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
    const frameMessage = (event: MessageEvent) => { const frame = root.querySelector<HTMLIFrameElement>('[data-bd-frame]'); if (event.origin !== location.origin || event.source !== frame?.contentWindow)
        return;
        if (event.data?.type === 'bd-select-content' && event.data.request === defaultCopyRequest) {
            const current = scheme();
            if (!current || previewRoute || workbenchMode !== 'page' ||
                !root.querySelector('[data-bd-field=content-region]')) return;
            if (event.data.id === null) {
                clearContentSelection(current);
                return;
            }
            if (event.data.id === 'top-navigation') {
                narrowContentOpen = true;
                switchWorkbench('components', true);
                return;
            }
            const mode = current.styles[page].mode;
            const field = editablePageElements(current, mode).find(item => item.id === event.data.id);
            if (field) selectContentRegion(current, pageContentGroup(field, mode === 'default'), field.id);
            return;
        }
        if (event.data?.type === 'bd-default-copy' && event.data.request === defaultCopyRequest) {
            const values = event.data.values;
            if (!values || typeof values !== 'object') return;
            defaultCopy = Object.fromEntries(Object.entries(values)
                .filter(([, value]) => typeof value === 'string')
                .map(([id, value]) => [id, (value as string).slice(0, 240)]));
            for (const target of root.querySelectorAll<HTMLElement>('[data-bd-default-copy]')) {
                const original = defaultCopy[target.dataset.bdDefaultCopy!];
                if (target instanceof HTMLInputElement) target.placeholder = original || '输入文案';
                else {
                    target.textContent = original ?? '';
                    const summary = target.closest<HTMLElement>('small');
                    if (summary) summary.hidden = !original;
                }
            }
            return;
        }
        if (event.data?.type !== 'bd-ready') return;
        let s = showSchedule ? selectedPreview() : scheme();
        if (!previewRoute && s?.rules?.kind === 'activity' && !s.rules.storeIds.length && !s.rules.pageIds.includes(page)) {
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
    const workbenchKeydown = (event: KeyboardEvent) => {
        if (!(event.target instanceof Element) || !event.target.matches('.bd-workbench-tabs [role=tab]')) return;
        const modes = { Home: 'page', End: 'components', ArrowLeft: workbenchMode === 'page' ? 'components' : 'page', ArrowRight: workbenchMode === 'page' ? 'components' : 'page' } as const;
        const mode = modes[event.key as keyof typeof modes];
        if (!mode) return;
        event.preventDefault();
        switchWorkbench(mode);
    };
    root.addEventListener('keydown', workbenchKeydown);
    root.addEventListener('submit', filterSubmit);
    root.addEventListener('click', click);
    root.addEventListener('click', toggleContentPanel);
    wideWorkbench.addEventListener('change', syncContentPanel);
    root.addEventListener('change', change);
    root.addEventListener('input', searchEditorPages);
    window.addEventListener('resize', fitPreviewStage);
    window.addEventListener('message', frameMessage);
    window.addEventListener('storage', storage);
    dispose = () => { previewResize.disconnect(); window.removeEventListener('resize', fitPreviewStage); window.clearInterval(scheduleClock); closeModal(); root.removeEventListener('keydown', workbenchKeydown); root.removeEventListener('submit', filterSubmit); root.removeEventListener('click', click); root.removeEventListener('click', toggleContentPanel); wideWorkbench.removeEventListener('change', syncContentPanel); root.removeEventListener('change', change); root.removeEventListener('input', searchEditorPages); window.removeEventListener('message', frameMessage); window.removeEventListener('storage', storage); };
    draw();
}
