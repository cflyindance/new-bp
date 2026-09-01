import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VariableSizeList } from 'react-window';
import styles from './AdDiscount.module.scss';
import remToPx from '@/utils/CountRemToPx';
import Discount from '../Discount';
import Toast from '@/component/toast';

const AdDiscount = (props) => {
  const { countRow, discountRules } = props;
  const [virtualData, setVirtualData] = useState([]);
  const listRef = useRef(null);
  const { t } = useTranslation();

  // useEffect(() => {
  //   getvirtualData();
  // }, [discountRules]);

  // // 整理虚拟列表数据
  // const getvirtualData = () => {
  //   const data = [];

  //   // 处理折扣规则部分
  //   if (discountRules.length > 0) {
  //     const count = countRow.count;
  //     for (let i = 0; i < discountRules.length; i += count) {
  //       data.push({
  //         data: discountRules.slice(i, i + count),
  //         type: 'discount',
  //       });
  //     }
  //   }
  //   data.push({
  //     type: 'bottom',
  //     data: [],
  //   });

  //   setVirtualData(data);
  // };

  // useEffect(() => {
  //   if (listRef.current) {
  //     listRef.current.resetAfterIndex(0, true);
  //   }
  // }, [virtualData]);

  // // 获取动态高度
  // const getItemSize = useCallback(
  //   (index) => {
  //     const item = virtualData[index];
  //     switch (item?.type) {
  //       case 'discount':
  //         return remToPx(38);
  //       case 'bottom':
  //         return remToPx(20);
  //       default:
  //         return 0;
  //     }
  //   },
  //   [virtualData]
  // );

  // // 虚拟列表行渲染
  // const renderRow = useCallback(
  //   ({ index, style }) => {
  //     const item = virtualData[index];
  //     return <div style={style}>{renderContentItem(item)}</div>;
  //   },
  //   [virtualData]
  // );

  // // 兑换内容渲染
  // const renderContentItem = useCallback(
  //   (item) => {
  //     if (!item) return null;

  //     switch (item.type) {
  //       case 'discount':
  //         return (
  //           <Discount
  //             countRow={countRow}
  //             rowItems={item.data}
  //             discountRules={discountRules}
  //           />
  //         );
  //       default:
  //         return null;
  //     }
  //   },
  //   [countRow, discountRules]
  // );

  return (
    <div className={styles.rewardList}>
      {/* <VariableSizeList
        height={window.innerHeight - remToPx(31)}
        width={window.innerWidth - remToPx(4)}
        itemCount={virtualData.length}
        itemSize={getItemSize}
        itemData={virtualData}
        ref={listRef}
      >
        {renderRow}
      </VariableSizeList> */}
      <Discount countRow={countRow} discountRules={discountRules} />
    </div>
  );
};

export default AdDiscount;
