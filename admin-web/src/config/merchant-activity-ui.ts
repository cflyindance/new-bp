import "./merchant-activity.css";
import {
  PRODUCT_LINES, STATUS_LABELS, currentBindings, dateNumber, devicesForScope, periodOrders,
  scopeOrders, shiftDate, summarizeActivity, validatePeriod,
  type ActivityMetrics, type ActivityPeriod, type ActivityScope, type ActivityStatus, type ProductLine,
} from "./merchant-activity-domain";
import { activityDemoData as data, activityDemoOrders as resolved } from "./merchant-activity-data";

export const ACTIVITY_PATH = "/m-platform/merchants/activity";
export function isActivityPath(path: string): boolean { return path === ACTIVITY_PATH || path.startsWith(ACTIVITY_PATH + "/"); }
const state = {
  period: { start: shiftDate(data.asOf, -6), end: data.asOf } as ActivityPeriod,
  quick: "7", merchant: "", query: "", status: "",
};
const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const n = (value: number | null) => value === null ? "—" : value.toLocaleString("zh-CN");
const time = (value: string | null) => value ? esc(value.slice(0, 16).replace("T", " ")) : "—";
const href = (scope?: ActivityScope) => "#" + ACTIVITY_PATH + (scope ? "/store/" + encodeURIComponent(scope.storeId) +
  (scope.line ? "/line/" + encodeURIComponent(scope.line) : "") + (scope.deviceId ? "/device/" + encodeURIComponent(scope.deviceId) : "") : "");
