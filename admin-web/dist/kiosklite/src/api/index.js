import axios from '@/utils/axios';
const CancelToken = axios.CancelToken;
export let source = CancelToken.source();
import { getCookie } from '@/utils';
import { baseURL } from './config';
import { serverURL } from './ip';
import getPosVersion from '@/utils/getPosVersion';
import dayjs from 'dayjs';
import { removeEmoji } from '@/utils/sanitizeInput';

export function fetchItemSizeList() {
  const itemSizeListURL = serverURL + 'webapp/itemSizes';
  return axiosGet(itemSizeListURL);
}

export function fetchMenuGroup() {
  let menuURL = serverURL + 'webapp/kiosk/v1/kioskMenus?product=KIOSK';
  return new Promise(async (resolve, reject) => {
    try {
      const res = await axiosGet(menuURL);
      if (res?.status === 200) {
        const menuGroups = res.data.KioskMenus[0]?.menuGroups?.filter(
          (each) =>
            (each?.restaurantHourIds?.length > 0 &&
              each?.name !== 'Global Option Group') ||
            each?.name === 'Metadata Item Group'
        );
        const newRes = {
          data: {
            KioskMenus: [
              {
                ...res.data.KioskMenus[0],
                menuGroups,
              },
            ],
          },
        };
        resolve(newRes);
      } else {
        reject(res);
      }
    } catch (e) {
      reject(e);
    }
  });
}

export function fetchOrderDetailInfo(orderId) {
  const url = serverURL + 'webapp/order/fetchOrder?orderId=' + orderId;
  return axiosGet(url);
}

export function fetchSessionKey(licence) {
  const sessionKeyURL = serverURL + 'webapp/license/clientInstanceLogin';
  let secretKey = '';
  if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
    secretKey = getCookie('AndroidSecret') || getCookie('secretKey');
  } else {
    secretKey = getCookie('secretKey');
  }
  const payload = {
    appInstanceName: licence || getCookie('kioskLicense'),
    appInstanceType: 'KIOSK',
    secretKey,
  };
  return axiosPost(sessionKeyURL, payload);
}

export function fetchSystemConfig() {
  const sysConfigURL =
    serverURL + 'webapp/kioskSystem/kioskSystemConfigurations';
  return axiosGet(sysConfigURL);
}

export function fetchTaxInfo() {
  const taxURL = serverURL + 'webapp/payment/companyTaxs';
  return axiosGet(taxURL);
}

export function fetchCompanyProfile() {
  const companyProfileURL = serverURL + 'webapp/store/fetchCompanyProfile';
  return axiosGet(companyProfileURL);
}

export function saveOrder(orderData) {
  const saveOrderURL = serverURL + 'webapp/order/saveOrder';
  posFrontLog(
    `saveOrder -----status: ${orderData?.order?.status} -----id: ${orderData?.order?.id} -----  locationPage: ${window?.location?.hash}}`
  );
  if (orderData?.order?.customer?.phone.length > 0) {
    orderData.order.phoneNumber = orderData.order.customer.phone[0].number;
  }
  return axiosPost(saveOrderURL, {
    ...orderData,
    userAuth: orderData?.order?.userAuth,
  });
}

export function sendPayment(paymentData) {
  const paymentURL = serverURL + 'webapp/payment/savePaymentRecord';

  return new Promise((resolve, reject) => {
    axios
      .post(paymentURL, paymentData, {
        timeout: 130 * 1000, // 2分钟10秒
        cancelToken: source.token,
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        source = CancelToken.source();
        reject(err);
      });
  });
}

export function sendErrorMsg(msg) {
  const msgCenterURL = serverURL + 'webapp/message/saveMessage';
  return axiosPost(msgCenterURL, msg);
}

export function send2Kitchen(msg) {
  const kitchenURL = serverURL + 'webapp/kitchen/printItemToKitchen';
  return axiosPost(kitchenURL, msg);
}

export function printUnpaidReceipt(payByCashData) {
  const unpaidReceiptURL = serverURL + 'webapp/print/printReceipt';
  return axiosPost(unpaidReceiptURL, payByCashData);
}

export function sendMsgReceipt(msgReceiptData) {
  const msgReceiptURL = serverURL + 'webapp/messageSender/textMessage';
  return axiosPost(msgReceiptURL, msgReceiptData);
}

