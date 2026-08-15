import React, { lazy } from 'react';
import { connect } from 'react-redux';
import Alert from '@material-ui/lab/Alert';
import RequireCategoryTip from '../../component/requireCategoryTip';
import FootBtn from './footBtn';
import ChangeBrandBtn from './changeBrandBtn';
import styles from './orderPage.module.scss';
import FallbackLoading from '@/component/FallbackLoading';
import {
  initEditOrderMode,
  setEditComboQty,
  clearCurrentItem,
  setkeyboardToggle,
  resetCurrentOrderCombo,
  setSelfConfig,
  setIsReorderFlag,
  setOrderStatus,
  setCardPaidResult,
  setGiftCardPaymentInfo,
  clearECardState,
  setTabelServiceType,
  clearSearchKeyWord,
  removeSearchItem,
  setCateDish,
  setShowBanner,
  setShowBannerPro,
  setShowWaitingTimeModal,
  setShowLoginGuideDialog,
} from '@/actions';
import { setBuyGifts, setSatisfyRules } from '@/actions/promotion';
import { getMarginappFetchConfig } from '@/api';
import { getChargeList } from '@/api/apiPos';
import { XMLObjTree } from '@/utils/ObjectTree';
import { judgeSskeyIsActiveTime, getDeviceOrientation } from '@/utils';
import {
  LOGIN_BANNER_TOP,
  LOGIN_REWARDBANNER_HORIZONTAL_TOP,
  LOGIN_REWARDBANNER_VERTICAL_TOP,
  LOGIN_REWARDBANNER_NOASSERT_TOP,
  STANDARD_TOP,
} from '@/constants/constantUnit';
import Dialog from '@/component/dialog';
import { EventBus } from '@/utils/EventBus';
import { withTranslation } from 'react-i18next';
import WaitingInfo from './waitingInfo';
import BannerPro from './bannerPro';
import NoMenuTips from './noMenuTips';
import crmIntegrationSDK from '@/utils/CRMIntegration/marketSDK';
import checkCRMStatus from '@/utils/checkCRMStatus';
import checkCRMType from '@/utils/checkCRMType';
import LoginGuideDialog from './loginGuideDialog';
import WAITINGIMG from '@/assets/images/waiting.png';
import Big from 'big.js';

const CategoryList = lazy(() => import('./categoryList'));
const CurrentItemList = lazy(() => import('./currentItemList'));
const isVertical = getDeviceOrientation() === 'vertical';

