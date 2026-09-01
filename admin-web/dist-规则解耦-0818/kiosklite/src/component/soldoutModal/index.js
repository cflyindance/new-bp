import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './soldoutModal.module.scss';
import Dialog from '../dialog';
import MoreTip from '../moreTip';
import Icon from '../icon';
import RequireCategoryTip from '../requireCategoryTip';
import { getDishItemLanguage } from '@/utils/busTools';
import { on, off } from '@/utils';

class SoldoutModal extends Component {
  constructor() {
    super();
    this.state = {
      isScroll: false,
      isShowMore: false,
    };
  }

  // dom元素滚动事件
  handleScroll = () => {
    if (!this.state.isScroll) {
      this.setState(
        {
          isScroll: true,
        },
        () => {
          off(this.scrollDom, 'scroll', this.handleScroll);
        },
      );
    }
  };

  // 重新点单，跳转orderPage
  handleReorder = () => {
    this.props.reorder();
  };

  // 仍然下单
  handleContinueReorder = () => {
    this.props.continueReorder();
  };

  // 返回首页
  handleBackHome = () => {
    this.props.history.push('/');
  };

  // 必选类，菜的个数
  formatterRequireCategory = (list) => {
    const { requireCategory } = this.props;
    if (requireCategory.length) {
      let obj = {};

      requireCategory.forEach((c) => {
        obj[c.id] = 0;
      });

      list.forEach((item) => {
        if (obj.hasOwnProperty(item.categoryId)) {
          obj[item.categoryId] += item.quantity;
        }
      });

      return obj;
    } else {
      return null;
    }
  };

  // 过滤相同id的菜（size、options等选择不同，菜会重复）
  filterSameIdDish = (soldoutDetailList) => {
    const soldoutArr = [];
    soldoutDetailList.forEach((detail) => {
      // 仅按“售罄项本身”去重，不区分父菜；cloudId 优先，id 兜底
      const currentIdentity = detail?.cloudId ?? detail?.id;
      const compareKey = `${detail?.soldoutType || 'item'}_${currentIdentity}`;
      const isSame = soldoutArr.find((item) => {
        const itemIdentity = item?.cloudId ?? item?.id;
        const itemCompareKey = `${item?.soldoutType || 'item'}_${itemIdentity}`;
        return itemCompareKey === compareKey;
      });
      if (!isSame) {
        soldoutArr.push(detail);
      }
    });
    return soldoutArr;
  };

  getDisplayItemName = (item, language) => {
    if (!item) {
      return '';
    }
    return (
      getDishItemLanguage(item.fieldDisplayNameGroups, language) || item.name || ''
    );
  };

  componentDidMount() {
    if (this.scrollDom) {
      this.setState({
        isShowMore: !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight),
      });
      on(this.scrollDom, 'scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    off(this.scrollDom, 'scroll', this.handleScroll);
  }

  render() {
    const {
      t,
      i18n: { language },
      isHasSoldoutDish,
      dishMap: { saleList, slodoutList, soldoutDetailList = [] },
      requireCategory,
      inOrderPage,
    } = this.props;

    let requireBool = false;
    let title = '';
    let isCartAllSold = false;

    // 购物车菜全部售罄
    const filteredSoldoutDetailList = this.filterSameIdDish(
      soldoutDetailList.length ? soldoutDetailList : slodoutList
    );

    if (!saleList.length) {
      isCartAllSold = true;
      title = 'sold-out-title-cart';
    } else {
      isCartAllSold = false;
      title = 'sold-out-title-list';
    }

    if (requireCategory.length) {
      let m = this.formatterRequireCategory(saleList);
      let arr = [];
      for (let key in m) {
        arr.push(m[key]);
      }
      requireBool = !arr.every((n) => n > 0);
    }

    const soldoutMsg = (
      <div className={styles.soldoutBox}>
        <div className={styles.soldoutIcon}>
          <Icon type="svg_warn" size={8} />
        </div>
        <div className={styles.title}>{t([title])}</div>
        <div className={styles.soldoutContent} ref={(el) => (this.scrollDom = el)}>
          {filteredSoldoutDetailList.map((detail, idx) => {
            const itemName = this.getDisplayItemName(detail, language);
            return (
              <div
                className={styles.name}
                key={detail.soldoutDisplayKey || `${detail.id}_${idx}`}
              >
                {idx + 1}、{itemName}
              </div>
            );
          })}

          {/* {!this.state.isScroll && this.state.isShowMore && <MoreTip />} */}
        </div>

        {inOrderPage ? 
          <div className={styles.soldoutBtn}>
            <div className={`${styles.continue} linear-animate-btn`} onClick={this.handleContinueReorder}>
              {t('continue-order-in-order-page')}
            </div>
          </div>:
        ((isCartAllSold || (requireCategory.length && requireBool)) ? (
          <div className={styles.soldoutBtn}>
            <div className={styles.reorder} onClick={this.handleBackHome}>
              {t('cancel_order')}
            </div>

            <div className={`${styles.continue} linear-animate-btn`} onClick={this.handleReorder}>
              {t('reorder')}
            </div>
          </div>
        ) : (
          <div className={styles.soldoutBtn}>
            <div className={styles.reorder} onClick={this.handleReorder}>
              {t('reorder')}
            </div>

            <div className={`${styles.continue} linear-animate-btn`} onClick={this.handleContinueReorder}>
              {t('continue-order')}
            </div>
          </div>
        ))}

        {/* 必选类的提示 */}
        {requireCategory.length && requireBool && !inOrderPage ? <RequireCategoryTip /> : null}

        {(inOrderPage || isCartAllSold) ? null : requireCategory.length && requireBool ? null : (
          <div className={styles.soldoutTip}>{t('sold-out-tip')}</div>
        )}
      </div>
    );

    return <Dialog visible={isHasSoldoutDish} html={soldoutMsg} />;
  }
}

function mapStateToProps(state) {
  return {
    requireCategory: state.requireCategory,
  };
}

export default withRouter(connect(mapStateToProps)(withTranslation()(SoldoutModal)));
