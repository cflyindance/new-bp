import axios from '@/utils/axios';
import { serverURL } from './ip';
import store from '../reducers/store';
import { getCookie } from '@/utils';
import { getRuntimeEnv } from '@/utils/runtimeEnv';
import { encryptString } from '@/utils/crypto';
import {
  beginConfigFetchLoading,
  endConfigFetchLoading,
} from '@/utils/configFetchLoading';
import { promiseFinally } from '@/utils/promiseFinally';

const apiMap = {
  development: 'https://cloud.menusifudev.com/api',
  production: 'https://cloud.menusifucloud.com/api',
  integration: 'https://cloud.menusifucloudqa.com/api',
};
const getCloudHost = () => apiMap[getRuntimeEnv()] || apiMap.production;

/** 云屏保、商品中心等 接口域名 */
const effectiveScreenHostMap = {
  development: 'https://cc.menusifuchina.com',
  integration: 'https://api.balamxqa.com',
  production: 'https://service.balamx.com',
};

export function fetchMenuGroupList(cb) {
  let menuURL = serverURL + 'webapp/kiosk/v1/kioskMenus?product=KIOSK';
  axios
    .get(menuURL)
    .then(function (res) {
      if (!!res.data.KioskMenus[0]) {
        // restaurantHourIds
        const menuGroups = res.data.KioskMenus[0]?.menuGroups?.filter(
          (each) => each?.restaurantHourIds?.length > 0
        );
        cb(
          menuGroups,
          res.data.KioskMenus[0]?.comboSectionSaleItemDTOList || []
        );
      }
    })
    .catch(function (err) {
      console.log(err);
    });
}

export function fetchCompanyProfile() {
  const companyProfileURL = serverURL + 'webapp/store/fetchCompanyProfile';
  return axiosGet(companyProfileURL);
}

