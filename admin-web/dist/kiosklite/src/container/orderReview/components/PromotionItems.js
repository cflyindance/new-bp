import React, { useEffect, useMemo, useState } from 'react';
import { useCloseModalOnHomePage } from '@/hooks';
import styles from './PromotionItems.module.scss';
import ImgCard from '@/component/imgCard';
import { getDishItemLanguage } from '@/utils/busTools';
import { judgeHasDetailInfo } from '@/utils/busTools';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import Toast from '@/component/toast';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import { Drawer } from 'antd';
import itemIsSoldOut from '@/utils/itemIsSoldOut';
import Big from 'big.js';
import { getItemPrice } from '@/utils/priceCalculator';
import {
  getExchangePurchaseDisplayPrices,
  isPromotionItemConfigurable,
  replacePromotionItemVariants,
} from '@/utils/localExchangePurchase';
import { nanoid } from 'nanoid';
import cloneDeep from 'lodash/cloneDeep';
import Dialog from '@/component/dialog';
import deleteStyles from '@/component/RewardCenter/ItemDeleteDrawer.module.scss';

export const getVariantDescription = (item, language) => {
  const details = [];
  (item.sectionDetail || []).forEach((section) => {
    if (section.sizeInfo) {
      details.push(section.sizeInfo.size || section.sizeInfo.name || '');
    }
    (section.options || []).forEach((option) => {
      details.push(
        getDishItemLanguage(option.fieldDisplayNameGroups, language) ||
          option.name
      );
    });
    (section.items || []).forEach((sectionItem) => {
      const itemDetails = [
        getDishItemLanguage(sectionItem.fieldDisplayNameGroups, language) ||
          sectionItem.name,
      ];
      (sectionItem.selectedOptionList || []).forEach((optionSection) => {
        if (optionSection.sizeInfo) {
          itemDetails.push(
            optionSection.sizeInfo.size || optionSection.sizeInfo.name || ''
          );
        }
        (optionSection.options || []).forEach((option) => {
          itemDetails.push(
            getDishItemLanguage(option.fieldDisplayNameGroups, language) ||
              option.name
          );
        });
      });
      details.push(itemDetails.filter(Boolean).join(': '));
    });
  });
  return details.filter(Boolean).join(', ');
};

export const getPromotionItemsByRule = (rule, categoryList = []) => {
  const { activityRule, id: ruleId, promotionInfo } = rule;
  const allItems = categoryList?.map((each) => each.saleItems)?.flat() || [];
  const giftsDishes = activityRule?.giftsDishes || [];

  return allItems
    .filter((item) => giftsDishes.includes(item?.id))
    .map((each) => {
      return {
        ...cloneDeep(each),
        ruleId,
        promotionInfo,
        promotionItem: true,
      };
    });
};

