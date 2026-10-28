import "./merchant-activity.css";
import {
  PRODUCT_LINES, STATUS_LABELS, dateNumber, periodOrders, shiftDate, validatePeriod,
  type ActivityPeriod, type ActivityStatus,
} from "./merchant-activity-domain";
import { activityDemoData as data, activityDemoOrders as orders } from "./merchant-activity-data";
import { deviceLifetimeOrders, filterDeviceRows, globalDeviceRows, type DeviceActivityRow } from "./device-activity-domain";

export const DEVICE_ACTIVITY_PATH = "/m-platform/merchants/device-activity";
export const isDeviceActivityPath = (path: string) => path === DEVICE_ACTIVITY_PATH || path.startsWith(DEVICE_ACTIVITY_PATH + "/");
export const deviceActivityPageTitle = (path: string) => isDeviceActivityPath(path) ? { title: "设备活跃分析", module: "系统使用分析" } : null;
const state = { period: { start: shiftDate(data.asOf, -6), end: data.asOf } as ActivityPeriod,
  quick: "7", brand: "", store: "", line: "", status: "", query: "", page: 1,
  rootScroll: 0, wasOpen: false, returnDeviceId: "", returnEntry: "name", dateError: "",
  filterDraft: null as Record<string, string> | null, periodDraft: null as Record<string, string> | null };
