import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './comboSizeSelect.module.scss';
import { setItemPrice } from '@/actions';
import _ from 'lodash';
import Icon from '@/component/icon';
import { getItemSizeName } from '@/utils/busTools';
class ComboSizeSelect extends Component {
  // 选中size
  handleChooseSize = (e) => {
    const { optAndRemark, sideNavList } = this.props;
    // size选择完成后，且主菜没有options和备注，自动跳下一步
    if (optAndRemark) {
      // const sectionIdx = sideNavList?.findIndex((s) => s.id == -1);
      //this.props.setCurSectionId(sectionIdx + 1);
      //this.props.comboStepUpTop(sectionIdx + 1);
    }
    this.props.setItemPrice(e);
  };

  render() {
    const {
      currentOrderCombo,
      comboSizeList,
      isInFreeItem,
      isPromotionItem,
      selfConfig,
      i18n: { language },
      itemSizeList,
    } = this.props;

    let activedSizeId = null;
    // 选中的sizeId
    const result = currentOrderCombo.find((s) => s.id == -1);
    if (result) {
      activedSizeId = result.sizeInfo.sizeId;
    }

    // kiosk后台配置菜价为0是否展示开关
    const zeroShow = selfConfig?.configMap?.id_51;

    const comboSize = comboSizeList.map((sizeInfo) => {
      return (
        <div
          className={[
            styles.sizeItem,
            activedSizeId == sizeInfo.sizeId && styles.sizeItemChecked,
          ].join(' ')}
          onClick={() => {
            this.handleChooseSize(sizeInfo);
          }}
        >
          {activedSizeId == sizeInfo.sizeId && (
            <Icon type="check" size={5.5} className={styles.checkIcon} />
          )}
          <div key={sizeInfo.id} className={styles.bannerProItem}>
            <div className={styles.bannerProItemName}>
              {
                getItemSizeName(
                  sizeInfo.sizeId,
                  sizeInfo.size,
                  itemSizeList,
                  language
                )
              }
            </div>
            {(zeroShow || sizeInfo.price > 0) && (
              <div>
                $
                {isInFreeItem || isPromotionItem
                  ? '0.00'
                  : _.round(sizeInfo.price, 2).toFixed(2)}
              </div>
            )}
            {sizeInfo?.strikethroughPrice !== undefined && (
              <span className={styles.strikethroughPrice}>
                <span>$</span>
                {sizeInfo.strikethroughPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      );
    });

    return comboSize;
  }
}

function mapStateToProps(state, ownProps) {
  return {
    currentOrderCombo: state.currentOrderCombo,
    itemSizeList: state.itemSizeList,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    currentItem: state.currentItem,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, {
  setItemPrice,
})(withTranslation()(ComboSizeSelect));