/** 根据当前 menuGroup 计算可展示菜品，避免 menuGroup 异步更新后 state 仍为空 */
function computeValidMenuList(menuGroup) {
  const groups = menuGroup || [];
  const allCate = groups.map((group) => group?.menuCategories || []).flat();
  const itemResources = allCate.map((each) => each?.saleItems || []).flat();
  return itemResources.filter((item) => !item?.hiddenItem);
}
class OrderPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorApiMsg: '',
      errorApiShow: false,
      isShowBanner: false,
      showBannerPro: false,
      showLoginGuideDialog: false,
      isShowWaitingTimeModal: false,
      time: 20,
      isCategoryReady: false,
      isItemListReady: false,
    };
    this.timer = null;
    this.noMenuTimer = null;
    this.listRef = React.createRef();
    this.waitingInfoRef = null;
  }

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

  // 格式化charge数据
  parseSurchargeXml = (data) => {
    let start = data?.indexOf('<soap:Body>');
    let end = data?.indexOf('</soap:Body>');
    data = data?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let list = objTree.parseXML(data);
    return list?.listchargesresponsetype?.charge;
  };

  updateInfo = () => {
    judgeSskeyIsActiveTime().then(() => {
      // 更新charge，更新kiosk配置项、售罄菜品ids
      getMarginappFetchConfig()
        .then((res) => {
          if (res.data.result.successful) {
            if (res.data.marginAppConfigTypes.length) {
              let obj = res.data.marginAppConfigTypes?.find(
                (p) => p.product == 'KIOSKLITE'
              );
              let configObj = JSON?.parse(obj.data);
              // 获取charge列表
              getChargeList()
                .then((resp) => {
                  let surchargeList = [];
                  let surchargeInfo = resp.data
                    ? this.parseSurchargeXml(resp.data) || []
                    : [];
                  if (
                    Object.prototype.toString.call(surchargeInfo) ===
                    '[object Object]'
                  ) {
                    surchargeList?.push(surchargeInfo);
                  } else {
                    surchargeList = [...surchargeInfo];
                  }

                  surchargeList?.unshift({
                    id: -1,
                    name: 'Free',
                    rate: 0,
                    ratetype: 1,
                    type: 'DEFAULT',
                  });

                  surchargeList?.forEach((sur) => {
                    sur.rate = parseFloat(Big(sur.rate).toFixed(2));
                  });

                  if (configObj.charge?.length) {
                    configObj?.charge?.forEach((c) => {
                      if (c?.select?.id) {
                        let r = surchargeList?.find(
                          (item) => item.id == c.select.id
                        );
                        if (r) {
                          if (c.id === 1) {
                            if (
                              c.select.rate === r.rate &&
                              c.select.ratetype === r.ratetype
                            ) {
                              c.select = r;
                            } else {
                              // 如果在pos端加收设置修改了对应charge的金额（百分比）或类型，则置空charge
                              c.select = {};
                            }
                          } else if (c.id == 2 || c.id == 3) {
                            if (r.ratetype == 1) {
                              c.select = r;
                            } else {
                              c.select = {};
                            }
                          }
                        } else {
                          c.select = {};
                        }
                      }
                    });
                  } else {
                    configObj.charge = [];
                  }

                  this.props.setSelfConfig(configObj);
                })
                .catch(() => {
                  configObj.charge = [];
                  this.props.setSelfConfig(configObj);
                });
            }
          } else {
            this.showApiModalTip(res.data?.result?.failureReason);
          }
        })
        .catch((err) => {
          this.showApiModalTip(err?.message);
        });
    });
  };

  crmIntegrationSDKInit = async () => {
    const { allSysConfig } = this.props;
    const isCRMEnable = !checkCRMStatus(allSysConfig);
    if (isCRMEnable) {
      const crmType = checkCRMType(allSysConfig);
      if (crmType === 2) {
        await crmIntegrationSDK.mount();
      }
    }
  };

  componentDidMount() {
    this.initializePage();
  }

  initializePage = async () => {
    this.props.setkeyboardToggle(false);
    this.props.setTabelServiceType('');
    this.props.setOrderStatus('');
    this.props.clearCurrentItem();
    this.props.resetCurrentOrderCombo();
    this.props.setIsReorderFlag(false);
    this.props.initEditOrderMode();
    this.props.setEditComboQty(1);
    this.props.setCardPaidResult({});
    this.props.setGiftCardPaymentInfo(null);
    this.props.clearECardState();

    // 从购物车返回点单页时，删除赠菜
    this.props.setBuyGifts([]);
    this.props.setSatisfyRules([]);
    // 获取kiosk配置信息和adSDK初始化
    await Promise.all([this.updateInfo(), this.crmIntegrationSDKInit()]);

    // 检查是否有菜单，如果没有菜单则不继续执行后续方法
    const hasMenu = await this.noMenuCountDown();
    if (!hasMenu) {
      return;
    }

    this.checkIsShowBannerPro();
    this.checkIsShowLoginGuideDialog();
    this.checkIsShowWaitingTimeModal();

    // 监听 LoginCRM 发来的显示 banner 事件
    EventBus.on('show_banner_in_orderpage', this.handleShowBannerFromLoginCRM);
  };

  componentDidUpdate(prevProps) {
    const prevValid = computeValidMenuList(prevProps.menuGroup);
    const currValid = computeValidMenuList(this.props.menuGroup);
    if (!prevValid.length && currValid.length) {
      if (this.noMenuTimer) {
        clearInterval(this.noMenuTimer);
        this.noMenuTimer = null;
      }
      this.setState({ time: 20 });
    } else if (prevValid.length && !currValid.length) {
      this.startNoMenuTimer();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    this.noMenuTimer && clearInterval(this.noMenuTimer);
    this.props.clearSearchKeyWord();
    this.props.removeSearchItem();

    // 移除 EventBus 监听器
    EventBus.off('show_banner_in_orderpage', this.handleShowBannerFromLoginCRM);
  }

  checkIsShowBanner = () => {
    const {
      img: { isShowBanner, banner },
    } = this.props;
    if (banner && isShowBanner) {
      this.setState({
        isShowBanner: true,
      });
    }
  };

  closeBanner = () => {
    this.props.setShowBanner(false);
    this.setState({
      isShowBanner: false,
    });
  };

  checkIsShowBannerPro = () => {
    const {
      img: { bannerPro, isShowBannerPro },
    } = this.props;
    if (
      bannerPro?.posterData?.length &&
      bannerPro?.status === 'enabled' &&
      isShowBannerPro
    ) {
      this.setState({
        showBannerPro: true,
      });
    }
  };

  closeBannerPro = () => {
    this.props.setShowBannerPro(false);
    this.setState({
      showBannerPro: false,
    });
  };

  checkIsShowWaitingTimeModal = () => {
    const {
      img: { isShowWaitingTimeModal },
      selfConfig,
    } = this.props;

    // 超过多长时间展示弹窗配置值
    const overTimeShowModal = selfConfig?.configList?.find(
      (each) => each.id === 44
    )?.value?.overTimeShowModal;
    const shouldShow = this.waitingInfoRef?.shouldShow || false;
    // 当前等待时间
    const waitingMinutes =
      Math.ceil(this.waitingInfoRef?.waitingTimeTotal / 60) || 0;
    const showModal =
      isShowWaitingTimeModal &&
      shouldShow &&
      overTimeShowModal &&
      waitingMinutes > overTimeShowModal;
    this.setState({
      isShowWaitingTimeModal: showModal,
    });
  };

  setWaitingInfoRef = (ref) => {
    this.waitingInfoRef = ref;
    // 当 ref 设置后，如果 isShowWaitingTimeModal 为 true，则重新检查
    if (this.props.img.isShowWaitingTimeModal) {
      this.checkIsShowWaitingTimeModal();
    }
  };

  closeWaitingTimeModal = () => {
    this.props.setShowWaitingTimeModal(false);
    this.setState({
      isShowWaitingTimeModal: false,
    });
  };

  checkIsShowLoginGuideDialog = () => {
    const {
      img: { isShowLoginGuideDialog },
      selfConfig,
      allSysConfig,
    } = this.props;

    const loginGuideStatus = selfConfig?.configList?.find(
      (each) => each.id === 45
    ).value?.dialog?.status;

    const isCRMEnable = !checkCRMStatus(allSysConfig);

    if (isCRMEnable && loginGuideStatus && isShowLoginGuideDialog) {
      this.setState({
        showLoginGuideDialog: true,
      });
    } else {
      this.checkIsShowBanner();
    }
  };

  confirmLoginGuideDialog = () => {
    this.closeLoginGuideDialog(true);
    EventBus.emit('open_login_modal');
  };

  closeLoginGuideDialog = (goInput = false) => {
    if (!goInput) {
      // 纯关闭后展示banner
      this.checkIsShowBanner();
    }
    this.props.setShowLoginGuideDialog(false);
    this.setState({
      showLoginGuideDialog: false,
    });
  };

  // 显示 banner
  handleShowBannerFromLoginCRM = () => {
    this.checkIsShowBanner();
  };

  // 返回首页
  handleBackHome = () => {
    this.props.history.push('/');
  };

  startNoMenuTimer = () => {
    if (this.noMenuTimer) return;
    this.setState({ time: 20 });
    this.noMenuTimer = setInterval(() => {
      if (this.state.time > 0) {
        this.setState({
          time: this.state.time - 1,
        });
      } else {
        this.handleBackHome();
      }
    }, 1000);
  };

  // 无菜单展示
  noMenuCountDown = async () => {
    const validMenuList = computeValidMenuList(this.props.menuGroup);
    if (!validMenuList.length) {
      this.startNoMenuTimer();
      return false;
    }
    return true;
  };

  render() {
    const {
      requireCategory,
      crm: { isShowLoginBar, memberCRMInfo, selectedFreeItem },
      img: { banner },
      t,
      promotion,
      currentOrder,
      selfConfig,
      avocado: { hasAssertList },
    } = this.props;
    const {
      errorApiShow,
      errorApiMsg,
      isShowBanner,
      time,
      showBannerPro,
      showLoginGuideDialog,
      isShowWaitingTimeModal,
      isCategoryReady,
      isItemListReady,
    } = this.state;

    const validMenuList = computeValidMenuList(this.props.menuGroup);

    const isRequireTipShow = !!requireCategory.length;
    const { itemList, isShowCheckFooter } = currentOrder;
    const isTopMenu =
      selfConfig?.configList?.find((each) => each.id === 33).value === 1;

    let classname = '';
    if (isRequireTipShow) {
      classname = 'orderPageRequire';
    }

    let headerHeight = STANDARD_TOP;

    // rewardTop 有资产or无资产 横屏竖屏 都高度不同
    const rewardTop = hasAssertList
      ? isVertical
        ? LOGIN_REWARDBANNER_VERTICAL_TOP
        : LOGIN_REWARDBANNER_HORIZONTAL_TOP
      : LOGIN_REWARDBANNER_NOASSERT_TOP;

    if (isShowLoginBar) {
      headerHeight += memberCRMInfo?.id ? rewardTop : LOGIN_BANNER_TOP;
    }

    // 点单菜品 + 赠菜
    const allOrderItems = [...itemList];
    if (selectedFreeItem?.length > 0) {
      allOrderItems.push(...selectedFreeItem);
    }

    const isOrderedItem = allOrderItems.length > 0;

    return (
      <>
        {!showBannerPro && (
          <div
            className={styles.orderPage}
            style={{ top: isShowLoginBar ? 'auto' : '8.8rem' }}
          >
            <WaitingInfo isFixed={true} ref={this.setWaitingInfoRef} />
            {/* 必选类的提示 */}
            {isRequireTipShow ? <RequireCategoryTip /> : null}

            <div
              className={[
                styles.orderPageBody,
                classname ? styles[classname] : '',
                isTopMenu ? styles.topMenu : '',
              ].join(' ')}
              onClick={() => {
                this.props.setkeyboardToggle(false);
              }}
            >
              <CategoryList
                headerHeight={headerHeight}
                listRef={this.listRef}
                isTopMenu={isTopMenu}
                onReady={() => this.setState({ isCategoryReady: true })}
              />
              <CurrentItemList
                headerHeight={headerHeight}
                listRef={this.listRef}
                isTopMenu={isTopMenu}
                onReady={() => {
                  this.setState({ isItemListReady: true });
                }}
              />
            </div>

            {isOrderedItem && isShowCheckFooter && <FootBtn />}
            <ChangeBrandBtn />
          </div>
        )}

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        <Dialog
          visible={isShowBanner}
          html={
            <div
              className={styles.bannerWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={styles.banner}
                style={{ backgroundImage: `url(${banner})` }}
              />
              <div className={styles.start} onClick={this.closeBanner}>
                {t('i-know')}
              </div>
            </div>
          }
          onClose={this.closeBanner}
        />

        <Dialog
          visible={showLoginGuideDialog}
          html={
            <LoginGuideDialog
              onClose={() => {
                this.closeLoginGuideDialog(false);
              }}
              handleConfirm={this.confirmLoginGuideDialog}
            />
          }
          onClose={() => {
            this.closeLoginGuideDialog(false);
          }}
        />

        <Dialog
          visible={showBannerPro}
          html={<BannerPro onClose={this.closeBannerPro} />}
        />

        <Dialog
          visible={isShowWaitingTimeModal}
          html={
            <div
              className={styles.waitingTimeWrapper}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={WAITINGIMG} className={styles.waitingTimeImg} />
              <WaitingInfo outputNormalText={true} />
              <div
                className={styles.gotIt}
                onClick={this.closeWaitingTimeModal}
              >
                {t('i-know')}
              </div>
            </div>
          }
          onClose={this.closeWaitingTimeModal}
        />

        <Dialog
          visible={!validMenuList.length}
          html={<NoMenuTips handleBackHome={this.handleBackHome} time={time} />}
        />

        {/* 菜单有数据，子组件未渲染完成时显示 loading 覆盖层 */}
        {!showBannerPro &&
          (!isCategoryReady || !isItemListReady) &&
          validMenuList.length > 0 && <FallbackLoading />}
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    requireCategory: state.requireCategory,
    currentOrder: state.currentOrder,
    crm: state.crm,
    menuGroup: state.menuGroup,
    selfConfig: state.selfConfig,
    brandSetting: state.brandSetting,
    img: state.img,
    promotion: state.promotion,
    allSysConfig: state.allSysConfig,
    avocado: state.avocado,
  };
}

export default connect(mapStateToProps, {
  initEditOrderMode,
  setEditComboQty,
  clearCurrentItem,
  setkeyboardToggle,
  resetCurrentOrderCombo,
  setSelfConfig,
  setIsReorderFlag,
  setOrderStatus,
  setCardPaidResult,
  setGiftCardPaymentInfo,
  clearECardState,
  setTabelServiceType,
  clearSearchKeyWord,
  removeSearchItem,
  setCateDish,
  setShowBanner,
  setShowBannerPro,
  setShowWaitingTimeModal,
  setShowLoginGuideDialog,
  setBuyGifts,
  setSatisfyRules,
})(withTranslation()(OrderPage));
