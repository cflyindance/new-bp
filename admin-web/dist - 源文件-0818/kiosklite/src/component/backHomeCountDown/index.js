import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './backHomeCountDown.module.scss';
import homeBGI from '@/assets/images/home-new.png';
import arrowRight from '@/assets/images/arrow-right.png';
import BackHomeModal from '@/component/backHomeModal';
import InputSearch from '@/component/inputSearch';
import Icon from '@/component/icon';
import {
  initSystemStore,
  setLanModal,
  setTableId,
  recountCurrentOrderList,
} from '@/actions';
import {
  homeHash,
  configPages,
  getKioskHomePath,
  systemLanguage,
} from '@/constants/mockData';
import { source, saveOrder } from '@/api';
import { getOrderInfo } from '@/api/apiPos';
import { solveScrollElem, judgeSskeyIsActiveTime } from '@/utils';
import { XMLObjTree } from '@/utils/ObjectTree';
import { orderLockProcedure } from '@/utils/orderLock';
import packagePath from '@/utils/PackagePath';
import LangSwitch from '@/component/LangSwitch';
import NetworkStatus from '@/component/NetworkStatus';
import MobyStatus from '@/component/MobyStatus';
import MobyBattery from '@/component/MobyBattery';
import { getChooseTableStatus } from '@/utils/chooseTable';
import { changeFreeItem, changeSelectedDiscount } from '@/actions/crm_action';
import { changeRewardModalVisible } from '@/actions/avocado';
import checkCRMStatus from '@/utils/checkCRMStatus';
import { EventBus } from '@/utils/EventBus';
import Toast from '@/component/toast';
import POINTS from '@/assets/images/points.png';
import {
  canCancelPosOrder,
  isPaymentInProgress,
} from '@/utils/paymentCountdown';

/** moby（INGENICO）且在刷卡页时延长无操作返回时间，其余页面与其它支付方式为 60s */
const getBackHomeDefaultSeconds = () =>
  process.env.NODE_ENV === 'development'
    ? 600
    : window.location.hash.indexOf('cardPayment') > -1
      ? 180
      : 60;

// 不需要展示返回键的页面
const pathList = [
  // 'waitList',
  // 'orderType',
  // 'togoOption',
  // 'tabelService',
  // 'phoneInput',
  // 'enterName',
  // 'paymentType',
  // 'tippingPanel',
  // 'reward',
  // 'orderFinish',
  'connectionError',
  'cardPayment',
  'signature',
  'afterCreditCardPay',
];

const UNSHOW_PAGE = packagePath(pathList);
const getHashPath = (hash = window.location.hash) => hash.split('?')[0];
const getIsHideBackBtn = (hash, saveOrderResultId) =>
  UNSHOW_PAGE.includes(getHashPath(hash)) ||
  (saveOrderResultId && hash.includes('paymentType'));
const ORDER_TYPE_ALLOW_HOME_NAVIGATION_FLAG =
  '__kioskOrderTypeAllowHomeNavigation';
class BackHomeCountDown extends Component {
  constructor(props) {
    super(props);
    const hash = window.location.hash;
    this.state = {
      timer: getBackHomeDefaultSeconds(),
      loading: false,
      isHideBackBtn: getIsHideBackBtn(
        hash,
        props.currentOrder?.saveOrderResult?.id
      ),
      isHome: homeHash.includes(hash),
      isOrderPage: hash.indexOf('/orderPage') > -1,
      currentPath: hash,
      isHideHeader: configPages(),
    };
    this.timerId = null;
  }

  setLoading = (e) => {
    solveScrollElem(e);
    this.setState({ loading: e });
  };

  handleLang = (flag) => {
    this.props.setLanModal(flag);
  };

  markOrderTypeHomeNavigationIntent = (sourceName) => {
    if (window.location.hash.indexOf('/orderType') === -1) return;
    window[ORDER_TYPE_ALLOW_HOME_NAVIGATION_FLAG] = true;
  };