export function axiosPost(URL, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    axios
      .post(URL, payload, { headers })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function axiosGet(URL, config) {
  return new Promise((resolve, reject) => {
    axios
      .get(URL, config)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 获取kiosk配置页面接口
export function getMarginappFetchKioskConfig(
  kioskConfigSessionKey = '',
  options = {}
) {
  const { showLoading = true } = options;
  const configUrl = serverURL + 'webapp/marginapp/fetchConfig';
  const payload = {
    product: 'KIOSKLITE',
    userAuth: {
      sessionKey: kioskConfigSessionKey,
      // userId: store?.getState()?.sysCookie.kioskConfigUserId,
    },
  };
  if (showLoading) {
    beginConfigFetchLoading();
  }
  return promiseFinally(axiosPost(configUrl, payload), () => {
    if (showLoading) {
      endConfigFetchLoading();
    }
  });
}

// 修改kiosk配置页面接口
export function postMarginappConfig(data = '{}', kioskConfigSessionKey = '') {
  const configUrl = serverURL + 'webapp/marginapp/config';
  const payload = {
    marginAppConfigType: {
      product: 'KIOSKLITE',
      data,
    },
    userAuth: {
      sessionKey: kioskConfigSessionKey,
      userId: store?.getState()?.sysCookie.kioskConfigUserId,
    },
  };

  return axiosPost(configUrl, payload);
}

// kiosk上传封面图片
export function postConfigUploadImg(type, payload) {
  const configUrl = serverURL + 'webapp/file/image/upload/kiosk/' + type;
  return axiosPost(configUrl, payload);
}

// kiosk删除封面图片
export function postConfigDeleteImg(type) {
  const configUrl = serverURL + 'webapp/file/image/delete/kiosk/' + type;
  return axiosPost(configUrl);
}

// 获取店铺时间
export function getRestaurantHour() {
  const url = '/kpos/api/hours/list';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

// 获取全部菜单
export function getAllKioskMenu() {
  const url =
    '/kpos/api/menu/menu?product=KIOSK&showInactive=false&showDeleted=false';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

/**
 * CRM 相关
 * */
export function searchCRMMember(params) {
  const url = '/kpos/api/loyalty/members/search';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
    params,
  });
}

export function getCRMMemberInfo(userId) {
  const url = `/kpos/api/loyalty/members/${userId}`;
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function createCRMMember(data) {
  const url = '/kpos/api/loyalty/members';
  return axiosPost(url, data, {
    Authorization: 'UvDU853J9L351BThAC',
  });
}

export function getPointRule() {
  const url = '/kpos/api/loyalty/point/rules';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function getOnboardGiftRule() {
  const url = '/kpos/api/loyalty/onboardGift/rules';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

/* 云接口 兼容多租户注册场景 */
export function getAuthCode(data) {
  return axiosPost(`${getCloudHost()}/auth/customer/otp/phone/login`, data, {
    'x-enc-m-id': encryptString(store?.getState().merchantProfile?.merchantId),
  });
}

export function verifyAuthCode(data) {
  return axiosPost(`${getCloudHost()}/auth/customer/otp/phone/verify`, data, {
    'x-enc-m-id': encryptString(store?.getState().merchantProfile?.merchantId),
  });
}

export function searchRewardRule() {
  return axiosGet('/kpos/api/loyalty/reward/rules', {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function getExpirationPoint(host, data) {
  return axiosPost(
    `${host}/integra-crm/agent?agentId=6232589f103d63bd57e2bacc`,
    data,
    {
      apikey: 'gfq1t6o7ktdla9ll6og9k0g0cs',
      merchantid: 'M000015958',
    }
  );
}

// lock, unlock 资源
export function lockOrder({ targetId, userId }) {
  const url = '/kpos/api/system/lock';
  return axiosPost(
    url,
    {
      type: 'ORDER',
      targetId,
      userAuth: { userId, sessionKey: getCookie('sessionKey') },
    },
    {
      Authorization: 'UvDU853J9L351BThAC',
    }
  );
}

export function unlockOrder({ targetId, userId }) {
  const url = '/kpos/api/system/unlock';
  return axiosPost(
    url,
    {
      type: 'ORDER',
      targetId,
      userAuth: { userId, sessionKey: getCookie('sessionKey') },
    },
    {
      Authorization: 'UvDU853J9L351BThAC',
    }
  );
}

// 获取服务 API Key
export function fetchServiceApiKey() {
  const url = '/kpos/api/system/configuration/fetchServiceApiKey';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

// 获取 折扣列表
export function getDiscountList() {
  const url = '/kpos/api/discount/list';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function getDiscountItems() {
  const url = '/kpos/api/pricingRule/list';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function listStaff() {
  const url = '/kpos/api/staff/member/list';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

// 对接云Promotion
export function getCloudPromotion() {
  const url = '/kpos/api/crm/promotions/search?productLine=KIOSK';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function getTableAreaList() {
  const url = '/kpos/api/seatingArea/list';
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function getTableInfoById(id) {
  const url = '/kpos/api/table/fetch';
  return axiosGet(url, {
    params: { id },
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

// 获取kiosk poster pro配置信息
export function getKioskPosterPro(kioskConfigSessionKey = '') {
  const configUrl = serverURL + 'webapp/marginapp/fetchConfig';
  const payload = {
    product: 'kioskPosterPro',
    userAuth: {
      sessionKey: kioskConfigSessionKey,
      // userId: store?.getState()?.sysCookie.kioskConfigUserId,
    },
  };
  return axiosPost(configUrl, payload);
}

// 修改kiosk poster pro配置页面接口
export function setKioskPosterPro(data = '{}', kioskConfigSessionKey = '') {
  const configUrl = serverURL + 'webapp/marginapp/config';
  const payload = {
    marginAppConfigType: {
      product: 'kioskPosterPro',
      data,
    },
    userAuth: {
      sessionKey: kioskConfigSessionKey,
      userId: store?.getState()?.sysCookie.kioskConfigUserId,
    },
  };

  return axiosPost(configUrl, payload);
}

export function checkIsFirstOrder(phone) {
  const url = `/kpos/api/order/checkOrderExistsByPhoneAndMember?phoneNumber=${phone}`;
  return axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

// 云屏保：查询当前生效的屏保布局（用 encodeURIComponent 序列化，避免空格在 query 里显示为 +）
function serializeEffectiveScreenQuery(params) {
  if (!params || typeof params !== 'object') return '';
  return Object.keys(params)
    .filter((k) => params[k] != null && params[k] !== '')
    .map(
      (k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`
    )
    .join('&');
}

// 云屏保域名整理
function getEffectiveScreenLayoutUrl() {
  const env = getRuntimeEnv();
  const base =
    effectiveScreenHostMap[env] || effectiveScreenHostMap.development;
  const normalizedBase = String(base).replace(/\/+$/, '');
  const path =
    '/config-center/internal/screen-saver-publishes/effective-layout';
  return `${normalizedBase}${path}`;
}

// 云屏保获取
export async function fetchEffectiveScreen(params) {
  const keyRes = await fetchServiceApiKey();
  const keyBody = keyRes?.data;
  if (keyBody?.code !== 0 || keyBody?.data == null || keyBody?.data === '') {
    return Promise.reject(
      new Error(keyBody?.msg || 'fetchServiceApiKey failed')
    );
  }
  const merchantId =
    params?.merchantId ?? store?.getState()?.merchantProfile?.merchantId ?? '';
  return axiosGet(getEffectiveScreenLayoutUrl(), {
    params,
    paramsSerializer: serializeEffectiveScreenQuery,
    headers: {
      apikey: String(keyBody.data),
      merchantid: String(merchantId),
    },
  });
}
