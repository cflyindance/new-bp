import axios from '@/utils/axios';
import { serverURL } from './ip';
import { getCookie } from '@/utils';
import { isValidPosConfigUserId } from '@/utils/posConfigSavePolicy';

function axiosXML(obj) {
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: obj.url,
      data: obj.data,
      timeout: 60 * 1000,
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
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

// 获取license列表
export function getLicenseList() {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindAppInstancesType><app:fetchDetails>true</app:fetchDetails><app:ipAddress>${window.location.hostname}</app:ipAddress><app:type>KIOSK</app:type></app:FindAppInstancesType></soapenv:Body></soapenv:Envelope>`,
  });
}
// 获取当前license的相关信息
export function getLicenseInfo() {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindAppInstancesType><app:name>${getCookie('kioskLicense')}</app:name><app:fetchDetails>true</app:fetchDetails><app:ipAddress>${window.location.hostname}</app:ipAddress><app:type>KIOSK</app:type></app:FindAppInstancesType></soapenv:Body></soapenv:Envelope>`,
  });
}
// 获取所有的支付设备信息
export function getPayDevices() {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindDevicesType><app:type>PAYMENT_TERMINAL</app:type></app:FindDevicesType></soapenv:Body></soapenv:Envelope>`,
  });
}

// 获取charge列表
export function getChargeList() {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: '<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:ListChargesType></app:ListChargesType></soapenv:Body></soapenv:Envelope>',
  });
}

// 获取订单详情
export function getOrderInfo(orderId) {
  let sessionKey = getCookie('sessionKey');
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FetchOrderType><app:orderId>${orderId}</app:orderId><app:fetchPayments>true</app:fetchPayments><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:FetchOrderType></soapenv:Body></soapenv:Envelope>`,
  });
}

// 获取pos中kiosk配置（订单类型，支付方式，sms开通）
export function getKioskConfigFromPos() {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:ListSystemConfigurationsType><app:fetchDetails>true</app:fetchDetails><app:adminRequest>false</app:adminRequest></app:ListSystemConfigurationsType></soapenv:Body></soapenv:Envelope>`,
  });
}

// 保存pos中kiosk配置（订单类型，支付方式，sms开通）
export function buildKioskConfigUpdateXml(params, userId, sessionKey) {
  if (!isValidPosConfigUserId(userId)) {
    throw new Error('Valid POS configuration userId is required');
  }
  const normalizedUserId = String(userId).trim();
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:UpdateSystemConfigurationType>${params}<app:userAuth><app:userId>${normalizedUserId}</app:userId><app:sessionKey>${sessionKey ?? ''}</app:sessionKey></app:userAuth></app:UpdateSystemConfigurationType></soapenv:Body></soapenv:Envelope>`;
}

export function saveKioskConfigFromPos(params, userId) {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: buildKioskConfigUpdateXml(
      params,
      userId,
      getCookie('sessionKey')
    ),
  });
}

//更改订单在pos中的状态
export function savePaymentRecordType(params, userId, sessionKey) {
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SavePaymentRecordType>${params}<app:userAuth><app:userId>${userId}</app:userId><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SavePaymentRecordType></soapenv:Body></soapenv:Envelope>`,
  });
}
