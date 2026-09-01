import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './index.module.scss';
import { generateSubmitOrderObj, getOrderInfoObj } from '@/api/submitOrderObj';
import Loading from '@/component/loading';
import { sendPayment, posFrontLog } from '@/api';
import safeBig from '@/utils/safeBig';
import TipBtn from '@/component/TipBtn';
import Signature from '../signature';
import {
  saveTipAmount,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setSelfConfig,
  savePaymentId,
  setCardPaidResult,
  markPostPaymentAction,
} from '@/actions';
import Dialog from '@/component/dialog';
import {
  getCookie,
  getDeviceOrientation,
  judgeSskeyIsActiveTime,
  isOpenVtkeyboadrd,
} from '@/utils';
import { getOrderInfo } from '@/api/apiPos';
import { XMLObjTree } from '@/utils/ObjectTree';
import Alert from '@material-ui/lab/Alert';
import Toast from '@/component/toast';
import VtKeyboard from '@/component/VtKeyboard';
import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';
import qs from 'qs';
import getOrderDetail from '@/utils/getOrderDetail';
import {
  calcTipAmount,
  getTipBasePrice,
  getTipConfig,
} from '@/utils/calcTipAmount';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';

class AfterCreditCardPay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultTipList: [15, 20, 25],
      savetip: '',
      tipValue: null,
      customTip: false,
      customNumber: '',
      inputCustomTip: false,
      errorApiMsg: '',
      errorApiShow: false,
      loading: false,
      keyboardToggle: false,
    };
    this.timer = null;
    this.customTipInputRef = null;
    this.keyboardManager = null;
  }

  componentDidMount() {
    // 横屏模式下监听原生键盘弹出
    if (getDeviceOrientation() !== 'vertical') {
      this.keyboardManager = new LandscapeKeyboardManager(
        () => this.customTipInputRef
      );
      this.keyboardManager.setup();
    }
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
  }

  jumpRrrorPage = (payload) => {
    const resolved =
      typeof payload === 'string'
        ? { code: '000', failureReason: payload, pay: 0 }
        : {
            code: payload?.code ?? '000',
            failureReason: payload?.failureReason ?? '',
            pay: payload?.pay ?? 0,
          };
    setTimeout(() => {
      this.props.history.push({
        pathname: '/connectionError',
        search: qs.stringify({
          pay: resolved.pay,
          code: resolved.code,
        }),
        state: { failureReason: resolved.failureReason },
      });
    }, 2000);
  };

  getTipContext = () => {
    const { store, allSysConfig, selfConfig } = this.props;
    const { defaultTipList } = this.state;
    const orderInfo = getOrderInfoObj(store);
    const totalPrice = getTipBasePrice(orderInfo, allSysConfig);
    const { tipType, tipIptList } = getTipConfig(selfConfig, defaultTipList);
    return { totalPrice, tipType, tipIptList };
  };

  calculateTipAmount = () => {
    const { tipValue, customTip } = this.state;
    const { totalPrice, tipType } = this.getTipContext();
    return calcTipAmount({ tipValue, customTip, tipType, totalPrice });
  };

  tipToggler = (val) => {
    this.setState({
      tipValue: val,
    });
  };

  showCustomTipInput = () => {
    if (this.state.customTip) {
      this.setState({
        inputCustomTip: true,
        customNumber: this.state.tipValue || '',
      });
    } else {
      this.setState({
        tipValue: null,
        customNumber: '',
        inputCustomTip: true,
      });
    }
  };

  hideCustomTipInput = () => {
    this.setState({
      inputCustomTip: false,
    });
    this.hideKeyboard();
  };

  handleConfirm = () => {
    const val = this.state.customNumber;
    const numVal = Number(val);
    if (!val || Number.isNaN(numVal) || numVal < 0 || numVal > 1000) {
      return false;
    }
    this.setState({
      customTip: true,
      tipValue: safeBig(numVal).toFixed(2),
    });
    this.hideCustomTipInput();
  };

  handleCustomChange = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    // 只允许数字和小数点，且不允许负号
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }
    if (value && Number(value) > 1000) return;

    this.setState({
      customNumber: value,
    });
  };

  handleKeyUp = async (e) => {
    if (e.keyCode === 13) {
      this.handleConfirm();
    }
  };

  handleChooseNone = () => {
    this.setState({
      customTip: false,
      tipValue: 0,
    });
  };

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

  getOrderInfo = async (orderId) => {
    try {
      const res = await getOrderInfo(orderId);
      let r = res.data ? this.parseLicenseXml(res.data) || {} : {};
      return r.checksum;
    } catch (e) {
      this.showApiModalTip(e.message);
      this.setState({
        loading: false,
      });
    }
  };

  // 是否是信用卡部分付款
  judgeCardPartiallyPaid = () => {
    const { cardPaidResult, currentOrder } = this.props;
    return !!(
      currentOrder.paymentType === 'CREDIT_CARD' &&
      cardPaidResult?.id &&
      cardPaidResult?.status === 'PARTIALLY_PAID'
    );
  };

  handlePayTip = async (isNeedSign) => {
    const isCreditPartPay = this.judgeCardPartiallyPaid();
    const { currentOrder, t, cardPaidResult } = this.props;
    if (currentOrder?.postPaymentActions?.tipApplied) {
      if (isNeedSign) {
        return true;
      }
      this.props.history.push('/orderFinish');
      return true;
    }
    const orderData = generateSubmitOrderObj(this.props.store);
    const tipAmount = this.calculateTipAmount();
    if (tipAmount === null) {
      Toast.info(t('please-select-tip'), 1000);
      return false;
    }
    const orderId = currentOrder.saveOrderResult.id;
    if (!isNeedSign) {
      this.setState({
        loading: true,
      });
    }
    const checksum = await this.getOrderInfo(orderId);
    if (!checksum) {
      this.jumpRrrorPage();
      return false;
    }
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

    const totalAmount = safeBig(orderData?.order?.totalPrice)
      .plus(safeBig(orderData?.order?.totalTax))
      .plus(safeBig(tipAmount))
      .plus(safeBig(orderData?.order?.chargeTotal))
      .plus(safeBig(orderData?.order?.togoTotal))
      .minus(safeBig(orderData?.order?.rewardDiscount))
      .minus(safeBig(orderData?.order?.discount))
      .minus(safeBig(crmIntegrationDiscount))
      .toNumber();

    // 区分部分支付和全额支付
    // 全额支付: amount paidAmount 都取总价
    // 部分支付: amount paidAmount 都取已支付的价钱+小费
    let paidAmount = 0;
    let amount = 0;
    if (isCreditPartPay) {
      paidAmount = safeBig(cardPaidResult?.unpaidInfo?.paid)
        .plus(safeBig(tipAmount))
        .toNumber();
      amount = safeBig(cardPaidResult?.unpaidInfo?.paid)
        .plus(safeBig(tipAmount))
        .toNumber();
    } else {
      paidAmount = totalAmount;
      amount = totalAmount;
    }

    const paymentObj = {
      fromProduct: 'KIOSK',
      paymentRecord: {
        checksum, //currentOrder.saveOrderResult.checksum,
        cashTipAmount: 0,
        amount,
        paidAmount,
        id: currentOrder.savePaymentId,
      },
      printPaymentReceipt: false,
      merchantCopyOnly: false,
      transactionDetail: {
        actionType: 'APPLY_TIP',
        tipAmount: Number(tipAmount),
      },
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };
    try {
      const res = await sendPayment(paymentObj);
      posFrontLog(
        `Kiosk Start SendPayment [AfterCreditCardPay]
            tipAmount: ${tipAmount}; 
            TotalAmount: ${totalAmount}`
      );
      this.props.saveTipAmount(tipAmount);
      this.setState({
        loading: false,
      });
      if (res.data.result.successful) {
        this.props.markPostPaymentAction('tipApplied');
        this.props.savePaymentId(res.data.id);
        posFrontLog(
          `Kiosk SendPayment Success [AfterCreditCardPay]
                    orderStatus: ${res?.data?.orderStatus} ; 
                    PaymentId: ${res?.data?.id} ; 
                    insufficientBalanceResponse-Balance: ${res?.data?.insufficientBalanceResponse?.balance} ;`
        );
        if (res.data.orderStatus === 'PARTIALLY_PAID') {
          await judgeSskeyIsActiveTime();
          await getOrderDetail({
            orderId,
            setCardPaidResult: this.props.setCardPaidResult,
          });
        }
        if (isNeedSign) {
          return true;
        } else {
          this.props.history.push('/orderFinish');
        }
      } else {
        this.showApiModalTip(res.data?.result?.failureReason);
        this.jumpRrrorPage({
          code: res.data?.result?.code ?? '000',
          failureReason: res.data?.result?.failureReason ?? '',
          pay: 0,
        });
      }
    } catch (err) {
      this.props.saveTipAmount(0);
      this.showApiModalTip(err?.message);
      this.jumpRrrorPage({
        code: '000',
        failureReason: err?.message ?? '',
        pay: 0,
      });
      this.setState({
        loading: false,
      });
    }
  };

  renderTitle = (isShowSign, isShowTip) => {
    const { t } = this.props;

    if (isShowSign && isShowTip)
      return <div className={styles.title}>{t('tip-sign')}</div>;
    if (isShowSign)
      return <div className={styles.title}>{t('sign-title')} </div>;
    if (isShowTip)
      return <div className={styles.title}>{t('choose_tip_description')}</div>;
  };

  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };

  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  render() {
    const { t, selfConfig } = this.props;
    const {
      tipValue,
      customTip,
      customNumber,
      inputCustomTip,
      errorApiMsg,
      errorApiShow,
      loading,
      keyboardToggle,
    } = this.state;
    const { totalPrice, tipType, tipIptList } = this.getTipContext();
    const isShowSign = selfConfig?.configMap?.id_23;
    const isShowTip = isTipEnabledForPaymentType(
      selfConfig,
      'CREDIT_CARD',
      this.props.systemConfig
    );
    const isShowNoTip = selfConfig?.configMap?.id_27;

    const isVertical = getDeviceOrientation() === 'vertical';

    const configTipDom = tipIptList.map((val, idx) => {
      let tipVal = safeBig(totalPrice).times(safeBig(val)).div(100).toFixed(2);
      return (
        <div className={styles.basicTip}>
          <TipBtn
            key={val + '_' + idx}
            text={tipType == 1 ? `$${val.toFixed(2)}` : `$${tipVal}`}
            ratio={tipType == 1 ? '' : val}
            selected={tipValue == val && !customTip}
            tipToggler={() => {
              this.setState(
                {
                  customTip: false,
                },
                () => {
                  this.tipToggler(val);
                }
              );
            }}
          />
        </div>
      );
    });

    let tipPart;
    if (!isShowTip) tipPart = null;
    if (isShowSign && isShowTip) {
      tipPart = (
        <div
          className={styles.content}
          style={{ width: isVertical ? '105rem' : '120rem' }}
        >
          <div className={styles.tipItems}>
            {configTipDom}
            {isShowNoTip && (
              <div className={styles.basicTip}>
                <TipBtn
                  id="noTip"
                  key="none"
                  text={t('no-tip')}
                  selected={tipValue === 0 && !customTip}
                  tipToggler={this.handleChooseNone}
                />
              </div>
            )}

            <div
              className={`${styles.basicTip} ${isShowNoTip ? styles.middleTip : isVertical ? '' : styles.largeTip}`}
            >
              <TipBtn
                id="customTip"
                key={'custom'}
                text={
                  customTip && tipValue ? (
                    <div>
                      <div>${tipValue}</div>
                    </div>
                  ) : (
                    t('custom')
                  )
                }
                selected={tipValue != null && customTip}
                tipToggler={this.showCustomTipInput}
              />
            </div>
          </div>
        </div>
      );
    } else if (isShowTip && !isShowSign) {
      tipPart = (
        <div className={styles.btnContainer}>
          <div className={styles.configTip}>
            {configTipDom}
            {isShowNoTip && (
              <div className={styles.basicTip}>
                <TipBtn
                  id="noTip"
                  key="none"
                  text={t('no-tip')}
                  selected={tipValue === 0 && !customTip}
                  tipToggler={this.handleChooseNone}
                />
              </div>
            )}
            <div
              className={`${styles.basicTip} ${isShowNoTip ? styles.middleTip : isVertical ? '' : styles.largeTip}`}
            >
              <TipBtn
                id="customTip"
                key={'custom'}
                text={
                  customTip && tipValue ? (
                    <div>
                      <div>${tipValue}</div>
                    </div>
                  ) : (
                    t('custom')
                  )
                }
                selected={tipValue != null && customTip}
                tipToggler={this.showCustomTipInput}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div
          className={`${styles.afterPayContainer} ${isShowSign && isShowTip ? styles.afterAllPayContainer : ''}`}
        >
          {this.renderTitle(isShowSign, isShowTip)}
          {tipPart}
          {isShowSign && (
            <Signature
              showTitle={false}
              agreement="bottom"
              customContainerStyle={{ width: '100%' }}
              handlePayTip={isShowTip && this.handlePayTip}
              signHeight={300}
              history={this.props.history}
            />
          )}
          {!isShowSign && (
            <div
              onClick={() => this.handlePayTip(false)}
              className={[
                styles.editBtn,
                this.state.tipValue === null
                  ? styles.noActived
                  : `${styles.actived} linear-animate-btn`,
              ].join(' ')}
            >
              {t('confirm')}
            </div>
          )}
        </div>

        <Dialog
          visible={inputCustomTip}
          html={
            <div
              className={styles.containerBox}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.itemBox}>
                <div className={styles.itemName}>{t('custom-tip')}</div>
                <div className={styles.inputCustomTipBox}>
                  {customNumber && <div className={styles.unit}>$</div>}
                  <input
                    ref={(el) => (this.customTipInputRef = el)}
                    max={1000}
                    min={0}
                    value={customNumber}
                    autoFocus={true}
                    className={styles.customInput}
                    type="number"
                    onChange={this.handleCustomChange}
                    onKeyUp={this.handleKeyUp}
                    onFocus={() => {
                      const isVertical = getDeviceOrientation() === 'vertical';
                      // 横屏模式下，如果使用原生键盘，触发键盘检测
                      if (!isVertical && !isOpenVtkeyboadrd()) {
                        setTimeout(() => {
                          if (this.keyboardManager) {
                            this.keyboardManager.handleKeyboardChange();
                          }
                        }, 300);
                      } else if (isOpenVtkeyboadrd()) {
                        this.showKeyboard();
                      }
                    }}
                    onBlur={() => {
                      const isVertical = getDeviceOrientation() === 'vertical';
                      // 键盘关闭时恢复样式
                      if (!isVertical && !isOpenVtkeyboadrd()) {
                        setTimeout(() => {
                          if (this.keyboardManager) {
                            this.keyboardManager.handleKeyboardClose();
                          }
                        }, 300);
                      }
                    }}
                    onClick={() => {
                      if (isOpenVtkeyboadrd()) {
                        this.showKeyboard();
                      }
                    }}
                  />
                </div>
              </div>
              <div className={styles.btnBox}>
                <span onClick={this.hideCustomTipInput}>{t('cancel')}</span>
                <span
                  onClick={this.handleConfirm}
                  className="linear-animate-btn"
                >
                  {t('confirm')}
                </span>
              </div>
            </div>
          }
          onClose={this.hideCustomTipInput}
        />

        <Loading visible={loading} />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardType={'number'}
            keyboardValue={customNumber}
            handlePressEnter={this.handleConfirm}
            changeInput={(v) => this.handleCustomChange(v, true)}
            closeKeyboard={() => this.hideKeyboard()}
            VKOuterStyle={{ zIndex: 9999 }}
          />
        ) : null}
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    allSysConfig: state.allSysConfig,
    cardPaidResult: state.cardPaidResult,
  };
}

export default connect(mapStateToProps, {
  saveTipAmount,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setSelfConfig,
  savePaymentId,
  setCardPaidResult,
  markPostPaymentAction,
})(withTranslation()(AfterCreditCardPay));
