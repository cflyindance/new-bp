import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './comboOptionsCard.module.scss';
import Toast from '../../component/toast';
import { getDishItemLanguage } from '@/utils/busTools';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
const defaultMax = 99;

class ComboOptionsCard extends React.Component {
  constructor() {
    super();
    this.state = {
      maxNum: defaultMax,
    };
  }

  // 追加options
  handleAddOptions = () => {
    const { t, itemQty, currentOrderCombo, currentItem } = this.props;
    const { maxNum } = this.state;

    // item-options-max
    const itemOptMax = currentItem.numOfItemOptionAllowed;

    // 已选择options的总个数
    let addOptTotal = 0;
    let optObj = currentOrderCombo.find((c) => c.id == -2);
    let cateOptObj = currentOrderCombo.find((p) => p.id == -3);
    if (optObj?.options?.length) {
      addOptTotal += optObj.options.length;
    }
    if (cateOptObj?.options?.length) {
      addOptTotal += cateOptObj.options.length;
    }

    // 没有上限
    if (!itemOptMax) {
      if (itemQty < maxNum) {
        this.props.onClick && this.props.onClick();
      } else {
        Toast.info(t('max-up', { rplc: defaultMax }), 1000);
      }
    } else {
      if (itemQty < maxNum && addOptTotal < itemOptMax) {
        this.props.onClick && this.props.onClick();
      } else {
        if (addOptTotal < itemOptMax) {
          Toast.info(t('max-up', { rplc: defaultMax }), 1000);
        } else {
          Toast.info(t('max-up', { rplc: itemOptMax }), 1000);
        }
      }
    }
  };

  render() {
    const {
      i18n: { language },
      itemInfo,
      itemQty,
    } = this.props;
    const itemName =
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
      itemInfo.name;
    const isActived = !!(itemQty > 0);

    return (
      <div
        className={[
          styles.itemCard,
          this.props.disabled ? styles.disabled : null,
          isActived && styles.actived,
        ].join(' ')}
        onClick={this.handleAddOptions}
      >
        <span>
          {itemName}({'$' + itemInfo.price.toFixed(2)})
        </span>
        {/*<div className={styles.qtyBox} style={{ display: isActived ? 'flex' : 'none' }}>*/}
        {/*  <div*/}
        {/*    className={styles.qty}*/}
        {/*    onClick={(event) => {*/}
        {/*      event.stopPropagation();*/}
        {/*      this.props.onQtyClicked && this.props.onQtyClicked();*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    {itemQty}-*/}
        {/*  </div>*/}
        {/*</div>*/}
        {isActived && (
          <div className={styles.rightCounter}>
            <div
              className={styles.counterBtn}
              onClick={(event) => {
                event.stopPropagation();
                this.props.onQtyClicked && this.props.onQtyClicked();
              }}
            >
              <RemoveIcon className={styles.counterIcon} />
            </div>
            <span> {itemQty}</span>
            <div
              className={styles.counterBtn}
              onClick={(event) => {
                event.stopPropagation();
                this.handleAddOptions();
              }}
            >
              <AddIcon className={styles.counterIcon} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default connect(mapStateToProps)(withTranslation()(ComboOptionsCard));
