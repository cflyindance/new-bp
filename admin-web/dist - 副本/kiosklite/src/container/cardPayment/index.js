import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './cardPayment.module.scss';
import Alert from '@material-ui/lab/Alert';
import {
  saveOrder,
  sendPayment,
  send2Kitchen,
  printCall,
  posFrontLog,
} from '@/api';
import { XMLObjTree } from '@/utils/ObjectTree';
import { sendError2MsgCenter, sendNewOrderMessage } from '@/api/apiUtil';
import {
  getOrderInfoObj,
  generateSubmitOrderObj,
  countAmount,
} from '@/api/submitOrderObj';
import { checkAndHandlePromotionLimitError } from '@/utils/handlePromotionLimitError';
import { promiseFinally } from '@/utils/promiseFinally';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import qs from 'qs';
import { getTriposTransactionResultCode } from '@/utils/getTriposTransactionResultCode';
import { KNOWN_CONNECTION_ERROR_CODES } from '@/container/connectionError/errorCodeConfig';
import {
  beginPaymentAttempt,
  bindPaymentAttemptOrderId,
  finishPaymentAttempt,
} from '@/utils/paymentAttempt';
import {
  saveOrderResult,
  setOrderStatus,
  savePaymentId,
  setCardPaidResult,
  setTriposPayReady,
  setTriposPayFinish,
  payByCard,
  payByCash,
  markPostPaymentAction,
} from '@/actions';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { isGiftCardWithCreditCardOrder } from '@/utils/getCurrentPaymentType';
import CallModal from '@/component/callModal';
import { getChooseTableStatus } from '@/utils/chooseTable';
import paymentOperation from '@/assets/lottie/payment_operation.json';
import LottiePlayer from '@/component/LottiePlayer';
import TransactionTips from './components/TransactionTips';
import WARMING_RED from '@/assets/images/warming_red.png';
import { changeFreeItem, changeSelectedDiscount } from '@/actions/crm_action';
import { setNeedCommit } from '@/actions/avocado';
import Toast from '@/component/toast';
import getDeviceDirection from '@/utils/getDeviceDirection';
import { orderLock, orderUnlock } from '@/utils/orderLock';
import { TOGONAMELIST } from '@/constants/mockData';
import getOrderDetail from '@/utils/getOrderDetail';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import {
  isMobyCardInfoError,
  resolveMobyCardInfoFailureReason,
} from '@/utils/resolveMobyCardInfoError';
import {
  resetRuaPaymentProgress,
  setRuaPaymentActive,
} from '@/utils/ruaPaymentProgress';
import { resolveRuaPaymentProgressText } from '@/utils/resolveMobyCardInfoError';
import { EventBus } from '@/utils/EventBus';
import { RUA_PAYMENT_PROGRESS_EVENT } from '@/constants/ruaPaymentProgress';
import reduxStore from '@/reducers/store';

import Big from 'big.js';
const PAY_AGAIN = 'PAY_AGAIN';
const TRIPOSCOUNTDOWN = 10; // tripos ready超时倒计时秒数
const NONINGENICOCOUNTDOWN = 2; // pax设备倒计时秒数

