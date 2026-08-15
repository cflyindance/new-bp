import React, { useMemo, useEffect, useRef } from 'react';
import styles from './oldDishList.module.scss';
import BottomToast from '@/component/bottomToast';
import ItemCard from '@/component/itemCard';
import PromotionDealList from '@/component/PromotionDealList';
import itemIsSoldOut from '@/utils/itemIsSoldOut';

const OldDIshList = (props) => {
  const {
    itemListDom,
    currentCategory,
    handleShowDesc,
    allCategoryItem,
    getCurrentItemQty,
    handleClickItem,
    handleReduceItem,
    colNum,
    promotion: { buyDiscountRule },
    headerHeight,
    onListReady,
  } = props;

  const isListReadyRef = useRef(false);

  const saleItems = useMemo(() => {
    return (
      allCategoryItem?.find((each) => each.id === currentCategory.id)
        ?.saleItems || []
    );
  }, [allCategoryItem, currentCategory]);

  // 检测列表渲染完成
  useEffect(() => {
    if (itemListDom?.current && !isListReadyRef.current) {
      // 使用 requestAnimationFrame 确保 DOM 更新完成
      requestAnimationFrame(() => {
        // 再次检查，确保 DOM 已经渲染
        if (itemListDom?.current && !isListReadyRef.current) {
          isListReadyRef.current = true;
          onListReady && onListReady();
        }
      });
    }
  }, [itemListDom, saleItems, currentCategory, onListReady]);

  // 当数据变化时重置状态
  useEffect(() => {
    if (saleItems.length === 0) {
      isListReadyRef.current = false;
    }
  }, [saleItems, currentCategory]);

  return (
    <div
      style={{ height: `calc(100vh - ${headerHeight}rem)` }}
      id="itemListContainerId"
      className={styles.itemListContainer}
      ref={itemListDom}
    >
      {currentCategory.description &&
        currentCategory.description !== 'undefined' && (
          <div
            className={styles.descContainer}
            onClick={() => handleShowDesc(currentCategory)}
          >
            <div className={styles.innerDesc}>
              <p className={[styles.descText, styles.overflowSign].join(' ')}>
                {currentCategory.description}
              </p>
            </div>
          </div>
        )}
      {currentCategory.id === 'promotion-deals-list' ? (
        <PromotionDealList />
      ) : (
        <div
          className={styles.itemListInner}
          style={{
            gridTemplateColumns: `repeat(${colNum.count}, ${colNum.widthRate}%)`,
          }}
        >
          {saleItems?.map((itemInfo) => {
            itemInfo.remark = {
              optionName: '',
              optionType: 'NOTE',
              quantity: 1,
              price: 0,
            };
            const { isFreeItem, id, oId } = itemInfo;
            const itemQty = getCurrentItemQty({
              itemId: isFreeItem ? oId : id,
              isFreeItem,
            });
            if (
              !itemInfo.hiddenItem ||
              (itemInfo.hiddenItem && itemInfo.isFreeItem)
            ) {
              const { id } = itemInfo;
              const discountInfo = buyDiscountRule?.find((info) =>
                info.activityRule.buyDishes.includes(id)
              );
              // 是否是售罄菜
              const isSoldoutMark = itemIsSoldOut(itemInfo);
              return (
                <div key={itemInfo.id}>
                  <ItemCard
                    {...props}
                    isThumbPath
                    key={itemInfo.id}
                    itemInfo={itemInfo}
                    itemQty={itemQty}
                    onClick={() => {
                      handleClickItem(itemInfo);
                    }}
                    onQtyClicked={() => {
                      handleReduceItem(itemInfo);
                    }}
                    discountInfo={discountInfo}
                    isInFreeItem={itemInfo.isFreeItem}
                    isSoldoutMark={isSoldoutMark}
                  />
                </div>
              );
            }
          })}
        </div>
      )}
      <BottomToast />
    </div>
  );
};

export default OldDIshList;
