import { classifyActivity, dateNumber, resolveOrders, shiftDate, type ActivityDataset, type ActivityStore } from './merchant-activity-domain';

export const notificationPath = '/m-platform/activity-follow-up';
export const notificationPage = 'activity-follow-up';
export type Owners = { sales?: string; manager?: string };
export type Person = { id: string; name: string; email: string; enabled: boolean };
export type Follow = { status: string; note: string; actor: string; at: string };
export type Case = { cycle: string; level: number; latest: string; days: number; history: Follow[]; pause?: { until: string; reason: string }; resumed?: string };
export type Delivery = { store: string; cycle: string; email: string; level: number; day: string; reason: string; result: 'success' | 'failure'; resumed?: string };
export type State = {
  revision: number; brands: Record<string, Owners>; stores: Record<string, Owners>;
  cases: Record<string, Case>; deliveries: Delivery[];
  settings: { sales: boolean; manager: boolean; interval: number; time: string; cc: string; supervisor: string; operations: string };
};
export const emptyState = (): State => ({
  revision: 0, brands: {}, stores: {}, cases: {}, deliveries: [],
  settings: { sales: true, manager: true, interval: 7, time: '09:00', cc: '', supervisor: '', operations: '' },
});
export const levels = ['已恢复', '近期未使用', '疑似停用', '长期未使用', '数据异常'];
export function inspect(data: ActivityDataset, day: string, state: State) {
  const latest = new Map<string, string>();
  for (const order of resolveOrders({ ...data, asOf: day })) {
    const date = order.submittedAt.slice(0, 10);
    if (date > (latest.get(order.storeId) ?? '')) latest.set(order.storeId, date);
  }
  return data.stores.flatMap(store => {
    const date = latest.get(store.id) ?? '';
    const days = date ? dateNumber(day) - dateNumber(date) : 0;
    const status = classifyActivity(date ? days : null, true, store.quality === 'error');
    const level = ['active', 'recent', 'suspected', 'long', 'error'].indexOf(status);
    const previous = state.cases[store.id];
    if (level < 0 || (level === 0 && (!previous || previous.level === 4))) return [];
    const cycle = level === 0 ? previous!.cycle : level === 4 ? 'data' : date;
    const same = previous?.cycle === cycle;
    const current: Case = { cycle, level, latest: date, days, history: same ? previous.history : [], pause: previous?.pause, resumed: previous?.resumed };
    // Keep the usage case intact while the data source is unavailable.
    return [{ store, current, previous }];
  });
}
export function ownersFor(state: State, store: ActivityStore) {
  return { ...state.brands[store.merchantId], ...state.stores[store.id] };
}
export type Row = ReturnType<typeof inspect>[number];
export function prepareBatch(state: State, rows: Row[], day: string, people: Person[], allowed: (person: Person, store: ActivityStore) => boolean) {
  const groups = new Map<string, { person: Person; items: (Delivery & { name: string; brand: string; days: number; latest: string })[] }>();
  const blocked: { store: string; reason: string }[] = [];
  for (const { store, current } of rows) {
    if (current.pause && current.pause.until >= day) continue;
    const history = state.deliveries.filter(log => log.store === store.id && log.cycle === current.cycle && log.result === 'success');
    const owner = ownersFor(state, store);
    const settings = state.settings;
    const primary: [string | undefined, string][] = [];
    if (current.level === 4) primary.push([settings.operations, '运营排查']);
    else if (current.level === 0) {
      for (const email of new Set(history.filter(log => log.level > 0).map(log => log.email))) {
        primary.push([people.find(person => person.email.trim().toLowerCase() === email)?.id, '恢复摘要']);
      }
    } else {
      if (settings.sales) primary.push([owner.sales, '销售']);
      if (settings.manager) primary.push([owner.manager, '客户经理']);
    }
    const recipients = new Map<string, { person: Person; roles: string[] }>();
    function add(id: string | undefined, role: string) {
      const person = people.find(candidate => candidate.id === id);
      const email = person?.email.trim().toLowerCase() ?? '';
      if (!person?.enabled || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !allowed(person, store)) {
        blocked.push({ store: store.name, reason: role + '：未配置、邮箱无效或无访问权限' });
        return false;
      }
      const recipient = recipients.get(email) ?? { person, roles: [] };
      recipient.roles.push(role);
      recipients.set(email, recipient);
      return true;
    }
    const invalid = primary.map(([id, role]) => !add(id, role)).some(Boolean);
    if (current.level > 0 && current.level < 4) {
      if (invalid && settings.operations) add(settings.operations, '运营兜底');
      if (settings.cc && primary.length) add(settings.cc, '抄送');
      if (current.level === 3 && settings.supervisor) add(settings.supervisor, '主管');
    }
    for (const [email, { person, roles }] of recipients) {
      const last = history.find(log => log.email === email);
      const resumed = current.pause && current.pause.until < day ? current.pause.until : current.resumed;
      const due = current.level === 0 ? last?.level !== 0 :
        !last || current.level > last.level || (!!resumed && last.resumed !== resumed) ||
        (!current.history.length && dateNumber(day) - dateNumber(last.day) >= settings.interval);
      if (!due) continue;
      const group = groups.get(email) ?? { person, items: [] };
      group.items.push({ store: store.id, name: store.name, brand: store.merchantName, days: current.days,
        latest: current.latest, email, cycle: current.cycle, level: current.level, day, resumed, reason: roles.join('、'), result: 'success' });
      groups.set(email, group);
    }
  }
  return { groups: [...groups.values()], blocked };
}
export const completeDay = (today: string) => shiftDate(today, -1);
