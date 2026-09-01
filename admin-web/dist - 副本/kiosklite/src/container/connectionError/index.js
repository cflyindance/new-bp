import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './connectionError.module.scss';
import Alert from '@material-ui/lab/Alert';
import LoadingText from '@/component/loadingText';
import Loading from '@/component/loading';
import CallModal from '@/component/callModal';
import {
  saveOrderResult,
  payByCash,
  payByCard,
  setCardPaidResult,
  markPostPaymentAction,
  savePaymentId,
} from '@/actions';
import { sendError2MsgCenter, sendNewOrderMessage } from '@/api/apiUtil';
import { saveOrder, printCall, send2Kitchen } from '@/api';
import { getOrderInfo } from '@/api/apiPos';
import { generateSubmitOrderObj, countAmount } from '@/api/submitOrderObj';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { XMLObjTree } from '@/utils/ObjectTree';
import cloneDeep from 'lodash/cloneDeep';
import getOrderDetail from '@/utils/getOrderDetail';
import { orderLockProcedure } from '@/utils/orderLock';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { getChooseTableStatus } from '@/utils/chooseTable';
import WARMINGRED from '@/assets/images/warming_red.png';
import Toast from '@/component/toast';
import store from '@/reducers/store';
import { parseConnectionErrorRoute } from './connectionErrorRouteParams';
import { resolveConnectionErrorUi } from './errorCodeConfig';
import { removeGiftCard } from '@/api/eCard';
import { canCancelPosOrder } from '@/utils/paymentCountdown';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';

