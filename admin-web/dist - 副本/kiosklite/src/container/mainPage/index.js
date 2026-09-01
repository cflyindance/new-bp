import React from 'react';
import { connect } from 'react-redux';
import Picker from 'react-mobile-picker';
import { withTranslation } from 'react-i18next';
import styles from './mainPage.module.scss';
import dishShu from '@/assets/images/dish-v.jpg';
import dishHeng from '@/assets/images/dish-h.png';
import logo from '@/assets/images/logo.png';
import Icon from '@/component/icon';
import Dialog from '@/component/dialog';
import Loading from '@/component/loading';
import { postMarginappConfig } from '@/api/kioskConfigApi';
import {
  setLanModal,
  setLanModalFn,
  clearPayType,
  initParams,
  initCompanyParams,
  initConfigParams,
  resetCurrentOrder,
  clearSearchKeyWord,
  setSelfConfig,
  setImg,
  setLogo,
  initSystemStore,
  setLang,
  initMenuGroupList,
  initMenuGroup2,
  refreshMenuStockNumIfChanged,
  setIsMenuUpdated,
  changeOrderType,
  setCateyPageDomTop,
  setorderPageDomTop,
  setUpdateMenuLoad,
  setSelectedBrand,
  setBrandMenu,
  setBanner,
  setBannerPro,
  setShowBanner,
  setShowBannerPro,
  setShowLoginGuideDialog,
  setShowWaitingTimeModal,
  setLicenseList,
  setTableId,
  setShowScreensaver,
  setMobyDeviceLinkStatus,
  setExpandFreeList,
  setMobyDeviceInfo,
  setTriposPayReady,
  setTriposPayFinish,
  saveTipAmount,
  recordKioskDiscountPromotion,
  setECardSettings,
  setGiftCardPaymentInfo,
} from '@/actions';
import {
  setPromotion,
  setBuyGiftRule,
  setExchangePurchaseRule,
  setBuyDiscountRule,
  setOrderDiscount,
  setCloudPromotion,
  setPromotionCode,
  setIsPauseAutoValidatePromotion,
} from '@/actions/promotion';
import {
  setCRMAuthCodeVerified,
  setFreeItemMenuPosition,
} from '@/actions/crm_action';
import {
  fetchSessionKey,
  fetchSystemConfig,
  fetchSystemConfigAllList,
  fetchTaxInfo,
  fetchCompanyProfile,
  fetchMenuGroup,
  fetchItemSizeList,
  getSecretKey,
  saveSecretKey,
  getMarginappFetchConfig,
  posFrontLog,
} from '@/api';
import { getKioskPosterPro } from '@/api/kioskConfigApi';
import { getECardSettings } from '@/api/eCard';
import {
  getLicenseList,
  getLicenseInfo,
  getPayDevices,
} from '@/api/apiPos';
import { EventBus } from '@/utils/EventBus';
import { promiseFinally } from '@/utils/promiseFinally';
import { XMLObjTree } from '@/utils/ObjectTree';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { clearImagePathCache } from '@/utils/imagePathCache';
import getLanguageBtnDisplayText from '@/utils/getLanguageBtnDisplayText';
import {
  on,
  off,
  getCookie,
  setCookie,
  isIpadEnv,
  compare,
  judgeSskeyIsActiveTime,
  isOpenVtkeyboadrd,
  isDevelopment,
  isIntegration,
} from '@/utils';
import { selfConfigList } from '@/constants/selfConfig';
import BrandList from './components/BrandList';
import WaitingInfo from '@/container/orderPage/waitingInfo';
import menuUtil from '../../utils/getKioskMenu';
import getDeviceDirection from '@/utils/getDeviceDirection';
import BrandListContent from './components/BrandListContent';
import MainPageScreenSaver, {
  SCREENSAVERSTATUS,
} from './components/MainPageScreenSaver';
import KioskVersionControl from './components/KioskVersionControl';
import { setBuyGifts, setSatisfyRules } from '@/actions/promotion';
import filterMenuGroupByLicense from '@/utils/filterMenuGroupByLicense';
import { getItemsWithStockNum, getOutOfStockItems } from '@/utils/menuStock';
import getPromotionProcedure from '@/utils/setPromotion';
import { reconcileDualPriceTipProcedure } from '@/utils/tipProcedure';
import Toast from '@/component/toast';
import { getChooseTableStatus } from '@/utils/chooseTable';
import VtKeyboard from '@/component/VtKeyboard';
import crmIntegrationSDK from '@/utils/CRMIntegration/marketSDK';
import dayjs from 'dayjs';
import { preloadOrderPageAssets } from '@/utils/preloadOrderPageAssets';
import {
  createConfigSaveQueue,
  mergeRemoteConfigWithDefaults,
  upsertLicenseDeviceInfo,
} from './configSyncUtils';

const { handleGetBrandMenu } = menuUtil;

