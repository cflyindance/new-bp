import { demoAsOf } from './merchant-activity-demo';
import { createManagedActivityDemo, ACTIVITY_DEMO_STORE_MIDS } from './merchant-activity-managed-demo';
import { resolveOrders, type ActivityDataset, type ResolvedOrder } from './merchant-activity-domain';
import { getEnterpriseStoreList } from './enterprise-merchant-store';

// Keep stable exported references: both entry points and open detail renderers share a snapshot.
export const activityDemoData: ActivityDataset = { asOf: demoAsOf(), timezone: 'Asia/Shanghai', stores: [], devices: [], bindings: [], orders: [] };
export const activityDemoOrders: ResolvedOrder[] = [];
let signature = '';
export function refreshActivityDemoData(): boolean {
  const rows = getEnterpriseStoreList({ allEnterprises: true });
  const registered = new Set(Object.values(ACTIVITY_DEMO_STORE_MIDS));
  const identities = rows.filter(row => registered.has(row.store.storeId)).map(row => ({
    merchantId: row.merchantId, merchantName: row.merchantName, store: { storeId: row.store.storeId, merchantId: row.store.merchantId, name: row.store.name },
  })).sort((a, b) => a.store.storeId.localeCompare(b.store.storeId));
  const asOf = demoAsOf(), nextSignature = JSON.stringify([asOf, identities]);
  if (signature === nextSignature) return false;
  const next = createManagedActivityDemo(identities, asOf), orders = resolveOrders(next);
  Object.assign(activityDemoData, next);
  activityDemoOrders.splice(0, activityDemoOrders.length, ...orders);
  signature = nextSignature;
  return true;
}
refreshActivityDemoData();
export function renderActivityDemoNotice(): string {
  return '<p class="ma-demo-note" role="note">演示数据：品牌和门店来自管理资料；订单、设备绑定、开通天数及活跃状态为测试场景。统计时区统一为 Asia/Shanghai，不代表实际经营数据。</p>';
}
