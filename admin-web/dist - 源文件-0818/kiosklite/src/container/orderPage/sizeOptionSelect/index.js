import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './sizeOptionSelect.module.scss';
import Icon from '@/component/icon';
import {
  getItemOptionName,
  getItemSizeName,
  getComboSectionInfo,
} from '@/utils/busTools';
import Big from 'big.js';

class SizeOptionSelect extends React.Component {
  componentDidMount() {
    this.handleRenderSelected();
  }

  componentDidUpdate(prevProps) {
    const orderTypeChanged =
      prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType;
    if (
      prevProps.defaultItemSizeId !== this.props.defaultItemSizeId ||
      orderTypeChanged ||
      prevProps.sectionItemList !== this.props.sectionItemList
    ) {
      this.handleRenderSelected();
    }
  }

  handleRenderSelected = () => {
    const {
      sectionItemList,
      changeSize,
      defaultItemSizeId,
      itemInfo,
      currentOrderCombo,
      isSingleMaxChosen,
      sideNavList,
    } = this.props;

    let currentSideNav = currentOrderCombo?.find(
      (item) => item.id === itemInfo?.sideNavId
    );

    const sectionInfo = getComboSectionInfo(sideNavList, itemInfo?.sideNavId);

    let orderedItemsMap = new Map();
    if (sectionInfo?.mergeDisplay) {
      const orderedItems = currentOrderCombo?.filter(
        (sct) => sct.id == itemInfo?.sideNavId
      )?.[0]?.items;
      orderedItems.forEach((item) => {
        const iSizeInfo = item.selectedOptionList?.find(
          (item) => item.id === -1
        )?.sizeInfo;
        if (iSizeInfo?.sizeId) {
          if (orderedItemsMap.has(iSizeInfo.sizeId)) {
            orderedItemsMap.set(
              iSizeInfo.sizeId,
              orderedItemsMap.get(iSizeInfo.sizeId) + 1
            );
          } else {
            orderedItemsMap.set(iSizeInfo.sizeId, 1);
          }
        }
      });
    }

    let tempSizeInfo = null;

    const sizeChosen = currentSideNav?.items[0]?.selectedOptionList?.find(
      (c) => c.id === -1
    )?.sizeInfo;
    const defaultItemSize = sectionItemList?.find(
      (item) => item.sizeId === defaultItemSizeId
    );

    // 是套餐子菜，单选模式，且当前规格为选中状态，则展示上一次保存的状态
    if (
      sizeChosen &&
      isSingleMaxChosen &&
      currentSideNav?.items[0]?.id &&
      currentSideNav?.items[0]?.id === itemInfo?.id
    ) {
      tempSizeInfo = sizeChosen;
    } else if (defaultItemSize) {
      // 否则展示默认规格
      tempSizeInfo = defaultItemSize;
    } else if (sectionItemList?.length === 1) {
      tempSizeInfo = sectionItemList[0];
    }

    if (sectionInfo?.mergeDisplay) {
      let tempSectionItemList = [...sectionItemList];
      if (tempSizeInfo) {
        const addLimit = tempSizeInfo.originalComboSectionSaleItem?.addLimit;
        const currentOrderedItemQty =
          orderedItemsMap.get(tempSizeInfo?.sizeId) || 0;
        if (currentOrderedItemQty < addLimit) {
          tempSectionItemList = [];
          changeSize(tempSizeInfo);
        }
      }
      const nextSizeInfo = tempSectionItemList.filter((item) => {
        if (tempSizeInfo && item.sizeId === tempSizeInfo?.sizeId) {
          return false;
        }
        const addLimit = item.originalComboSectionSaleItem?.addLimit;
        const currentOrderedItemQty = orderedItemsMap.get(item?.sizeId) || 0;
        if (currentOrderedItemQty < addLimit) {
          return true;
        }
        return false;
      });
      if (nextSizeInfo.length === 1) {
        changeSize(nextSizeInfo[0]);
      }
    } else {
      if (tempSizeInfo) {
        changeSize(tempSizeInfo);
      }
    }
  };

