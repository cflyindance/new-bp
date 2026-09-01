import { sendErrorMsg, printUnpaidReceipt, sendMsgReceipt } from './index';
import { getCookie } from '@/utils';
import { getDishItemLanguage } from '@/utils/busTools';
import store from '../reducers/store';
import i18n from '@/assets/i18n/i18n';
import { calculateTotalAmount } from '@/utils/processZeroAmountOrder';
import { TOGONAMELIST } from '@/constants/mockData';
import Big from 'big.js';

export function sendError2MsgCenter(orderId, errorTitle) {
  if (orderId) {
    const msgPayload = {
      message: {
        title: errorTitle,
        sender: getCookie('kioskLicense'),
        topicId: 7,
        order: {
          id: orderId,
        },
        content: 'some content...',
      },
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };
    sendErrorMsg(msgPayload)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

export const sendNewOrderMessage = (orderId, orderNumber, phone) => {
  const data = {
    message: {
      title: 'New Order',
      content: 'None',
      order: {
        id: orderId,
        orderNumber,
        phone,
        phoneNumber: phone,
      },
      sender: getCookie('kioskLicense'),
      topicName: 'KIOSK',
    },
    userAuth: {
      sessionKey: getCookie('sessionKey'),
    },
  };
  return sendErrorMsg(data)
    .then((res) => {
      console.log(res);
      return res;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });
};

export function printUnpaidReceiptHandler(orderId, paymentTotals = {}) {
  // paymentTotals：
  // 【dual price需求】新增cashPaymentTotal、creditPaymentTotal字段，用于订单的小票上展示不同支付方式下的价格
  const unpaidReceiptPayload = {
    orderId: orderId,
    merchantCopy: false,
    userAuth: {
      sessionKey: getCookie('sessionKey'),
    },
    ...paymentTotals,
  };
  return printUnpaidReceipt(unpaidReceiptPayload);
}

function buildGiftCardSmsContent({
  merchantName,
  giftCardInfo = {},
  finalTotal,
}) {
  const cardNumber = giftCardInfo?.ecardNumber || '';
  const balance = Big(giftCardInfo?.balance ?? 0).toFixed(2);
  const expirationTime = giftCardInfo?.expirationTime || '2099-12-31';

  return [
    `${i18n.t('sms-thank-you-order', { merchantName })}.`,
    `${i18n.t('gift_card_sms_card_label')}: ${cardNumber}.`,
    `${i18n.t('gift_card_sms_balance_label')}: ${balance}.`,
    `${i18n.t('gift_card_sms_exp_label')}: ${expirationTime}.`,
    `${i18n.t('allTotal')}: ${finalTotal} USD. `,
    `${i18n.t('gift_card_sms_come_again')}`,
  ].join(' ');
}

function buildGiftCardSmsPartPayContent({
  merchantName,
  unpaid,
  paid,
  balance,
}) {
  return [
    `${i18n.t('sms-thank-you-order', { merchantName })}. ${i18n.t('sms-proceed-counter-payment')}. `,
    `${i18n.t('gift_card_sms_balance_label')}: ${balance}.`,
    `${i18n.t('allTotal')}: ${finalTotal} USD. `,
    `${i18n.t('paid')}: ${paid} USD. `,
    `${i18n.t('unpaid')}: ${unpaid} USD. `,
    `${i18n.t('gift_card_sms_come_again')}`,
  ].join(' ');
}

// 发送短信模版
export function sendMsgReceiptHandler(options = {}) {
  const state = store.getState();
  const merchantName = state.merchantProfile.name;
  const { saveOrderResult, paymentType: type } = state.currentOrder;
  const giftCardInfo = options?.giftCardInfo || null;
  const giftCardPhone = giftCardInfo?.cardDetail?.to.slice(-10);
  const phoneNumber =
    '1 ' + (saveOrderResult.customer?.phone?.[0].number || giftCardPhone);
  const language = i18n.language || 'en';
  const totalAmount = calculateTotalAmount(state);
  const isBuyGiftCard =
    !!giftCardInfo &&
    (saveOrderResult?.type === 'CLOUD_GIFT_CARD' ||
      state.cardPaidResult?.type === 'CLOUD_GIFT_CARD');
  const isCreditCardFullPaid =
    type === 'CREDIT_CARD' && !state.cardPaidResult?.id;

  let content = [];
  // 菜价
  let subTotal = Big(saveOrderResult.totalPrice).toFixed(2);
  // 总税
  let totalTax = Big(saveOrderResult.totalTax).toFixed(2);
  // 小费
  const tipAmount = Big(state.currentOrder.tipAmount).toFixed(2);
  // 菜量
  const count = saveOrderResult?.orderItems?.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  // 折扣综合 （rewardDiscount：自研crm折扣值；order?.discount本地促销配置折扣；crmIntegrationDiscount：crm集成折扣）
  let discount = 0;
  let crmIntegrationDiscount = 0;
  if (saveOrderResult?.discountList) {
    const crmIntegrationDiscountList = JSON.parse(
      saveOrderResult?.discountList
    );
    if (crmIntegrationDiscountList?.length > 0) {
      const discountInfo = crmIntegrationDiscountList[0];
      // 因为subTotal是用totalPrice为基准算价格，所以菜价已经减过优惠，所以需要用isItemDetailDiscount条件过滤
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
  discount = Big(discount)
    .plus(saveOrderResult?.rewardDiscount ?? 0)
    .plus(saveOrderResult?.discount ?? 0)
    .plus(crmIntegrationDiscount)
    .toFixed(2);

  // 菜名集合
  const itemNames = saveOrderResult?.orderItems
    ?.map(
      (item) =>
        getDishItemLanguage(
          item?.fieldDisplayNameGroups,
          language
        ).replaceAll('.', ' ') || item.displayName.replaceAll('.', ' ')
    )
    ?.join('、');

  // 整单加收charge
  let chargeContentList = [];
  let chargeTotal = 0;
  if (state.selfConfig?.charge?.length) {
    if (type == 'CREDIT_CARD') {
      let r = state.selfConfig.charge.find((c) => c.id == 1);
      if (r?.select?.id) {
        chargeTotal = Big(subTotal).times(r.select.rate).div(100).toFixed(2);
        chargeContentList.push(`${r.select.name}:$${chargeTotal}.`);
      }
    }
  }

  // togo的加收
  let togoContentList = [];
  let togoTotal = 0;
  if (
    state.currentOrder.orderType === 'TO_GO' ||
    state.currentOrder.orderType === 'PICK_UP'
  ) {
    state.togoList.forEach((item) => {
      const rate = item.id !== 4 ? item.select.rate : item.select.rate * count;
      if (item?.select?.id) {
        togoTotal = Big(togoTotal).plus(rate).toFixed(2);
        if (item.select.id == -1) {
          togoContentList.push(
            `${i18n.t([TOGONAMELIST[item.id]])}: ${i18n.t('free')}. `
          );
        } else {
          togoContentList.push(
            `${i18n.t([TOGONAMELIST[item.id]])}: ${rate} USD. `
          );
        }
      }
    });
  }

  // 卡支付
  if (type === 'CREDIT_CARD' || totalAmount === 0) {
    if (isBuyGiftCard) {
      // 全额支付购买礼品卡发短信
      if (isCreditCardFullPaid) {
        // 全部付款-文案
        // 最终结算金额（菜价 + 总税 + togo加收 + 小费 - 折扣）
        let finalTotal = Big(subTotal)
          .plus(totalTax)
          .plus(togoTotal)
          .plus(tipAmount)
          .minus(discount)
          .toFixed(2);
        content = buildGiftCardSmsContent({
          merchantName,
          giftCardInfo,
          finalTotal: finalTotal,
        });
      } else {
        const { paid, unpaid } = state.cardPaidResult.unpaidInfo;
        content = buildGiftCardSmsPartPayContent({
          merchantName,
          unpaid,
          paid,
          balance: state.currentOrder.saveOrderResult.totalPrice,
        });
      }
    } else if (state.cardPaidResult?.id) {
      // 部分付款-文案
      const { paid, unpaid } = state.cardPaidResult.unpaidInfo;
      content = [
        `${i18n.t('sms-thank-you-order', { merchantName })}. ${i18n.t('sms-proceed-counter-payment')}. `,
        `#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
        `${itemNames}. `,
        `${i18n.t('subtotal')}: ${subTotal} USD. `,
        `${Number(totalTax) > 0 ? `${i18n.t('tax')}: ${totalTax} USD. ` : ''}`,
        `${i18n.t('Tips')}: ${tipAmount} USD. `,
        ...chargeContentList,
        ...togoContentList,
        `${Number(discount) > 0 ? `${i18n.t('sms-discount')}: -${discount} USD. ` : ''}`,
        `${i18n.t('paid')}: ${paid} USD. `,
        `${i18n.t('unpaid')}: ${unpaid} USD. `,
        `${saveOrderResult.createTime} `,
        `${i18n.t('sms-enjoy-meal')} `,
      ].join(' ');
    } else {
      // 全部付款-文案
      // 最终结算金额（菜价 + 总税 + charge + togo加收 + 小费 - 折扣）
      let finalTotal = Big(subTotal)
        .plus(totalTax)
        .plus(chargeTotal)
        .plus(togoTotal)
        .plus(tipAmount)
        .minus(discount)
        .toFixed(2);

      content = [
        `${i18n.t('sms-thank-you-order', { merchantName })}. `,
        `#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
        `${itemNames}. `,
        `${i18n.t('subtotal')}: ${subTotal} USD. `,
        `${Number(totalTax) > 0 ? `${i18n.t('tax')}: ${totalTax} USD. ` : ''}`,
        `${i18n.t('Tips')}: ${tipAmount} USD. `,
        ...chargeContentList,
        ...togoContentList,
        `${Number(discount) > 0 ? `${i18n.t('sms-discount')}: -${discount} USD. ` : ''}`,
        `${i18n.t('allTotal')}: ${finalTotal} USD. `,
        `${saveOrderResult.createTime} `,
        `${i18n.t('sms-enjoy-meal')} `,
      ].join(' ');
    }
  } else if (type === 'CASH') {
    // 现金付款-文案
    content = [
      `${i18n.t('sms-thank-you-order', { merchantName })}. ${i18n.t('sms-proceed-counter-payment')}. `,
      `#${saveOrderResult.orderNumber}.  ${saveOrderResult.type}. `,
      `${itemNames}. `,
      `${i18n.t('subtotal')}: ${subTotal} USD. `,
      `${Number(totalTax) > 0 ? `${i18n.t('tax')}: ${totalTax} USD. ` : ''}`,
        ...chargeContentList,
      ...togoContentList,
      `${Number(discount) > 0 ? `${i18n.t('sms-discount')}: -${discount} USD. ` : ''}`,
      `${saveOrderResult.createTime} `,
      `${i18n.t('sms-enjoy-meal')} `,
    ].join(' ');
  }

  const msgReceiptPayload = {
    phoneNumber,
    content,
  };

  return sendMsgReceipt(msgReceiptPayload);
}
