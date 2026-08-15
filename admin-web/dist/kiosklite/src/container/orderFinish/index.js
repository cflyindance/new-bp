import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Trans, withTranslation } from 'react-i18next';
import styles from './orderFinish.module.scss';
import Alert from '@material-ui/lab/Alert';
import Icon from '@/component/icon';
import Dialog from '@/component/dialog';
import ReceiptModal from '@/component/receiptModal';
import Toast from '@/component/toast';
import {
  clearPaymentTypeTrail,
  clearPostPaymentActions,
  payByCard,
  payByCash,
  resetCurrentOrder,
  setCardPaidResult,
  setGiftCardPaymentInfo,
} from '@/actions';
import {
  getCookie,
  judgeSskeyIsActiveTime,
} from '@/utils';
import {
  printUnpaidReceiptHandler,
  sendError2MsgCenter,
  sendMsgReceiptHandler,
} from '@/api/apiUtil';
import { printECardInfo, searchECardCards } from '@/api/eCard';
import { getOrderInfo } from '@/api/apiPos';
import { judgeNeedPayOtherCharge } from '@/utils/busTools';
import { countAmount } from '@/api/submitOrderObj';
import dayjs from 'dayjs';
import {
  setCommitId,
  setOrderRewardId,
  setThirdPartyCommitId,
} from '@/actions/avocado';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import WaitingInfo from '@/container/orderPage/waitingInfo';
import LottiePlayer from '@/component/LottiePlayer';
import orderComplete from '@/assets/lottie/order_complete.json';
import messageImg from '@/assets/images/message.png';
import textMsg from '@/assets/images/textMsg.png';
import PRINT from '@/assets/images/print.png';
import noReceipt from '@/assets/images/noReceipt.png';
import getDeviceDirection from '@/utils/getDeviceDirection';
import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import { calculateTotalAmount } from '@/utils/processZeroAmountOrder';
import { TOGONAMELIST } from '@/constants/mockData';
import { XMLObjTree } from '@/utils/ObjectTree';

const waitTime = 10;
const modalWaitTime = 3;

