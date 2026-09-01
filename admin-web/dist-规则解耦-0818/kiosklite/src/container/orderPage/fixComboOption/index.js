import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './fixComboOption.module.scss';
import { getComboItemDetailInfo, getDishItemLanguage } from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';

class FixComboOption extends React.Component {
  render() {
    const {
      i18n: { language },
      sectionItemList,
      currentCategoryList,
      currentOrder,
    } = this.props;

    return (
      <div className={styles.fixComboSection}>
        {sectionItemList.map((itemInfo) => {
          const itemName =
            getDishItemLanguage(itemInfo?.fieldDisplayNameGroups, language) || itemInfo.name;

          let detailItemList = [];
          // 计价规则（需加上ADJUSTABLE_PRICE的价格和展示）
          const priceRule = itemInfo?.priceRule;

          itemInfo.comboSectionSaleItems.map((item) => {
            let food = cloneDeep(getComboItemDetailInfo(item.saleItemId, currentCategoryList));
            if (food) {
              let saleItemName =
                getDishItemLanguage(food?.fieldDisplayNameGroups, language) || food.name;

              if (priceRule == 'ADJUSTABLE_PRICE') {
                let orderType = currentOrder.orderType;
                if (food?.itemPrices) {
                  // 是否堂吃
                  if (orderType == 'DINE_IN') {
                    let dineInList = food.itemPrices.filter((f) => f.type == 'DINE_IN');
                    if (dineInList.length) {
                      food.itemPrices = cloneDeep(dineInList);
                    } else {
                      let AllList = food.itemPrices.filter((f) => f.type == 'ALL');
                      if (AllList.length) {
                        food.itemPrices = cloneDeep(AllList);
                      } else {
                        delete food.itemPrices;
                        food.price = food.price ? food.price : 0;
                      }
                    }
                  }
                   else if (orderType == 'TO_GO') {
                    // 是否打包
                    let togoList = food.itemPrices.filter((f) => f.type == 'TOGO');
                    if (togoList.length) {
                      food.itemPrices = cloneDeep(togoList);
                    } else {
                      let AllList = food.itemPrices.filter((f) => f.type == 'ALL');
                      if (AllList.length) {
                        food.itemPrices = cloneDeep(AllList);
                      } else {
                        delete food.itemPrices;
                        food.price = food.price ? food.price : 0;
                      }
                    }
                  }
                   else if (orderType == 'PICK_UP') {
                    // 是否打包
                    let pickUpList = food.itemPrices.filter((f) => f.type == 'PICKUP');
                    if (pickUpList.length) {
                      food.itemPrices = cloneDeep(pickUpList);
                    } else {
                      let AllList = food.itemPrices.filter((f) => f.type == 'ALL');
                      if (AllList.length) {
                        food.itemPrices = cloneDeep(AllList);
                      } else {
                        delete food.itemPrices;
                        food.price = food.price ? food.price : 0;
                      }
                    }
                  }
                }

                if (food?.itemPrices?.length) {
                  // 取默认最小
                  let minObj = food.itemPrices[0];
                  food.itemPrices.forEach((p) => {
                    if (p.price < minObj.price) {
                      minObj = p;
                    }
                  });
                  detailItemList.push(`${saleItemName}(x1)`);
                } else {
                  detailItemList.push(`${saleItemName}(x1)`);
                }
              } else {
                detailItemList.push(`${saleItemName}(x1)`);
              }
            }
          });

          const detail = detailItemList.join(', ');

          return (
            <div key={itemInfo.id} className={styles.fixComboItem}>
              <div className={styles.content}>{itemName}:&nbsp;&nbsp;</div>
              <div>{detail}</div>
            </div>
          );
        })}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    currentCategoryList: state.currentCategoryList,
  };
}

export default connect(mapStateToProps)(withTranslation()(FixComboOption));
