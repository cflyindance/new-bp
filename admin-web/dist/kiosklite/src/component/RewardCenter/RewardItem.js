import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import styles from '@/component/RewardCenter/RewardItem.module.scss';
import REWARD_FRAME_LONG from '@/assets/images/reward_frame_long.png';
import REWARD_FRAME_LONG_SELECTED from '@/assets/images/reward_frame_long_selected.png';
import REWARD_FRAME_SHORT from '@/assets/images/reward_frame_short.png';
import REWARD_FRAME_SHORT_SELECTED from '@/assets/images/reward_frame_short_selected.png';
import REWARD_ADD from '@/assets/images/reward_add.png';
import REWARD_ADD_DISABLE from '@/assets/images/reward_add_disbale.png';
import LOCK from '@/assets/images/lock.png';
import TRASH_CAN from '@/assets/images/trashCan.png';
import POINTS from '@/assets/images/points.png';
import ImgCard from '@/component/imgCard';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { getDishItemLanguage, judgeHasDetailInfo } from '@/utils/busTools';
import { setTempCampaign } from '@/actions/crm_action';
import {
  getCurrentCategory,
  getCurrentItem,
  removeRewardItemFromList,
  addCampaignItemsToOrder,
  setActivityCurrentItem,
} from '@/actions';
import { changeCrmPromotionContraryInfo } from '@/actions/promotion';
import { changeRewardModalVisible } from '@/actions/avocado';
import {
  isStockSufficient,
  getRemainingStockNum,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import Toast from '@/component/toast';
import OrderDetailModal from '@/container/orderPage/orderDetailModal';
import Dialog from '@/component/dialog';
import ComboPanel from '@/container/comboPanel';
import DescViewModal from '@/component/DescViewModal';
import { getItemPrice } from '@/utils/priceCalculator';
import { roundToPrecision } from '@/utils/resolveAvocadoSku';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';
import useDeviceOrientation from '@/hooks/useDeviceOrientation';
import {
  checkIsCampaignValid,
  handleCheckDiscount,
  getInvalidReason,
  handleCheckFreeItem,
} from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import { mapCRMDiscountItems } from '@/utils/CRMIntegration/resolveCRMRewardItem';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import { EventBus } from '@/utils/EventBus';
import { cloneDeep } from 'lodash';
import DishTag from '@/component/DishTag';
import ItemDrawerWrapper from './ItemDrawerWrapper';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { isHasPromotionFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import useCrmPromotionContrary from '@/hooks/useCrmPromotionContrary';

const MemoDishTag = memo(DishTag);

const RewardItem = (props) => {
  const orientation = useDeviceOrientation();
  const {
    // redux
    data: sourceData,
    selfConfig,
    i18n: { language },
    t,
    crm,
    getCurrentItem,
    getCurrentCategory,
    disabled,
    currentOrder,
    currentOrder: { itemList },
    currentOrderCombo,
    menuItemList,
    avocado: { metaData, outletInfo },
    setTempCampaign,
    // props
    isLong,
    onSelectItem,
    onRemoveItem,
    isNeedAutoUpdate,
    isMuted = false,
    renderCondition,
    removeRewardItemFromList,
    addCampaignItemsToOrder,
    styles: customStyles,
    isInCrmPromotionMutual,
    promotion,
    changeCrmPromotionContraryInfo,
    setActivityCurrentItem,
    history,
    changeRewardModalVisible,
  } = props;
  const { memberCRMInfo, tempCampaign } = crm;
  const [data, setData] = useState(sourceData);

  const { handleCheckIsHasPromotion } = useCrmPromotionContrary();

  useEffect(() => {
    const updateData = async (coupons) => {
      const res = await checkIsCampaignValid({ coupons, metaData });
      const rule = res?.[0];
      setData(rule);
    };
    if (isNeedAutoUpdate && metaData && data) {
      updateData([cloneDeep(sourceData)]);
    }
  }, [isNeedAutoUpdate, itemList, metaData, sourceData]);

  const [openItemList, setOpenItemList] = useState(false);
  const [orderPanelShow, setOrderPanelShow] = useState(false);
  const [comboPanelVisible, setComboPanelVisible] = useState(false);
  const [tempItemInfo, setTempItemInfo] = useState(null);
  const [descModalVisible, setDescModalVisible] = useState(false);
  const orderDetailModal = useRef(null);

  const memberPoints = useMemo(() => {
    return memberCRMInfo?.pointBalance || 0;
  }, [memberCRMInfo]);

  const isCRMIntegration = useMemo(() => {
    return outletInfo?.enabled === 1;
  }, [outletInfo?.enabled]);

  const openOrderDetailModal = (ref) => {
    orderDetailModal.current = ref;
  };

  const rewardType = useMemo(() => {
    return data?.rewardRule?.rewardType;
  }, [data]);

  const isReward = useMemo(() => {
    // crm集成需要区分积分活动, 券活动
    if (isCRMIntegration) {
      return rewardType === 'loyalty';
    }
    // 自研只有reward
    return true;
  }, [rewardType, isCRMIntegration]);

  const rewardStrategy = useMemo(() => {
    return data?.rewardRule?.redeemRule?.strategy;
  }, [data]);

  const isFreeItem = useMemo(() => {
    return rewardStrategy === 'byFreeItem';
  }, [rewardStrategy]);

  const isDiscount = useMemo(() => {
    return ['byPercentageOff', 'byFixedAmount'].includes(rewardStrategy);
  }, [rewardStrategy]);

  const isSpecialItem = useMemo(() => {
    return rewardStrategy === 'setPrice';
  }, [rewardStrategy]);

  const isBundleDiscount = useMemo(() => {
    return rewardStrategy === 'orderItemFixedPriceCoupon';
  }, [rewardStrategy]);

  // 促销中心活动商品级别活动
  const isPromotionItemActivity = useMemo(() => {
    return [
      'amountGiftItem',
      'orderItemGiftItem',
      'orderItemFixedPrice',
    ].includes(rewardStrategy);
  }, [rewardStrategy]);

  // 促销中心活动订单级别活动
  const isPromotionOrderActivity = useMemo(() => {
    return [
      'orderItemChangeItem',
      'quantityItemDiscount',
      'totalAmountQuantityDiscount',
    ].includes(rewardStrategy);
  }, [rewardStrategy]);

  const discount = useMemo(() => {
    if (!isDiscount) return null;
    const {
      strategy,
      parameters: { discount },
    } = data?.rewardRule?.redeemRule;
    return strategy === 'byFixedAmount' ? `$${discount}` : `${discount}%`;
  }, [isDiscount, data]);

  const itemName = useMemo(() => {
    const isShowDishName =
      isFreeItem ||
      isSpecialItem ||
      isBundleDiscount ||
      isPromotionItemActivity ||
      rewardStrategy === 'quantityItemDiscount';
    const dishName =
      getDishItemLanguage(data.fieldDisplayNameGroups, language) ||
      getDishItemLanguage(data.fieldDisplayNameGroups, 'en');
    return isShowDishName ? dishName || data.name : data.name;
  }, [isFreeItem, isPromotionItemActivity, data, language, rewardStrategy]);

  const displayPrice = useMemo(() => {
    if (!isFreeItem) return null;
    const isHasMorePrice =
      data.itemPrices?.length > 0 || data?.options?.length > 0;
    let showPrice = `$${(data.originalPrice || data.price || data.itemPrices?.[0]?.price || 0)?.toFixed(2)}`;
    return isHasMorePrice ? `${showPrice}+` : showPrice;
  }, [isFreeItem, data]);

  const points = useMemo(() => {
    return isReward ? data?.rewardRule?.redeemRule?.parameters?.points : null;
  }, [isReward, data]);

  // 菜品折扣价用于特价商品, 赠菜为0.00
  const itemDiscountPrice = useMemo(() => {
    return (
      data?.rewardRule?.redeemRule?.parameters?.itemDiscountPrice || '0.00'
    );
  }, [data]);
  const isSelected = useMemo(() => {
    return tempCampaign?.length > 0;
  }, [tempCampaign]);

  const isCurrentItemSelected = useMemo(() => {
    if (!isSelected) return false;
    if (isFreeItem) {
      const selectedCampaign = tempCampaign?.[0];
      const campaignId = selectedCampaign.oId || selectedCampaign.id;
      return (
        campaignId === data.id &&
        selectedCampaign?.crmIntegrationRule?.coupon?.ruleId ===
          data.crmIntegrationRule?.coupon?.ruleId
      );
    }
    return tempCampaign?.[0]?._id === data._id;
  }, [isSelected, isFreeItem]);

  const handleCheckCampaign = () => {
    if (isMuted) return;
    if (!Object.keys(memberCRMInfo).length) {
      Toast.info(t('redeem-login-first'), 2000);
      EventBus.emit('open_login_modal');
      return false;
    }
    if (handleCheckIsHasPromotion()) return false;
    if (isReward && memberPoints < data.itemPoints) {
      Toast.info(t('noEnoughPoints'), 2000);
      return false;
    }
    if (isSelected) {
      Toast.info(t('onlyOneFree'), 2000);
      return false;
    }
    if (isDiscount && !itemList?.length) {
      Toast.info(t('selectItemFirst'), 2000);
      return false;
    }
    return true;
  };

  const countADRedeemPrice = (voucherRules, price) => {
    const { option, value, amountCapped } = voucherRules;

    if (option === 'dollarOff') {
      const afterDiscountPrice = roundToPrecision(price - value);
      return afterDiscountPrice < 0 ? 0 : afterDiscountPrice;
    }

    if (option === 'percentageOff') {
      const discount = roundToPrecision((value / 100) * price);
      const cappedDiscount = discount > amountCapped ? amountCapped : discount;
      return roundToPrecision(price - cappedDiscount);
    }

    return 0;
  };

  const handleClickItem = async () => {
    // 基础校验
    const isValidate = handleCheckCampaign();
    if (isValidate) {
      // 赠品券SDK校验 可以不需要sdk的discount信息，对于各种菜，菜价都是0，只检查能否用券
      if (isCRMIntegration) {
        const res = await checkIsCampaignValid({ coupons: [data], metaData });
        const rule = res?.[0];
        handleCheckFreeItem({ rule });
        if (!rule.crmIntegrationRule.isValid) return;
      }
      const itemData = {
        ...data,
        remark: {
          optionName: '',
          optionType: 'NOTE',
          quantity: 1,
          price: 0,
        },
      };

      if (data.itemType === 'SALE_ITEM') {
        // 判断当前菜，是否有详情等字段
        if (judgeHasDetailInfo(data)) {
          setTempItemInfo(itemData);
          setOrderPanelShow(true);
          return;
        }
        const clonedData = cloneDeep(itemData);
        if (clonedData.itemPrices?.length === 1) {
          clonedData.sectionDetail = [
            {
              id: -1,
              sizeInfo: Object.assign({}, clonedData.itemPrices[0]),
            },
          ];
          clonedData.price = 0;
        } else {
          clonedData.sectionDetail = [];
        }
        await handleSetFreeItem(clonedData, true);
        return;
      }
      // 固定套餐
      if (data.comboType === 'FIXED_SELECTION') {
        setTempItemInfo(itemData);
        setOrderPanelShow(true);
        return;
      }
      // 自选套餐
      setTempItemInfo(itemData);
      // getCurrentCategory(data.categoryId);
      // getCurrentItem(data.id);
      setActivityCurrentItem(itemData);
      setComboPanelVisible(true);
    }
  };

  const handleSetFreeItem = async (itemInfo, isNormalDish = false) => {
    const {
      itemPoints,
      rewardRule,
      crmIntegrationRule,
      freeItemOriginPrice,
      originalPrice,
      couponTemplate,
    } = data;

    let baseItemInfo = {
      remark: {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      },
      ...itemInfo,
      quantity: 1,
      isFreeItem: true,
    };

    const item = isNormalDish
      ? baseItemInfo
      : {
          ...baseItemInfo,
          itemPoints,
          rewardRule,
          couponTemplate,
          crmIntegrationRule,
          freeItemOriginPrice,
          originalPrice,
          isFreeItem: true,
        };

    // ad 折扣商品
    const { voucherRules } = item.rewardRule;
    if (voucherRules) {
      // 计算菜品原价
      const itemPrice = getItemPrice({
        ...item,
        price: item.itemPrices?.length ? 0 : item.originalPrice, // 有详情价为0 否则按照原价取
      });
      // 计算折扣后价格，放到主菜上，子菜会在下单时价格置为0
      item.price = countADRedeemPrice(voucherRules, itemPrice);
      item.originalPrice = itemPrice;
    }
    if (
      !isStockSufficient({
        itemInfo: item,
        addQty: item.quantity || 1,
        itemList,
        menuItemList,
        currentOrderCombo,
        crm,
        excludeRewardPending: true,
      })
    ) {
      showInsufficientStockToast();
      return;
    }
    setTempCampaign([item]);
    onSelectItem?.({ rule: item });
  };

  const discountItem = useMemo(() => {
    if (isDiscount && itemList?.length > 0) {
      return itemList.map((each) => ({
        ...each,
        uniqueItemTempId: uuidv4(),
      }));
    }
  }, [isDiscount, itemList]);

  const handleChangeDiscount = async () => {
    const isValidate = handleCheckCampaign();
    if (isValidate) {
      const onCheckSuccess = (rule) => {
        setTempCampaign([rule]);
        onSelectItem?.({ rule });
        if (!isCRMIntegration) return;
        const validRes = rule.crmIntegrationRule.result?.[0].calculatedOrder;
        const { orderItems, discounts: orderDiscountInfo } = validRes;
        const newItemList = mapCRMDiscountItems({
          orderItems,
          orderDiscountInfo,
          items: discountItem,
        });
        addCampaignItemsToOrder(newItemList);
      };
      if (isCRMIntegration) {
        const res = await checkIsCampaignValid({
          coupons: [data],
          metaData,
          allItems: discountItem,
        });
        const rule = res?.[0];
        handleCheckDiscount({ rule, onCheckSuccess });
      } else {
        onCheckSuccess(data);
      }
    }
  };

  const handeRemoveItem = () => {
    if (isMuted) return;
    onRemoveItem?.({ rule: tempCampaign });
    setTempCampaign(null);
    if (isBundleDiscount || isSpecialItem) {
      removeRewardItemFromList();
    }
  };

  const isLongItem = useMemo(() => {
    return isLong ?? orientation === 'vertical';
  }, [isLong, orientation]);

  const frameSrc = useMemo(() => {
    if (isMuted) return isLongItem ? REWARD_FRAME_LONG : REWARD_FRAME_SHORT;
    if (isLongItem) {
      return isCurrentItemSelected
        ? REWARD_FRAME_LONG_SELECTED
        : REWARD_FRAME_LONG;
    }
    return isCurrentItemSelected
      ? REWARD_FRAME_SHORT_SELECTED
      : REWARD_FRAME_SHORT;
  }, [isCurrentItemSelected, isLongItem, isMuted]);

  const countWidth = useMemo(() => {
    return isLongItem ? '79.4rem' : '57rem';
  }, [isLongItem]);

  const isDisabled = useMemo(() => {
    if (disabled) return true;
    if (isDiscount && !itemList?.length) return true;
    // 新增 积分校验
    if (isReward) return memberPoints < data.itemPoints;
    // 特价商品和m件n折 只在点击时校验， promotion活动都可用，前置已经拦截过
    if (
      isSpecialItem ||
      isBundleDiscount ||
      data?.activityType ||
      data?.isSelected ||
      data?.isFreeItem
    )
      return false;
    if (tempCampaign?.[0] && !isCurrentItemSelected) return true;
    return !data.crmIntegrationRule?.isValid;
  }, [
    disabled,
    data,
    itemList,
    isDiscount,
    isCurrentItemSelected,
    tempCampaign,
    isSpecialItem,
    isBundleDiscount,
    isReward,
    memberPoints,
  ]);

  const isVoucherDiscount = useMemo(() => {
    return !isReward && isDiscount;
  }, [isDiscount, isReward]);

  // renderCondition
  const renderPriceOrPoints = useMemo(() => {
    if (renderCondition) return renderCondition;
    // 积分活动要展示积分
    if (isReward) {
      return (
        <>
          <img className={styles.pointsImg} src={POINTS} alt="points" />
          <span className={styles.pointsNum}>
            {points} {t('pts')}
          </span>
        </>
      );
    }
    if (isVoucherDiscount || isBundleDiscount || isSpecialItem) return null;
    return <span className={styles.pointsNum}>${itemDiscountPrice}</span>;
  }, [renderCondition, isVoucherDiscount, isReward, points, itemDiscountPrice]);

  const property = useMemo(() => {
    //判断是不是有自定义标签 处理自定义标签和属性标签
    const isPropertyVisible = selfConfig?.configList?.find(
      (i) => i.id === 54
    )?.value;
    const propertyArr = isPropertyVisible
      ? selfConfig?.configList?.find((i) => i.id === 38)?.value
      : [];
    let tags = [];
    propertyArr.map((tag) => {
      if (tag.dish.includes(data.id) || tag.dish.includes(data?.oId)) {
        tags.push({
          name: tag.labelName,
          displayName: tag.labelName,
          labelType: tag.labelType,
          labelImg: tag.labelImg,
          labelBgColor: tag.labelBgColor || '#fffbf2',
          labelTextColor: tag.labelTextColor || '#f26e21',
          isKioskTag: true,
        });
      }
    });
    if (Array.isArray(data.properties)) {
      tags = [...data.properties, ...tags];
    }
    return tags;
  }, [selfConfig.configList, data.id, data.oId]);

  const stoppedStatus = useMemo(() => {
    return getItemStoppedStatus(data);
  }, [data, selfConfig?.soldOut, menuItemList]);
  const isSoldout = Boolean(stoppedStatus);

  const renderAvator = () => {
    if (
      isFreeItem ||
      isPromotionItemActivity ||
      rewardStrategy === 'quantityItemDiscount'
    )
      return <ImgCard selfConfig={selfConfig} itemInfo={data} />;
    if (isDiscount)
      return (
        <div className={styles.discountInfo}>
          <div className={styles.num}>{discount}</div>
          <div className={styles.off}>OFF</div>
        </div>
      );
    if (isSpecialItem) {
      return (
        <div className={styles.discountInfo}>
          <div className={styles.num}>Item</div>
          <div className={styles.off}>OFF</div>
        </div>
      );
    }
    if (isBundleDiscount) {
      const {
        redeemRule: {
          bundleDiscountRule: { discountValue },
        },
      } = data;
      const finallyDiscount =
        discountValue === 100 ? '100%' : `${100 - discountValue}%`;
      return (
        <div className={styles.discountInfo}>
          <div className={styles.num}>{finallyDiscount}</div>
          <div className={styles.off}>OFF</div>
        </div>
      );
    }
    if (isPromotionOrderActivity && rewardStrategy !== 'quantityItemDiscount') {
      const { hitRuleItem } = data;
      const discount =
        hitRuleItem?.discountType === 'minus'
          ? `$${hitRuleItem?.discountNumber}`
          : `${hitRuleItem?.discountNumber}%`;
      return (
        <div className={styles.discountInfo}>
          <div className={styles.num}>{discount}</div>
          <div className={styles.off}>OFF</div>
        </div>
      );
    }
  };

  const renderOperationArea = () => {
    if (isMuted) return null;
    if (isCurrentItemSelected)
      return (
        <img className={styles.trash_can} src={TRASH_CAN} alt="remove item" />
      );
    if (isDisabled) {
      return (
        <img
          className={styles.addReward}
          src={REWARD_ADD_DISABLE}
          alt="reward add disbale"
        />
      );
    }
    if (isSpecialItem || isBundleDiscount) {
      return (
        <div
          className={`${styles.selectReward} animate-btn`}
          onClick={handleOpenItemList}
        >
          {t('special_item_select')}
        </div>
      );
    }
    return (
      <img className={styles.addReward} src={REWARD_ADD} alt="reward add" />
    );
  };

  const handleOpenItemList = () => {
    const isValidate = handleCheckCampaign();
    if (!isValidate) return;
    setOpenItemList(true);
  };

  const handleSelectCampaign = () => {
    if (isCurrentItemSelected) return handeRemoveItem();
    if (isFreeItem) return handleClickItem();
    if (isDiscount) return handleChangeDiscount();
    if (isSpecialItem || isBundleDiscount) return handleOpenItemList();
  };

  // 过期时间
  const expires = useMemo(() => {
    if (isPromotionOrderActivity || isPromotionItemActivity) return null;
    const timeStr = data?.useEndTime
      ? t('voucher_period', {
          value: dayjs(data?.useEndTime).format('YYYY/MM/DD'),
        })
      : t('permanently_voucher');
    return timeStr;
  }, [isPromotionOrderActivity, isPromotionItemActivity, data.useEndTime, t]);

  // 券配置页面的【详情】
  const detailDescribe = useMemo(() => {
    let description = '';
    if (isCRMIntegration) {
      description = data?.couponTemplate?.description;
    } else {
      description = data?.description;
    }
    return description;
  }, [isCRMIntegration, data.description, data?.couponTemplate?.description]);

  // 库存数量（显示剩余可售数量）
  const stockNum = getRemainingStockNum({
    itemInfo: data,
    itemList,
    menuItemList,
  });

  const checkDetail = () => {
    setDescModalVisible(true);
  };

  if (!data) {
    return null;
  }
  return (
    <>
      <div
        style={{ width: countWidth, ...customStyles }}
        className={styles.rewardItem}
        onClick={() => {
          if (isSoldout) return;
          handleSelectCampaign();
        }}
      >
        {isSoldout && (
          <div className={styles.soldout}>
            {stoppedStatus === 'unavailable'
              ? t('item-unavailable')
              : t('sold-out')}
          </div>
        )}
        <img
          className={styles.rewardItem_img}
          src={frameSrc}
          alt="reward frame"
        />
        <div className={styles.rewardInfo}>
          <div className={styles.rewardImage}>
            {renderAvator()}
            {stockNum !== undefined && (
              <div className={styles.stockNum}>
                {t('item-stock-num', { stockNum })}
              </div>
            )}
            {isDisabled && (
              <div className={styles.disabledCover}>
                <img
                  className={styles.coverImg}
                  src={LOCK}
                  alt="read item disabled"
                />
              </div>
            )}
          </div>
          <div className={styles.rewardText}>
            <div>
              <div
                className={styles.rewardTitle}
                style={isInCrmPromotionMutual ? { paddingRight: '8rem' } : {}}
              >
                {itemName}
              </div>
              {(property?.length > 0 || expires) && (
                <div className={styles.dishTagWrapper}>
                  {expires && <div className={styles.expires}>{expires}</div>}
                  <div className={styles.dishTagInner}>
                    <MemoDishTag
                      tagsInfo={property}
                      isItemCard={false}
                      imgTagStyle={{ height: '3rem' }}
                      textTagStyle={{ fontSize: '1.6rem', padding: '0.4rem' }}
                      style={{
                        maxHeight: '4rem',
                      }}
                    />
                  </div>
                </div>
              )}
              {detailDescribe && !isMuted && (
                <div className={styles.detailRow}>
                  {detailDescribe && (
                    <div className={styles.detailRowText}>
                      <span className={styles.detail}>{detailDescribe}</span>
                      <a
                        className={styles.detailRowBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          checkDetail();
                        }}
                      >
                        {t('operate-detail')}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* {isDisabled && isCRMIntegration && !isMuted && (
              <div className={styles.invalidRow}>
                {getInvalidReason(data)?.join(', ')}
              </div>
            )} */}
            <div className={styles.addRow}>
              <div className={styles.points}>
                {renderPriceOrPoints}
                {isFreeItem && (
                  <span className={styles.originPrice}>{displayPrice}</span>
                )}
              </div>
              {renderOperationArea()}
            </div>
          </div>
        </div>
      </div>

      {/* 详情菜 */}
      {orderPanelShow && tempItemInfo && (
        <OrderDetailModal
          isMountOnBody
          onAddFreeItem={handleSetFreeItem}
          isInFreeItem
          max={1}
          orderPanelShow={orderPanelShow}
          itemInfo={tempItemInfo}
          onRef={openOrderDetailModal}
          onCloseModal={() => {
            setOrderPanelShow(false);
            setTempItemInfo(null);
          }}
        />
      )}

      {/* combo菜 */}
      <Dialog
        isMountOnBody
        visible={comboPanelVisible}
        html={
          <ComboPanel
            onAddFreeItem={handleSetFreeItem}
            isInFreeItem
            max={1}
            itemInfo={tempItemInfo}
            itemPoints={data.itemPoints}
            itemVoucherPrice={data.price}
            onCloseModal={() => setComboPanelVisible(false)}
          />
        }
      />

      {/* 特价商品抽屉 */}
      {openItemList && (
        <ItemDrawerWrapper
          open={openItemList}
          data={data}
          onClose={() => setOpenItemList(false)}
        />
      )}

      {/* 描述弹窗 */}
      <DescViewModal
        visible={descModalVisible}
        description={detailDescribe}
        onClose={() => {
          setDescModalVisible(false);
        }}
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    avocado: state.avocado,
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    promotion: state.promotion,
    menuItemList: state.menuItemList,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getCurrentItem,
    getCurrentCategory,
    setTempCampaign,
    removeRewardItemFromList,
    addCampaignItemsToOrder,
    changeCrmPromotionContraryInfo,
    setActivityCurrentItem,
    changeRewardModalVisible,
  })(withTranslation()(RewardItem))
);
