import axios from '@/utils/axios';
import { axiosGet, axiosPost } from './kioskConfigApi';
import { fetchKposWebappMenu } from './menu';
import { serverURL } from '@/api/ip';

function axiosXML(obj) {
  return axios({
    method: 'post',
    url: obj.url,
    data: obj.data,
    timeout: 3500,
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
    },
  });
}

export async function getECardSettings() {
  const url = '/kpos/api/ecard/settings';
  const response = await axiosGet(url, {
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
  return response.data;
}

export function searchECardCards(params) {
  const url = '/kpos/api/ecard/cards/all/search';
  return axiosGet(url, {
    params,
    headers: {
      Authorization: 'UvDU853J9L351BThAC',
    },
  });
}

export function fetchAllMenu() {
  return fetchKposWebappMenu({ product: 'ALL' });
}

// 接口问题，开卡不能走restful接口
export function saveGiftCardOrderBySoap(params) {
  const {
    totalPrice,
    saleItemId,
    quantity,
    price,
    actionType,
    cardType,
    to,
    toType,
    expirationTime,
    sessionKey,
  } = params;

  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SaveOrderType><app:order><app:type>CLOUD_GIFT_CARD</app:type><app:totalPrice>${totalPrice}</app:totalPrice><app:userPassword>56854b3d95d5d154e1fbca66</app:userPassword><app:orderItems><app:saleItemId>${saleItemId}</app:saleItemId><app:quantity>${quantity}</app:quantity><app:price>${price}</app:price><app:eCard><app:actionType>${actionType}</app:actionType><app:cardType>${cardType}</app:cardType><app:to>${to}</app:to><app:toType>${toType}</app:toType><app:expirationTime>${expirationTime}</app:expirationTime></app:eCard></app:orderItems></app:order><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SaveOrderType></soapenv:Body></soapenv:Envelope>`,
  });
}

// 接口问题，删除未支付卡不能走restful接口
export function removeGiftCard(data) {
  const {
    checksum,
    createTime,
    orderId,
    totalPrice,
    discountRate,
    discountRateType,
    discount,
    saleItemId,
    itemId,
    sessionKey,
  } = data;
  return axiosXML({
    url: serverURL + 'ws/kposService',
    data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SaveOrderType><app:order><app:userPassword>56854b3d95d5d154e1fbca66</app:userPassword><app:point>0</app:point><app:needCommit>2</app:needCommit><app:checksum>${checksum}</app:checksum><app:createTime>${createTime}</app:createTime><app:callerId>false</app:callerId><app:crmMemberId></app:crmMemberId><app:crmCustomerInfo>{}</app:crmCustomerInfo><app:id>${orderId}</app:id><app:status>CANCELED</app:status><app:forceRecoveryStock>true</app:forceRecoveryStock><app:discountList>[]</app:discountList><app:exemptAutoCharges></app:exemptAutoCharges><app:taxExempt>false</app:taxExempt><app:numOfGuests>0</app:numOfGuests><app:totalPrice>${totalPrice}</app:totalPrice><app:totalTips>0</app:totalTips><app:totalTax>0.00</app:totalTax><app:roundingAmount>0</app:roundingAmount><app:printTicketWhenVoid>true</app:printTicketWhenVoid><app:discountName></app:discountName><app:discountID>-1</app:discountID><app:discountRate>${discountRate}</app:discountRate><app:discountRateType>${discountRateType}</app:discountRateType><app:chargeName></app:chargeName><app:chargeID>-1</app:chargeID><app:discount>${discount}</app:discount><app:charge>0</app:charge><app:rewardDiscount>0</app:rewardDiscount><app:loyaltyDiscount>false</app:loyaltyDiscount><app:orderItems><app:saleItemId>${saleItemId}</app:saleItemId><app:id>${itemId}</app:id><app:seatId>0</app:seatId><app:quantity>1</app:quantity><app:originalSalePrice>${totalPrice}</app:originalSalePrice><app:originDualPrice>${totalPrice}</app:originDualPrice><app:price>${totalPrice}</app:price><app:status>ORDERED</app:status><app:taxExempt>false</app:taxExempt><app:useBenefitPrice>false</app:useBenefitPrice><app:discountList>[]</app:discountList><app:rewardItem>false</app:rewardItem><app:isGiftItem>false</app:isGiftItem><app:discount>0</app:discount><app:discountRate>0</app:discountRate><app:discountRateType>0</app:discountRateType><app:charge>0</app:charge><app:chargeTaxed>false</app:chargeTaxed><app:chargeRateType>0</app:chargeRateType><app:chargeRate>0</app:chargeRate><app:taxSnapshot>true</app:taxSnapshot></app:orderItems><app:productLine>KIOSK</app:productLine></app:order><app:fetchPayments>true</app:fetchPayments><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SaveOrderType></soapenv:Body></soapenv:Envelope>`,
  });
}

export function printECardInfo(eCardData) {
  const unpaidReceiptURL = serverURL + 'webapp/print/printReceipt';
  return axiosPost(unpaidReceiptURL, eCardData);
}
