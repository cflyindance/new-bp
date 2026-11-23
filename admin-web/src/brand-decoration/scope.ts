import { LEGACY_BRAND_ID_MAP } from '../permissions/m-platform-store-scope';
import { brandStoresForPath } from '../auth/brand-access-runtime';
import { getEnterpriseMerchantSnapshotForAuthorization } from '../config/enterprise-merchant-store';
import { currentBrandPrincipal, isBrandPathAllowed } from '../auth/brand-access-runtime';
import { getAuthenticatedEmail, DEMO_LOGIN_ACCOUNT } from '../auth/login';
import { getScopedFilterOptions, readScopeFilters } from '../auth/session-scope';
import { getUserSessionContext } from '../auth/session-permissions';
import { resolveDefaultAnchorBrandId, isGroupHqDataPerspective } from '../auth/merchant-scope-context';
import { currentBrandAccess } from '../config/brand-access-store';
export function decorationScope() {
    const filters = readScopeFilters(), options = getScopedFilterOptions(), principal = currentBrandPrincipal();
    const brand = principal?.merchantId || filters.brand || (!isGroupHqDataPerspective() ? resolveDefaultAnchorBrandId() : '');
    const store = options.stores.find(s => s.value === filters.store);
    const brandName = options.brands.find(b => b.value === brand)?.labelZh || '当前品牌';
    const key = brand && (!filters.store || store) ? `${brand}/${store?.value || 'brand'}` : '';
    const grant = getUserSessionContext()?.permissionSnapshot['brand-decoration:decoration-pages'];
    const access = currentBrandAccess('action:/brand-decoration/pages:manage-page');
    const demo = (getAuthenticatedEmail() ?? '').toLowerCase() === DEMO_LOGIN_ACCOUNT.toLowerCase();
    const canWrite = !!key && isBrandPathAllowed('/brand-decoration/pages') && (access === 'edit' || access === undefined && (demo || !!grant?.enabled && grant.display !== false && grant.l4EditMode === 'editable'));
    const metadata = getEnterpriseMerchantSnapshotForAuthorization();
    const linkedMerchant = store && metadata.stores.find(item => item.storeId === store.value)?.linkedMerchantId;
    const timezone = metadata.merchants.find(item => item.merchantId === linkedMerchant)?.timezone
        || metadata.merchants.find(item => item.merchantId === brand)?.timezone;
    const brandStores = options.stores.filter(option => {
        const item = metadata.stores.find(entry => entry.storeId === option.value);
        const canonical = LEGACY_BRAND_ID_MAP[brand ?? ''] ?? brand;
        return principal ? !!option.value : item && [item.merchantId, item.linkedMerchantId, item.brandId].some(id => (LEGACY_BRAND_ID_MAP[id] ?? id) === canonical);
    });
    const storeIds = brandStoresForPath(brandStores.map(option => option.value), '/brand-decoration/pages');
    const stores = brandStores.filter(option => storeIds.includes(option.value)).map(option => {
        const item = metadata.stores.find(entry => entry.storeId === option.value);
        return { id: option.value, name: option.labelZh, timezone:
            metadata.merchants.find(entry => entry.merchantId === item?.linkedMerchantId)?.timezone
            || metadata.merchants.find(entry => entry.merchantId === brand)?.timezone || '' };
    });
    return { key, brand, stores, timezone, brandName, name: store ? `${brandName} · ${store.labelZh}` : `${brandName} · 品牌方案`, canWrite };
}
