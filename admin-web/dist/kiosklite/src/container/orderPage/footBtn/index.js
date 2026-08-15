import React from 'react';
import styles from './footBtn.module.scss';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import cartBagIMG from '@/assets/images/cart-bag.png';
import { resetCurrentOrder, spliceOrderBySoldout } from '@/actions';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import BackHomeModal from '@/component/backHomeModal';
import RIGHT_SIGN from '@/assets/images/right_sign.png';
import { getItemPrice } from '@/utils/priceCalculator';
import { setItemValidPromotion } from '@/actions/promotion';
import { checkIsRuleValid } from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import ItemPromotionModal from '@/component/CloudPromotionCenter/ItemPromotionModal';
import { handleCheckOrderPromotion } from '@/utils/PromotionCenterIntegration';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import { judegOrderDishIsHasSoldout } from '@/utils/busTools';
import { cloneDeep } from 'lodash';
import SoldoutModal from '@/component/soldoutModal';

import Big from 'big.js';

class FootBtnBox extends React.Component {
  state = {
    showModal: false,
    shouldAnimate: false, // 动画控制
    itemCount: 0, //菜的个数
    itemPromotionVisible: false, // 菜品促销选择弹窗
    isHasSoldoutDish: false,
    dishMap: {},
  };

  // 更新商品数量
  static getDerivedStateFromProps(nextProps, prevState) {
    let itemCount = nextProps.currentOrder.itemList.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const freeItemCount = nextProps.crm?.selectedFreeItem?.length || 0;
    itemCount += freeItemCount;
    if (itemCount !== prevState.itemCount) {
      return { itemCount };
    }
    return null;
  }

  handleContinue = () => {
    const { resetCurrentOrder, history } = this.props;
    this.setState({
      showModal: false,
    });
    resetCurrentOrder();
    history.goBack();
  };

  handleCancel = () => {
    this.setState({
      showModal: false,
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.itemCount < this.state.itemCount) {
      // 当商品数量变化触发动画
      this.setState({ shouldAnimate: true }, () => {
        this.animationTimer = setTimeout(() => {
          this.setState({ shouldAnimate: false });
        }, 500);
      });
    }

    if (
      prevProps.currentOrder !== this.props.currentOrder ||
      prevProps.selfConfig?.soldOut !== this.props.selfConfig?.soldOut ||
      prevProps.menuItemList !== this.props.menuItemList
    ) {
      this.checkSoldout();
    }
  }

  componentWillUnmount() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }

  componentDidMount() {
    this.checkSoldout();
  }

  handleCheckPromotionCenter = async () => {
    const {
      promotion: {
        itemValidPromotion,
        promotionCenterList,
        promotionCenterMetas,
        promotionCode,
      },
      history: { push },
      setItemValidPromotion,
      merchantProfile,
    } = this.props;
    const onCheckSuccess = (validateRes) => {
      // 点单商品无可用促销
      if (!validateRes?.length) {
        setItemValidPromotion(null);
        return push('/orderReview');
      }
      // 只有促销码的活动处理逻辑：
      // - 没输入促销码 → 跳过
      // - 输入促销码但没命中 → 跳过
      // - 输入促销码且命中 → 不跳过
      // - 有其他活动 → 不跳过
      const onlyCodePromotion = validateRes?.every(
        (item) => item?.promotion?.promotionCodes?.length
      );

      // 如果只有促销码活动，检查促销码是否有效
      if (onlyCodePromotion) {
        const hasValidPromoCode =
          promotionCode &&
          validateRes?.some((item) =>
            item?.promotion?.promotionCodes?.includes(promotionCode)
          );
        // 没有有效促销码则跳过
        if (!hasValidPromoCode) {
          return push('/orderReview');
        }
      }
      const afterCheckValidatePromotion = validateRes?.map((r) => {
        const isPromotionAlreadySelect = itemValidPromotion?.find(
          (e) => e.isSelected && e.promotion.id === r.promotion.id
        );
        if (isPromotionAlreadySelect) {
          const isStillValid = checkIsRuleValid(r.validateInfo);
          return { ...r, isSelected: isStillValid };
        }
        return r;
      });
      setItemValidPromotion(afterCheckValidatePromotion);

      // 点单商品只有一个促销且依旧选中
      if (
        afterCheckValidatePromotion?.length === 1 &&
        afterCheckValidatePromotion?.[0]?.isSelected &&
        !GIFT_PROMOTION_TYPE.includes(
          afterCheckValidatePromotion?.[0]?.promotion?.type
        )
      )
        return push('/orderReview');

      this.setState({
        itemPromotionVisible: true,
      });
    };

    const onCheckFailed = () => {
      setItemValidPromotion(null);
      return push('/orderReview');
    };

    // 检查当前订单可用的促销活动, 并检查活动是否可用, 不可用给出原因
    await handleCheckOrderPromotion({
      promotionCenterList,
      promotionCenterMetas,
      onCheckSuccess,
      onCheckFailed,
      merchantId: merchantProfile?.merchantId,
    });
  };

