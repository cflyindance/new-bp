import React, { Component } from 'react';
import styles from './enterName.module.scss';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import Alert from '@material-ui/lab/Alert';
import VtKeyboard from '@/component/VtKeyboard';
import Dialog from '@/component/dialog';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import Loading from '@/component/loading';
import {
  payByCard,
  payByCash,
  spliceOrderBySoldout,
  setIsReorderFlag,
  customer,
  setSelfConfig,
  setAuthorizationDisplayName,
  setCustomerName,
  saveOrderResult,
} from '@/actions';
import { posFrontLog, saveCustomerInfo } from '@/api';
import { isOpenVtkeyboadrd, getDeviceOrientation } from '@/utils';
import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';
import { removeEmoji } from '@/utils/sanitizeInput';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
  judgeNeedPayOtherCharge,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import { pushPaymentMethodEntry } from '@/utils/tipProcedure';
import checkCRMStatus from '@/utils/checkCRMStatus';
import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import {
  calculateTotalAmount,
  processZeroAmountOrder,
} from '@/utils/processZeroAmountOrder';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';

class EnterName extends Component {
  constructor(props) {
    super(props);
    this.state = {
      maxLen: 50,
      keyboardToggle: false,
      enterNameStr: '', // props.currentOrder.customer?.firstName || '',
      isHasSoldoutDish: false,
      dishMap: {},
      errorLoading: false,
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      isHasName: false,
      loading: false,
    };
    this.timer = null;
    this.nameInputRef = null;
    this.keyboardManager = null;
    this.isSubmittingName = false;
    this.isSkipping = false;
    this.failedAction = null;
  }

  handleCancel = () => {
    this.failedAction = null;
    this.setState({
      errorLoading: false,
    });
  };

  handleRetry = () => {
    if (this.failedAction === 'skip') {
      this.handleSkip();
      return;
    }
    this.handleConfirmName();
  };

  handleResetEmpty = () => {
    this.setState({
      enterNameStr: '',
    });
  };

  backBtnHandler = () => {
    this.props.history.goBack();
    this.hideKeyboard();
  };

  // 文本域输入
  keyboardChange = (event) => {
    let value = removeEmoji(event.target.value);
    if (value.length > this.state.maxLen) {
      value = value.substr(0, this.state.maxLen);
      event.target.value = value;
    }
    this.setState({
      enterNameStr: value,
    });
  };

