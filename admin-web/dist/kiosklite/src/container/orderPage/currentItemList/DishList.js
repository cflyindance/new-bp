import React, {
  useCallback,
  useMemo,
  memo,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { VariableSizeList as List } from 'react-window';
import DishRow from './DishRow';
import BottomToast from '@/component/bottomToast';
import getVirtualListData from '@/utils/getVirtualListData';
import styles from '@/container/orderPage/currentItemList/currentItemList.module.scss';
import { lineBreakTransfer } from '@/utils/busTools';
import PromotionDealList from '@/component/PromotionDealList';
import { notifyItemCardListScroll } from '@/utils/itemCardScrollGuard';

const selectListPromotion = (state) => ({
  buyDiscountRule: state.promotion.buyDiscountRule,
  buyGiftRule: state.promotion.buyGiftRule,
  itemMatchCloudPromotion: state.promotion.itemMatchCloudPromotion,
});

const DishList = (props) => {
  const {
    t,
    allCategoryItem,
    onScroll,
    listRef,
    virtualDishListHeight,
    getCurrentItemLanguage,
    language,
    handleShowDesc,
    isTopMenu,
    selfConfig,
    freeListIsExpanded,
    freeItemMenuPosition,
    handleExpandToggle,
    onListReady,
  } = props;

  const listPromotion = useSelector(selectListPromotion, shallowEqual);

  const isListReadyRef = useRef(false);
  const hasItemsRenderedRef = useRef(false);
  const latestPropsRef = useRef(props);
  // 保持与当前 render 同步，避免 useEffect 带来的“一拍延迟”。
  latestPropsRef.current = props;

  const virtualDataList = useMemo(() => {
    if (!allCategoryItem.length) return [];
    return getVirtualListData({
      allCateList: allCategoryItem,
      isTopMenu,
      selfConfig,
      isExpand: freeListIsExpanded,
      freeItemMenuPosition,
      listPromotion,
    });
  }, [
    allCategoryItem,
    isTopMenu,
    selfConfig,
    freeListIsExpanded,
    freeItemMenuPosition,
    listPromotion,
  ]);

  const count = useMemo(() => {
    return virtualDataList?.length || 0;
  }, [virtualDataList]);

  const getItemSize = useCallback(
    (index) => {
      return virtualDataList[index]?.height;
    },
    [virtualDataList]
  );

  useLayoutEffect(() => {
    if (virtualDataList.length > 0) {
      listRef?.current?.resetAfterIndex(0);
    }
  }, [virtualDataList, listRef]);

  // 处理列表项渲染完成
  const handleItemsRendered = useCallback(
    ({ visibleStartIndex, visibleStopIndex }) => {
      if (!hasItemsRenderedRef.current && count > 0) {
        hasItemsRenderedRef.current = true;
        // 使用 requestAnimationFrame 确保 DOM 更新完成
        requestAnimationFrame(() => {
          if (listRef?.current && !isListReadyRef.current) {
            isListReadyRef.current = true;
            onListReady && onListReady();
          }
        });
      }
    },
    [listRef, count, onListReady]
  );

  // 检测 List 组件和数据的渲染状态
  useEffect(() => {
    if (listRef?.current && count > 0 && !isListReadyRef.current) {
      // 使用 setTimeout 确保 List 内部渲染完成
      const timer = setTimeout(() => {
        if (listRef?.current && !isListReadyRef.current) {
          isListReadyRef.current = true;
          onListReady && onListReady();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [listRef, count, onListReady]);

  // 当数据变化时重置状态
  useEffect(() => {
    if (count === 0) {
      isListReadyRef.current = false;
      hasItemsRenderedRef.current = false;
    }
  }, [count]);

  const handleListScroll = useCallback(
    (e) => {
      notifyItemCardListScroll();
      onScroll && onScroll(e);
    },
    [onScroll]
  );

  const listItemData = useMemo(
    () => ({
      virtualDataList,
      listPromotion,
      // 通过 itemData 变化触发 react-window 行刷新，避免 rowRender 函数频繁重建
      stockRenderDeps: {
        itemList: props.currentOrder?.itemList,
        currentOrderCombo: props.currentOrderCombo,
        menuItemList: props.menuItemList,
        crmSelectedFreeItem: props.crm?.selectedFreeItem,
        crmTempCampaign: props.crm?.tempCampaign,
      },
    }),
    [
      virtualDataList,
      listPromotion,
      props.currentOrder?.itemList,
      props.currentOrderCombo,
      props.menuItemList,
      props.crm?.selectedFreeItem,
      props.crm?.tempCampaign,
    ]
  );

  const rowRender = useCallback(
    ({ index: rowIndex, style, data }) => {
      const cate = data.virtualDataList[rowIndex];
      const latestProps = latestPropsRef.current;
      const { type } = cate;
      return (
        <div
          data-cate={cate.id}
          data-group-id={cate.groupId}
          index={rowIndex}
          key={rowIndex}
          style={style}
        >
          {type === 'promotionDealList' && <PromotionDealList />}
          {type === 'cateText' && (
            <div className={styles.cateText}>
              {lineBreakTransfer(
                getCurrentItemLanguage(cate.fieldDisplayNameGroups, language) ||
                  cate.name
              )}
            </div>
          )}
          {type === 'cateDesc' && (
            <div
              className={styles.descContainer}
              onClick={() => handleShowDesc(cate)}
            >
              <div className={styles.innerDesc}>
                <p className={[styles.descText, styles.overflowSign].join(' ')}>
                  {cate.description}
                </p>
              </div>
            </div>
          )}
          {type === 'cateList' && (
            <DishRow
              {...latestProps}
              promotion={data.listPromotion}
              cate={cate}
              colNum={cate.colNum}
            />
          )}
          {type === 'expendButton' &&
            !freeListIsExpanded &&
            freeItemMenuPosition === 0 && (
              <div className={styles.expandButtonContainer}>
                <button
                  className={styles.expandButton}
                  onClick={() => handleExpandToggle()}
                >
                  {t('moreFreeItem')}
                  {/* {freeListIsExpanded ? '收起' : '展开'} */}
                </button>
              </div>
            )}
          {type === 'emptyBox' && <BottomToast />}
        </div>
      );
    },
    [
      language,
      freeListIsExpanded,
      freeItemMenuPosition,
      getCurrentItemLanguage,
      handleShowDesc,
      handleExpandToggle,
      t,
    ]
  );

  return (
    <List
      className="v_dishList"
      width={isTopMenu ? '100vw' : 'calc(100vw - 32rem)'}
      height={virtualDishListHeight}
      itemCount={count}
      itemSize={getItemSize}
      ref={listRef}
      onScroll={handleListScroll}
      onItemsRendered={handleItemsRendered}
      itemData={listItemData}
      style={{ overflowX: 'hidden' }}
      overscanCount={1}
    >
      {rowRender}
    </List>
  );
};

export default memo(DishList);