function axiosPost(URL, payload = null, config = {}) {
  return new Promise((resolve, reject) => {
    axios
      .post(URL, payload, config)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function axiosGet(URL, config = {}) {
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

export function getSecretKey(obj) {
  return axiosPost(
    'http://localhost:22081/kpos/webapp/license/getsecretkey',
    obj
  );
}

export function saveSecretKey(obj) {
  return axiosPost(
    'http://localhost:22081/kpos/webapp/license/savesecretkey',
    obj
  );
}

export function saveCustomerInfo(number, firstName) {
  const unpaidReceiptURL = serverURL + 'webapp/kioskCustomer/saveCustomerInfo';
  const params = {
    customer: {
      firstName: removeEmoji(firstName),
      phone: [
        {
          number,
          primaryUse: true,
        },
      ],
    },
  };
  return axiosPost(unpaidReceiptURL, params);
}

export function printOrder(params) {
  const printUrl = serverURL + 'webapp/print/printPaymentReceipt';
  return new Promise((resolve, reject) => {
    axios
      .post(printUrl, params, { timeout: 12000 })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function sendToPosMsg(msg) {
  return axiosPost(baseURL.returnUrl, msg);
}

export function sendSignature(msg) {
  return axiosPost(baseURL.backUrl, msg);
}

// 打印叫号单
export function printCall(data) {
  const url = serverURL + 'webapp/print/printCall';
  return axiosPost(url, data);
}

// 获取所有基础配置列表
export function fetchSystemConfigAllList(config = {}, posVersion = '') {
  return new Promise(async (resolve, reject) => {
    let name =
      'RECEIPT_PRINT,TIPS_SUGGESTIONS_CALCULATION,PRINTING_DEBUG_MODE,CREDIT_CHARGE_ENABLE,CREDIT_CHARGE_RATE,NEW_CLOUD_GIFT_CARD_ENABLED';

    // CREDIT_CHARGE_ENABLE：获取 dual price 开关状态
    // CREDIT_CHARGE_RATE：获取 dual price 费率
    // ADVOCADO_SERVICE_ENABLED这个配置只在30.13版本中出现.
    // CRM_SERVICE_ENABLED在30.14以下版本中出现.
    // POS_CRM_SERVICE_ENABLED只在30.14及以上出现.
    // 需要根据POS版本判断是否需要添加这个配置.
    // 不再支持 ADVOCADO_SERVICE_ENABLED, 使用 CRM_INTEGRATION_SERVICE_ENABLED替换
    const posVersionNum =
      posVersion || Number(getPosVersion(localStorage.getItem('posVersion')));

    if (posVersionNum < 18030140000) {
      name += ',CRM_SERVICE_ENABLED';
    }
    if (posVersionNum >= 18030140000) {
      name += ',POS_CRM_SERVICE_ENABLED';
    }
    if (posVersionNum >= 18030160000) {
      name += ',CRM_INTEGRATION_SERVICE_ENABLED';
    }

    const sysConfigURL =
      serverURL + 'webapp/system/listSystemConfigurations?name=' + name;
    let result = await axiosGet(sysConfigURL, config);
    result.data.systemConfiguration = updateSystemConfiguration(
      result.data.systemConfiguration
    );
    resolve(result);
  });
}

// PIT-4571 判断30.14版本以上 CRM_SERVICE_ENABLED参数改成POS_CRM_SERVICE_ENABLED的问题
function updateSystemConfiguration(configs) {
  // 找到 "POS_CRM_SERVICE_ENABLED" 的项
  let posCrmIndex = configs.findIndex(
    (item) => item.name === 'POS_CRM_SERVICE_ENABLED'
  );

  // 如果存在 "POS_CRM_SERVICE_ENABLED"
  if (posCrmIndex !== -1) {
    // 把 "POS_CRM_SERVICE_ENABLED" 的 name 改为 "CRM_SERVICE_ENABLED"
    configs[posCrmIndex].name = 'CRM_SERVICE_ENABLED';
    // 删除任何重复的 "CRM_SERVICE_ENABLED"（排除刚刚修改的那个）
    configs = configs.filter((item, index) => {
      return !(item.name === 'CRM_SERVICE_ENABLED' && index !== posCrmIndex);
    });
  }
  return configs;
}
// 获取kiosk配置页面接口
export function getMarginappFetchConfig(config = {}) {
  const configUrl = serverURL + 'webapp/marginapp/fetchConfig';
  const payload = {
    product: 'KIOSKLITE',
    userAuth: {
      sessionKey: getCookie('sessionKey'),
    },
  };
  return axiosPost(configUrl, payload, config);
}

export function getVersion() {
  return new Promise((resolve, reject) => {
    axios
      .get(`./version.json?t=${+new Date()}`)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// 提供后端日志
export function posFrontLog(logMsg) {
  const logMsgUrl = `${serverURL}webapp/posfrontlog?logMsg=${encodeURIComponent(`[KIOSK-V${getCookie('kioskVersion')}-'${getCookie('kioskLicense')}'] 【${dayjs().format('YYYY-MM-DD HH:mm:ss')}】 ${logMsg}`)}`;
  return axiosGet(logMsgUrl);
}

// pos记录支付设备
export function setTerminal(data) {
  const url = serverURL + 'webapp/terminal';
  return new Promise((resolve, reject) => {
    axios
      .post(url, JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
