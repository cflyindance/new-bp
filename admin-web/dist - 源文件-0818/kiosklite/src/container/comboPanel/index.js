import React, { Suspense, lazy } from 'react';
import styles from './comboPanel.module.scss';
import { connect } from 'react-redux';
const FullComboPanel = lazy(() => import('./fullComboPanel'));
const ComboHeader = lazy(() => import('./ComboHeader'));
import { initCurrentOrderCombo, resetCurrentOrderCombo } from '@/actions';
import FallbackLoading from '@/component/FallbackLoading';

class ComboPanel extends React.Component {
  state = {
    comboScrollY: 0,
  };

  componentWillMount() {
    if (this.props.currentOrderCombo.length === 0 && !this.props.itemInfo) {
      const { currentCategoryList, currentItem } = this.props;
      const itemInfo = { ...currentItem };

      const currentCategory = currentCategoryList?.find((cate) =>
        cate.saleItems?.find((item) => item.id === itemInfo.id)
      );
      this.props.initCurrentOrderCombo(itemInfo, currentCategory);
    }
    if (this.props.itemInfo) {
      const { currentCategoryList } = this.props;
      const itemInfo = this.props.itemInfo;
      const currentCategory = currentCategoryList?.find((cate) =>
        cate.saleItems?.find((item) => item.id === itemInfo.id)
      );
      this.props.initCurrentOrderCombo(itemInfo, currentCategory);
    }
  }

  componentWillUnmount() {
    this.props.resetCurrentOrderCombo();
  }

  getComboScrollY = (value) => {
    this.setState({ comboScrollY: value });
  };

  render() {
    const {
      onCloseModal,
      comboPanelIdx,
      isInFreeItem = false,
      isSpecialItem = false,
      isPromotionItem,
      isExchangePurchase = false,
      onAddFreeItem,
      max,
      itemPoints,
      itemVoucherPrice,
      onEditPromotionItem,
      ruleId,
      selectedPromotion,
      editingSequence,
    } = this.props;
    const { comboScrollY } = this.state;
    return (
      <div className={styles.comboPanelBx}>
        <Suspense fallback={<FallbackLoading />}>
          <ComboHeader
            handleGoBack={onCloseModal}
            comboScrollY={comboScrollY}
          />
          <FullComboPanel
            isInFreeItem={isInFreeItem}
            isSpecialItem={isSpecialItem}
            onAddFreeItem={onAddFreeItem}
            max={max}
            itemPoints={itemPoints}
            itemVoucherPrice={itemVoucherPrice}
            comboPanelIdx={comboPanelIdx}
            onCloseModal={onCloseModal}
            isPromotionItem={isPromotionItem}
            isExchangePurchase={isExchangePurchase}
            onEditPromotionItem={onEditPromotionItem}
            selectedPromotion={selectedPromotion}
            editingSequence={editingSequence}
            ruleId={ruleId}
            onScroll={this.getComboScrollY}
          />
        </Suspense>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    currentCategoryList: state.currentCategoryList,
    currentOrderCombo: state.currentOrderCombo,
    crm: state.crm,
  };
}

export default connect(mapStateToProps, {
  initCurrentOrderCombo,
  resetCurrentOrderCombo,
})(ComboPanel);
