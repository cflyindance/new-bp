import { Drawer } from 'antd';
import styles from './ItemsDrawer.module.scss';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import ImgCard from '@/component/imgCard';
import {
  attachCategoryOptionsToItem,
  getDishItemLanguage,
  judgeHasDetailInfo,
} from '@/utils/busTools';
import { withTranslation } from 'react-i18next';
import OrderDetailModal from '@/container/orderPage/orderDetailModal';
import Dialog from '@/component/dialog';
import ComboPanel from '@/container/comboPanel';
import { connect } from 'react-redux';
import {
  getCurrentCategory,
  getCurrentItem,
  setActivityCurrentItem,
} from '@/actions';
import Counter from '@/component/Counter';
import { v4 as uuidv4 } from 'uuid';
import { getItemPrice } from '@/utils/priceCalculator';
import Toast from '@/component/toast';
import { VariableSizeList as List } from 'react-window';
import handleCountRowNum from '@/utils/handleCountRowNum';
import remToPx from '@/utils/CountRemToPx';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';
import DishTag from '@/component/DishTag';
import PromotionTagsWrap from '@/component/PromotionTagsWrap';
import ItemDeleteDrawer from './ItemDeleteDrawer';
import { useCloseModalOnHomePage } from '@/hooks';
import getItemDisplayPrice from '@/utils/getItemDisplayPrice';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import { getPromotionCenterActivityRuleText } from '@/utils/PromotionCenterIntegration/getPromotionCenterDisplayText';
import {
  isStockSufficient,
  getRemainingStockNum,
  showInsufficientStockToast,
  validateComboSubmitStock,
} from '@/utils/validateItemStock';

const MemoDishTag = memo(DishTag);
const ItemContext = createContext({
  tempValue: null,
  leftMax: 0,
  isCRMIntegrationItem: undefined,
  isPromotionItem: undefined,
  activityInfo: {},
  handleRemoveItem: () => {},
  handleClickItem: () => {},
  beforeSelectItemCheck: () => {},
  drawerType: null,
  getItemDisplayOriginalPrice: () => {},
});

