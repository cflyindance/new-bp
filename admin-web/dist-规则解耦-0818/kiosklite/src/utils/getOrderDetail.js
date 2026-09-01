import { getOrderInfo } from '@/api/apiPos';
import Big from 'big.js';
import { XMLObjTree } from '@/utils/ObjectTree';

const parseLicenseXml = (data) => {
  let findAppInstances = data;
  let start = findAppInstances?.indexOf('<soap:Body>');
  let end = findAppInstances?.indexOf('</soap:Body>');
  findAppInstances = findAppInstances?.substring(start + 11, end);
  let objTree = new XMLObjTree();
  let instanceList = objTree?.parseXML(findAppInstances);
  let r = instanceList?.fetchorderresponsetype?.order;
  return r;
};

const getOrderDetail = async ({ orderId, setCardPaidResult }) => {
  const res = await getOrderInfo(orderId);
  let r = res.data ? parseLicenseXml(res.data) || {} : {};

  if (JSON.stringify(r) !== '{}') {
    let chargeTotal = 0;
    if (r.ordercharges) {
      if (
        Object.prototype.toString.call(r.ordercharges) === '[object Object]'
      ) {
        chargeTotal = r.ordercharges.charge;
      } else {
        r.ordercharges.forEach((c) => {
          chargeTotal = Big(chargeTotal).plus(c.charge).toNumber();
        });
      }
    }

    // CRM集成 折扣类型时，需要手动减去折扣(注意这里discountlist是纯小写！)
    let crmIntegrationDiscount = 0;
    if (r?.discountlist) {
      const crmIntegrationDiscountList = JSON.parse(r.discountlist);
      if (crmIntegrationDiscountList?.length > 0) {
        const discountInfo = crmIntegrationDiscountList[0];
        // 因为下面用totalPrice为基准算价格，所以菜价已经减过优惠，所以需要用isItemDetailDiscount条件过滤
        if (
          discountInfo.type === 'promotion' &&
          !discountInfo?.extraInfo?.isItemDetailDiscount
        ) {
          crmIntegrationDiscount = discountInfo.amount;
        } else if (
          !discountInfo.isReward &&
          !discountInfo?.extraInfo?.isItemDetailDiscount
        ) {
          crmIntegrationDiscount = discountInfo.amount;
        }
      }
    }

    let paid = 0;
    if (Array.isArray(r?.payments)) {
      paid = r.payments.reduce((sum, payment) => {
        const paymentAmount =
          payment?.transactionrecord?.amount ?? payment?.amount ?? 0;
        return Big(sum).plus(paymentAmount).toNumber();
      }, 0);
    } else {
      paid = r?.payments?.transactionrecord?.amount ?? r?.payments?.amount ?? 0;
    }
    const unpaid = Big(r.totalprice)
      .plus(r.totaltax)
      .plus(r.totaltips)
      .plus(Big(chargeTotal).toFixed(2))
      .minus(paid)
      .minus(r.discount || 0)
      .minus(r.rewarddiscount || 0)
      .minus(crmIntegrationDiscount)
      .toNumber();

    r.unpaidInfo = { paid, unpaid };
  }

  setCardPaidResult(r);
  return r;
};

export default getOrderDetail;