const TEXTKEY = 2; // loading 提示信息
class ConnectionError extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      errorApiMsg: '',
      errorApiShow: false,
      callLoading: false,
      callLoadObj: {},
      saveOrderId: '',
      textKey: TEXTKEY,
      showLoading: false, // 控制 Loading 组件的显示
    };
    this.timer = null;
    this.getOrderDetailPromise = null; // 保存 getOrderDetail 的 Promise，用于 handleCancelOrder 等待
    this.isSendingNewOrderMessage = false;
  }

  // 根据状态，显示弹框
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

  handlePrint = () => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: 'ing',
      },
    });
    judgeSskeyIsActiveTime().then(() => this.handlePrintCall());
  };

  handleSkip = () => {
    this.setState({
      callLoading: false,
      callLoadObj: {},
    });
    this.props.history.push('./orderFinish');
  };

  // 打印叫号单
  handlePrintCall = async () => {
    let orderId = this.state.saveOrderId;
    if (store.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
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

  parseLicenseXml = (data) => {
    let findAppInstances = data;
    let start = findAppInstances?.indexOf('<soap:Body>');
    let end = findAppInstances?.indexOf('</soap:Body>');
    findAppInstances = findAppInstances?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let instanceList = objTree.parseXML(findAppInstances);
    let r = instanceList?.fetchorderresponsetype?.order;
    return r;
  };

  // 请求订单信息接口，整理获取的数据
  handleGetOrderInfo = async (orderId) => {
    const res = await getOrderInfo(orderId);
    let r = res.data ? this.parseLicenseXml(res.data) || {} : {};
    return r;
  };

  getPaymentOrderId = () => {
    const { orderId } = parseConnectionErrorRoute(this.props.location);
    return orderId || store.getState().currentOrder?.saveOrderResult?.id;
  };

  getPaymentOrderSnapshot = (orderId) => {
    const currentSnapshot = store.getState().currentOrder?.saveOrderResult;
    if (String(currentSnapshot?.id ?? '') === String(orderId ?? '')) {
      return currentSnapshot;
    }
    const routeSnapshot = this.props.location?.state?.orderSnapshot;
    return String(routeSnapshot?.id ?? '') === String(orderId ?? '')
      ? routeSnapshot
      : null;
  };

  syncOrderChecksum = (orderDetail) => {
    if (orderDetail?.checksum) {
      const currentOrder = store.getState().currentOrder;
      if (
        String(currentOrder?.saveOrderResult?.id ?? '') ===
        String(orderDetail?.id ?? this.getPaymentOrderId() ?? '')
      ) {
        this.props.saveOrderResult({
          ...currentOrder.saveOrderResult,
          checksum: orderDetail.checksum,
        });
      }
    }
    return orderDetail;
  };

  // 提交订单
  submitOrder = async () => {
    const {
      allSysConfig,
      store: state,
      payByCash,
      payByCard,
      saveOrderResult,
    } = this.props;
    const orderData = await generateSubmitOrderObj(state);
    try {
      let cloneOrderData = cloneDeep(orderData);
      // 从 Redux store 获取最新的 currentOrder
      const currentOrder = store.getState().currentOrder;
      // 如果有checksum和orderId，说明卡支付提交成功订单，跟新当前订单
      if (
        currentOrder.saveOrderResult.checksum &&
        currentOrder.saveOrderResult.id
      ) {
        const order = cloneOrderData.order;
        order.id = currentOrder.saveOrderResult.id;
        order.checksum = currentOrder.saveOrderResult.checksum;

        currentOrder.saveOrderResult.orderItems.forEach((o, idx) => {
          order.orderItems[idx]['id'] = o.id;
        });
      }
      // pos是否开启dual price
      const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
      if (isOpenDualPrice) {
        const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
          state,
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
      if (res.data.result.successful) {
        // 如果没有checksum和orderId，说明提交订单没有成功过。这次是新增订单提交
        if (
          !(
            currentOrder.saveOrderResult.checksum &&
            currentOrder.saveOrderResult.id
          )
        ) {
          if (currentOrder.tableId) {
            getChooseTableStatus(true);
          }
        }

        const orderId = res.data.order.id;
        await saveOrderResult(res.data.order);
        const orderDetail = await getOrderDetail({
          orderId,
          setCardPaidResult: this.props.setCardPaidResult,
        });
        this.syncOrderChecksum(orderDetail);

        // 从 Redux store 获取最新的 currentOrder 和 selfConfig
        const latestState = store.getState();
        const { orderType, tabelServiceType } = latestState.currentOrder;
        const selfConfig = latestState.selfConfig;

        let arr = selfConfig?.configMap?.id_20 || [];
        // 判断是否现金支付送厨（id:20，0：卡全额支付、1：卡部分支付、2：现金支付）
        if (arr.includes(2)) {
          await this.handleSendKitchen(orderId);
        }
        const locatorType = selfConfig?.configMap?.id_28;
        // 若堂吃（dinein）且送餐到桌，且开启纸质号码牌，才打印号牌单
        if (
          orderType == 'DINE_IN' &&
          tabelServiceType == 'DINE_IN' &&
          locatorType === 0
        ) {
          this.setState({
            saveOrderId: res.data?.order?.id,
          });
          // 使用 setTimeout 延迟调用，避免在 setState 回调中触发另一个 setState
          setTimeout(() => {
            this.handlePrint();
          }, 0);
        } else {
          this.handleSkip();
        }
      } else {
        this.showApiModalTip(res.data?.result?.failureReason);
        this.setState({ loading: false, showLoading: false });
        return;
      }
    } catch (err) {
      this.showApiModalTip(err?.message);
      this.setState({ loading: false, showLoading: false });
      return;
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
      } else {
        markPostPaymentAction('kitchenSent');
      }
    } catch {
      if (orderId) {
        sendError2MsgCenter(orderId, 'Send to kitchen failed');
      }
    }
  };

  // 取消订单（查询当前订单是否是在pos上面支付成功（status: "PAID"））
  handleCancelOrder = () => {
    const entryOrder = store.getState().currentOrder;
    this.setState({ showLoading: true });
    judgeSskeyIsActiveTime()
      .then(async () => {
        // 等待 getOrderDetail 完成，确保数据是最新的
        if (this.getOrderDetailPromise) {
          try {
            await this.getOrderDetailPromise;
          } catch (error) {
            // 即使 getOrderDetail 失败，也继续执行取消订单流程
            console.error('getOrderDetail failed:', error);
          }
        }
        // 从 Redux store 获取最新的 currentOrder
        const { userId } = this.props;
        const currentOrder = store.getState().currentOrder;
        const paymentOrderId = this.getPaymentOrderId();
        const data = {
          targetId: paymentOrderId,
          userId,
        };
        // 跳转和关闭loading
        const goHome = (reason, extra = '') => {
          this.setState({ showLoading: false });
          this.props.history.push('/');
        };
        // 没有订单信息直接返回首页
        if (!data?.targetId) {
          goHome('noTargetId');
          return;
        }

        const onErrCb = (apiRes) => {
          this.setState({ showLoading: false });
          this.showApiModalTip(apiRes?.data?.msg || 'Lock Error');
        };
        const lockData = await orderLockProcedure(data, onErrCb);
        if (!lockData) {
          return;
        }

        let orderInfo = null;
        if (paymentOrderId) {
          orderInfo = await this.handleGetOrderInfo(paymentOrderId);
          this.syncOrderChecksum(orderInfo);
          const latestSaveOrderResult =
            this.getPaymentOrderSnapshot(paymentOrderId);
          // 只有ordered订单允许cancel
          if (canCancelPosOrder(orderInfo?.status) && latestSaveOrderResult) {
            const cancelOrderObj = {
              // 取消订单 需要清除之前参与的促销信息
              order: {
                ...latestSaveOrderResult,
                checksum:
                  orderInfo?.checksum || latestSaveOrderResult.checksum,
                needCommit: '2',
                discountList: '[]',
              },
            };
            cancelOrderObj.order.status = 'CANCELED';
            if (cancelOrderObj.order.type === 'CLOUD_GIFT_CARD') {
              const cancelOrder = cancelOrderObj.order;
              // 删除礼品卡订单, restful接口会报错，只能调用soap 接口
              const data = {
                checksum: cancelOrder.checksum,
                createTime: cancelOrder.createTime,
                orderId: cancelOrder.id,
                totalPrice: cancelOrder.totalPrice,
                discountRate: cancelOrder.discountRate,
                discountRateType: cancelOrder.discountRateType,
                discount: cancelOrder.discount,
                saleItemId: cancelOrder.orderItems?.[0].saleItemId,
                itemId: cancelOrder.orderItems?.[0].id,
                sessionKey: getCookie('sessionKey'),
              };
              // warn: 下面这个方法有很多参数都写死了 后续有问题可能要修改
              await removeGiftCard(data);
            } else {
              if (cancelOrderObj.order?.orderItems?.length) {
                cancelOrderObj.order.orderItems.map((item) => {
                  item.status = 'CANCELED';
                });
              }
              await saveOrder(cancelOrderObj);
            }
          } else {
          }
        }
        goHome('cancelFlowDone', `posOrderStatus=${orderInfo?.status || ''}`);
      })
      .catch((reason) => {
        console.log('reason', reason);
        this.setState({ showLoading: false });
      });
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

  // 支付超时但支付已成功：补跑 cardPayment 成功后的 post-payment 逻辑
  runPostPaymentForRecoveredPayment = async (orderId, paidOrderInfo) => {
    const { selfConfig, setCardPaidResult } = this.props;
    const currentOrder = store.getState().currentOrder;
    const kitchenConfig = selfConfig?.configMap?.id_20 || [];

    if (
      kitchenConfig.includes(0) &&
      this.needsPostPaymentRecovery(paidOrderInfo)
    ) {
      await this.handleSendKitchen(orderId);
    }
    setCardPaidResult({});

    const orderNumber =
      currentOrder.saveOrderResult?.orderNumber ?? paidOrderInfo?.ordernumber;
    const paidOrderPhone = paidOrderInfo?.customer?.phone;
    const phoneNumber =
      currentOrder.saveOrderResult?.customer?.phone?.[0]?.number ??
      (Array.isArray(paidOrderPhone)
        ? paidOrderPhone[0]?.number
        : paidOrderPhone?.number);
    await this.sendNewOrderMessageOnce(orderId, orderNumber, phoneNumber);

    const { orderType, tabelServiceType } = currentOrder;
    const locatorType = selfConfig?.configMap?.id_28;
    if (
      orderType === 'DINE_IN' &&
      tabelServiceType === 'DINE_IN' &&
      locatorType === 0
    ) {
      this.setState({ saveOrderId: orderId });
      await judgeSskeyIsActiveTime();
      await this.handlePostPaymentPrint(orderId);
      return;
    }
    this.afterPayment();
  };

  handlePostPaymentPrint = async (orderId) => {
    if (store.getState().currentOrder?.postPaymentActions?.callTicketPrinted) {
      this.setState({ callLoading: false, callLoadObj: {} });
      this.afterPayment();
      return;
    }
    this.setState({
      callLoading: true,
      callLoadObj: { msgDone: 'ing' },
    });
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
        this.afterPayment();
      } else {
        this.handleSetCallForAfterPayment('fail', orderId);
        sendError2MsgCenter(orderId, 'printCall failed');
      }
    } catch {
      this.handleSetCallForAfterPayment('fail', orderId);
      sendError2MsgCenter(orderId, 'printCall failed');
    }
  };

  handleSetCallForAfterPayment = (status, orderId) => {
    this.setState({
      callLoading: true,
      callLoadObj: {
        msgDone: status,
        handlePrint: () => this.handlePostPaymentPrint(orderId),
        handleSkip: this.afterPayment,
      },
    });
  };

  // 支付完成后跳转逻辑
  afterPayment = () => {
    const { selfConfig } = this.props;
    // 先支付后小费 -> 跳小费+签名页
    const isPayFirst = selfConfig?.configList?.find(
      (each) => each.id === 24
    )?.value === 1;
    // 查询是否跳过签名
    const isShowSign = selfConfig?.configList?.find(
      (each) => each.id === 23
    )?.value;
    // 查询是否跳过小费
    const isShowTip = isTipEnabledForPaymentType(
      selfConfig,
      'CREDIT_CARD',
      this.props.systemConfig
    );
    if (isPayFirst) {
      // 后付小费时 不展示tip && 不展示sign
      if (!isShowSign && !isShowTip) {
        this.handleSkip();
        return;
      }
      this.props.history.push('/afterCreditCardPay');
      return;
    }
    // 先小费后支付
    isShowSign ? this.props.history.push('/signature') : this.handleSkip();
  };

  // 查询订单是否已支付成功，已支付时返回 orderInfo
  ifHadFinishePayment = async (orderId) => {
    this.setState({ loading: true });
    // 延迟1.5秒执行查状态，尽可能给他机会获取到的是最新数据
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const orderInfo = await this.handleGetOrderInfo(orderId);
    this.setState({ loading: false });
    if (orderInfo?.status === 'PAID') {
      return orderInfo;
    }
    return null;
  };

  needsPostPaymentRecovery = (orderInfo) => {
    const sendToKitchenCount = orderInfo?.sendtokitchencount;
    return sendToKitchenCount === 0 || sendToKitchenCount === '0';
  };

  // 重试
  handleTryAgain = async () => {
    this.setState({ showLoading: true });
    try {
      const { userId } = this.props;
      // 从 Redux store 获取最新的 currentOrder
      const currentOrder = store.getState().currentOrder;
      const paymentOrderId = this.getPaymentOrderId();
      if (paymentOrderId) {
        const orderId = paymentOrderId;
        const paidOrderInfo = await this.ifHadFinishePayment(orderId);
        if (paidOrderInfo) {
          const payments = paidOrderInfo?.payments;
          const paymentId = Array.isArray(payments)
            ? payments[0]?.id
            : payments?.id;
          if (paymentId) {
            this.props.savePaymentId(paymentId);
          }
          await this.runPostPaymentForRecoveredPayment(orderId, paidOrderInfo);
          this.setState({ showLoading: false });
          return;
        }
        const data = {
          targetId: orderId,
          userId,
        };

        const onErrCb = (apiRes) => {
          this.setState({ loading: false, showLoading: false });
          this.showApiModalTip(apiRes.data?.msg || 'Lock Error');
        };
        const lockData = await orderLockProcedure(data, onErrCb);
        if (!lockData) {
          this.setState({ showLoading: false });
          return;
        }

        const { pay } = parseConnectionErrorRoute(this.props.location);
        if (pay === '0' || pay === 0) {
          // 卡支付，返回cardPayment
          await this.props.payByCard();
          this.setState({ showLoading: false });
          this.props.history.push('./cardPayment');
        } else if (pay === '1' || pay === 1) {
          // 现金支付
          await this.props.payByCash();
          judgeSskeyIsActiveTime().then(() => this.submitOrder());
        } else {
          Toast.info('Invalid order, Please order again ', 1500);
          this.props.history.push('/');
        }
      } else {
        Toast.info('Invalid order, Please order again ', 1500);
        this.props.history.push('/');
      }
    } catch (error) {
      this.setState({ showLoading: false });
    }
  };

  // 现金支付
  handlePayByCash = async () => {
    this.setState({ showLoading: true });
    try {
      const { userId } = this.props;
      // 从 Redux store 获取最新的 currentOrder
      const currentOrder = store.getState().currentOrder;
      if (currentOrder?.saveOrderResult?.id) {
        const orderId = currentOrder.saveOrderResult.id;
        if (await this.ifHadFinishePayment(orderId)) {
          this.afterPayment();
          this.setState({ showLoading: false });
          return;
        }
        const data = {
          targetId: orderId,
          userId,
        };
        const onErrCb = (apiRes) => {
          this.setState({ loading: false, showLoading: false });
          this.showApiModalTip(apiRes.data.msg || 'Lock Error');
        };
        const lockData = await orderLockProcedure(data, onErrCb);
        if (!lockData) {
          this.setState({ showLoading: false });
          return;
        }
        await this.props.payByCash();
        await this.submitOrder();
      } else {
        Toast.info('Invalid order, Please order again ', 1500);
        this.props.history.push('/');
      }
    } catch (error) {
      this.setState({ showLoading: false });
      this.showApiModalTip(error?.message);
    }
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

  componentDidMount() {
    const paymentOrderId = this.getPaymentOrderId();
    if (paymentOrderId) {
      // 保存 getOrderDetail 的 Promise，以便 handleCancelOrder 可以等待它完成
      this.getOrderDetailPromise = getOrderDetail({
        orderId: paymentOrderId,
        setCardPaidResult: this.props.setCardPaidResult,
      }).then((orderDetail) => this.syncOrderChecksum(orderDetail));
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  isBuyGiftCardOrder = () => {
    const { currentOrder, cardPaidResult } = this.props;
    return (
      currentOrder?.saveOrderResult?.type === 'CLOUD_GIFT_CARD' ||
      cardPaidResult?.type === 'CLOUD_GIFT_CARD'
    );
  };

  render() {
    let { t, systemConfig, currentOrder, selfConfig } = this.props;
    const {
      loading,
      errorApiShow,
      errorApiMsg,
      callLoading,
      callLoadObj,
      textKey,
      showLoading,
    } = this.state;
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
    // 支付方式是信用卡，且开通了现金支付
    const isGiftCardCreditCardPay =
      currentOrder.paymentTypeTrail?.includes('GIFT_CARD') &&
      currentOrder.paymentTypeTrail?.includes('CREDIT_CARD');
    const isShowPayCash =
      (currentOrder.paymentType == 'CREDIT_CARD' &&
        paymentRouteResult.canPayByCash &&
        !this.isBuyGiftCardOrder()) ||
      isGiftCardCreditCardPay;

    const { code, failureReason, triposFailureCode, triposCardInputMode } =
      parseConnectionErrorRoute(this.props.location);
    const errUi = resolveConnectionErrorUi(
      code,
      failureReason,
      t,
      triposFailureCode,
      triposCardInputMode
    );
    const showPayCashButton = isShowPayCash || errUi.forceShowPayCash;

    return (
      <div className={styles.cardPaymentFailurePage}>
        <img src={WARMINGRED} className={styles.failureImg} alt="" />
        <div className={styles.ops}>{errUi.opsText}</div>
        <div className={styles.failureDescription}>
          {errUi.mainText}
          {errUi.showSub ? (
            <>
              <div className={styles.breakLine}></div>
              {errUi.subText}
            </>
          ) : null}
        </div>

        <div className={styles.btnBoxs}>
          <div
            className={`${styles.topBtn} ${!errUi.showTryAgain ? styles.topBtnSingle : ''}`}
          >
            <div
              className={styles.failureActionBtn}
              onClick={this.handleCancelOrder}
            >
              {t('cancel_order')}
            </div>
            {errUi.showTryAgain ? (
              <div className={styles.tryAgainBtn} onClick={this.handleTryAgain}>
                {errUi.tryAgainText}
              </div>
            ) : null}
          </div>

          <div
            className={`${styles.bottomBtn} animate-btn`}
            onClick={this.handlePayByCash}
            style={{ display: showPayCashButton ? 'block' : 'none' }}
          >
            {t('payment-at-counter')}
          </div>
        </div>

        <LoadingText visible={loading} textKey={textKey} />
        <Loading visible={showLoading} />

        {callLoading ? (
          <CallModal callLoading={callLoading} loadObj={callLoadObj} />
        ) : null}

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
    currentOrder: state.currentOrder,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    userId: state.sysCookie.kioskConfigUserId,
    allSysConfig: state.allSysConfig,
    cardPaidResult: state.cardPaidResult,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    saveOrderResult,
    payByCard,
    payByCash,
    setCardPaidResult,
    markPostPaymentAction,
    savePaymentId,
  })(withTranslation()(ConnectionError))
);
