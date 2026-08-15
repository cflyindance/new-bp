import React, { Suspense, lazy } from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import './app.css';
import { Redirect } from 'react-router';
const MainPage = lazy(() => import('@/container/mainPage'));
const WaitList = lazy(() => import('@/container/waitList'));
const OrderType = lazy(() => import('@/container/orderType'));
const OrderPage = lazy(() => import('@/container/orderPage'));
const OrderReview = lazy(() => import('@/container/orderReview'));
const TogoOption = lazy(() => import('@/container/togoOption'));
const TableService = lazy(() => import('@/container/tableService'));
const PhoneInput = lazy(() => import('@/container/phoneInput'));
const EnterName = lazy(() => import('@/container/enterName'));
const PartySizeSelection = lazy(() => import('@/container/partySizeSelection'));
const PaymentType = lazy(() => import('@/container/paymentType'));
const TippingPanel = lazy(() => import('@/container/tippingPanel'));
const CardPayment = lazy(() => import('@/container/cardPayment'));
const OrderFinish = lazy(() => import('@/container/orderFinish'));
const Signature = lazy(() => import('@/container/signature'));
const ChooseTable = lazy(() => import('@/container/chooseTable'));
const ConnectionError = lazy(() => import('@/container/connectionError'));
const ConfigApp = lazy(() => import('@/container/configApp'));
const ScreenSaver = lazy(() => import('@/container/configApp/screenSaver'));
const MenuLabel = lazy(() => import('@/container/configApp/menuLabel'));
const DeviceSetting = lazy(() => import('@/container/configApp/deviceSetting'));
const ServiceSetting = lazy(
  () => import('@/container/configApp/serviceSetting')
);
const InventorySetting = lazy(
  () => import('@/container/configApp/inventorySetting')
);
const AllChargeSetting = lazy(
  () => import('@/container/configApp/allChargeSetting')
);
const PosterPro = lazy(() => import('@/container/PosterPro'));
const LoginGuide = lazy(() => import('@/container/configApp/loginGuide'));
import BackHomeCountDown from '../../component/backHomeCountDown';
import BackHomeTimeModal from '../../component/backHomeTimeModal';
import GlobalRewardCount from './GlobalRewardCount';
import LanModal from '../../component/lanModal';
import NetworkTip from '../../component/networkTip';
import LoadingText from '../../component/loadingText';
import Reward from '@/component/CRM/Rewards';
import { getCookie, solveScrollElem } from '@/utils';
import {
  registerKioskPosAvailabilitySetter,
  unregisterKioskPosAvailabilitySetter,
} from '@/utils/notifyPosConnectionAfterSessionRenewal';
import AfterCreditCardPay from '../afterCreditCardPay/index';
import BrandSetting from '../configApp/BrandSetting';
import Promotion from '../configApp/Promotion';
import { EventBus } from '@/utils/EventBus';
import { getMarginappFetchConfig, posFrontLog } from '@/api';
import Dialog from '../../component/dialog';
import LoginCRM from '../../component/CRM/LoginCRM';
import { setSequenceNumber } from '@/actions';
import KioskModal from '@/component/KioskModal';
import LostConnection from '@/component/LostConnection';
import { isConfigSettingRoute } from '@/constants/ConfigSettingRoute';
import { getKioskHomePath } from '@/constants/mockData';
import Footer from '@/component/Footer';
import ThemeProvider from '@/context/ThemeContext';
import { setIsMemberOrderedBefore } from '@/actions/crm_action';
import CrmPromotionMutual from './CrmPromotionMutual';
import styles from './index.module.scss';
import FallbackLoading from '@/component/FallbackLoading';
import CloudPromotion from '@/component/CloudPromotionCenter';
import SocketPage from '@/container/mainPage/socketPage';
import isEqual from 'lodash/isEqual';
import {
  isPaymentInProgress,
  shouldCancelOrderBeforeHome,
} from '@/utils/paymentCountdown';

