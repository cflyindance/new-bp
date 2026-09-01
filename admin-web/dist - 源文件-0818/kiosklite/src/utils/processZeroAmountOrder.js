import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { saveOrder, send2Kitchen, printCall, posFrontLog } from '@/api';
import { savePaymentRecordType } from '@/api/apiPos';
import { generateSubmitOrderObj, getOrderInfoObj } from '@/api/submitOrderObj';
import { orderLockProcedure } from '@/utils/orderLock';
import { sendError2MsgCenter, sendNewOrderMessage } from '@/api/apiUtil';
import { getChooseTableStatus } from '@/utils/chooseTable';
import reduxStore from '@/reducers/store';
import Toast from '@/component/toast';
import { markPostPaymentAction } from '@/actions';
import { setNeedCommit } from '@/actions/avocado';
import i18n from '@/assets/i18n/i18n';
import Big from 'big.js';

/**
 * 计算订单总金额
 * @param {Object} store - Redux store state
 * @returns {number} 总金额
 */
export const calculateTotalAmount = (store) => {
  const orderData = generateSubmitOrderObj(store);
  const orderInfo = getOrderInfoObj(store);
  let crmIntegrationDiscount = 0;
  if (orderData?.order?.discountList) {
    const crmIntegrationDiscountList = JSON.parse(orderData.order.discountList);
    if (crmIntegrationDiscountList?.length > 0) {
      const discountInfo = crmIntegrationDiscountList[0];
      if (discountInfo.type === 'promotion') {
        crmIntegrationDiscount = discountInfo.amount;
      } else if (!discountInfo.isReward) {
        crmIntegrationDiscount = discountInfo.amount;
      }
    }
  }

  // 总价格（菜价 + 总税 + 整单加收 + togo加收 - rewardDiscount - 促销订单折扣 - crm集成折扣）
  const totalAmount = Big(orderInfo?.orderSubtotal)
    .plus(orderData?.order?.totalTax)
    .plus(orderData?.order?.chargeTotal)
    .plus(orderData?.order?.togoTotal)
    .minus(orderData?.order?.rewardDiscount ?? 0)
    .minus(orderData?.order?.discount ?? 0)
    .minus(crmIntegrationDiscount)
    .toNumber();

  return totalAmount;
};

/**
 * 保存POS订单状态（用于零金额订单）
 * @param {string} orderId - 订单ID
 * @param {string} userId - 用户ID
 * @param {string} checksum - 校验和
 * @returns {Promise}
 */
export const savePosStatus = async (orderId, userId, checksum) => {
  const str = `<app:printPaymentReceipt>false</app:printPaymentReceipt><app:merchantCopyOnly>false</app:merchantCopyOnly><app:paymentRecord><app:userId>${userId}</app:userId><app:orderId>${orderId}</app:orderId><app:type>CASH</app:type><app:amount>0</app:amount><app:paidAmount>0</app:paidAmount><app:multiplePayments>false</app:multiplePayments><app:changeAmount>0</app:changeAmount><app:tipAmount>0</app:tipAmount><app:checksum>${checksum}</app:checksum></app:paymentRecord>`;
  await savePaymentRecordType(str, userId, getCookie('sessionKey'));
};

/**
 * 处理零金额订单的提交逻辑
 * @param {Object} params - 参数对象
 * @param {Object} params.store - Redux store state
 * @param {Function} params.saveOrderResult - 保存订单结果的action
 * @param {string} params.userId - 用户ID
 * @param {string} params.checksum - 校验和
 * @param {string} params.kioskConfigUserId - Kiosk配置用户ID
 * @param {Function} params.onError - 错误回调函数
 * @param {Function} params.onPrintCall - 打印叫号单回调函数（可选）
 * @returns {Promise<Object|null>} 返回订单信息或null
 */