  render() {
    const {
      itemInfo,
      sideNavList,
      selectedItem,
      changeSize,
      sectionItemList,
      fixItemPrice = 0,
      currentOrder: { orderType },
      isInFreeItem,
      isPromotionItem,
      i18n: { language },
      itemSizeList,
      currentOrderCombo,
    } = this.props;
    const sideNavId = itemInfo?.sideNavId;
    let finalPrice = Big(0);
    let filterSizeByOrderType = [];
    const allList = sectionItemList.filter((size) => {
      return size.type === 'ALL';
    });
    if (orderType === 'DINE_IN') {
      const dineInList = sectionItemList.filter((size) => {
        return size.type === 'DINE_IN';
      });
      if (dineInList.length) {
        filterSizeByOrderType = dineInList;
      } else {
        filterSizeByOrderType = allList;
      }
    } else if (orderType === 'TO_GO') {
      const togoList = sectionItemList.filter((size) => {
        return size.type === 'TOGO';
      });
      if (togoList.length) {
        filterSizeByOrderType = togoList;
      } else {
        filterSizeByOrderType = allList;
      }
    } else if (orderType === 'PICK_UP') {
      const pickUpList = sectionItemList.filter((size) => {
        return size.type === 'PICKUP';
      });
      if (pickUpList.length) {
        filterSizeByOrderType = pickUpList;
      } else {
        filterSizeByOrderType = allList;
      }
    }

    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    let orderedItems = [];
    if (sectionInfo?.mergeDisplay) {
      orderedItems = currentOrderCombo?.filter(
        (sct) => sct.id == sideNavId
      )?.[0]?.items;
    }

    return (
      <div className={styles.comboSection}>
        {filterSizeByOrderType?.map((itemInfo) => {
          let itemInfoName = '';
          let itemInfoPrice = '';
          let isLimitReached = false;

          if (itemInfo.size) {
            itemInfoName = `${getItemSizeName(itemInfo.sizeId, itemInfo.size, itemSizeList, language)}`;

            if (itemInfo.price) {
              // 自选套餐里面的子菜
              if (sideNavId) {
                const priceRule = sectionInfo?.priceRule;
                if (priceRule === 'FIXED_PRICE') {
                  itemInfoPrice = '0.00';
                } else {
                  itemInfoPrice = itemInfo.price;
                }
              } else {
                itemInfoPrice = itemInfo.price;
              }
            }

            if (sectionInfo?.mergeDisplay) {
              const addLimit = itemInfo.originalComboSectionSaleItem?.addLimit;
              const currentOrderedItemQty = orderedItems?.filter((item) => {
                const iSizeInfo = item.selectedOptionList?.find(
                  (item) => item.id === -1
                )?.sizeInfo;
                if (iSizeInfo?.sizeId === itemInfo.sizeId) {
                  return true;
                }
              })?.length;
              if (currentOrderedItemQty >= addLimit) {
                isLimitReached = true;
              }
            }
          } else {
            itemInfoName =
              getItemOptionName(itemInfo.fieldDisplayNameGroups, language) ||
              itemInfo.name;
          }

          return (
            <div
              key={itemInfo.id ?? itemInfo.sizeId}
              className={[
                styles.sizeItem,
                selectedItem?.sizeId === itemInfo.sizeId &&
                  styles.sizeItemChecked,
                isLimitReached && styles.sizeItemDisabled,
              ].join(' ')}
              onClick={() => changeSize(itemInfo, { isLimitReached })}
            >
              {selectedItem?.sizeId === itemInfo.sizeId && (
                <Icon type="check" size={5.5} className={styles.checkIcon} />
              )}
              <div className={styles.bannerProItem}>
                <div className={styles.bannerProItemName}>{itemInfoName}</div>
                {isInFreeItem || isPromotionItem ? (
                  <div>$0.00</div>
                ) : (
                  <div>
                    $
                    {finalPrice
                      ?.plus(itemInfoPrice || 0)
                      ?.plus(fixItemPrice || 0)
                      ?.toFixed(2)}
                    {itemInfo?.strikethroughPrice !== undefined && (
                      <span className={styles.strikethroughPrice}>
                        <i>$</i>
                        {itemInfo.strikethroughPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    itemSizeList: state.itemSizeList,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    currentOrder: state.currentOrder,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default connect(mapStateToProps)(withTranslation()(SizeOptionSelect));