const PAGE_SIZE = 20;
const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const num = (value: number | null) => value === null ? "—" : value.toLocaleString("zh-CN");
const time = (value: string | null) => value ? value.slice(0, 16).replace("T", " ") : "—";
const label = (status: ActivityStatus) => status === "unconfigured" ? "未绑定" : STATUS_LABELS[status];
const badge = (row: DeviceActivityRow) => '<span class="ma-badge ma-' + row.metrics.status + '">' + label(row.metrics.status) + "</span>";
const rootHref = "#" + DEVICE_ACTIVITY_PATH;
const detailHref = (id: string) => rootHref + "/" + encodeURIComponent(id);
const option = (value: string, text: string, selected: string) => '<option value="' + esc(value) + '"' + (value === selected ? " selected" : "") + ">" + esc(text) + "</option>";
function storeOptions(brand: string, selected: string): string {
  return option("", "全部门店", selected) + data.stores.filter(s => !brand || s.merchantId === brand).map(s => option(s.id, s.name, selected)).join("");
}
function owner(row: DeviceActivityRow, field: "line" | "brand" | "store"): string {
  if (row.issue === "binding") return "归属待核对";
  if (!row.binding) return "未绑定";
  return field === "line" ? row.binding.line : field === "brand" ? row.store!.merchantName : row.store!.name;
}
function dates(): string {
  return '<form class="ma-period" data-device-period data-device-activity-browse><span class="ma-field-caption">统计期间</span><div class="ma-segment">' +
    [["1", "今日"], ["7", "近 7 天"], ["30", "近 30 天"]].map(([value, text]) => '<button type="button" data-device-quick="' + value +
      '" aria-pressed="' + (state.quick === value) + '">' + text + "</button>").join("") + '</div>' +
    '<label>开始日期<input type="date" name="start" aria-label="开始日期" required min="' + shiftDate(data.asOf, -89) + '" max="' + data.asOf + '" value="' + state.period.start + '"></label>' +
    '<span class="ma-date-separator">至</span><label>结束日期<input type="date" name="end" aria-label="结束日期" required min="' + shiftDate(data.asOf, -89) + '" max="' + data.asOf + '" value="' + state.period.end + '"></label>' +
    '<button type="submit" class="ma-primary">查询</button><p data-device-date-error class="ma-form-error" role="alert" hidden></p></form>';
}
function filters(): string {
  const brands = [...new Map(data.stores.map(s => [s.merchantId, s.merchantName])).entries()];
  return '<form class="ma-filters" data-device-filters data-device-activity-browse><label>所属品牌<select name="brand" aria-label="所属品牌">' +
    option("", "全部品牌", state.brand) + brands.map(([id, name]) => option(id, name, state.brand)).join("") +
    '</select></label><label>所属门店<select name="store" aria-label="所属门店">' + storeOptions(state.brand, state.store) +
    '</select></label><label>当前产线<select name="line" aria-label="当前产线">' + option("", "全部产线", state.line) +
    PRODUCT_LINES.map(line => option(line, line, state.line)).join("") + option("__unbound", "未绑定", state.line) +
    '</select></label><label>活跃状态<select name="status" aria-label="活跃状态">' + option("", "全部状态", state.status) +
    (Object.keys(STATUS_LABELS) as ActivityStatus[]).map(status => option(status, label(status), state.status)).join("") +
    '</select></label><label class="ma-search">设备搜索<input name="query" maxlength="80" aria-label="设备搜索" placeholder="设备名称、设备 ID 或当前 License" value="' + esc(state.query) +
    '"></label><button type="submit">筛选</button><button type="button" data-device-reset>重置筛选</button></form>';
}
function cards(values: { title: string; value: string; note: string }[]): string {
  return '<div class="ma-cards">' + values.map(v => '<div class="ma-card"><span>' + v.title + '</span><strong>' + v.value +
    '</strong><small>' + v.note + '</small></div>').join("") + '</div>';
}
function rootPage(): string {
  const filtered = filterDeviceRows(globalDeviceRows(data, orders, state.period), state);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), pages);
  const rows = filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
  const errorCount = filtered.filter(r => r.issue).length;
  const body = rows.map(row => {
    const m = row.metrics;
    return '<tr data-global-device="' + esc(row.device.id) + '"><td><a data-device-open="' + esc(row.device.id) + '" data-device-entry="name" class="ma-link" href="' + detailHref(row.device.id) + '">' +
      esc(row.device.name) + '</a><small>' + esc(row.device.id) + '</small></td><td>' + badge(row) +
      (m.status === "never" && row.binding ? '<small>已绑定 ' + (dateNumber(data.asOf) - dateNumber(row.binding.from.slice(0, 10))) + ' 天</small>' : "") +
      '</td><td>' + esc(owner(row, "line")) + '</td><td>' + esc(owner(row, "brand")) + '</td><td>' + esc(owner(row, "store")) +
      '</td><td class="ma-number">' + num(m.count) + '</td><td class="ma-number">' + num(m.activeDays) +
      '</td><td class="ma-number">' + (m.dailyAverage === null ? "—" : m.dailyAverage.toFixed(1)) +
      '</td><td>' + time(m.latest) + '</td><td class="ma-number">' + num(m.daysSince) +
      '</td><td><a data-device-open="' + esc(row.device.id) + '" data-device-entry="action" class="ma-link" href="' + detailHref(row.device.id) + '">查看明细 →</a></td></tr>';
  }).join("");
  return filters() + cards([
    { title: "设备总数", value: String(filtered.length), note: "当前筛选范围 · 按设备 ID 去重" },
    { title: "活跃设备", value: String(filtered.filter(r => r.metrics.status === "active").length), note: "最近点单距今 0～6 天" },
    { title: "期间有订单设备", value: String(filtered.filter(r => (r.metrics.count ?? 0) > 0).length), note: errorCount ? errorCount + " 台数据异常未计入" : "统计期间至少有 1 笔点单" },
    { title: "需关注设备", value: String(filtered.filter(r => ["recent", "suspected", "long"].includes(r.metrics.status)).length), note: "最近点单距今 ≥7 天" },
  ]) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3 data-device-list-title tabindex="-1">全部设备活跃情况</h3></div><span>' +
    filtered.length + ' 台设备' + (errorCount ? ' · ' + errorCount + ' 台异常' : "") + '</span></div><div class="ma-table-wrap"><table><thead><tr>' +
    '<th>设备／设备 ID</th><th>当前活跃状态</th><th>当前产线</th><th>所属品牌</th><th>所属门店</th><th class="ma-number">点单数</th>' +
    '<th class="ma-number">有订单天数</th><th class="ma-number">日均点单</th><th>最近点单时间</th><th class="ma-number">连续无订单天数</th><th>操作</th>' +
    '</tr></thead><tbody>' + (body || '<tr><td colspan="11" class="ma-empty">没有符合筛选条件的设备，请调整条件或重置筛选。</td></tr>') +
    '</tbody></table></div><div class="ma-panel-title" data-device-activity-browse><span>第 ' + state.page + ' / ' + pages + ' 页 · 每页 ' + PAGE_SIZE +
    ' 台 · 共 ' + filtered.length + ' 台</span><div class="flex gap-2"><button type="button" data-device-page="-1"' + (state.page === 1 ? " disabled" : "") +
    '>上一页</button><button type="button" data-device-page="1"' + (state.page >= pages ? " disabled" : "") + '>下一页</button></div></div></section>';
}
function detailPage(row: DeviceActivityRow): string {
  const m = row.metrics;
  const selected = periodOrders(deviceLifetimeOrders(orders, row.device.id), state.period).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const history = [...row.history].sort((a, b) => b.from.localeCompare(a.from));
  const deviceOrders = selected.slice(0, 20).map(o => {
    const store = data.stores.find(s => s.id === o.binding!.storeId);
    return '<tr><td>' + esc(o.id) + '</td><td>' + time(o.submittedAt) + '</td><td>' +
      ({ submitted: "已提交", paid: "支付完成", cancelled: "已取消", draft: "草稿" }[o.status]) +
      '</td><td>' + esc(o.binding!.line) + '</td><td>' + esc(store?.merchantName ?? "归属待核对") + '</td><td>' +
      esc(store?.name ?? "归属待核对") + '</td><td>' + esc(o.binding!.licenseId) + '</td></tr>';
  }).join("");
  return (row.issue ? '<p class="ma-error-note" role="alert">' + (row.issue === "binding" ? '存在多个有效 License 或归属缺失，请核对设备绑定；订单指标暂不可用。' :
    '受控异常演示：该设备涉及的数据不可用，不能按零订单判断使用情况。') + '</p>' : "") +
    cards([
      { title: "当前活跃状态", value: badge(row), note: "按设备全部历史点单及截至日期判断" },
      { title: "期间点单数", value: num(m.count), note: "支付完成 " + num(m.paid) + " · 取消 " + num(m.cancelled) },
      { title: "有订单天数", value: num(m.activeDays), note: "日均 " + (m.dailyAverage === null ? "—" : m.dailyAverage.toFixed(1)) + " 单" },
      { title: "最近点单时间", value: m.latest ? m.latest.slice(5, 16).replace("T", " ") : "—", note: "连续无订单 " + num(m.daysSince) + " 天" },
    ]) + '<section class="ma-panel"><div class="ma-panel-title"><div><h3>设备当前归属</h3><p>设备 ID：' + esc(row.device.id) +
    '</p></div></div><div class="ma-binding-list"><p><strong>当前产线</strong><span>' + esc(owner(row, "line")) +
    '</span><strong>所属品牌</strong><span>' + esc(owner(row, "brand")) + '</span><strong>所属门店</strong><span>' + esc(owner(row, "store")) +
    '</span></p><p><strong>当前 License</strong><span>' + (row.issue === "binding" ? "归属待核对" : row.binding ? esc(row.binding.licenseId) : "未绑定") + '</span></p></div></section>' +
    '<section class="ma-panel"><div class="ma-panel-title"><div><h3>License 绑定历史</h3><p>历史订单按以下有效时间区间归属。</p></div></div><div class="ma-table-wrap"><table><thead><tr>' +
    '<th>License</th><th>产线</th><th>品牌</th><th>门店</th><th>生效时间</th><th>失效时间（不含）</th></tr></thead><tbody>' +
    (history.map(b => { const s = data.stores.find(store => store.id === b.storeId); return '<tr><td>' + esc(b.licenseId) +
      '</td><td>' + esc(b.line) + '</td><td>' + esc(s?.merchantName ?? "归属待核对") + '</td><td>' + esc(s?.name ?? "归属待核对") +
      '</td><td>' + time(b.from) + '</td><td>' + (b.to ? time(b.to) : "至今") + '</td></tr>'; }).join("") ||
      '<tr><td colspan="6" class="ma-empty">该设备尚未绑定 License。</td></tr>') +
    '</tbody></table></div></section><section class="ma-panel"><div class="ma-panel-title"><div><h3>设备点单记录</h3><p>' +
    (row.issue ? "数据异常，点单记录暂不可用。" : "期间共 " + selected.length + " 单，展示最近 20 单；含该设备所有历史产线与门店的可识别点单。") +
    '</p></div></div><div class="ma-table-wrap"><table><thead><tr><th>业务订单号</th><th>提交时间</th><th>订单状态</th><th>下单产线</th><th>下单品牌</th><th>下单门店</th><th>下单时 License</th></tr></thead><tbody>' +
    (row.issue ? '<tr><td colspan="7" class="ma-empty">订单数据不可用，请勿按零订单判断设备使用情况。</td></tr>' : deviceOrders ||
      '<tr><td colspan="7" class="ma-empty">统计期间无点单记录。</td></tr>') + '</tbody></table></div></section>';
}
function deviceDrawer(row: DeviceActivityRow): string {
  return '<div class="ma-drawer-backdrop" data-device-activity-browse><section class="ma-store-drawer ma-device-drawer" role="dialog" aria-modal="true" aria-labelledby="device-drawer-title" data-drawer-device="' + esc(row.device.id) + '" tabindex="-1">' +
    '<header class="ma-drawer-heading"><div><p>设备明细</p><h2 id="device-drawer-title">' + esc(row.device.name) + '</h2><p>设备 ID：' + esc(row.device.id) + '</p>' +
    '<div class="ma-drawer-context">' + badge(row) + '<span>当前产线：' + esc(owner(row, "line")) + '</span><span>所属品牌：' + esc(owner(row, "brand")) +
    '</span><span>所属门店：' + esc(owner(row, "store")) + '</span></div><p>统计期间：' + state.period.start + ' 至 ' + state.period.end + '</p></div>' +
    '<button type="button" data-device-drawer-close aria-label="关闭设备明细">关闭 ×</button></header>' +
    '<div class="ma-drawer-body">' + detailPage(row) + '</div></section></div>';
}
export function renderDeviceActivityPage(path: string): string {
  const rows = globalDeviceRows(data, orders, state.period);
  let row: DeviceActivityRow | undefined;
  if (path !== DEVICE_ACTIVITY_PATH) {
    try { const id = decodeURIComponent(path.slice(DEVICE_ACTIVITY_PATH.length + 1)); row = rows.find(r => r.device.id === id); } catch { /* invalid path */ }
    if (!row) return '<section class="ma-page"><h2>未找到演示设备</h2><a class="ma-link" href="' + rootHref + '">返回全部设备</a></section>';
  }
  return '<div class="ma-page" data-device-activity-page><div data-device-background' + (row ? ' inert' : '') + '>' + dates() + rootPage() +
    '<section class="ma-rules"><strong>统计口径</strong><p>品牌、门店和产线筛选按当前唯一有效 License 绑定关系；未绑定设备独立保留，多个有效绑定显示归属待核对。</p>' +
    '<p>设备点单量按设备 ID 汇总查询期间所有历史产线与门店，来源无法识别的订单不分摊到设备。设备状态按全历史最近点单判定，修改期间不改变当前活跃状态。</p>' +
    '<p>0～6 天活跃；7～13 天近期未使用；14～29 天疑似停用；≥30 天长期未使用。已绑定从未点单为尚未使用；无绑定且无历史点单为未绑定。异常数据以 — 展示。</p></section></div>' +
    (row ? deviceDrawer(row) : '') + '</div>';
}
export function bindDeviceActivityPage(onMount: () => void): void {
  const root = document.querySelector<HTMLElement>("[data-device-activity-page]");
  if (!root) return;
  root.querySelectorAll<HTMLButtonElement>("[data-device-quick]").forEach(button => button.addEventListener("click", () => {
    state.periodDraft = null; state.dateError = ""; state.quick = button.dataset.deviceQuick!; state.period = { start: shiftDate(data.asOf, 1 - Number(state.quick)), end: data.asOf }; state.page = 1; onMount();
  }));
  root.querySelector<HTMLFormElement>("[data-device-period]")?.addEventListener("submit", event => {
    event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement);
    const period = { start: String(form.get("start") ?? ""), end: String(form.get("end") ?? "") };
    const error = validatePeriod(period, data.asOf), note = root.querySelector<HTMLElement>("[data-device-date-error]")!;
    if (error) { state.dateError = error; note.hidden = false; note.textContent = error; return; }
    state.periodDraft = null; state.dateError = ""; state.period = period; state.quick = ""; state.page = 1; onMount();
  });
  root.querySelector<HTMLSelectElement>("[name=brand]")?.addEventListener("change", event => {
    const store = root.querySelector<HTMLSelectElement>("[name=store]")!;
    store.innerHTML = storeOptions((event.target as HTMLSelectElement).value, "");
  });
  root.querySelector<HTMLFormElement>("[data-device-filters]")?.addEventListener("submit", event => {
    event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement);
    state.filterDraft = null;
    for (const key of ["brand", "store", "line", "status", "query"] as const) state[key] = String(form.get(key) ?? "").trim();
    state.page = 1; onMount();
  });
  root.querySelector("[data-device-reset]")?.addEventListener("click", () => {
    state.filterDraft = null; state.brand = ""; state.store = ""; state.line = ""; state.status = ""; state.query = ""; state.page = 1; onMount();
  });
  root.querySelectorAll<HTMLButtonElement>("[data-device-page]").forEach(button => button.addEventListener("click", () => {
    state.page += Number(button.dataset.devicePage); onMount();
  }));
  const dialog = root.querySelector<HTMLElement>('.ma-device-drawer');
  const restoreDraft = (selector: string, draft: Record<string, string> | null) => {
    if (!draft) return;
    const form = root.querySelector<HTMLFormElement>(selector);
    if (selector === '[data-device-filters]') {
      const store = form?.elements.namedItem('store');
      if (store instanceof HTMLSelectElement) store.innerHTML = storeOptions(draft.brand ?? '', draft.store ?? '');
    }
    for (const [name, value] of Object.entries(draft)) {
      const control = form?.elements.namedItem(name);
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value;
    }
  };
  restoreDraft('[data-device-filters]', state.filterDraft);
  restoreDraft('[data-device-period]', state.periodDraft);
  if (state.dateError) {
    const note = root.querySelector<HTMLElement>('[data-device-date-error]')!;
    note.hidden = false; note.textContent = state.dateError;
  }
  root.scrollTop = state.rootScroll;
  if (dialog) root.style.overflow = 'hidden';
  root.addEventListener('scroll', () => { if (!dialog) state.rootScroll = root.scrollTop; });
  root.addEventListener('click', event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('[data-device-open]');
    if (dialog || !anchor) return;
    const saveDraft = (selector: string) => Object.fromEntries([...new FormData(root.querySelector<HTMLFormElement>(selector)!)].map(([key, value]) => [key, String(value)]));
    state.rootScroll = root.scrollTop;
    state.filterDraft = saveDraft('[data-device-filters]'); state.periodDraft = saveDraft('[data-device-period]');
    state.returnDeviceId = anchor.dataset.deviceOpen!; state.returnEntry = anchor.dataset.deviceEntry!;
  });
  const closeDrawer = () => { location.hash = DEVICE_ACTIVITY_PATH; };
  root.querySelector('[data-device-drawer-close]')?.addEventListener('click', closeDrawer);
  root.querySelector('.ma-drawer-backdrop')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeDrawer();
  });
  if (dialog) {
    state.wasOpen = true;
    if (!state.returnDeviceId) state.returnDeviceId = dialog.dataset.drawerDevice!;
    dialog.querySelector<HTMLElement>('[data-device-drawer-close]')?.focus({ preventScroll: true });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDrawer(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')]
        .filter(control => control.tabIndex >= 0 && !control.hasAttribute('disabled') && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  } else if (state.wasOpen) {
    state.wasOpen = false;
    const entry = root.querySelector<HTMLElement>('[data-device-open="' + CSS.escape(state.returnDeviceId) + '"][data-device-entry="' + CSS.escape(state.returnEntry) + '"]');
    (entry ?? root.querySelector<HTMLElement>('[data-device-list-title]'))?.focus({ preventScroll: true });
    state.returnDeviceId = ''; state.returnEntry = 'name';
  }

}