class CardPayment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorApiMsg: '',
      errorApiShow: false,
      callLoading: false,
      callLoadObj: {},
      tipsLoading: true,
      loadingText: '',
      tipsType: '',
      countdown: TRIPOSCOUNTDOWN,
      showTriposCancelButton: false, // tripos ready超时展示的取消按钮
      nonIngenicoCountdown: NONINGENICOCOUNTDOWN,
      isCancellingPayment: false, // tripos 是否正在取消支付
      showWakingTips: false, // tripos ready后显示唤醒提示，2s后隐藏
      showRuaProgressTips: false, // rua 读卡进度中间态提示
      showNoCardWarning: false, // INGENICO下TransactionTips隐藏30s后若未检测到卡则显示
      orderId: null,
      isAmountDetailVisible: false,
      // 与 props.triposPayReady 同步，用于 getDerivedStateFromProps 检测 false→true
      _prevTriposPayReadyForTips: !!(
        props.sysCookie && props.sysCookie.triposPayReady
      ),
    };
    this.timer = null;
    this.countdownTimer = null; // tripos倒计时定时器
    this.nonIngenicoTimer = null; // pax设备倒计时定时器
    this.wakingTipsTimer = null; // tripos唤醒提示隐藏定时器
    this.noCardCheckTimer = null; // INGENICO下TransactionTips隐藏后30s检测未刷卡定时器
    this._paymentErrorHandled = false; // 同一笔支付仅记录/跳转一次错误页
  }

  /**
   * triposPayReady 从 false→true 时若只在 componentDidUpdate 里 setState，
   * 会先渲染一帧 isShowModal=false（TransactionTips 闪断）。在此与 props 同步阶段
   * 立刻打开 showWakingTips 并更新文案，保证弹窗连续、只换字。
   */
  static getDerivedStateFromProps(nextProps, prevState) {
    const ready = !!(nextProps.sysCookie && nextProps.sysCookie.triposPayReady);
    if (getCookie('serviceTarget') !== 'INGENICO') {
      if (ready === prevState._prevTriposPayReadyForTips) return null;
      return { _prevTriposPayReadyForTips: ready };
    }
    const wasReady = !!prevState._prevTriposPayReadyForTips;
    if (ready && !wasReady) {
      return {
        _prevTriposPayReadyForTips: true,
        loadingText: nextProps.t('payment_device_waking'),
        showTriposCancelButton: false,
        showWakingTips: true,
      };
    }
    if (ready !== wasReady) {
      return { _prevTriposPayReadyForTips: ready };
    }
    return null;
  }

  parseLicenseXml = (data) => {
    let findAppInstances = data;
    let start = findAppInstances?.indexOf('<soap:Body>');
    let end = findAppInstances?.indexOf('</soap:Body>');
    findAppInstances = findAppInstances?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let instanceList = objTree?.parseXML(findAppInstances);
    let r = instanceList?.fetchorderresponsetype?.order;
    return r;
  };

  isGiftCardPartialPayScenario = () => {
    const { currentOrder, cardPaidResult } = this.props;
    return !!(
      currentOrder?.saveOrderResult?.id &&
      currentOrder?.paymentTypeTrail?.includes('GIFT_CARD') &&
      cardPaidResult?.status === 'PARTIALLY_PAID'
    );
  };

  // 提交订单
  saveOrderHandler = async (orderData) => {
    const {
      currentOrder,
      allSysConfig,
      setOrderStatus,
      store,
      payByCash,
      payByCard,
    } = this.props;
    if (
      currentOrder.orderStatus == 'in payment' &&
      currentOrder.savePaymentId == ''
    ) {
      return new Promise((resolve, reject) => {
        resolve(PAY_AGAIN);
      });
    } else {
      setOrderStatus('in saving order');
      let newOrderData = { ...orderData };
      // pos是否开启dual price
      const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
      if (isOpenDualPrice) {
        const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
          store,
          payByCash,
          payByCard
        );

        newOrderData = {
          ...newOrderData,
          order: {
            ...newOrderData.order,
            cashPaymentTotal,
            creditPaymentTotal,
          },
        };
      }
      return saveOrder(newOrderData);
    }
  };

  // 支付完成后跳转逻辑
  afterPayment = () => {
    const { selfConfig, currentOrder } = this.props;

    // 查询是否跳过签名
    const isShowSign = selfConfig?.configList?.find(
      (each) => each.id === 23
    )?.value;

    // 礼品卡 + 信用卡补款成功后， 或者 购买礼品卡成功后，跳过 afterCreditCardPay，直接进入 orderFinish
    if (
      currentOrder?.paymentTypeTrail?.includes('GIFT_CARD') ||
      this.isBuyGiftCard()
    ) {
      this.props.history.push(isShowSign ? '/signature' : '/orderFinish');
      return;
    }

    // 先支付后小费 -> 跳小费+签名页
    const isPayFirst = selfConfig?.configList?.find(
      (each) => each.id === 24
    )?.value === 1;
    // 查询是否跳过小费
    const isShowTip = isTipEnabledForPaymentType(
      selfConfig,
      'CREDIT_CARD',
      this.props.systemConfig
    );
    if (isPayFirst) {
      // 后付小费时 不展示tip && 不展示sign
      if (!isShowSign && !isShowTip) {
        this.props.history.push('/orderFinish');
        return;
      }
      this.props.history.push('/afterCreditCardPay');
      return;
    }
    // 先小费后支付
    this.props.history.push(isShowSign ? '/signature' : '/orderFinish');
  };

  // 叫号单根据状态，显示弹框
  handleSetCall = (status) => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: status,
        handlePrint: this.handlePrint,
        handleSkip: this.afterPayment,
      },
    });
  };

  // 打印叫号单
  handlePrintCall = async (orderId) => {
    if (
      reduxStore.getState().currentOrder?.postPaymentActions?.callTicketPrinted
    ) {
      this.setState({ callLoading: false, callLoadObj: {} });
      this.afterPayment();
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
          this.setState({ callLoading: false, callLoadObj: {} });
          // 打印成功后判断跳转逻辑
          this.afterPayment();
        } else {
          this.handleSetCall('fail');
          sendError2MsgCenter(orderId, 'printCall failed');
          posFrontLog(`${orderId} printCall failed`);
        }
      } catch {
        this.handleSetCall('fail');
        sendError2MsgCenter(orderId, 'printCall failed');
        posFrontLog(`${orderId} printCall failed`);
      }
    } else {
      this.afterPayment();
    }
  };

  // 打印叫号单前置
  handlePrint = (orderId) => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: 'ing',
      },
    });
    judgeSskeyIsActiveTime().then(() => this.handlePrintCall(orderId));
  };

  // 提示错误信息、并且跳转ops页面（code 来自 sendPayment 等接口 resp.data?.result?.failureReasonCode，缺省 000）
  showErrorAndJump = (msg, code = '000', orderId) => {
    this.showApiModalTip(msg);
    this.jumpRrrorPage({ failureReason: msg, code, pay: 0, orderId });
  };

  /** failureReasonCode 不在已知列表时，调用壳子获取 Tripos 交易结果码 */
  jumpPaymentFailurePage = async ({
    failureReason,
    code,
    pay = 0,
    amount,
    orderId,
  }) => {
    const normalizedCode = String(code ?? '001').trim();
    let triposFailureCode = '';
    if (!KNOWN_CONNECTION_ERROR_CODES.has(normalizedCode)) {
      try {
        triposFailureCode = await getTriposTransactionResultCode(amount);
        if (triposFailureCode) {
          posFrontLog(`Tripos failure code: ${triposFailureCode}`);
        }
      } catch (err) {
        posFrontLog(`getTransactionResultCode error: ${err?.message || err}`);
      }
    }
    this.jumpRrrorPage({
      failureReason,
      code: normalizedCode,
      pay,
      triposFailureCode,
      orderId,
    });
  };

  /** INGENICO：根据设备 body（或缓存的 mobyDeviceInfo）校验后写入 SN 并支付；directExpress 为 true 时走 rua 支付 */
  payIngenicoWithDeviceBody = async (deviceBody, paymentCtx) => {
    const { t } = this.props;
    const { paymentObj, orderId, orderNumber, phoneNumber } = paymentCtx;
    const connected =
      deviceBody?.connected || deviceBody?.status?.connection?.state;
    const serialNumber =
      deviceBody?.serialNumber || deviceBody?.cardReader?.serialNumber;
    if (!connected || (serialNumber?.length ?? 0) < 1) {
      this.showErrorAndJump(
        t('card_reader_device_not_connected'),
        '003',
        orderId
      );
      return;
    }
    paymentObj.transactionDetail.serialNumber = serialNumber;

    if (deviceBody?.directExpress === true) {
      setRuaPaymentActive(true);
      resetRuaPaymentProgress();
      this.props.setTriposPayReady(false);
      this.props.setTriposPayFinish(false);
      try {
        if (typeof window.loadCreditCardInfoByIngenico !== 'function') {
          throw new Error('loadCreditCardInfoByIngenico 不可用');
        }
        const payAmount = String(
          paymentObj?.transactionDetail?.amount ??
            paymentObj?.paymentRecord?.amount
        );
        const mobyCardInfoResult =
          await window.loadCreditCardInfoByIngenico(payAmount);
        if (isMobyCardInfoError(mobyCardInfoResult)) {
          const failureReason = resolveMobyCardInfoFailureReason(
            mobyCardInfoResult,
            t
          );
          posFrontLog(
            `loadCreditCardInfoByIngenico失败: ${JSON.stringify(mobyCardInfoResult)}`
          );
          this.jumpRrrorPage({ code: '000', failureReason, pay: 0, orderId });
          return;
        }
        const mobyCardInfo = {
          Serial: serialNumber,
          EMVStartTransaction: mobyCardInfoResult?.body?.data,
        };
        paymentObj.transactionDetail.mobyCardInfo =
          JSON.stringify(mobyCardInfo);
      } catch (err) {
        posFrontLog(
          `获取mobyCardInfo(loadCreditCardInfoByIngenico)出错: ${
            err?.message || err
          }`
        );
        this.jumpRrrorPage({
          code: '000',
          failureReason: t('connect-error'),
          pay: 0,
          orderId,
        });
        return;
      } finally {
        setRuaPaymentActive(false);
      }
    }

    await this.fetchPayment({
      paymentObj,
      orderId,
      orderNumber,
      phoneNumber,
    });
  };

  /**
   * INGENICO：先 getIngenicoDeviceSNAndDeviceInfo，成功则按设备 body 支付；
   * directExpress 为 true 时走 rua 支付并附带 mobyCardInfo；
   * 失败则打日志并调用 loadPaymentInfo；仍然失败则以缓存的 mobyDeviceInfo
   */
  runIngenicoPaymentWithDeviceFetch = (paymentCtx, mobyDeviceInfoFallback) => {
    const tryIngenicoDeviceInfo = async () => {
      try {
        return await getIngenicoDeviceSNAndDeviceInfo();
      } catch (err) {
        posFrontLog(`获取设备信息getIngenicoDeviceSNAndDeviceInfo出错: ${err}`);
        if (typeof window.loadPaymentInfo === 'function') {
          try {
            return await window.loadPaymentInfo();
          } catch (err2) {
            posFrontLog(`获取设备信息loadPaymentInfo出错: ${err2.message}`);
            throw err2;
          }
        }
        throw err;
      }
    };
    tryIngenicoDeviceInfo()
      .then((info) => this.payIngenicoWithDeviceBody(info.body, paymentCtx))
      .catch(() =>
        this.payIngenicoWithDeviceBody(mobyDeviceInfoFallback, paymentCtx)
      );
  };

  // 调刷卡机等设备
  fetchPayment = async ({ paymentObj, orderId, orderNumber, phoneNumber }) => {
    const { selfConfig, currentOrder, userId } = this.props;
    this._paymentErrorHandled = false;
    posFrontLog(
      `Kiosk Start SendPayment[CardPayment]
      ServiceTarget: ${paymentObj?.transactionDetail?.serviceTarget}; 
      OrderId: ${orderId ?? ''}; 
      orderNumber: ${orderNumber ?? ''}; 
      TotalAmount: ${paymentObj?.paymentRecord?.amount}`
    );
    const paymentAmount =
      paymentObj?.paymentRecord?.amount ??
      paymentObj?.transactionDetail?.amount;
    promiseFinally(
      sendPayment(paymentObj)
        .then(async (resp) => {
          if (resp?.data?.result?.successful) {
            posFrontLog(
              `Kiosk SendPayment Success[CardPayment]
            orderStatus: ${resp?.data?.orderStatus} ; 
            PaymentId: ${resp?.data?.id} ; 
            sendPayment: ${selfConfig?.configMap?.id_20} ;
            insufficientBalanceResponse-Balance: ${resp?.data?.insufficientBalanceResponse?.balance} ;`
            );
            this.props.savePaymentId(resp.data.id);
            // 判断是否现金支付送厨（id:20，0：卡全额支付、1：卡部分支付、2：现金支付）
            let arr = selfConfig?.configMap?.id_20 || [];
            // 全部支付
            if (resp.data.orderStatus === 'PAID') {
              if (arr.includes(0)) {
                await this.handleSendKitchen(orderId);
              }
              // 解决重试，信用卡支付完成后仍保留部分支付状态
              this.props.setCardPaidResult({});
            } else if (resp.data.orderStatus === 'PARTIALLY_PAID') {
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
            }
            // 发消息给POS - 新订单语音播报
            this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);
            // 打印叫号单
            const { orderType, tabelServiceType } = currentOrder;
            const locatorType = selfConfig?.configMap?.id_28;
            if (
              orderType === 'DINE_IN' &&
              tabelServiceType === 'DINE_IN' &&
              locatorType === 0
            ) {
              await this.handlePrint(orderId);
              return;
            }
            // 不打印叫号单 && 刷卡机可用
            await this.afterPayment();
          } else {
            const failureReasonCode = resp.data?.result?.failureReasonCode;
            const failureReason =
              resp.data?.result?.failureReason ||
              'The payment interface returned an exception.';
            // 客户主动取消：接口返回 101023，或 UI 已触发取消但接口未带取消码
            if (
              failureReasonCode === 101023 ||
              this.state.isCancellingPayment
            ) {
              this.jumpRrrorPage({
                code: '002',
                failureReason:
                  failureReasonCode === 101023
                    ? (resp.data?.result?.failureReason ??
                      'Transaction cancelled')
                    : 'Transaction cancelled',
                pay: 0,
                orderId,
              });
            } else {
              // 除取消外的其他支付失败情况
              this.showApiModalTip(failureReason);
              await this.jumpPaymentFailurePage({
                failureReason,
                code: failureReasonCode ?? '001',
                pay: 0,
                amount: paymentAmount,
                orderId,
              });
            }
          }
        })
        .catch(async (err) => {
          if (this._paymentErrorHandled) return;
          if (
            err?.message?.type == 'cancel' ||
            this.state.isCancellingPayment
          ) {
            // 客户主动取消，提示toast，直跳支付失败页面
            const failureReason =
              err?.message?.type == 'cancel'
                ? err?.message || 'Transaction cancelled'
                : 'Transaction cancelled';
            if (err?.message?.type == 'cancel') {
              Toast.info(failureReason, 2000);
            }
            this.jumpRrrorPage({
              code: '002',
              failureReason,
              pay: 0,
              orderId,
            });
          } else {
            const failureReason = err?.message || 'Payment failed';
            this.showApiModalTip(failureReason);
            await this.jumpPaymentFailurePage({
              failureReason,
              code: '000',
              pay: 0,
              amount: paymentAmount,
              orderId,
            });
          }
        }),
      () => {
        // 订单解锁
        const lockParm = {
          targetId: orderId,
          userId,
        };
        const onErrCb = (apiRes) => {
          this.showErrorAndJump(
            apiRes?.data?.msg || 'Lock Error',
            '000',
            orderId
          );
        };
        const lockData = orderUnlock(lockParm, onErrCb);
        finishPaymentAttempt(orderId);
        if (!lockData) return;
      }
    );
  };

  // 礼品卡部分支付后，使用信用卡补款剩余金额
  handleGiftCardCreditCardPayment = async () => {
    const { currentOrder, userId } = this.props;

    if (this.state.orderId) return;

    const orderId = currentOrder.saveOrderResult.id;
    const orderNumber = currentOrder.saveOrderResult.orderNumber;
    const phoneNumber =
      currentOrder.saveOrderResult.customer?.phone?.[0]?.number;

    const orderDetail = await getOrderDetail({
      orderId,
      setCardPaidResult: this.props.setCardPaidResult,
    });
    const checksum =
      orderDetail?.checksum || currentOrder.saveOrderResult.checksum;
    const unpaidAmount = parseFloat(orderDetail?.unpaidInfo?.unpaid) || 0;
    let tipAmount = parseFloat(currentOrder.tipAmount);

    if (unpaidAmount <= 0) {
      this.afterPayment();
      return;
    }

    this.setState({ orderId });

    let paymentObj = {
      fromProduct: 'KIOSK',
      paymentRecord: {
        type: 'CREDIT_CARD',
        amount: unpaidAmount,
        paidAmount: unpaidAmount,
        cardType: 'UNKNOWN',
        orderId: orderId,
        checksum: checksum,
        multiplePayments: false,
        isOnlinePayment: true,
        tipAdded: true,
      },
      printPaymentReceipt: false,
      merchantCopyOnly: false,
      transactionDetail: {
        actionType: 'SALE',
        amount: unpaidAmount,
        serviceTarget: getCookie('serviceTarget') || 'PAX',
        forceDuplicate: true,
        tipAmount: tipAmount,
      },
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };

    const lockParm = { targetId: orderId, userId };
    const onErrCb = (apiRes) => {
      this.showErrorAndJump(apiRes?.data?.msg || 'Lock Error');
    };
    const lockData = await orderLock(lockParm, onErrCb);
    if (!lockData) return;

    this.props.setOrderStatus('in payment');

    if (getCookie('serviceTarget') === 'INGENICO') {
      const { sysCookie: { mobyDeviceInfo } = {} } = this.props;
      this.runIngenicoPaymentWithDeviceFetch(
        { paymentObj, orderId, orderNumber, phoneNumber },
        mobyDeviceInfo
      );
    } else {
      await this.fetchPayment({
        paymentObj,
        orderId,
        orderNumber,
        phoneNumber,
      });
    }
  };

  isBuyGiftCard = () => {
    const { cardPaidResult, currentOrder } = this.props;
    return (
      cardPaidResult.type === 'CLOUD_GIFT_CARD' ||
      currentOrder.saveOrderResult.type === 'CLOUD_GIFT_CARD'
    );
  };

  // 使用信用卡购买礼品卡
  handleBuyGiftCardViaCreditCard = async () => {
    const { userId, cardPaidResult, currentOrder } = this.props;

    if (this.state.orderId) return;

    const { ordernumber: orderNumber, id: orderId, checksum } = cardPaidResult;
    const { allSysConfig } = this.props;
    const { totalPrice, discount, creditPaymentTotal } =
      currentOrder.saveOrderResult;
    const isGiftCardDualPrice =
      allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' &&
      creditPaymentTotal != null &&
      creditPaymentTotal !== '';
    const unpaidAmount = isGiftCardDualPrice
      ? Number(creditPaymentTotal)
      : Big(totalPrice).minus(discount).toNumber();

    this.setState({ orderId });

    let paymentObj = {
      fromProduct: 'KIOSK',
      paymentRecord: {
        orderId,
        type: 'CREDIT_CARD',
        amount: unpaidAmount,
        paidAmount: unpaidAmount,
        multiplePayments: false,
        cardType: 'UNKNOWN',
        checksum,
      },
      printPaymentReceipt: false,
      merchantCopyOnly: false,
      transactionDetail: {
        actionType: 'SALE',
        amount: unpaidAmount,
        serviceTarget: getCookie('serviceTarget') || 'PAX',
        forceDuplicate: true,
      },
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };

    const lockParm = { targetId: orderId, userId };
    const onErrCb = (apiRes) => {
      this.showErrorAndJump(apiRes?.data?.msg || 'Lock Error');
    };
    const lockData = await orderLock(lockParm, onErrCb);
    if (!lockData) return;

    this.props.setOrderStatus('in payment');

    if (getCookie('serviceTarget') === 'INGENICO') {
      const { sysCookie: { mobyDeviceInfo } = {} } = this.props;
      this.runIngenicoPaymentWithDeviceFetch(
        { paymentObj, orderId, orderNumber },
        mobyDeviceInfo
      );
    } else {
      await this.fetchPayment({
        paymentObj,
        orderId,
        orderNumber,
      });
    }
  };

  // 保存订单，连接信用卡并支付
  handleSubmitCardPay = async () => {
    // 购买礼品卡业务流程
    if (this.isBuyGiftCard()) {
      await this.handleBuyGiftCardViaCreditCard();
      return;
    }

    // 礼品卡部分支付后的信用卡补款分支
    if (this.isGiftCardPartialPayScenario()) {
      await this.handleGiftCardCreditCardPayment();
      return;
    }

    const {
      setNeedCommit,
      sysCookie: { mobyDeviceInfo },
    } = this.props;
    // 避免重复创建订单
    if (this.state.orderId) return;
    if (!beginPaymentAttempt('creating-order')) return;
    // 信用卡支付需要needCommit为1
    // 开启一种支付模式时，不需要检查券是否可用
    setNeedCommit(true);
    // 提交订单
    let orderData;
    try {
      orderData = await generateSubmitOrderObj(this.props.store);
    } catch (err) {
      finishPaymentAttempt();
      this.showErrorAndJump(err?.message || 'Order Create Error', '004');
      return;
    }
    this.saveOrderHandler(orderData)
      .then(async (res) => {
        const { currentOrder } = this.props;
        if (res.data?.result?.successful) {
          if (currentOrder.tableId) {
            getChooseTableStatus(true);
          }
        }
        if (res == PAY_AGAIN || res.data.result.successful) {
          let orderId = null;
          let checksum = null;
          let orderNumber = null;
          let phoneNumber = null;
          // 小费
          let tipAmount = parseFloat(currentOrder.tipAmount);
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
            .plus(orderData?.order?.chargeTotal)
            .plus(orderData?.order?.togoTotal)
            .minus(orderData?.order?.rewardDiscount ?? 0)
            .minus(orderData?.order?.discount ?? 0)
            .minus(crmIntegrationDiscount)
            .toNumber();

          if (res == PAY_AGAIN) {
            orderId = currentOrder.saveOrderResult.id;
            checksum = currentOrder.saveOrderResult.checksum;
            orderNumber = currentOrder.saveOrderResult.orderNumber;
            phoneNumber =
              currentOrder.saveOrderResult.customer?.phone?.[0]?.number;
            this.setState({ orderId: currentOrder.saveOrderResult.id });
          } else {
            orderId = res.data.order.id;
            checksum = res.data.order.checksum;
            orderNumber = res.data.order.orderNumber;
            phoneNumber = res.data.order.customer?.phone?.[0]?.number;
            this.props.saveOrderResult(res.data.order);
            this.setState({ orderId: res.data.order.id });
          }
          bindPaymentAttemptOrderId(orderId);
          let paymentObj = {
            fromProduct: 'KIOSK',
            paymentRecord: {
              type: 'CREDIT_CARD',
              amount: totalAmount,
              paidAmount: totalAmount,
              cardType: 'UNKNOWN',
              orderId: orderId,
              checksum: checksum,
              multiplePayments: false,
              isOnlinePayment: true,
              tipAdded: true,
            },
            printPaymentReceipt: false,
            merchantCopyOnly: false,
            transactionDetail: {
              // actionType: 'SALE_KEYED',
              actionType: 'SALE',
              amount: totalAmount,
              serviceTarget: getCookie('serviceTarget') || 'PAX',
              forceDuplicate: true,
              tipAmount: tipAmount,
            },
            userAuth: {
              sessionKey: getCookie('sessionKey'),
            },
          };

          // 当前订单锁流程;
          const lockParm = {
            targetId:
              res?.data?.order?.id ||
              this.props?.currentOrder?.saveOrderResult?.id,
            userId: this.props?.userId,
          };
          const onErrCb = (apiRes) => {
            this.showErrorAndJump(apiRes?.data?.msg || 'Lock Error', '000');
          };
          const lockData = await orderLock(lockParm, onErrCb);
          if (!lockData) return;

          this.props.setOrderStatus('in payment');

          // tripos支付
          if (getCookie('serviceTarget') === 'INGENICO') {
            this.runIngenicoPaymentWithDeviceFetch(
              { paymentObj, orderId, orderNumber, phoneNumber },
              mobyDeviceInfo
            );
          } else {
            // pax刷卡机
            await this.fetchPayment({
              paymentObj,
              orderId,
              orderNumber,
              phoneNumber,
            });
          }
        } else {
          finishPaymentAttempt();
          // 检查是否是促销达到上限错误
          if (checkAndHandlePromotionLimitError(res, this.props.history)) {
            return;
          }
          this.showErrorAndJump(
            res.data?.result?.failureReason ||
              res.data?.result?.exception ||
              'Order Create Error',
            res.data?.result?.failureReasonCode ?? '004'
          );
        }
      })
      .catch((err) => {
        finishPaymentAttempt();
        this.showErrorAndJump(err?.message || 'Order Create Error', '004');
      });
  };

  // 送厨
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
      if (res?.data?.result?.successful !== false) {
        markPostPaymentAction('newOrderMessageSent');
      }
    } finally {
      this.isSendingNewOrderMessage = false;
    }
  };

  jumpRrrorPage = (payload) => {
    if (this._paymentErrorHandled) return;
    this._paymentErrorHandled = true;
    const resolved =
      typeof payload === 'string'
        ? {
            code: '000',
            failureReason: payload,
            pay: 0,
            triposFailureCode: '',
            orderId: this.state.orderId ?? '',
          }
        : {
            code: payload?.code ?? '000',
            failureReason: payload?.failureReason ?? '',
            pay: payload?.pay ?? 0,
            triposFailureCode: payload?.triposFailureCode ?? '',
            orderId: payload?.orderId ?? this.state.orderId ?? '',
          };
    const logTripos = resolved.triposFailureCode
      ? ` tripos=${resolved.triposFailureCode}`
      : '';
    finishPaymentAttempt(resolved.orderId || undefined);
    posFrontLog(
      `Kiosk Payment Error: 【${resolved.code}】${resolved.failureReason}${logTripos}`
    );
    setTimeout(() => {
      this.props.history.push({
        pathname: '/connectionError',
        search: qs.stringify({
          pay: resolved.pay,
          code: resolved.code,
          ...(resolved.orderId ? { orderId: resolved.orderId } : {}),
          ...(resolved.triposFailureCode
            ? { triposFailureCode: resolved.triposFailureCode }
            : {}),
        }),
        state: {
          failureReason: resolved.failureReason,
          orderSnapshot:
            String(this.props.currentOrder?.saveOrderResult?.id ?? '') ===
            String(resolved.orderId ?? '')
              ? this.props.currentOrder.saveOrderResult
              : undefined,
          ...(resolved.triposFailureCode
            ? { triposFailureCode: resolved.triposFailureCode }
            : {}),
        },
      });
    }, 2000);
  };

  // 接口报错提示
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

  // 格式化税的明细
  formatterTaxList = (obj) => {
    let list = [];
    for (let k in obj) {
      list.push(`${obj[k].taxName}: $${this.formatterFixed(obj[k].taxAmount)}`);
    }
    return list;
  };

  toggleAmountDetail = () => {
    this.setState((prevState) => ({
      isAmountDetailVisible: !prevState.isAmountDetailVisible,
    }));
  };

  // 显示保留2位小数
  formatterFixed = (money) => {
    return parseFloat(money).toFixed(2);
  };

  // tripos取消支付
  cancelTriposPayment = () => {
    this.setState({
      loadingText: this.props.t('payment_cancel_ing'),
      tipsType: 'payCancel',
      showTriposCancelButton: false,
      isCancellingPayment: true, // 设置正在取消支付状态
      showRuaProgressTips: false,
    });
    if (
      (window.isAndroidShell && window.isAndroidShell()) ||
      (window.isIosShell && window.isIosShell())
    ) {
      abortIngenicoTransaction()
        .then((info) => {
          this.jumpRrrorPage({
            code: '002',
            failureReason: 'Transaction cancelled',
            pay: 0,
          });
        })
        .catch((err) => {
          this.jumpRrrorPage({
            code: '002',
            failureReason: 'Transaction cancelled',
            pay: 0,
          });
        });
    }
  };

  // 开始倒计时
  startCountdown = () => {
    this.setState({
      countdown: TRIPOSCOUNTDOWN,
      showTriposCancelButton: false,
    });
    this.countdownTimer = setInterval(() => {
      this.setState((prevState) => {
        const newCountdown = prevState.countdown - 1;
        if (newCountdown <= 0) {
          clearInterval(this.countdownTimer);
          return { countdown: 0, showTriposCancelButton: true };
        }
        return { countdown: newCountdown };
      });
    }, 1000);
  };

  // 停止倒计时
  stopCountdown = () => {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  };

  // 开始pax设备倒计时
  startNonIngenicoCountdown = () => {
    this.setState({
      nonIngenicoCountdown: NONINGENICOCOUNTDOWN,
    });
    this.nonIngenicoTimer = setInterval(() => {
      this.setState((prevState) => {
        const newCountdown = prevState.nonIngenicoCountdown - 1;
        if (newCountdown <= 0) {
          clearInterval(this.nonIngenicoTimer);
          this.setState({ tipsLoading: false });
          return { nonIngenicoCountdown: 0 };
        }
        return { nonIngenicoCountdown: newCountdown };
      });
    }, 1000);
  };

  // 停止pax设备倒计时
  stopNonIngenicoCountdown = () => {
    if (this.nonIngenicoTimer) {
      clearInterval(this.nonIngenicoTimer);
      this.nonIngenicoTimer = null;
    }
  };

  componentDidMount() {
    this.setState({
      loadingText: this.props.t('payment_preparing'),
      tipsType: 'payPreparing',
    });
    // 如果是INGENICO设备，开始倒计时
    if (getCookie('serviceTarget') === 'INGENICO') {
      this.startCountdown();
    } else {
      // pax设备，开始2秒倒计时
      this.startNonIngenicoCountdown();
    }
    judgeSskeyIsActiveTime().then(() => this.handleSubmitCardPay());
    EventBus.on(RUA_PAYMENT_PROGRESS_EVENT, this.handleRuaPaymentProgress);
  }

  handleRuaPaymentProgress = ({ type, code, message }) => {
    const progressText = resolveRuaPaymentProgressText(
      type,
      code,
      message,
      this.props.t
    );
    if (!progressText) return;

    this.setState({
      loadingText: progressText,
      tipsType: 'payPreparing',
      showRuaProgressTips: true,
    });
  };

  componentDidUpdate(prevProps) {
    const {
      sysCookie: { triposPayFinish, triposPayReady },
    } = this.props;
    const {
      sysCookie: {
        triposPayFinish: prevTriposPayFinish,
        triposPayReady: prevTriposPayReady,
      },
    } = prevProps;

    // 当triposPayReady状态从false变为true时，切换loadingText为"卡机正在唤醒，请稍候",适配卡机和sdk状态变更异步，有3s左右延迟的问题
    if (
      getCookie('serviceTarget') === 'INGENICO' &&
      triposPayReady &&
      !prevTriposPayReady
    ) {
      // 立即停止倒计时
      this.stopCountdown();
      // loadingText / showWakingTips 已在 getDerivedStateFromProps 同步更新，避免弹窗闪断
      if (this.wakingTipsTimer) {
        clearTimeout(this.wakingTipsTimer);
        this.wakingTipsTimer = null;
      }
      // 1秒后隐藏TransactionTips，若为INGENICO则再启动30s检测：未检测到卡则显示提示
      this.wakingTipsTimer = setTimeout(() => {
        this.setState({
          showWakingTips: false,
        });
        this.wakingTipsTimer = null;
        if (getCookie('serviceTarget') === 'INGENICO') {
          this.noCardCheckTimer = setTimeout(() => {
            if (!this.props.sysCookie.triposPayFinish) {
              this.setState({ showNoCardWarning: true });
            }
            this.noCardCheckTimer = null;
          }, 30000);
        }
      }, 1000);
    }

    // 当triposPayFinish状态从false变为true时
    if (
      getCookie('serviceTarget') === 'INGENICO' &&
      triposPayFinish &&
      !prevTriposPayFinish
    ) {
      if (this.noCardCheckTimer) {
        clearTimeout(this.noCardCheckTimer);
        this.noCardCheckTimer = null;
      }
      this.setState({ showNoCardWarning: false, showRuaProgressTips: false });
      setTimeout(() => {
        this.setState({
          loadingText: this.props.t('payment_tripos_reading'),
          tipsType: 'payReading',
          showTriposCancelButton: false,
        });
      }, 0);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.wakingTipsTimer) {
      clearTimeout(this.wakingTipsTimer);
      this.wakingTipsTimer = null;
    }
    if (this.noCardCheckTimer) {
      clearTimeout(this.noCardCheckTimer);
      this.noCardCheckTimer = null;
    }
    this.stopCountdown();
    this.stopNonIngenicoCountdown();
    setRuaPaymentActive(false);
    EventBus.off(RUA_PAYMENT_PROGRESS_EVENT, this.handleRuaPaymentProgress);
    this.props.setTriposPayReady(false);
    this.props.setTriposPayFinish(false);
    this.setState({ orderId: null });
  }

  render() {
    const {
      t,
      selfConfig,
      togoList,
      currentOrder,
      store: {
        crm: { selectedFreeItem },
        promotion,
      },
      sysCookie: { triposPayFinish, triposPayReady },
      cardPaidResult,
      allSysConfig,
    } = this.props;

    // 用于购买礼品卡的价格相关计算
    const isBuyGiftCardOrder = this.isBuyGiftCard();
    const { totalPrice, discount, creditPaymentTotal } =
      currentOrder.saveOrderResult;

    const {
      errorApiShow,
      errorApiMsg,
      callLoading,
      callLoadObj,
      tipsLoading,
      loadingText,
      tipsType,
      showTriposCancelButton,
      isCancellingPayment,
      showWakingTips,
      showRuaProgressTips,
      showNoCardWarning,
      isAmountDetailVisible,
    } = this.state;
    // 金额明细

    const orderInfo = getOrderInfoObj(this.props.store);
    // 菜价
    let subTotal = orderInfo?.orderSubtotal;
    if (isBuyGiftCardOrder) {
      subTotal = totalPrice;
    }
    // 总税
    let totalTax = orderInfo?.orderTaxTotal;
    // 税的明细
    let taxInfoList = this.formatterTaxList(orderInfo?.orderTaxDetail);
    // 小费
    let tipAmount = currentOrder.tipAmount;
    // 整单加收
    let charge = orderInfo?.chargeTotal;
    // togo加收
    let togoTotal = orderInfo?.togoTotal;
    // 积分折扣, crm集成折扣
    const orderData = generateSubmitOrderObj(this.props.store)?.order;
    let rewardDiscount = orderData?.rewardDiscount || 0;
    if (orderData?.discountList) {
      const crmIntegrationDiscountList = JSON.parse(orderData.discountList);
      if (crmIntegrationDiscountList?.length > 0) {
        const discountInfo = crmIntegrationDiscountList[0];
        if (discountInfo.type === 'promotion') {
          rewardDiscount = discountInfo.amount;
        } else if (!discountInfo.isReward) {
          rewardDiscount = discountInfo.amount;
        }
      }
    }
    // 促销 - 订单折扣
    let orderDiscount = orderInfo?.orderDiscount;

    // 购买礼品卡折扣， 买100赠50的50， 买300省30的30, 放到orderDiscount中展示
    let buyGiftCardDiscount = 0;
    if (isBuyGiftCardOrder) {
      buyGiftCardDiscount = discount || 0;
      // 购买礼品卡不需要整单加收
      charge = 0;
    }
    // 使用礼品卡+信用卡组合支付， 信用卡补齐金额时 需要已支付金额展示
    let paid = 0;
    const isGiftCardAndCreditCardMixed = isGiftCardWithCreditCardOrder(
      currentOrder?.paymentTypeTrail || []
    );
    if (isGiftCardAndCreditCardMixed && currentOrder.saveOrderResult.id) {
      paid = cardPaidResult?.unpaidInfo?.paid;
    }

    // 总价：（菜 + 总税 + 加收(整单、togo) + 小费）
    const isBuyGiftCardDualPrice =
      isBuyGiftCardOrder &&
      allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' &&
      creditPaymentTotal != null &&
      creditPaymentTotal !== '';
    let totalAmount = isBuyGiftCardDualPrice
      ? Number(creditPaymentTotal).toFixed(2)
      : Big(subTotal)
          .plus(totalTax)
          .plus(charge)
          .plus(togoTotal)
          .plus(tipAmount)
          .minus(rewardDiscount)
          .minus(orderDiscount)
          .minus(buyGiftCardDiscount)
          .minus(paid || 0)
          .toFixed(2);

    // 菜量
    const count = [
      ...currentOrder.itemList,
      ...selectedFreeItem,
      ...(promotion?.buyGifts?.[0]?.items || []),
    ].reduce((total, item) => total + (item.quantity || 1), 0);

    const direction = getDeviceDirection();

    const displayTotalAmount = totalAmount;

    // this.isGiftCardPartialPayScenario()
    //   ? this.formatterFixed(cardPaidResult?.unpaidInfo?.unpaid || 0)
    //   :

    // 先支付后小费，不展示小费项
    const isPayFirst = selfConfig?.configList?.find(
      (each) => each.id === 24
    )?.value === 1;

    return (
      <div className={styles.cardPaymentPage}>
        <div className={styles.cardPaymentInfo}>
          <div className={styles.cardPaymentTips}>
            {getCookie('serviceTarget') === 'INGENICO' &&
              showNoCardWarning &&
              !triposPayFinish && (
                <div className={styles.noCardWarning}>
                  <img
                    src={WARMING_RED}
                    alt=""
                    className={styles.noCardWarningIcon}
                  />
                  <span>{t('payment_no_card_detected')}</span>
                </div>
              )}
            <div
              className={
                showNoCardWarning ? styles.cardPaymentTipsMain : undefined
              }
            >
              {t('payment_tips')}
            </div>
            {getCookie('serviceTarget') === 'INGENICO' &&
              !triposPayFinish &&
              direction !== 'vertical' && (
                <div
                  className={styles.triposCancelButton}
                  onClick={() => {
                    this.cancelTriposPayment();
                  }}
                >
                  {t('payment_cancel')}
                </div>
              )}
            {getCookie('serviceTarget') !== 'INGENICO' && (
              <div className={styles.cardPaymentSubTips}>
                {t('payment_tips2')}
              </div>
            )}
          </div>
          <div className={styles.cardPaymentInfoBox}>
            <div className={styles.swipeImageBx}>
              <LottiePlayer animationData={paymentOperation} />
            </div>
            <div className={styles.paymentDetail}>
              {isAmountDetailVisible && (
                <div className={styles.jineBox}>
                  <div className={styles.jine}>
                    <span>{t('subtotal')}</span>
                    <span>${this.formatterFixed(Big(subTotal))}</span>
                  </div>
                  {currentOrder.orderType == 'TO_GO' ||
                  currentOrder.orderType == 'PICK_UP'
                    ? togoList.map((item, idx) => {
                        if (item.select?.id) {
                          if (item.select.id == -1) {
                            return (
                              <div
                                key={item.id + '_' + idx}
                                className={styles.jine}
                              >
                                <span>{t([TOGONAMELIST[item.id]])}</span>
                                <span>{t('free')}</span>
                              </div>
                            );
                          } else {
                            return (
                              <div
                                key={item.id + '_' + idx}
                                className={styles.jine}
                              >
                                <span>{t([TOGONAMELIST[item.id]])}</span>
                                <span>
                                  $
                                  {this.formatterFixed(
                                    item.id !== 4
                                      ? item.select.rate
                                      : item.select.rate * count
                                  )}
                                </span>
                              </div>
                            );
                          }
                        }
                      })
                    : null}
                  {selfConfig?.charge?.length > 0 &&
                    charge > 0 &&
                    selfConfig.charge.map((item) => {
                      if (item.id === 1 && item.select?.id) {
                        return (
                          <div key={item.id} className={styles.jine}>
                            <span>{item.select.name}</span>
                            <span>${this.formatterFixed(charge)}</span>
                          </div>
                        );
                      }
                    })}
                  {!isPayFirst && (
                    <div className={styles.jine}>
                      <span>{t('Tips')}</span>
                      <span>${this.formatterFixed(tipAmount)}</span>
                    </div>
                  )}
                  <div className={styles.jine}>
                    <span>{t('taxTotal')}</span>
                    <span>${this.formatterFixed(totalTax)}</span>
                  </div>
                  {taxInfoList.length > 1 &&
                    taxInfoList.map((item, idx) => {
                      return (
                        <div
                          key={idx}
                          className={`${styles.jine} ${styles.taxInfo}`}
                        >
                          <span>{item.split(':')[0]}</span>
                          <span>{item.split(':')[1]}</span>
                        </div>
                      );
                    })}
                  {rewardDiscount > 0 && (
                    <div className={`${styles.jine} ${styles.discount}`}>
                      <span>{t('redeemDiscount')}</span>
                      <span>-${this.formatterFixed(rewardDiscount)}</span>
                    </div>
                  )}
                  {(orderDiscount > 0 || buyGiftCardDiscount > 0) && (
                    <div className={`${styles.jine} ${styles.discount}`}>
                      <span>{t('orderDis')}</span>
                      <span>
                        -$
                        {this.formatterFixed(
                          orderDiscount || buyGiftCardDiscount
                        )}
                      </span>
                    </div>
                  )}
                  {paid > 0 && (
                    <div className={`${styles.jine} ${styles.discount}`}>
                      <span>{t('paid')}</span>
                      <span>
                        -$
                        {this.formatterFixed(paid)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div
                className={styles.dividerArrow}
                onClick={this.toggleAmountDetail}
              >
                {isAmountDetailVisible ? (
                  <ArrowDropDownIcon className={styles.arrowUpIcon} />
                ) : (
                  <ArrowDropUpIcon className={styles.arrowUpIcon} />
                )}
              </div>
              <div className={styles.payBox}>
                <div className={styles.totalTitle}>{t('allTotal')}</div>
                <div className={styles.total}>${displayTotalAmount}</div>
              </div>
            </div>
          </div>

          {getCookie('serviceTarget') === 'INGENICO' &&
            !triposPayFinish &&
            direction === 'vertical' && (
              <div
                className={styles.triposCancelButton}
                onClick={() => {
                  this.cancelTriposPayment();
                }}
              >
                {t('payment_cancel')}
              </div>
            )}
        </div>
        {callLoading ? (
          <CallModal callLoading={callLoading} loadObj={callLoadObj} />
        ) : null}
        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        {/* tipsLoading ---[tripos]还不能刷卡时、刷过卡、正在取消;[pax]设备准备中（做了2秒的倒计时，假装准备过程） */}
        <TransactionTips
          isShowModal={
            (getCookie('serviceTarget') === 'INGENICO' &&
              (!triposPayReady ||
                triposPayFinish ||
                isCancellingPayment ||
                showWakingTips ||
                showRuaProgressTips)) ||
            (getCookie('serviceTarget') !== 'INGENICO' && tipsLoading)
          }
          tipsText={loadingText}
          tipsType={tipsType}
          showTriposCancelButton={showTriposCancelButton}
          onCancelPay={this.cancelTriposPayment}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    togoList: state.togoList,
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    systemConfig: state.systemConfig,
    crm: state.crm,
    avocado: state.avocado,
    allSysConfig: state.allSysConfig,
    sysCookie: state.sysCookie,
    userId: state.sysCookie.kioskConfigUserId,
    cardPaidResult: state.cardPaidResult,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    saveOrderResult,
    setOrderStatus,
    savePaymentId,
    setCardPaidResult,
    changeSelectedDiscount,
    changeFreeItem,
    setNeedCommit,
    setTriposPayReady,
    setTriposPayFinish,
    payByCard,
    payByCash,
    markPostPaymentAction,
  })(withTranslation()(CardPayment))
);