  handleClosePromotionModal = () => {
    this.setState({
      itemPromotionVisible: false,
    });
  };

  handleSkipPromotion = () => {
    this.handleClosePromotionModal();
    this.props.history.push('/orderReview');
  };

  handleSelectPromotion = (rule) => {
    const {
      promotion: { itemValidPromotion },
      setItemValidPromotion,
    } = this.props;
    const updatedItemPromotion = itemValidPromotion?.map((each) => {
      return {
        ...each,
        isSelected: each.promotion.id === rule.promotion.id ? true : undefined,
      };
    });
    setItemValidPromotion(updatedItemPromotion);
    this.handleSkipPromotion();
  };

  // view order 去购物车
  handleViewOrder = async () => {
    const {
      history: { push },
      promotion: { promotionCenterList },
    } = this.props;
    const { itemCount } = this.state;
    // 有商品
    if (itemCount > 0) {
      // 如果只有促销码活动，菜单不展示活动，但实际是有活动的，会被跳过校验
      // 所以不能用menuGroup获取有效促销，还是用原始数据promotionCenterList

      const hasPromotion = promotionCenterList?.length > 0;
      if (!hasPromotion) return push('/orderReview');
      // 促销中台 - 检查是否有可用的促销
      await this.handleCheckPromotionCenter();
    }
  };

  checkSoldout = () => {
    const { currentOrder } = this.props; // 按实际来源取值
    const dishMap = judegOrderDishIsHasSoldout(cloneDeep(currentOrder?.itemList || []));
    if (dishMap?.slodoutList?.length) {
      this.setState({ dishMap, isHasSoldoutDish: true });
    }
  };

  continueReorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    this.setState({
      isHasSoldoutDish: false,
    });
  }

  render() {
    const {
      t,
      store,
      currentOrder,
      crm: { selectedDiscount, selectedFreeItem },
      promotion: { itemValidPromotion },
    } = this.props;
    const { itemCount, shouldAnimate, itemPromotionVisible, isHasSoldoutDish, dishMap } = this.state;
    // 价格明细等
    const orderInfo = getOrderInfoObj(store);
    // const isSameWidth = judegEnv();
    // 展示促销/crm折扣的 折扣值
    let discount = orderInfo?.orderDiscount || 0;
    if (selectedDiscount?.actualDiscount) {
      discount += selectedDiscount?.actualDiscount;
    }
    let freeItemPrice = 0;
    if (selectedFreeItem) {
      const freeItemDiscount = selectedFreeItem.reduce((pre, cur) => {
        return (
          pre +
            getItemPrice({
              ...cur,
              price: cur.itemPrices?.length ? 0 : cur.freeItemOriginPrice, // 有详情价为0 否则按照原价取
            }) || cur.totalPrice
        );
      }, 0);
      discount += freeItemDiscount;
      freeItemPrice = freeItemDiscount;
    }

    const freeItemInOrder = currentOrder?.itemList?.find(
      (item) => item.isFreeItem
    );

    if (freeItemInOrder) {
      // crm集成使用freeItemOriginPrice字段， 自研crm使用totalPrice
      if (freeItemInOrder.hasOwnProperty('freeItemOriginPrice')) {
        const freeItemOrderTotalPrice = Big(
          getItemPrice({
            ...freeItemInOrder,
            price: freeItemInOrder.itemPrices?.length
              ? 0
              : freeItemInOrder.freeItemOriginPrice, // 有详情价为0 否则按照原价取
          })
        )
          .times(freeItemInOrder.quantity)
          .toNumber();
        discount += freeItemOrderTotalPrice;
        freeItemPrice = freeItemOrderTotalPrice;
      } else {
        discount += freeItemInOrder.totalPrice || 0;
        freeItemPrice = freeItemInOrder.totalPrice;
      }
    }
    // 特价商品 m件N折菜直接加入到购物车中
    const bundleDiscountItems = currentOrder?.itemList.filter(
      (each) =>
        each.isCRMIntegrationBundleDiscountItem ||
        each.isCRMIntegrationSpecialItem
    );
    if (bundleDiscountItems?.length > 0) {
      const bundleItemsDiscount = bundleDiscountItems.reduce((pre, cur) => {
        return Number(
          Big(pre)
            .plus(cur.actualDiscount || 0)
            .toFixed(2)
        );
      }, 0);
      discount += bundleItemsDiscount || 0;
    }

    // 促销中台
    const promotionRewardItems = currentOrder?.itemList.filter(
      (e) => e.promotionRewardItem
    );
    if (promotionRewardItems?.length > 0) {
      const promotionItemsDiscount = promotionRewardItems.reduce((pre, cur) => {
        return Number(
          Big(pre)
            .plus(cur.actualDiscount || 0)
            .toFixed(2)
        );
      }, 0);
      discount += promotionItemsDiscount || 0;
    }

    const hasDiscount = discount > 0;

    // 实际价格
    let subTotal = orderInfo?.orderSubtotal?.toFixed(2);
    if (hasDiscount) {
      subTotal = Big(subTotal).plus(freeItemPrice).minus(discount)?.toFixed(2);
      subTotal = Number(subTotal) < 0 ? `0.00` : subTotal;
    }

    // 促销中台 - 百分比满减 最多省xx
    const saveUpto = itemValidPromotion?.find(
      (e) =>
        e.isSelected &&
        e.discountAmount >= e.promotion?.activityRule[0]?.maxAmount &&
        e.promotion?.activityRule[0]?.maxAmount
    );

    return (
      <React.Fragment>
        <div className={styles.footBtnBox} onClick={this.handleViewOrder}>
          <div className={styles.cartIcon}>
            <img
              src={cartBagIMG}
              className={`${styles.cart} ${shouldAnimate ? styles.cartAnimation : ''}`}
            />
            <i
              className={`${styles.count} ${shouldAnimate ? styles.countAnimation : ''}`}
            >
              {itemCount}
            </i>
          </div>

          <div className={styles.rightBtns}>
            <div
              className={[
                styles.footContent,
                hasDiscount && styles.hasDiscount,
                itemCount > 0
                  ? `${styles.actived} linear-animate-btn`
                  : styles.noActived,
              ].join(' ')}
            >
              <div className={styles.text}>{t('viewOrder')}</div>
              <span className={styles.total}>{`$${subTotal}`}</span>
              {hasDiscount && (
                <div className={styles.discountInfo}>
                  <img
                    className={styles.right_img}
                    src={RIGHT_SIGN}
                    alt="right sign"
                  />
                  <div className={styles.savedInfo}>
                    <div className={styles.saved}>
                      {saveUpto ? t('save_up_to') : t('saved')}
                    </div>
                    <div className={styles.discountNum}>
                      ${discount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 促销可选弹窗 */}
        {itemPromotionVisible && (
          <ItemPromotionModal
            visible={itemPromotionVisible}
            onConfirm={this.handleSelectPromotion}
            onSkip={this.handleSkipPromotion}
            onClose={this.handleClosePromotionModal}
          />
        )}

        
        {/* 售罄弹框 */}
        {isHasSoldoutDish ? (
          <SoldoutModal
            isHasSoldoutDish={isHasSoldoutDish}
            dishMap={dishMap}
            inOrderPage={true}
            continueReorder={this.continueReorder}
          />
        ) : null}

        {/* 返回首页comfirm */}
        <BackHomeModal
          isGoBack
          isShowModal={this.state.showModal}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    currentOrder: state.currentOrder,
    crm: state.crm,
    avocado: state.avocado,
    promotion: state.promotion,
    merchantProfile: state.merchantProfile,
    selfConfig: state.selfConfig,
    menuItemList: state.menuItemList,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    resetCurrentOrder,
    setItemValidPromotion,
    spliceOrderBySoldout,
  })(withTranslation()(FootBtnBox))
);