  // 不需要展示选择语言图标（waitList，仅一种语言什么都不展示，两种语言展示开关，多于两种是弹窗）
  judegIsShowLangIcon = () => {
    const { selfConfig } = this.props;
    const isOpenLan = selfConfig?.configMap?.id_10?.length > 2;
    if (window.location.hash.indexOf('waitList') > -1) {
      return false;
    } else {
      return isOpenLan;
    }
  };
  // 展示语言开关
  judegIsShowLangSwitch = () => {
    const { selfConfig } = this.props;
    const isOpenLanSwitch = selfConfig?.configMap?.id_10?.length === 2;
    if (window.location.hash.indexOf('waitList') > -1) {
      return false;
    } else {
      return isOpenLanSwitch;
    }
  };

  countDown = () => {
    if (
      isPaymentInProgress(
        window.location.hash,
        this.props.currentOrder?.orderStatus
      )
    ) {
      if (this.state.timer !== getBackHomeDefaultSeconds()) {
        this.setState({ timer: getBackHomeDefaultSeconds() });
      }
      return;
    }
    if (this.state.timer > 0) {
      const timer = this.state.timer - 1;

      if (this.state.isHome) {
        // 60s，重置为en
        // if (this.state.timer == getBackHomeDefaultSeconds() - 60) {
        //   this.handleLang(false);
        //   this.props.i18n.changeLanguage(this.props.currentLanguage);
        // }
      }
      this.setState({
        timer,
      });
    } else {
      this.setState({
        timer: getBackHomeDefaultSeconds(),
      });
      if (this.state.isHome) {
        // 初始化
        this.handleLang(false);
        this.props.i18n.changeLanguage(this.props.currentLanguage);
        this.props.initSystemStore();
      } else {
        this.props.timeOver();
      }
    }
  };

  handleContinue = () => {
    this.markOrderTypeHomeNavigationIntent('handleContinue');
    this.setLoading(false);
    if (homeHash.includes(window.location.hash)) {
      window.location.reload();
    } else {
      // 如果在刷卡机页面，返回首页时，则取消请求
      if (window.location.hash.indexOf('cardPayment') > -1) {
        source.cancel({ type: 'cancel', msg: 'xhr取消请求' });
      } else if (window.location.hash.indexOf('connectionError') > -1) {
        // 如果错误页面返回，取消订单
        judgeSskeyIsActiveTime().then(() => this.handleCancelOrder());
      } else {
        this.props.history.push(getKioskHomePath());
      }
    }
  };