const FIRST_LOADING_ERROR = 'Failed to initialize menu!';
const FETCH_COMPANY_PROFILE_ERROR = 'failed to get company profile';
const NO_AVAILABLE_MENU = 'There is no available menu at this time.';
const START_ORDER_SESSION_KEY_RENEWAL_THRESHOLD = 60 * 60 * 1000;
class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      manualRefresh: false,
      toggleLicenseSelection: false,
      toggleKioskLicense: false,
      optionGroups: {
        licenseId: [],
      },
      valueGroups: {
        licenseId: '',
      },
      licenseValue: '',
      error: false,
      errorMsg: null,
      errorTxt: '',
      firstLoad:
        props.store.systemConfig.length == 0 &&
        props.store.taxList.length == 0 &&
        props.store.merchantProfile.id == undefined &&
        props.store.menuGroup.length == 0,
      licenseErrorShow: false,
      licenseErrorMsg: '', // license占用报错msg
      screenSaverData: {},
      screenSaverStatus: SCREENSAVERSTATUS.READING,
      /** 仅当屏保开启且需要拉资源时为 false；默认可展示首页，避免屏保关闭时轮询仍闪 Loading */
      screenSaverBootstrapDone: true,
      showBrandList: false,
      keyboardToggle: false,
      noLicenseReloadDialogVisible: false,
    };
    this.pollingTimer = null;
    this.screenSaverRef = React.createRef();
    this.noLicenseReloadTimer = null;
    this.startOrderSessionCheckInProgress = false;
    this.startOrderInProgress = false;
    this.startOrderRequestId = 0;
    this.mainPageUnmounted = false;
    this.latestSettledConfig = null;
    this.isMainConfigReady = false;
    this.pendingLicenseDevice = null;
    this.enqueueConfigSave = createConfigSaveQueue((params) =>
      postMarginappConfig(JSON.stringify(params), getCookie('sessionKey'))
    );
  }

  handleScreenSaverLoadStarted = () => {
    if (this.state.toggleKioskLicense) {
      this.setState({ screenSaverBootstrapDone: false });
    }
  };

  handleScreenSaverLoadSettled = () => {
    this.setState({ screenSaverBootstrapDone: true });
  };

  handleScreenSaverMetaChange = ({ screenSaverData, screenSaverStatus }) => {
    this.setState({ screenSaverData, screenSaverStatus });
  };

  // 选择语言
  handleLang = (e) => {
    this.props.setLanModal(true);
    if (e == 1) {
      this.props.setLanModalFn(this.handleStartOrder);
    }
  };

  // 获取支付设备信息
  getDevicesInfo = (data) => {
    getPayDevices().then((res) => {
      let findAppInstances = res.data;
      let start = findAppInstances?.indexOf('<soap:Body>');
      let end = findAppInstances?.indexOf('</soap:Body>');
      findAppInstances = findAppInstances?.substring(start + 11, end);
      let objTree = new XMLObjTree();
      let instanceList = objTree.parseXML(findAppInstances);
      const device = instanceList?.finddevicesresponsetype.devices.find(
        (obj) => obj.id === data
      );
      if (!!device) {
        if (device.realname?.indexOf('TRIPOS') > -1) {
          var connectType = 'BLUETOOTH';
          if (device.communicationtype === 'COM') connectType = 'USB';
          posFrontLog(`是moby，连接方式:${connectType}`);
          setCookie('serviceTarget', device?.manufacturername || 'INGENICO');
          changePayConnectType('KIOSK', connectType);
        } else {
          posFrontLog(`是${device?.manufacturername}支付`);
          setCookie('serviceTarget', device?.manufacturername || 'PAX');
          cancelDeviceConnect();
        }
        if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
          saveLicenseName(getCookie('kioskLicense'));
        }
      }
    });
  };

  // 积分兑换菜是否展示&位置
  getFreeItemShowPosition = async () => {
    const { selfConfig } = this.props;
    const isShowFreeItem = selfConfig?.configList?.find(
      (config) => config.id === 42
    )?.value;
    let freeItemPosition = null;
    if (isShowFreeItem) {
      freeItemPosition = selfConfig?.configList?.find(
        (config) => config.id === 43
      )?.value;
    }

    if (
      !selfConfig?.configList.length ||
      (isShowFreeItem && freeItemPosition === null)
    ) {
      // 初始化失败
      judgeSskeyIsActiveTime().then(() =>
        this.getKioskConfigInfo(res.data).then(() => {
          this.getFreeItemShowPosition();
        })
      );
      return;
    }
    this.props.setFreeItemMenuPosition(freeItemPosition);
  };

  // 菜单不一样时更新所有配置信息
  updateConfig = async ({ refreshMenu = true, refreshSystem = true } = {}) => {
    const updateMenuConfig = async () => {
      const menuRes = await fetchMenuGroup();
      const menuGroups = menuRes.data.KioskMenus[0]?.menuGroups;
      const hasNewMenu = menuGroups?.length > 0;
      const { systemLicense } = this.props.sysCookie;
      const hasCurrentMenu = this.props.menuGroup?.some(
        (group) => !group.isFreeItemMenu && group.id !== 'promotion-deals-list'
      );
      const currentMenuGroups = this.props.menuGroup?.filter(
        (group) =>
          !group.isFreeItemMenu && group.id !== 'promotion-deals-list'
      );
      const updatedMenuGroups = hasNewMenu
        ? filterMenuGroupByLicense(menuGroups, systemLicense)
        : [];
      posFrontLog(
        `Current menu out-of-stock items: ${JSON.stringify(
          getOutOfStockItems(currentMenuGroups)
        )}`
      );
      posFrontLog(
        `Current menu items with stock quantity: ${JSON.stringify(
          getItemsWithStockNum(currentMenuGroups)
        )}`
      );
      posFrontLog(
        `Current Kiosk config sold-out items: ${JSON.stringify(
          this.props.selfConfig?.soldOut || []
        )}`
      );
      // 菜单不一致（组 id 及组内商品 id+outOfStock），或营业时间变更导致无可用菜单时也需刷新
      const shouldUpdateMenu =
        (hasNewMenu &&
          !this.judgeSameMenuByIdAndStock(
            updatedMenuGroups,
            this.props.menuGroup
          )) ||
        (!hasNewMenu && hasCurrentMenu);

      if (shouldUpdateMenu) {
        this.props.setUpdateMenuLoad(true);
        try {
          await this.getFreeItemShowPosition();
          const updatedMenuGroupWithStock = await this.props.initMenuGroup2(
            menuRes.data
          );
          posFrontLog(
            `Updated menu out-of-stock items: ${JSON.stringify(
              getOutOfStockItems(updatedMenuGroupWithStock)
            )}`
          );
          posFrontLog(
            `Updated menu items with stock quantity: ${JSON.stringify(
              getItemsWithStockNum(updatedMenuGroupWithStock)
            )}`
          );
          posFrontLog(
            `Updated Kiosk config sold-out items: ${JSON.stringify(
              this.props.selfConfig?.soldOut || []
            )}`
          );
        } finally {
          this.props.setUpdateMenuLoad(false);
        }
      } else if (hasNewMenu) {
        const displayedMenuGroup =
          (await this.props.refreshMenuStockNumIfChanged()) ||
          this.props.menuGroup;
        posFrontLog(
          `Updated menu items with stock quantity: ${JSON.stringify(
            getItemsWithStockNum(displayedMenuGroup)
          )}`
        );
      }
    };

    const updateSystemConfig = async () => {
      const [systemConfigRes, systemConfigAllRes] = await Promise.all([
        fetchSystemConfig(),
        fetchSystemConfigAllList(),
      ]);
      this.props.initConfigParams(
        systemConfigRes.data,
        null,
        null,
        systemConfigAllRes.data
      );
      return systemConfigRes.data;
    };

    try {
      const [, systemConfig] = await Promise.all([
        refreshMenu ? updateMenuConfig() : Promise.resolve(),
        refreshSystem ? updateSystemConfig() : Promise.resolve(),
      ]);
      return { systemConfig };
    } catch (error) {
      throw error;
    }
  };

  refreshMenuAfterNavigation = () => {
    Promise.resolve()
      .then(() => this.updateConfig({ refreshSystem: false }))
      .catch((error) => {
        this.props.setUpdateMenuLoad(false);
        posFrontLog(
          `Refresh menu after navigation failed: ${
            error?.message || String(error)
          }`
        );
      });
  };

  isMainPageRoute = () => {
    const pathname = this.props.location?.pathname;
    if (pathname === '/' || pathname === '/index') return true;

    const hashPath = (window.location.hash || '#/')
      .replace(/^#/, '')
      .split('?')[0]
      .replace(/\/$/, '');
    return hashPath === '' || hashPath === '/' || hashPath === '/index';
  };

  judgeSameMenuByIdAndStock = (menu, oldMenu) => {
    const menuSignature = (groups) =>
      (groups || []).map((g) => {
        const itemsSig = (g?.menuCategories || [])
          .flatMap((c) => c?.saleItems || [])
          .map(
            (item) =>
              `${item?.id ?? ''}${item?.outOfStock ?? ''}${
                item?.lastUpdated ?? ''
              }`
          )
          .join(',');
        return `${g?.id ?? ''}|${itemsSig}`;
      });
    const newSigs = menuSignature(menu);
    const oldFiltered = oldMenu?.filter(
      (_) => !_.isFreeItemMenu && _.id !== 'promotion-deals-list'
    );
    const oldSigs = menuSignature(oldFiltered);
    return isEqual(newSigs, oldSigs);
  };

  closeBrandList = (brand) => {
    const { menuGroup, setSelectedBrand, setBrandMenu } = this.props;
    this.setState(
      {
        showBrandList: false,
      },
      () => {
        if (!brand) return;
        const { dishIds } = brand;
        const brandMenu = handleGetBrandMenu(menuGroup, dishIds);
        setBrandMenu(brandMenu);
        setSelectedBrand(brand);
        this.handleContinueOrder();
      }
    );
  };

  // 非等位模式，开始点单，选择订单
  handleStartOrder = async () => {
    if (!getCookie('kioskLicense')) {
      this.showNoLicenseReloadDialog();
      return;
    }
    if (this.startOrderSessionCheckInProgress) {
      return;
    }

    this.startOrderSessionCheckInProgress = true;
    let sessionKeyRenewed = false;
    try {
      sessionKeyRenewed = await judgeSskeyIsActiveTime({
        minimumRemainingTime: START_ORDER_SESSION_KEY_RENEWAL_THRESHOLD,
        notifyAfterRenewal: false,
      });
    } catch (error) {
      this.showError(error?.message || error);
      return;
    } finally {
      this.startOrderSessionCheckInProgress = false;
    }

    if (sessionKeyRenewed) {
      window.location.reload();
      return;
    }

    const { selfConfig } = this.props;
    const isOpenBrandSetting = selfConfig?.configList?.find(
      (config) => config.id === 26
    )?.value;
    if (isOpenBrandSetting) {
      this.setState({ showBrandList: true });
      return;
    }
    this.handleContinueOrder();
  };

  showNoLicenseReloadDialog = () => {
    clearTimeout(this.noLicenseReloadTimer);
    this.setState({
      noLicenseReloadDialogVisible: true,
    });
    this.noLicenseReloadTimer = setTimeout(() => {
      clearTimeout(this.noLicenseReloadTimer);
      this.noLicenseReloadTimer = null;
      window.location.reload();
    }, 3000);
  };

  reloadPageImmediately = (event) => {
    event?.stopPropagation();
    clearTimeout(this.noLicenseReloadTimer);
    this.noLicenseReloadTimer = null;
    window.location.reload();
  };

  // 品牌主页模式
  handleClickBrand = (res) => {
    const { setSelectedBrand, menuGroup, setBrandMenu } = this.props;
    setSelectedBrand(res);
    const { dishIds } = res;
    const brandMenu = handleGetBrandMenu(menuGroup, dishIds);
    setBrandMenu(brandMenu);
    this.handleContinueOrder();
  };

  // 开始点单
  handleContinueOrder = async () => {
    if (this.startOrderInProgress) {
      return;
    }

    const requestId = ++this.startOrderRequestId;
    const resetStartOrderStatus = () => {
      this.startOrderInProgress = false;
      if (!this.mainPageUnmounted && this.isMainPageRoute()) {
        this.setState({ manualRefresh: false });
      }
    };

    this.startOrderInProgress = true;
    this.setState({ manualRefresh: true });
    // 跳转前只刷新决定订单类型所需的系统配置，菜单和库存进入页面后再更新
    let latestConfig;
    try {
      latestConfig = await this.updateConfig({ refreshMenu: false });
    } catch (error) {
      resetStartOrderStatus();
      return;
    }

    if (
      this.mainPageUnmounted ||
      requestId !== this.startOrderRequestId ||
      !this.isMainPageRoute()
    ) {
      resetStartOrderStatus();
      return;
    }
    const {
      selfConfig,
      systemConfig: propsSystemConfig,
      changeOrderType,
    } = this.props;
    const systemConfig = latestConfig?.systemConfig || propsSystemConfig;
    // 是否展示orderType 页
    const isShowOrderType = selfConfig?.configList?.find(
      (each) => each.id === 25
    )?.value;
    // 可展示order type, '0' 堂食 | '1' 打包 | '2' 预点单
    const showOrderType = systemConfig?.['CHOOSE_ORDER_TYPE']?.value;
    if (typeof showOrderType !== 'string') {
      Toast.info('No Order Type, Please refresh kiosk', 1500);
      resetStartOrderStatus();
      return;
    }
    // order type 展示数量
    const showOrderTypeNum = showOrderType?.split(',').length;
    if (isShowOrderType || showOrderTypeNum > 1) {
      this.props.history.push('/orderType');
      this.refreshMenuAfterNavigation();
      return;
    }
    // 当配置一个type时，直接进入订单页，但会根据pos返回的选中值初始化订单类型
    const orderType = ['DINE_IN', 'TO_GO', 'PICK_UP'];
    const selectedOrderType = orderType[Number(showOrderType)];
    changeOrderType(selectedOrderType);
    // 记录orderType 以确保下单时有正确的订单类型
    window.selectedOrderType = selectedOrderType;
    this.props.history.push('/orderPage');
    this.refreshMenuAfterNavigation();
  };

  // 等位模式下的togo
  handleTogo = async () => {
    await this.updateConfig({ refreshMenu: false });
    this.props.changeOrderType('TO_GO');
    window.selectedOrderType = 'TO_GO';
    this.props.history.push('/orderPage');
    this.refreshMenuAfterNavigation();
  };

  // 进入等位系统
  handleWaitlist = () => {
    this.props.history.push('/waitList');
  };

  // 格式化license
  parseLicenseXml = (data) => {
    try {
      const soapBodyStart = data?.indexOf('<soap:Body>');
      const soapBodyEnd = data?.indexOf('</soap:Body>');
      if (soapBodyStart === -1 || soapBodyEnd === -1) {
        console.warn('Invalid XML data: missing SOAP Body tags');
        return [];
      }

      const soapBodyContent = data?.substring(soapBodyStart + 11, soapBodyEnd);
      const objTree = new XMLObjTree();
      const instanceList = objTree.parseXML(soapBodyContent);

      const appInstances =
        instanceList?.findappinstancesresponsetype?.appinstances;
      if (!appInstances) {
        console.warn('No app instances found in license data');
        return [];
      }

      const instancesArray = Array.isArray(appInstances)
        ? appInstances
        : [appInstances];

      // 过滤出KIOSK类型的实例
      const kioskInstances = instancesArray.filter(
        (instance) => instance?.type === 'KIOSK'
      );

      return kioskInstances;
    } catch (error) {
      console.error('Error parsing license XML:', error);
      return [];
    }
  };

  // 记录license 列表，用于过滤菜单
  recordLicenseList = () => {
    getLicenseList().then((res) => {
      const licenseList = res.data ? this.parseLicenseXml(res.data) || [] : [];
      this.props.setLicenseList(licenseList);
      this.getAndroidDeviceInfo(licenseList);
    });
  };

  // 获取license列表，并处理展示内容
  toggleLicenseSelectionHandler = () => {
    getLicenseList().then((res) => {
      let optionGroups = ['Select a license'];
      let licenseList = res.data ? this.parseLicenseXml(res.data) || [] : [];
      licenseList?.forEach((license) => {
        if (license.type === 'KIOSK') {
          let displayName = license.displayname;
          if (license.inuse === 'true') {
            displayName += ' —— in use';
          }
          optionGroups.push(displayName);
        }
      });
      this.setState({
        licenseList: licenseList,
        toggleKioskLicense: true,
        toggleLicenseSelection: !this.state.toggleLicenseSelection,
        optionGroups: {
          licenseId: optionGroups,
        },
        valueGroups: {
          licenseId: optionGroups[0],
        },
      });
    });
    this.hideKeyboard();
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

  licenseInputHandler = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    this.setState({
      licenseValue: value,
    });
  };

  licenseSelectionHandler = (name, value) => {
    let tempValueGroups = Object.assign({}, this.state.valueGroups);
    tempValueGroups.licenseId = value;
    this.setState({
      valueGroups: tempValueGroups,
    });
  };

  cancelLicenseSelection = () => {
    this.setState({
      toggleKioskLicense: false,
      toggleLicenseSelection: false,
    });
  };

  // license列表确认当前选中
  submitSelectedLicense = () => {
    let currentSelectedLicense = this.state.valueGroups.licenseId + '';
    if (currentSelectedLicense == 'Select a license') return;
    this.setState({
      licenseValue: currentSelectedLicense.replace(' —— in use', ''),
      toggleKioskLicense: false,
      toggleLicenseSelection: false,
    });
  };

  // 设置默认语言
  setDefaultLang = (obj) => {
    if (obj.configList?.length) {
      let r = obj.configList.find((c) => c.id === 11);
      if (r) {
        // redux
        this.props.setLang(r.value);
        // i18
        this.props.i18n.changeLanguage(r.value);
      }
    }
  };

  // 查询kiosk配置页信息
  getKioskConfigInfo = (sysList, onConfigReady) => {
    this.isMainConfigReady = false;
    return new Promise((resolve, reject) => {
      promiseFinally(
        getMarginappFetchConfig().then(async (res) => {
          if (res.data.result.successful) {
            let parseObj = {};
            let effectiveSysList = sysList;
            let list = res.data.marginAppConfigTypes;
            let obj = list.find((l) => l.product == 'KIOSKLITE');
            // 数据库有值
            if (obj && obj.data) {
              let arr = JSON.parse(obj.data);
              if (arr.configList) {
                const {
                  mergedConfig,
                  hasMissingConfigItems,
                  hasInvalidConfigItems,
                } = mergeRemoteConfigWithDefaults(arr, selfConfigList);
                const {
                  updatedConfig: tipsUpdatedConfig,
                  hasUpdated: hasTipsConfigUpdated,
                } = this.updateTipsConfig(mergedConfig);
                const {
                  updatedConfig: promotionUpdatedConfig,
                  hasUpdated: hasPromotionEnableTypeUpdated,
                } = this.updatePromotionEnableType(tipsUpdatedConfig);
                parseObj = cloneDeep(promotionUpdatedConfig);

                if (
                  hasMissingConfigItems ||
                  hasInvalidConfigItems ||
                  hasTipsConfigUpdated ||
                  hasPromotionEnableTypeUpdated
                ) {
                  await this.saveConfigData(parseObj);
                }

                this.props.setSelfConfig(parseObj);
                this.latestSettledConfig = cloneDeep(parseObj);
              }
            } else {
              // 数据库无值
              parseObj = cloneDeep(selfConfigList);
              this.props.setSelfConfig(parseObj);
              this.latestSettledConfig = cloneDeep(parseObj);
            }

            this.isMainConfigReady = true;
            await this.flushPendingLicenseDeviceSync();

            if (onConfigReady) {
              try {
                const callbackSysList = await onConfigReady(parseObj);
                if (callbackSysList) {
                  effectiveSysList = callbackSysList;
                }
              } catch (error) {
                reject(error?.message || error);
                return;
              }
            }
            // 如果等位，且订单类型仅有TOGO
            if (parseObj.configList?.length) {
              let w = parseObj.configList.find((c) => c.id === 13);
              if (w.value) {
                const orderTypeList =
                  effectiveSysList?.CHOOSE_ORDER_TYPE?.value?.split(',') || [];
                if (
                  !!(orderTypeList?.length && orderTypeList?.indexOf('1') > -1)
                ) {
                  this.props.changeOrderType('TO_GO');
                }
              }
            }
            resolve(parseObj);
          } else {
            reject(res.data?.result?.failureReason);
            // 在 LostConnection 组件中有相同的错误处理
            // this.showError(res.data?.result?.failureReason, 1);
          }
        }).catch((err) => {
          reject(err?.message);
          // 在 LostConnection 组件中有相同的错误处理
          // this.showError(err?.message, 1);
        }),
        () => {
          // 非 Loading 流程（如 backParams）配置拉取结束后，再允许版本落库
          if (!this.state.manualRefresh) {
            EventBus.emit('mainPageConfigSettled');
          }
        }
      );
    });
  };

  // 选中license-【next】
  validateLicense = () => {
    const { licenseValue } = this.state;
    if (!licenseValue) return;

    this.setState({ manualRefresh: true });
    fetchSessionKey(licenseValue)
      .then((res) => {
        if (res.data.result.successful) {
          this.setState({
            toggleKioskLicense: true,
            licenseErrorMsg: '',
            licenseErrorShow: false,
          });
          setCookie('kioskclientInstanceTime', +new Date());
          setCookie(
            'kioskSskeyActiveTime',
            res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1000
          );
          setCookie('kioskLicense', licenseValue);
          this.getAndroidDeviceInfo(this.state.licenseList);
          if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
            setCookie('AndroidSecret', res.data.secretKey);
          } else {
            setCookie('secretKey', res.data.secretKey);
          }
          posFrontLog(
            `clientInstanceLogin_validateLicense_sessionKey=${res?.data?.sessionKey}`
          );
          setCookie('sessionKey', res.data.sessionKey);
          EventBus.emit('kiosk_license_ready');

          // 查询kiosk配置项
          this.getKioskConfigInfo(null, async (parseObj) => {
            this.screenSaverRef.current?.reload({
              skipBootstrapLoading: false,
            });
            getChooseTableStatus(true);
            return this.selectedLicenesFetch(parseObj);
          }).catch((err) => {
            this.showError(err?.message || err);
          });

          if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
            saveSecretKeyAndroid({
              appType: 'KIOSK',
              merchantId: this.props.merchantId,
              secret: res.data.secretKey,
              saveLicenseName: licenseValue,
            });
            getLicenseInfo().then((res) => {
              const licenseDetail = res.data
                ? this.parseLicenseXml(res.data) || []
                : [];
              this.getDevicesInfo(licenseDetail[0]?.paymentterminalid);
            });
          } else {
            saveSecretKey({
              secret: res.data.secretKey,
              merchantId: this.props.merchantId,
              appType: 'KIOSK',
            });
          }
        } else {
          this.setState({
            licenseErrorMsg: res.data.result.failureReason,
            licenseErrorShow: true,
          });
          this.showError(res.data.result.failureReason);
        }
      })
      .catch((err) => {
        this.showError(err?.message);
      });
  };

  // 获取当前设备信息
  getAndroidDeviceInfo(licenseList) {
    getDeviceInfo()
      .then((info) => {
        this.updateDeviceInfoWithLicenes(info.body, licenseList);
      })
      .catch((err) => {
        posFrontLog(`获取设备信息出错,${err}`);
      });
  }

  // 根据当前设备信息，更新kiosk配置的设备列表
  updateDeviceInfoWithLicenes(data, licenseList) {
    const { systemConfig, initConfigParams } = this.props;
    const paymentTypeValue = systemConfig?.KIOSK_PAYMENT_TYPE?.value;
    if (!paymentTypeValue) {
      fetchSystemConfig().then((res) => {
        if (res?.data) {
          initConfigParams(res.data);
          this.updateDeviceInfoWithLicenes(data, licenseList);
        }
      });
      return;
    }

    const devicePaymentType = {
      canPayByCard: paymentTypeValue.includes('0'),
      canPayByCash: paymentTypeValue.includes('1'),
      canPayByEcard: paymentTypeValue.includes('2'),
    };
    const licenseValue = getCookie('kioskLicense');
    const curLicense = licenseList.find(
      (device) => device.displayname === licenseValue
    );
    if (!curLicense) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const horizontalDisplay = width > height;
    const licenseDevice = {
      id: curLicense?.id, //license的id
      displayname: curLicense?.displayname, //license的名称
      type: curLicense?.type, //类型，如"KIOSK"等
      appVersion: `${data.appVersion} - ${data?.versionCode ?? ''}`, //壳子版本
      deviceName: data.name || data.modelName, //壳子设备名称
      deviceId: data.uuid, //壳子设备的设备id
      deviceType: data.deviceType, //壳子设备类型，一般为android
      deviceSysVersion: data.version, //壳子设备的android版本
      webviewVersion: data.webviewVersion, //当前webview的版本号
      horizontalDisplay: horizontalDisplay,
      devicePaymentType,
      updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    localStorage.setItem('deviceName', licenseDevice.deviceName); //壳子设备的名称存到缓存里面
    localStorage.setItem('deviceId', licenseDevice.deviceId); //壳子设备id存到缓存里面

    if (!this.isMainConfigReady) {
      this.pendingLicenseDevice = licenseDevice;
      return;
    }

    this.syncLicenseDeviceToConfig(licenseDevice)
      .catch((err) => {
        console.error('更新licenes关联的设备信息失败', err);
      });
  }

  flushPendingLicenseDeviceSync = async () => {
    if (!this.pendingLicenseDevice || !this.isMainConfigReady) return;
    const pending = this.pendingLicenseDevice;
    this.pendingLicenseDevice = null;
    await this.syncLicenseDeviceToConfig(pending);
  };

  getBaseConfigForDeviceSync = async () => {
    const latestConfig = this.latestSettledConfig || this.props.selfConfig;
    if (latestConfig?.configList?.length) {
      return cloneDeep(latestConfig);
    }

    const res = await getMarginappFetchConfig();
    if (!res?.data?.result?.successful) {
      throw new Error(res?.data?.result?.failureReason || 'fetch config failed');
    }
    const list = res.data.marginAppConfigTypes || [];
    const obj = list.find((l) => l.product == 'KIOSKLITE');
    if (!obj?.data) return null;

    const parsed = JSON.parse(obj.data);
    if (!parsed?.configList) return null;
    return parsed;
  };

  syncLicenseDeviceToConfig = async (licenseDevice) => {
    const baseConfig = await this.getBaseConfigForDeviceSync();
    if (!baseConfig?.configList) return;

    const { updatedConfig, hasDeviceInfoChanged } = upsertLicenseDeviceInfo(
      baseConfig,
      licenseDevice
    );
    this.latestSettledConfig = cloneDeep(updatedConfig);

    if (!hasDeviceInfoChanged) {
      this.props.setSelfConfig(updatedConfig);
      return;
    }

    const saveRes = await this.saveConfigData(updatedConfig);
    if (saveRes?.data?.result?.successful) {
      this.props.setSelfConfig(updatedConfig);
    } else {
      throw new Error(saveRes?.data?.result?.failureReason || 'save config failed');
    }
  };

  // 更新保存最新config设置数据
  saveConfigData = async (params) => this.enqueueConfigSave(params);

  isDualPriceEnabled = () =>
    this.props.allSysConfig?.CREDIT_CHARGE_ENABLE === 'true';

  // 更新小费相关配置
  updateTipsConfig = (arr) => {
    let hasUpdated = false;
    let updatedConfig = { ...arr };
    if (!this.isDualPriceEnabled()) {
      return { updatedConfig, hasUpdated };
    }

    let configList = arr?.configList ? [...arr.configList] : [];
    const tipConfig = configList.find((item) => item.id === 24);
    const reconciledTipConfig = reconcileDualPriceTipProcedure(
      tipConfig,
      true
    );
    // 设置 DP 后，仅把未授权的旧“刷卡前”模式统一为刷卡后；
    // “支付方式选择页面之前”是独立流程，必须保留。
    if (reconciledTipConfig !== tipConfig) {
      hasUpdated = true;
      configList = configList.map((item) =>
        item.id === 24 ? reconciledTipConfig : item
      );
    }
    // DP 下须同时开启现金与信用卡：同步到设备配置（id:34）
    const devIdx = configList.findIndex((item) => item.id === 34);
    if (devIdx > -1) {
      const devices = configList[devIdx].value;
      if (Array.isArray(devices) && devices.length > 0) {
        const needUpdateDevicePaymentType = devices.some(
          (d) =>
            d?.devicePaymentType?.canPayByCard !== true ||
            d?.devicePaymentType?.canPayByCash !== true
        );
        if (needUpdateDevicePaymentType) {
          hasUpdated = true;
          configList = [...configList];
          configList[devIdx] = {
            ...configList[devIdx],
            value: devices.map((d) => ({
              ...d,
              devicePaymentType: {
                ...d?.devicePaymentType,
                canPayByCard: true,
                canPayByCash: true,
              },
            })),
          };
        }
      }
    }
    updatedConfig = { ...updatedConfig, configList };
    return { updatedConfig, hasUpdated };
  };

  // 更新本地促销生效类型配置(促销中心开启时,清空)
  updatePromotionEnableType = (arr) => {
    let hasUpdated = false;
    let updatedConfig = { ...arr };
    if (
      this.props.promotion?.isOpenCloudPromotion &&
      updatedConfig.promotionEnableType !== ''
    ) {
      hasUpdated = true;
      updatedConfig = { ...updatedConfig, promotionEnableType: '' };
    }
    return { updatedConfig, hasUpdated };
  };

  // 选择licenes前调用（封面图）
  beforeLicenesFetch = () => {
    fetchCompanyProfile()
      .then((res) => {
        if (!res.data.result.successful) {
          this.showError(
            FETCH_COMPANY_PROFILE_ERROR + res.data.result.failureReasonCode
          );
        } else {
          // 更新封面图
          const merchantId = res.data.company.merchantId;
          this.props.initCompanyParams(res.data);
          if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
            getSecretKeyAndroid(
              'KIOSK',
              merchantId,
              'afterGetSecretKeyFromAndroid'
            );
          } else {
            getSecretKey({
              merchantId,
              appType: 'KIOSK',
            }).then((sk) => {
              if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
                setCookie('AndroidSecret', sk.data.secret);
              } else {
                setCookie('secretKey', sk.data.secret);
              }
            });
          }
          this.loadLogo();
          this.loadImgByDirection();
        }
      })
      .catch((err) => {
        this.showError(FIRST_LOADING_ERROR, undefined, err?.message || err);
      });
  };

  // 选中licenes后，加载
  selectedLicenesFetch = (configData) => {
    return new Promise((resolve) => {
      const promise_initTimeout = new Promise((success, error) =>
        setTimeout(() => error('timeout'), 100000)
      );
      Promise.race([
        promise_initTimeout,
        Promise.all([
          fetchSystemConfig(),
          fetchCompanyProfile(),
          fetchMenuGroup(),
          fetchTaxInfo(),
          fetchItemSizeList(),
          fetchSystemConfigAllList(),
        ]),
      ])
        .then(async (res) => {
          if (!res[1].data.result.successful) {
            this.showError(
              FETCH_COMPANY_PROFILE_ERROR + res[1].data.result.failureReasonCode
            );
          } else {
            resolve(res[0].data);
            this.props.initConfigParams(
              res[0].data,
              res[3].data,
              res[4].data,
              res[5].data
            );
            // 更新封面图
            this.props.initCompanyParams(res[1].data);
            // 菜单正确
            if (
              res[2].data.KioskMenus[0].menuGroups &&
              res[2].data.KioskMenus[0].menuGroups.length
            ) {
              await this.getFreeItemShowPosition();
              this.props.initParams(res[1].data, res[2].data);
              this.props.setIsMenuUpdated(false);
            } else {
              if (!configData?.configMap?.id_13) {
                this.showError(
                  NO_AVAILABLE_MENU,
                  1,
                  'no valid menu after select license'
                );
              }
            }

            this.setDefaultLang(configData);
            this.loadLogo();
            this.loadImgByDirection();
            this.loadConfigPro();
            this.handleResolvePromotion();
            this.getMobyDeviceLinkStatus();
            this.getMobyDeviceInfo();
          }
        })
        .catch((err) => {
          this.setState({ manualRefresh: false });
          if (err == 'timeout') {
            this.showError('Loading timeout! Please try again.');
          } else {
            this.showError(FIRST_LOADING_ERROR, undefined, err?.message || err);
          }
          resolve(null);
        });
    });
  };

  // 首次登录，且已选过license
  loadParams = () => {
    this.setState({ manualRefresh: true });
    const promise_initTimeout = new Promise((resolve, reject) =>
      setTimeout(() => reject('timeout'), 100000)
    );
    // 判断是否开通等位等配置
    fetchSystemConfig()
      .then((resp) => {
        this.props.initConfigParams(resp.data);
        judgeSskeyIsActiveTime().then(() => {
          this.getKioskConfigInfo(resp.data)
            .then((configRes) => {
              Promise.race([
                promise_initTimeout,
                Promise.all([fetchCompanyProfile(), fetchMenuGroup()]),
              ])
                .then(async (res) => {
                  if (!res[0].data.result.successful) {
                    this.showError(
                      FETCH_COMPANY_PROFILE_ERROR +
                        res[0].data.result.failureReasonCode
                    );
                  } else {
                    // 更新封面图
                    this.props.initCompanyParams(res[0].data);
                    // 菜单正确
                    if (
                      res[1].data.KioskMenus[0].menuGroups &&
                      res[1].data.KioskMenus[0].menuGroups.length
                    ) {
                      await this.getFreeItemShowPosition();
                      this.props.initParams(res[0].data, res[1].data);
                      this.props.setIsMenuUpdated(false);
                    } else {
                      if (!configRes?.configMap?.id_13) {
                        this.showError(
                          NO_AVAILABLE_MENU,
                          1,
                          'loadParams no valid menu'
                        );
                      }
                    }
                    this.setDefaultLang(configRes);
                    this.loadLogo();
                    this.loadImgByDirection();
                    this.loadConfigPro();
                    this.getMobyDeviceLinkStatus();
                    this.getMobyDeviceInfo();
                  }
                })
                .catch((err) => {
                  this.setState({ manualRefresh: false });
                  if (err == 'timeout') {
                    this.showError('Loading timeout! Please try again.');
                  } else {
                    this.showError(
                      FIRST_LOADING_ERROR,
                      undefined,
                      err?.message || err
                    );
                  }
                });

              Promise.all([
                fetchTaxInfo(),
                fetchItemSizeList(),
                fetchSystemConfigAllList(),
              ]).then((res) => {
                this.props.initConfigParams(
                  null,
                  res[0].data,
                  res[1].data,
                  res[2].data
                );
              });
            })
            .catch((err) => {
              const t = setTimeout(() => {
                this.loadLogo();
                this.loadImgByDirection();
                this.loadConfigPro();
                this.getMobyDeviceLinkStatus();
                this.getMobyDeviceInfo();
                clearTimeout(t);
              }, 0);

              const isShowRefresh =
                err === 'Invalid session key' ||
                err.message === 'Invalid session key';
              this.showError(err, Number(isShowRefresh));
            });
        });
      })
      .catch((err) => {
        this.showError(err?.message);
      });
  };

  // 加载eCard配置
  loadECardConfig = async () => {
    try {
      const response = await getECardSettings();
      this.props.setECardSettings(response.data);
    } catch (error) {
      console.warn('Failed to get eCard settings:', error);
    }
  };

  // 返回首页加载，更新配置
  backParams = () => {
    fetchSystemConfig().then((res) => {
      if (res && res.data) {
        this.props.initConfigParams(res.data);
        judgeSskeyIsActiveTime().then(() => {
          this.getKioskConfigInfo(res.data).then((configRes) => {
            this.setDefaultLang(configRes);
            this.screenSaverRef.current?.reload();
            this.loadConfigImage();
          });
          this.loadConfigPro();
        });
        this.getMobyDeviceLinkStatus();
        this.getMobyDeviceInfo();
      }
    });
  };

  // 获取moby设备连接状态 - 更新状态图标
  getMobyDeviceLinkStatus = () => {
    this.props.setMobyDeviceLinkStatus(null);
    if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
      checkIngenicoReadyForTransaction()
        .then((info) => {
          this.props.setMobyDeviceLinkStatus(info.code);
          //支付设备就绪or完成刷卡状态初始化
          this.props.setTriposPayReady(false);
          this.props.setTriposPayFinish(false);
        })
        .catch((err) => {
          posFrontLog(`moby支付设备准备未就绪,${err}`);
          this.props.setMobyDeviceLinkStatus(-1);
        });
    } else {
      this.props.setMobyDeviceLinkStatus(-1);
    }
  };

  // 获取moby设备信息并更新 - 电量等
  getMobyDeviceInfo = async () => {
    this.props.setMobyDeviceInfo({});
    if ((!window.isAndroidShell || !window.isAndroidShell()) && (!window.isIosShell || !window.isIosShell())) {
      return;
    }
    let info;
    try {
      info = await getIngenicoDeviceSNAndDeviceInfo();
    } catch (err) {
      posFrontLog(
        'moby设备信息获取失败(getIngenicoDeviceSNAndDeviceInfo):',
        err
      );
      try {
        if (typeof window.loadPaymentInfo !== 'function') {
          throw new Error('loadPaymentInfo 不可用');
        }
        info = await window.loadPaymentInfo();
      } catch (err2) {
        posFrontLog('moby设备信息获取失败(loadPaymentInfo):', err2.message);
        return;
      }
    }
    this.props.setMobyDeviceInfo(info?.body);
  };

  // 获取海报Pro配置数据
  loadConfigPro = () => {
    getKioskPosterPro(getCookie('sessionKey')).then((res) => {
      if (res.data.result.successful) {
        const data = res.data.marginAppConfigTypes?.[0]?.data || '{}';
        let objData = JSON.parse(data);
        this.props.setBannerPro(objData);
      }
    });
  };

  loadConfigImage = () => {
    // 请求获取logo和封面图等数据
    fetchCompanyProfile()
      .then((res) => {
        this.props.initCompanyParams(res.data);
        this.loadLogo();
        this.loadImgByDirection();
      })
      .catch((err) => {
        this.showError(err?.message);
      });
  };

  // 轮询 系统设置， 4个pos设置， kiosk设置
  handlePollingConfig = () => {
    this.pollingTimer = setInterval(
      () => {
        this.backParams();
        fetchSystemConfigAllList().then((res) => {
          this.props.initConfigParams(null, null, null, res.data);
        });
        this.handleResolvePromotion();
      },
      1000 * 60 * 5
    );
  };

  showError = (err, t, r) => {
    posFrontLog(r ? `${err} ${r}` : `${err}`);
    this.setState({
      manualRefresh: false,
      error: t == 1 ? true : false,
      errorMsg: err,
      errorTxt: t == 1 ? 'refresh' : 'close',
    });
  };

  hideError = () => {
    const { errorMsg } = this.state;
    if (errorMsg === 'Invalid session key') {
      const licenseValue = getCookie('kioskLicense');
      if (licenseValue) {
        fetchSessionKey(licenseValue).then((res) => {
          if (res.data.result.successful) {
            setCookie('kioskclientInstanceTime', +new Date());
            setCookie(
              'kioskSskeyActiveTime',
              res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1000
            );
            if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
              setCookie('AndroidSecret', res.data.secretKey);
            } else {
              setCookie('secretKey', res.data.secretKey);
            }
            posFrontLog(
              `clientInstanceLogin_hideError_sessionKey=${res?.data?.sessionKey}`
            );
            setCookie('sessionKey', res.data.sessionKey);

            if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
              saveSecretKeyAndroid({
                appType: 'KIOSK',
                merchantId: this.props.merchantId,
                secret: res.data.secretKey,
                saveLicenseName: licenseValue,
              });
            } else {
              saveSecretKey({
                secret: res.data.secretKey,
                merchantId: this.props.merchantId,
                appType: 'KIOSK',
              });
            }
            window.location.reload(true);
          } else {
            this.setState({
              licenseErrorMsg: res.data.result.failureReason,
              licenseErrorShow: true,
            });
            this.showError(res.data.result.failureReason);
          }
        });
      }
    }

    if (this.state.licenseErrorMsg) {
      this.setState({
        licenseErrorShow: true,
      });
    }
    this.setState({
      error: false,
      errorMsg: null,
      errorTxt: '',
    });
  };

  // 处理 POS 连接恢复事件
  handlePosConnectionRestored = () => {
    // 当 app 检测到连接恢复时，清除 mainPage 的错误弹窗
    if (this.state.error) {
      this.hideError();
    }
  };

  // 刷新
  handleRefresh = () => {
    const { errorMsg } = this.state;
    if (errorMsg === 'Invalid session key') {
      const licenseValue = getCookie('kioskLicense');
      if (licenseValue) {
        fetchSessionKey(licenseValue).then((res) => {
          if (res.data.result.successful) {
            setCookie('kioskclientInstanceTime', +new Date());
            setCookie(
              'kioskSskeyActiveTime',
              res.data.sessionKeyRemainingActiveTime || 23 * 3600 * 1000
            );
            if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
              setCookie('AndroidSecret', res.data.secretKey);
            } else {
              setCookie('secretKey', res.data.secretKey);
            }
            posFrontLog(
              `clientInstanceLogin_reload_sessionKey=${res?.data?.sessionKey}`
            );
            setCookie('sessionKey', res.data.sessionKey);

            if ((window.isAndroidShell && window.isAndroidShell()) || (window.isIosShell && window.isIosShell())) {
              saveSecretKeyAndroid({
                appType: 'KIOSK',
                merchantId: this.props.merchantId,
                secret: res.data.secretKey,
                saveLicenseName: licenseValue,
              });
            } else {
              saveSecretKey({
                secret: res.data.secretKey,
                merchantId: this.props.merchantId,
                appType: 'KIOSK',
              });
            }
            window.location.reload(true);
          } else {
            this.setState({
              licenseErrorMsg: res.data.result.failureReason,
              licenseErrorShow: true,
            });
            this.showError(res.data.result.failureReason);
          }
        });
        return;
      }
      window.location.reload();
      return;
    }
    window.location.reload();
  };

  // 加载logo
  loadLogo = () => {
    const { store } = this.props;
    if (store.merchantProfile.images?.length) {
      let imgList = store.merchantProfile.images;
      let o_logo = imgList.find((m) => m.name == 'logo');
      if (o_logo) {
        this.props.setLogo('../' + o_logo.url);
      } else {
        this.props.setLogo(logo);
      }
      const banner = imgList.find((m) => m.name === 'banner');
      if (banner) {
        this.props.setBanner('../' + banner.url);
      } else {
        this.props.setBanner('');
      }
    } else {
      this.props.setLogo(logo);
      this.props.setBanner('');
    }
  };

  // 判断屏幕方向，加载背景图
  loadImgByDirection = () => {
    const { store } = this.props;
    if (store.merchantProfile.images?.length) {
      let imgList = store.merchantProfile.images;
      let o_s = imgList.find((m) => m.name == 'kiosk');
      let o_h = imgList.find((m) => m.name == 'kiosklite');
      if (isIpadEnv()) {
        if (window.orientation == 0 || window.orientation == 180) {
          // 竖
          if (o_s) {
            this.loadImg('../' + o_s.url);
          } else {
            this.loadImg(dishShu);
          }
        } else if (window.orientation == 90 || window.orientation == -90) {
          // 横
          if (o_h) {
            this.loadImg('../' + o_h.url);
          } else {
            this.loadImg(dishHeng);
          }
        }
      } else {
        if (window.screen.width >= window.screen.height) {
          if (o_h) {
            this.loadImg('../' + o_h.url);
          } else {
            this.loadImg(dishHeng);
          }
        } else {
          if (o_s) {
            this.loadImg('../' + o_s.url);
          } else {
            this.loadImg(dishShu);
          }
        }
      }
    } else {
      if (isIpadEnv()) {
        if (window.orientation == 0 || window.orientation == 180) {
          // 竖
          this.loadImg(dishShu);
        } else if (window.orientation == 90 || window.orientation == -90) {
          // 横
          this.loadImg(dishHeng);
        }
      } else {
        let bg = '';
        if (window.screen.width >= window.screen.height) {
          bg = dishHeng;
        } else {
          bg = dishShu;
        }
        this.loadImg(bg);
      }
    }
  };

  // 加载封面图
  loadImg = (img) => {
    this.props.setImg(img);
    const wasLoading = this.state.manualRefresh;
    this.setState({ manualRefresh: false }, () => {
      // kpos/webapp/marginapp 等主流程 Loading 结束后，再触发版本检测，避免 margin 配置被覆盖
      if (wasLoading) {
        EventBus.emit('mainPageConfigSettled');
      }
    });
  };

  resizeload = debounce(() => {
    getDeviceDirection();
    this.screenSaverRef.current?.reload();
    this.loadImgByDirection();
  }, 500);

  handleResolvePromotion = () => {
    // 处理promotion相关
    const {
      setPromotion,
      setBuyGiftRule,
      setExchangePurchaseRule,
      setBuyDiscountRule,
      setOrderDiscount,
      setCloudPromotion,
      setPromotionCode,
    } = this.props;
    getPromotionProcedure({
      setPromotion,
      setBuyGiftRule,
      setExchangePurchaseRule,
      setBuyDiscountRule,
      setOrderDiscount,
      setCloudPromotion,
      setPromotionCode,
    });
  };

  componentDidMount() {
    this.mainPageUnmounted = false;
    preloadOrderPageAssets();
    // 回到首页销毁crm集成sdk实例
    crmIntegrationSDK.unMount();
    this.props.setCRMAuthCodeVerified(false);
    this.props.setGiftCardPaymentInfo(null);
    // 清空图片路径缓存，重新整理MAP的值
    clearImagePathCache();
    // 解决 因为没有orderType导致的默认订单为 DINE IN的问题
    window.selectedOrderType = '';
    this.handlePollingConfig();
    this.loadECardConfig();
    this.handleSetPosVersion();
    this.recordLicenseList();
    this.handleResolvePromotion();
    this.props.setShowBanner(true);
    this.props.setShowBannerPro(true);
    this.props.setShowWaitingTimeModal(true);
    this.props.setExpandFreeList(false);
    this.props.setShowLoginGuideDialog(true);
    this.props.saveTipAmount(0);
    window.kioskLocalDiscountPromotion = null;
    this.props.setIsPauseAutoValidatePromotion(false);

    // 监听 app 组件的连接恢复事件，自动清除错误弹窗
    EventBus.on('posConnectionRestored', this.handlePosConnectionRestored);
    const { firstLoad, toggleKioskLicense } = this.state;
    on(window, 'resize', this.resizeload);
    this.props.setCateyPageDomTop(0);
    this.props.setorderPageDomTop(0);
    this.props.clearPayType();
    this.props.clearSearchKeyWord();
    this.props.initSystemStore();
    this.props.setBuyGifts([]);
    this.props.setSatisfyRules([]);
    this.props.setTableId(null);
    this.props.resetCurrentOrder();

    if (firstLoad) {
      if (toggleKioskLicense) {
        this.loadParams();
        getChooseTableStatus(true);
      } else {
        // 选择Licenes阶段
        this.beforeLicenesFetch();
      }
    } else {
      if (!this.state.toggleKioskLicense || !getCookie('kioskLicense')) {
        this.handleRefresh();
      } else {
        this.backParams();
        getChooseTableStatus(true);
        const { selfConfig, systemConfig, isConnectWs, isMenuUpdated } =
          this.props;
        const isWaitList = selfConfig?.configMap?.id_13;
        const orderTypeList =
          systemConfig?.CHOOSE_ORDER_TYPE?.value?.split(',') || [];
        let isTogo = !!(
          orderTypeList?.length && orderTypeList?.indexOf('1') > -1
        );
        if (isWaitList && !isTogo) {
          // 只有等位模式下，不用更新菜单
        } else {
          // ws断开状态、有菜单更新状态
          if (!isConnectWs || isMenuUpdated) {
            this.props.setIsMenuUpdated(false);
            fetchMenuGroup()
              .then(async (res) => {
                if (res.data.KioskMenus[0].menuGroups?.length) {
                  await this.getFreeItemShowPosition();
                  this.props.initMenuGroupList(res.data);
                } else {
                  this.showError(NO_AVAILABLE_MENU, 1, 'no menu');
                }
              })
              .catch(() => {
                this.showError(NO_AVAILABLE_MENU, 1, 'catch in fetch menu');
              });
            // 配置更新
            Promise.all([
              fetchTaxInfo(),
              fetchItemSizeList(),
              fetchSystemConfigAllList(),
            ]).then((res) => {
              this.props.initConfigParams(
                null,
                res[0].data,
                res[1].data,
                res[2].data
              );
            });
          }
        }
      }
    }
    if (
      (window.isAndroidShell && window.isAndroidShell()) ||
      (window.isIosShell && window.isIosShell())
    ) {
      console.log('Android/iOS设备，开始获取License的蓝牙支付配置');
      getLicenseInfo().then((res) => {
        const licenseDetail = res.data
          ? this.parseLicenseXml(res.data) || []
          : [];
        this.getDevicesInfo(licenseDetail[0]?.paymentterminalid);
      });
    } else {
      posFrontLog('非Android/iOS设备，不获取License的蓝牙支付配置');
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // 监听 promotionCenterList 的变化，当它从 null 变为有值时，说明促销中心活动列表已获取完成
    const prevPromotionCenterList = prevProps.promotion?.promotionCenterList;
    const currentPromotionCenterList =
      this.props.promotion?.promotionCenterList;

    if (
      prevPromotionCenterList === null &&
      currentPromotionCenterList !== null
    ) {
      this.handleResolvePromotion();
    }

    if (!prevState.toggleKioskLicense && this.state.toggleKioskLicense) {
      this.screenSaverRef.current?.reload?.({ skipBootstrapLoading: false });
    }
  }

  handleSetPosVersion = async () => {
    const res = await fetchCompanyProfile();
    const posVersion = res?.data?.company?.appInfo?.version;
    if (posVersion) {
      localStorage.setItem('posVersion', JSON.stringify(posVersion));
    }
  };

  componentWillUnmount() {
    this.mainPageUnmounted = true;
    this.startOrderInProgress = false;
    this.startOrderRequestId += 1;
    off(window, 'resize', this.resizeload);
    clearInterval(this.pollingTimer);
    clearTimeout(this.noLicenseReloadTimer);
    this.noLicenseReloadTimer = null;

    // 移除事件监听
    EventBus.off('posConnectionRestored');
  }

  static getDerivedStateFromProps() {
    const kioskLicense = getCookie('kioskLicense');
    if (kioskLicense) {
      return {
        toggleKioskLicense: true,
      };
    }
    return null;
  }

  handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      this.validateLicense();
    }
  };

  render() {
    const {
      manualRefresh,
      toggleKioskLicense,
      licenseValue,
      toggleLicenseSelection,
      optionGroups,
      valueGroups,
      licenseErrorMsg,
      licenseErrorShow,
      error,
      errorMsg,
      errorTxt,
      screenSaverData,
      screenSaverStatus,
      screenSaverBootstrapDone,
      showBrandList,
      keyboardToggle,
      noLicenseReloadDialogVisible,
    } = this.state;
    const { t, selfConfig, systemConfig, store, bgImg, logoImg, menuGroup } =
      this.props;
    const shopName = store?.merchantProfile?.name || '';
    let btnContent = null;
    let licenseContent = null;
    const isShowPrintDebug =
      store?.allSysConfig?.PRINTING_DEBUG_MODE === 'true';
    const { brandManage } = selfConfig;
    const environment = isDevelopment() ? 'DEV' : isIntegration() ? 'QA' : '';

    // 底部版本号和刷新按钮
    const bottomText = (
      <div className={styles.bottomText}>
        <KioskVersionControl
          selfConfig={selfConfig}
          saveConfigData={this.saveConfigData}
          setSelfConfig={this.props.setSelfConfig}
          environment={environment}
          screenSaverFooter={screenSaverStatus === SCREENSAVERSTATUS.DISPLAY}
        />
        <div
          className={styles.refreshText}
          onClick={(e) => {
            e.stopPropagation();
            this.handleRefresh();
          }}
        >
          <Icon type="refresh" size={2.4} color="#999" />
          <span>{t('refresh')}</span>
        </div>
      </div>
    );

    if (!toggleKioskLicense) {
      licenseContent = (
        <div className={styles.licenseSelectBx}>
          <div className={styles.licenseSelectBxInner}>
            <div className={styles.enterLicenseBox}>
              <div className={styles.enterLicenseIcon}></div>
              <div className={styles.enterLicense}> Enter License </div>
            </div>
            <div className={styles.licenseInputBx}>
              <input
                maxLength={20}
                className={styles.licenseInput}
                type="text"
                defaultValue={licenseValue}
                onClick={() => {
                  if (isOpenVtkeyboadrd()) {
                    this.showKeyboard();
                  }
                }}
                onKeyUp={this.handleKeyUp}
                onChange={(event) => {
                  this.licenseInputHandler(event);
                }}
              />
            </div>
            <div className={styles.licenseNext}>
              <div
                className={styles.licenseNextBtn}
                onClick={this.validateLicense}
              >
                <div className={styles.itemName}>{t('next')}</div>
              </div>
            </div>
            <div
              className={styles.selectLicenseBx}
              onClick={this.toggleLicenseSelectionHandler}
            >
              {t('select_existing_license')}
            </div>
          </div>

          {keyboardToggle ? (
            <VtKeyboard
              keyboardValue={licenseValue}
              handlePressEnter={this.validateLicense}
              changeInput={(v) => this.licenseInputHandler(v, true)}
              closeKeyboard={() => this.hideKeyboard()}
              VKOuterStyle={{ zIndex: 9999 }}
            />
          ) : null}
        </div>
      );
    } else if (toggleLicenseSelection) {
      licenseContent = (
        <div className={styles.licenseSelectionBx}>
          <div className={styles.licenseSelectionInner}>
            <div className={styles.licenseListBx}>
              <Picker
                optionGroups={optionGroups}
                itemHeight={140}
                height={400}
                valueGroups={valueGroups}
                onChange={this.licenseSelectionHandler}
              ></Picker>
            </div>
            <div className={styles.actionBx}>
              <div
                className={styles.cancelBtn}
                onClick={this.cancelLicenseSelection}
              >
                {t('cancel')}
              </div>
              <div
                className={styles.okBtn}
                onClick={this.submitSelectedLicense}
              >
                {t('ok')}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 配置项-语言个数 > 1(id: 10)
    const isOpenLan = selfConfig?.configMap?.id_10?.length > 1;
    const languageBtnText = getLanguageBtnDisplayText(
      selfConfig?.configMap?.id_65,
      'mainPage_languageBtn',
      'language'
    );
    // 配置项-是否等位 (id: 13)
    const isWaitList = selfConfig?.configMap?.id_13;
    // 订单类型-是否含Togo ('1')
    const orderTypeList =
      systemConfig?.CHOOSE_ORDER_TYPE?.value?.split(',') || [];
    const isTogo = !!(orderTypeList.length && orderTypeList?.indexOf('1') > -1);
    let btnCount = 0;

    // 开启等位
    if (isWaitList) {
      if (isTogo) {
        btnCount = isOpenLan ? 3 : 2;
        btnContent = (
          <React.Fragment>
            <div
              className={[styles.btnsBox, styles['btnCount_' + btnCount]].join(
                ' '
              )}
            >
              <div
                className={`${styles.togo} animate-btn`}
                onClick={this.handleTogo}
              >
                {t('order_type_1')}
              </div>
              <div
                className={`${styles.waitLst} animate-btn`}
                onClick={this.handleWaitlist}
              >
                {t('wait-list')}
              </div>
              {isOpenLan ? (
                <div className={styles.languageBtn} onClick={this.handleLang}>
                  <Icon
                    className={styles.languageIcon}
                    type="language"
                    size={4}
                    color="#000"
                  />
                  <span>{languageBtnText}</span>
                </div>
              ) : null}
            </div>
          </React.Fragment>
        );
      } else {
        btnCount = 1;
        // 仅开启等位，没有togo
        btnContent = (
          <React.Fragment>
            <div className={[styles.btnsBox, styles.btnCount_1].join(' ')}>
              <div
                className={`${styles.waitLst} animate-btn`}
                onClick={this.handleWaitlist}
              >
                {t('wait-list')}
              </div>
            </div>
          </React.Fragment>
        );
      }
    } else {
      // 关闭等位
      btnCount = isOpenLan ? 2 : 1;
      btnContent = (
        <div
          className={[styles.btnsBox, styles['btnCount_' + btnCount]].join(' ')}
        >
          <div
            className={`${styles.orderingBtn} animate-btn`}
            onClick={this.handleStartOrder}
          >
            {t('startOrder')}
          </div>
          {isOpenLan ? (
            <div
              className={styles.languageBtn}
              onClick={() => {
                this.handleLang(1);
              }}
            >
              <Icon
                className={styles.languageIcon}
                type="language"
                size={4}
                color="#000"
              />
              <span>{languageBtnText}</span>
            </div>
          ) : null}
        </div>
      );
    }

    // 判断品类是否展示为首页
    const isOpenBrandSetting = selfConfig?.configMap?.id_26;
    const brandListHome = selfConfig?.configMap?.id_31;
    const isBrandAsHome = isOpenBrandSetting && brandListHome;
    const showScreenSaverBootstrapLoading =
      toggleKioskLicense && !screenSaverBootstrapDone;

    return (
      <React.Fragment>
        <MainPageScreenSaver
          ref={this.screenSaverRef}
          merchantId={this.props.merchantId}
          toggleKioskLicense={toggleKioskLicense}
          setShowScreensaver={this.props.setShowScreensaver}
          onStartOrder={this.handleStartOrder}
          onSaveConfig={this.saveConfigData}
          onMetaChange={this.handleScreenSaverMetaChange}
          onScreenSaverLoadStarted={this.handleScreenSaverLoadStarted}
          onScreenSaverLoadSettled={this.handleScreenSaverLoadSettled}
          bottomText={bottomText}
        />
        {screenSaverStatus !== SCREENSAVERSTATUS.DISPLAY && (
          <React.Fragment>
            {/* 选择license */}
            {licenseContent}

            {!showScreenSaverBootstrapLoading ? (
              <>
                {isBrandAsHome ? (
                  <div
                    className={[
                      styles.mainPageContainer,
                      styles.brandStyle,
                      styles[getDeviceDirection()],
                    ].join(' ')}
                  >
                    {isShowPrintDebug && (
                      <div className={styles.showDebug}>{t('debug-mode')}</div>
                    )}
                    <BrandListContent
                      brandManage={selfConfig.brandManage}
                      menuGroup={menuGroup}
                      selfConfig={selfConfig}
                      onSelectEffect={this.handleClickBrand}
                    />
                    {bottomText}
                    <WaitingInfo isFixed={true} />
                  </div>
                ) : (
                  <div
                    className={[
                      styles.mainPageContainer,
                      styles[getDeviceDirection()],
                    ].join(' ')}
                  >
                    {isShowPrintDebug && (
                      <div className={styles.showDebug}>{t('debug-mode')}</div>
                    )}
                    <div
                      onClick={this.handleStartOrder}
                      className={styles.mainBg}
                      style={{ backgroundImage: `url(${bgImg})` }}
                    ></div>
                    <div className={styles.mainBox}>
                      <div
                        className={[
                          styles.mainLogo,
                          styles['mainLogo_' + btnCount],
                        ].join(' ')}
                      >
                        <div className={styles.logoBox}>
                          <div className={styles.logo}>
                            <img src={logoImg} />
                          </div>
                          <div className={styles.mainName}>{shopName}</div>
                        </div>
                      </div>
                      <div className={styles.mainBtn}>{btnContent}</div>
                      <WaitingInfo isFixed={true} />
                    </div>
                    {bottomText}
                  </div>
                )}
              </>
            ) : null}

            <Dialog
              visible={showBrandList}
              html={
                <BrandList
                  showHomePage={screenSaverData?.showHomePage}
                  brandManage={brandManage}
                  menuGroup={menuGroup}
                  selfConfig={selfConfig}
                  onClose={this.closeBrandList}
                />
              }
            />

            <Dialog
              visible={noLicenseReloadDialogVisible}
              html={
                <div className={styles.containerBox}>
                  <div className={styles.itemBox}>
                    <div className={styles.itemName}>
                      {t('kiosk-license-missing-refresh')}
                    </div>
                  </div>
                  <div className={styles.popupConfirmBtn}>
                    <span onClick={this.reloadPageImmediately}>
                      {t('refresh')}
                    </span>
                  </div>
                </div>
              }
            />

            <Loading
              visible={manualRefresh || showScreenSaverBootstrapLoading}
            />
            {licenseErrorShow && licenseErrorMsg && (
              <div className={styles.errorlicense}>
                <span className={styles.text}>{licenseErrorMsg}</span>
              </div>
            )}

            <Dialog
              visible={error}
              html={
                <div className={styles.containerBox}>
                  <div className={styles.itemBox}>
                    <div className={styles.itemName}>{errorMsg}</div>
                  </div>
                  <div className={styles.popupConfirmBtn}>
                    <span
                      onClick={(event) => {
                        event.stopPropagation();
                        if (errorTxt === 'refresh') {
                          this.handleRefresh();
                        } else if (errorTxt === 'close') {
                          this.hideError();
                        }
                      }}
                    >
                      {t([errorTxt])}
                    </span>
                  </div>
                </div>
              }
            />
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    selfConfig: state.selfConfig,
    allSysConfig: state.allSysConfig,
    merchantId: state.merchantProfile?.merchantId,
    menuGroup: state.menuGroup,
    systemConfig: state.systemConfig,
    bgImg: state.img.bgImg,
    logoImg: state.img.logoImg,
    isConnectWs: state.socket.isConnectWs,
    isMenuUpdated: state.socket.isMenuUpdated,
    promotion: state.promotion,
    sysCookie: state.sysCookie,
    crm: state.crm,
  };
}

export default connect(mapStateToProps, {
  initSystemStore,
  initCompanyParams,
  initConfigParams,
  setLanModal,
  setLanModalFn,
  clearPayType,
  initParams,
  resetCurrentOrder,
  clearSearchKeyWord,
  setSelfConfig,
  setImg,
  setLogo,
  setBanner,
  setBannerPro,
  setLang,
  initMenuGroupList,
  initMenuGroup2,
  refreshMenuStockNumIfChanged,
  setIsMenuUpdated,
  changeOrderType,
  setCateyPageDomTop,
  setorderPageDomTop,
  setUpdateMenuLoad,
  setSelectedBrand,
  setBrandMenu,
  setBuyGifts,
  setSatisfyRules,
  setShowBanner,
  setShowBannerPro,
  setShowWaitingTimeModal,
  setExpandFreeList,
  setShowLoginGuideDialog,
  setLicenseList,
  setBuyGiftRule,
  setExchangePurchaseRule,
  setBuyDiscountRule,
  setOrderDiscount,
  setPromotion,
  setCloudPromotion,
  setPromotionCode,
  setTableId,
  setCRMAuthCodeVerified,
  setGiftCardPaymentInfo,
  setFreeItemMenuPosition,
  setShowScreensaver,
  setMobyDeviceLinkStatus,
  setMobyDeviceInfo,
  setTriposPayReady,
  setTriposPayFinish,
  saveTipAmount,
  recordKioskDiscountPromotion,
  setECardSettings,
  setIsPauseAutoValidatePromotion,
})(withTranslation()(MainPage));
