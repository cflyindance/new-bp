import React from 'react';
import Dialog from '../../../component/dialog';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './currentItemList.module.scss';
import { withRouter } from 'react-router-dom';
import Toast from '@/component/toast';
import OrderDetailModal from '../orderDetailModal';
import ChooseDeleteOrder from '../chooseDeleteOrder';
import DescViewModal from '@/component/DescViewModal';
import {
  addCombo2Order,
  getCurrentCategory,
  getCurrentItem,
  removeFreeItemInOrder,
  removeItemFromOrder,
  setorderPageDomTop,
  setVListScroll,
  setExpandFreeList,
  setActivityCurrentItem,
} from '@/actions';
import { off, on, solveScrollElem } from '@/utils';
import {
  attachCategoryOptionsToItem,
  calcColNum,
  getCurrentItemLanguage,
  judgeHasDetailInfo,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import DishList from './DishList';
import remToPx from '../../../utils/CountRemToPx';
import isEqual from 'lodash/isEqual';
import ComboPanel from '../../comboPanel';
import OldDIshList from '../oldDIshList';
import { TOP_MENU } from '@/constants/constantUnit';
import handleCountRowNum from '@/utils/handleCountRowNum';
import { EventBus } from '@/utils/EventBus';
import {
  isStockSufficient,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import { changeFreeItem, setTempCampaign } from '@/actions/crm_action';
import {
  checkIsCampaignValid,
  handleCheckFreeItem,
} from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import {
  setItemValidPromotion,
  changeCrmPromotionContraryInfo,
  changePromotionStatusAfterCheck,
} from '@/actions/promotion';
import { isHasPromotionFn } from '@/utils/CRMIntegration/crmPromotionContrary';

const defaultMax = 99;

class CurrentItemList extends React.Component {
  constructor() {
    super();
    this.state = {
      colNum: 2,
      maxNum: defaultMax,
      isShowDeleteModal: false,
      toggleSizePanel: false,
      toggleItemDetailPanel: false,
      selectedItem: {},
      cateDescShow: false,
      description: '',
      scrollTimer: null,
      orderPanelShow: false,
      allCategoryItem: [],
      comboPanelVisible: false,
      isReady: false, // 添加就绪状态
      dishListReady: false, // DishList 渲染完成状态
      oldDishListReady: false, // OldDIshList 渲染完成状态
    };
    this.itemListDom = React.createRef();
    this.orderDetailModal = React.createRef();
  }

  // 判断购物车里面的菜，是否只有一种类（size，options等属性都相同）
  judegCartHasSameDish = (itemInfo) => {
    const {
      currentOrder: { itemList },
    } = this.props;

    const result = itemList.filter((o) => o.id == itemInfo.id);
    return !!(result.length == 1);
  };

  // 打开删除菜品多属性弹框
  handleOpenDeleteModal = (e) => {
    this.setState(
      {
        selectedItem: e,
        isShowDeleteModal: true,
      },
      () => {
        solveScrollElem(true);
      }
    );
  };

  // 关闭删除菜品多属性弹框
  handleCloseDeleteModal = () => {
    this.setState(
      {
        selectedItem: {},
        isShowDeleteModal: false,
      },
      () => {
        solveScrollElem(false);
      }
    );
  };

  openOrderDetailModal = (ref) => {
    this.orderDetailModal = ref;
  };

  getCurrentItemQty = ({ itemId, isFreeItem }) => {
    const {
      crm: { selectedFreeItem },
      currentOrder: { itemList },
    } = this.props;
    if (selectedFreeItem?.length > 0 && isFreeItem) {
      const isCurrentItem = selectedFreeItem.find((each) => each.id === itemId);
      if (isCurrentItem) {
        return isCurrentItem?.quantity;
      }
    }
    let itemQty = 0;
    for (let item of itemList) {
      if (isFreeItem) {
        if (item.isFreeItem && item.oId === itemId) {
          itemQty += item.quantity;
        }
      } else {
        if (item.id === itemId) {
          itemQty += item.quantity;
        }
      }
    }
    return itemQty;
  };

  resizeload = debounce(() => {
    const colNum = calcColNum();
    this.setState({ colNum });
  }, 500);

  componentDidMount() {
    const colNum = calcColNum();
    this.setState({ colNum });
    on(window, 'resize', this.resizeload);
    const { orderPageDomTop } = this.props;
    let el = this.itemListDom.current;
    if (el) {
      orderPageDomTop && (el.scrollTop = orderPageDomTop);
    }
    this.setState({
      allCategoryItem: this.props.allMenu
        .map((each) => each.menuCategories)
        .flat(),
    });
  }

  componentWillUnmount() {
    off(window, 'resize', this.resizeload);
    const { history } = this.props;
    if (
      history.location.pathname.indexOf('/orderReview') > -1 ||
      history.location.pathname.indexOf('/comboPanel') > -1
    ) {
      let top = Math.floor(this.itemListDom?.current?.scrollTop) || 0;
      this.props.setorderPageDomTop(top);
    } else {
      this.props.setorderPageDomTop(0);
    }
  }
  handleHorizontalScroll = (cateItemWrapper) => {
    const topContainer = document.getElementById('topCategoryList');
    const { getCurrentCategory } = this.props;
    const cateId = cateItemWrapper.getAttribute('data-cate');
    const groupId = cateItemWrapper.getAttribute('data-group-id');
    if (cateId && groupId) {
      const _cateId = isNaN(+cateId) ? cateId : +cateId;
      getCurrentCategory(_cateId);
      const topNavs = topContainer.querySelectorAll('[datacategoryid]');
      const scrollNav = Array.from(topNavs).find((navItem) => {
        const datCateId = navItem.getAttribute('datacategoryid');
        return datCateId === cateId;
      });
      scrollNav?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'end',
      });
    }
  };

  handleVerticalScroll = (cateItemWrapper) => {
    const leftContainer = document.getElementById('categoryListId');
    const { getCurrentCategory, selfConfig, headerHeight } = this.props;
    const cateId = cateItemWrapper.getAttribute('data-cate');
    const groupId = cateItemWrapper.getAttribute('data-group-id');
    if (cateId && groupId) {
      const t = setTimeout(() => {
        const _cateId = isNaN(+cateId) ? cateId : +cateId;
        getCurrentCategory(_cateId);
        const isShowGroup = selfConfig?.configMap?.id_17;
        const leftNavs = leftContainer.querySelectorAll('[datacategoryid]');
        let scrollNav = null;
        // 不展示组名称
        if (!isShowGroup) {
          scrollNav = Array.from(leftNavs).find((navItem) => {
            const datCateId = navItem.getAttribute('datacategoryid');
            return datCateId === cateId;
          });
        } else {
          scrollNav = leftContainer
            ?.querySelector(`div[datagroupid="${groupId}"]`)
            ?.querySelector(`div[datacategoryid="${cateId}"]`);
        }
        if (!scrollNav) return clearTimeout(t);
        // scrollNav.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'center' });
        let { top, height } = scrollNav.getBoundingClientRect();
        const standardTop = remToPx(headerHeight) - remToPx(2);
        const standardBottom = remToPx(20);
        const roundTop = Math.round(top);
        if (
          roundTop >= standardTop &&
          roundTop <= window.innerHeight - standardBottom
        )
          return clearTimeout(t);
        const elCenter = roundTop + height / 2;
        const center = window.innerHeight / 2;
        const countTop = leftContainer.scrollTop - (center - elCenter);
        leftContainer.scrollTo({
          top: countTop,
          behavior: 'smooth',
        });
        clearTimeout(t);
      }, 100);
    }
  };

  handleScrollList = debounce(
    (e) => {
      // 始终记录滚动偏移（含点击分类触发的 scrollTo），供返回菜单页恢复；isManualScrolling 只用于抑制下方「同步导航」逻辑
      this.props.setVListScroll(e.scrollOffset ?? 0);
      if (window.isManualScrolling) return;
      // 点击左侧组时 不监听scroll事件
      if (window.leftNavTimer) return;
      const cateList = document
        .getElementsByClassName('v_dishList')[0]
        ?.childNodes[0]?.querySelectorAll('div[index]');
      if (!cateList?.length) return;
      const { isTopMenu, headerHeight } = this.props;
      let areaHeight = remToPx(headerHeight) + 130;
      if (isTopMenu) {
        areaHeight += remToPx(TOP_MENU);
      }
      const groupList = Array.from(cateList);
      let cateItemWrapper = groupList.find((item) => {
        let itemReact = item.getBoundingClientRect();
        return (
          itemReact.y <= areaHeight &&
          itemReact.y + itemReact.height > areaHeight
        );
      });
      if (!cateItemWrapper) return;
      const emptyCate = cateItemWrapper.getAttribute('data-group-id');
      const isLast = emptyCate === 'emptyBox';
      if (isLast) {
        const lastIdx = groupList.findIndex((cate) => {
          const cateId = cate.getAttribute('data-group-id');
          return cateId === emptyCate;
        });
        // emptyBox 一定是最后一个，默认向上取1，以定位到最后一个菜类
        cateItemWrapper = groupList[lastIdx - 1];
      }
      if (cateItemWrapper) {
        // 头部导航滚动
        if (isTopMenu) {
          this.handleHorizontalScroll(cateItemWrapper);
        } else {
          // 左侧导航滚动
          this.handleVerticalScroll(cateItemWrapper);
        }
      }
    },
    80,
    { leading: false, trailing: true }
  );

  // 处理 DishList 渲染完成
  handleDishListReady = () => {
    this.setState({ dishListReady: true }, () => {
      this.checkAndNotifyReady();
    });
  };

  // 处理 OldDIshList 渲染完成
  handleOldDishListReady = () => {
    this.setState({ oldDishListReady: true }, () => {
      this.checkAndNotifyReady();
    });
  };

  // 检查并通知父组件渲染完成
  checkAndNotifyReady = () => {
    const { selfConfig } = this.props;
    const { dishListReady, oldDishListReady, isReady } = this.state;

    // 根据当前使用的组件检查对应的渲染状态
    const isOpenLazyLoad = selfConfig?.configList?.find(
      (each) => each.id === 32
    )?.value;
    const currentListReady = isOpenLazyLoad ? dishListReady : oldDishListReady;

    if (!isReady && currentListReady) {
      this.setState({ isReady: true }, () => {
        this.props.onReady && this.props.onReady();
      });
    }
  };

  componentDidUpdate(prevProps) {
    // 每类一条「类id + 下挂商品的 id:outOfStock」，分类增删/排序或售罄变化都会变
    const menuListSyncSignature = (allMenu) =>
      (Array.isArray(allMenu) ? allMenu : [])
        .flatMap((g) => g?.menuCategories || [])
        .map(
          (cate) =>
            `${cate?.id}:${(cate?.saleItems || [])
              .map((item) => `${item?.id}:${item?.outOfStock ?? ''}`)
              .join(',')}`
        );

    const orderTypeChanged =
      prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType;
    const allMenuReferenceChanged = prevProps.allMenu !== this.props.allMenu;

    if (
      orderTypeChanged ||
      allMenuReferenceChanged ||
      !isEqual(
        menuListSyncSignature(prevProps.allMenu),
        menuListSyncSignature(this.props.allMenu)
      )
    ) {
      this.setState(
        {
          allCategoryItem: this.props.allMenu
            .map((each) => each.menuCategories)
            .flat(),
        }
        // () => {
        //   this.props.listRef?.current?.resetAfterIndex(0);
        //   this.props.listRef?.current?.scrollTo(0);
        // }
      );
    }

    // 当切换组件时，重置渲染状态
    const prevIsOpenLazyLoad = prevProps.selfConfig?.configList?.find(
      (each) => each.id === 32
    )?.value;
    const currentIsOpenLazyLoad = this.props.selfConfig?.configList?.find(
      (each) => each.id === 32
    )?.value;
    if (prevIsOpenLazyLoad !== currentIsOpenLazyLoad) {
      this.setState({
        dishListReady: false,
        oldDishListReady: false,
        isReady: false,
      });
    }

    if (this.props.currentCategory.id !== prevProps.currentCategory.id) {
      if (this.itemListDom.current) {
        this.itemListDom.current.scrollTop = 0;
      }
    }
  }

  handleShowDesc = (cate) => {
    this.setState({
      cateDescShow: true,
      description: cate.description,
    });
  };

  clickItemCardHandler = async (itemInfo) => {
    const {
      t,
      currentOrder: { itemList },
      crm: { memberCRMInfo, selectedFreeItem },
      avocado: { metaData },
      promotion,
      selfConfig,
      setTempCampaign,
      changeCrmPromotionContraryInfo,
      changePromotionStatusAfterCheck,
    } = this.props;
    this.setState({
      selectedItem: itemInfo,
    });
    let tempRule = null;
    changePromotionStatusAfterCheck(itemInfo);
    if (itemInfo.isFreeItem) {
      if (Object.keys(memberCRMInfo ?? {}).length === 0) {
        Toast.info(t('redeem-login-first'), 2000);
        EventBus.emit('open_login_modal');
        return;
      }
      if ((memberCRMInfo.pointBalance ?? 0) < itemInfo.itemPoints) {
        Toast.info(t('noEnoughPoints'), 2000);
        return;
      }
      const freeItemInOrder = itemList.find((item) => item.isFreeItem);
      if (freeItemInOrder || selectedFreeItem?.length > 0) {
        Toast.info(t('onlyOneFree'), 2000);
        return;
      }
      /* crm 促销互斥 */
      const promotionReward = isHasPromotionFn({
        promotion,
        itemList,
      });
      if (promotionReward) {
        changeCrmPromotionContraryInfo({
          visible: true,
          type: 'promotion',
          content: promotionReward,
        });
        return;
      }
      // crm集成 积分兑换菜校验
      if (itemInfo.hasOwnProperty('couponTemplate')) {
        const res = await checkIsCampaignValid({
          coupons: [cloneDeep(itemInfo)],
          metaData,
        });
        const rule = res?.[0];
        handleCheckFreeItem({ rule });
        if (!rule.crmIntegrationRule.isValid) return;
        tempRule = rule;
      }
    }

    // 当前参与了促销活动  itemValidPromotion?.[itemInfo?.id]
    const hasSelectedPromotion = promotion?.itemValidPromotion?.find(
      (promotion) => promotion?.isSelected
    );
    if (
      hasSelectedPromotion &&
      hasSelectedPromotion?.promotion?.type === 'orderItemFixedPrice'
    ) {
      // 特价优惠id-List
      const specialItemIdList =
        hasSelectedPromotion?.promotion?.activityRule?.map(
          (item) => item?.specialPriceItemId
        );
      // 当前选中的菜 参与特价优惠活动
      if (specialItemIdList?.includes(itemInfo?.id)) {
        // 当前活动的上限
        const quantityLimit =
          hasSelectedPromotion?.promotion?.activityRule[0]?.quantityLimit;
        // 购物车中已存在的，并且与当前选中菜参与的是同一个促销【特价优惠活动】的菜
        const promotionRewardItems = itemList.filter((item) =>
          specialItemIdList?.includes(item?.id)
        );
        const count = promotionRewardItems?.reduce(
          (acc, item) => acc + item.quantity,
          0
        );
        if (count === quantityLimit) {
          Toast.info(t('quantity_limit_condition', { value: quantityLimit }));
        }
      }
    }

    if (itemInfo.itemType === 'SALE_ITEM') {
      if (tempRule) {
        const { couponTemplate, crmIntegrationRule } = tempRule;
        itemInfo.couponTemplate = couponTemplate;
        itemInfo.crmIntegrationRule = crmIntegrationRule;
      }

      const { isFreeItem, id, oId } = itemInfo;
      // 判断当前单菜，是否有详情等字段 或者 查找配置项id为61的开关状态为开，且该菜包含在选择的数组里
      const showSimpleDishDetail =
        selfConfig.configMap.id_61?.status &&
        selfConfig.configMap.id_61?.dishIds?.includes(isFreeItem ? oId : id);

      if (judgeHasDetailInfo(itemInfo) || showSimpleDishDetail) {
        this.setState({
          orderPanelShow: true,
        });
      } else {
        let { maxNum } = this.state;
        let n = this.getCurrentItemQty({
          itemId: isFreeItem ? oId : id,
          isFreeItem,
        });
        if (
          !isStockSufficient({
            itemInfo,
            addQty: 1,
            itemList: this.props.currentOrder.itemList,
            menuItemList: this.props.menuItemList,
            currentOrderCombo: this.props.currentOrderCombo,
            crm: this.props.crm,
          })
        ) {
          showInsufficientStockToast();
          return;
        }
        // 最大提示
        if (n >= maxNum) {
          setTimeout(() => {
            Toast.info(t('max-up', { rplc: defaultMax }), 1000);
          }, 0);
        } else {
          // 已选择菜品Item的右上角个数
          let cloneItem = cloneDeep(itemInfo);
          cloneItem.quantity = 1;
          if (cloneItem.itemPrices?.length === 1) {
            cloneItem.sectionDetail = [
              {
                id: -1,
                sizeInfo: Object.assign({}, cloneItem.itemPrices[0]),
              },
            ];
            cloneItem.price = 0;
          } else {
            cloneItem.sectionDetail = [];
          }
          this.props.addCombo2Order(cloneItem);
          if (itemInfo.isFreeItem) {
            setTempCampaign([cloneItem]);
          }
        }
      }
    } else if (itemInfo?.comboType === 'FIXED_SELECTION') {
      this.setState({
        orderPanelShow: true,
      });
    } else {
      // 自选套餐：避免 getCurrentCategory 触发菜单滚动/路由连锁更新
      const comboItemData = attachCategoryOptionsToItem(
        itemInfo,
        this.props.currentCategoryList
      );
      this.props.setActivityCurrentItem(comboItemData);
      this.setState({
        selectedItem: comboItemData,
        comboPanelVisible: true,
      });
    }
  };

  handleReduceItem = (itemInfo) => {
    const { removeFreeItemInOrder, changeFreeItem, setTempCampaign } =
      this.props;
    if (itemInfo.isFreeItem) {
      removeFreeItemInOrder({
        freeItemId: itemInfo.id,
      });
      changeFreeItem([]);
      setTempCampaign(null);
      return;
    }
    if (this.judegCartHasSameDish(itemInfo)) {
      // 直接删除
      this.props.removeItemFromOrder(itemInfo.id);
      // Toast.info(t('delete-tip'), 1000);
    } else {
      this.handleOpenDeleteModal(itemInfo);
    }
  };

  handleExpandToggle = () => {
    const { freeListIsExpanded, setExpandFreeList } = this.props;
    setExpandFreeList(!freeListIsExpanded);
    // 使用 setTimeout 确保状态更新后再重置虚拟列表
    setTimeout(() => {
      this.props.listRef?.current?.resetAfterIndex(0);
      this.props.listRef?.current?.scrollTo(0);
    }, 0);
  };

  render() {
    const {
      t,
      i18n: { language },
      listRef,
      headerHeight,
      selfConfig,
      isTopMenu,
      freeListIsExpanded,
      crm: { freeItemMenuPosition },
    } = this.props;
    const { currentCategory, promotion, ...rest } = this.props;
    const {
      selectedItem,
      isShowDeleteModal,
      cateDescShow,
      description,
      orderPanelShow,
      allCategoryItem,
      comboPanelVisible,
    } = this.state;

    const isOpenLazyLoad = selfConfig?.configList?.find(
      (each) => each.id === 32
    )?.value;

    // 虚拟列表可显示高度
    let virtualDishListHeight = window.innerHeight - remToPx(headerHeight);

    if (isTopMenu) {
      virtualDishListHeight = virtualDishListHeight - remToPx(TOP_MENU);
    }

    return (
      <React.Fragment>
        {isOpenLazyLoad ? (
          // <></>
          <DishList
            {...rest}
            getCurrentItemQty={this.getCurrentItemQty}
            getCurrentItemLanguage={getCurrentItemLanguage}
            language={language}
            selfConfig={selfConfig}
            handleShowDesc={this.handleShowDesc}
            allCategoryItem={allCategoryItem}
            handleClickItem={this.clickItemCardHandler}
            handleReduceItem={this.handleReduceItem}
            onScroll={this.handleScrollList}
            listRef={listRef}
            virtualDishListHeight={virtualDishListHeight}
            freeListIsExpanded={freeListIsExpanded}
            freeItemMenuPosition={freeItemMenuPosition}
            handleExpandToggle={this.handleExpandToggle}
            onListReady={this.handleDishListReady}
          />
        ) : (
          <OldDIshList
            {...this.props}
            itemListDom={this.itemListDom}
            selfConfig={selfConfig}
            currentCategory={currentCategory}
            getCurrentItemQty={this.getCurrentItemQty}
            handleShowDesc={this.handleShowDesc}
            allCategoryItem={allCategoryItem}
            handleClickItem={this.clickItemCardHandler}
            handleReduceItem={this.handleReduceItem}
            colNum={handleCountRowNum({ isTopMenu, selfConfig })}
            onListReady={this.handleOldDishListReady}
          />
        )}

        {/* 小弹窗菜品 */}
        {orderPanelShow && (
          <OrderDetailModal
            orderPanelShow={orderPanelShow}
            itemInfo={selectedItem}
            onRef={this.openOrderDetailModal}
            onCloseModal={() =>
              this.setState({
                orderPanelShow: false,
              })
            }
            {...(selectedItem.isFreeItem
              ? {
                  isInFreeItem: true,
                  max: 1,
                }
              : {})}
          />
        )}

        {/* combo大弹窗菜品 */}
        <Dialog
          visible={comboPanelVisible}
          html={
            <ComboPanel
              itemInfo={selectedItem?.id ? selectedItem : undefined}
              onCloseModal={() => {
                this.setState({
                  comboPanelVisible: false,
                });
              }}
              {...(selectedItem.isFreeItem
                ? {
                    isInFreeItem: true,
                    max: 1,
                    itemPoints: selectedItem.itemPoints,
                  }
                : {})}
            />
          }
        />

        <DescViewModal
          visible={cateDescShow}
          description={description}
          onClose={() => {
            this.setState({
              cateDescShow: false,
            });
          }}
        />

        {/* 选择删除菜品多属性弹框 */}
        {isShowDeleteModal && (
          <ChooseDeleteOrder
            itemInfo={selectedItem}
            handleOpenDeleteModal={this.handleOpenDeleteModal}
            handleCloseDeleteModal={this.handleCloseDeleteModal}
          />
        )}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    // currentSaleItems: state.currentSaleItems,
    currentOrder: state.currentOrder,
    orderPageDomTop: state.orderEdit.orderPageDomTop,
    menuGroup: state.menuGroup,
    freeListIsExpanded: state.freeListIsExpanded,
    categoryList: state.currentCategoryList,
    searchItem: state.searchItem,
    searchKeyWord: state.searchKeyWord,
    brandSetting: state.brandSetting,
    selfConfig: state.selfConfig,
    sideNavList: state.sideNav.sideNavList,
    currentOrderCombo: state.currentOrderCombo,
    currentCategoryList: state.currentCategoryList,
    discount: state.discount,
    currentCategory: state.currentCategory,
    promotion: state.promotion,
    allMenu: state.cateDish.allMenu,
    crm: state.crm,
    avocado: state.avocado,
    menuItemList: state.menuItemList,
    currentOrderCombo: state.currentOrderCombo,
    merchantProfile: state.merchantProfile,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getCurrentItem,
    removeItemFromOrder,
    getCurrentCategory,
    addCombo2Order,
    setorderPageDomTop,
    setVListScroll,
    changeFreeItem,
    removeFreeItemInOrder,
    setTempCampaign,
    setExpandFreeList,
    setItemValidPromotion,
    changeCrmPromotionContraryInfo,
    changePromotionStatusAfterCheck,
    setActivityCurrentItem,
  })(withTranslation()(CurrentItemList))
);