  // 返回上一页
  handleReturnPrePage = () => {
    this.markOrderTypeHomeNavigationIntent('handleReturnPrePage');
    // 新增兑换弹窗 不能在后退时清除
    // if (window.location.hash.indexOf('reward') > -1) {
    //   // 如果积分兑换页面返回，清除选中的兑换信息
    //   this.props.changeFreeItem([]);
    //   this.props.changeSelectedDiscount({});
    // }
    if (window.location.hash.indexOf('chooseTable') > -1) {
      // 如果选桌子页面返回，清除选中的信息
      this.props.setTableId(null);
      getChooseTableStatus(true);
    }
    if (window.location.hash.indexOf('connectionError') > -1) {
      // 如果错误页面返回，取消订单
      judgeSskeyIsActiveTime().then(() => this.handleCancelOrder());
    }
    this.props.history.goBack();
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

  // 取消订单（查询当前订单是否是在pos上面支付成功（status: "PAID"））
  handleCancelOrder = async () => {
    const { currentOrder, userId } = this.props;
    const data = {
      targetId: currentOrder?.saveOrderResult?.id,
      userId,
    };
    const onErrCb = () => {
      this.props.history.push(getKioskHomePath());
    };
    if (!data.targetId) {
      onErrCb();
      return;
    }
    const res = await orderLockProcedure(data, onErrCb);
    if (!res) {
      return;
    }
    if (currentOrder?.saveOrderResult?.id) {
      getOrderInfo(currentOrder.saveOrderResult.id).then((res) => {
        let r = res.data ? this.parseLicenseXml(res.data) || {} : {};
        // 只有ordered订单允许cancel
        if (canCancelPosOrder(r?.status)) {
          const cancelOrderObj = {
            // 取消订单 需要清除之前参与的促销信息
            order: {
              ...currentOrder?.saveOrderResult,
              needCommit: '2',
              discountList: '[]',
            },
          };
          cancelOrderObj.order.status = 'CANCELED';
          if (cancelOrderObj.order?.orderItems?.length) {
            cancelOrderObj.order.orderItems.map((item) => {
              item.status = 'CANCELED';
            });
          }
          saveOrder(cancelOrderObj)
            .then(() => {
              this.props.history.push(getKioskHomePath());
            })
            .catch(() => {
              this.props.history.push(getKioskHomePath());
            });
        } else {
          this.props.history.push(getKioskHomePath());
        }
      });
    } else {
      onErrCb();
    }
  };

  handleCancel = () => {
    this.setState({
      timer: getBackHomeDefaultSeconds(),
    });
    this.setLoading(false);
  };

  componentDidMount() {
    this.props.onRef(this);

    if (configPages()) {
      clearInterval(this.timerId);
    } else {
      this.timerId = setInterval(this.countDown, 1000);
    }

    window.onclick = () => {
      this.setState({ timer: getBackHomeDefaultSeconds() });
    };
    window.oninput = () => {
      this.setState({ timer: getBackHomeDefaultSeconds() });
    };
    if (
      'ontouchstart' in window ||
      (window.DocumentTouch && document instanceof DocumentTouch)
    ) {
      window.ontouchstart = () => {
        this.setState({ timer: getBackHomeDefaultSeconds() });
      };
      window.ontouchmove = () => {
        this.setState({ timer: getBackHomeDefaultSeconds() });
      };
      window.ontouchend = () => {
        this.setState({ timer: getBackHomeDefaultSeconds() });
      };
      window.ontouchcancel = () => {
        this.setState({ timer: getBackHomeDefaultSeconds() });
      };
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentPath != window.location.hash) {
      this.setState(
        {
          timer: getBackHomeDefaultSeconds(),
          currentPath: window.location.hash,
          isHideBackBtn: getIsHideBackBtn(
            window.location.hash,
            this.props.currentOrder.saveOrderResult.id
          ),
          isHome: homeHash.includes(window.location.hash),
          isOrderPage: window.location.hash.indexOf('/orderPage') > -1,
          isOrderFinish: window.location.hash.indexOf('/orderFinish') > -1,
          isOrderReview: window.location.hash.indexOf('/orderReview') > -1,
          isHideHeader: configPages(),
        },
        () => {
          if (this.state.isHome) {
            this.setLoading(false);
          }
        }
      );
    }
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  handleClickHome = () => {
    const { currentOrder } = this.props;
    const isShowModal = currentOrder?.itemList?.length > 0;
    if (isShowModal) {
      this.setLoading(true);
    } else {
      this.handleContinue();
    }
  };

  handleClickBack = () => {
    const {
      currentOrder,
      promotionList,
      isSkipPromotionCalculation,
      recountCurrentOrderList,
    } = this.props;
    const isShowModal = currentOrder?.itemList?.length > 0;
    if (isShowModal && window.location.hash.indexOf('/orderType') > -1) {
      this.setLoading(true);
    } else {
      this.handleReturnPrePage();
    }
    // else if (
    //     isShowModal &&
    //     window.location.hash.indexOf('/orderReview') > -1
    //   ) {
    //     if (promotionList?.length > 0 && !isSkipPromotionCalculation) {
    //       recountCurrentOrderList();
    //     }
    //     this.handleReturnPrePage();
    //   }
  };

  handleEarnReward = () => {
    const {
      t,
      crm: { memberCRMInfo },
      changeRewardModalVisible,
      avocado: { hasAssertList },
    } = this.props;

    const isLogin = Object.keys(memberCRMInfo)?.length > 0;
    hasAssertList
      ? changeRewardModalVisible(true)
      : !isLogin
        ? EventBus.emit('open_login_modal')
        : Toast.info(t('havenotAssert'), 2000);
  };

  render() {
    const {
      t,
      crm: { memberCRMInfo },
      i18n: { language },
      allSysConfig,
    } = this.props;
    const {
      isHideBackBtn,
      loading,
      isHome,
      isOrderPage,
      isOrderFinish,
      isOrderReview,
      isHideHeader,
    } = this.state;

    let bool = this.judegIsShowLangIcon();
    let langSwitchOpen = this.judegIsShowLangSwitch();
    const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;
    const isLogin = Object.keys(memberCRMInfo)?.length > 0;

    const isCRMDisabled = checkCRMStatus(allSysConfig);
    const isShowEarnReward = (isOrderPage || isOrderReview) && !isCRMDisabled;
    // 需要直接返回首页的页面
    const returnHomePage = isOrderPage || isOrderFinish;

    return (
      <React.Fragment>
        <div
          className={styles.logoBox}
          style={{
            zIndex: isHome ? -1 : 1,
            display: isHideHeader || isHome ? 'none' : 'flex',
          }}
        >
          {isHideBackBtn ? (
            <div></div>
          ) : (
            <div
              className={styles.indicatorWrapper}
              onClick={
                returnHomePage ? this.handleClickHome : this.handleClickBack
              }
            >
              {/* home按钮  */}
              {returnHomePage ? (
                <img src={homeBGI} className={styles.homeBtn} />
              ) : (
                // 返回按钮
                <img src={arrowRight} className={styles.backPrePage} />
              )}
            </div>
          )}
          <div className={styles.navigateRight}>
            {isShowEarnReward && (
              <div
                className={`${styles.earnReward} ${isLogin ? styles.earnRewardLogin : ''}`}
                onClick={this.handleEarnReward}
              >
                <img src={POINTS} alt="points" className={styles.pointsImg} />
                <span>{t('earn-reward')}</span>
              </div>
            )}
            {isOrderPage && <InputSearch />}
            {!isHome && langSwitchOpen && <LangSwitch />}
            {!isHome && bool && (
              <div
                className={styles.langIcon}
                onClick={() => {
                  this.handleLang(true);
                }}
              >
                <Icon
                  className={styles.languageIcon}
                  type="language"
                  size={3.4}
                  color="#000"
                />
                <div>{langTxt}</div>
                {/* <span></span> */}
              </div>
            )}
            <NetworkStatus />
            <MobyStatus />
            <MobyBattery />
            {!isHideBackBtn && !returnHomePage && (
              <div
                className={styles.indicatorWrapper}
                onClick={this.handleClickHome}
              >
                <img
                  src={homeBGI}
                  className={`${styles.homeBtn} ${styles.rightHome}`}
                />
              </div>
            )}
          </div>
        </div>

        {/* 返回首页comfirm */}
        <BackHomeModal
          isShowModal={loading}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    currentLanguage: state.language.currentLanguage,
    crm: state.crm,
    userId: state.sysCookie.kioskConfigUserId,
    allSysConfig: state.allSysConfig,
    avocado: state.avocado,
    promotionList: state.promotion.promotionList,
    isSkipPromotionCalculation: state.promotion.isSkipPromotionCalculation,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    initSystemStore,
    setLanModal,
    changeFreeItem,
    changeSelectedDiscount,
    setTableId,
    changeRewardModalVisible,
    recountCurrentOrderList,
  })(withTranslation()(BackHomeCountDown))
);