const PromotionItems = (props) => {
  const [selectedPromotion, setSelectedPromotion] = useState([]);
  const [deleteSelection, setDeleteSelection] = useState(null);
  const [activeRuleId, setActiveRuleId] = useState(null);
  const {
    onClose,
    satisfyRules,
    categoryList,
    selfConfig,
    alreadySelectedPromotion,
    onNext,
    cloudPromotion = [],
    handleEditItem,
    exchangePurchase = false,
    currentOrder,
    open = true,
  } = props;
  useCloseModalOnHomePage(onClose);
  const {
    t,
    i18n: { language },
  } = useTranslation();

  const isOrderGifts = useMemo(() => {
    return cloudPromotion.length > 0;
  }, [cloudPromotion]);

  const supportsMultipleSelection = exchangePurchase || !isOrderGifts;

  const displayRule = useMemo(() => {
    if (!isOrderGifts) return satisfyRules;
    return satisfyRules.map((each) => {
      const { id } = each;
      const sameCloudRule = cloudPromotion.find((each) => each._id === id);
      const orderGiftCondition = sameCloudRule.conditions.find(
        (each) => each['order/totalAmount']
      )?.['order/totalAmount'];
      return {
        ...each,
        orderGiftCondition,
      };
    });
  }, [isOrderGifts, satisfyRules, cloudPromotion]);

  useEffect(() => {
    if (alreadySelectedPromotion?.length) {
      setSelectedPromotion(alreadySelectedPromotion);
    }
  }, [alreadySelectedPromotion, setSelectedPromotion]);

  const displayRuleWithItems = useMemo(() => {
    return (
      displayRule
        ?.map((rule) => ({
          rule,
          items: getPromotionItemsByRule(rule, categoryList),
        }))
        ?.filter((each) => each.items.length > 0) || []
    );
  }, [displayRule, categoryList]);

  useEffect(() => {
    if (!displayRuleWithItems.length) return;
    const selectedRuleId = alreadySelectedPromotion?.[0]?.ruleId;
    const nextRuleId = displayRuleWithItems.some(
      ({ rule }) => rule.id === selectedRuleId
    )
      ? selectedRuleId
      : displayRuleWithItems[0].rule.id;
    setActiveRuleId((currentRuleId) =>
      displayRuleWithItems.some(({ rule }) => rule.id === currentRuleId)
        ? currentRuleId
        : nextRuleId
    );
  }, [displayRuleWithItems, alreadySelectedPromotion]);

  const getActivityTabTitle = (rule) => {
    const { activityRule = {} } = rule;
    if (!exchangePurchase) {
      return t('giftActivityTab', { count: activityRule.giftsNumber });
    }
    const discount =
      activityRule.discountType === 'fixDiscount'
        ? `$${activityRule.discountNumber}`
        : `${activityRule.discountNumber}%`;
    return t('exchangePurchaseActivityTab', {
      discount,
      count: activityRule.giftsNumber,
    });
  };

  const visibleRuleWithItems =
    displayRuleWithItems.length > 1
      ? displayRuleWithItems.filter(({ rule }) => rule.id === activeRuleId)
      : displayRuleWithItems;

  const handleEditPromotionItem = (item, ruleId, appendItem = false) => {
    const selectionItem = {
      ...cloneDeep(item),
      sequence: item.sequence ?? nanoid(),
    };
    const idx = selectedPromotion.findIndex((info) => info.ruleId === ruleId);
    if (idx > -1) {
      const newSelectPromotion = selectedPromotion.map((each, i) => {
        if (i === idx) {
          const { items } = each;
          let newItems = [];
          // 当前菜是否已经选择
          const isChoosenItemIdx = items.findIndex(
            (dish) => dish.id === selectionItem.id
          );
          if (isChoosenItemIdx > -1 && appendItem) {
            newItems = [...each.items, selectionItem];
          } else if (isChoosenItemIdx > -1) {
            newItems = [...each.items];
            newItems.splice(isChoosenItemIdx, 1, selectionItem);
          } else {
            if (
              selectionItem?.promotionInfo?.promotionType === 'WholeOrderGift'
            ) {
              selectionItem.price = 0; //满赠的活动时候，直接把价格改成0
            }
            newItems = [...each.items, selectionItem];
          }
          return newItems.length > 0
            ? {
                ...each,
                items: newItems,
              }
            : null;
        }
        return each;
      });
      setSelectedPromotion(newSelectPromotion.filter(Boolean));
      return;
    }
    if (selectionItem?.promotionInfo?.promotionType === 'WholeOrderGift') {
      selectionItem.price = 0; //满赠的活动时候，直接把价格改成0
    }
    const newSelectPromotion = [
      ...selectedPromotion,
      { items: [selectionItem], ruleId },
    ];
    setSelectedPromotion(newSelectPromotion);
  };

  const handleAddItem = (item, ruleId, appendItem = false) => {
    const baseItem = {
      remark: {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      },
      ...item,
      quantity: Number(item.quantity || 1),
      isExchangePurchaseSelection: exchangePurchase,
    };
    handleEditItem(baseItem, {
      selectedPromotion: [],
      Fn: (item) => handleEditPromotionItem(item, ruleId, appendItem),
    });
  };

  const handleUpdateItem = (item, ruleId) => {
    const eidtItem = selectedPromotion
      .find((info) => info.ruleId === ruleId)
      .items.find((_) => _.id === item.id);
    handleEditItem(eidtItem, {
      selectedPromotion: selectedPromotion,
      Fn: (item) => handleEditPromotionItem(item, ruleId),
    });
  };

  const handleRemoveItem = (item, ruleId) => {
    setSelectedPromotion((prev) =>
      prev.reduce((acc, each) => {
        if (each.ruleId === ruleId) {
          const newItems = each.items.filter((dish) => dish.id !== item.id);
          if (newItems.length > 0) {
            acc.push({ ...each, items: newItems }); // 仅添加非空项
          }
        } else {
          acc.push(each); // 直接添加未修改的项
        }
        return acc;
      }, [])
    );
  };

  const handleRemoveOneItem = (item, ruleId) => {
    setSelectedPromotion((prev) =>
      prev.reduce((acc, each) => {
        if (each.ruleId === ruleId) {
          const newItems = [...each.items];
          const removeIndex = newItems
            .map((dish) => dish.id)
            .lastIndexOf(item.id);
          if (removeIndex > -1) newItems.splice(removeIndex, 1);
          if (newItems.length > 0) acc.push({ ...each, items: newItems });
        } else {
          acc.push(each);
        }
        return acc;
      }, [])
    );
  };

  const handleConfirmVariantRemoval = (_itemId, variants) => {
    if (!deleteSelection) return;
    setSelectedPromotion((prev) =>
      replacePromotionItemVariants(
        prev,
        deleteSelection.ruleId,
        deleteSelection.item.id,
        variants
      )
    );
    setDeleteSelection(null);
  };

  const handleStageVariantRemoval = (sequence) => {
    setDeleteSelection((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.sequence !== sequence),
    }));
  };

  const handleChangeItemQuantity = (item, ruleId, change) => {
    setSelectedPromotion((prev) =>
      prev.map((promotion) => {
        if (promotion.ruleId !== ruleId) return promotion;
        return {
          ...promotion,
          items: promotion.items.map((selectedItem) =>
            selectedItem.id === item.id
              ? {
                  ...selectedItem,
                  quantity: Number(selectedItem.quantity || 1) + change,
                }
              : selectedItem
          ),
        };
      })
    );
  };

  const handleCountClickable = (
    currentRuleId,
    currentItemId,
    giftsNumber,
    giftsType
  ) => {
    if (!selectedPromotion?.length) return 'ok';
    const isSameRule = selectedPromotion.find(
      (promotion) => promotion.ruleId === currentRuleId
    );
    // 只能选一个规则
    if (!isSameRule) return 'only-one-rule';
    const { items } = isSameRule;
    // 只能选相同的
    if (
      supportsMultipleSelection &&
      giftsType === 'identical' &&
      !items.some((item) => item.id === currentItemId)
    ) {
      return 'select-same-item';
    }
    const selectedQuantity = items.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    );
    if (selectedQuantity >= Number(giftsNumber)) {
      const isRemoveItem = items.map((item) => item.id).includes(currentItemId);
      return isRemoveItem ? 'ok' : 'upper-limit';
    }
    return 'ok';
  };

  const handleSkip = () => {
    if (selectedPromotion?.length) return;
    onClose?.(false);
    onNext();
  };

  const handleConfirm = () => {
    if (!selectedPromotion?.length) return;
    onClose?.(selectedPromotion);
  };

  const handleClose = () => {
    onClose?.(
      alreadySelectedPromotion?.length > 0 ? alreadySelectedPromotion : false
    );
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={handleClose}
        closeIcon={<ArrowBackIosIcon style={{ fontSize: 32, color: '#000' }} />}
        title={t(
          exchangePurchase ? 'exchangePurchaseAvailable' : 'achieveStandard'
        )}
        placement="bottom"
        rootStyle={{ zIndex: 9999 }}
        rootClassName="promotion_items_drawer"
        maskClosable={false}
      >
        <div className={styles.promotionItems}>
          {!isOrderGifts && (
            <div className={styles.titleTip}>({t('onlyOne')})</div>
          )}
          {displayRuleWithItems.length > 1 && (
            <div className={styles.activityTabs}>
              {displayRuleWithItems.map(({ rule }) => (
                <div
                  key={rule.id}
                  className={classNames(
                    styles.activityTab,
                    activeRuleId === rule.id && styles.activeActivityTab
                  )}
                  onClick={() => setActiveRuleId(rule.id)}
                >
                  {getActivityTabTitle(rule)}
                </div>
              ))}
            </div>
          )}
          <div className={styles.content}>
            {!displayRuleWithItems.length ? (
              <div className={styles.emptyTip}>
                {t('promotion-gift-stopped-redeem')}
              </div>
            ) : (
              visibleRuleWithItems.map(({ rule, items }) => {
                const {
                  activityRule,
                  id: ruleId,
                  orderGiftCondition = {},
                } = rule;
                const {
                  buyNumber,
                  giftsType,
                  giftsNumber,
                  conditionType,
                  satisfyPrice,
                  discountType,
                  discountNumber,
                } = activityRule;
                const giftsTypeLabel = t(giftsType);
                const exchangeDiscount =
                  discountType === 'fixDiscount'
                    ? `$${discountNumber}`
                    : `${discountNumber}%`;
                // 订单满赠 价格规则
                const isRange = Object.keys(orderGiftCondition).length === 2;
                return (
                  <div key={rule.id} className={styles.buyGiftsInfo}>
                    <div className={styles.itemTitle}>
                      {exchangePurchase
                        ? t(
                            conditionType === 'orderAmount'
                              ? 'exchangeOrderDeal'
                              : 'exchangeItemDeal',
                            {
                              price: satisfyPrice,
                              buyNumber,
                              giftsNumber,
                              giftsTypeLabel,
                              discount: exchangeDiscount,
                            }
                          )
                        : isOrderGifts
                          ? t('satisfyOrderCondition', {
                              price: isRange
                                ? t('rangePrice', {
                                    min: orderGiftCondition['gt*'],
                                    max: orderGiftCondition['lt*'],
                                  })
                                : t('minPrice', {
                                    min: orderGiftCondition['gt*'],
                                  }),
                              giftsNumber,
                            })
                          : t('satisfyCondition', {
                              buyNumber,
                              giftsNumber,
                              giftsTypeLabel,
                            })}
                    </div>
                    {items?.map((each) => {
                      const isSoldOut = itemIsSoldOut(each);
                      const clickInfo = handleCountClickable(
                        ruleId,
                        each.id,
                        giftsNumber,
                        giftsType
                      );
                      const isClickAble = clickInfo === 'ok';
                      const selectedRulePromotion = selectedPromotion.find(
                        (promotion) => promotion.ruleId === ruleId
                      );
                      const selectedItem = selectedRulePromotion?.items?.find(
                        (item) => item.id === each.id
                      );
                      const isItemSelected = Boolean(selectedItem);
                      const selectedItemQuantity =
                        selectedRulePromotion?.items
                          ?.filter((item) => item.id === each.id)
                          .reduce(
                            (total, item) => total + Number(item.quantity || 1),
                            0
                          ) || 0;
                      const selectedRuleQuantity =
                        selectedRulePromotion?.items?.reduce(
                          (total, item) => total + Number(item.quantity || 1),
                          0
                        ) || 0;
                      const canIncreaseSelection =
                        supportsMultipleSelection &&
                        isItemSelected &&
                        selectedRuleQuantity < Number(giftsNumber);
                      const isConfigurableItem = isPromotionItemConfigurable(
                        each,
                        judgeHasDetailInfo(each)
                      );
                      const isAddDisabled =
                        !isClickAble ||
                        (isItemSelected && !canIncreaseSelection);
                      const exchangePrices = exchangePurchase
                        ? getExchangePurchaseDisplayPrices({
                            item: each,
                            selectedItem,
                            rule,
                            currentOrder,
                            categoryList,
                          })
                        : null;
                      const showStartingPrice =
                        exchangePurchase &&
                        isConfigurableItem &&
                        !isItemSelected;
                      return (
                        <div
                          key={each.id}
                          className={styles.giftItem}
                          onClick={() => {
                            if (isSoldOut) return;
                            if (!isClickAble) return Toast.info(t(clickInfo));
                            if (canIncreaseSelection) {
                              if (isConfigurableItem) {
                                handleAddItem(each, ruleId, true);
                              } else {
                                handleChangeItemQuantity(each, ruleId, 1);
                              }
                              return;
                            }
                            if (supportsMultipleSelection && isItemSelected) {
                              return Toast.info(t('upper-limit'));
                            }
                            isItemSelected
                              ? handleUpdateItem(each, ruleId)
                              : handleAddItem(each, ruleId);
                          }}
                        >
                          {isSoldOut && (
                            <div className={styles.soldOut}>
                              {t('sold-out')}
                            </div>
                          )}
                          <div className={styles.info}>
                            <div className={styles.itemInfo}>
                              <div className={styles.orderItemImage}>
                                <ImgCard
                                  itemInfo={each}
                                  selfConfig={selfConfig}
                                />
                              </div>
                              <div className={styles.textInfo}>
                                <div className={styles.name}>
                                  {getDishItemLanguage(
                                    each.fieldDisplayNameGroups,
                                    language
                                  ) || each.name}
                                </div>
                                <div className={styles.price}>
                                  {exchangePurchase ? (
                                    <>
                                      <span className={styles.originalPrice}>
                                        ${exchangePrices.originalPrice}
                                        {showStartingPrice && '+'}
                                      </span>
                                      <span className={styles.discountedPrice}>
                                        ${exchangePrices.discountedPrice}
                                        {showStartingPrice && '+'}
                                      </span>
                                    </>
                                  ) : (
                                    '$0.00'
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={styles.calcBox}>
                              {!isSoldOut && (
                                <>
                                  {isItemSelected && (
                                    <>
                                      <Fab
                                        aria-label="Remove"
                                        className={styles.btnEn}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            supportsMultipleSelection &&
                                            selectedItemQuantity > 1
                                          ) {
                                            const selectedVariants =
                                              selectedRulePromotion.items.filter(
                                                (item) => item.id === each.id
                                              );
                                            if (selectedVariants.length > 1) {
                                              setDeleteSelection({
                                                item: each,
                                                items: selectedVariants,
                                                ruleId,
                                              });
                                            } else if (isConfigurableItem) {
                                              handleRemoveOneItem(each, ruleId);
                                            } else {
                                              handleChangeItemQuantity(
                                                each,
                                                ruleId,
                                                -1
                                              );
                                            }
                                            return;
                                          }
                                          handleRemoveItem(each, ruleId);
                                        }}
                                      >
                                        <RemoveIcon
                                          className={styles.muiDiyIcon}
                                        />
                                      </Fab>
                                      <div className={styles.qty}>
                                        {selectedItemQuantity}
                                      </div>
                                    </>
                                  )}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isClickAble)
                                        return Toast.info(t(clickInfo));
                                      if (canIncreaseSelection) {
                                        if (isConfigurableItem) {
                                          handleAddItem(each, ruleId, true);
                                        } else {
                                          handleChangeItemQuantity(
                                            each,
                                            ruleId,
                                            1
                                          );
                                        }
                                        return;
                                      }
                                      if (isItemSelected)
                                        return Toast.info(t('upper-limit'));
                                      handleAddItem(each, ruleId);
                                    }}
                                  >
                                    <Fab
                                      disabled={isAddDisabled}
                                      aria-label="Add"
                                      className={
                                        isAddDisabled
                                          ? styles.btnDis
                                          : `${styles.btnEn} animate-btn`
                                      }
                                    >
                                      <AddIcon className={styles.muiDiyIcon} />
                                    </Fab>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          <footer className={styles.footerBtn}>
            <div
              className={classNames(
                styles.skip,
                selectedPromotion.length && styles.disabledBtn
              )}
              onClick={handleSkip}
            >
              {t('skip')}
            </div>
            <div
              onClick={handleConfirm}
              className={classNames(
                styles.confirmBtn,
                !selectedPromotion.length ? styles.disabledBtn : 'animate-btn'
              )}
            >
              {t('operate-confirm')}
            </div>
          </footer>
        </div>
      </Drawer>
      {deleteSelection && (
        <Dialog
          isMountOnBody
          visible
          html={
            <div
              className={deleteStyles.deleteContainer}
              onClick={() => setDeleteSelection(null)}
            >
              <div
                className={deleteStyles.deleteBox}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={deleteStyles.deleteList}>
                  {deleteSelection.items.map((item, index) => (
                    <div
                      className={deleteStyles.itemBox}
                      key={item.sequence || index}
                    >
                      <div className={deleteStyles.itemName}>
                        {getDishItemLanguage(
                          item.fieldDisplayNameGroups,
                          language
                        ) || item.name}
                      </div>
                      <div className={deleteStyles.itemLeft}>
                        <div className={deleteStyles.opt}>
                          {getVariantDescription(item, language)}
                        </div>
                        <div className={deleteStyles.price}>
                          ${Big(getItemPrice(item) || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className={deleteStyles.calcBox}>
                        <Fab
                          aria-label="Remove"
                          className={deleteStyles.btnEn}
                          onClick={() =>
                            handleStageVariantRemoval(item.sequence)
                          }
                        >
                          <RemoveIcon className={deleteStyles.muiDiyIcon} />
                        </Fab>
                        <div className={deleteStyles.qty}>1</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={deleteStyles.deleteBottom}>
                  <div
                    className={`${deleteStyles.addCart} linear-animate-btn`}
                    onClick={() =>
                      handleConfirmVariantRemoval(
                        deleteSelection.item.id,
                        deleteSelection.items
                      )
                    }
                  >
                    <span>{t('confirm')}</span>
                    <div className={deleteStyles.price}>
                      {deleteSelection.items.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      )}
    </>
  );
};

export default PromotionItems;
