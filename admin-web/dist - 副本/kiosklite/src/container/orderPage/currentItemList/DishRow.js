import React, { useRef } from 'react';
import styles from './currentItemList.module.scss';
import ItemCard from '../../../component/itemCard';
import itemIsSoldOut from '@/utils/itemIsSoldOut';

const DishRow = (props) => {
  const {
    cate,
    getCurrentItemQty,
    handleClickItem,
    handleReduceItem,
    colNum,
    promotion,
  } = props;
  const itemRef = useRef();
  const buyDiscountRule = promotion.buyDiscountRule;

  return (
    <div ref={itemRef} key={cate.id} className={styles.cateBox}>
      <div
        className={styles.itemListInner}
        style={{
          gridTemplateColumns: `repeat(${colNum.count}, ${colNum.widthRate}%)`,
        }}
      >
        {cate.saleItems?.map((itemInfo) => {
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
              // <></>
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
            );
          }
        })}
      </div>
    </div>
  );
};

export default DishRow;
