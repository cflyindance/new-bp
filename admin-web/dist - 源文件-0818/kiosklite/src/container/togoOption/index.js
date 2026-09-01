import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './togoOption.module.scss';
import Alert from '@material-ui/lab/Alert';
import CardMinAmount from '@/component/cardMinAmount';
import SoldoutModal from '@/component/soldoutModal';
import CardPayTipModal from '@/component/cardPayTipModal';
import Loading from '@/component/loading';
import _ from 'lodash';
import Icon from '@/component/icon';
import {
  setTogoOption,
  clearTogoOption,
  setIsReorderFlag,
  spliceOrderBySoldout,
  payByCard,
  payByCash,
  setSelfConfig,
  setLocator,
  saveOrderResult,
} from '@/actions';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  judgeCharge,
  calcCardMinAmout,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import CallerBoard from '@/component/CallerBoard';
import Dialog from '@/component/dialog';
import { TOGONAMELIST } from '@/constants/mockData';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { navigatePartySizeIfNeeded } from '@/utils/navigatePartySizeIfNeeded';
import { runJudgeSMSAfterOperation } from '@/utils/runJudgeSMSAfterOperation';
import store from '@/reducers/store';

class TogoOption extends Component {
  constructor() {
    super();
    this.state = {
      isHasSoldoutDish: false,
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      isHasOrderCharge: false,
      showCallBoard: false,
      loading: false,
    };
    this.callBoardPromiseResolve = null;
  }

