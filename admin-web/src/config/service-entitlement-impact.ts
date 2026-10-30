import { entitlementApplies, grantActive, serviceAccess } from './service-entitlement-domain';
import { resolveEffectiveRouteSources, type SubscriptionServiceSnapshot } from './subscription-service-domain';

/** Counts context/menu associations with selected-store scope and alternative grants. */
export function entitlementDisableImpact(snapshot: SubscriptionServiceSnapshot, id: string, storeIds: string[], now = Date.now()) {
  const grant = snapshot.subscriptions.find(g => g.id === id);
  if (!grant) throw Error('权益记录不存在。');
  const contexts: Array<{brandId: string; storeId?: string}> = [{ brandId: grant.subjectId }, ...storeIds.map(storeId => ({ brandId: grant.subjectId, storeId }))];
  const after = { ...snapshot, subscriptions: snapshot.subscriptions.filter(g => g.id !== id) };
  const effective = (s: SubscriptionServiceSnapshot, context: { brandId: string; storeId?: string }) => {
    const standard = { ...s, subscriptions: s.subscriptions.filter(g => !g.entitlementKind) };
    const routes = new Set(resolveEffectiveRouteSources(standard, context, new Date(now)).map(r => r.routeNodeId));
    for (const pkg of s.packages.filter(p => !!p.commercial)) {
      if (!serviceAccess(s, pkg, context, now).usable) continue;
      s.releases.find(r => r.id === pkg.activeReleaseId)?.routeNodeIds.forEach(r => routes.add(r));
    }
    return routes;
  };
  const pkg = snapshot.packages.find(p => p.id === grant.packageId);
  const routes = snapshot.releases.find(r => r.id === pkg?.activeReleaseId)?.routeNodeIds ?? [];
  let provided = 0, lost = 0, retained = 0;
  for (const context of contexts) {
    if (!entitlementApplies(grant, context) || !grantActive(grant, now) || pkg?.status !== 'published') continue;
    const before = effective(snapshot, context), remaining = effective(after, context);
    provided += new Set(routes).size;
    lost += [...before].filter(r => !remaining.has(r)).length;
    retained += [...new Set(routes)].filter(r => remaining.has(r)).length;
  }
  return { provided, lost, retained, stores: contexts.filter(c => c.storeId && entitlementApplies(grant, c)).length };
}
