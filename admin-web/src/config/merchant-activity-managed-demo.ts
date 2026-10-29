import { createActivityDemo, demoAsOf } from './merchant-activity-demo';
import type { ActivityDataset, ActivityStore } from './merchant-activity-domain';

/** Explicit legacy fixture registry. It never matches stores by name or list position. */
export const ACTIVITY_DEMO_STORE_MIDS: Readonly<Record<string, string>> = Object.freeze({
  'demo-all': 'M00000001',
  'demo-mixed': 'M00000002',
  'demo-unknown': 'M00000002',
  'demo-uneven': 'M00000003',
  'demo-new': 'M00000004',
  'demo-stopped': 'M00000005',
  'demo-long': 'M00000006',
  'demo-recent': 'M00000007',
  'demo-error': 'M00000009',
});
export interface ManagedActivityStoreRow {
  merchantId: string;
  merchantName: string;
  store: { storeId: string; name: string; merchantId?: string };
}
export function resolveActivityStoreId(data: ActivityDataset, id: string): string | undefined {
  if (data.stores.some(store => store.id === id)) return id;
  const mid = ACTIVITY_DEMO_STORE_MIDS[id];
  return mid && data.stores.some(store => store.id === mid) ? mid : undefined;
}
/** Read-only projection: management owns identity; the fixture owns synthetic usage facts. */
export function createManagedActivityDemo(rows: readonly ManagedActivityStoreRow[], asOf = demoAsOf()): ActivityDataset {
  const raw = createActivityDemo(asOf);
  const managed = new Map<string, ManagedActivityStoreRow>(), ambiguous = new Set<string>();
  for (const row of rows) {
    const id = row.store.storeId;
    if (!Object.values(ACTIVITY_DEMO_STORE_MIDS).includes(id)) continue;
    const previous = managed.get(id);
    if (!row.merchantId || row.store.merchantId && row.store.merchantId !== row.merchantId || previous && previous.merchantId !== row.merchantId) ambiguous.add(id);
    managed.set(id, row);
  }
  const fixtureToMid = new Map<string, string>(), stores = new Map<string, ActivityStore>();
  for (const fixture of raw.stores) {
    const id = ACTIVITY_DEMO_STORE_MIDS[fixture.id], row = id && managed.get(id);
    if (!row || ambiguous.has(id)) continue;
    fixtureToMid.set(fixture.id, id);
    const previous = stores.get(id);
    stores.set(id, { ...fixture, id, merchantId: row.merchantId, merchantName: row.merchantName, name: row.store.name,
      openedOn: previous && previous.openedOn < fixture.openedOn ? previous.openedOn : fixture.openedOn,
      lines: [...new Set([...(previous?.lines ?? []), ...fixture.lines])],
      quality: previous?.quality === 'error' || fixture.quality === 'error' ? 'error' : 'complete',
      scenario: [previous?.scenario, fixture.scenario].filter(Boolean).join('；'),
    });
  }
  const bindings = raw.bindings.filter(row => fixtureToMid.has(row.storeId)).map(row => ({ ...row, storeId: fixtureToMid.get(row.storeId)! }));
  const orders = raw.orders.filter(row => fixtureToMid.has(row.storeId)).map(row => ({ ...row, storeId: fixtureToMid.get(row.storeId)! }));
  const deviceIds = new Set(bindings.map(row => row.deviceId));
  for (const order of orders) if (order.deviceId) deviceIds.add(order.deviceId);
  return { ...raw, stores: [...stores.values()], bindings, orders,
    devices: raw.devices.filter(device => deviceIds.has(device.id) || device.id === 'demo-unbound'),
  };
}