  // 监听回车键
  handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.handleConfirmName();
    }
  };

  onChange = (input) => {
    if (input.length > this.state.maxLen) {
      return;
    } else {
      this.setState({
        enterNameStr: input,
      });
    }
  };

  saveEnterName = async (nameStr) => {
    // 获取有没有输入过手机号
    const currentCustomer = this.props.currentOrder.customer;
    const currentPhone = currentCustomer?.phone?.[0];
    const phonenum = currentPhone?.number || '';

    try {
      const customerInfo = {
        id: '',
        firstName: '',
        phone: [
          {
            id: '',
            number: phonenum,
          },
        ],
      };
      this.props.customer(customerInfo);

      const response = await saveCustomerInfo(phonenum, nameStr);
      const result = response?.data?.result;
      const savedCustomer = response?.data?.customer;

      if (result?.successful) {
        if (!savedCustomer?.id || !savedCustomer?.phone?.[0]) {
          posFrontLog(
            '[EnterName] saveCustomerInfo returned an incomplete customer'
          );
        }
        const customerInfo = {
          id: savedCustomer?.id || currentCustomer?.id || '',
          firstName: nameStr,
          phone: [
            {
              id: savedCustomer?.phone?.[0]?.id || currentPhone?.id || '',
              number: phonenum,
            },
          ],
        };

        this.props.customer(customerInfo);
        await this.handleNevermind();
        return true;
      } else {
        this.failedAction = 'confirm';
        posFrontLog(
          `[EnterName] saveCustomerInfo failed: ${
            result?.failureReason || 'unknown reason'
          }`
        );
        this.setState({
          errorLoading: true,
        });
        return false;
      }
    } catch (error) {
      this.failedAction = 'confirm';
      posFrontLog(
        `[EnterName] save or route failed: ${error?.message || String(error)}`
      );
      this.setState({
        errorLoading: true,
      });
      return false;
    }
  };

  // 确认姓名
  handleConfirmName = async () => {
    if (this.isSubmittingName) {
      return false;
    }

    const nameStr = this.state.enterNameStr;
    if (!nameStr) {
      return false;
    }

    this.isSubmittingName = true;
    this.props.setCustomerName(nameStr);
    try {
      return await this.saveEnterName(nameStr);
    } finally {
      this.isSubmittingName = false;
    }
  };

  // 跳过
  handleSkip = async () => {
    if (this.isSkipping) {
      return false;
    }

    this.isSkipping = true;
    try {
      await this.handleNevermind();
      this.failedAction = null;
      return true;
    } catch (error) {
      this.failedAction = 'skip';
      posFrontLog(
        `[EnterName] skip route failed: ${error?.message || String(error)}`
      );
      this.setState({
        errorLoading: true,
      });
      return false;
    } finally {
      this.isSkipping = false;
    }
  };

  handleNevermind = async () => {
    const { systemConfig, selfConfig, store, payByCash, saveOrderResult } =
      this.props;
    const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
    const needPayForCharge = judgeNeedPayOtherCharge();

    // 计算总金额
    const totalAmount = calculateTotalAmount(store);

    // 只有免费菜并且没有其它加收项，或者总价为0
    if ((onlyHaveFreeItem && !needPayForCharge) || totalAmount === 0) {
      // 如果总价为0，使用零金额订单处理流程
      if (totalAmount === 0) {
        const { userId: kioskConfigUserId } = this.props;
        this.setState({ loading: true });
        const result = await processZeroAmountOrder({
          store,
          payByCash,
          saveOrderResult,
          userId: null, // 将从 store 中获取
          checksum: null, // 将从 store 中获取
          kioskConfigUserId,
          onError: (errMsg) => {
            this.setState({ loading: false });
            this.showApiModalTip(errMsg);
          },
        });
        this.setState({ loading: false });
        // 如果订单提交成功，跳转到订单完成页
        if (result) {
          this.props.history.push('/orderFinish');
        }
        return;
      }
      // 只有免费菜且有加收项，跳转到 paymentType
      this.judgeConfigToSoldout(() => {
        this.props.history.push('/paymentType');
      });
    } else {
      // 正常支付流程，使用 handlePaymentTypeRoute 判断支付方式路由
      this.judgeConfigToSoldout(() => {
        const paymentRouteResult = handlePaymentTypeRoute(
          systemConfig,
          selfConfig
        );

        if (paymentRouteResult.shouldSkipPaymentType) {
          // 跳过 paymentType，直接支付
          if (paymentRouteResult.canPayByCard) {
            // 只开通卡支付
            this.props.payByCard();
            // 是否开通小费（id:5）
            if (
              isTipEnabledForPaymentType(
                selfConfig,
                'CREDIT_CARD',
                this.props.systemConfig
              )
            ) {
              // 开通小费
              // 区分刷卡前小费
              const isPayFirst = selfConfig?.configList?.find(
                (each) => each.id === 24
              )?.value === 1;
              if (isPayFirst) {
                this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
              } else {
                this.props.history.push('/tippingPanel');
              }
            } else {
              // 未开通小费，再判断售罄情况，再判断是否符合刷卡最低消费
              this.judgeConfigToSoldout(this.judgeFillCardMinAmout);
            }
          } else if (paymentRouteResult.canPayByCash) {
            // 只开通现金支付 - 跳转到 paymentType
            this.props.history.push('/paymentType');
          }
        } else {
          // 多种支付方式或有 ecard，进入 paymentType 选择
          pushPaymentMethodEntry(
            this.props.history,
            selfConfig,
            systemConfig
          );
        }
      });
    }
  };

  // 判断是否满足刷卡最低消费金额
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

  // 刷卡不足最小金额后，返回并继续点单
  handleContinueOrder = () => {
    this.setState({ isShowCardMinModal: false });
    this.reorder(true);
  };
  // 刷卡不足最小金额后，关闭弹框
  handleCloseMin = () => {
    this.setState({ isShowCardMinModal: false });
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

  // 打开键盘
  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };

  // 关闭键盘
  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  // 键盘回车键
  handlePressEnter = () => {
    this.handleConfirmName();
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
      if (this.state.enterNameStr) {
        this.handleConfirmName();
      } else {
        this.handleNevermind();
      }
    }, 0);
  };

  componentDidMount() {
    const { isReorderFlag } = this.props;
    // 若从上一个页面返回，传来的重新下单状态为true，则继续返回
    if (isReorderFlag) {
      this.backBtnHandler();
    }
    this.handleGetDefaultName();
    // 横屏模式下监听原生键盘弹出
    if (getDeviceOrientation() !== 'vertical') {
      this.keyboardManager = new LandscapeKeyboardManager(
        () => this.nameInputRef
      );
      this.keyboardManager.setup();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      prevProps.currentOrder.isAuthorizationDisplayName !==
      this.props.currentOrder.isAuthorizationDisplayName
    ) {
      this.handleGetDefaultName();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
  }

  handleGetDefaultName = () => {
    const {
      crm: { memberCRMInfo },
      allSysConfig,
      currentOrder: {
        isAuthorizationDisplayName, // 是否已经授权展示名称
        customer: { firstName: inputName },
      },
    } = this.props;
    const isCRMDisabled = checkCRMStatus(allSysConfig);
    let defaultName = '';
    const { firstName, lastName } = memberCRMInfo;
    if (firstName || lastName) {
      defaultName = `${firstName || ''} ${lastName || ''}`.replace(
        /^\s+|\s+$/g,
        ''
      );
    }
    const name = inputName || (isCRMDisabled ? '' : defaultName);
    this.setState({
      isHasName: !!name,
      enterNameStr: isAuthorizationDisplayName ? name : '',
    });
  };

  handleAuthorizeName = () => {
    this.props.setAuthorizationDisplayName(true);
  };

  render() {
    const { t, currentOrder, selfConfig } = this.props;
    const {
      errorLoading,
      enterNameStr,
      keyboardToggle,
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      isHasName,
    } = this.state;

    const { isAuthorizationDisplayName } = currentOrder;

    return (
      <div
        className={styles.enterNamePage}
        style={{
          visibility: this.props.isReorderFlag ? 'hidden' : 'visible',
        }}
      >
        <div className={styles.enterNamePageBox}>
          <div className={styles.enterNameTitle}>{t('enter-your-name')}</div>
          {/* <div
            className={styles.enterNameSubTitle}
            dangerouslySetInnerHTML={{ __html: t('enter-your-name-tip') }}
          ></div> */}

          <div
            className={[
              styles.enterNameInput,
              !enterNameStr && styles.enterNoName,
            ].join(' ')}
          >
            <input
              ref={(el) => (this.nameInputRef = el)}
              autoFocus={false}
              maxLength={50}
              className={styles.searchIpt}
              onFocus={() => {
                window.scroll(0, 0);
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
                window.scroll(0, 0);
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
              placeholder={t('your-name')}
              onClick={(event) => {
                event.stopPropagation();
                if (isOpenVtkeyboadrd()) {
                  this.showKeyboard();
                }
              }}
              value={enterNameStr}
              onChange={this.keyboardChange}
              onKeyDown={this.handleKeyDown}
            />
            {/* {!!enterNameStr && (
              <Icon
                className={styles.iconEmpty}
                type="round_close_light"
                size={6}
                onClick={this.handleResetEmpty}
              />
            )} */}
          </div>

          {/* 未授权且有姓名展示授权按钮*/}
          {/* {!isAuthorizationDisplayName && isHasName && (
            <div
              className={styles.authorizationBox}
              onClick={this.handleAuthorizeName}
            >
              {t('authorizationDisplayName')}
            </div>
          )} */}

          {selfConfig?.configMap?.id_15 ? null : (
            <div
              className={styles.never}
              onClick={(event) => {
                event.stopPropagation();
                this.hideKeyboard();
                // 只清空姓名
                const resetname = cloneDeep(currentOrder.customer);
                resetname.firstName = '';
                this.props.customer(resetname);
                this.props.setCustomerName('');
                this.setState(
                  {
                    enterNameStr: '',
                  },
                  () => {
                    this.handleSkip();
                  }
                );
              }}
            >
              {t('skip')}
            </div>
          )}

          <div
            className={[
              styles.confirmCusTip,
              !!enterNameStr
                ? `${styles.actived} linear-animate-btn`
                : styles.noActived,
            ].join(' ')}
            onClick={(event) => {
              event.stopPropagation();
              this.hideKeyboard();
              if (!!enterNameStr) {
                this.handleConfirmName();
              }
            }}
          >
            {t('confirm')}
          </div>
        </div>

        {/* <BackIcon clickHandler={this.backBtnHandler}></BackIcon> */}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={enterNameStr}
            handlePressEnter={this.handlePressEnter}
            changeInput={this.onChange}
            closeKeyboard={this.hideKeyboard}
          />
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

        {/* 短信发送失败提示 */}
        <Dialog
          visible={errorLoading}
          html={
            <div
              className={styles.containerBox}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.itemBox}>
                <div className={styles.itemName}>{t('order-create-fail')}</div>
                <div className={styles.subItemName}>
                  {t('order-create-sub-fail')}
                </div>
              </div>
              <div className={styles.btnBox}>
                <span onClick={this.handleCancel}>{t('cancel-order')}</span>
                <span onClick={this.handleRetry} className="linear-animate-btn">
                  {t('order-retry')}
                </span>
              </div>
            </div>
          }
          onClose={this.handleCancel}
        />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
        <Loading visible={this.state.loading} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    currentOrder: state.currentOrder,
    isReorderFlag: state.orderEdit.isReorderFlag,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    crm: state.crm,
    allSysConfig: state.allSysConfig,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    payByCard,
    payByCash,
    spliceOrderBySoldout,
    setIsReorderFlag,
    customer,
    setSelfConfig,
    setAuthorizationDisplayName,
    setCustomerName,
    saveOrderResult,
  })(withTranslation()(EnterName))
);
