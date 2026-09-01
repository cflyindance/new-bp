import { XMLObjTree } from '@/utils/ObjectTree';

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  const num = Number(value);
  return Number.isNaN(num) ? value : num;
};

const toBoolean = (value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
};

const normalizeFieldDisplayNames = (fieldDisplayNames) => {
  if (!fieldDisplayNames) {
    return [];
  }

  const list = Array.isArray(fieldDisplayNames)
    ? fieldDisplayNames
    : [fieldDisplayNames];

  return list.map((item) => ({
    name: item?.name || '',
    languageID: toNumber(item?.languageid),
    languageCode: item?.languagecode || '',
    languageName: item?.languagename || '',
  }));
};

const normalizeFieldDisplayNameGroups = (groups) => {
  if (!groups) {
    return [];
  }

  const list = Array.isArray(groups) ? groups : [groups];

  return list.map((item) => ({
    fieldName: item?.fieldname || '',
    fieldDisplayNames: normalizeFieldDisplayNames(item?.fielddisplaynames),
  }));
};

const normalizeOrderItem = (item) => ({
  id: toNumber(item?.id),
  saleItemId: toNumber(item?.saleitemid),
  displayName: item?.displayname || '',
  quantity: toNumber(item?.quantity),
  originalSalePrice: toNumber(item?.originalsaleprice),
  price: toNumber(item?.price),
  useBenefitPrice: toBoolean(item?.usebenefitprice),
  discount: toNumber(item?.discount),
  discountRateType: toNumber(item?.discountratetype),
  discountRate: toNumber(item?.discountrate),
  charge: toNumber(item?.charge),
  chargeRateType: toNumber(item?.chargeratetype),
  chargeRate: toNumber(item?.chargerate),
  chargeTaxed: toBoolean(item?.chargetaxed),
  taxExempt: toBoolean(item?.taxexempt),
  manualTaxed: toBoolean(item?.manualtaxed),
  status: item?.status || '',
  totalAmount: toNumber(item?.totalamount),
  qtySentToKitchen: toNumber(item?.qtysenttokitchen),
  qtyVoid: toNumber(item?.qtyvoid),
  eCard: item?.ecard || {},
  taxSnapshot: toBoolean(item?.taxsnapshot),
  rewardItem: toBoolean(item?.rewarditem),
  isGiftItem: toBoolean(item?.isgiftitem),
  originDualPrice: toNumber(item?.origindualprice),
  fieldDisplayNameGroups: normalizeFieldDisplayNameGroups(
    item?.fielddisplaynamegroups
  ),
  receiptPrintingCount: toNumber(item?.receiptprintingcount),
  receiptPrintedItemQty: toNumber(item?.receiptprinteditemqty),
  productLine: item?.productline || '',
});

export function parseSaveGiftCardOrderSoapResponse(xml) {
  const bodyStart = xml?.indexOf('<soap:Body>');
  const bodyEnd = xml?.indexOf('</soap:Body>');

  if (bodyStart === -1 || bodyEnd === -1) {
    throw new Error('Invalid SOAP response');
  }

  const soapBody = xml.substring(bodyStart + 11, bodyEnd);
  const objTree = new XMLObjTree();
  const parsedBody = objTree.parseXML(soapBody);
  const response = parsedBody?.saveorderresponsetype;
  const orderItems = response?.order?.orderitems;
  const orderItemList = orderItems
    ? Array.isArray(orderItems)
      ? orderItems
      : [orderItems]
    : [];

  return {
    result: {
      id: toNumber(response?.result?.id),
      successful: toBoolean(response?.result?.successful),
    },
    order: {
      id: toNumber(response?.order?.id),
      type: response?.order?.type || '',
      totalPrice: toNumber(response?.order?.totalprice),
      totalTax: toNumber(response?.order?.totaltax),
      totalTips: toNumber(response?.order?.totaltips),
      discount: toNumber(response?.order?.discount),
      discountRateType: toNumber(response?.order?.discountratetype),
      discountRate: toNumber(response?.order?.discountrate),
      rewardDiscount: toNumber(response?.order?.rewarddiscount),
      isBeMerged: toBoolean(response?.order?.isbemerged),
      charge: toNumber(response?.order?.charge),
      roundingAmount: toNumber(response?.order?.roundingamount),
      status: response?.order?.status || '',
      createTime: response?.order?.createtime || '',
      orderItems: orderItemList.map(normalizeOrderItem),
      numOfGuests: toNumber(response?.order?.numofguests),
      loyaltyDiscount: toBoolean(response?.order?.loyaltydiscount),
      point: toNumber(response?.order?.point),
      userId: toNumber(response?.order?.userid),
      serverName: response?.order?.servername || '',
      orderNumber: response?.order?.ordernumber || '',
      taxExempt: toBoolean(response?.order?.taxexempt),
      checksum: response?.order?.checksum || '',
      sendToKitchenCount: toNumber(response?.order?.sendtokitchencount),
      printReceiptCount: toNumber(response?.order?.printreceiptcount),
      appTypeCreatedOn: response?.order?.apptypecreatedon || '',
      menuId: toNumber(response?.order?.menuid),
      productLine: response?.order?.productline || '',
      totalMultipleDiscount: toNumber(response?.order?.totalmultiplediscount),
      cashDiscount: toNumber(response?.order?.cashdiscount),
      taxCashDiscount: toNumber(response?.order?.taxcashdiscount),
      paidTotal: toNumber(response?.order?.paidtotal),
    },
    menuChanged: toBoolean(response?.menuchanged),
  };
}
