import './merchant-activity.css';
import './activity-notifications.css';
import { activityDemoData, refreshActivityDemoData } from './merchant-activity-data';
import { activityScopeHref } from './merchant-activity-drilldown';
import { providerTargetAllowed } from '../auth/provider-access-runtime';
import { listStaffLoginAccounts } from '../permissions/enterprise-staff-account-store';
import { currentMAccess, currentMAccount, readMState, requireMAction } from '../permissions/m-platform-store';
import { mActionKey, mPageKey } from '../permissions/m-platform-catalog';
import { mResolve } from '../permissions/m-platform-domain';
import { providerCanTarget } from '../permissions/provider-access-domain';
import { readProviderState } from '../permissions/provider-access-store';
import { completeDay, emptyState, inspect, levels, notificationPage, ownersFor, prepareBatch, type State } from './activity-notifications';

const key = 'menusifu:activity-follow-up:v1';
const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const can = (action: string) => currentMAccess(mActionKey(notificationPage, action)) === 'edit';
const button = (label: string, command: string, id = '', primary = false) =>
  `<button type="button" class="rounded-md border border-border px-3 py-2 ${primary ? 'bg-primary text-primary-foreground' : 'bg-card'}" ${command === 'tab' ? `aria-pressed="${primary}"` : ''} data-command="${command}" data-id="${esc(id)}">${label}</button>`;
const table = (headers: string[], rows: string[], empty = '暂无记录') =>
  `<div class="overflow-auto"><table class="an-table w-full text-left"><thead class="bg-muted"><tr>${headers.map(label => `<th class="p-3">${label}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td class="p-6" colspan="${headers.length}">${empty}</td></tr>`}</tbody></table></div>`;
