import type { EnterpriseMerchant, EnterpriseMerchantSnapshot, MerchantOrgStore } from './enterprise-merchant-types';
import { generateNextBid, generateNextMid } from './enterprise-merchant-bid';
import { brandMenuChoices } from './brand-menu-choices';

const createdAt = '2026-10-08T02:00:00.000Z';
const activatedAt = '2026-10-12T03:00:00.000Z';
const firstLoginAt = '2026-10-13T02:30:00.000Z';
const stages = [
  { code: 'qiaonan-noodles', name: '桥南面馆', contactName: '林晓宁' },
  { code: 'chengbei-bakes', name: '城北烘焙', contactName: '许嘉怡' },
  { code: 'xiling-bistro', name: '西岭小馆', contactName: '陈宇航' },
  { code: 'linjiang-kitchen', name: '临江小厨', contactName: '顾思远' },
];

export function lifecycleDemoAdminEmail(id: string): string | undefined {
  if (id === 'demo-brand-gucheng-tea') return 'gucheng-tea@example.com';
  const fixture = stages.slice(1).find(stage => id === 'demo-brand-' + stage.code);
  return fixture ? fixture.code + '@example.com' : undefined;
}

const stores: { code: string; name: string; status: MerchantOrgStore['status']; address: string; postalCode: string }[] = [
  { code: 'sh-qiantan', name: '上海前滩店', status: 'preparing', address: '上海市浦东新区海阳西路', postalCode: '200126' },
  { code: 'sh-wujiaochang', name: '上海五角场店', status: 'closed', address: '上海市杨浦区淞沪路', postalCode: '200433' },
  { code: 'sh-xujiahui', name: '上海徐家汇店', status: 'terminated', address: '上海市徐汇区漕溪北路', postalCode: '200030' },
  { code: 'sh-zhongshan', name: '上海中山公园店', status: 'archived', address: '上海市长宁区长宁路', postalCode: '200050' },
  { code: 'sh-daning', name: '上海大宁店', status: 'open', address: '上海市静安区共和新路', postalCode: '200072' },
  { code: 'sh-nanxiang', name: '上海南翔店', status: 'open', address: '上海市嘉定区沪宜公路', postalCode: '201802' },
];

export function fillBrandLifecycleDemo(snap: EnterpriseMerchantSnapshot): boolean {
  const owner = snap.merchants.find(m => m.merchantId === 'merchant-zhangji' && m.code === 'zhangji-hotpot');
  const region = snap.regions.find(r => r.regionId === 'region-zj-east' && r.merchantId === owner?.merchantId);
  if (!owner || !region) return false;

  const choices = brandMenuChoices(['pos']);
  const page = choices.find(choice => choice.isPage && choice.path === '/stores/hours')
    ?? choices.find(choice => choice.isPage);
  const menu: EnterpriseMerchantSnapshot['capabilities'][number]['services'] = [];
  for (let choice = page; choice; choice = choices.find(candidate => candidate.key === choice?.parent)) {
    menu.push({ serviceId: choice.key, nodeKey: choice.key, enabled: true, storeScope: 'all' as const });
  }
  if (!menu.length) return false;

  const addMerchant = (merchant: EnterpriseMerchant, menuEnabled: boolean) => {
    const { merchantId, name, code } = merchant;
    const brandId = 'brand-' + merchantId;
    snap.merchants.push(merchant);
    snap.brands.push({ brandId, merchantId, name, code, status: 'active' });
    snap.regions.push({ regionId: 'region-' + merchantId, merchantId, brandId, name: '默认区域', code: 'default' });
    snap.capabilities.push({ merchantId, menuGrantMode: 'explicit', businessTypeIds: ['full-service'],
      productLineIds: ['pos'], presetCombos: [], services: menuEnabled ? menu.map(item => ({ ...item })) : [] });
  };
  const base = { enterpriseId: owner.enterpriseId, groupId: owner.groupId, timezone: owner.timezone,
    locale: owner.locale, createdAt, updatedAt: activatedAt };

  stages.forEach(({ code, name, contactName }, index) => {
    const merchantId = 'demo-brand-' + code;
    if (snap.merchants.some(m => m.merchantId === merchantId)) return;
    addMerchant({
      ...base, merchantId, bid: generateNextBid(snap), name, code, contactName, orgType: 'chain',
      status: index < 2 ? 'onboarding' : 'active',
      accountProvisioningRequired: index === 0,
      primaryAdminEmail: lifecycleDemoAdminEmail(merchantId),
      activatedAt: index >= 2 ? activatedAt : undefined,
      firstLoginAt: index >= 3 ? firstLoginAt : undefined,
    }, index >= 2);
  });

  stores.forEach(({ code, name, status, address, postalCode }) => {
    const linkedMerchantId = 'demo-store-' + code;
    if (snap.merchants.some(m => m.merchantId === linkedMerchantId)) return;
    addMerchant({ ...base, merchantId: linkedMerchantId, bid: generateNextBid(snap),
      name, code, address, orgType: 'single-store', status: 'active', activatedAt }, false);
    const storeId = generateNextMid(snap);
    snap.stores.push({ storeId, merchantId: owner.merchantId, linkedMerchantId, brandId: region.brandId,
      regionId: region.regionId, code, name, status, address, postalCode, mountedAt: createdAt,
      openedAt: status === 'preparing' ? undefined : '2024-08-08' });
    (snap.storeCapabilities ??= []).push({ storeId, merchantId: owner.merchantId, menuMode: 'inherit',
      enabledKeys: [], updatedAt: createdAt, updatedBy: '演示预设' });
  });
  return true;
}
