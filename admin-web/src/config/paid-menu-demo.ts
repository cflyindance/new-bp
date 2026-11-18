import type { ServiceCommercialPolicy, ServicePackage, ServicePackageDraft, SubscriptionServiceSnapshot } from "./subscription-service-domain";

export const PAID_MENU_DEMO_CASES = [
  { key: "unbound", path: "/marketing/ads" },
  { key: "draft", path: "/marketing/manual", name: "手动营销 · 仅草稿（演示）", priceMinor: 9900, status: "unpublished" },
  { key: "parent", path: "/marketing/campaigns", name: "营销活动 · 按父级展示（演示）", priceMinor: 19900, status: "published", visibilityScope: "parent-brands" },
  { key: "all", path: "/promotions/lottery", name: "抽奖活动 · 全体商户可见（演示）", priceMinor: 29900, status: "published", visibilityScope: "all-merchants" },
] as const;

export function seedPaidMenuDemo(
  snapshot: SubscriptionServiceSnapshot,
  catalog: Array<{ id: string; path: string; paidMenu?: boolean }>,
  brandIds: ReadonlySet<string>,
  now = Date.now(),
): boolean {
  if (snapshot.paidMenuDemoVersion === 1) return false;
  const menuIds = new Map(catalog.filter(node => node.paidMenu).map(node => [node.path, node.id]));
  if (!PAID_MENU_DEMO_CASES.every(item => menuIds.has(item.path))) return false;

  const actor = "demo.menusifu.cn";
  const date = (days: number) => new Date(now + days * 86_400_000).toISOString();
  const createdAt = date(-30);
  for (const item of PAID_MENU_DEMO_CASES) {
    if (!("status" in item)) continue;
    const id = `pkg-paid-menu-demo-${item.key}`;
    const code = `DEMO_PAID_MENU_${item.key.toUpperCase()}`;
    const routeId = menuIds.get(item.path)!;
    if (snapshot.packages.some(pkg => pkg.id === id || pkg.code === code) ||
        snapshot.releases.some(release => release.commercial?.chargeType === "paid" && release.routeNodeIds.includes(routeId)) ||
        snapshot.drafts.some(draft => draft.commercial?.chargeType === "paid" && draft.routeNodeIds.includes(routeId))) continue;

    const commercial: ServiceCommercialPolicy = {
      chargeType: "paid",
      billingUnit: "brand",
      trialEnabled: item.key === "all",
      trialDays: 14,
      visibilityScope: "visibilityScope" in item ? item.visibilityScope : undefined,
    };
    const pkg: ServicePackage = {
      id, code, name: item.name, priceMinor: item.priceMinor, commercial,
      description: "预置演示数据，用于核对收费菜单发布、展示范围和品牌权益。",
      currency: "CNY", billingInterval: "month", status: item.status, createdAt, updatedAt: createdAt,
    };
    const draft: ServicePackageDraft = {
      packageId: id, revision: 1, routeBlueprintVersion: snapshot.routeBlueprintVersion,
      name: pkg.name, description: pkg.description, priceMinor: pkg.priceMinor, currency: pkg.currency,
      billingInterval: pkg.billingInterval, commercial, routeNodeIds: [routeId], updatedAt: createdAt,
    };
    if (pkg.status === "unpublished") {
      snapshot.drafts.push(draft);
    } else {
      const releaseId = `rel-paid-menu-demo-${item.key}-1`;
      pkg.activeReleaseId = releaseId;
      snapshot.releases.push({
        ...draft, id: releaseId, version: 1, publishedAt: createdAt, publishedBy: actor,
      });
      (snapshot.protectedRoutes ??= []).push({ packageId: id, routeNodeId: routeId, path: item.path });
      if (item.key === "all") {
        for (const [brandId, kind, start, end] of [
          ["merchant-zhangji", "paid", -7, 30],
          ["merchant-tea-one", "trial", -21, -7],
        ] as const) {
          if (!brandIds.has(brandId)) continue;
          const grantId = `ent-paid-menu-demo-${brandId}`;
          if (snapshot.subscriptions.some(grant => grant.id === grantId)) continue;
          snapshot.subscriptions.push({
            id: grantId, subjectType: "brand", subjectId: brandId, packageId: id,
            entitlementKind: kind, scopeMode: "all", startAt: date(start), endAt: date(end),
            createdAt: date(start), createdBy: actor, agreedPriceMinor: kind === "paid" ? pkg.priceMinor : 0,
            agreedCurrency: "CNY", agreedBillingUnit: "brand", agreedBillingInterval: "month",
            releaseId, reference: "DEMO-PAID-MENU", note: "预置演示权益",
          });
        }
      }
    }
    snapshot.packages.push(pkg);
  }
  snapshot.paidMenuDemoVersion = 1;
  return true;
}
