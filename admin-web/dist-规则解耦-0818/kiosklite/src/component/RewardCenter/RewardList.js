import React, { memo, useEffect, useRef, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import remToPx from '@/utils/CountRemToPx';
import RewardItem from '@/component/RewardCenter/RewardItem';
import styles from './RewardList.module.scss';
import { ITEM_HEIGHT, ROW_GAP } from '@/constants/constantUnit';

const RewardList = (props) => {
  const {
    isInRewardPage,
    fixedVirtualListData,
    vListHeight,
    onSelectItem,
    onRemoveItem,
    colNum,
    containerWidth,
  } = props;
  const listRef = useRef();

  // 语言切换时强制重新渲染虚拟列表
  useEffect(() => {
    if (fixedVirtualListData && listRef.current) {
      listRef.current?.scrollTo(0);
    }
  }, [fixedVirtualListData]);

  // 获取每个项的高度
  const getItemSize = useCallback(
    (index) => {
      // 最后一项是空白项，高度为 15rem
      if (index === fixedVirtualListData.length) {
        return isInRewardPage ? remToPx(25) : remToPx(10);
      }
      // 普通项的高度
      return remToPx(ITEM_HEIGHT + ROW_GAP);
    },
    [fixedVirtualListData]
  );

  // 当数据变化时，重置列表缓存
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [fixedVirtualListData]);

  return (
    <List
      ref={listRef}
      className={styles.rewardList}
      height={vListHeight || remToPx((ITEM_HEIGHT + ROW_GAP) * 3)}
      itemCount={fixedVirtualListData.length + 1}
      itemSize={getItemSize}
      width={remToPx(containerWidth)}
    >
      {({ index, style }) => {
        // 最后一项是空白项
        if (index === fixedVirtualListData.length) {
          return (
            <div
              key={index}
              style={style}
              className={styles.bottomSpacer}
            ></div>
          );
        }

        const row = fixedVirtualListData[index];
        if (Array.isArray(row)) {
          return (
            <div
              className={styles.listRow}
              key={index}
              style={{
                ...style,
                gridTemplateColumns: `repeat(${colNum}, 1fr`,
              }}
            >
              {row.map((each) => {
                return (
                  <RewardItem
                    onSelectItem={onSelectItem}
                    onRemoveItem={onRemoveItem}
                    data={each}
                    key={`${each.id || each._id}${each.rewardRule?._id}`}
                  />
                );
              })}
            </div>
          );
        } else {
          // 当 colNum === 1 时，row 是单个对象
          return (
            <div
              className={styles.listRow}
              key={index}
              style={{
                ...style,
                gridTemplateColumns: `repeat(${colNum}, 1fr`,
              }}
            >
              <RewardItem
                onSelectItem={onSelectItem}
                onRemoveItem={onRemoveItem}
                data={row}
                key={`${row.id || row._id}${row.rewardRule?._id}`}
              />
            </div>
          );
        }
      }}
    </List>
  );
};

export default memo(RewardList);