const badge = (status: ActivityStatus) => '<span class="ma-badge ma-' + status + '">' + STATUS_LABELS[status] + "</span>";
function neverNote(scope: ActivityScope): string {
  const store = data.stores.find(s => s.id === scope.storeId)!;
  const binding = scope.deviceId ? currentBindings(data, scope)[0] : undefined;
  const start = binding?.from.slice(0, 10) ?? store.openedOn;
  return (scope.deviceId ? "已绑定 " : "已开通 ") + (dateNumber(data.asOf) - dateNumber(start)) + " 天，尚未点单";
}
function parsedScope(path: string): ActivityScope | null | undefined {
  if (path === ACTIVITY_PATH) return null;
  try {
    const parts = path.slice(ACTIVITY_PATH.length).split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== "store" || !parts[1] || ![2, 4, 6].includes(parts.length)) return undefined;
    const scope: ActivityScope = { storeId: parts[1] };
    if (!data.stores.some(s => s.id === scope.storeId)) return undefined;
    if (parts.length >= 4) {
      if (parts[2] !== "line" || !PRODUCT_LINES.includes(parts[3] as ProductLine)) return undefined;
      scope.line = parts[3] as ProductLine;
    }
    if (parts.length === 6) {
      if (parts[4] !== "device" || !data.devices.some(d => d.id === parts[5] &&
        data.bindings.some(b => b.deviceId === d.id && b.storeId === scope.storeId && b.line === scope.line))) return undefined;
      scope.deviceId = parts[5];
    }
    return scope;
  } catch { return undefined; }
}
export function activityPageTitle(path: string): { title: string; module: string } | null {
  return isActivityPath(path) ? { title: "商户使用活跃分析", module: "使用活跃分析" } : null;
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
    '</td><td class="ma-number">' + n(m.unknown) + '</td><td><a class="ma-link ma-nowrap" href="' + href({ storeId: store.id }) + '">查看产线 →</a></td></tr>').join("");
  return filterControls() + summaryCards([
    { label: "门店", value: String(rows.length), note: "当前筛选范围" },
    { label: "活跃门店", value: String(active), note: "最近点单距今 0～6 天" },
    { label: "需关注门店", value: String(follow), note: "最近点单距今 ≥7 天" },
    { label: "期间点单数", value: n(count), note: errors ? "已知合计 · " + errors + " 家数据异常未计入" : "按业务订单去重" },
  ]) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>门店使用情况</h3><p>点击门店，查看六条产线和点单设备的使用情况。</p></div><span>' + rows.length +
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
function storePage(scope: ActivityScope): string {
  const m = metrics(scope);
  const sum = PRODUCT_LINES.map(line => metrics({ storeId: scope.storeId, line })).reduce((a, b) => a + (b.count ?? 0), 0);
  const table = PRODUCT_LINES.map(line => {
    const row = metrics({ storeId: scope.storeId, line });
    return '<tr data-ma-line="' + line + '"><td><strong>' + line + '</strong></td><td>' + badge(row.status) + '</td>' +
      metricCells(row) + '<td class="ma-number">' + row.boundDevices + '</td><td class="ma-number">' + n(row.usedDevices) +
      '</td><td class="ma-number">' + n(row.unusedDevices) + '</td><td>' +
      (row.status === "unconfigured" ? "—" : '<a class="ma-link ma-nowrap" href="' + href({ storeId: scope.storeId, line }) + '">查看设备 →</a>') + '</td></tr>';
  }).join("");
  return scopeSummary(scope) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>产线使用情况</h3><p>' +
    (m.count === null ? "数据异常，订单指标暂不可用。" : "门店 " + n(m.count) + " 单 = 已识别产线 " + n(sum) + " 单 + 来源待识别 " + n(m.unknown) + " 单。") +
    '</p></div></div><div class="ma-table-wrap"><table><thead><tr><th>产线</th><th>当前活跃状态</th>' + metricHeaders +
    '<th class="ma-number">绑定设备</th><th class="ma-number">有订单设备</th><th class="ma-number">绑定中无订单</th><th>操作</th></tr></thead><tbody>' + table +
    '</tbody></table></div>' + (m.unknown ? '<p class="ma-inline-note">来源待识别：' + m.unknown + ' 单。设备 ID 缺失或无法唯一匹配下单时的 License 绑定关系，不计入任何产线与设备。</p>' : "") + '</section>';
}
function devicesPage(scope: ActivityScope): string {
  const devices = devicesForScope(data, resolved, scope, state.period);
  const rows = devices.map(device => {
    const deviceScope = { ...scope, deviceId: device.id };
    const m = metrics(deviceScope);
    const binding = currentBindings(data, deviceScope)[0];
    return '<tr data-ma-device="' + esc(device.id) + '"><td><a class="ma-link" href="' + href(deviceScope) + '">' + esc(device.name) +
      '</a><small>' + esc(device.id) + '</small></td><td>' + (binding ? esc(binding.licenseId) : "历史绑定") + '</td><td>' + badge(m.status) +
      '</td>' + metricCells(m) + '<td><a class="ma-link ma-nowrap" href="' + href(deviceScope) + '">查看明细 →</a></td></tr>';
  }).join("");
  return scopeSummary(scope) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>' + esc(scope.line!) +
    ' · 设备使用情况</h3><p>包含当前绑定的零订单设备，以及查询期间有订单的历史绑定设备。设备 ID 去重统计。</p></div><span>' + devices.length +
    ' 台设备</span></div><div class="ma-table-wrap"><table><thead><tr><th>点单设备／设备 ID</th><th>当前 License</th><th>当前活跃状态</th>' +
    metricHeaders + '<th>操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="11" class="ma-empty">该产线尚未绑定设备，期间也没有可识别的设备订单。</td></tr>') +
    '</tbody></table></div></section>';
}
function devicePage(scope: ActivityScope): string {
  const device = data.devices.find(d => d.id === scope.deviceId)!;
  const unavailable = data.stores.find(s => s.id === scope.storeId)!.quality === "error";
  const orders = periodOrders(scopeOrders(resolved, scope), state.period).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const bindings = data.bindings.filter(b => b.deviceId === device.id).sort((a, b) => b.from.localeCompare(a.from));
  const rows = orders.slice(0, 20).map(o => '<tr><td>' + esc(o.id) + '</td><td>' + time(o.submittedAt) + '</td><td>' +
    ({ paid: "支付完成", cancelled: "已取消", submitted: "已提交", draft: "草稿" }[o.status]) + '</td><td>' + esc(o.binding!.line) +
    '</td><td>' + esc(o.binding!.licenseId) + '</td></tr>').join("");
  return scopeSummary(scope) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>' + esc(device.name) +
    '</h3><p>设备 ID：' + esc(device.id) + ' · 当前查看产线：' + esc(scope.line!) + '</p></div></div><div class="ma-binding-list">' +
    bindings.map(b => '<p><strong>' + esc(b.line) + '</strong><span>' + esc(b.licenseId) + '</span><span>' + b.from.slice(0, 10) +
      (b.to ? ' 至 ' + b.to.slice(0, 10) + '（不含）' : ' 起至今') + '</span></p>').join("") + '</div></section>' +
    '<section class="ma-panel"><div class="ma-panel-title"><div><h3>点单记录</h3><p>' + (unavailable ? '数据异常，点单记录暂不可用。' : '查询期间共 ' + orders.length +
    ' 单，展示最近 20 单；统计指标包含全部符合条件的订单。') + '</p></div></div><div class="ma-table-wrap"><table><thead><tr><th>业务订单号</th><th>提交时间</th><th>订单状态</th><th>点单产线</th><th>下单时 License</th></tr></thead><tbody>' +
    (unavailable ? '<tr><td colspan="5" class="ma-empty">订单数据不可用，请勿按零订单判断设备使用情况。</td></tr>' : rows || '<tr><td colspan="5" class="ma-empty">统计期间无点单记录。</td></tr>') + '</tbody></table></div></section>';
}
function crumbs(scope: ActivityScope | null): string {
  if (!scope) return '<span>全部门店</span>';
  const store = data.stores.find(s => s.id === scope.storeId)!;
  return '<a href="' + href() + '">全部门店</a><span>／</span><a href="' + href({ storeId: scope.storeId }) + '">' + esc(store.name) +
    '</a>' + (scope.line ? '<span>／</span><a href="' + href({ storeId: scope.storeId, line: scope.line }) + '">' + esc(scope.line) + '</a>' : "") +
    (scope.deviceId ? '<span>／</span><span>设备明细</span>' : "");
}
export function renderActivityPage(path: string): string {
  const scope = parsedScope(path);
  if (scope === undefined) return '<section class="ma-page"><h2>未找到演示页面</h2><a class="ma-link" href="' + href() + '">返回全部门店</a></section>';
  const store = scope && data.stores.find(s => s.id === scope.storeId);
  const issue = store && store.quality === "error";
  return '<div class="ma-page" data-ma-page><div class="ma-heading"><div><div class="ma-kicker">MERCHANT ACTIVITY <span>演示数据</span></div><h2>' +
    (scope ? esc(store!.name) + (scope.line ? ' · ' + esc(scope.line) : '') : "商户使用活跃分析") +
    '</h2><p>' + (store ? esc(store.merchantName) + ' · ' + esc(store.scenario) : "从门店到产线、设备，查看系统使用情况。") +
    '</p></div><div class="ma-asof"><span>统计截至日期</span><strong>' + data.asOf + '</strong><small>门店时区：Asia/Shanghai</small></div></div>' +
    '<nav class="ma-crumbs" aria-label="活跃分析位置">' + crumbs(scope) + '</nav>' +
    '<p class="ma-demo-note">预设演示数据 · 刷新保持稳定 · 仅支持最近 90 天查询</p>' +
    dateControls() + (issue ? '<p class="ma-error-note" role="alert">受控异常演示：该门店订单数据不可用，指标显示“—”，不作为真实零订单。</p>' : "") +
    (scope ? (scope.deviceId ? devicePage(scope) : scope.line ? devicesPage(scope) : storePage(scope)) : rootPage()) +
    '<section class="ma-rules"><strong>活跃判定</strong><p>最近点单距今 0～6 天：活跃；7～13 天：近期未使用；14～29 天：疑似停用；≥30 天：长期未使用。从未点单：尚未使用。</p>' +
    '<p>点单量按成功提交的业务订单去重，取消单仍计入；草稿不计入。跨设备收款不改变点单来源。状态按截至日期判断，查询期间只影响订单及使用频率指标。</p>' +
    '<p>绑定设备按截至日期统计；有订单设备按查询期间统计，可能包含历史绑定设备。不同产线的设备数可能包含同一台跨产线使用设备，门店总设备数按设备 ID 去重。</p></section></div>';
}
export function bindActivityPage(onMount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-ma-page]");
  if (!root) return;
  root.querySelectorAll<HTMLButtonElement>("[data-ma-quick]").forEach(button => button.addEventListener("click", () => {
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
    state.period = period; state.quick = ""; onMount();
  });
  root.querySelector<HTMLFormElement>("[data-ma-filter-form]")?.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    state.merchant = String(form.get("merchant") ?? "");
    state.status = String(form.get("status") ?? "");
    state.query = String(form.get("query") ?? "").trim();
    onMount();
  });
  root.querySelector("[data-ma-reset]")?.addEventListener("click", () => {
    state.merchant = ""; state.status = ""; state.query = ""; onMount();
  });
}
