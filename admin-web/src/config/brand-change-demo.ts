import { DEMO_LOGIN_ACCOUNT, getAuthenticatedEmail } from '../auth/login';
import { brandMenuChoices } from './brand-menu-choices';
import type { BrandChangeFacts } from './brand-audit-types';
import type { MerchantChangeLogEntry } from './enterprise-merchant-types';

const brandId = 'merchant-zhangji';
const source = 'M 平台运营（演示）';

function record(id:string, at:string, action:string, detail:string, facts:Omit<BrandChangeFacts,'source'>, storeId?:string):MerchantChangeLogEntry {
  return {id:`demo-brand-change-${id}`,merchantId:brandId,storeId,action,detail,at,
    operatorEmail:DEMO_LOGIN_ACCOUNT,facts:{...facts,source}};
}

function menuRecord(brandName: string): MerchantChangeLogEntry[] {
  const choices = brandMenuChoices();
  const added = choices.find(choice => choice.path === '/stores/hours' && choice.isPage);
  const removed = choices.find(choice => choice.path === '/brand/settings' && choice.isPage);
  if (!added || !removed) return [];

  const entry = record('menu', '2026-11-17T06:38:12.000Z', 'brand.menu.update', '已更新品牌菜单开通范围。', {
    category: '品牌菜单',
    title: '修改品牌菜单',
    target: brandName,
    fields: [],
  });
  return [{
    ...entry,
    menuChange: {
      operationId: entry.id,
      source,
      mode: 'brand',
      beforeMode: 'brand',
      added: [added.key],
      removed: [removed.key],
      choices,
    },
  }];
}

/** Read-only examples for the demo brand, independent of stored audit history. */
export function brandChangeDemo(merchantId:string, brandName:string, stores:readonly {storeId:string;name:string}[]):MerchantChangeLogEntry[] {
  if (merchantId!==brandId||getAuthenticatedEmail()?.toLowerCase()!==DEMO_LOGIN_ACCOUNT) return [];
  const associated = stores.filter(store=>['M00000001','M00000002'].includes(store.storeId));
  return [
    record('admin','2026-11-17T06:40:54.000Z','access:开通管理员','已开通并启用品牌管理员。',{
      category:'品牌管理员',title:'开通管理员',target:'张经理 · zhangji.admin@menusifu.cn',
      fields:[{name:'登录账号',before:'未开通',after:'zhangji.admin@menusifu.cn'},{name:'账号状态',before:'未开通',after:'已启用'}],
    }),
    ...menuRecord(brandName),
    ...associated.map(store=>record(`associate-${store.storeId}`,'2026-11-17T06:34:19.000Z','org.store.associate','门店已关联到品牌，默认继承品牌菜单。',{
      category:'品牌门店',title:'关联门店',target:`${store.name} · ${store.storeId}`,operationId:'demo-brand-change-association',
      fields:[{name:'所属品牌',before:'独立门店',after:brandName},{name:'菜单配置方式',before:'独立配置',after:'继承品牌菜单'}],
    },store.storeId)),
    record('resume','2026-11-16T03:26:08.000Z','status.active','已恢复品牌及所属门店的后台访问。',{
      category:'品牌服务',title:'恢复服务',target:brandName,
      fields:[{name:'服务状态',before:'已暂停',after:'已启用'},{name:'恢复原因',before:'—',after:'合同续期已确认'}],
    }),
    record('pause','2026-11-15T02:49:05.000Z','status.suspended','已暂停品牌及所属门店的后台访问，保留已有数据与配置。',{
      category:'品牌服务',title:'暂停服务',target:brandName,
      fields:[{name:'服务状态',before:'已启用',after:'已暂停'},{name:'暂停原因',before:'—',after:'合同到期，等待续期确认'}],
    }),
    record('contract','2026-11-16T03:20:00.000Z','merchant.crm.sync','已从 CRM 同步合同信息。',{
      category:'其他',title:'同步合同信息',target:brandName,
      fields:[{name:'合同状态',before:'已到期',after:'执行中'},{name:'合同到期日',before:'2026/11/15',after:'2027/12/31'}],
    }),
  ];
}