const modalWaitTime = 5;

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      loading: false,
      time: modalWaitTime,
      isAvailable: true,
      pollingFailureReason: null,
    };
    this.homeRef = null;
    this.timeInterval = null;
    this.pollingTimer = null;
  }

  backHome = () => {
    solveScrollElem(false);
    clearInterval(this.timeInterval);
    if (
      isPaymentInProgress(
        window.location.hash,
        this.props.currentOrder?.orderStatus
      )
    ) {
      this.setState({ time: modalWaitTime, loading: false });
      this.homeRef.handleCancel();
      return;
    }
    this.setState(
      {
        time: modalWaitTime,
        loading: false,
      },
      () => {
        // 关闭lang
        this.homeRef.handleLang(false);
        if (
          shouldCancelOrderBeforeHome(
            window.location.hash,
            this.props.currentOrder?.saveOrderResult?.id
          )
        ) {
          this.homeRef.handleCancelOrder();
        } else {
          this.props.history.push(getKioskHomePath());
          EventBus.emit('close_brand_modal');
        }
      }
    );
  };

  countDown = () => {
    if (
      isPaymentInProgress(
        window.location.hash,
        this.props.currentOrder?.orderStatus
      )
    ) {
      this.setState({ time: modalWaitTime, loading: false });
      clearInterval(this.timeInterval);
      this.homeRef.handleCancel();
      return;
    }
    if (this.state.time > 0) {
      this.setState({
        time: this.state.time - 1,
      });
    }
  };

  changeModel = () => {
    if (this.state.loading) {
      solveScrollElem(false);
      clearInterval(this.timeInterval);
      this.setState({
        loading: false,
        time: modalWaitTime,
      });
    } else {
      solveScrollElem(true);
      this.setState({
        loading: true,
      });
      this.timeInterval = setInterval(this.countDown, 1000);
    }
  };

  initRef = (ref) => {
    this.homeRef = ref;
  };

  judgeSameMenuItemById = (menuItem, oldMenuItem) => {
    const ids = Object.keys(menuItem);
    const oIds = Object.keys(oldMenuItem);
    return isEqual(ids, oIds);
  };

  componentDidUpdate(prevProps) {
    // 检查会员是否首单
    if (
      prevProps.crm.memberCRMInfo?.phone !== this.props.crm.memberCRMInfo?.phone
    ) {
      if (!this.props.crm.memberCRMInfo?.phone) {
        this.props.setIsMemberOrderedBefore(true);
      }
    }
    if (this.state.time <= 0) {
      this.backHome();
    }
  }

  // 检查POS连接状态的方法
  checkPosConnection = async () => {
    try {
      // 不在配置页进行轮询
      if (isConfigSettingRoute()) return;
      // 无session key时不进行请求，但需更新状态以便 LostConnection 等能反映断连
      if (!getCookie('sessionKey')) {
        // 尚未选择 license 时无 session 属正常，不可置断连，否则 LostConnection 全屏遮挡无法选 license
        if (!getCookie('kioskLicense')) {
          if (!this.state.isAvailable || this.state.pollingFailureReason) {
            this.setState({
              isAvailable: true,
              pollingFailureReason: null,
            });
          }
          return;
        }
        posFrontLog(
          `Kiosk App Error: check pos connection failed since no session key`
        );
        this.setState({
          isAvailable: false,
          pollingFailureReason: 'No session key',
        });
        return;
      }
      const res = await getMarginappFetchConfig({ timeout: 15000 });
      if (res?.data?.result?.successful) {
        this.setState({
          isAvailable: true,
          pollingFailureReason: null,
        });
        // 通知 mainPage 连接已恢复，可以清除错误弹窗
        EventBus.emit('posConnectionRestored');
        return;
      }
      // 未选择license时
      if (!getCookie('kioskLicense')) return;
      // 接口获取失败
      this.setState({
        isAvailable: false,
        pollingFailureReason: res?.data.result.failureReason,
      });
    } catch (error) {
      // 联网状态 请求不到 -> 终端被关闭
      if (window.navigator.onLine) {
        // 用于 LostConnection 记录日志
        let pollingFailureReason = ''; // Kiosk network connection status: online
        if (error.response) {
          pollingFailureReason += `Response error: ${error.response.status}`;
        } else if (error.request) {
          // pollingFailureReason += `, Network error: No response received`;
        } else {
          pollingFailureReason += `disconnect to pos`;
        }
        this.setState({
          isAvailable: false,
          pollingFailureReason,
        });
      }
    }
  };

  componentDidMount() {
    registerKioskPosAvailabilitySetter(() => {
      this.setState({
        isAvailable: true,
        pollingFailureReason: null,
      });
    });
    // 启动定时轮询
    this.pollingTimer = setInterval(this.checkPosConnection, 5000);
  }

  componentWillUnmount() {
    unregisterKioskPosAvailabilitySetter();
    clearInterval(this.pollingTimer);
  }

  render() {
    const { isAvailable, pollingFailureReason } = this.state;
    const { lanModalshow, isUpdateMenu, currentOrder } = this.props;
    //console.log('currentOrder', currentOrder.itemList);
    return (
      <ThemeProvider.Consumer>
        {({ theme }) => (
          <div
            className={styles.appContent}
            data-theme={theme.themeName}
            style={{
              '--primary-color': theme.primary,
              '--primary-secondary-color': theme.secondary,
            }}
          >
            {/* top bar + 倒计时 */}
            <BackHomeCountDown
              timeOver={this.changeModel}
              onRef={this.initRef}
            />
            {/* crm活动弹窗 + 全局校验 */}
            <GlobalRewardCount />
            {/* crm promotion 互斥弹窗 */}
            <CrmPromotionMutual />
            {/* crm引导bar */}
            <LoginCRM />
            <KioskModal />
            {/*促销中台 + 全局促销校验*/}
            <CloudPromotion />
            {/* WebSocket：App 层常驻，路由切换不断连 */}
            <SocketPage />
            <Suspense fallback={<FallbackLoading />}>
              <Switch>
                <Route
                  exact
                  path="/"
                  render={(props) => <MainPage {...props} />}
                />
                <Route
                  path="/waitList"
                  render={(props) => <WaitList {...props} />}
                />
                <Route
                  path="/orderType"
                  render={(props) => <OrderType {...props} />}
                />
                <Route
                  path="/orderPage"
                  render={(props) => <OrderPage {...props} />}
                />
                {/*<Route path="/comboPanel" component={ComboPanel} />*/}
                <Route
                  path="/orderReview"
                  render={(props) => <OrderReview {...props} />}
                />
                <Route
                  path="/togoOption"
                  render={(props) => <TogoOption {...props} />}
                />
                <Route
                  path="/tabelService"
                  render={(props) => <TableService {...props} />}
                />
                <Route
                  path="/phoneInput"
                  render={(props) => <PhoneInput {...props} />}
                />
                <Route
                  path="/reward"
                  render={(props) => <Reward {...props} />}
                />
                <Route
                  path="/enterName"
                  render={(props) => <EnterName {...props} />}
                />
                <Route
                  path="/partySizeSelection"
                  render={(props) => <PartySizeSelection {...props} />}
                />
                <Route
                  path="/paymentType"
                  render={(props) => <PaymentType {...props} />}
                />
                <Route
                  path="/tippingPanel"
                  render={(props) => <TippingPanel {...props} />}
                />
                <Route
                  path="/cardPayment"
                  render={(props) => <CardPayment {...props} />}
                />
                <Route
                  path="/afterCreditCardPay"
                  render={(props) => <AfterCreditCardPay {...props} />}
                />
                <Route
                  path="/signature"
                  render={(props) => (
                    <Signature {...props} isStandalonePage={true} />
                  )}
                />
                <Route
                  path="/orderFinish"
                  render={(props) => <OrderFinish {...props} />}
                />
                <Route
                  path="/chooseTable"
                  render={(props) => <ChooseTable {...props} />}
                />
                <Route
                  path="/connectionError"
                  render={(props) => <ConnectionError {...props} />}
                />
                <Route
                  path="/configApp"
                  render={(props) => <ConfigApp {...props} />}
                />
                <Route
                  path="/serviceSetting"
                  render={(props) => <ServiceSetting {...props} />}
                />
                <Route
                  path="/deviceSetting"
                  render={(props) => <DeviceSetting {...props} />}
                />
                <Route
                  path="/screenSaver"
                  render={(props) => <ScreenSaver {...props} />}
                />
                <Route
                  path="/menuLabel"
                  render={(props) => <MenuLabel {...props} />}
                />
                <Route
                  path="/posterPro"
                  render={(props) => <PosterPro {...props} />}
                />
                <Route
                  path="/inventorySetting"
                  render={(props) => <InventorySetting {...props} />}
                />
                <Route
                  path="/allChargeSetting"
                  render={(props) => <AllChargeSetting {...props} />}
                />
                <Route
                  path="/brandSetting"
                  render={(props) => <BrandSetting {...props} />}
                />
                <Route
                  path="/promotion"
                  render={(props) => <Promotion {...props} />}
                />
                <Route
                  path="/loginGuide"
                  render={(props) => <LoginGuide {...props} />}
                />
                <Redirect from="/:id" to="/" />
              </Switch>
            </Suspense>
            <Footer />

            {/* 倒计时返回首页弹框 */}
            <BackHomeTimeModal
              loading={this.state.loading}
              time={this.state.time}
              backHome={this.backHome}
              changeModel={this.changeModel}
            />

            {/* 多语言 */}
            {lanModalshow ? <LanModal lanModal={lanModalshow} /> : null}

            {/* 网络异常提示弹框 */}
            <NetworkTip />
            {/* 网络正常 但是和pos断链/session key 失效*/}
            <Dialog
              outerStyle={{ zIndex: 9999 }}
              visible={!isAvailable}
              html={
                <LostConnection
                  isAvailable={isAvailable}
                  pollingFailureReason={pollingFailureReason}
                />
              }
            />

            {/* 菜单组更新loading */}
            <LoadingText visible={isUpdateMenu} textKey={3} />
          </div>
        )}
      </ThemeProvider.Consumer>
    );
  }
}

function mapStateToProps(state) {
  return {
    crm: state.crm,
    lanModalshow: state.lanModal.lanModalshow,
    isUpdateMenu: state.orderEdit.isUpdateMenu,
    currentOrder: state.currentOrder,
    orderSequence: state.orderSequence,
    menuItemList: state.menuItemList,
    promotion: state.promotion,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setSequenceNumber,
    setIsMemberOrderedBefore,
  })(App)
);
