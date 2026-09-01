import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './paymentType.module.scss';
import Alert from '@material-ui/lab/Alert';
import IconCredit from '@/assets/images/icon-credit.png';
import IconCash from '@/assets/images/icon-cash.png';
import LoadingText from '@/component/loadingText';
import Loading from '@/component/loading';
import CallModal from '@/component/callModal';
import { changeSelectedDiscount, changeFreeItem } from '@/actions/crm_action';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import CardPayTipModal from '@/component/cardPayTipModal';
import CashPayConfirmModal from '@/component/cashPayConfirmModal';
import {
  payByCard,
  payByCash,
  payByGiftCard,
  clearPayType,
  appendPaymentTypeTrail,
  markPostPaymentAction,
  saveOrderResult,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setSelfConfig,
  setOrderStatus,
  savePaymentId,
  setCardPaidResult,
  setGiftCardPaymentInfo,
  clearECardState,
  fetchAvailableECards,
} from '@/actions';
import {
  saveOrder,
  printCall,
  send2Kitchen,
  posFrontLog,
  sendPayment,
} from '@/api';
import { sendError2MsgCenter, sendNewOrderMessage } from '@/api/apiUtil';
import { generateSubmitOrderObj, countAmount } from '@/api/submitOrderObj';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { promiseFinally } from '@/utils/promiseFinally';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import { normalizeTipProcedure } from '@/utils/tipProcedure';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
  judgeNeedPayOtherCharge,
} from '@/utils/busTools';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { resolveKioskPaymentTypes } from '@/utils/kioskPaymentTypes';
import { getChooseTableStatus } from '@/utils/chooseTable';
import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import { orderLock, orderLockProcedure, orderUnlock } from '@/utils/orderLock';
import {
  calculateTotalAmount as calculateTotalAmountUtil,
  processZeroAmountOrder as processZeroAmountOrderUtil,
  savePosStatus as savePosStatusUtil,
} from '@/utils/processZeroAmountOrder';
import qs from 'qs';
import GiftCardPayment from '@/component/GiftCardPayment';
import { setNeedCommit } from '@/actions/avocado';
import Toast from '@/component/toast';
import GIFT_CARD_PAYMENT from '@/assets/images/gift_Card_payment.png';
import COUNTER_ZH from '@/assets/images/counter-zh.png';
import COUNTER_EN from '@/assets/images/counter-en.png';
import cloneDeep from 'lodash/cloneDeep';
import getOrderDetail from '@/utils/getOrderDetail';
import { getGiftCardPaymentCardType } from '@/utils/giftCardMode';
import { getPaymentMethodVisibility } from '@/utils/paymentMethodVisibility';
import reduxStore from '@/reducers/store';

import Big from 'big.js';

