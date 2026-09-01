import React, { useMemo, memo } from 'react';
import styles from './DishItem.module.scss';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import ImgCard from '@/component/imgCard';
import POINT from '@/assets/images/star.png';
import Counter from '@/component/Counter';
import { changeFreeItem } from '@/actions/crm_action';
import { getDishItemLanguage } from '@/utils/busTools';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';
import checkCRMType from '@/utils/checkCRMType';
import DishTag from '@/component/DishTag';

const FREE_ITEM_MAX = 1;
const MemoDishTag = memo(DishTag);

const DishItem = (props) => {
  const {
    item,
    itemIndex,
    handleClickItem,
    crm: { selectedFreeItem, selectedDiscount },
    changeFreeItem,
    i18n: { language },
    t,
    selfConfig,
    allSysConfig,
    menuItemList,
  } = props;

  const currentItemCount = useMemo(() => {
    const crmType = checkCRMType(allSysConfig);
    if (crmType === 1) {
      return (
        selectedFreeItem.find(
          (each) => each.id === item.id && each.itemPoints === item.itemPoints
        )?.quantity || 0
      );
    }
    if (crmType === 2) {
      return (
        selectedFreeItem.find(
          (each) =>
            each.id === item.id &&
            each.crmIntegrationRule._id === item.crmIntegrationRule._id
        )?.quantity || 0
      );
    }
  }, [selectedFreeItem, item]);

  const reduceItemCount = () => {
    if (currentItemCount === 1) {
      const newSelectedFreeItem = selectedFreeItem.filter(
        (dish) => dish.id !== item.id
      );
      changeFreeItem(newSelectedFreeItem);
    }
  };

  const itemName = useMemo(() => {
    return item.name
      ? getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name
      : '';
  }, [item.name, language]);

  const stoppedStatus = useMemo(() => {
    return getItemStoppedStatus(item);
  }, [item, selfConfig?.soldOut, menuItemList]);
  const isSoldout = Boolean(stoppedStatus);

  const isDiscountItem = useMemo(() => {
    return item.hasOwnProperty('itemPoints');
  }, [item]);

  const disabledItem = useMemo(() => {
    const crmType = checkCRMType(allSysConfig);
    if (crmType === 1) {
      return (
        Object.keys(selectedDiscount).length ||
        (selectedFreeItem.length && item.id !== selectedFreeItem[0].id)
      );
    }
    if (crmType === 2) {
      return (
        Object.keys(selectedDiscount).length ||
        (selectedFreeItem.length &&
          (item.id !== selectedFreeItem[0].id ||
            selectedFreeItem[0]?.crmIntegrationRule._id !==
              item?.crmIntegrationRule._id)) ||
        !item.rewardRule.isValid
      );
    }
  }, [selectedFreeItem, item]);

  const property = useMemo(() => {
    //判断是不是有自定义标签 处理自定义标签和属性标签
    const isPropertyVisible = selfConfig?.configList?.find(
      (i) => i.id === 54
    )?.value;
    const propertyArr = isPropertyVisible
      ? selfConfig?.configList?.find((i) => i.id === 38)?.value
      : [];
    let tags = [];
    propertyArr.map((tag) => {
      if (tag.dish.includes(item.id) || tag.dish.includes(item?.oId)) {
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
    if (Array.isArray(item.properties)) {
      tags = [...item.properties, ...tags];
    }
    return tags;
  }, [selfConfig.configList, item.id, item.oId]);

  return (
    <div
      key={`${item.id}${itemIndex}`}
      className={`${styles.freeItemItem} ${currentItemCount > 0 && styles.selected} ${disabledItem && styles.disabled}`}
      onClick={() => {
        if (isSoldout) return;
        handleClickItem(item);
      }}
    >
      {isSoldout && (
        <div className={styles.soldout}>
          {stoppedStatus === 'unavailable'
            ? t('item-unavailable')
            : t('sold-out')}
        </div>
      )}
      <div className={styles.imgWrapper}>
        <ImgCard selfConfig={selfConfig} itemInfo={item} />
      </div>
      <div className={styles.contentWrapper}>
        <div>
          <div className={styles.itemName}>{itemName}</div>
          <MemoDishTag tagsInfo={property} isItemCard={false} />
        </div>
        <div className={styles.addRow}>
          {isDiscountItem ? (
            <div className={styles.pointShow}>
              <img className={styles.pointImg} src={POINT} alt="point" />
              <div
                className={styles.pointText}
              >{`${item.itemPoints} ${t('pts')}`}</div>
            </div>
          ) : (
            <div className={styles.pointShow}>
              <div className={styles.priceText}>
                <span>${item.price}</span>
                <span className={styles.originalPrice}>
                  ${item.originalPrice}
                </span>
              </div>
            </div>
          )}

          <div className={styles.counter}>
            <Counter
              quantity={currentItemCount}
              handleReduce={reduceItemCount}
              handleAdd={() => handleClickItem(item)}
              max={FREE_ITEM_MAX}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    selfConfig: state.selfConfig,
    allSysConfig: state.allSysConfig,
    menuItemList: state.menuItemList,
  };
}

export default withRouter(
  connect(mapStateToProps, { changeFreeItem })(withTranslation()(DishItem))
);