const tr = (...cells: string[]) => '<tr class="border-b border-border">' + cells.map(cell => '<td class="p-3">' + cell + '</td>').join('') + '</tr>';
let ownerView = 'people';
let view = 'cases', filter = 'open', message = '';
function read(): State {
  const raw = localStorage.getItem(key);
  if (raw === null) return emptyState();
  const state: State = JSON.parse(raw);
  if (!Number.isInteger(state.revision) || !state.brands || !state.stores || !state.settings || !state.cases || !Array.isArray(state.deliveries)) throw Error('异常跟进数据无法读取');
  return state;
}
function snapshot() {
  refreshActivityDemoData();
  const state = read();
  const today = activityDemoData.asOf, day = completeDay(today);
  const stores = activityDemoData.stores.filter(store => providerTargetAllowed(store.merchantId, store.id));
  const rows = inspect({ ...activityDemoData, stores }, day, state);
  const people = listStaffLoginAccounts().map(a => ({ id: a.employeeId, name: a.employeeName, email: a.loginEmail, enabled: a.enabled }));
  return { state, day, today, stores, rows, people };
}
type Snapshot = ReturnType<typeof snapshot>;
function batch(s: Snapshot) {
  const directory = readProviderState(), grants = readMState();
  return prepareBatch(s.state, s.rows, s.today, s.people, (person, store) =>
    providerCanTarget(directory, person.id, { brandId: store.merchantId, storeId: store.id }) &&
    mResolve(grants, person.id, mPageKey(notificationPage), person.enabled) !== 'hidden');
}
function persist(s: Snapshot) {
  if (read().revision !== s.state.revision) throw Error('数据已更新，请关闭窗口后重新打开');
  s.state.revision++;
  localStorage.setItem(key, JSON.stringify(s.state));
}
function remember(s: Snapshot) {
  for (const { store, current } of s.rows) if (current.level !== 4) s.state.cases[store.id] = current;
}
const names = (s: Snapshot, id?: string) => esc(s.people.find(person => person.id === id)?.name ?? (id ? '账号不可用' : '未配置'));
const lastFollow = (row: Snapshot['rows'][number]) => row.current.history[0]?.status ?? '待跟进';
const tabs = { cases: '异常清单', owners: '负责人配置', settings: '通知设置', logs: '发送记录' };
function peopleSelect(s: Snapshot, field: string, value: string | undefined, inherit = false) {
  const options = [...(inherit ? [['inherit', '继承品牌']] : []), ['', '未配置'], ...s.people.filter(p => p.enabled || p.id === value).map(p => [p.id, p.name])];
  return `<select class="rounded border border-border bg-background p-2" name="${field}">${options.map(([id, label]) => `<option value="${esc(id)}" ${id === (value ?? (inherit ? 'inherit' : '')) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select>`;
}
const field = (label: string, content: string) => `<label class="grid gap-1">${label}${content}</label>`;

export function renderNotifications(): string {
  try {
    const s = snapshot();
    let content = '';
    if (view === 'cases') {
      const rows = s.rows.filter(row => filter === 'all' || (filter === 'open' ? row.current.level > 0 : String(row.current.level) === filter));
      content = `<div class="an-toolbar flex flex-wrap items-end justify-between gap-3">
        ${field('异常状态', `<select data-notification-browse id="notification-filter" class="rounded border border-border bg-background p-2">${[['open', '当前异常'], ['all', '全部'], ...levels.map((label, i) => [String(i), label])].map(([id, label]) => `<option value="${id}" ${filter === id ? 'selected' : ''}>${label}</option>`).join('')}</select>`)}
        <div class="flex gap-2">${can('send') ? button('检查异常', 'check') + button('预览邮件', 'preview', '', true) : ''}</div></div>` +
        table(['品牌 / 门店', '异常状态', '最近订单', '无单天数', '销售 / 客户经理', '跟进状态', '最近通知', '操作'], rows.map(row => {
          const { store, current } = row;
          const owner = ownersFor(s.state, store);
          const paused = current.pause && current.pause.until >= s.today;
          const last = s.state.deliveries.find(log => log.store === store.id);
          const href = activityScopeHref({ storeId: store.id });
          return tr(`<span class="an-store">${esc(store.name)}</span><span class="an-secondary">${esc(store.merchantName)}</span>`, `<span class="an-status ma-${['active','recent','suspected','long','error'][current.level]}">${esc(levels[current.level])}</span>`, current.level === 4 ? '—' : esc(current.latest || '—'),
            current.level === 4 ? '—' : String(current.days), names(s, owner.sales) + ' / ' + names(s, owner.manager),
            esc(lastFollow(row)) + (paused ? '<br>暂停至 ' + esc(current.pause?.until) : ''), last ? esc(last.day + (last.result === 'success' ? ' 模拟成功' : ' 模拟失败')) : '—',
            `<div class="an-actions">${can('follow') && current.level !== 4 ? button('记录跟进', 'follow', store.id) : ''}<a class="text-primary" href="${esc(href)}">查看使用情况</a></div>`);
        }), '没有符合条件的门店');
    } else if (view === 'owners') {
      content = `<div data-notification-browse class="an-toolbar flex flex-wrap gap-2" aria-label="负责人配置方式">${button('按人员', 'owner-view', 'people', ownerView === 'people')}${button('按门店／品牌', 'owner-view', 'stores', ownerView === 'stores')}</div>`;
      if (ownerView === 'people') {
        content += table(['员工', '负责销售的门店', '负责客户经理的门店', '操作'], s.people.filter(person => person.enabled).map(person => {
          const list = (role: 'sales' | 'manager') => {
            const assigned = s.stores.filter(store => ownersFor(s.state, store)[role] === person.id);
            return assigned.length ? `<strong>${assigned.length} 家</strong><div class="an-secondary an-store-list">${assigned.map(store => esc(store.merchantName + ' / ' + store.name)).join('、')}</div>` : '—';
          };
          return tr(`<strong>${esc(person.name)}</strong><div class="an-secondary">${esc(person.email)}</div>`, list('sales'), list('manager'),
            can('owners') ? `<div class="an-actions">${button('配置销售门店', 'sales', person.id)}${button('配置客户经理门店', 'manager', person.id)}</div>` : '—');
        }));
      } else {
        const brands = [...new Map(s.stores.map(store => [store.merchantId, store])).values()].filter(store => providerTargetAllowed(store.merchantId));
        content += table(['范围', '负责销售', '客户经理', '操作'], [
          ...brands.map(store => tr(esc(store.merchantName) + ' · 品牌默认', names(s, s.state.brands[store.merchantId]?.sales), names(s, s.state.brands[store.merchantId]?.manager), can('owners') ? button('编辑', 'brand', store.merchantId) : '—')),
          ...s.stores.map(store => {
            const overrides = s.state.stores[store.id], owner = ownersFor(s.state, store);
            return tr(esc(store.merchantName) + ' / ' + esc(store.name),
              names(s, owner.sales) + (overrides?.sales === undefined ? ' · 继承' : ''),
              names(s, owner.manager) + (overrides?.manager === undefined ? ' · 继承' : ''), can('owners') ? button('编辑', 'store', store.id) : '—');
          }),
        ]);
      }
    } else if (view === 'settings') {
      const settings = s.state.settings;
      content = `<div class="grid gap-3 p-4"><p>每日 ${esc(settings.time)} 汇总 · 未跟进每 ${settings.interval} 天提醒</p>
        <p>主送：${[settings.sales && '销售', settings.manager && '客户经理'].filter(Boolean).join('、')}</p>
        <p>抄送：${names(s, settings.cc)} · 长期异常主管：${names(s, settings.supervisor)} · 兜底运营：${names(s, settings.operations)}</p>
        <div>${can('settings') ? button('编辑设置', 'settings') : ''}</div></div>`;
    } else {
      const visible = new Map(s.stores.map(store => [store.id, store.name]));
      content = table(['日期', '收件邮箱', '门店', '类型', '结果'], s.state.deliveries.filter(log => visible.has(log.store)).map(log =>
        tr(esc(log.day), esc(log.email), esc(visible.get(log.store)), esc(levels[log.level]), log.result === 'success' ? '模拟成功' : '模拟失败')));
    }
    return `<section class="ma-page an-page" id="activity-follow-up">
      <p role="note" class="text-muted-foreground">演示数据 · 统计截至 ${esc(s.day)}（Asia/Shanghai） · 邮件仅模拟，定时任务待接入</p>
      <div data-notification-browse class="an-tabs" aria-label="异常跟进视图">${Object.entries(tabs).map(([id, label]) => button(label, 'tab', id, view === id)).join('')}</div>
      <p role="status">${esc(message)}</p>
      <div class="an-panel rounded-lg border border-border bg-card">${content}</div>
      <dialog id="notification-dialog" aria-labelledby="notification-dialog-title" class="an-dialog m-auto max-h-[85vh] max-w-[95vw] overflow-auto rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/40"></dialog>
    </section>`;
  } catch {
    return '<p role="alert" class="p-4">无法读取异常跟进数据，请检查本地数据和访问权限。</p>';
  }
}

export function bindNotifications(mount: () => void) {
  const root = document.querySelector<HTMLElement>('#activity-follow-up');
  const dialog = root?.querySelector<HTMLDialogElement>('dialog');
  if (!root || !dialog) return;
  root.querySelector('#notification-filter')?.addEventListener('change', event => {
    filter = (event.target as HTMLSelectElement).value;
    mount();
    document.querySelector<HTMLElement>('#notification-filter')?.focus();
  });
  function open(title: string, body: string, action: string, commit: (form: FormData) => void, label = '保存') {
    dialog!.innerHTML = `<form class="grid"><div class="an-dialog-header flex items-center justify-between gap-4"><button type="button" data-close aria-label="关闭">×</button>
      <h2 id="notification-dialog-title" class="font-semibold">${title}</h2><button class="rounded bg-primary px-3 py-2 text-primary-foreground" type="submit">${label}</button></div>
      <div class="an-dialog-body">${body}<p data-error role="alert"></p></div></form>`;
    const form = dialog!.querySelector('form')!;
    let dirty = false;
    form.addEventListener('input', () => { dirty = true; });
    const close = () => { if (!dirty || confirm('放弃未保存的修改？')) dialog!.close(); };
    dialog!.oncancel = event => { event.preventDefault(); close(); };
    dialog!.onclick = event => { if (event.target === dialog || (event.target as Element).closest('[data-close]')) close(); };
    form.onsubmit = event => {
      event.preventDefault();
      try {
        requireMAction(notificationPage, action);
        commit(new FormData(form));
        dialog!.close();
        mount();
      } catch (error) {
        form.querySelector('[data-error]')!.textContent = error instanceof Error ? error.message : '操作失败';
      }
    };
    dialog!.showModal();
  }
  root.addEventListener('click', event => {
    const control = (event.target as Element).closest<HTMLElement>('button[data-command]');
    if (!control) return;
    const id = control.dataset.id ?? '', command = control.dataset.command;
    if (command === 'owner-view') { ownerView = id; message = ''; mount(); return; }
    if (command === 'tab') { view = id; message = ''; mount(); return; }
    try {
      const s = snapshot();
      if (command === 'check') {
        requireMAction(notificationPage, 'send');
        remember(s); persist(s);
        message = '已按最后完整自然日更新异常清单';
        mount();
      } else if (command === 'preview') {
        requireMAction(notificationPage, 'send');
        const preview = batch(s);
        open('邮件预览', `<p>${preview.groups.length} 封汇总邮件 · ${preview.blocked.length} 项待分配或修正</p>
          ${preview.groups.map(({ person, items }) => `<section class="an-recipient">
            <header><div><strong>${esc(person.name)}</strong><div class="an-secondary">${esc(person.email)}</div></div><span class="an-secondary">${items.length} 家门店</span></header>
            ${table(['品牌 / 门店', '状态', '最近订单', '无单天数', '收件角色'], items.map(item => tr(esc(item.brand + ' / ' + item.name), esc(levels[item.level]), esc(item.latest || '—'), item.level === 4 ? '—' : String(item.days), esc(item.reason))))}</section>`).join('')}
          ${preview.blocked.map(item => `<p>${esc(item.store + ' · ' + item.reason)}</p>`).join('')}
          ${preview.groups.length > 1 ? field('演示一次失败（可选）', `<select name="fail"><option value="">全部模拟成功</option>${preview.groups.map(group => `<option value="${esc(group.person.id)}">${esc(group.person.name)}</option>`).join('')}</select>`) : ''}`,
        'send', form => {
          const fresh = snapshot(), next = batch(fresh);
          if (fresh.state.revision !== s.state.revision || JSON.stringify(preview) !== JSON.stringify(next)) throw Error('收件范围已变化，请重新预览');
          if (!next.groups.length) throw Error('当前没有可发送的邮件');
          remember(fresh);
          let failed = 0;
          const logs = next.groups.flatMap(group => {
            const failure = form.get('fail') === group.person.id;
            if (failure) failed++;
            return group.items.map(({ name, brand, days, latest, ...log }) => ({ ...log, result: failure ? 'failure' as const : 'success' as const }));
          });
          fresh.state.deliveries.unshift(...logs);
          persist(fresh);
          message = `模拟成功 ${next.groups.length - failed} 封，失败 ${failed} 封。失败项可再次预览重试。`;
        }, '模拟发送');
      } else if (command === 'sales' || command === 'manager') {
        requireMAction(notificationPage, 'owners');
        const role = command;
        const person = s.people.find(entry => entry.id === id && entry.enabled);
        if (!person) throw Error('该员工账号已不可用');
        const roleLabel = role === 'sales' ? '销售' : '客户经理';
        open(esc(person.name) + ' · 配置' + roleLabel + '门店',
          '<p class="an-secondary">勾选后，该员工将接手所选门店的对应角色。取消勾选会解除该员工在该门店的关联。</p>' +
          table(['关联', '品牌 / 门店', '当前' + roleLabel], s.stores.map(store => {
            const current = ownersFor(s.state, store)[role];
            const label = store.merchantName + ' / ' + store.name;
            return tr(`<input type="checkbox" name="stores" value="${esc(store.id)}" aria-label="${esc(label)}" ${current === id ? 'checked' : ''}>`,
              esc(label), names(s, current));
          }), '暂无可配置的门店'), 'owners', form => {
            const selected = new Set(form.getAll('stores').map(String));
            const fresh = snapshot();
            if (fresh.state.revision !== s.state.revision ||
                !fresh.people.some(entry => entry.id === id && entry.enabled)) throw Error('负责人配置已变化，请重新打开');
            const visible = new Map(fresh.stores.map(store => [store.id, store]));
            for (const store of s.stores) {
              const previous = ownersFor(s.state, store)[role];
              const checked = selected.has(store.id);
              if (checked === (previous === id)) continue;
              const target = visible.get(store.id);
              if (!target || target.merchantId !== store.merchantId) throw Error('门店归属或访问权限已变化，请重新打开');
              const overrides = { ...fresh.state.stores[store.id] };
              const brandOwner = fresh.state.brands[store.merchantId]?.[role];
              if (checked && brandOwner === id) delete overrides[role];
              else overrides[role] = checked ? id : '';
              fresh.state.stores[store.id] = overrides;
            }
            persist(fresh);
            message = '门店关联已保存';
          });
      } else if (command === 'brand' || command === 'store') {
        requireMAction(notificationPage, 'owners');
        const map = command === 'brand' ? s.state.brands : s.state.stores;
        const target = s.stores.find(store => command === 'brand' ? store.merchantId === id : store.id === id);
        if (!target || (command === 'brand' && !providerTargetAllowed(id))) return;
        open(esc(command === 'brand' ? target.merchantName : target.name) + ' · 负责人',
          field('负责销售', peopleSelect(s, 'sales', map[id]?.sales, command === 'store')) +
          field('客户经理', peopleSelect(s, 'manager', map[id]?.manager, command === 'store')), 'owners', form => {
            if (!providerTargetAllowed(target.merchantId, command === 'store' ? id : undefined)) throw Error('访问权限已变化');
            const owners: State['brands'][string] = {};
            for (const role of ['sales', 'manager'] as const) {
              const value = String(form.get(role));
              if (value !== 'inherit') owners[role] = value;
            }
            map[id] = owners;
            persist(s); message = '负责人已保存';
          });
      } else if (command === 'settings') {
        requireMAction(notificationPage, 'settings');
        const config = s.state.settings;
        open('通知设置', field('通知销售', `<input type="checkbox" name="sales" ${config.sales ? 'checked' : ''}>`) +
          field('通知客户经理', `<input type="checkbox" name="manager" ${config.manager ? 'checked' : ''}>`) +
          field('每日汇总时间', `<input required type="time" name="time" value="${esc(config.time)}">`) +
          field('未跟进提醒间隔（天）', `<input required type="number" min="1" max="90" name="interval" value="${config.interval}">`) +
          field('固定抄送', peopleSelect(s, 'cc', config.cc)) + field('长期异常主管', peopleSelect(s, 'supervisor', config.supervisor)) +
          field('兜底运营', peopleSelect(s, 'operations', config.operations)), 'settings', form => {
            if (!form.has('sales') && !form.has('manager')) throw Error('至少选择一种主送角色');
            s.state.settings = { sales: form.has('sales'), manager: form.has('manager'), time: String(form.get('time')),
              interval: Number(form.get('interval')), cc: String(form.get('cc')), supervisor: String(form.get('supervisor')), operations: String(form.get('operations')) };
            persist(s); message = '通知设置已保存';
          });
      } else if (command === 'follow') {
        requireMAction(notificationPage, 'follow');
        const row = s.rows.find(entry => entry.store.id === id && entry.current.level !== 4);
        if (!row) return;
        const statuses = ['待跟进', '跟进中', '已联系'];
        open(esc(row.store.name) + ' · 记录跟进',
          field('跟进状态', `<select name="status">${statuses.map(status => `<option ${lastFollow(row) === status ? 'selected' : ''}>${status}</option>`).join('')}</select>`) +
          field('跟进备注', '<textarea rows="3" required maxlength="500" name="note"></textarea>') +
          field('暂停至（清空后解除）', `<input type="date" name="until" value="${esc(row.current.pause?.until)}">`) +
          field('暂停原因', `<input name="reason" maxlength="500" value="${esc(row.current.pause?.reason)}">`) +
          row.current.history.map(item => `<p>${esc(item.at + ' · ' + item.actor + ' · ' + item.status + ' · ' + item.note)}</p>`).join(''),
          'follow', form => {
            if (!providerTargetAllowed(row.store.merchantId, id)) throw Error('访问权限已变化');
            const status = String(form.get('status')), note = String(form.get('note')).trim();
            const until = String(form.get('until')), reason = String(form.get('reason')).trim();
            if (!statuses.includes(status) || !note) throw Error('请填写跟进状态和备注');
            if (until && (!reason || (until <= s.today && until !== row.current.pause?.until))) throw Error('暂停日期须晚于今天，并填写原因');
            if (!until && row.current.pause) row.current.resumed = crypto.randomUUID();
            row.current.pause = until ? { until, reason } : undefined;
            row.current.history.unshift({ status, note, at: new Date().toISOString(), actor: currentMAccount()?.employeeName ?? '' });
            remember(s); persist(s); message = '跟进已保存';
          });
      }
    } catch (error) {
      message = error instanceof Error ? error.message : '操作失败';
      mount();
    }
  });
}
