import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './tippingPanel.module.scss';
import Alert from '@material-ui/lab/Alert';
import Dialog from '@/component/dialog';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import TipBtn from '@/component/TipBtn';
import {
  saveTipAmount,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setSelfConfig,
} from '@/actions';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
} from '@/utils/busTools';
import { isOpenVtkeyboadrd, getDeviceOrientation } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';
import {
  calcTipAmount,
  getTipBasePrice,
  getTipConfig,
} from '@/utils/calcTipAmount';

import Big from 'big.js';

class TippingPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultTipList: [15, 20, 25],
      savetip: '',
      tipValue: null,
      customTip: false,
      customNumber: '',
      inputCustomTip: false,
      isHasSoldoutDish: false,
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      keyboardToggle: false,
    };
    this.timer = null;
    this.customTipInputRef = null;
    this.keyboardManager = null;
  }

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

  getTipContext = () => {
    const { store, allSysConfig, selfConfig } = this.props;
    const { defaultTipList } = this.state;
    const orderInfo = getOrderInfoObj(store);
    const totalPrice = getTipBasePrice(orderInfo, allSysConfig);
    const { tipType, tipIptList } = getTipConfig(selfConfig, defaultTipList);
    return { orderInfo, totalPrice, tipType, tipIptList };
  };

  calculateTipAmount = () => {
    const { tipValue, customTip } = this.state;
    const { totalPrice, tipType } = this.getTipContext();
    return calcTipAmount({ tipValue, customTip, tipType, totalPrice });
  };

  handleConfirm = () => {
    const val = this.state.customNumber;
    const numVal = Number(val);
    if (!val || Number.isNaN(numVal) || numVal < 0 || numVal > 1000) {
      return false;
    }
    this.setState({
      customTip: true,
      tipValue: Big(numVal).toFixed(2),
    });
    this.hideCustomTipInput();
  };

  handleCustomChange = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    // 只允许数字和小数点，不允许负号
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

  backBtnHandler = () => {
    this.props.history.goBack();
  };

  handleConfirmPay = () => {
    const tipAmount = this.calculateTipAmount();
    if (tipAmount === null) {
      return false;
    }
    this.setState(
      {
        savetip: tipAmount,
      },
      () => {
        this.props.saveTipAmount(tipAmount);
        // 已输入小费，再判断售罄情况，再判断是否符合刷卡最低消费
        this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
      }
    );
  };

  // 查询配置项、判断订单内，是否含售罄菜
  judgeConfigToSoldout = (fn) => {
    judgeConfigToSoldoutUtil(fn, {
      setSelfConfig: this.props.setSelfConfig,
      setState: this.setState.bind(this),
      showApiModalTip: this.showApiModalTip,
      reorder: this.reorder,
    });
  };

  // 判断是否满足刷卡最低消费金额
  judgeFillCardMinAmout = () => {
    const { savetip } = this.state;
    if (calcCardMinAmout(savetip)) {
      this.setState({
        isShowCardMinModal: true,
        currentAmount: calcCardMinAmout(savetip),
      });
    } else {
      this.props.history.push('/cardPayment');
    }
  };

  // 刷卡不足最小金额后，返回并继续点单
  handleContinueOrder = () => {
    this.setState({ isShowCardMinModal: false });
    this.reorder(true);
  };

  // 刷卡不足最小金额后，关闭弹框
  handleCloseMin = () => {
    this.setState({ isShowCardMinModal: false });
  };

  // 返回orderPage，重新点单
  reorder = (immediateBack = false) => {
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

  // 仍然下单
  continueReorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    setTimeout(() => {
      this.handleConfirmPay();
    }, 0);
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
    // 横屏模式下监听原生键盘弹出
    if (getDeviceOrientation() !== 'vertical') {
      this.keyboardManager = new LandscapeKeyboardManager(
        () => this.customTipInputRef
      );
      this.keyboardManager.setup();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
  }

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
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      keyboardToggle,
    } = this.state;
    const { totalPrice, tipType, tipIptList } = this.getTipContext();
    const isShowNoTip = selfConfig?.configMap?.id_27;

    const configTipDom = tipIptList.map((val, idx) => {
      let tipVal = Big(totalPrice).times(val).div(100).toFixed(2);
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

    const isVertical = getDeviceOrientation() === 'vertical';

    return (
      <div className={styles.panelContainer}>
        <div className={styles.panelTitle}>{t('choose_tip_description')}</div>
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
          <div
            className={[
              styles.confirmBtnContainer,
              tipValue === null
                ? styles.noActived
                : `${styles.actived} linear-animate-btn`,
            ].join(' ')}
            onClick={() => this.handleConfirmPay()}
          >
            {t('confirm')}
          </div>
        </div>

        {/* <BackIcon clickHandler={this.backBtnHandler}></BackIcon> */}

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
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    allSysConfig: state.allSysConfig,
  };
}

export default connect(mapStateToProps, {
  saveTipAmount,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setSelfConfig,
})(withTranslation()(TippingPanel));
