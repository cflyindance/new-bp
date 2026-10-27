import "./merchant-activity.css";
import {
  PRODUCT_LINES, STATUS_LABELS, currentBindings, dateNumber, devicesForScope,
  shiftDate, summarizeActivity, validatePeriod,
  type ActivityMetrics, type ActivityPeriod, type ActivityScope, type ActivityStatus,
} from "./merchant-activity-domain";
import { activityDemoData as data, activityDemoOrders as resolved } from "./merchant-activity-data";

import { ACTIVITY_PATH, activityScopeHref, parseActivityScope } from './merchant-activity-drilldown';
export { ACTIVITY_PATH } from './merchant-activity-drilldown';
export function isActivityPath(path: string): boolean { return path === ACTIVITY_PATH || path.startsWith(ACTIVITY_PATH + "/"); }
const state = {
  period: { start: shiftDate(data.asOf, -6), end: data.asOf } as ActivityPeriod,
  quick: "7", merchant: "", query: "", status: "",
  rootScroll: 0, drawerScroll: 0, openStoreId: "", returnStoreId: "", focusAfter: "", wasOpen: false,
  filterDraft: null as Record<string, string> | null, periodDraft: null as Record<string, string> | null,
};
const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const n = (value: number | null) => value === null ? "—" : value.toLocaleString("zh-CN");
const time = (value: string | null) => value ? esc(value.slice(0, 16).replace("T", " ")) : "—";
const href = activityScopeHref;
const badge = (status: ActivityStatus) => '<span class="ma-badge ma-' + status + '">' + STATUS_LABELS[status] + "</span>";
function neverNote(scope: ActivityScope): string {
  const store = data.stores.find(s => s.id === scope.storeId)!;
  const binding = scope.deviceId ? currentBindings(data, scope)[0] : undefined;
  const start = binding?.from.slice(0, 10) ?? store.openedOn;
  return (scope.deviceId ? "已绑定 " : "已开通 ") + (dateNumber(data.asOf) - dateNumber(start)) + " 天，尚未点单";
}
const parsedScope = (path: string) => parseActivityScope(path, data);
export function activityPageTitle(path: string): { title: string; module: string } | null {
  return isActivityPath(path) ? { title: "门店活跃分析", module: "系统使用分析" } : null;
}
function metrics(scope: ActivityScope): ActivityMetrics { return summarizeActivity(data, resolved, scope, state.period); }
function summaryCards(items: { label: string; value: string; note: string }[]): string {
  return '<div class="ma-cards">' + items.map(item => '<div class="ma-card"><span>' + item.label +
    '</span><strong>' + item.value + '</strong><small>' + item.note + "</small></div>").join("") + "</div>";
}
function metricCells(m: ActivityMetrics): string {
  return '<td class="ma-number">' + n(m.count) + '</td><td class="ma-number">' + n(m.paid) +
    '</td><td class="ma-number">' + n(m.cancelled) + '</td><td class="ma-number">' + n(m.activeDays) +
    '</td><td class="ma-number">' + (m.dailyAverage === null ? "—" : m.dailyAverage.toFixed(1)) +
    '</td><td class="ma-nowrap">' + time(m.latest) + '</td><td class="ma-number">' + n(m.daysSince) + "</td>";
}
const metricHeaders = '<th class="ma-number">点单数</th><th class="ma-number">支付完成</th><th class="ma-number">取消数</th><th class="ma-number">有订单天数</th><th class="ma-number">日均点单</th><th>最近点单时间</th><th class="ma-number">连续无订单天数</th>';
function dateControls(): string {
  const quick = [["1", "今日"], ["7", "近 7 天"], ["30", "近 30 天"]];
  return '<form class="ma-period" data-ma-form data-activity-browse>' +
    '<span class="ma-field-caption">统计期间</span><div class="ma-segment">' + quick.map(([id, label]) =>
      '<button type="button" data-ma-quick="' + id + '" aria-pressed="' + (state.quick === id) + '">' + label + "</button>").join("") +
    '</div><label>开始日期<input aria-label="开始日期" name="start" type="date" min="' + shiftDate(data.asOf, -89) + '" max="' + data.asOf + '" value="' + state.period.start + '" required></label>' +
    '<span class="ma-date-separator">至</span><label>结束日期<input aria-label="结束日期" name="end" type="date" min="' + shiftDate(data.asOf, -89) + '" max="' + data.asOf + '" value="' + state.period.end + '" required></label>' +
    '<button class="ma-primary" type="submit">查询</button><p class="ma-form-error" data-ma-date-error role="alert" hidden></p></form>';
}
function filterControls(): string {
  const merchants = [...new Map(data.stores.map(s => [s.merchantId, s.merchantName])).entries()];
  return '<form class="ma-filters" data-ma-filter-form data-activity-browse><label>商户<select name="merchant" aria-label="商户"><option value="">全部商户</option>' +
    merchants.map(([id, name]) => '<option value="' + id + '"' + (state.merchant === id ? " selected" : "") + ">" + esc(name) + "</option>").join("") +
    '</select></label><label>活跃状态<select name="status" aria-label="活跃状态"><option value="">全部状态</option>' +
    (Object.entries(STATUS_LABELS) as [ActivityStatus, string][]).filter(([id]) => id !== "unconfigured").map(([id, label]) =>
      '<option value="' + id + '"' + (state.status === id ? " selected" : "") + ">" + label + "</option>").join("") +
    '</select></label><label class="ma-search">门店／商户<input name="query" aria-label="搜索门店或商户" placeholder="搜索门店或商户名称" maxlength="80" value="' + esc(state.query) +
    '"></label><button type="submit">筛选</button><button type="button" data-ma-reset>重置筛选</button></form>';
}
function rootPage(): string {
  const stores = data.stores.filter(s => (!state.merchant || s.merchantId === state.merchant) &&
    (!state.query || (s.name + s.merchantName).toLowerCase().includes(state.query.toLowerCase())) &&
    (!state.status || metrics({ storeId: s.id }).status === state.status));
  const rows = stores.map(s => ({ store: s, m: metrics({ storeId: s.id }) }));
  const complete = rows.filter(row => row.m.count !== null);
  const count = complete.reduce((sum, row) => sum + row.m.count!, 0);
  const errors = rows.length - complete.length;
  const active = rows.filter(row => row.m.status === "active").length;
  const follow = rows.filter(row => ["recent", "suspected", "long"].includes(row.m.status)).length;
  const table = rows.map(({ store, m }) => '<tr data-ma-store="' + store.id + '"><td><a class="ma-link" href="' +
    href({ storeId: store.id }) + '">' + esc(store.name) + '</a><small>' + esc(store.merchantName) + '</small></td><td>' +
    badge(m.status) + (m.status === "never" ? '<small>' + neverNote({ storeId: store.id }) + '</small>' : '') + '</td>' + metricCells(m) + '<td class="ma-number">' + m.boundDevices + ' / ' + n(m.usedDevices) +
    '</td><td class="ma-number">' + n(m.unknown) + '</td><td><a class="ma-link ma-nowrap" href="' + href({ storeId: store.id }) + '">查看详情 →</a></td></tr>').join("");
  return filterControls() + summaryCards([
    { label: "门店", value: String(rows.length), note: "当前筛选范围" },
    { label: "活跃门店", value: String(active), note: "最近点单距今 0～6 天" },
    { label: "需关注门店", value: String(follow), note: "最近点单距今 ≥7 天" },
    { label: "期间点单数", value: n(count), note: errors ? "已知合计 · " + errors + " 家数据异常未计入" : "按业务订单去重" },
  ]) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>门店使用情况</h3></div><span>' + rows.length +
    ' 家门店</span></div><div class="ma-table-wrap"><table><thead><tr><th>门店／商户</th><th>当前活跃状态</th>' + metricHeaders +
    '<th class="ma-number">绑定 / 有订单设备</th><th class="ma-number">来源待识别</th><th>操作</th></tr></thead><tbody>' +
    (table || '<tr><td colspan="12" class="ma-empty">没有符合筛选条件的门店，请调整条件或重置筛选。</td></tr>') +
    '</tbody></table></div></section>';
}
function scopeSummary(scope: ActivityScope): string {
  const m = metrics(scope);
  return summaryCards([
    { label: "当前活跃状态", value: badge(m.status), note: m.status === "never" ? neverNote(scope) : "始终按统计截至日期判断" },
    { label: "期间点单数", value: n(m.count), note: "支付完成 " + n(m.paid) + " · 取消 " + n(m.cancelled) },
    { label: "有订单天数", value: n(m.activeDays), note: "日均 " + (m.dailyAverage === null ? "—" : m.dailyAverage.toFixed(1)) + " 单" },
    { label: "绑定 / 有订单设备", value: m.boundDevices + " / " + n(m.usedDevices), note: "当前绑定中无订单 " + n(m.unusedDevices) + " 台" },
  ]);
}
function lineOverview(scope: ActivityScope): string {
  return '<div class="ma-line-overview" aria-label="各产线使用汇总">' + PRODUCT_LINES.map(line => {
    const row = metrics({ storeId: scope.storeId, line });
    return '<a data-activity-browse class="ma-line-card" href="' + href({ storeId: scope.storeId, line }) + '"><span>' + line + '</span>' + badge(row.status) +
      '<strong>' + n(row.count) + '<small> 点单</small></strong><small>绑定设备 ' + row.boundDevices + ' · 有订单设备 ' + n(row.usedDevices) + '</small></a>';
  }).join('') + '</div>';
}
function devicesPage(scope: ActivityScope): string {
  const selected = { storeId: scope.storeId, line: scope.line };
  const devices = devicesForScope(data, resolved, selected, state.period);
  const rows = devices.map(device => {
    const deviceScope = { ...selected, deviceId: device.id };
    const m = metrics(deviceScope), bindings = currentBindings(data, deviceScope);
    return '<tr><td>' + esc(device.name) + '<small>' + esc(device.id) + '</small></td><td>' +
      (bindings.length ? bindings.map(b => esc(b.licenseId)).join('<br>') : '历史绑定') + '</td><td>' +
      (bindings.length ? [...new Set(bindings.map(b => b.line))].map(esc).join(' / ') : '历史绑定') + '</td><td>' + badge(m.status) + '</td>' + metricCells(m) + '</tr>';
  }).join('');
  return '<section class="ma-panel"><div class="ma-panel-title"><h3>' + (scope.line ? esc(scope.line) + ' · 设备' : '全部产线 · 设备') + '</h3><span>' + devices.length +
    ' 台设备</span></div><div class="ma-table-wrap"><table><thead><tr><th>点单设备／设备 ID</th><th>当前 License</th><th>当前产线</th><th>当前活跃状态</th>' + metricHeaders +
    '</tr></thead><tbody>' + (rows || '<tr><td colspan="11" class="ma-empty">当前范围暂无绑定设备，期间也没有可识别的设备订单。</td></tr>') + '</tbody></table></div></section>';
}
function storeDrawer(scope: ActivityScope): string {
  const store = data.stores.find(s => s.id === scope.storeId)!, m = metrics({ storeId: scope.storeId });
  const selected = { storeId: scope.storeId, line: scope.line };
  const tabs = [undefined, ...PRODUCT_LINES].map(line => '<a role="tab" data-ma-line-tab="' + (line ?? '') + '" aria-selected="' + (scope.line === line) +
    '" aria-controls="ma-drawer-content" href="' + href({ storeId: scope.storeId, line }) + '">' + (line ?? '全部产线') + '</a>').join('');
  return '<div class="ma-drawer-backdrop" data-activity-browse><section class="ma-store-drawer" role="dialog" aria-modal="true" aria-labelledby="ma-drawer-title" tabindex="-1">' +
    '<header class="ma-drawer-heading"><div><p>门店详情</p><h2 id="ma-drawer-title">' + esc(store.name) + '</h2><div class="ma-drawer-context"><span>' + esc(store.merchantName) + '</span>' + badge(m.status) +
    '<span>最近点单 ' + time(m.latest) + '</span></div><p>统计期间：' + state.period.start + ' 至 ' + state.period.end + '</p></div>' +
    '<button type="button" data-ma-drawer-close aria-label="关闭门店详情">关闭 ×</button></header>' +
    '<div class="ma-drawer-tabs" role="tablist" aria-label="查看产线">' + tabs + '</div><div class="ma-drawer-body" id="ma-drawer-content" role="tabpanel" aria-label="' + (scope.line ?? '全部产线') + '">' +
    (store.quality === 'error' ? '<p class="ma-error-note" role="alert">该门店订单数据不可用，指标显示“—”，不作为真实零订单。</p>' : '') + scopeSummary(selected) +
    (!scope.line ? lineOverview(scope) + (m.unknown ? '<p class="ma-inline-note">来源待识别：' + n(m.unknown) + ' 单。未计入任何产线或设备。</p>' : '') : '') + devicesPage(scope) + '</div></section></div>';
}
export function renderActivityPage(path: string): string {
  const scope = parsedScope(path);
  if (scope === undefined) return '<section class="ma-page"><h2>未找到演示页面</h2><a class="ma-link" href="' + href() + '">返回全部门店</a></section>';
  return '<div class="ma-page" data-ma-page><div data-ma-background' + (scope ? ' inert' : '') + '>' + dateControls() + rootPage() +
    '<section class="ma-rules"><strong>活跃判定</strong><p>最近点单距今 0～6 天：活跃；7～13 天：近期未使用；14～29 天：疑似停用；≥30 天：长期未使用。从未点单：尚未使用。</p>' +
    '<p>点单量按成功提交的业务订单去重，取消单仍计入；草稿不计入。跨设备收款不改变点单来源。状态按截至日期判断，查询期间只影响订单及使用频率指标。</p><p>绑定设备按截至日期统计；有订单设备按查询期间统计，可能包含历史绑定设备。不同产线的设备数可能包含同一台跨产线使用设备，门店总设备数按设备 ID 去重。</p></section></div>' + (scope ? storeDrawer(scope) : '') + '</div>';
}
export function bindActivityPage(onMount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-ma-page]");
  if (!root) return;
  root.querySelectorAll<HTMLButtonElement>("[data-ma-quick]").forEach(button => button.addEventListener("click", () => {
    state.periodDraft = null;
    state.quick = button.dataset.maQuick!;
    state.period = { start: shiftDate(data.asOf, 1 - Number(state.quick)), end: data.asOf };
    onMount();
  }));
  root.querySelector<HTMLFormElement>("[data-ma-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const period = { start: String(form.get("start") ?? ""), end: String(form.get("end") ?? "") };
    const error = validatePeriod(period, data.asOf);
    const note = root.querySelector<HTMLElement>("[data-ma-date-error]")!;
    if (error) { note.hidden = false; note.textContent = error; return; }
    state.periodDraft = null; state.period = period; state.quick = ""; onMount();
  });
  root.querySelector<HTMLFormElement>("[data-ma-filter-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    state.filterDraft = null;
    state.merchant = String(form.get("merchant") ?? "");
    state.status = String(form.get("status") ?? "");
    state.query = String(form.get("query") ?? "").trim();
    onMount();
  });
  root.querySelector("[data-ma-reset]")?.addEventListener("click", () => {
    state.filterDraft = null; state.merchant = ""; state.status = ""; state.query = ""; onMount();
  });
  const scope = parsedScope(location.hash.slice(1));
  const dialog = root.querySelector<HTMLElement>('.ma-store-drawer');
  const body = root.querySelector<HTMLElement>('.ma-drawer-body');
  const restoreDraft = (selector: string, draft: Record<string, string> | null) => {
    if (!draft) return;
    const form = root.querySelector<HTMLFormElement>(selector);
    for (const [name, value] of Object.entries(draft)) {
      const control = form?.elements.namedItem(name);
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value;
    }
  };
  restoreDraft('[data-ma-filter-form]', state.filterDraft);
  restoreDraft('[data-ma-form]', state.periodDraft);
  root.scrollTop = state.rootScroll;
  if (dialog) root.style.overflow = "hidden";
  root.addEventListener('scroll', () => { if (!dialog) state.rootScroll = root.scrollTop; });
  const saveDraft = (selector: string) => Object.fromEntries([...new FormData(root.querySelector<HTMLFormElement>(selector)!)].map(([key, value]) => [key, String(value)]));
  root.addEventListener('click', event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || !anchor.hash.startsWith('#' + ACTIVITY_PATH)) return;
    if (!dialog) {
      state.rootScroll = root.scrollTop;
      state.filterDraft = saveDraft('[data-ma-filter-form]'); state.periodDraft = saveDraft('[data-ma-form]');
      state.returnStoreId = parsedScope(anchor.hash.slice(1))?.storeId ?? '';
      state.drawerScroll = 0; state.focusAfter = '';
    } else if (anchor.matches('[data-ma-line-tab],.ma-line-card')) {
      state.drawerScroll = 0;
      const next = parsedScope(anchor.hash.slice(1));
      state.focusAfter = '[data-ma-line-tab="' + CSS.escape(next?.line ?? '') + '"]';
    }
  });
  const closeDrawer = () => { state.focusAfter = ''; location.hash = ACTIVITY_PATH; };
  root.querySelector('[data-ma-drawer-close]')?.addEventListener('click', closeDrawer);
  root.querySelector('.ma-drawer-backdrop')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeDrawer();
  });
  if (dialog && scope) {
    if (state.openStoreId !== scope.storeId) { state.drawerScroll = 0; state.focusAfter = ''; }
    state.openStoreId = scope.storeId; state.returnStoreId = scope.storeId; state.wasOpen = true;
    if (body) { body.scrollTop = state.drawerScroll; body.addEventListener('scroll', () => { state.drawerScroll = body.scrollTop; }); }
    (state.focusAfter ? dialog.querySelector<HTMLElement>(state.focusAfter) : null)?.focus({ preventScroll: true });
    if (!dialog.contains(document.activeElement)) dialog.querySelector<HTMLElement>('[data-ma-drawer-close]')?.focus({ preventScroll: true });
    dialog.querySelectorAll<HTMLElement>('[role=tab]').forEach(tab => { tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDrawer(); return; }
      const target = event.target as HTMLElement;
      if (target.matches('[role=tab]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const tabs = [...dialog.querySelectorAll<HTMLAnchorElement>('[role=tab]')];
        const index = tabs.indexOf(target as HTMLAnchorElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + tabs.length) % tabs.length;
        tabs[next]?.click(); return;
      }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')]
        .filter(control => control.tabIndex >= 0 && !control.hasAttribute('disabled') && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  } else if (state.wasOpen) {
    state.wasOpen = false; state.openStoreId = ''; state.drawerScroll = 0;
    root.querySelector<HTMLElement>('[data-ma-store="' + CSS.escape(state.returnStoreId) + '"] a')?.focus({ preventScroll: true });
  }

}
