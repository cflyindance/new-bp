//   可以选择二级的可选项（菜）列表页面
import React, { useRef, useState, useEffect, useMemo } from 'react';
import styles from './ItemOptionSelectWithSub.module.scss';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { getCurrentItemLanguage, getDishItemLanguage } from '@/utils/busTools';
import { getDeviceOrientation } from '@/utils';
// import { addOption, removeOneOption } from '@/actions';
import Toast from '@/component/toast';
import Icon from '@/component/icon';
import Counter from '@/component/Counter';
import {
  itemIsSubOptionSoldOut,
  itemIsSubOptionUnavailable,
} from '@/utils/itemIsSoldOut';
import {
  getRemainingStockNum,
  getStockItemId,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import { clearStoppedSubOptionCounts } from './clearStoppedSubOptionCounts';

const maxNum = 99;

const ItemOptionSelectWithSub = (props) => {
  const [checkedCountMap, setCheckedCountMap] = useState({});
  const [hasNoSubList, setHasNoSubList] = useState([]);
  const [hasSubList, setHasSubList] = useState([]);
  const [selectedItemList, setSelectedItemList] = useState([]);
  const [ruleToastOptionId, setRuleToastOptionId] = useState(null);
  const itemNameRefList = useRef({});
  const isVertical = getDeviceOrientation() === 'vertical';

  const { globalCount, optionCountMap, subOptionCountMap } = useMemo(() => {
    return Object.entries(checkedCountMap).reduce(
      (acc, [optionId, subOptionCountObj]) => {
        Object.entries(subOptionCountObj).forEach(([subOptionId, count]) => {
          acc.optionCountMap[optionId] =
            (acc.optionCountMap[optionId] || 0) + count;
          acc.subOptionCountMap[subOptionId] =
            (acc.subOptionCountMap[subOptionId] || 0) + count;
          acc.globalCount += count;
        });
        return acc;
      },
      { globalCount: 0, optionCountMap: {}, subOptionCountMap: {} }
    );
  }, [checkedCountMap]);

  const {
    t,
    i18n: { language },
    sectionItemList,
    itemInfo,
    onRef,
    calPrice,
    isInFreeItem,
    isPromotionItem,
    currentOrderCombo,
    currentOrder,
    menuItemList,
    isSingleMaxChosen,
    selfConfig,
    parentQty = 1,
  } = props;
  const isComboSubDish = itemInfo?.sideNavId != null;
  const currentSideNav = useMemo(
    () => currentOrderCombo?.find((item) => item.id === itemInfo?.sideNavId),
    [currentOrderCombo, itemInfo?.sideNavId]
  );
  const productCenterOptionIdSet = useMemo(
    () =>
      new Set((itemInfo?.options || []).map((option) => String(option?.id))),
    [itemInfo?.options]
  );

  useEffect(() => {
    return () => {
      itemNameRefList.current = {};
      onRef?.({});
    };
  }, []);

  // kiosk后台配置菜价为0是否展示开关
  const zeroShow = useMemo(() => {
    return selfConfig?.configMap?.id_51;
  }, [selfConfig]);

  const getNoSubList = () => {
    let sub = [];
    let pri = [];
    sectionItemList?.forEach((item) => {
      if (!item?.subOptions?.length) {
        sub.push(item);
      } else {
        pri.push(item);
      }
    });

    setHasNoSubList(sub);
    setHasSubList(pri);
  };

  const getCurrentItem = () => {
    let sectionDetaillist = [];
    // 当打开的是套餐子菜的详情时,且是单选模式，取currentOrderCombo里选中的状态值，否则取itemInfo里的值
    // 单选的时候，当次选中的不是加入currentOrderCombo的菜品时，不更新当前菜品信息
    if (
      isSingleMaxChosen &&
      currentSideNav?.items[0]?.id &&
      currentSideNav?.items[0]?.id !== itemInfo?.id
    ) {
      return;
    }

    sectionDetaillist = isSingleMaxChosen
      ? currentSideNav?.items[0]?.selectedOptionList || []
      : itemInfo?.sectionDetail || [];

    const updateOptions = (options) => {
      // 统计 id 出现次数
      const countById = options?.reduce((acc, item) => {
        if (!acc[item.id]) {
          acc[item.id] = 0;
        }
        acc[item.id] += 1;

        return acc;
      }, {});

      options?.forEach((f) => {
        const id = f.itemOptionId || f.id;
        setCheckedCountMap((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            [f.id]: countById[f.id] || 0,
          },
        }));
      }, {});
    };

    const opt = sectionDetaillist?.find((c) => c.id === -2);
    if (opt?.originalOptions || opt?.options) {
      updateOptions(opt.originalOptions || opt?.options);
    }

    const cateOpt = sectionDetaillist?.find((c) => c.id === -3);
    if (cateOpt?.options) {
      updateOptions(cateOpt.options);
    }

    // 商品中心option数据, 初始化默认选中
    const CCOptions = itemInfo?.options?.map((item) => {
      return {
        options: item?.subOptions?.filter((sub) => sub?.defaultSelected),
      };
    });

    if (!sectionDetaillist.length && CCOptions?.length) {
      CCOptions?.forEach((item) => {
        item?.options?.forEach((f) => {
          const id = f.itemOptionId || f.id;
          setCheckedCountMap((prev) => ({
            ...prev,
            [id]: {
              ...prev[id],
              [f.id]: f.defaultQuantity || 0,
            },
          }));
        }, {});
      }, {});
    }
  };

  useEffect(() => {
    getNoSubList();
    getCurrentItem();
  }, [sectionItemList]);

  const getLocalSelectedQtyByStock = (targetItem) => {
    let count = 0;
    for (const [strOptionId, subOptionCountObj] of Object.entries(
      checkedCountMap || {}
    )) {
      const optionId = Number(strOptionId);
      const parentOption = sectionItemList?.find((c) => c.id === optionId);
      if (!parentOption) {
        continue;
      }
      for (const [strSubOptionId, selectedCount] of Object.entries(
        subOptionCountObj || {}
      )) {
        if (!selectedCount) {
          continue;
        }
        const subOptionId = Number(strSubOptionId);
        const currentItem =
          subOptionId === parentOption.id
            ? parentOption
            : parentOption.subOptions?.find((sub) => sub.id === subOptionId);
        if (!currentItem) {
          continue;
        }
        if (targetItem.cloudId) {
          if (currentItem.cloudId === targetItem.cloudId) {
            count += selectedCount;
          }
        } else if (getStockItemId(currentItem) === getStockItemId(targetItem)) {
          count += selectedCount;
        }
      }
    }
    return count;
  };

  const getPersistedSelectedQtyByStock = (targetItem) => {
    let sectionDetailList = [];
    if (
      isComboSubDish &&
      isSingleMaxChosen &&
      currentSideNav?.items?.[0]?.id === itemInfo?.id
    ) {
      sectionDetailList = currentSideNav?.items?.[0]?.selectedOptionList || [];
    } else {
      sectionDetailList = itemInfo?.selectedOptionList?.length
        ? itemInfo.selectedOptionList
        : itemInfo?.sectionDetail || [];
    }

    let count = 0;
    for (const section of sectionDetailList || []) {
      if (section?.id !== -2) {
        continue;
      }
      for (const option of section?.options || []) {
        const qty = option?.quantity || 1;
        if (targetItem.cloudId) {
          if (option.cloudId === targetItem.cloudId) {
            count += qty;
          }
        } else if (getStockItemId(option) === getStockItemId(targetItem)) {
          count += qty;
        }
      }
    }
    return count;
  };

  const getDisplayStockNum = (targetItem) => {
    const remainingStockNum = getRemainingStockNum({
      itemInfo: targetItem,
      itemList: currentOrder?.itemList,
      menuItemList,
      currentOrderCombo: isComboSubDish ? currentOrderCombo : [],
    });
    if (remainingStockNum === undefined) {
      return undefined;
    }
    const extraQty = parentQty || 1;
    const persistedSelectedQty = getPersistedSelectedQtyByStock(targetItem);
    const localSelectedQty = getLocalSelectedQtyByStock(targetItem);
    const localOccupiedQty = isComboSubDish
      ? localSelectedQty - persistedSelectedQty
      : localSelectedQty;
    return Math.max(remainingStockNum - localOccupiedQty * extraQty, 0);
  };

  const handleClick = (obj, mode = 1) => {
    const option = sectionItemList?.find(
      (c) => c.id === (obj.itemOptionId || obj.id)
    );
    if (!option) return;
    const globalMax = itemInfo.numOfItemOptionAllowed || maxNum;
    const optionMax = option.max || 1;

    const checkGlobalCountMax = (quantity, optionId) => {
      const _globalCount = optionId
        ? globalCount - (optionCountMap[optionId] || 0)
        : globalCount;
      if (_globalCount + quantity > globalMax) {
        Toast.info(t('max-up', { rplc: globalMax }), 1000);
        return false;
      }
      return true;
    };
    const checkOptionStockForPlus = (targetItem) => {
      const stockNum = getDisplayStockNum(targetItem);
      if (stockNum === undefined) {
        return true;
      }
      const extraQty = parentQty || 1;
      if (stockNum < extraQty) {
        showInsufficientStockToast();
        return false;
      }
      return true;
    };

    if (obj.itemOptionId && optionMax === 1) {
      if (checkedCountMap[option.id]?.[obj.id] > 0) {
        setCheckedCountMap((prev) => ({
          ...prev,
          [option.id]: {
            [obj.id]: 0,
          },
        }));
      } else {
        if (!checkGlobalCountMax(1, option.id)) return;
        if (!checkOptionStockForPlus(obj)) return;
        setCheckedCountMap((prev) => ({
          ...prev,
          [option.id]: {
            [obj.id]: 1,
          },
        }));
      }
    } else {
      if (mode === 1) {
        if (obj.itemOptionId && optionMax > 1) {
          if (optionCountMap[obj.itemOptionId] >= optionMax) {
            return;
          }
        }
        if (obj.itemOptionId && obj.addLimit > 0) {
          if (subOptionCountMap[obj.id] >= obj.addLimit) {
            return;
          }
        }
        if (!checkOptionStockForPlus(obj)) return;
        if (checkedCountMap[option.id]?.[obj.id] > 0) {
          if (!checkGlobalCountMax(1)) return;
          setCheckedCountMap((prev) => ({
            ...prev,
            [option.id]: {
              ...checkedCountMap[option.id],
              [obj.id]: checkedCountMap[option.id]?.[obj.id] + 1,
            },
          }));
        } else {
          if (!checkGlobalCountMax(1)) return;
          setCheckedCountMap((prev) => ({
            ...prev,
            [option.id]: {
              ...checkedCountMap[option.id],
              [obj.id]: 1,
            },
          }));
        }
      } else {
        if (checkedCountMap[option.id]?.[obj.id] > 0) {
          setCheckedCountMap((prev) => ({
            ...prev,
            [option.id]: {
              ...checkedCountMap[option.id],
              [obj.id]: checkedCountMap[option.id]?.[obj.id] - 1,
            },
          }));
        }
      }
    }
  };

  useEffect(() => {
    if (!sectionItemList || !checkedCountMap) {
      setSelectedItemList([]);
      return;
    }

    const newSelectedItemList = Object.entries(checkedCountMap).reduce(
      (acc, [strOptionId, subOptionCountObj]) => {
        const optionId = Number(strOptionId);
        const option = sectionItemList.find((c) => c.id === optionId);
        if (!option) return acc;

        const subOptionList = Object.entries(subOptionCountObj).reduce(
          (acc, [strSubOptionId, count]) => {
            if (count <= 0) return acc;
            const subOptionId = Number(strSubOptionId);
            const [targetItem, price] = (() => {
              if (subOptionId === optionId) {
                return [option, option.price];
              }
              const subOption = option.subOptions?.find(
                (s) => s.id === subOptionId
              );
              return subOption
                ? [
                    { ...subOption, itemOption: option },
                    subOption.addPrice ?? subOption.price + option.price,
                  ]
                : [null, 0];
            })();
            if (!targetItem) return acc;
            return acc.concat(
              Array.from({ length: count }, () => ({
                ...targetItem,
                price,
                quantity: 1,
              }))
            );
          },
          []
        );

        return acc.concat(subOptionList);
      },
      []
    );

    setSelectedItemList((prev) => {
      let prevList = [...prev];
      let newList = [...newSelectedItemList];
      let resList = [];
      prevList.forEach((item) => {
        const idx = newList.findIndex((newItem) => newItem.id === item.id);
        if (idx > -1) {
          resList.push(newList[idx]);
          newList.splice(idx, 1);
        }
      });
      resList = resList.concat(newList);

      const optionIdList = resList.reduce((acc, item) => {
        if (item.itemOptionId && !acc.includes(item.itemOptionId)) {
          acc.push(item.itemOptionId);
        }
        return acc;
      }, []);

      optionIdList.forEach((id) => {
        const option = sectionItemList.find((c) => c.id === id);
        let freeQuantity = (option && option.freeQuantity) || 0;
        for (let i = 0; freeQuantity > 0 && i < resList.length; i++) {
          const item = resList[i];
          if (item.itemOptionId === id) {
            freeQuantity--;
            item.isFreeItem = true;
          }
        }
      });

      return resList;
    });
  }, [checkedCountMap]);

  // 父级页面清空options事件
  const clearSelectedItemList = () => {
    setSelectedItemList([]);
  };

  const showRuleToast = (option) => {
    if (option) {
      setRuleToastOptionId(option.id);
      const optionName =
        getCurrentItemLanguage(option.fieldDisplayNameGroups, language) ||
        option.name;
      Toast.info(t('requireDish', { name: optionName }), 1000);
    } else {
      setRuleToastOptionId(null);
    }
  };

  useEffect(() => {
    onRef({
      clearSelectedItemList,
      showRuleToast,
      state: { selectedItemList },
    });
    calPrice();
  }, [selectedItemList]);

  // 渲染单个项的卡片
  const renderItemCard = (
    item,
    isActive,
    isDisabled,
    onClick,
    max,
    isFree,
    parentOption
  ) => {
    const handleRemoveClick = () => {
      onClick(item, -1); // 传递 -1 表示减少数量
    };

    const handleAddClick = () => {
      onClick(item);
    };

    // 获取或创建当前 item 的 ref
    if (!itemNameRefList.current[item.id]) {
      itemNameRefList.current[item.id] = React.createRef();
    }

    let isWrapped = false;
    if (itemNameRefList.current[item.id].current) {
      const el = itemNameRefList.current[item.id].current;
      // scrollHeight > clientHeight 表示有换行
      isWrapped = el.scrollHeight > el.clientHeight;
    }

    let displayDisabled = false;
    if (max > 1 && item.itemOptionId) {
      displayDisabled =
        optionCountMap[item.itemOptionId] >= max &&
        !subOptionCountMap[item.id] > 0;
    }

    const price = isFree ? 0 : (item.addPrice ?? item.price);
    const counterMax = Math.min(
      item.addLimit ?? maxNum,
      max -
        ((optionCountMap[item.itemOptionId] ?? 0) -
          (subOptionCountMap[item.id] ?? 0))
    );

    const availabilityOptions = {
      menuItemList,
      kioskSoldOutList: selfConfig?.soldOut,
    };
    const isProductCenterOption =
      parentOption?.id !== undefined &&
      productCenterOptionIdSet.has(String(parentOption.id));
    const isUnavailableMark =
      isProductCenterOption &&
      item &&
      itemIsSubOptionUnavailable(
        itemInfo,
        parentOption,
        item,
        availabilityOptions
      );
    const isSoldoutMark =
      !isUnavailableMark &&
      isProductCenterOption &&
      item &&
      itemIsSubOptionSoldOut(itemInfo, parentOption, item, availabilityOptions);
    const isStoppedMark = isUnavailableMark || isSoldoutMark;

    const stockNum = getDisplayStockNum(item);

    return (
      <div
        key={item.id}
        className={`${styles.itemCard} ${isActive ? styles.actived : ''} ${!isStoppedMark && (isDisabled || displayDisabled) ? styles.disabled : ''} ${max !== 1 || !item.itemOptionId ? styles.multiItem : ''} ${isWrapped ? styles.wrappedItem : ''}`}
        onClick={() => {
          if (isStoppedMark) return;
          onClick(item);
        }}
        style={{
          ...(!item.itemOptionId && !isVertical
            ? { width: `100%`, margin: `0 0 2rem 0` }
            : {}),
          ...(isStoppedMark ? { pointerEvents: 'none' } : {}),
        }}
      >
        {isStoppedMark && (
          <span className={styles.soldOut}>
            {isUnavailableMark ? t('item-unavailable') : t('sold-out')}
          </span>
        )}

        {isActive && (
          <Icon type="check" size={5.5} className={styles.checkIcon} />
        )}

        <div className={`${styles.itemPrice}`}>
          <div
            className={styles.itemName}
            ref={itemNameRefList.current[item.id]}
          >
            {getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
              item.name}
          </div>
          {(zeroShow || price > 0 || stockNum !== undefined) && (
            <div className={styles.priceContainer}>
              <span className={styles.priceText}>
                ${isInFreeItem || isPromotionItem ? '0.00' : price.toFixed(2)}
              </span>
              {stockNum !== undefined && (
                <div className={styles.stockNum}>
                  {t('item-stock-num', { stockNum })}
                </div>
              )}
            </div>
          )}
        </div>

        {
          //选中并且是一级option时才显示数量
          isActive &&
            checkedCountMap[item.itemOptionId || item.id]?.[item.id] > 0 &&
            (max !== 1 || !item.itemOptionId) && (
              <Counter
                iconSize={5.1}
                plusVersion={true}
                quantity={
                  checkedCountMap[item.itemOptionId || item.id]?.[item.id] || 0
                }
                handleReduce={handleRemoveClick}
                handleAdd={handleAddClick}
                max={counterMax}
              />
            )
        }
      </div>
    );
  };

  const handleItemClick = (item, mode) => {
    handleClick(item, mode);
  };

  useEffect(() => {
    setCheckedCountMap((prev) => {
      const availabilityOptions = {
        menuItemList,
        kioskSoldOutList: selfConfig?.soldOut,
      };
      return clearStoppedSubOptionCounts({
        checkedCountMap: prev,
        displayOptionList: sectionItemList,
        itemInfo,
        availabilityOptions,
        isSubOptionUnavailable: itemIsSubOptionUnavailable,
        isSubOptionSoldOut: itemIsSubOptionSoldOut,
      });
    });
  }, [sectionItemList, itemInfo, menuItemList, selfConfig?.soldOut]);

  // 渲染没有子选项的列表
  const renderNoSubOptions = () => (
    <div>
      <div className={styles.title}>{t('item_option')}</div>
      <div className={styles.itemCardList}>
        {hasNoSubList?.map((item) =>
          renderItemCard(
            item,
            checkedCountMap[item.id]?.[item.id] > 0,
            false,
            handleItemClick,
            itemInfo.max || 1,
            false,
            null
          )
        )}
      </div>
    </div>
  );

  // 渲染子选项
  const renderSubOptions = (itemInfo) => {
    const itemName =
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
      itemInfo.name;

    const max = itemInfo.max || 1;

    const tip = (() => {
      let str = [];
      if (itemInfo.min > 0 && itemInfo.min === itemInfo.max) {
        str.push(t('selectionRuleEqual', { rplc: itemInfo.min }));
      } else if (itemInfo.min > 0 && itemInfo.min < itemInfo.max) {
        str.push(
          t('selectionRuleRange', { rplc1: itemInfo.min, rplc2: itemInfo.max })
        );
        if (itemInfo.freeQuantity > 0 && !isInFreeItem && !isPromotionItem) {
          str.push(
            t('selectionRuleRangeFree', { rplc: itemInfo.freeQuantity })
          );
        }
      } else if (itemInfo.max > 0) {
        str.push(t('selectionRuleMax', { rplc: itemInfo.max }));
        if (itemInfo.freeQuantity > 0 && !isInFreeItem && !isPromotionItem) {
          str.push(
            t('selectionRuleRangeFree', { rplc: itemInfo.freeQuantity })
          );
        }
      }
      return str.length > 0 ? str.join(', ') : '';
    })();

    const isFree =
      itemInfo.freeQuantity > 0 &&
      (optionCountMap[itemInfo.id] || 0) <= itemInfo.freeQuantity;

    return (
      <div key={itemInfo.id}>
        <div className={styles.title}>
          {itemName}
          {ruleToastOptionId !== itemInfo.id && tip && (
            <span className={styles.ruleTip}>({tip})</span>
          )}
          {ruleToastOptionId === itemInfo.id && tip && (
            <div className={styles.required}>
              {`${t('required')}: ${tip || ''}`}
            </div>
          )}
        </div>
        <div className={styles.itemCardList}>
          {itemInfo?.subOptions?.map((item) =>
            renderItemCard(
              item,
              checkedCountMap[itemInfo.id]?.[item.id] > 0,
              max === 1 &&
                Object.entries(checkedCountMap[itemInfo.id] || {}).some(
                  ([id, count]) => count > 0 && Number(id) !== item.id
                ),
              handleItemClick,
              max,
              isFree,
              itemInfo
            )
          )}
        </div>
      </div>
    );
  };

  // 合并渲染逻辑
  const renderItemList = () =>
    hasSubList?.map((itemInfo) => renderSubOptions(itemInfo));

  // 主组件的返回部分
  return (
    <>
      {hasSubList.length > 0 && renderItemList()}
      {hasNoSubList.length > 0 && renderNoSubOptions()}
    </>
  );
};

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    currentOrderCombo: state.currentOrderCombo,
    currentOrder: state.currentOrder,
    menuItemList: state.menuItemList,
    crm: state.crm,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps)(
  withTranslation()(ItemOptionSelectWithSub)
);
