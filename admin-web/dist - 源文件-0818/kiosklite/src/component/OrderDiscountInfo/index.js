import React, { useMemo } from 'react';
import styles from './index.module.scss';
import { useTranslation } from 'react-i18next';
import CLOSE from '@/assets/images/close.png';
import PROMOTIONTAG from '@/assets/images/promotion-tag.png';

const OrderDiscountInfo = (props) => {
  const { data, setDetailVisible, promotionType, promotionItem } = props;
  const { t } = useTranslation();

  // 支持直接传入单个促销类型或促销项
  const normalizedData = useMemo(() => {
    // 如果传入了 promotionItem，直接使用
    if (promotionItem) {
      return Array.isArray(promotionItem) ? promotionItem : [promotionItem];
    }
    // 如果传入了 promotionType，从 data 中过滤出该类型
    if (promotionType && data) {
      return data.filter((item) => item?.promotionType === promotionType);
    }
    // 默认使用 data（可能是数组或单个对象）
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data, promotionType, promotionItem]);

  // "满减折扣"
  const totalAmountQuantityDiscountList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'totalAmountQuantityDiscount'
    );
  }, [normalizedData]);

  // "满金额赠菜"
  const amountGiftItemList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'amountGiftItem'
    );
  }, [normalizedData]);

  // "M件N折"
  const quantityItemDiscountList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'quantityItemDiscount'
    );
  }, [normalizedData]);

  // "买A赠B"
  const orderItemGiftItemList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'orderItemGiftItem'
    );
  }, [normalizedData]);

  // "买A换B"
  const orderItemChangeItemList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'orderItemChangeItem'
    );
  }, [normalizedData]);

  // "特价优惠"
  const orderItemFixedPriceList = useMemo(() => {
    return normalizedData.filter(
      (item) => item?.promotionType === 'orderItemFixedPrice'
    );
  }, [normalizedData]);

  // "新会员活动"
  const newMemberList = useMemo(() => {
    return normalizedData.filter((item) => item?.promotionType === 'newMember');
  }, [normalizedData]);

  // 所有促销类型数组的统一配置
  const arrays = useMemo(() => {
    return [
      {
        list: totalAmountQuantityDiscountList,
        type: 'totalAmountQuantityDiscount',
      },
      { list: amountGiftItemList, type: 'amountGiftItem' },
      { list: quantityItemDiscountList, type: 'quantityItemDiscount' },
      { list: orderItemGiftItemList, type: 'orderItemGiftItem' },
      { list: orderItemChangeItemList, type: 'orderItemChangeItem' },
      { list: orderItemFixedPriceList, type: 'orderItemFixedPrice' },
      { list: newMemberList, type: 'newMember' },
    ];
  }, [
    totalAmountQuantityDiscountList,
    amountGiftItemList,
    quantityItemDiscountList,
    orderItemGiftItemList,
    orderItemChangeItemList,
    orderItemFixedPriceList,
    newMemberList,
  ]);

  const promotionHeader = useMemo(() => {
    // 找出所有有值的数组
    const arraysWithData = arrays.filter(({ list }) => list.length > 0);

    // 如果只有一个数组有值，使用该类的 promotionType
    if (arraysWithData.length === 1) {
      return t(`${arraysWithData[0].type}_title`);
    }

    // 否则使用 allDeal_title
    return t('allDeal_title');
  }, [arrays, t]);

  // 将数据按 promotionType 分组，并生成展示数据
  const groupedData = useMemo(() => {
    const result = [];
    let globalIndex = 1;

    arrays.forEach(({ list, type }) => {
      if (list.length === 0) return;

      // 如果数组长度大于1，显示分组标题和子项;或者只有一个并且有阶梯
      if (list.length > 1 || (list.length === 1 && list[0]?.text?.length > 1)) {
        result.push({
          type: 'group',
          title: t(`${type}_title`),
          promotionType: type,
          index: globalIndex++,
        });
        // 子项用小写字母序号
        let subItemIndex = 0; // 用于跟踪子项的字母序号
        list.forEach((item, idx) => {
          const text = item?.text;
          // 如果 text 是数组，需要展开为多个子项，每个用字母序号
          if (Array.isArray(text)) {
            text.forEach((textItem) => {
              const letterIndex = String.fromCharCode(97 + subItemIndex); // a, b, c...
              result.push({
                type: 'item',
                text: textItem,
                index: letterIndex,
                promotionType: type,
              });
              subItemIndex++;
            });
          } else {
            const letterIndex = String.fromCharCode(97 + subItemIndex); // a, b, c...
            result.push({
              type: 'item',
              text: text,
              index: letterIndex,
              promotionType: type,
            });
            subItemIndex++;
          }
        });
      } else {
        // 如果数组长度等于1，使用数字序号，样式与标题项相同
        const text = list[0]?.text;
        // 如果 text 是数组，需要展开为多个一级项
        if (Array.isArray(text)) {
          text.forEach((textItem, textIdx) => {
            result.push({
              type: 'item',
              text: textItem,
              index: globalIndex++,
              promotionType: type,
              isSingleItem: true,
            });
          });
        } else {
          result.push({
            type: 'item',
            text: text,
            index: globalIndex++,
            promotionType: type,
            isSingleItem: true,
          });
        }
      }
    });

    return result;
  }, [arrays, t]);

  return (
    <div
      className={styles.orderDiscountInfo}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={CLOSE}
        alt="close"
        className={styles.closeIcon}
        onClick={() => setDetailVisible(false)}
      />
      <div className={styles.discountListWrap}>
        <div className={styles.headerText}>
          <img
            src={PROMOTIONTAG}
            alt="PROMOTIONTAG"
            className={styles.PROMOTIONTAG}
          />
          <span>{promotionHeader}</span>
        </div>
        <div className={styles.discountList}>
          {groupedData.map((item, idx) => {
            if (item.type === 'group') {
              return (
                <div
                  key={`group-${item.promotionType}-${idx}`}
                  className={styles.discountGroup}
                >
                  <div className={styles.groupTitle}>
                    {item.index}. {item.title}
                  </div>
                </div>
              );
            }
            // 没有子项的项使用与标题项相同的样式
            if (item.isSingleItem) {
              return (
                <div
                  key={`item-${item.promotionType}-${idx}`}
                  className={styles.discountGroup}
                >
                  <div className={styles.groupTitle}>
                    {item.index}. {item.text}
                  </div>
                </div>
              );
            }
            return (
              <div
                key={`item-${item.promotionType}-${idx}`}
                className={styles.discountItem}
              >
                {item.index}. {item.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderDiscountInfo;
