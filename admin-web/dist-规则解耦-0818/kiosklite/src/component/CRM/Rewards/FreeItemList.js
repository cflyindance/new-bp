import React, { memo } from 'react';
import styles from './FreeItemList.module.scss';
import DishItem from '@/component/CRM/Rewards/DishItem';
import { withTranslation } from 'react-i18next';

const MemoDishItem = memo(DishItem);

const FreeItemList = (props) => {
  const { rowItems, countRow, handleClickItem, t } = props;

  return (
    <div
      className={styles.freeItemRow}
      style={{
        gridTemplateColumns: `repeat(${countRow.count}, ${countRow.widthRate}%)`,
      }}
    >
      {rowItems.map((item, i) => {
        return (
          <MemoDishItem
            key={item.id}
            item={item}
            rowIndex={Math.floor(i / countRow.count)}
            itemIndex={i}
            handleClickItem={handleClickItem}
          />
        );
      })}
    </div>
  );
};

export default withTranslation()(FreeItemList);