export const submitOrderForZeroAmount = async ({
  store,
  saveOrderResult,
  userId,
  checksum,
  kioskConfigUserId,
  onError,
  onPrintCall,
}) => {
  reduxStore.dispatch(setNeedCommit(true));
  // 从 Redux store 获取最新状态，确保包含更新后的 needCommit 值
  const latestStore = reduxStore.getState();
  let orderData = await generateSubmitOrderObj(latestStore);
  if (!orderData?.order?.orderItems?.length) {
    Toast.info(i18n.t('order-create-fail'), 1500);
    window.location.hash = '/';
    return null;
  }
  posFrontLog(
    `[0元菜方法]submitOrderForZeroAmount
    -----itemList: ${JSON.stringify(
      latestStore?.currentOrder?.itemList?.map((item) => ({
        name: item?.name,
        id: item?.oId || item?.id,
      }))
    )}
    -----selectedDiscount:
        ${latestStore?.crm?.selectedDiscount?.couponTemplate?.templateName} - ${latestStore?.crm?.selectedDiscount?.couponTemplate?.id}
    -----selectedFreeItem:
        ${latestStore?.crm?.selectedFreeItem?.[0]?.couponTemplate?.templateName} - ${latestStore?.crm?.selectedFreeItem?.[0]?.couponTemplate?.id}
    -----tempCampaign:
        ${latestStore?.crm?.tempCampaign?.[0]?.couponTemplate?.templateName} - ${latestStore?.crm?.tempCampaign?.[0]?.couponTemplate?.id}`
  );
  try {
    const res = await saveOrder(orderData);
    if (res?.data?.result?.successful) {
      const orderId = res.data.order.id;
      const orderNumber = res.data.order.orderNumber;
      const phoneNumber = res.data.order.customer?.phone?.[0]?.number;
      saveOrderResult(res.data.order);

      // 从 res.data.order 或 latestStore 中获取 userId 和 checksum
      const finalUserId =
        userId ||
        res.data.order?.userId ||
        latestStore?.currentOrder?.saveOrderResult?.userId;
      const finalChecksum =
        checksum ||
        res.data.order?.checksum ||
        latestStore?.currentOrder?.saveOrderResult?.checksum;

      // 当前订单锁流程
      const lockParm = {
        targetId: res.data.order?.id,
        kioskConfigUserId,
      };
      const onErrCb = (apiRes) => {
        if (onError) {
          onError(apiRes?.data?.msg || 'Lock Error');
        }
      };
      const lockData = await orderLockProcedure(lockParm, onErrCb);
      if (!lockData) return null;

      // 当totalAmount为0时，调用savePosStatus
      if (finalUserId && finalChecksum) {
        await savePosStatus(orderId, finalUserId, finalChecksum);
      }

      // 处理桌号状态
      const {
        currentOrder: { tableId },
      } = latestStore;
      if (tableId) {
        getChooseTableStatus(true);
      }

      // 发送到厨房
      const send2KitchenObj = {
        orderId,
        userAuth: {
          sessionKey: getCookie('sessionKey'),
        },
        resend: false,
      };
      try {
        const sendRes = await send2Kitchen(send2KitchenObj);
        if (!sendRes.data.result.successful && orderId) {
          sendError2MsgCenter(orderId, 'Send to kitchen failed');
        }
      } catch {
        if (orderId) {
          sendError2MsgCenter(orderId, 'Send to kitchen failed');
        }
      }

      // 打印叫号单逻辑（若堂吃且送餐到桌，且开启纸质号码牌）
      const { selfConfig, currentOrder } = latestStore;
      const { orderType, tabelServiceType } = currentOrder;
      const locatorType = selfConfig?.configList?.find(
        (config) => config.id === 28
      )?.value;

      if (
        orderType == 'DINE_IN' &&
        tabelServiceType == 'DINE_IN' &&
        locatorType === 0
      ) {
        // 需要打印叫号单，通过回调函数处理
        if (onPrintCall) {
          onPrintCall(orderId);
        } else if (
          !reduxStore.getState().currentOrder?.postPaymentActions
            ?.callTicketPrinted
        ) {
          // 如果没有提供回调，直接调用打印接口
          const printCallObj = {
            orderId,
            userAuth: {
              sessionKey: getCookie('sessionKey'),
            },
          };
          try {
            const printCallRes = await printCall(printCallObj);
            if (printCallRes.data.result.successful) {
              reduxStore.dispatch(
                markPostPaymentAction('callTicketPrinted')
              );
            } else {
              sendError2MsgCenter(orderId, 'printCall failed');
            }
          } catch {
            sendError2MsgCenter(orderId, 'printCall failed');
          }
        }
      }

      // 发消息给POS - 新订单语音播报
      sendNewOrderMessage(orderId, orderNumber, phoneNumber);

      return {
        orderId,
        orderNumber,
        phoneNumber,
      };
    } else {
      if (onError) {
        onError(res.data?.result?.failureReason);
      }
      return null;
    }
  } catch (err) {
    if (onError) {
      onError(err?.message);
    }
    return null;
  }
};

/**
 * 处理零金额订单流程
 * @param {Object} params - 参数对象
 * @param {Object} params.store - Redux store state
 * @param {Function} params.payByCash - 现金支付action
 * @param {Function} params.saveOrderResult - 保存订单结果的action
 * @param {string} params.userId - 用户ID
 * @param {string} params.checksum - 校验和
 * @param {string} params.kioskConfigUserId - Kiosk配置用户ID
 * @param {Function} params.onError - 错误回调函数
 * @param {Function} params.onPrintCall - 打印叫号单回调函数（可选）
 * @returns {Promise<Object|null>} 返回订单信息或null
 */
export const processZeroAmountOrder = async ({
  store,
  payByCash,
  saveOrderResult,
  userId,
  checksum,
  kioskConfigUserId,
  onError,
  onPrintCall,
}) => {
  const totalAmount = calculateTotalAmount(store);
  posFrontLog(
    `[0元菜方法]processZeroAmountOrder
    -----itemList: ${JSON.stringify(
      store?.currentOrder?.itemList?.map((item) => ({
        name: item?.name,
        id: item?.oId || item?.id,
      }))
    )}
    -----selectedDiscount:
        ${store?.crm?.selectedDiscount?.couponTemplate?.templateName} - ${store?.crm?.selectedDiscount?.couponTemplate?.id}
    -----selectedFreeItem:
        ${store?.crm?.selectedFreeItem?.[0]?.couponTemplate?.templateName} - ${store?.crm?.selectedFreeItem?.[0]?.couponTemplate?.id}
    -----tempCampaign:
        ${store?.crm?.tempCampaign?.[0]?.couponTemplate?.templateName} - ${store?.crm?.tempCampaign?.[0]?.couponTemplate?.id}
    ---- totalAmount: ${totalAmount}`
  );
  if (totalAmount === 0) {
    payByCash();
    await judgeSskeyIsActiveTime();
    // 从 store 中获取 userId 和 checksum（如果未提供）
    const finalUserId = userId || store?.currentOrder?.saveOrderResult?.userId;
    const finalChecksum =
      checksum || store?.currentOrder?.saveOrderResult?.checksum;
    const result = await submitOrderForZeroAmount({
      store,
      saveOrderResult,
      userId: finalUserId,
      checksum: finalChecksum,
      kioskConfigUserId,
      onError,
      onPrintCall,
    });
    return result;
  }

  return null;
};
