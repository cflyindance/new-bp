import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import {
  calculateTotalAmount,
  processZeroAmountOrder,
} from '@/utils/processZeroAmountOrder';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { judgeNeedPayOtherCharge } from '@/utils/busTools';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import { pushPaymentMethodEntry } from '@/utils/tipProcedure';

/**
 * 人数选择 / 购物车后续：按 SMS、姓名、支付等配置继续流转
 */
export async function runJudgeSMSAfterOperation({
  systemConfig,
  selfConfig,
  store,
  history,
  payByCard,
  payByCash,
  saveOrderResult,
  kioskConfigUserId,
  judgeConfigToSoldout,
  judgeFillCardMinAmout,
  setLoading,
  onError,
}) {
  const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
  const needPayForCharge = judgeNeedPayOtherCharge();

  if (systemConfig.KIOSK_SEND_MESSAGE?.booleanValue) {
    history.push('./phoneInput');
    return;
  }

  if (selfConfig?.configMap?.id_1) {
    history.push('./enterName');
    return;
  }

  const totalAmount = calculateTotalAmount(store);

  if ((onlyHaveFreeItem && !needPayForCharge) || totalAmount === 0) {
    if (totalAmount === 0) {
      setLoading?.(true);
      const result = await processZeroAmountOrder({
        store,
        payByCash,
        saveOrderResult,
        userId: null,
        checksum: null,
        kioskConfigUserId,
        onError: (errMsg) => {
          setLoading?.(false);
          onError?.(errMsg);
        },
      });
      setLoading?.(false);
      if (result) {
        history.push('/orderFinish');
      }
      return;
    }
    judgeConfigToSoldout(() => {
      history.push('/paymentType');
    });
    return;
  }

  judgeConfigToSoldout(() => {
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);

    if (paymentRouteResult.shouldSkipPaymentType) {
      if (paymentRouteResult.canPayByCard) {
        payByCard();
        if (
          isTipEnabledForPaymentType(
            selfConfig,
            'CREDIT_CARD',
            systemConfig
          )
        ) {
          const isPayFirst = selfConfig?.configList?.find(
            (each) => each.id === 24
          )?.value === 1;
          if (isPayFirst) {
            judgeConfigToSoldout(judgeFillCardMinAmout);
          } else {
            history.push('/tippingPanel');
          }
        } else {
          judgeConfigToSoldout(judgeFillCardMinAmout);
        }
      } else if (paymentRouteResult.canPayByCash) {
        history.push('/paymentType');
      }
    } else {
      pushPaymentMethodEntry(history, selfConfig, systemConfig);
    }
  });
}