const ItemsDrawer = (props) => {
  const {
    // props
    open,
    displayName,
    activityInfo,
    itemList,
    onClose,
    max = 9999,
    value,
    onItemChange,
    handleConfirm,
    // store
    selfConfig,
    i18n: { language, t },
    getCurrentCategory,
    getCurrentItem,
    sideNavList,
    sideNavId,
    currentOrder,
    currentCategoryList,
    currentOrderCombo,
    drawerType,
    beforeSelectItemCheck,
    menuItemList,
    setActivityCurrentItem,
    crm,
  } = props;

  useCloseModalOnHomePage(onClose);

  const orderDetailModal = useRef(null);
  const [orderPanelShow, setOrderPanelShow] = useState(false);
  const [comboPanelVisible, setComboPanelVisible] = useState(false);
  const [tempItemInfo, setTempItemInfo] = useState(null);
  // 最终吐出值
  const [tempValue, setTempValue] = useState(null);
  // 标记 handleAddNewItem 的调用来源
  const addItemSourceRef = useRef(null);

  // 同步菜单列表中的 outOfStock 状态，实现实时更新 isSoldout
  const syncedItemList = useMemo(() => {
    if (!itemList?.length || !menuItemList) return itemList;
    return itemList.map((item) => {
      const latestItem = menuItemList[item?.isFreeItem ? item?.oId : item?.id];
      if (latestItem) {
        // 同步最新的 outOfStock 状态
        return {
          ...item,
          outOfStock: latestItem.outOfStock,
        };
      }
      return item;
    });
  }, [itemList, menuItemList]);

  const openOrderDetailModal = (ref) => {
    orderDetailModal.current = ref;
  };

  useEffect(() => {
    if (open && value?.length) {
      setTempValue(value);
    }
  }, [value, open]);

  useEffect(() => {
    if (!open) {
      setTempValue(null);
    }
  }, [open]);

  // 当前抽屉中选中的项（过滤出在 syncedItemList 中存在的项）
  const selectedItemsInDrawer = useMemo(() => {
    return (
      tempValue?.filter((each) =>
        syncedItemList.find((i) => i.id === each.id)
      ) || []
    );
  }, [tempValue, syncedItemList]);

  // 当前选中数量
  const currentQty = useMemo(() => {
    return selectedItemsInDrawer.reduce((pre, cur) => {
      return pre + cur.quantity;
    }, 0);
  }, [selectedItemsInDrawer]);

  // 还能选几个
  const leftMax = useMemo(() => {
    return max - (currentQty || 0);
  }, [max, currentQty]);

  const handleAddNewItem = (itemInfo) => {
    // 判断调用来源：'handleClickItem' or 组件回调
    const isFromHandleClickItem =
      addItemSourceRef.current === 'handleClickItem';

    const stockState = {
      currentOrder,
      crm,
      menuItemList,
      currentOrderCombo,
    };
    const stockContext = {
      itemList: currentOrder?.itemList,
      menuItemList,
      currentOrderCombo,
      crm,
      drawerPendingItems: tempValue,
    };
    const isComboWithSubItems = itemInfo?.sectionDetail?.some(
      (section) => section.id > 0 && section.items?.length
    );
    if (
      isComboWithSubItems
        ? !validateComboSubmitStock(itemInfo, stockState, {
            drawerPendingItems: tempValue,
          })
        : !isStockSufficient({
            itemInfo,
            addQty: itemInfo?.quantity || 1,
            ...stockContext,
          })
    ) {
      showInsufficientStockToast();
      addItemSourceRef.current = null;
      return;
    }

    // 当前选中的所有菜的数量，handleClickItem 只有等于时提示; 组件回调大于时都提示
    const totalChosenNum = currentQty + itemInfo?.quantity;
    if (
      isPromotionItem &&
      activityInfo?.type === 'orderItemFixedPrice' &&
      (isFromHandleClickItem
        ? currentQty === quantityLimit
        : totalChosenNum > quantityLimit)
    ) {
      Toast.info(t('quantity_limit_condition', { value: quantityLimit }));
    }

    const newItem = {
      ...itemInfo,
      uniqueItemTempId: uuidv4(),
    };
    if (onItemChange) {
      const res = onItemChange(newItem);
      if (!res) return;
    }
    setTempValue([
      ...(tempValue || []),
      {
        ...newItem,
        totalAmount: getItemPrice(newItem) * newItem?.quantity,
      },
    ]);

    // 重置标记
    addItemSourceRef.current = null;
  };

  const handleClickItem = (itemInfo) => {
    if (
      isCRMIntegrationItem ||
      (isPromotionItem && activityInfo?.type !== 'orderItemFixedPrice')
    ) {
      if (leftMax <= 0) return Toast.info(t('upper-limit'));
    }

    const itemData = {
      ...itemInfo,
      remark: {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      },
    };
    if (itemInfo.itemType === 'SALE_ITEM') {
      // 判断当前菜，是否有详情等字段
      if (judgeHasDetailInfo(itemInfo)) {
        setTempItemInfo(itemData);
        setOrderPanelShow(true);
        return;
      }
      const clonedItem = { ...itemData, quantity: 1 };
      if (clonedItem.itemPrices?.length === 1) {
        clonedItem.sectionDetail = [
          {
            id: -1,
            sizeInfo: Object.assign({}, clonedItem.itemPrices[0]),
          },
        ];
        clonedItem.price = 0;
      } else {
        clonedItem.sectionDetail = [];
      }
      addItemSourceRef.current = 'handleClickItem';
      handleAddNewItem(clonedItem);
      return;
    }
    // 固定套餐
    if (itemInfo.comboType === 'FIXED_SELECTION') {
      setTempItemInfo(itemData);
      setOrderPanelShow(true);
      return;
    }
    // 自选套餐：需带上 categoryId 并合并类目 categoryOptions，否则 ComboCateyOptionItem 不展示
    const itemWithCategoryId =
      itemData.categoryId != null
        ? itemData
        : {
            ...itemData,
            categoryId: currentCategoryList?.find((category) =>
              category.saleItems?.some(
                (saleItem) => saleItem.id === itemData.id
              )
            )?.id,
          };
    const comboItemData = attachCategoryOptionsToItem(
      itemWithCategoryId,
      currentCategoryList
    );
    setTempItemInfo(comboItemData);
    setActivityCurrentItem(comboItemData);
    setComboPanelVisible(true);
  };

  const getItemDisplayOriginalPrice = ({ itemInfo, specialPrice }) => {
    return getItemDisplayPrice({
      itemInfo,
      specialPrice,
      isComboType: false,
      currentOrder,
      currentCategoryList,
      sideNavList,
      sideNavId,
      currentOrderCombo,
    }).price;
  };

  const [deleteDrawerVisible, setDeleteDrawerVisible] = useState(false);
  const [deleteItemInfo, setDeleteItemInfo] = useState(null);
  const handleRemoveItem = (itemInfo) => {
    if (!tempValue?.length) return;
    const quantity = tempValue.reduce((pre, cur) => {
      return cur.id === itemInfo.id ? pre + cur.quantity : pre;
    }, 0);
    if (itemInfo.itemType === 'SALE_ITEM') {
      // 详情菜
      if (judgeHasDetailInfo(itemInfo) && quantity > 1) {
        setDeleteItemInfo(itemInfo);
        setDeleteDrawerVisible(true);
        return;
      }
      const idx = tempValue.findIndex((item) => item.id === itemInfo.id);
      if (idx !== -1) {
        const currentItemQuantity = tempValue[idx].quantity;
        if (currentItemQuantity > 1) {
          setTempValue(
            tempValue.map((e, i) => {
              if (i === idx) {
                return {
                  ...e,
                  quantity: e.quantity - 1,
                };
              }
              return e;
            })
          );
          return;
        }
        setTempValue(tempValue.filter((_, i) => i !== idx));
      }
      return;
    }
    if (quantity <= 1) {
      setTempValue(tempValue.filter((item) => item.id !== itemInfo.id));
    } else {
      setDeleteItemInfo(itemInfo);
      setDeleteDrawerVisible(true);
    }
  };

  const handleRemoveComboItem = (id, itemList) => {
    const newItemList = tempValue.filter((item) => item.id !== id);
    setTempValue(newItemList.concat(itemList));
  };

  const handleClickConfirm = async () => {
    if (!tempValue?.length) return Toast.info(t('category-tip-single'));
    const res = await handleConfirm(tempValue);
    if (!res) return;
    onClose();
  };

  const colNum = useMemo(() => {
    return handleCountRowNum({ isTopMenu: true, selfConfig });
  }, [selfConfig]);

  const virtualDataList = useMemo(() => {
    if (!syncedItemList?.length) return [];
    const newList = syncedItemList
      .reduce((preV, curV, index) => {
        const chunkIndex = Math.floor(index / colNum.count);
        if (!preV[chunkIndex]) preV[chunkIndex] = [];
        preV[chunkIndex].push(curV);
        return preV;
      }, [])
      .concat({
        id: 'emptyBox',
        groupId: 'emptyBox',
        type: 'emptyBox',
      });
    return newList;
  }, [syncedItemList, colNum]);

  const count = useMemo(() => {
    return virtualDataList?.length || 0;
  }, [virtualDataList]);

  const rowRender = useCallback(
    ({ index: rowIndex, style }) => {
      const cate = virtualDataList[rowIndex];
      if (!cate) return null;
      if (cate.type === 'emptyBox')
        return <div index={rowIndex} key={rowIndex} style={style}></div>;

      return (
        <div index={rowIndex} key={rowIndex} style={style}>
          <div
            className={styles.contentList}
            style={{
              gridTemplateColumns: `repeat(${colNum.count}, ${colNum.widthRate}%)`,
            }}
          >
            {cate.map((each, idx) => {
              return <Item key={idx} itemInfo={each} />;
            })}
          </div>
        </div>
      );
    },
    [language, selfConfig, virtualDataList]
  );

  const contentListWrapperRef = useRef(null);
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const onAfterOpenChange = (open) => {
    if (open && contentListWrapperRef.current) {
      const style = getComputedStyle(contentListWrapperRef.current);
      setWrapperHeight(parseFloat(style.height));
    }
  };

  const totalNum = useMemo(() => {
    return selectedItemsInDrawer.reduce((pre, cur) => {
      return pre + (cur.quantity || 0);
    }, 0);
  }, [selectedItemsInDrawer]);

  // ad
  const isCRMIntegrationItem = useMemo(() => {
    return activityInfo?.couponTemplateId;
  }, [activityInfo]);

  // 促销
  const isPromotionItem = useMemo(() => {
    return !!activityInfo?.activityRule;
  }, [activityInfo]);

  // 门槛
  const minSpend = useMemo(() => {
    // ad
    if (isCRMIntegrationItem) {
      return activityInfo?.couponTemplate?.ruleExpression?.condition
        ?.totalAmount;
    }
    // 促销
    if (isPromotionItem) {
      return (
        activityInfo?.activityRule[0]?.totalAmount ||
        activityInfo?.activityRule[0]?.satisfyPrice
      );
    }
  }, [isCRMIntegrationItem, activityInfo, isPromotionItem]);

  // 上限
  const quantityLimit = useMemo(() => {
    // ad
    if (isCRMIntegrationItem) {
      return max;
    }
    // 促销
    if (isPromotionItem) {
      const isFixedPrice = activityInfo?.type === 'orderItemFixedPrice';
      return drawerType === 'reward' ? (isFixedPrice ? max : leftMax) : 9999;
    }
  }, [
    isCRMIntegrationItem,
    max,
    isPromotionItem,
    activityInfo,
    drawerType,
    leftMax,
  ]);

  // totalPrice : 菜价 用来计算距离门槛差多少
  const totalPrice = useMemo(() => {
    // 特价优惠使用购物车全部商品，其他类型使用抽屉中选中的商品
    const itemsToCalculate =
      activityInfo?.type === 'orderItemFixedPrice'
        ? tempValue || []
        : selectedItemsInDrawer;

    return itemsToCalculate.reduce((pre, cur) => {
      return (
        pre +
        (getItemPrice({
          ...cur,
          price: cur?.itemPrices?.length ? 0 : cur.price, // 有详情价为0 否则按照原价取
        }) || 0) *
          cur?.quantity
      );
    }, 0);
  }, [tempValue, selectedItemsInDrawer, activityInfo]);

  // 需要传入给详情框和combo的max 用来限制最多数量 和 超出提示
  // crm活动[ad] 值都为1;
  // 促销活动 特价优惠不限量  其他活动取还剩可选数量
  const modalMax = useMemo(() => {
    return isCRMIntegrationItem
      ? 1
      : activityInfo?.type === 'orderItemFixedPrice'
        ? 9999
        : leftMax;
  }, [isCRMIntegrationItem, activityInfo, leftMax]);

  // 展示满足门槛提示文案
  const showMinSpend = useMemo(() => {
    return (
      minSpend &&
      totalPrice < minSpend &&
      (drawerType !== 'reward' || activityInfo?.type === 'orderItemFixedPrice')
    );
  }, [minSpend, activityInfo, drawerType, totalPrice]);

  return (
    <>
      <Drawer
        onClose={onClose}
        closeIcon={<ArrowBackIosIcon style={{ fontSize: 32, color: '#000' }} />}
        title={displayName}
        placement="bottom"
        open={open}
        rootStyle={{ zIndex: 9999 }}
        rootClassName="special_items_drawer"
        maskClosable={false}
        afterOpenChange={onAfterOpenChange}
      >
        {showMinSpend && (
          <div className={styles.minSpend}>
            {t('how_money_get_condition', {
              value: `$${(minSpend - totalPrice).toFixed(2)}`,
            })}
          </div>
        )}
        <div className={styles.specialItemContent} ref={contentListWrapperRef}>
          <ItemContext.Provider
            value={{
              tempValue,
              leftMax,
              isCRMIntegrationItem,
              isPromotionItem,
              activityInfo,
              handleRemoveItem,
              handleClickItem,
              beforeSelectItemCheck,
              drawerType,
              getItemDisplayOriginalPrice,
            }}
          >
            <List
              width="calc(100vw - 8rem)"
              height={wrapperHeight}
              itemSize={() => remToPx(50)}
              itemCount={count}
              overscanCount={1}
            >
              {rowRender}
            </List>
          </ItemContext.Provider>
          <footer className={styles.confirmBtn} onClick={handleClickConfirm}>
            {t('confirm_Items', {
              value: totalNum ?? 0,
            })}
          </footer>
        </div>
      </Drawer>

      {/* 详情菜 */}
      {orderPanelShow && tempItemInfo && (
        <OrderDetailModal
          isMountOnBody
          isSpecialItem
          onAddFreeItem={handleAddNewItem}
          max={modalMax}
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
            isSpecialItem
            onAddFreeItem={handleAddNewItem}
            max={modalMax}
            itemInfo={tempItemInfo}
            itemPoints={tempItemInfo?.itemPoints || 0}
            itemVoucherPrice={tempItemInfo?.price || 0}
            onCloseModal={() => {
              setComboPanelVisible(false);
              setTempItemInfo(null);
            }}
          />
        }
      />

      {/* 删除菜品抽屉 */}
      {deleteDrawerVisible && (
        <ItemDeleteDrawer
          itemInfo={deleteItemInfo}
          itemList={tempValue}
          handleCloseDeleteModal={() => setDeleteDrawerVisible(false)}
          handleConfirm={handleRemoveComboItem}
        />
      )}
    </>
  );
};

const Item = connect(mapStateToProps, {
  getCurrentCategory,
  getCurrentItem,
})(
  withTranslation()(
    ({
      t,
      itemInfo,
      selfConfig,
      currentOrder,
      currentOrderCombo,
      menuItemList,
      crm,
      i18n: { language },
    }) => {
      const {
        tempValue,
        leftMax,
        isCRMIntegrationItem,
        handleRemoveItem,
        handleClickItem,
        isPromotionItem,
        activityInfo,
        beforeSelectItemCheck,
        drawerType,
        getItemDisplayOriginalPrice,
      } = useContext(ItemContext);

      // promotion标签
      const renderPromotionTags = () => {
        const promotionType = itemInfo?.promotionRule?.promotion?.type;
        const activityRule = itemInfo?.promotionRule?.promotion?.activityRule;
        if (
          !promotionType ||
          !activityRule.length ||
          GIFT_PROMOTION_TYPE.includes(promotionType)
        ) {
          return null;
        }
        const promotionRule = itemInfo?.promotionRule;
        const tags = [
          getPromotionCenterActivityRuleText({
            t,
            activityRule,
            type: promotionType,
            promotionName: promotionRule?.promotion?.promotionName,
            selfConfig,
            promoCenterHitActivity: promotionRule,
          }),
        ];
        return <PromotionTagsWrap tags={tags} className="singleWrap" />;
      };

      //判断是不是有自定义标签 处理自定义标签和属性标签
      const isPropertyVisible = selfConfig?.configList?.find(
        (i) => i.id === 54
      )?.value;
      const propertyArr = isPropertyVisible
        ? selfConfig?.configList?.find((i) => i.id === 38)?.value
        : [];
      let tags = [];
      propertyArr.map((tag) => {
        if (tag.dish.includes(itemInfo.id)) {
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
      if (Array.isArray(itemInfo.properties)) {
        tags = [...itemInfo.properties, ...tags];
      }

      const itemName =
        getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
        itemInfo.name;
      const isHasDetailPrice =
        itemInfo.options?.length > 0 || itemInfo.itemPrices?.length > 1;
      // 特价
      const isHasSpecialPrice = typeof itemInfo.specialPrice === 'number';
      let specialPrice = null;
      if (isHasSpecialPrice) {
        const actualSpecialPrice = getItemDisplayOriginalPrice({
          itemInfo,
          specialPrice: itemInfo.specialPrice,
        });
        specialPrice = Number(actualSpecialPrice).toFixed(2);
        if (isHasDetailPrice) {
          specialPrice += '+';
        }
      }
      // 原价
      let originalPrice = getItemDisplayOriginalPrice({ itemInfo }).toFixed(2);
      if (isHasDetailPrice) {
        originalPrice += '+';
      }
      const quantity = tempValue?.reduce((pre, cur) => {
        return cur.id === itemInfo.id ? pre + cur.quantity : pre;
      }, 0);
      // 售罄
      const stoppedStatus = getItemStoppedStatus(itemInfo);
      const isSoldout = Boolean(stoppedStatus);
      // 库存数量（显示剩余可售数量）
      const stockNum = getRemainingStockNum({
        itemInfo,
        itemList: currentOrder?.itemList,
        menuItemList,
        currentOrderCombo,
        crm,
        drawerPendingItems: tempValue,
      });
      return (
        <div
          className={styles.specialItem}
          onClick={() => {
            if (isSoldout) return;
            if (beforeSelectItemCheck) {
              const res = beforeSelectItemCheck(itemInfo);
              if (!res) return;
            }
            handleClickItem(itemInfo);
          }}
        >
          {isSoldout && (
            <div className={styles.soldout}>
              {stoppedStatus === 'unavailable'
                ? t('item-unavailable')
                : t('sold-out')}
            </div>
          )}
          <div className={styles.itemImage}>
            <ImgCard selfConfig={selfConfig} itemInfo={itemInfo} />{' '}
            {stockNum !== undefined && (
              <div className={styles.stockNum}>
                {t('item-stock-num', { stockNum })}
              </div>
            )}
            <div className={styles.counter}>
              <Counter
                quantity={quantity}
                handleReduce={() => handleRemoveItem(itemInfo)}
                handleAdd={() => handleClickItem(itemInfo)}
                max={
                  isCRMIntegrationItem ||
                  (isPromotionItem &&
                    activityInfo?.type !== 'orderItemFixedPrice')
                    ? leftMax + quantity
                    : 9999
                }
              />
            </div>
          </div>
          <div className={styles.specialItemInfo}>
            <div className={styles.itemName}>{itemName}</div>
            <MemoDishTag tagsInfo={tags} isItemCard={false} />
            {renderPromotionTags()}
            <div
              className={`${styles.itemPrice} ${tags.length > 0 ? styles.haveTagPrice : ''}`}
            >
              {isHasSpecialPrice && (
                <span className={styles.specialPrice}>${specialPrice}</span>
              )}
              <span
                className={styles.originalPrice}
                style={
                  isHasSpecialPrice ? { textDecoration: 'line-through' } : null
                }
              >
                ${originalPrice}
              </span>
            </div>
          </div>
        </div>
      );
    }
  )
);

function mapStateToProps(state) {
  return {
    crm: state.crm,
    selfConfig: state.selfConfig,
    sideNavList: state.sideNav.sideNavList,
    currentOrder: state.currentOrder,
    currentOrderCombo: state.currentOrderCombo,
    currentCategoryList: state.currentCategoryList,
    sideNavId: state.sideNav.sideNavId,
    menuItemList: state.menuItemList,
  };
}

export default connect(mapStateToProps, {
  getCurrentCategory,
  getCurrentItem,
  setActivityCurrentItem,
})(withTranslation()(ItemsDrawer));