class OrderFinish extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      loadObj: {},
      defaultTime: waitTime,
      errorApiMsg: '',
      errorApiShow: false,
      isPartiallyPaid: false,
      showPartiallyPaidTimeCount: false,
      smsAuto: false,
      smsPhoneNumber: '',
      lottieOverStatus: false,
      amountObj: {},
      giftCardInfo: null,
    };
    this.clock = null;
    this.timeId = null;
    this.timer = null;
    this.autoSendMsgDelayTimer = null;
    this.printSuccessTimer = null;
    this.isOrderFinishUnmounted = false;
  }
  isOrderFinishActive = (scene, extra = '') => {
    const isOrderFinishRoute =
      window.location.hash.indexOf('/orderFinish') > -1;
    if (this.isOrderFinishUnmounted || !isOrderFinishRoute) {
      return false;
    }
    return true;
  };

  handleBackHome = (reason = 'unknown') => {
    if (!this.isOrderFinishActive('handleBackHome', `reason=${reason}`)) return;
    const {
      t,
      allSysConfig,
      selfConfig,
      currentOrder: { orderType, tabelServiceType },
      resetCurrentOrder,
      clearPaymentTypeTrail,
      clearPostPaymentActions,
      setCardPaidResult,
      setGiftCardPaymentInfo,
    } = this.props;

    // 打印debug模式
    if (allSysConfig?.PRINTING_DEBUG_MODE === 'true') {
      const printConfigVal = selfConfig?.configList
        ?.filter((each) => [7, 8].includes(each.id))
        ?.map((each) => each.value);
      // [0], [1], [0,1], [1,0] -> 至少需要打印一种单据
      const isNeedPrint =
        printConfigVal.includes(0) || printConfigVal.includes(1);
      // 若堂吃且送餐到桌 -> 自动打印叫号单
      if (
        (orderType === 'DINE_IN' && tabelServiceType === 'DINE_IN') ||
        isNeedPrint
      ) {
        const timer = setTimeout(() => {
          Toast.info(t('debug-print-failed'), 3000);
          clearTimeout(timer);
        }, 300);
      }
    }

    resetCurrentOrder();
    clearPaymentTypeTrail();
    clearPostPaymentActions();
    setCardPaidResult({});
    setGiftCardPaymentInfo(null);
    this.props.history.push('/');
  };

  // 根据打印机状态，显示弹框
  handleSetPrint = (status) => {
    if (status == 'ing') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'print',
          msgDone: status,
        },
      });
    } else if (status == 'success') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'print',
          msgDone: status,
        },
      });
    } else if (status == 'fail') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'print',
          msgDone: status,
          handleSendMsg: this.handleSendMsg,
          handleNoReceipt: this.handleNoReceipt,
          handlePrint: this.handlePrint,
        },
      });
    }
  };

  parseLicenseXml = (data) => {
    let findAppInstances = data;
    let start = findAppInstances?.indexOf('<soap:Body>');
    let end = findAppInstances?.indexOf('</soap:Body>');
    findAppInstances = findAppInstances?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let instanceList = objTree?.parseXML(findAppInstances);
    return instanceList?.fetchorderresponsetype?.order;
  };

  isBuyGiftCardOrder = () => {
    const { currentOrder, cardPaidResult } = this.props;
    return (
      currentOrder?.saveOrderResult?.type === 'CLOUD_GIFT_CARD' ||
      cardPaidResult?.type === 'CLOUD_GIFT_CARD'
    );
  };

  getPartiallyPaidTitleKey = () => {
    const { currentOrder } = this.props;
    const paymentTypeTrail = currentOrder?.paymentTypeTrail || [];
    const isGiftCardPartialPayment =
      this.judgeCardPartiallyPaid() &&
      !paymentTypeTrail.includes('CREDIT_CARD') &&
      paymentTypeTrail.includes('GIFT_CARD');

    return isGiftCardPartialPayment
      ? 'gift_card_insufficient_balance'
      : 'partially-paid';
  };

  // 获取购买的礼品卡信息
  loadGiftCardInfo = async () => {
    const orderId = this.props.currentOrder?.saveOrderResult?.id;

    if (!this.isBuyGiftCardOrder() || !orderId) {
      return null;
    }

    const orderRes = await getOrderInfo(orderId);
    const orderInfo = orderRes?.data ? this.parseLicenseXml(orderRes.data) : {};
    const orderItems = Array.isArray(orderInfo?.orderitems)
      ? orderInfo.orderitems
      : orderInfo?.orderitems
        ? [orderInfo.orderitems]
        : [];
    const ecardInfo = orderItems?.[0]?.ecard;
    const ecardNumber = ecardInfo?.cardnumber;

    if (!ecardNumber) {
      throw new Error('Missing ecard number');
    }

    const ecardRes = await searchECardCards({ cardNumber: ecardNumber });
    const cardDetail = (ecardRes?.data?.data || []).find(
      (card) => Number(card?.cardNumber) === Number(ecardNumber)
    );

    return {
      ecardNumber,
      balance: cardDetail?.balance,
      expirationTime: cardDetail?.giftCardExpiration
        ? dayjs(cardDetail.giftCardExpiration).format('YYYY-MM-DD')
        : '2099-12-31',
      cardDetail,
      orderInfo,
    };
  };

  // 购买礼品卡打印数据
  getGiftCardReceiptPayload = (paymentTotals = {}) => {
    const ecardNumber = this.state.giftCardInfo?.ecardNumber;

    if (!ecardNumber) {
      throw new Error('Missing ecard number');
    }

    return {
      ecardNumber,
      merchantCopy: false,
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
      ...paymentTotals,
    };
  };

  printReceipt = async (orderId, paymentTotals = {}) => {
    // 购买礼品卡全额支付打印
    if (this.isBuyGiftCardOrder()) {
      if (!this.judgeCardPartiallyPaid()) {
        const giftCardReceiptPayload =
          this.getGiftCardReceiptPayload(paymentTotals);
        return printECardInfo(giftCardReceiptPayload);
      } else {
        // todo check 购买礼品卡部分支付打印
        return printUnpaidReceiptHandler(orderId, paymentTotals);
      }
    }

    return printUnpaidReceiptHandler(orderId, paymentTotals);
  };

  // 自动打印
  handleAutoPrint = async () => {
    if (!this.isOrderFinishActive('handleAutoPrint_start')) return false;
    const { allSysConfig, store, payByCash, payByCard } = this.props;
    const resultId = this.props.currentOrder.saveOrderResult.id;
    const showSmsBtn =
      this.judgeShowSMSBtn() || this.isBuyGiftCardOrderShowSMS();

    // pos是否开启dual price
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    let totalAmount = {};
    if (isOpenDualPrice) {
      const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
        store,
        payByCash,
        payByCard
      );
      if (!this.isOrderFinishActive('handleAutoPrint_afterCountAmount')) {
        return false;
      }
      totalAmount = {
        cashPaymentTotal,
        creditPaymentTotal,
      };
    }

    try {
      const printReceptRes = await this.printReceipt(resultId, totalAmount);
      if (!this.isOrderFinishActive('handleAutoPrint_afterPrintReceipt')) {
        return false;
      }
      if (
        !printReceptRes.data.result ||
        !printReceptRes.data.result.successful
      ) {
        if (resultId) {
          sendError2MsgCenter(resultId, 'Printing failed');
        }
        if (!showSmsBtn) {
          this.handleSetPrint('fail');
        }
      } else {
        // 打印成功：卡部分付款或还有SMS按钮，不返回首页，其他情况直接返回首页
        if (this.judgeCardPartiallyPaid() || showSmsBtn) {
          return false;
        } else {
          this.handleTimeUp('autoPrintSuccess');
        }
      }
    } catch (err) {
      if (!this.isOrderFinishActive('handleAutoPrint_catch')) return false;
      if (!showSmsBtn) {
        this.handleSetPrint('fail');
      }
    }
  };

  // 手动打印
  handlePrint = () => {
    // 当前显示loading弹框
    if (this.state.loading) {
      this.setState(
        {
          loading: false,
          loadObj: {},
        },
        () => {
          this.printOrder();
        }
      );
    } else {
      // 当前无loading弹框
      this.printOrder();
    }
  };

  // 打印机接口
  printOrder = async () => {
    if (!this.isOrderFinishActive('printOrder_start')) return false;
    const { allSysConfig, store, payByCash, payByCard } = this.props;
    this.handleSetPrint('ing');
    const resultId = this.props.currentOrder.saveOrderResult.id;
    // pos是否开启dual price
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    let totalAmount = {};
    if (isOpenDualPrice) {
      const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
        store,
        payByCash,
        payByCard
      );
      if (!this.isOrderFinishActive('printOrder_afterCountAmount')) {
        return false;
      }
      totalAmount = {
        cashPaymentTotal,
        creditPaymentTotal,
      };
    }
    try {
      const printReceptRes = await this.printReceipt(resultId, totalAmount);
      if (!this.isOrderFinishActive('printOrder_afterPrintReceipt')) {
        return false;
      }
      if (
        !printReceptRes.data.result ||
        !printReceptRes.data.result.successful
      ) {
        if (resultId) {
          sendError2MsgCenter(resultId, 'Printing failed');
        }
        this.handleSetPrint('fail');
      } else {
        // 打印机延迟，2s的loading状态
        clearTimeout(this.printSuccessTimer);
        this.printSuccessTimer = setTimeout(() => {
          if (!this.isOrderFinishActive('printOrder_successDelay')) return;
          this.handleSetPrint('success');
          this.setState({ defaultTime: modalWaitTime });
          this.handleTimeUp('manualPrintSuccess');
        }, 2000);
      }
    } catch (err) {
      if (!this.isOrderFinishActive('printOrder_catch')) return false;
      this.handleSetPrint('fail');
    }
  };

  // 根据短信状态，显示弹框
  handleSetMsg = (status) => {
    if (status == 'ing') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'msg',
          msgDone: status,
        },
      });
    } else if (status == 'success') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'msg',
          msgDone: status,
        },
      });
    } else if (status == 'fail') {
      this.setState({
        loading: true,
        loadObj: {
          type: 'msg',
          msgDone: status,
          handleNoReceipt: this.handleNoReceipt,
          handleSendMsg: this.handleSendMsg,
          handlePrint: this.handlePrint,
        },
      });
    }
  };

  // 自动发送SMS
  handleAutoSendMsg = () => {
    if (!this.isOrderFinishActive('handleAutoSendMsg_start')) return false;
    const { giftCardInfo } = this.state;
    this.setState(
      {
        loading: false,
        loadObj: {},
      },
      async () => {
        if (!this.isOrderFinishActive('handleAutoSendMsg_callback')) return;
        clearTimeout(this.clock);
        this.clock = setTimeout(() => {
          if (!this.isOrderFinishActive('handleAutoSendMsg_timeout')) return;
          if (!this.judgeShowPrintBtn()) {
            this.handleSetMsg('fail');
          }
        }, 13000);
        try {
          const data = this.isBuyGiftCardOrder()
            ? {
                giftCardInfo,
              }
            : {};
          const res = await sendMsgReceiptHandler(data);
          if (!this.isOrderFinishActive('handleAutoSendMsg_afterSendMsg'))
            return;
          if (res.data.result.successful) {
            clearTimeout(this.clock);
            // SMS成功：卡部分付款或还有打印按钮，不返回首页，其他情况直接返回首页
            if (this.judgeCardPartiallyPaid() || this.judgeShowPrintBtn()) {
              return false;
            } else {
              this.handleTimeUp('autoSendMsgSuccess');
            }
          } else {
            clearTimeout(this.clock);
            if (!this.judgeShowPrintBtn()) {
              this.handleSetMsg('fail');
            }
          }
        } catch (error) {
          if (!this.isOrderFinishActive('handleAutoSendMsg_catch')) return;
          clearTimeout(this.clock);
          if (!this.judgeShowPrintBtn()) {
            this.handleSetMsg('fail');
          }
        }
      }
    );
  };

  // 手动发送SMS
  handleSendMsg = () => {
    this.setState(
      {
        loading: false,
        loadObj: {},
      },
      () => {
        this.sendMsg();
      }
    );
  };

  // 发送短信
  sendMsg = async () => {
    if (!this.isOrderFinishActive('sendMsg_start')) return false;
    clearTimeout(this.clock);
    const { giftCardInfo } = this.state;
    this.handleSetMsg('ing');
    this.clock = setTimeout(() => {
      if (!this.isOrderFinishActive('sendMsg_timeout')) return;
      this.handleSetMsg('fail');
    }, 13000);
    try {
      const data = this.isBuyGiftCardOrder()
        ? {
            giftCardInfo,
          }
        : {};
      const res = await sendMsgReceiptHandler(data);
      if (!this.isOrderFinishActive('sendMsg_afterSendMsg')) return false;
      if (res.data.result.successful) {
        this.handleSetMsg('success');
        this.setState({ defaultTime: modalWaitTime });
        this.handleTimeUp('sendMsgSuccess');
      } else {
        this.handleSetMsg('fail');
      }
      clearTimeout(this.clock);
    } catch (error) {
      if (!this.isOrderFinishActive('sendMsg_catch')) return false;
      this.handleSetMsg('fail');
      clearTimeout(this.clock);
    }
  };

  // 无需小票，跳首页
  handleNoReceipt = () => {
    // 当前显示loading弹框
    if (this.state.loading) {
      this.setState(
        {
          loading: false,
          loadObj: {},
        },
        () => {
          this.handleBackHome('noReceipt');
        }
      );
    } else {
      // 当前无loading弹框
      this.handleBackHome('noReceipt');
    }
  };

  // 3s后返回首页
  handleTimeUp = (reason = 'unknown') => {
    if (!this.isOrderFinishActive('handleTimeUp_start', `reason=${reason}`)) {
      return;
    }
    clearInterval(this.timeId);
    this.setState({
      showPartiallyPaidTimeCount: true,
    });
    this.timeId = setInterval(() => {
      if (!this.isOrderFinishActive('handleTimeUp_tick', `reason=${reason}`)) {
        clearInterval(this.timeId);
        return;
      }
      if (this.state.defaultTime > 1) {
        const defaultTime = this.state.defaultTime - 1;
        this.setState({
          defaultTime,
          showPartiallyPaidTimeCount: true,
        });
      } else {
        this.setState({
          defaultTime: waitTime,
          loading: false,
          loadObj: {},
          showPartiallyPaidTimeCount: false,
        });
        clearInterval(this.timeId);
        this.handleBackHome(`timeUp:${reason}`);
      }
    }, 1000);
  };

  // 判断是否开通SMS收据（id:9，0：自动打印、1：手动打印、2：不打印）
  judgeSMSByConfig = () => {
    const { selfConfig } = this.props;
    return selfConfig?.configMap?.id_9;
  };

  // 是否展示SMS按钮
  judgeShowSMSBtn = () => {
    // 配置项-(SMS收据自动0，手动1，不打2)(id: 9)
    const { currentOrder, systemConfig } = this.props;
    // todo 礼品卡订单没有手机号， 需要再查询一遍 可能要去componentWillReceiveProps中处理，购买礼品卡订单自动发短信
    return !!(
      systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
      currentOrder.saveOrderResult.customer?.phone[0]?.number &&
      this.judgeSMSByConfig() === 1
    );
  };

  // 判断pos是否配置发送短信
  judgeSendMsgByConfig = () => {
    const { systemConfig } = this.props;
    return systemConfig?.PAID_SMS_WARNING?.booleanValue;
  };

  // 判断pos是否配置kiosk发送短信渠道 （1.pos 3.kiosk 4.oo）
  judgeSendMsgChannelByConfig = () => {
    const { systemConfig } = this.props;
    return systemConfig?.CHANNEL_SMS_WARNING_ON_PAID?.value.includes('3');
  };

  // 判断是否开通纸质收据（id:8，0：自动打印、1：手动打印、2：不打印）
  judgePrintByConfig = () => {
    const { selfConfig } = this.props;
    return selfConfig?.configMap?.id_8;
  };

  // 是否展示纸质按钮
  judgeShowPrintBtn = () => {
    const { allSysConfig } = this.props;
    let isOpenPrint = allSysConfig?.RECEIPT_PRINT === 'true'; // pos
    return !!(isOpenPrint && this.judgePrintByConfig() === 1);
  };

  // 是否展示no-receipt按钮
  judgeShowNoReceiptBtn = () => {
    return !!(
      this.judgeShowSMSBtn() ||
      this.isBuyGiftCardOrderShowSMS() ||
      this.judgeShowPrintBtn()
    );
  };

  // 是否是部分支付
  judgeCardPartiallyPaid = () => {
    const { cardPaidResult } = this.props;
    return !!(
      cardPaidResult?.id && cardPaidResult?.status === 'PARTIALLY_PAID'
    );
  };

  // 关闭部分付款提示框后，返回首页
  // 自动打印(成功) + 手动发送(没输入手机号)
  // 自动打印(成功) + 不发送
  // 不打印 + 自动发送(输入手机号且成功，或没有输手机号)
  // 不打印 + 手动发送(没有输手机号)
  // 不打印 + 不发送
  handleClosePartiallyPaid = () => {
    const { loading } = this.state;
    this.setState({ isPartiallyPaid: false });
    if (
      this.judgePrintByConfig() === 0 &&
      !loading &&
      !this.judgeShowSMSBtn()
    ) {
      this.handleTimeUp('closePartiallyPaid_autoPrintNoSms');
    } else if (this.judgePrintByConfig() === 2) {
      if (
        (this.judgeSMSByConfig() === 0 && !loading) ||
        (this.judgeSMSByConfig() === 1 && !this.judgeShowSMSBtn()) ||
        this.judgeSMSByConfig() === 2
      ) {
        this.handleTimeUp('closePartiallyPaid_noPrintNoSms');
      }
    }
  };

  async componentDidMount() {
    this.isOrderFinishUnmounted = false;
    const {
      currentOrder,
      systemConfig,
      allSysConfig,
      store,
      payByCash,
      payByCard,
      selfConfig,
    } = this.props;
    const phoneNumber =
      currentOrder?.saveOrderResult?.customer?.phone[0]?.number;
    // 页面金额展示数据
    const amountObj = await countAmount(store, payByCash, payByCard);
    if (!this.isOrderFinishActive('componentDidMount_afterCountAmount')) return;
    let giftCardInfo = null;
    if (this.isBuyGiftCardOrder()) {
      try {
        giftCardInfo = await this.loadGiftCardInfo();
        if (
          !this.isOrderFinishActive('componentDidMount_afterLoadGiftCardInfo')
        ) {
          return;
        }
      } catch (error) {
        giftCardInfo = null;
      }
    }
    // 部分付款自动打印纸质订单收据
    if (!this.isOrderFinishActive('componentDidMount_beforeSetState')) return;
    const partialPaymentPrint = selfConfig?.configMap?.id_60;
    // 部分支付
    const partiallyPaid = this.judgeCardPartiallyPaid();
    this.setState({
      amountObj,
      giftCardInfo,
    });
    // 银行卡或礼品卡部分付款，弹出提示框
    if (partiallyPaid) {
      this.setState({ isPartiallyPaid: true });
    }

    // pos配置了kiosk发送短信
    if (
      this.judgeSendMsgByConfig() &&
      this.judgeSendMsgChannelByConfig() &&
      phoneNumber
    ) {
      this.setState({
        smsAuto: true,
        smsPhoneNumber: '+1' + maskPhoneNumber(phoneNumber.slice(-10)),
      });
    }

    if (
      this.judgePrintByConfig() === 0 &&
      allSysConfig?.RECEIPT_PRINT === 'true' &&
      (!partiallyPaid || partialPaymentPrint)
    ) {
      // 当纸质自动打印
      await judgeSskeyIsActiveTime().then(() => {
        if (!this.isOrderFinishActive('componentDidMount_beforeAutoPrint')) {
          return false;
        }
        return this.handleAutoPrint();
      });
    } else if (this.judgeSMSByConfig() === 0) {
      // 当SMS自动发短信，且输入手机号
      // 购买卡礼品卡订单, 因为需要根据卡号获取手机号, 异步不稳定, 不从这自动发短信
      if (
        systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
        phoneNumber &&
        !this.isBuyGiftCardOrder()
      ) {
        this.setState({
          smsAuto: true,
          smsPhoneNumber: '+1' + maskPhoneNumber(phoneNumber.slice(-10)),
        });
        clearTimeout(this.autoSendMsgDelayTimer);
        this.autoSendMsgDelayTimer = setTimeout(() => {
          if (!this.isOrderFinishActive('componentDidMount_autoSendMsgDelay')) {
            return;
          }
          this.handleAutoSendMsg();
          clearTimeout(this.autoSendMsgDelayTimer);
          this.autoSendMsgDelayTimer = null;
        }, 300);
      } else {
        // 没输入手机号，但开通手动打印
        if (this.judgePrintByConfig() === 1) {
          return false;
        } else {
          if (!this.judgeCardPartiallyPaid()) {
            this.handleTimeUp('componentDidMount_noPhoneNoManualPrint');
          }
        }
      }
    } else {
      // 当SMS手动
      if (this.judgeSMSByConfig() === 1) {
        if (this.judgePrintByConfig() === 1) {
          return false;
        } else {
          // 且没输入手机号
          if (
            (systemConfig.KIOSK_SEND_MESSAGE?.booleanValue && phoneNumber) ||
            this.isBuyGiftCardOrderShowSMS()
          ) {
            return false;
          } else {
            if (!this.judgeCardPartiallyPaid()) {
              this.handleTimeUp('componentDidMount_manualSmsNoPhone');
            }
          }
        }
      } else if (
        this.judgePrintByConfig() === 2 &&
        this.judgeSMSByConfig() === 2
      ) {
        // SMS和print全部关闭
        if (!this.judgeCardPartiallyPaid()) {
          this.handleTimeUp('componentDidMount_noSmsNoPrint');
        }
      }
    }
  }

  /** 本页依赖的「是否支付完成 + 柜台提示文案」在同一时机从 props 派生，避免多处重复计算与信用卡结果未就绪时的误判 */
  getOrderFinishDerived = () => {
    const { currentOrder, store, t } = this.props;
    const totalAmount = calculateTotalAmount(store);
    const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
    const needPayForCharge = judgeNeedPayOtherCharge();
    const isPartiallyPaid = this.judgeCardPartiallyPaid();
    const { paymentTypeTrail } = currentOrder;
    const isGiftCardPay =
      paymentTypeTrail.includes('GIFT_CARD') && paymentTypeTrail.length === 1;

    const isFinish =
      totalAmount === 0 ||
      (['CREDIT_CARD', 'GIFT_CARD'].includes(currentOrder?.paymentType) &&
        !isPartiallyPaid) ||
      (isGiftCardPay && !isPartiallyPaid);

    let pageContent = '';
    if (
      (currentOrder?.paymentType === 'CASH' && !isFinish) ||
      isPartiallyPaid
    ) {
      if (!onlyHaveFreeItem || needPayForCharge) {
        pageContent = t('cash-front-counter');
      }
    } else if (currentOrder?.paymentType === 'CREDIT_CARD' || isFinish) {
      if (isPartiallyPaid) {
        pageContent = t('cash-front-counter');
      }
    }

    return { isFinish, pageContent };
  };

  // 动画播放完成
  lottieComplete = () => {
    this.setState({
      lottieOverStatus: true,
    });
  };

  componentWillUnmount() {
    this.isOrderFinishUnmounted = true;
    clearInterval(this.timeId);
    clearTimeout(this.clock);
    clearTimeout(this.timer);
    clearTimeout(this.autoSendMsgDelayTimer);
    clearTimeout(this.printSuccessTimer);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const prevEcardNumber = prevState.giftCardInfo?.ecardNumber;
    const currentEcardNumber = this.state.giftCardInfo?.ecardNumber;
    // 购买礼品卡自动发短信
    if (
      this.isBuyGiftCardOrder() &&
      currentEcardNumber &&
      prevEcardNumber !== currentEcardNumber &&
      this.props.systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
      this.judgeSMSByConfig() === 0
    ) {
      this.setState({
        smsAuto: true,
        smsPhoneNumber:
          '+1' +
          maskPhoneNumber(this.state.giftCardInfo?.cardDetail?.to.slice(-10)),
      });
      this.handleAutoSendMsg();
    }
  }

  // 积分内容渲染
  renderPointDesc = (isFinish) => {
    const { currentOrder } = this.props;
    if (!currentOrder.saveOrderResult.point) return null;
    // const direction = getDeviceDirection();
    return (
      <div className={`${styles.point}`}>
        <div className={styles.pointDesc}>
          <Trans
            i18nKey={!isFinish ? 'pointGain' : 'pointGainFinish'}
            values={{ points: currentOrder.saveOrderResult.point }}
            components={{
              star: <span className={styles.star}></span>,
            }}
          />
        </div>
      </div>
    );
  };

  // 短信收据文字渲染
  renderSmsTextDesc = () => {
    const { smsAuto, smsPhoneNumber } = this.state;
    const { t } = this.props;
    if (!smsAuto) return null;

    // const direction = getDeviceDirection();
    return (
      <div className={`${styles.smsDescription}`}>
        <div className={styles.smsTxt}>
          <img src={messageImg} alt="sms" className={styles.smsIcon} />
          <span>
            {t('sms-send')}
            <span className={styles.smsPhoneNumber}>{smsPhoneNumber}</span>
          </span>
        </div>
      </div>
    );
  };

  // 提示去完成支付文字渲染
  renderTipsTextDesc = (pageContent) => {
    if (!pageContent) return null;

    // const direction = getDeviceDirection();
    return (
      <div className={`${styles.cashPaymentDescription}`}>{pageContent}</div>
    );
  };

  // 现金支付的订单详情
  renderReceiptBox = (isFinish, isGiftCardFinish) => {
    if (isFinish && !isGiftCardFinish) return null;
    if (Object.keys(this.state.amountObj || {}).length === 0) return null;

    const {
      t,
      currentOrder,
      togoList,
      crm: { selectedFreeItem },
      store: { promotion },
    } = this.props;
    const { amountObj } = this.state;

    const { subTotal, totalTax, rewardDiscount, orderDiscount, totalAmount } =
      amountObj;

    // 菜量
    const count = [
      ...currentOrder.itemList,
      ...selectedFreeItem,
      ...(promotion?.buyGifts?.[0]?.items || []),
    ].reduce((total, item) => total + (item.quantity || 1), 0);

    return (
      <div className={styles.receiptBox}>
        <div className={styles.jineBox}>
          <div className={styles.jine}>
            <span>{t('subtotal')}</span>
            <span>${this.formatterFixed(subTotal)}</span>
          </div>
          {currentOrder.orderType == 'TO_GO' ||
          currentOrder.orderType == 'PICK_UP'
            ? togoList.map((item, idx) => {
                if (item.select?.id) {
                  if (item.select.id == -1) {
                    return (
                      <div key={item.id + '_' + idx} className={styles.jine}>
                        <span>{t([TOGONAMELIST[item.id]])}</span>
                        <span>{t('free')}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div key={item.id + '_' + idx} className={styles.jine}>
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
          <div className={styles.jine}>
            <span>{t('taxTotal')}</span>
            <span>${this.formatterFixed(totalTax)}</span>
          </div>
          {rewardDiscount > 0 && (
            <div className={`${styles.jine} ${styles.discount}`}>
              <span>{t('redeemDiscount')}</span>
              <span>-${this.formatterFixed(rewardDiscount)}</span>
            </div>
          )}
          {orderDiscount > 0 && (
            <div className={`${styles.jine} ${styles.discount}`}>
              <span>{t('orderDis')}</span>
              <span>-${this.formatterFixed(orderDiscount)}</span>
            </div>
          )}

          <div className={styles.payBox}>
            <div className={styles.totalTitle}>{t('allTotal')}:</div>
            <div className={styles.total}>${totalAmount}</div>
          </div>
        </div>
      </div>
    );
  };

  // 完成页主区域：标题（未完成支付时为小票文案）与订单号
  renderFinishBoxHeader = (isFinish) => {
    const { t, currentOrder } = this.props;
    const title = !isFinish ? t('receipt') : '';
    return (
      <div className={styles.boxHeader}>
        <div className={styles.title}>{title}</div>
        <div className={styles.currentOrderNum}>
          <div>{t('order')}</div>
          <div className={styles.orderNumber}>
            {currentOrder.saveOrderResult.orderNumber}
          </div>
        </div>
      </div>
    );
  };

  // 判断 购买礼品卡 订单是否展示SMS
  getGiftCardSmsPhoneNumber = () => {
    const { giftCardInfo } = this.state;

    if (giftCardInfo?.cardDetail?.toType !== 'phone') return false;

    const target = giftCardInfo?.cardDetail?.to;

    if (!target) return false;

    return target;
  };

  isBuyGiftCardOrderShowSMS = () => {
    const { systemConfig } = this.props;

    const smsPhoneNumber = this.getGiftCardSmsPhoneNumber();
    if (!smsPhoneNumber) return false;

    const isShowConditionSatisfy =
      this.isBuyGiftCardOrder() && !!smsPhoneNumber;

    return !!(
      systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
      isShowConditionSatisfy &&
      this.judgeSMSByConfig() === 1
    );
  };

  // 小票选项：短信、打印、无需小票
  renderReceiptOptionButtons = (isFinish, pageContent) => {
    const showNoReceiptPanel = this.judgeShowNoReceiptBtn();
    if (!showNoReceiptPanel) return null;

    const { smsAuto } = this.state;
    const { currentOrder, t } = this.props;
    const showSmsBtn =
      this.judgeShowSMSBtn() || this.isBuyGiftCardOrderShowSMS();
    const showPrintBtn = this.judgeShowPrintBtn();
    const smallerBtn =
      currentOrder?.saveOrderResult?.point &&
      pageContent &&
      smsAuto &&
      !isFinish; //全信息时 s按钮整体缩小

    return (
      <div>
        <div className={styles.receipt}>{t('receipt-option')}</div>
        <div
          className={`${styles.finishBtn} ${smallerBtn ? styles.finishSmallerBtn : ''}`}
        >
          {showSmsBtn && (
            <div className={styles.msg} onClick={this.handleSendMsg}>
              <img src={textMsg} className={styles.icon} />
              <span className={styles.txt}>{t('text-msg')}</span>
            </div>
          )}
          {showPrintBtn && (
            <div className={styles.print} onClick={this.handlePrint}>
              <img src={PRINT} className={styles.icon} />
              <span className={styles.txt}>{t('print')}</span>
            </div>
          )}
          <div className={styles.no} onClick={this.handleNoReceipt}>
            <img src={noReceipt} className={styles.icon} />
            <span className={styles.txt}>{t('no-receipt')}</span>
          </div>
        </div>
      </div>
    );
  };

  // 显示保留2位小数
  formatterFixed = (money) => {
    return parseFloat(money).toFixed(2);
  };

  handleClose = () => {
    this.props.history.push('/');
  };

  // 判断礼品卡全额支付订单
  isGiftCardFullPayment = () => {
    const { currentOrder } = this.props;
    // 检查当前订单是否是礼品卡全额支付订单
    const paymentTypeTrail = currentOrder?.paymentTypeTrail || [];
    return paymentTypeTrail.length === 1 && paymentTypeTrail[0] === 'GIFT_CARD';
  };

  render() {
    const { t, cardPaidResult } = this.props;
    const {
      isPartiallyPaid,
      errorApiShow,
      errorApiMsg,
      loading,
      loadObj,
      defaultTime,
      showPartiallyPaidTimeCount,
    } = this.state;
    const direction = getDeviceDirection();
    const isCurrentOrderPartiallyPaid = this.judgeCardPartiallyPaid();
    const { isFinish, pageContent } = this.getOrderFinishDerived();

    // 展示撒花lottie动画（必须在支付完成不展示账单详情，且不展示按钮的情况下）
    const showLottie = isFinish && !this.judgeShowNoReceiptBtn();

    const isGiftCardFinish = this.isGiftCardFullPayment();

    return (
      <div className={styles.finishWarp}>
        <div
          className={`${styles.finishBox} ${direction === 'horizontal' ? styles.withReceiptArea : ''}`}
        >
          {this.renderFinishBoxHeader(isFinish)}
          <WaitingInfo />
          {this.renderPointDesc(isFinish)}
          {this.renderSmsTextDesc()}
          {direction === 'vertical' && (
            <>
              {showLottie && (
                <div className={styles.swipeImageBx}>
                  <LottiePlayer
                    animationData={orderComplete}
                    loop={false}
                    onComplete={this.lottieComplete}
                  />
                </div>
              )}
              <div>
                {this.renderTipsTextDesc(pageContent)}
                {this.renderReceiptBox(isFinish, isGiftCardFinish)}
              </div>
              {this.renderReceiptOptionButtons(isFinish, pageContent)}
            </>
          )}

          {/* 始终保持展示close（条件性倒计时 */}
          <div
            className={`${styles.close} linear-animate-btn`}
            onClick={this.handleClose}
          >
            {t('close')}
            {showPartiallyPaidTimeCount ? ` (${defaultTime}s)` : ''}
          </div>
        </div>

        {/* 横屏时，现金支付的详情、功能按钮 单独放一个区域 */}
        {direction === 'horizontal' && (
          <div
            className={`${styles.receiptArea} ${!isFinish && !this.judgeShowNoReceiptBtn() ? styles.receiptNotFinishArea : ''}`}
          >
            {showLottie && (
              <div className={styles.swipeImageBx}>
                <LottiePlayer
                  animationData={orderComplete}
                  loop={false}
                  onComplete={this.lottieComplete}
                />
              </div>
            )}
            <div>
              {this.renderTipsTextDesc(pageContent)}
              {this.renderReceiptBox(isFinish, isGiftCardFinish)}
            </div>
            {this.renderReceiptOptionButtons(isFinish, pageContent)}
          </div>
        )}

        {loading ? (
          <ReceiptModal
            isShowReceipt={loading}
            loadObj={loadObj}
            handleClose={this.handleClose}
            countDownTime={defaultTime}
            isBuyGiftCardOrderFn={this.isBuyGiftCardOrder}
            buyGiftCardOrderPhone={this.getGiftCardSmsPhoneNumber()}
          />
        ) : null}

        {/* 部分支付弹框提示 */}
        <Dialog
          visible={isPartiallyPaid}
          html={
            <div className={styles.containerBox}>
              <div className={styles.itemBox}>
                <Icon type="svg_warn" size={8} />
                <div className={styles.itemName}>
                  {t(this.getPartiallyPaidTitleKey())}
                </div>
                <div className={styles.subItemName}>
                  {t('partially-paid-sub')}
                </div>
                <div className={styles.paidBox}>
                  <span>
                    {t('paid')}: ${cardPaidResult?.unpaidInfo?.paid}
                  </span>
                  <span>
                    {t('unpaid')}: ${cardPaidResult?.unpaidInfo?.unpaid}
                  </span>
                </div>
              </div>
              <div
                onClick={this.handleClosePartiallyPaid}
                className="animate-btn"
              >
                {t('confirm')}
              </div>
            </div>
          }
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
    allSysConfig: state.allSysConfig,
    cardPaidResult: state.cardPaidResult,
    togoList: state.togoList,
    avocado: state.avocado,
    merchantProfile: state.merchantProfile,
    crm: state.crm,
    currentCategoryList: state.currentCategoryList,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    resetCurrentOrder,
    payByCard,
    payByCash,
    clearPaymentTypeTrail,
    clearPostPaymentActions,
    setCardPaidResult,
    setGiftCardPaymentInfo,
    setCommitId,
    setOrderRewardId,
    setThirdPartyCommitId,
  })(withTranslation()(OrderFinish))
);
