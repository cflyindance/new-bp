import { axiosGet } from './kioskConfigApi';
import { serverURL } from './ip';

const KPOS_WEBAPP_MENU_PATH = 'webapp/menu/menu';

/**
 * kpos/webapp/menu/menu 通用请求，通过 params 传入不同查询参数
 * @example fetchKposWebappMenu({ product: 'KIOSK', showStock: true })
 * @example fetchKposWebappMenu({ product: 'ALL' })
 */
export function fetchKposWebappMenu(params = {}) {
  const menuURL = serverURL + KPOS_WEBAPP_MENU_PATH;
  return axiosGet(menuURL, { params });
}

/** 带库存数量的 Kiosk 菜单 */
export function fetchKioskMenuWithStock() {
  return fetchKposWebappMenu({ product: 'KIOSK', showStock: true });
}