  backBtnHandler = () => {
    this.props.history.goBack();
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

  handleChoose = (e) => {
    const togoList = cloneDeep(this.props.togoList);
    let r = togoList.find((t) => t.id == e.id);
    if (r.select.id) {
      r.select = {};
    } else {
      r.select = e.select;
    }
    this.props.setTogoOption(togoList);
  };

  showCurrentChoosed = (id) => {
    const togoList = this.props.togoList;
    let r = togoList.find((t) => t.id == id);
    if (r.select?.id) {
      return true;
    } else {
      return false;
    }
  };

  // 是否选中一项
  isConfirm = () => {
    const togoList = this.props.togoList;
    let bool = togoList.some((t) => t.select.id);
    return bool;
  };

  // 跳过
  handleSkip = async () => {
    this.props.clearTogoOption();
    await this.judgeSMSAfterOperation();
  };

  // 判断是否开通SMS、及后续配置操作
  judgeSMSAfterOperation = async () => {
    const { selfConfig, systemConfig, setLocator, currentOrder } = this.props;

    // 默认加收打包盒，但不在页面上展示
    let taleBoxSelect = selfConfig?.charge?.find((t) => {
      return t.id === 4;
    });

    // 直接从 store 获取最新的 togoList，确保获取到清空后的最新值
    const togoList = cloneDeep(store.getState().togoList);
    if (taleBoxSelect?.select?.id) {
      for (let i = 0; i < togoList.length; i++) {
        if (togoList[i].id === 4) {
          togoList[i] = {
            id: taleBoxSelect?.id,
            name: togoList[i].name,
            select: taleBoxSelect?.select,
          };
          break;
        }
      }
      this.props.setTogoOption(togoList);
    }
    // 支付方式
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
    setLocator('');
    const locatorType = selfConfig?.configMap?.id_28;
    const togoShowNumCards = selfConfig?.configMap?.id_36; //togo时候是不是需要展示号码牌
    if (
      locatorType === 1 &&
      (currentOrder.orderType !== 'TO_GO' ||
        (currentOrder.orderType === 'TO_GO' && togoShowNumCards))
    ) {
      await this.showCallBoard();
    }
    // 有整单加收
    if (judgeCharge()) {
      // 仅开通卡支付
      if (paymentRouteResult.onlyCard) {
        this.setState({ isHasOrderCharge: true });
      } else {
        this.togoProcess();
      }
    } else {
      // 无整单加收、未开通小费，提示刷卡最低金额
      if (
        !selfConfig?.configMap?.id_5 &&
        calcCardMinAmout() &&
        paymentRouteResult.onlyCard
      ) {
        // 仅开通卡支付
        this.judgeConfigToSoldout(() => {
          this.setState({
            isShowCardMinModal: true,
            currentAmount: calcCardMinAmout(),
          });
        });
      } else {
        this.togoProcess();
      }
    }
  };

  togoProcess = async () => {
    const { systemConfig, selfConfig, store } = this.props;

    if (navigatePartySizeIfNeeded(this.props.history, selfConfig)) {
      return;
    }

    await runJudgeSMSAfterOperation({
      systemConfig,
      selfConfig,
      store,
      history: this.props.history,
      payByCard: this.props.payByCard,
      payByCash: this.props.payByCash,
      saveOrderResult: this.props.saveOrderResult,
      kioskConfigUserId: this.props.userId,
      judgeConfigToSoldout: this.judgeConfigToSoldout,
      judgeFillCardMinAmout: this.judgeFillCardMinAmout,
      setLoading: (loading) => this.setState({ loading }),
      onError: this.showApiModalTip,
    });
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
      this.togoProcess();
    }, 0);
  };

  handleCancelOrderCharge = () => {
    this.setState({ isHasOrderCharge: false });
  };

  handleConfirmOrderCharge = () => {
    const { selfConfig } = this.props;
    this.setState({ isHasOrderCharge: false });
    // 已经未开通打包带和餐具等加收项，再未开通小费，提示刷卡最低金额
    if (!selfConfig?.configMap?.id_5 && calcCardMinAmout()) {
      this.judgeConfigToSoldout(() => {
        this.setState({
          isShowCardMinModal: true,
          currentAmount: calcCardMinAmout(),
        });
      });
    } else {
      this.togoProcess();
    }
  };

  // 打开callerBoard弹框
  showCallBoard = () => {
    return new Promise((resolve) => {
      this.setState({
        showCallBoard: true,
      });
      this.callBoardPromiseResolve = resolve;
    });
  };

  closeCallBoard = (locatorVal) => {
    this.setState(
      {
        showCallBoard: false,
      },
      () => {
        if (!locatorVal) {
          return;
        } else {
          if (this.callBoardPromiseResolve) {
            this.callBoardPromiseResolve(true);
          }
        }
        if (this.callBoardPromiseResolve) {
          this.callBoardPromiseResolve = null;
        }
      }
    );
  };

  componentDidMount() {
    const { isReorderFlag } = this.props;
    // 若从上一个页面返回，传来的重新下单状态为true，则继续返回
    if (isReorderFlag) {
      this.backBtnHandler();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const { t, selfConfig, setLocator } = this.props;
    const {
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      isHasOrderCharge,
      showCallBoard,
    } = this.state;

    const togoOptList = [];
    selfConfig?.charge?.forEach((t) => {
      if (t.id == 2 || t.id == 3) {
        if (t.select?.id) {
          togoOptList.push(t);
        }
      }
    });
    const isConfirm = this.isConfirm();

    return (
      <div
        className={styles.togoPanel}
        style={{
          visibility: this.props.isReorderFlag ? 'hidden' : 'visible',
        }}
      >
        <div className={styles.togoPanelInner}>
          <div className={styles.togoPanelTitle}>{t('togo-option')}</div>
          <div className={styles.togoPanelBox}>
            {togoOptList.map((item) => {
              return (
                <div
                  key={item.id}
                  className={`${styles.togoItem} ${this.showCurrentChoosed(item.id) ? styles.togoItemActived : ''}`}
                  onClick={() => {
                    this.handleChoose(item);
                  }}
                >
                  {this.showCurrentChoosed(item.id) && (
                    <Icon type="check" size={7} className={styles.checkIcon} />
                  )}
                  <div className={styles.name}>
                    {t('togo-item', {
                      rate:
                        item.select.id == -1
                          ? t('free')
                          : `$${_.round(item.select.rate, 2).toFixed(2)}`,
                      name: t([TOGONAMELIST[item.id]]),
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.btnBox}>
          <div className={styles.never} onClick={this.handleSkip}>
            {t('skip')}
          </div>
          <div
            className={[
              isConfirm ? `${styles.actived} animate-btn` : styles.noActived,
            ].join(' ')}
            onClick={() => {
              if (isConfirm) {
                this.judgeSMSAfterOperation();
              }
            }}
          >
            {t('confirm')}
          </div>
        </div>

        <Dialog
          visible={showCallBoard}
          html={
            <CallerBoard
              tableServiceType="TO_GO"
              setLocator={setLocator}
              onClose={this.closeCallBoard}
            />
          }
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

        {isHasOrderCharge ? (
          <CardPayTipModal
            isHasOrderCharge={isHasOrderCharge}
            handleCancel={this.handleCancelOrderCharge}
            handleConfirm={this.handleConfirmOrderCharge}
          />
        ) : null}

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
    togoList: state.togoList,
    isReorderFlag: state.orderEdit.isReorderFlag,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setTogoOption,
    clearTogoOption,
    payByCard,
    payByCash,
    setIsReorderFlag,
    spliceOrderBySoldout,
    setSelfConfig,
    setLocator,
    saveOrderResult,
  })(withTranslation()(TogoOption))
);