class PaymentType extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      pageLoading: true,
      canPayByCard: null,
      canPayByCash: null,
      onlyHaveFreeItem: false,
      needPayForCharge: false,
      isHasSoldoutDish: false,
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      giftCardErrorApiMsg: '',
      giftCardErrorApiShow: false,
      isHasOrderCharge: false,
      callLoading: false,
      callLoadObj: {},
      saveOrderId: '',
      isShowCardMinModal: false,
      currentAmount: 0,
      totalAmount: 0,
      cardSubtotal: 0,
      cashSubtotal: 0,
      cashSave: 0,
      giftCardLoading: false,
      giftCardVisible: false,
      giftCardPaymentInfo: null,
      showGiftCardPartialPayInfo: false,
      giftCardFlowMode: 'initial', // 'initial' | 'partial_continue'
      giftCardPaidTotal: 0,
      giftCardPaymentHistory: [],
      giftCardQueryFromPartialPay: false,
      showCashPayConfirmModal: false,
    };
    this.timer = null;
    this.cashSubmitPending = false;
    this.giftCardTimer = null;
    this.soldoutErrorRedirectTimer = null;
  }

  // 重置礼品卡流程相关状态，避免返回首页或重新进入支付页时残留上一次数据
  resetGiftCardFlowState = () => {
    const { clearECardState } = this.props;
    clearTimeout(this.giftCardTimer);
    clearECardState();
    this.setState({
      giftCardLoading: false,
      giftCardVisible: false,
      giftCardPaymentInfo: null,
      showGiftCardPartialPayInfo: false,
      giftCardFlowMode: 'initial',
      giftCardPaidTotal: 0,
      giftCardPaymentHistory: [],
      giftCardQueryFromPartialPay: false,
      giftCardErrorApiMsg: '',
      giftCardErrorApiShow: false,
    });
  };

  backBtnHandler = () => {
    this.props.history.goBack();
  };

  handleSetCall = (status) => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: status,
        handlePrint: this.handlePrint,
        handleSkip: this.handleSkip,
      },
    });
  };

  // 处理打印叫号单
  handlePrint = () => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: 'ing',
      },
    });
    judgeSskeyIsActiveTime().then(() => this.handlePrintCall());
  };

  //跳过打印，跳转到订单完成页
  handleSkip = () => {
    this.setState(
      {
        callLoading: false,
        callLoadObj: {},
      },
      () => {
        this.props.history.push('/orderFinish');
      }
    );
  };

  //  打印叫号单
  handlePrintCall = async () => {
    let orderId = this.state.saveOrderId;
    if (
      reduxStore.getState().currentOrder?.postPaymentActions?.callTicketPrinted
    ) {
      this.handleSkip();
      return;
    }
    if (orderId) {
      const printCallObj = {
        orderId,
        userAuth: {
          sessionKey: getCookie('sessionKey'),
        },
      };
      try {
        const printCallRes = await printCall(printCallObj);
        if (printCallRes.data.result.successful) {
          this.props.markPostPaymentAction('callTicketPrinted');
          this.handleSkip();
        } else {
          this.handleSetCall('fail');
          sendError2MsgCenter(orderId, 'printCall failed');
        }
      } catch {
        this.handleSetCall('fail');
        sendError2MsgCenter(orderId, 'printCall failed');
      }
    }
  };

  // 修改pos中订单状态（只有积分兑换菜品，或支付金额为0，需要更改订单状态为已支付）/
  savePosStatus = async (orderId, userId, checksum) => {
    await savePosStatusUtil(orderId, userId, checksum);
  };

  // 计算总金额
  calculateTotalAmount = () => {
    return calculateTotalAmountUtil(this.props.store);
  };

  // 处理零金额订单流程
  processZeroAmountOrder = async () => {
    const {
      store,
      payByCash,
      saveOrderResult,
      currentOrder: {
        saveOrderResult: { userId, checksum },
        orderType,
        tabelServiceType,
      },
      selfConfig,
      userId: kioskConfigUserId,
    } = this.props;

    const result = await processZeroAmountOrderUtil({
      store,
      payByCash,
      saveOrderResult,
      userId,
      checksum,
      kioskConfigUserId,
      onError: (errMsg) => {
        this.setState({ loading: false });
        this.showApiModalTip(errMsg);
        this.jumpRrrorPage(errMsg);
      },
      onPrintCall: (orderId) => {
        // 处理打印叫号单逻辑
        this.setState(
          {
            saveOrderId: orderId,
          },
          () => {
            this.handlePrint();
          }
        );
      },
    });

    // 如果没有打印叫号单，直接跳转到订单完成页
    if (result) {
      const locatorType = selfConfig?.configList?.find(
        (config) => config.id === 28
      )?.value;
      if (!(
        orderType == 'DINE_IN' &&
        tabelServiceType == 'DINE_IN' &&
        locatorType === 0
      )) {
        this.handleSkip();
      }
    }
    this.setState({ loading: false });
  };

  /** Dual price：与 countCardCharge 共用 countAmount，保证展示与提单金额一致 */
  fetchDualPricePaymentTotals = () => {
    const { store, payByCash, payByCard } = this.props;
    return countAmount(store, payByCash, payByCard);
  };

  attachDualPriceToSubmitOrder = async (orderData) => {
    const { allSysConfig } = this.props;
    if (allSysConfig?.CREDIT_CHARGE_ENABLE !== 'true') return orderData;
    const { cashPaymentTotal, creditPaymentTotal } =
      await this.fetchDualPricePaymentTotals();
    return {
      ...orderData,
      order: { ...orderData.order, cashPaymentTotal, creditPaymentTotal },
    };
  };

  /**
   * 提交订单（现金支付流程）
   * 包含：saveOrder -> 锁单 -> savePosStatus（如需要）-> send2Kitchen -> 打印叫号单
   */
  submitOrder = async () => {
    const { store, saveOrderResult } = this.props;
    let orderData = generateSubmitOrderObj(store);
    orderData = await this.attachDualPriceToSubmitOrder(orderData);
    try {
      const res = await saveOrder(orderData);
      if (res.data.result.successful) {
        const orderId = res.data.order.id;
        const orderNumber = res.data.order.orderNumber;
        const phoneNumber = res.data.order.customer?.phone?.[0]?.number;
        saveOrderResult(res.data.order);
        const {
          currentOrder: {
            orderType,
            tabelServiceType,
            tableId,
            saveOrderResult: { userId, checksum },
          },
          selfConfig,
          userId: kioskConfigUserId,
        } = this.props;

        // 当前订单锁流程;
        const lockParm = {
          targetId: res.data.order?.id,
          kioskConfigUserId,
        };
        const onErrCb = (apiRes) => {
          const failureReason = apiRes?.data?.msg || 'Lock Error';
          this.cashSubmitPending = false;
          this.setState({ loading: false });
          this.showApiModalTip(failureReason);
          this.jumpRrrorPage(failureReason);
        };
        const lockData = await orderLockProcedure(lockParm, onErrCb);
        if (!lockData) return;

        if (this.state.onlyHaveFreeItem && !this.state.needPayForCharge) {
          // 只有积分兑换菜品，且不需要加收；  或支付金额为0，需要更改订单状态为已支付
          await this.savePosStatus(orderId, userId, checksum);
        }
        if (tableId) {
          getChooseTableStatus(true);
        }
        // 订单中只有积分兑换菜品，送厨的逻辑取信用卡全额支付的状态
        let arr = selfConfig?.configMap?.id_20 || [];
        // 判断是否现金支付送厨（id:20，0：卡全额支付、1：卡部分支付、2：现金支付）
        if (
          arr.includes(2) ||
          (this.state.onlyHaveFreeItem && arr.includes(0))
        ) {
          await this.handleSendKitchen(orderId);
        }
        this.setState({ loading: false });

        const locatorType = selfConfig?.configMap?.id_28;
        // 若堂吃（dinein）且送餐到桌， 且开启纸质号码牌，才打印号牌单
        if (
          orderType == 'DINE_IN' &&
          tabelServiceType == 'DINE_IN' &&
          locatorType === 0
        ) {
          this.setState(
            {
              saveOrderId: orderId,
            },
            () => {
              this.handlePrint();
            }
          );
        } else {
          this.handleSkip();
        }
        // 发消息给POS - 新订单语音播报
        this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
      } else {
        const failureReason = res.data?.result?.failureReason;
        this.cashSubmitPending = false;
        this.setState({ loading: false });
        this.showApiModalTip(failureReason);
        this.jumpRrrorPage(failureReason);
      }
    } catch (err) {
      const failureReason = err?.message || String(err);
      this.cashSubmitPending = false;
      this.setState({ loading: false });
      this.showApiModalTip(failureReason);
      this.jumpRrrorPage(failureReason);
    }
  };

  handleSendKitchen = async (orderId) => {
    const { currentOrder, markPostPaymentAction } = this.props;
    if (currentOrder?.postPaymentActions?.kitchenSent) {
      return;
    }
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
        posFrontLog(`${orderId} Send to kitchen failed`);
      } else {
        markPostPaymentAction('kitchenSent');
      }
    } catch {
      if (orderId) {
        sendError2MsgCenter(orderId, 'Send to kitchen failed');
        posFrontLog(`${orderId} Send to kitchen failed`);
      }
    }
  };

  sendNewOrderMessageOnce = async (orderId, orderNumber, phoneNumber) => {
    const { currentOrder, markPostPaymentAction } = this.props;
    if (
      currentOrder?.postPaymentActions?.newOrderMessageSent ||
      this.isSendingNewOrderMessage
    ) {
      return;
    }
    this.isSendingNewOrderMessage = true;
    try {
      const res = await sendNewOrderMessage(orderId, orderNumber, phoneNumber);
      if (res?.data?.result?.successful) {
        markPostPaymentAction('newOrderMessageSent');
      }
    } finally {
      this.isSendingNewOrderMessage = false;
    }
  };

  // 礼品卡存单
  handlePayByGiftCard = async (card) => {
    // 显示loading
    this.setState({ giftCardLoading: true });
    const {
      setNeedCommit,
      store,
      currentOrder,
      userId,
      setOrderStatus,
      payByGiftCard,
    } = this.props;
    setNeedCommit(true);
    setOrderStatus('in saving order');
    payByGiftCard();
    let orderData = generateSubmitOrderObj(store);
    // if (currentOrder.saveOrderResult.id) {
    //   orderData.order.id = currentOrder.saveOrderResult.id;
    // }
    try {
      const res = await saveOrder(orderData);
      if (res.data.result.successful) {
        if (currentOrder.tableId) {
          getChooseTableStatus(true);
        }
        let orderId = null;
        let checksum = null;
        let orderNumber = null;
        let phoneNumber = null;
        // 小费
        let tipAmount = parseFloat(currentOrder.tipAmount) || 0;
        // CRM集成 折扣类型时，需要手动减去折扣
        let crmIntegrationDiscount = 0;
        if (orderData?.order?.discountList) {
          const crmIntegrationDiscountList = JSON.parse(
            orderData.order.discountList
          );
          if (crmIntegrationDiscountList?.length > 0) {
            const discountInfo = crmIntegrationDiscountList[0];
            // 因为下面的totalAmount是用order.totalPrice为基准算价格，所以菜价已经减过优惠，所以需要用isItemDetailDiscount条件过滤
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
        // 总价格（菜价 + 总税 + 小费 + 整单加收charge + togo加收 - rewardDiscount - 促销订单折扣 - crm集成折扣）
        const totalAmount = Big(orderData?.order?.totalPrice)
          .plus(orderData?.order?.totalTax)
          .plus(tipAmount)
          // .plus(Big(orderData.order.chargeTotal).toFixed(2))
          .plus(orderData?.order?.togoTotal)
          .minus(orderData?.order?.rewardDiscount ?? 0)
          .minus(orderData?.order?.discount ?? 0)
          .minus(crmIntegrationDiscount)
          .toNumber();
        orderId = res.data.order.id;
        checksum = res.data.order.checksum;
        orderNumber = res.data.order.orderNumber;
        phoneNumber = res.data.order.customer?.phone?.[0]?.number;
        this.props.saveOrderResult(res.data.order);
        const { balance } = card;
        const isTotalPay = balance >= totalAmount;
        const paymentAmount = isTotalPay ? totalAmount : balance;
        let paymentObj = {
          fromProduct: 'KIOSK',
          paymentRecord: {
            orderId: orderId,
            type: 'GIFT_CARD',
            amount: paymentAmount,
            paidAmount: paymentAmount,
            cardType: getGiftCardPaymentCardType(card),
            cardNumber: card.cardNumber,
            checksum: checksum,
            multiplePayments: false,
          },
          printPaymentReceipt: false,
          merchantCopyOnly: false,
          userAuth: {
            sessionKey: getCookie('sessionKey'),
          },
        };
        // 当前订单锁流程;
        const lockParm = {
          targetId: res?.data?.order?.id || currentOrder?.saveOrderResult?.id,
          userId,
        };
        const onErrCb = (apiRes) => {
          this.showGiftCardApiModalTip(apiRes?.data?.msg || 'Lock Error');
        };
        const lockData = await orderLock(lockParm, onErrCb);
        if (!lockData) return;
        setOrderStatus('in payment');
        await this.giftCardPayment({
          paymentObj,
          orderId,
          orderNumber,
          phoneNumber,
          totalAmount,
        });
      }
    } catch (e) {
      console.error('礼品卡支付失败:', e);
      this.setState({ giftCardLoading: false });
    }
  };

  // 礼品卡支付
  giftCardPayment = async ({
    paymentObj,
    orderId,
    orderNumber,
    phoneNumber,
    totalAmount,
  }) => {
    const {
      t,
      selfConfig,
      currentOrder,
      userId,
      savePaymentId,
      setCardPaidResult,
      setGiftCardPaymentInfo,
    } = this.props;
    posFrontLog(
      `Kiosk Start SendPayment[PaymentType]
      cardNumber: ${paymentObj?.paymentRecord?.cardNumber}; 
      OrderId: ${orderId}; 
      orderNumber: ${orderNumber ?? ''}; 
      TotalAmount: ${paymentObj?.paymentRecord?.amount}`
    );
    promiseFinally(
      sendPayment(paymentObj)
        .then(async (resp) => {
          if (resp.data.result.successful) {
            posFrontLog(
              `Kiosk SendPayment Success[PaymentType]
            orderStatus: ${resp?.data?.orderStatus} ;
            PaymentId: ${resp.data.id} ;
            sendPayment: ${selfConfig?.configMap?.id_20} ;
            insufficientBalanceResponse-Balance: ${resp?.data?.insufficientBalanceResponse?.balance} ;`
            );
            savePaymentId(resp.data.id);
            // 发消息给POS - 新订单语音播报
            this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);

            // 本次支付金额
            const currentPaidAmount = paymentObj?.paymentRecord?.amount || 0;

            let arr = selfConfig?.configMap?.id_20 || [];
            if (resp.data.orderStatus === 'PAID') {
              if (arr.includes(0)) {
                await this.handleSendKitchen(orderId);
              }
              // 订单已全额支付，清空部分支付展示状态
              setCardPaidResult({});
              // 全额支付成功，清空礼品卡支付状态
              this.resetGiftCardFlowState();
            } else if (resp.data.orderStatus === 'PARTIALLY_PAID') {
              // 部分支付，更新累计支付状态
              const { giftCardPaidTotal, giftCardPaymentHistory } = this.state;
              const newPaidTotal = Big(giftCardPaidTotal)
                .plus(currentPaidAmount)
                .toNumber();
              const remainingAmount = Math.max(
                Big(totalAmount).minus(newPaidTotal).toNumber(),
                0
              );

              // 记录本次支付
              const newPaymentRecord = {
                cardNumber: paymentObj?.paymentRecord?.cardNumber,
                amount: currentPaidAmount,
                orderStatus: resp.data.orderStatus,
                paymentId: resp.data.id,
                paidAt: new Date().toISOString(),
              };

              // 部分支付，查询保存明细
              judgeSskeyIsActiveTime().then(() =>
                getOrderDetail({
                  orderId,
                  setCardPaidResult: this.props.setCardPaidResult,
                })
              );
              if (arr.includes(1)) {
                await this.handleSendKitchen(orderId);
              }

              const giftCardPaymentInfo = {
                paymentObj,
                paymentResultInfo: resp.data,
                totalAmount,
                paidTotal: newPaidTotal,
                remainingAmount,
              };

              setGiftCardPaymentInfo(giftCardPaymentInfo);
              this.setState({
                showGiftCardPartialPayInfo: true,
                giftCardPaidTotal: newPaidTotal,
                giftCardPaymentHistory: [
                  ...giftCardPaymentHistory,
                  newPaymentRecord,
                ],
                giftCardPaymentInfo,
              });
              return;
            }
            // 打印叫号单
            const { orderType, tabelServiceType } = currentOrder;
            const locatorType = selfConfig?.configMap?.id_28;
            if (
              orderType === 'DINE_IN' &&
              tabelServiceType === 'DINE_IN' &&
              locatorType === 0
            ) {
              this.setState(
                {
                  saveOrderId: orderId,
                },
                async () => {
                  await this.handlePrint();
                }
              );
              return;
            }
            this.handleSkip();
          } else {
            // 礼品卡不可用
            const { giftCardPaidTotal } = this.state;
            const remainingAmount = Math.max(
              Big(totalAmount).minus(giftCardPaidTotal).toNumber(),
              0
            );
            const giftCardPaymentInfo = {
              paymentObj,
              paymentResultInfo: resp.data,
              totalAmount,
              paidTotal: giftCardPaidTotal,
              remainingAmount,
              isGiftCardError: true,
            };

            setGiftCardPaymentInfo(giftCardPaymentInfo);
            this.setState({
              giftCardPaymentInfo,
              showGiftCardPartialPayInfo: true,
            });
          }
        })
        .catch((err) => {
          this.showGiftCardApiModalTip(t('gift-card-unusable'));
        }),
      async () => {
        // 订单解锁
        const lockParam = {
          targetId: orderId,
          userId,
        };
        const onErrCb = (apiRes) => {
          this.showGiftCardApiModalTip(apiRes?.data?.msg || 'Lock Error');
        };
        const lockData = await orderUnlock(lockParam, onErrCb);
        if (!lockData) return;
        this.setState({ giftCardLoading: false });
      }
    );
  };

  // 查询配置项、判断订单内是否含售罄菜
  judgeConfigToSoldout = (fn) => {
    judgeConfigToSoldoutUtil(fn, {
      setSelfConfig: this.props.setSelfConfig,
      setState: this.setState.bind(this),
      showApiModalTip: this.showApiModalTip,
      reorder: this.reorder,
      onError: (failureReason) => {
        this.setState(
          {
            loading: false,
          },
          () => {
            this.showApiModalTip(failureReason);
            clearTimeout(this.soldoutErrorRedirectTimer);
            this.soldoutErrorRedirectTimer = setTimeout(() => {
              this.props.history.push('/');
              clearTimeout(this.soldoutErrorRedirectTimer);
              this.soldoutErrorRedirectTimer = null;
            }, 3000);
          }
        );
      },
    });
  };

  /**
   * 跳转到错误页面
   */
  jumpRrrorPage = (failureReason = '') => {
    setTimeout(() => {
      posFrontLog(`Kiosk Payment Error: 【004】${failureReason}`);
      this.props.history.push({
        pathname: '/connectionError',
        search: qs.stringify({ pay: 1, code: '004' }),
        state: { failureReason },
      });
    }, 2000);
  };

  /**
   * 接口报错提示
   */
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  showGiftCardApiModalTip = (errMsg) => {
    this.setState({
      giftCardErrorApiMsg: errMsg,
      giftCardErrorApiShow: true,
    });
    clearTimeout(this.giftCardTimer);
    this.giftCardTimer = setTimeout(() => {
      this.setState({
        giftCardErrorApiMsg: '',
        giftCardErrorApiShow: false,
      });
    }, 2000);
  };

  /**
   * 取消订单加收弹框
   */
  handleCancel = () => {
    this.setState({ isHasOrderCharge: false });
  };

  handleOpenGiftCard = () => {
    if (
      this.state.giftCardLoading ||
      !this.ensureTipBeforePaymentMethodCompleted()
    ) {
      return;
    }
    // 先检查售罄，再打开礼品卡弹窗
    this.judgeConfigToSoldout(() => {
      this.setState({
        giftCardVisible: true,
      });
    });
  };

  // 使用其他礼品卡继续支付（partial pay 后）
  handlePayByOtherGiftCard = async () => {
    const { giftCardPaymentInfo } = this.state;
    const { fetchAvailableECards, ecardLastQuery } = this.props;

    this.setState({ giftCardLoading: true });

    // 获取已使用的卡号，排除它
    const usedCardNumber =
      giftCardPaymentInfo?.paymentObj?.paymentRecord?.cardNumber;

    // 基于上次查询条件重新拉取最新卡列表
    if (ecardLastQuery) {
      const result = await fetchAvailableECards(ecardLastQuery, {
        excludeCardNumber: usedCardNumber,
        preserveLastQuery: true,
      });
      this.setState({ giftCardLoading: false });
      if (result.success) {
        // 查询成功：离开 CardPartPayInfo，保留支付上下文
        // availableCards 由 fetchAvailableECards 已写入 Redux：
        //   有卡 → CardPaymentWrapper 渲染 CardList
        //   无卡 → CardPaymentWrapper 渲染 QueryGiftCard
        const hasCards = result.cards && result.cards.length > 0;
        this.setState({
          showGiftCardPartialPayInfo: false,
          giftCardFlowMode: 'partial_continue',
          giftCardQueryFromPartialPay: !hasCards,
        });
        if (!hasCards) {
          this.showGiftCardApiModalTip(this.props.t('no_available_gift_cards'));
        }
      } else {
        // 查询失败：保留当前 CardPartPayInfo，不切换视图
        this.showGiftCardApiModalTip(
          result.errorMsg || this.props.t('query_failed') || 'Query failed'
        );
      }
    } else {
      this.setState({ giftCardLoading: false });
      // 没有上次查询条件，无法刷新
      this.showGiftCardApiModalTip(
        this.props.t('query_failed') || 'Query failed'
      );
    }
  };

  // 从 QueryGiftCard 返回 CardPartPayInfo
  handleBackToCardPartPayInfo = () => {
    this.setState({
      showGiftCardPartialPayInfo: true,
      giftCardQueryFromPartialPay: false,
    });
  };

  // 礼品卡部分支付后，选择信用卡补款（跳转到 cardPayment 页面）
  handleContinuePayByCard = async () => {
    const { giftCardPaymentInfo } = this.state;
    const {
      appendPaymentTypeTrail,
      clearECardState,
      payByCard,
      store,
      currentOrder,
      allSysConfig,
      saveOrderResult,
    } = this.props;

    appendPaymentTypeTrail('CREDIT_CARD');
    payByCard();

    if (!giftCardPaymentInfo) {
      Toast.info('Payment context not found');
      return;
    }

    this.setState({ giftCardLoading: true });

    const orderId = giftCardPaymentInfo.paymentObj?.paymentRecord?.orderId;

    try {
      await judgeSskeyIsActiveTime();
      // 查订单信息
      const orderInfo = await getOrderDetail({
        orderId,
        setCardPaidResult: this.props.setCardPaidResult,
      });

      // 修改订单信息 比如
      let orderData = generateSubmitOrderObj(this.props.store);
      let cloneOrderData = cloneDeep(orderData);
      if (orderInfo.checksum && currentOrder.saveOrderResult.id) {
        const order = cloneOrderData.order;
        order.id = currentOrder.saveOrderResult.id;
        order.checksum = orderInfo.checksum;

        currentOrder.saveOrderResult.orderItems.forEach((o, idx) => {
          order.orderItems[idx]['id'] = o.id;
        });
      }
      const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
      if (isOpenDualPrice) {
        const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
          store,
          payByCash,
          payByCard
        );
        cloneOrderData = {
          ...cloneOrderData,
          order: {
            ...cloneOrderData.order,
            cashPaymentTotal,
            creditPaymentTotal,
          },
        };
      }

      const res = await saveOrder(cloneOrderData);

      saveOrderResult(res.data.order);

      clearECardState();
      this.setState({
        giftCardVisible: false,
        showGiftCardPartialPayInfo: false,
        giftCardQueryFromPartialPay: false,
        giftCardLoading: false,
      });

      this.props.history.push('/cardPayment');
    } catch (e) {
      console.error('信用卡补款跳转异常:', e);
      this.setState({ giftCardLoading: false });
      this.showGiftCardApiModalTip(e?.message || 'Error');
    }
  };

  // 礼品卡部分支付后，选择现金补款（前台补款分流，不发起新支付）
  handleContinuePayByCash = async () => {
    const { giftCardPaymentInfo } = this.state;
    const { currentOrder, selfConfig, appendPaymentTypeTrail, payByCash } =
      this.props;

    payByCash();
    appendPaymentTypeTrail('CASH');

    if (!giftCardPaymentInfo) {
      Toast.info('Payment context not found');
      return;
    }

    this.setState({ giftCardLoading: true });

    const orderId = giftCardPaymentInfo.paymentObj?.paymentRecord?.orderId;
    const orderNumber = currentOrder?.saveOrderResult?.orderNumber;
    const phoneNumber =
      currentOrder?.saveOrderResult?.customer?.phone?.[0]?.number;

    try {
      await judgeSskeyIsActiveTime();
      await getOrderDetail({
        orderId,
        setCardPaidResult: this.props.setCardPaidResult,
      });

      // 复用 submitOrder 后半段业务链路
      if (currentOrder?.tableId) {
        getChooseTableStatus(true);
      }

      let arr = selfConfig?.configMap?.id_20 || [];
      if (arr.includes(2)) {
        await this.handleSendKitchen(orderId);
      }

      this.setState({ giftCardLoading: false });

      const { orderType, tabelServiceType } = currentOrder;
      const locatorType = selfConfig?.configMap?.id_28;
      if (
        orderType === 'DINE_IN' &&
        tabelServiceType === 'DINE_IN' &&
        locatorType === 0
      ) {
        this.setState({ saveOrderId: orderId }, () => {
          this.handlePrint();
        });
      } else {
        this.handleSkip();
      }

      this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
    } catch (e) {
      console.error('现金补款流程异常:', e);
      this.setState({ giftCardLoading: false });
      this.showGiftCardApiModalTip(e?.message || 'Error');
    }
  };

  // 继续支付（partial pay 后选择其他卡）
  handleContinuePayByGiftCard = async (card) => {
    this.setState({ giftCardLoading: true });
    const { giftCardPaymentInfo, giftCardPaidTotal } = this.state;
    const { userId, setOrderStatus, currentOrder, payByGiftCard } = this.props;

    // 校验 partial pay 上下文
    if (!giftCardPaymentInfo) {
      Toast.info('Payment context not found');
      return;
    }

    const { paymentObj, totalAmount } = giftCardPaymentInfo;

    // 使用累计已支付金额计算剩余金额（关键！）
    const remainingAmount = Math.max(
      Big(totalAmount).minus(giftCardPaidTotal).toNumber(),
      0
    );

    if (remainingAmount <= 0) {
      this.showGiftCardApiModalTip('No remaining amount to pay');
      return;
    }

    payByGiftCard();

    // 从现有订单获取上下文
    const orderId = paymentObj?.paymentRecord?.orderId;
    const orderNumber = currentOrder?.saveOrderResult?.orderNumber;
    const phoneNumber =
      currentOrder?.saveOrderResult?.customer?.phone?.[0]?.number;

    // 计算本次支付金额
    const { balance } = card;
    const paymentAmount = Math.min(remainingAmount, balance);

    await judgeSskeyIsActiveTime();
    const latestOrderDetail = await getOrderDetail({
      orderId,
      setCardPaidResult: this.props.setCardPaidResult,
    });
    const checksum =
      latestOrderDetail?.checksum ||
      currentOrder?.saveOrderResult?.checksum ||
      paymentObj?.paymentRecord?.checksum;

    // 构建新的 paymentObj
    const newPaymentObj = {
      fromProduct: 'KIOSK',
      paymentRecord: {
        orderId: orderId,
        type: 'GIFT_CARD',
        amount: paymentAmount,
        paidAmount: paymentAmount,
        cardType: getGiftCardPaymentCardType(card),
        cardNumber: card.cardNumber,
        checksum: checksum,
        multiplePayments: false,
      },
      printPaymentReceipt: false,
      merchantCopyOnly: false,
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };

    try {
      // 锁单
      const lockParam = {
        targetId: orderId,
        userId,
      };
      const onErrCb = (apiRes) => {
        this.showGiftCardApiModalTip(apiRes?.data?.msg || 'Lock Error');
      };
      const lockData = await orderLock(lockParam, onErrCb);
      if (!lockData) return;

      setOrderStatus('in payment');

      // 调用支付
      await this.giftCardPayment({
        paymentObj: newPaymentObj,
        orderId,
        orderNumber,
        phoneNumber,
        totalAmount,
      });
    } catch (e) {
      console.error('继续礼品卡支付失败:', e);
      this.setState({ giftCardLoading: false });
    }
  };

  /**
   * 获取支付方式显示配置
   */
  getPaymentDisplayConfig = () => {
    const { t, allSysConfig, i18n } = this.props;
    const { canPayByCash, canPayByCard, canPayByEcard } = this.state;

    let cardText = t('credit_debit_card');
    let cashText = t('cash');
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    // DP模式只能是信用卡，文字需要精准
    if (isOpenDualPrice) {
      cardText = t('only_credit_debit_card');
      cashText = t('cash_payment');
    }

    const isChinese = i18n?.language?.includes('zh');
    const cashIconSrc = isOpenDualPrice
      ? IconCash
      : isChinese
        ? COUNTER_ZH
        : COUNTER_EN;

    return {
      cardText,
      cashText,
      cashIconSrc,
      ...getPaymentMethodVisibility({
        canPayByCard,
        canPayByCash,
        canPayByEcard,
      }),
    };
  };

  /**
   * 处理整单加收（信用卡支付）
   */
  handleWholeCharge = () => {
    // if (judgeCharge()) {
    //   this.setState({ isHasOrderCharge: true });
    // } else {
    this.handleChoosePayByCard();
    // }
  };

  /**
   * 获取支付步骤配置（id:24，0：先支付后小费，1：先小费后支付）
   */
  getPaymentStep = () => {
    const { selfConfig } = this.props;
    return normalizeTipProcedure(
      selfConfig?.configList?.find((each) => each.id === 24)?.value
    );
  };

  ensureTipBeforePaymentMethodCompleted = () => {
    if (this.getPaymentStep() !== 2) return true;
    if (
      this.props.currentOrder?.tipFlowState
        ?.completedBeforePaymentMethod
    ) {
      return true;
    }
    this.props.history.push('/tippingPanel', {
      nextStep: 'paymentType',
    });
    return false;
  };

  /**
   * 选择信用卡支付
   * 流程：判断小费配置 -> 判断售罄 -> 判断最低消费 -> 跳转支付页面
   */
  handleChoosePayByCard = async () => {
    if (!this.ensureTipBeforePaymentMethodCompleted()) return;
    this.setState({ isHasOrderCharge: false });
    this.props.payByCard();
    const { selfConfig } = this.props;

    // 判断是否开通小费（id:5）
    if (
      isTipEnabledForPaymentType(
        selfConfig,
        'CREDIT_CARD',
        this.props.systemConfig
      )
    ) {
      // 开通小费
      const tipProcedure = this.getPaymentStep();
      const tipCompletedBeforePaymentMethod =
        this.props.currentOrder?.tipFlowState
          ?.completedBeforePaymentMethod;
      if (
        tipProcedure === 1 ||
        (tipProcedure === 2 && tipCompletedBeforePaymentMethod)
      ) {
        // 是否满足信用卡支付
        this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
      } else {
        this.props.history.push('/tippingPanel',
          tipProcedure === 2 ? { nextStep: 'paymentType' } : undefined
        );
      }
    } else {
      // 未开通小费，再判断售罄情况，再判断是否符合刷卡最低消费
      this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
    }
  };

  /**
   * 判断是否满足刷卡最低消费金额
   */
  judgeFillCardMinAmout = () => {
    if (calcCardMinAmout()) {
      this.setState({
        isShowCardMinModal: true,
        currentAmount: calcCardMinAmout(),
      });
    } else {
      this.props.history.push('/cardPayment');
    }
  };

  /**
   * 刷卡不足最小金额后，返回并继续点单
   */
  handleContinueOrder = () => {
    this.setState({ isShowCardMinModal: false });
    this.reorder(true);
  };

  /**
   * 刷卡不足最小金额后，关闭弹框
   */
  handleCloseMin = () => {
    this.setState({ isShowCardMinModal: false });
  };

  /**
   * 是否展示柜台支付确认对话框（开通 DP 且配置开启）
   */
  shouldShowCashPayConfirmDialog = () => {
    const { allSysConfig, selfConfig } = this.props;
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    return isOpenDualPrice && selfConfig?.configMap?.id_68 === true;
  };

  handleCloseCashPayConfirmModal = () => {
    this.setState({ showCashPayConfirmModal: false });
  };

  /**
   * 点击现金支付方式（可能先弹出确认对话框）
   */
  handleCashPaymentClick = () => {
    if (this.state.loading || !this.ensureTipBeforePaymentMethodCompleted()) {
      return;
    }
    if (this.shouldShowCashPayConfirmDialog()) {
      this.setState({ showCashPayConfirmModal: true });
      return;
    }
    this.handleChoosePayByCash();
  };

  handleConfirmCashPayFromModal = () => {
    if (this.state.loading) return;
    this.setState({ showCashPayConfirmModal: false }, () => {
      this.handleChoosePayByCash();
    });
  };

  handleConfirmCardPayFromModal = () => {
    if (this.state.loading || !this.ensureTipBeforePaymentMethodCompleted()) {
      return;
    }
    this.setState({ showCashPayConfirmModal: false }, () => {
      this.handleWholeCharge();
    });
  };

  /**
   * 选择现金支付
   * 流程：判断售罄 -> judgeSskeyIsActiveTime -> submitOrder
   */
  handleChoosePayByCash = () => {
    if (
      this.cashSubmitPending ||
      this.state.loading ||
      !this.ensureTipBeforePaymentMethodCompleted()
    ) {
      return;
    }
    this.cashSubmitPending = true;
    this.props.payByCash();
    this.setState({ loading: true });
    this.judgeConfigToSoldout(() => {
      judgeSskeyIsActiveTime()
        .then(() => this.submitOrder())
        .catch(() => {
          this.cashSubmitPending = false;
          this.setState({ loading: false });
        });
    });
  };

  /**
   * 返回orderPage，重新点单
   */
  reorder = (immediateBack = false) => {
    this.cashSubmitPending = false;
    if (!immediateBack) {
      if (this?.state?.dishMap?.allSoldIds?.length) {
        this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
      }
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    this.props.setIsReorderFlag(true);
    setTimeout(() => {
      this.backBtnHandler();
    }, 0);
  };

  /**
   * 仍然下单（售罄菜品处理后的继续下单）
   */
  continueReorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    setTimeout(() => {
      const { paymentType } = this.props.currentOrder;
      if (paymentType == 'CASH') {
        // 选择现金支付
        this.cashSubmitPending = false;
        this.handleCashPaymentClick();
      } else if (paymentType == 'CREDIT_CARD') {
        // 选择银行卡支付
        this.handleChoosePayByCard();
      } else if (paymentType == 'GIFT_CARD') {
        // 选择礼品卡支付
        this.handleOpenGiftCard();
      }
    }, 0);
  };

  async componentDidMount() {
    const { systemConfig, isReorderFlag, selfConfig } = this.props;

    // 若从上一个页面返回，传来的重新下单状态为true，则继续返回
    if (isReorderFlag) {
      this.backBtnHandler();
      this.setState({ pageLoading: false });
      return;
    }

    if (resolveKioskPaymentTypes(selfConfig, systemConfig).length) {
      const paymentRouteResult = handlePaymentTypeRoute(
        systemConfig,
        selfConfig
      );
      const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
      const needPayForCharge = judgeNeedPayOtherCharge();

      // 使用全局方法计算总金额
      const totalAmount = calculateTotalAmountUtil(this.props.store);

      this.setState({
        canPayByCard: paymentRouteResult.canPayByCard,
        canPayByCash: paymentRouteResult.canPayByCash,
        canPayByEcard: paymentRouteResult.canPayByEcard,
        onlyHaveFreeItem,
        needPayForCharge,
        totalAmount,
      });

      // 若只仅开通现金支付或者(只有免费菜且没有其它加收项)，或者总价为0，自动提交订单
      if (
        paymentRouteResult.onlyCash ||
        (onlyHaveFreeItem && !needPayForCharge) ||
        totalAmount === 0
      ) {
        this.setState({ loading: true });

        // 如果总价为0，使用零金额订单处理流程
        if (totalAmount === 0) {
          await this.processZeroAmountOrder();
        } else {
          // 其他情况走正常提交流程
          this.props.payByCash();
          judgeSskeyIsActiveTime().then(() => this.submitOrder());
        }
        return;
      }
    }

    await this.countCardCharge();
    this.setState({ pageLoading: false });
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    clearTimeout(this.giftCardTimer);
    clearTimeout(this.soldoutErrorRedirectTimer);
  }

  /**
   * 计算信用卡和现金支付的金额差异（用于dual price）
   */
  countCardCharge = async () => {
    const { allSysConfig, clearPayType } = this.props;
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    if (isOpenDualPrice) {
      const { cashPaymentTotal, creditPaymentTotal } =
        await this.fetchDualPricePaymentTotals();
      const cashSave = Big(creditPaymentTotal)
        .minus(cashPaymentTotal)
        .toFixed(2);
      await this.setState({
        cashSave,
        cardSubtotal: creditPaymentTotal,
        cashSubtotal: cashPaymentTotal,
      });
    } else {
      await this.setState({
        cashSave: 0,
        cardSubtotal: 0,
        cashSubtotal: 0,
      });
    }
    await clearPayType();
  };

  render() {
    const { t, systemConfig, selfConfig } = this.props;
    const {
      isHasOrderCharge,
      loading,
      pageLoading,
      dishMap,
      isHasSoldoutDish,
      errorApiShow,
      errorApiMsg,
      giftCardLoading,
      giftCardErrorApiShow,
      giftCardErrorApiMsg,
      callLoading,
      callLoadObj,
      isShowCardMinModal,
      currentAmount,
      onlyHaveFreeItem,
      needPayForCharge,
      canPayByCash,
      canPayByCard,
      cashSave,
      cardSubtotal,
      cashSubtotal,
      giftCardVisible,
      canPayByEcard,
      giftCardPaymentInfo,
      showGiftCardPartialPayInfo,
      giftCardFlowMode,
      giftCardQueryFromPartialPay,
      showCashPayConfirmModal,
    } = this.state;

    const {
      cardText,
      cashText,
      cashIconSrc,
      showCard,
      showCash,
      showGiftCard,
      showNoPaymentMessage,
    } = this.getPaymentDisplayConfig();

    // const rewardShow = this.getRewardShowInfo();
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);

    return (
      <div
        className={styles.paymentTypePanelOuter}
        style={{
          visibility:
            this.props.isReorderFlag || paymentRouteResult.shouldSkipPaymentType
              ? 'hidden'
              : 'visible',
        }}
      >
        <div
          className={styles.paymentTypePanelInner}
          style={{
            visibility:
              (onlyHaveFreeItem && !needPayForCharge) ||
              paymentRouteResult.shouldSkipPaymentType
                ? 'hidden'
                : 'visible',
          }}
        >
          <div className={styles.paymentMethod}>{t('payment_type')}</div>
          <div className={styles.payTwoBox}>
            {/* 1：开通卡和现金，2：仅开通现金 */}
            {showCard ? (
              <div
                className={`${styles.paymentType} ${styles.creditPayment}`}
                onClick={this.handleWholeCharge}
              >
                <img
                  src={IconCredit}
                  className={`${styles.payImg} ${cashSave > 0 && styles.hasCharge}`}
                />
                <div className={styles.payInfo}>
                  <span className={`${styles.payText}`}>{cardText}</span>
                  {cashSave > 0 && (
                    <>
                      <div className={styles.subtotal}>
                        {t('subtotal')}: ${Big(cardSubtotal).toFixed(2)}
                      </div>
                      <div className={styles.saveAmount}>
                        {t('save_amount')}: ${Big(cashSave).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {showCash ? (
              <div
                className={`${styles.paymentType} ${styles.cashPayment}`}
                onClick={this.handleCashPaymentClick}
              >
                <img
                  src={cashIconSrc}
                  className={`${styles.payImg} ${cashSave > 0 && styles.hasCharge}`}
                />

                <div className={styles.payInfo}>
                  <span className={`${styles.payText}`}>{cashText}</span>
                  {cashSave > 0 && (
                    <>
                      <div className={styles.subtotal}>
                        {t('subtotal')}: ${Big(cashSubtotal).toFixed(2)}
                      </div>
                      <div className={styles.saveAmount}>
                        {t('save_amount')}: ${Big(cashSave).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {/* 礼品卡支付 */}
            {showGiftCard ? (
              <div
                className={`${styles.paymentType} ${styles.cashPayment}`}
                onClick={this.handleOpenGiftCard}
              >
                <img
                  src={GIFT_CARD_PAYMENT}
                  className={`${styles.payImg} ${cashSave > 0 && styles.hasCharge}`}
                />

                <div className={styles.payInfo}>
                  <span className={`${styles.payText}`}>{t('ecard')}</span>
                  {cashSave > 0 && (
                    <>
                      <div className={styles.subtotal}>
                        {t('subtotal')}: ${Big(cashSubtotal).toFixed(2)}
                      </div>
                      <div className={styles.saveAmount}>
                        {t('save_amount')}: ${Big(cashSave).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {showNoPaymentMessage ? (
            <div className={styles.noPaymentType}>{t('no_payment_method')}</div>
          ) : null}
        </div>

        {/* 礼品卡支付弹窗 */}
        <GiftCardPayment
          giftCardPaymentInfo={giftCardPaymentInfo}
          visible={giftCardVisible}
          showGiftCardPartialPayInfo={showGiftCardPartialPayInfo}
          giftCardFlowMode={giftCardFlowMode}
          giftCardQueryFromPartialPay={giftCardQueryFromPartialPay}
          onPayByCard={this.handleContinuePayByCard}
          onPayByCash={this.handleContinuePayByCash}
          onPayByOtherGiftCard={this.handlePayByOtherGiftCard}
          onContinuePayByGiftCard={this.handleContinuePayByGiftCard}
          onBackToPartialPay={this.handleBackToCardPartPayInfo}
          onClose={this.resetGiftCardFlowState}
          handleSelectGiftCard={this.handlePayByGiftCard}
          loading={giftCardLoading}
          errorApiShow={giftCardErrorApiShow}
          errorApiMsg={giftCardErrorApiMsg}
        />

        <Loading visible={pageLoading} />
        <LoadingText visible={loading} textKey={2} />

        {callLoading ? (
          <CallModal callLoading={callLoading} loadObj={callLoadObj} />
        ) : null}

        {isHasSoldoutDish ? (
          <SoldoutModal
            isHasSoldoutDish={isHasSoldoutDish}
            dishMap={dishMap}
            reorder={this.reorder}
            continueReorder={this.continueReorder}
          />
        ) : null}

        {/* 刷卡最低消费弹框 */}
        {isShowCardMinModal ? (
          <CardMinAmount
            isShowCardMinModal={isShowCardMinModal}
            currentAmount={currentAmount}
            handleContinueOrder={this.handleContinueOrder}
            handleCloseMin={this.handleCloseMin}
          />
        ) : null}

        {isHasOrderCharge ? (
          <CardPayTipModal
            isHasOrderCharge={isHasOrderCharge}
            handleCancel={this.handleCancel}
            handleConfirm={this.handleChoosePayByCard}
          />
        ) : null}

        <CashPayConfirmModal
          visible={showCashPayConfirmModal}
          onClose={this.handleCloseCashPayConfirmModal}
          onConfirmCash={this.handleConfirmCashPayFromModal}
          onConfirmCard={this.handleConfirmCardPayFromModal}
        />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    systemConfig: state.systemConfig,
    isReorderFlag: state.orderEdit.isReorderFlag,
    crm: state.crm,
    avocado: state.avocado,
    allSysConfig: state.allSysConfig,
    userId: state.sysCookie.kioskConfigUserId,
    ecardLastQuery: state.ecard?.lastQuery,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    payByCard,
    payByCash,
    payByGiftCard,
    appendPaymentTypeTrail,
    markPostPaymentAction,
    clearPayType,
    saveOrderResult,
    spliceOrderBySoldout,
    setIsReorderFlag,
    setSelfConfig,
    changeSelectedDiscount,
    changeFreeItem,
    setNeedCommit,
    setOrderStatus,
    savePaymentId,
    setCardPaidResult,
    setGiftCardPaymentInfo,
    clearECardState,
    fetchAvailableECards,
  })(withTranslation()(PaymentType))
);
