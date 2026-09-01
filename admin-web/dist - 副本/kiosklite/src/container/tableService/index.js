import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './tabelService.module.scss';
import Alert from '@material-ui/lab/Alert';
import SoldoutModal from '../../component/soldoutModal';
import CardMinAmount from '../../component/cardMinAmount';
import {
  payByCard,
  payByCash,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setTabelServiceType,
  setSelfConfig,
  setLocator,
  saveOrderResult,
} from '@/actions';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
} from '@/utils/busTools';
import CallerBoard from '@/component/CallerBoard';
import Dialog from '@/component/dialog';
import Loading from '@/component/loading';
import { navigatePartySizeIfNeeded } from '@/utils/navigatePartySizeIfNeeded';
import { runJudgeSMSAfterOperation } from '@/utils/runJudgeSMSAfterOperation';

class TabelService extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHasSoldoutDish: false,
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      loading: false,
      showCallBoard: false,
      locatorVal: null,
      tableServiceType: '',
      isShowDesc: false,
    };
    this.timer = null;
    this.callBoardPromiseResolve = null;
  }

  backBtnHandler = () => {
    this.props.history.goBack();
  };

  handleSelectOrderType = async (tableServiceType, isShowDesc) => {
    const { selfConfig, setTabelServiceType } = this.props;
    setTabelServiceType(tableServiceType);
    this.setState({ tableServiceType, isShowDesc });

    const chooseTableSwitch = selfConfig?.configMap?.id_39;
    if (chooseTableSwitch && isShowDesc) {
      this.props.history.push('./chooseTable');
      this.setState({ locatorVal: false });
      return Promise.resolve(false);
    }

    const locatorType = selfConfig?.configMap?.id_28;
    if (locatorType === 1) {
      this.setState({ showCallBoard: true });
      return new Promise((resolve) => {
        this.callBoardPromiseResolve = resolve;
      });
    }

    this.setState({ locatorVal: true });
    return Promise.resolve(true);
  };

  handleChoose = async () => {
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
      this.handleChoose();
    }, 0);
  };

  closeCallBoard = (locatorVal) => {
    this.setState(
      {
        showCallBoard: false,
        locatorVal,
      },
      () => {
        // 弹窗关闭后，调用resolve通知等待者继续执行
        if (this.callBoardPromiseResolve) {
          this.callBoardPromiseResolve(true);
          this.callBoardPromiseResolve = null;
        }
      }
    );
  };

  // 点击选项
  onServiceBoxClick = async (isShowDesc) => {
    const { setLocator } = this.props;
    setLocator('');
    const result = await this.handleSelectOrderType('DINE_IN', isShowDesc);
    if (!result || !this.state.locatorVal) return;
    this.handleChoose();
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
      showCallBoard,
      isShowDesc,
      tableServiceType,
    } = this.state;

    let serviceTitle = t('table-service-title');
    let isHasArr = selfConfig?.configMap?.id_4 || [];
    if (isHasArr.length !== 2) {
      if (isHasArr[0] == 0) {
        serviceTitle = t('pick-up-only');
      } else if (isHasArr[0] == 1) {
        serviceTitle = t('table-service-only');
      }
    }

    return (
      <div
        className={styles.serviceTypePanelOuter}
        style={{
          visibility: this.props.isReorderFlag ? 'hidden' : 'visible',
        }}
      >
        <div
          className={styles.serviceTypePanelInner}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div className={styles.serviceTypeMethod}>{serviceTitle}</div>
          <div className={styles.serviceTwoBox}>
            {isHasArr.includes(0) ? (
              <div
                className={`${styles.serviceType} ${styles.serviceType1}`}
                onClick={() => {
                  this.onServiceBoxClick(false);
                }}
              >
                <i></i>
                <span className={styles.title}>{t('pick-up')}</span>
              </div>
            ) : null}

            {isHasArr.includes(1) ? (
              <div
                className={`${styles.serviceType} ${styles.serviceType2}`}
                onClick={() => {
                  this.onServiceBoxClick(true);
                }}
              >
                <i></i>
                <span className={styles.title}>{t('table-service')}</span>
              </div>
            ) : null}
          </div>
        </div>

        <Dialog
          visible={showCallBoard}
          html={
            <CallerBoard
              tableServiceType={tableServiceType}
              setLocator={setLocator}
              isShowDesc={isShowDesc}
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
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    isReorderFlag: state.orderEdit.isReorderFlag,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    payByCard,
    payByCash,
    spliceOrderBySoldout,
    setIsReorderFlag,
    setTabelServiceType,
    setSelfConfig,
    setLocator,
    saveOrderResult,
  })(withTranslation()(TabelService))
);
