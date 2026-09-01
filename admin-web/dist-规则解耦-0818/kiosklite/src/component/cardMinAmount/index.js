import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Alert from '@material-ui/lab/Alert';
import styles from './cardMinAmount.module.scss';
import Icon from '../icon';
import Dialog from '../dialog';
import LoadingText from '../loadingText';
import CallModal from '../callModal';
import {
  payByCard,
  payByCash,
  saveOrderResult,
  markPostPaymentAction,
} from '@/actions';
import { saveOrder, printCall, send2Kitchen } from '@/api';
import { sendError2MsgCenter } from '@/api/apiUtil';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { generateSubmitOrderObj, countAmount } from '@/api/submitOrderObj';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { orderLockProcedure } from '@/utils/orderLock';
import reduxStore from '@/reducers/store';

import Big from 'big.js';

class CardMinAmount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorApiMsg: '',
      errorApiShow: false,
      loading: false,
      callLoadObj: {},
      saveOrderId: '',
    };
    this.timer = null;
  }

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

  // 打印叫号单
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

  // 选择现金支付
  handleChoosePayByCash = () => {
    this.props.payByCash();
    this.setState({ loading: true });
    judgeSskeyIsActiveTime().then(() => this.submitOrder());
  };

  // 点击现金支付，则提交订单
  submitOrder = async () => {
    const { allSysConfig, store, payByCash, payByCard, saveOrderResult } =
      this.props;
    let orderData = generateSubmitOrderObj(store);
    // pos是否开启dual price
    const isOpenDualPrice = allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';
    if (isOpenDualPrice) {
      const { cashPaymentTotal, creditPaymentTotal } = await countAmount(
        store,
        payByCash,
        payByCard
      );
      orderData = {
        ...orderData,
        order: { ...orderData.order, cashPaymentTotal, creditPaymentTotal },
      };
    }
    try {
      const res = await saveOrder(orderData);
      if (res.data.result.successful) {
        const orderId = res.data.order.id;
        this.setState({ loading: false });
        saveOrderResult(res.data.order);
        const {
          currentOrder: { orderType, tabelServiceType, tableId },
          selfConfig,
          userId,
        } = this.props;
        // 当前订单锁流程;
        const lockParm = {
          targetId: res.data.order?.id,
          userId,
        };
        const onErrCb = (apiRes) => {
          this.setState({ loading: false });
          this.showApiModalTip(apiRes?.data?.msg || 'Lock Error');
        };
        const lockData = await orderLockProcedure(lockParm, onErrCb);
        if (!lockData) return;

        if (tableId) {
          getChooseTableStatus();
        }

        let arr = selfConfig?.configMap?.id_20 || [];
        // 判断是否现金支付送厨（id:20，0：卡全额支付、1：卡部分支付、2：现金支付）
        if (arr.includes(2)) {
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
        }
        const locatorType = selfConfig?.configMap?.id_28;
        // 若堂吃（dinein）且送餐到桌，且开启纸质号码牌，才打印号牌单
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
      } else {
        this.setState({ loading: false });
        this.showApiModalTip(res.data?.result?.failureReason);
      }
    } catch (err) {
      this.setState({ loading: false });
      this.showApiModalTip(err?.message);
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

  render() {
    const {
      t,
      selfConfig,
      errorApiShow,
      errorApiMsg,
      systemConfig,
      isShowCardMinModal,
      currentAmount,
      handleContinueOrder,
      handleCloseMin,
    } = this.props;
    const { loading, callLoading, callLoadObj } = this.state;
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
    const minCardAmount = selfConfig?.configMap?.id_21;
    const diff = Big(minCardAmount).minus(currentAmount).toFixed(2);

    return (
      <React.Fragment>
        <Dialog
          visible={isShowCardMinModal}
          html={
            <div
              className={styles.containerBox}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.itemIcon}>
                <Icon type="svg_warn" size={8} />
              </div>
              <div className={styles.itemBox}>
                <div className={styles.itemName}>{t('card-min-title')}</div>
                <div className={styles.subItemName}>
                  {t('card-min-amount', { rplc: `$${minCardAmount}` })}
                </div>
                <div className={styles.subItemName}>
                  {t('card-min-current-amount', { rplc: `$${currentAmount}` })}
                </div>
                <div className={styles.subItemName}>
                  {t('card-min-diff', { rplc: `$${diff}` })}
                </div>
              </div>
              <div className={styles.btnBox}>
                {paymentRouteResult.canPayByCash && (
                  <span
                    className={styles.cash}
                    onClick={this.handleChoosePayByCash}
                  >
                    {t('card-min-by-cash')}
                  </span>
                )}
                <span
                  className={[
                    'linear-animate-btn',
                    styles.continueOrder,
                    !paymentRouteResult.canPayByCash && styles.orderNoCash,
                  ].join(' ')}
                  onClick={handleContinueOrder}
                >
                  {t('card-min-continue')}
                </span>
              </div>
            </div>
          }
          onClose={handleCloseMin}
        />

        <LoadingText visible={loading} textKey={2} />

        {callLoading ? (
          <CallModal callLoading={callLoading} loadObj={callLoadObj} />
        ) : null}

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    systemConfig: state.systemConfig,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    allSysConfig: state.allSysConfig,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    saveOrderResult,
    payByCard,
    payByCash,
    markPostPaymentAction,
  })(
    withTranslation()(CardMinAmount)
  )
);
