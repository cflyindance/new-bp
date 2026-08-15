import React, { useMemo } from 'react';
import styles from './noActivityTag.module.scss';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

const NoActivityTag = (props) => {
  const { t, itemId, promotion, sideItemInfo = false } = props;
  // 是否在第X件Y折活动中
  const isInSecondDiscount = useMemo(() => {
    return promotion.buyDiscountRule?.find((info) => info.activityRule.buyDishes.includes(itemId));
  }, [promotion, itemId]);

  const visible = useMemo(() => {
    if (!isInSecondDiscount) return false;
    return !isInSecondDiscount.activityRule.buyDishes.includes(
      `${itemId}${sideItemInfo.sideNameMap?.id}`,
    );
  }, [isInSecondDiscount, sideItemInfo, itemId]);

  return <>{visible && <span className={styles.tag}>{t('not_join_activity')}</span>}</>;
};

function mapStateToProps(state) {
  return {
    promotion: state.promotion,
  };
}

export default connect(mapStateToProps)(withTranslation()(NoActivityTag));
