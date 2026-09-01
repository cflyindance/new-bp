import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './combo.module.scss';
import floatNumberRounding from '@/utils/formatNumberRounding';
import { getItemPrice } from '@/utils/priceCalculator';
import {
  judegStepIsHasMustDish,
  getOneUncompletedSection,
} from '@/utils/busTools';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';
import Fab from '@material-ui/core/Fab';
import RemoveIcon from '@material-ui/icons/Remove';
import AddIcon from '@material-ui/icons/Add';
import Toast from '@/component/toast';
import { removeItemFromComboSection } from '@/actions';

import Big from 'big.js';

const defaultMax = 99;

class ComboFooter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      priceTotal: '0.00',
      isAddToCart: false,
      defaultMax,
      notCompleteId: '',
    };
  }

  calcPrice = (list) => {
    let o = {};
    if (list.length) {
      list.forEach((r) => {
        if (r.sizeInfo) {
          if (r.sizeInfo.id) {
            o[r.id] = {
              t: r.sizeInfo.price,
              subList: [r.sizeInfo.price],
            };
          } else {
            o[r.id] = {
              t: '0.00',
              subList: [],
            };
          }
        } else if (r.items && r.items.length) {
          let fItemsList = r.items;
          if (fItemsList.length) {
            let t = Big(0); // 每一项菜品总价
            let subList = []; // 每小项菜品的价格
            fItemsList.forEach((o) => {
              let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
              t = t.plus(subT);
              subList.push(subT);
            });
            o[r.id] = {
              t: t.toNumber(),
              subList,
            };
          }
        } else if (r.options && r.options.length) {
          let fItemsList = r.options;
          if (fItemsList.length) {
            let t = Big(0); // 每一项菜品总价
            let subList = []; // 每小项菜品的价格
            fItemsList.forEach((o) => {
              let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
              t = t.plus(subT);
              subList.push(subT);
            });
            o[r.id] = {
              t: t.toNumber(),
              subList,
            };
          }
        }
      });
    }
    return o;
  };

  // 计算总价格
  calcTotalPrice = (obj) => {
    let t = Big(0);
    for (let k in obj) {
      t = t.plus(Big(obj[k].t));
    }
    return floatNumberRounding(t.toNumber());
  };

  // 添加到购物车
  handleAddToCart = () => {
    const { isAddToCart, notCompleteId } = this.state;
    const {
      sideNavList,
      handleChildUpTop,
      setCurSectionId,
      t,
      showRequireLabel,
      currentOrderCombo,
      currentItem,
    } = this.props;

    const stoppedStatus = getItemStoppedStatus(currentItem);
    if (stoppedStatus) {
      Toast.info(
        t(
          stoppedStatus === 'unavailable'
            ? 'dish-item-unavailable'
            : 'dish-sold-out',
          {
            item: currentItem.name,
          }
        )
      );
      return;
    }

    if (isAddToCart) {
      this.props.submitCurrentOrderCombo();
      return;
    } else {
      let isItemPrice =
        currentItem?.itemPrices && currentItem?.itemPrices.length > 0;
      const sizeInfo =
        currentOrderCombo.find((nav) => nav.id === -1)?.sizeInfo || {};

      // 没有选择规格
      if (isItemPrice && !Object.keys(sizeInfo).length) {
        Toast.info(t('choose-size'));
        this.props.scrollGeneralUsePanelToTop();
        showRequireLabel(-1);
        return;
      }
      const idx = sideNavList?.findIndex(
        (nav) => nav.id === Number(notCompleteId)
      );
      if (idx == null || idx < 0) {
        return Toast.info(t('requireDish'));
      }
      handleChildUpTop(idx);
      setCurSectionId(idx);
      showRequireLabel(Number(notCompleteId));
      return Toast.info(t('requireDish', { name: sideNavList[idx]?.name }));
    }
  };

  // 判断是否符合条件，及必选菜已选中
  judegAll = () => {
    const { sideNavList, currentOrderCombo, currentItem } = this.props;

    let isItemPrice =
      currentItem?.itemPrices && currentItem?.itemPrices.length > 0;
    const sizeInfo =
      currentOrderCombo.find((nav) => nav.id === -1)?.sizeInfo || {};
    const hasChosenSize =
      (isItemPrice && Object.keys(sizeInfo).length) || !isItemPrice; // 规格

    let mustObj = judegStepIsHasMustDish(sideNavList, currentOrderCombo);
    let mustArr = [];
    for (let k in mustObj) {
      mustArr.push(mustObj[k]);
    }
    const isMustDish = mustArr.every((_) => _);

    // 去除售罄菜品后 最低要求选择数量不满足 不可以继续点单
    const removeSoldOutCombo = currentOrderCombo?.map((item) => {
      if (item.id < 0) {
        return item;
      } else {
        return {
          ...item,
          items: item?.items?.filter((each) => {
            const stoppedStatus = getItemStoppedStatus(each);
            if (stoppedStatus) {
              this.props.removeItemFromComboSection(item.id, each.id);
            }
            return !stoppedStatus;
          }),
        };
      }
    });

    let obj = getOneUncompletedSection(sideNavList, removeSoldOutCombo);
    let arr = [];
    Object.keys(obj).forEach((o) => {
      arr.push(obj[o].isCompleted);
    });
    const isAdd = arr.every((_) => _);
    const notCompleteId = Object.keys(obj).find((each) => {
      return !obj[each].isCompleted;
    });
    return {
      isAddToCart: !!(isMustDish && isAdd && hasChosenSize),
      notCompleteId,
    };
  };

  componentDidMount() {
    const { isInFreeItem, max, isPromotionItem } = this.props;
    if ((isInFreeItem || isPromotionItem) && max) {
      this.setState({
        defaultMax: max,
      });
    }
    const { isAddToCart, notCompleteId } = this.judegAll();
    this.setState({
      isAddToCart,
      notCompleteId,
    });
  }

  componentDidUpdate() {
    const { isAddToCart, notCompleteId } = this.judegAll();
    if (
      this.state.isAddToCart != isAddToCart ||
      this.state.notCompleteId !== notCompleteId
    ) {
      this.setState({
        isAddToCart,
        notCompleteId,
      });
    }
  }

  render() {
    const { t, currentOrderCombo, currentItem, orderDishCount, changeDishNum } =
      this.props;

    const { isAddToCart, defaultMax } = this.state;
    if (!currentOrderCombo?.length) return null;

    // 价格项每一小项对象展
    const priceObj = this.calcPrice(currentOrderCombo);
    // 组合里面的菜品总价格
    let priceTotal = this.calcTotalPrice(priceObj);
    // n为计算添加的菜品总个数 -> 显示items上面
    let n = 0;
    currentOrderCombo.forEach((p) => {
      if (p?.items?.length) {
        p.items.forEach((i) => {
          n += i.quantity;
        });
      }
      if (p?.options?.length) {
        p.options.forEach((i) => {
          n += i.quantity;
        });
      }
    });

    // 判断是否存在size（-1）
    let isHasSize = !!currentOrderCombo.find((s) => s.id == -1);
    if (!isHasSize) {
      // 确保 singlePrice 是有效数字，避免 InvalidNum 错误
      const parsedPrice = Number.parseFloat(currentItem.price);
      const singlePrice = isNaN(parsedPrice) ? 0 : parsedPrice;
      // 确保 priceTotal 是有效数字
      const validPriceTotal = isNaN(priceTotal) ? 0 : priceTotal;
      priceTotal = Big(validPriceTotal).plus(singlePrice).toNumber().toFixed(2);
    }

    // 文案显示
    let showText = 'addToOrder';
    const minDisabled = orderDishCount <= 1;
    const maxDisabled = orderDishCount >= defaultMax;

    const stoppedStatus = getItemStoppedStatus(currentItem);
    const isSoldOut = Boolean(stoppedStatus);

    return (
      <React.Fragment>
        <div className={styles.countBtn}>
          <Fab
            className={
              minDisabled ? styles.btnDis : `${styles.btnEn} animate-btn`
            }
            aria-label="Remove"
            disabled={minDisabled}
            onClick={() => changeDishNum(orderDishCount - 1)}
          >
            <RemoveIcon className={styles.muiDiyIcon} />
          </Fab>
          <div className={styles.qty}>{orderDishCount}</div>
          <Fab
            className={
              maxDisabled ? styles.btnDis : `${styles.btnEn} animate-btn`
            }
            aria-label="Add"
            disabled={maxDisabled}
            onClick={() => changeDishNum(orderDishCount + 1)}
          >
            <AddIcon className={styles.muiDiyIcon} />
          </Fab>
        </div>

        <div
          className={[
            styles.orderView,
            isAddToCart && !isSoldOut
              ? `${styles.actived} linear-animate-btn`
              : styles.noActived,
          ].join(' ')}
          onClick={this.handleAddToCart}
        >
          <div className={styles.btn}>{t([showText])}</div>
          <div className={styles.total}>
            <span>${floatNumberRounding(priceTotal * orderDishCount)}</span>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    currentItem: state.currentItem,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    currentOrderCombo: state.currentOrderCombo,
    selfConfig: state.selfConfig,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    removeItemFromComboSection,
  })(withTranslation()(ComboFooter))
);
