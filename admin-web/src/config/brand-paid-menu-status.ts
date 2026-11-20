import { esc } from '../permissions/center-editor';
import type { MenuChoice } from './brand-access-store';
import { getMerchantStores } from './enterprise-merchant-store';
import { isPaidMenuVisible, matchingPaidMenus, publishedPaidServicesForMenu } from './subscription-service-runtime';
import { serviceEntitlementData } from './service-entitlement-data';
import { serviceAccess } from './service-entitlement-domain';

export function createPaidMenuStatusRenderer(brandId?: string): (choice: MenuChoice) => string {
  let scopedStores: ReturnType<typeof getMerchantStores> | undefined;
  return (choice: MenuChoice): string => {
    if (!choice.path) return '';
    const menu = matchingPaidMenus(choice.path).find(node => node.path === choice.path);
    if (!menu) return '';
    const services = publishedPaidServicesForMenu(menu.id);
    const badge = (label: string, description: string) => `<span class="ba-paid-menu-status">
      <span class="ba-tag">${label}</span>
      <button type="button" data-paid-menu-help aria-label="${esc(choice.title)}：${label}说明" aria-expanded="false">ⓘ</button>
      <span class="ba-paid-menu-popover" popover="auto">${description}</span>
    </span>`;
    if (!services.length || !isPaidMenuVisible(choice.path)) return badge('待发布收费服务',
      '收费服务发布前，商户后台不会显示此菜单。请确保此菜单及其所属收费上级菜单已加入发布的收费服务。发布后，菜单按品牌配置和账号权限显示。');
    if (!brandId) return badge('收费服务已发布',
      '菜单按品牌配置和账号权限显示，使用时需要适用范围内有生效权益。创建品牌后，可前往「服务权益」办理开通。');
    const { snapshot } = serviceEntitlementData();
    if (services.some(pkg => serviceAccess(snapshot, pkg, { brandId }).usable)) {
      return badge('收费服务已开通', '当前品牌已有生效权益，覆盖全部品牌门店（含后续新增）。商户仍需相应菜单和账号权限才能使用。');
    }
    const stores = scopedStores ??= getMerchantStores(brandId);
    const covered = stores.filter(store => services.some(pkg => serviceAccess(snapshot, pkg, { brandId, storeId: store.storeId }).usable)).length;
    if (covered) return badge(covered < stores.length ? '部分门店已开通' : '指定门店已开通',
      `当前有 ${covered} 家门店的权益已生效。商户需有相应菜单和账号权限才能使用，其他门店需开通适用权益。`);
    return badge('收费服务未开通',
      '当前品牌和可管理门店均无生效权益。已获菜单权限的商户可能看到菜单，权益生效后，覆盖范围内的商户才能使用。请前往「服务权益」办理。');
  };
}

export function bindPaidMenuStatusHelp(host: HTMLElement): void {
  host.querySelectorAll<HTMLButtonElement>('[data-paid-menu-help]').forEach(button => {
    const popover = button.nextElementSibling as HTMLElement;
    button.popoverTargetElement = popover;
    popover.addEventListener('toggle', () => {
      const open = popover.matches(':popover-open');
      button.setAttribute('aria-expanded', String(open));
      if (!open) return;
      const anchor = button.getBoundingClientRect();
      const bounds = popover.getBoundingClientRect();
      popover.style.left = Math.max(8, Math.min(anchor.right - bounds.width, innerWidth - bounds.width - 8)) + 'px';
      popover.style.top = (anchor.bottom + bounds.height + 8 <= innerHeight
        ? anchor.bottom + 6 : Math.max(8, anchor.top - bounds.height - 6)) + 'px';
    });
  });
}
