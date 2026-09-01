import React, { useCallback, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import styles from './AdReward.module.scss';
import {
  changeFreeItem,
  changeIgnoreReward,
  changeLoginType,
  changeSelectedDiscount,
} from '@/actions/crm_action';
import RewardCenter from '@/component/RewardCenter';
import {
  getCurrentCategory,
  getCurrentItem,
  removeFreeItemInOrder,
} from '@/actions';
import useReward from '@/hooks/useReward';
import remToPx from '@/utils/CountRemToPx';

const AdReward = (props) => {
  const {
    avocado,
    menuGroup,
    comboMenu,
    crm,
    adInitFinished,
    allSysConfig,
    changeSelectedDiscount,
    changeFreeItem,
    currentOrder,
    removeFreeItemInOrder,
  } = props;
  const { rewards, vouchers, metaData } = avocado;

  const { rewardList, voucherList } = useReward({
    rewards,
    vouchers,
    allSysConfig,
    menuGroup,
    comboMenu,
    metaData,
    currentOrder,
  });

  const pointBalance = useMemo(() => {
    return crm?.memberCRMInfo?.pointBalance;
  }, [crm.memberCRMInfo]);

  // 是否有ad活动，若无活动通知父组件跳过当前reward页；
  useEffect(() => {
    if (
      Array.isArray(rewardList) &&
      Array.isArray(voucherList) &&
      typeof pointBalance === 'number'
    ) {
      const isShowCampaign =
        voucherList.length > 0 || (pointBalance > 0 && rewardList.length > 0);
      adInitFinished(isShowCampaign);
    }
  }, [rewardList, voucherList, pointBalance]);

  const onSelectItem = useCallback(({ rule }) => {
    if (rule.isFreeItem) {
      changeFreeItem([rule]);
    } else {
      changeSelectedDiscount(rule);
    }
  }, []);

  const onRemoveItem = useCallback((rule) => {
    changeFreeItem([]);
    changeSelectedDiscount({});
    const removeRule = rule?.rule?.[0];
    if (removeRule?.isFreeItem) {
      removeFreeItemInOrder({
        freeItemId: removeRule.id,
      });
    }
  }, []);

  return (
    <div className={styles.innerWrapper}>
      <RewardCenter
        isInRewardPage={true}
        height={window.innerHeight - remToPx(30)}
        onSelectItem={onSelectItem}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
};

function mapStateToProps(state) {
  return {
    storeTree: state,
    crm: state.crm,
    selfConfig: state.selfConfig,
    menuGroup: state.menuGroup,
    comboMenu: state.comboMenu,
    avocado: state.avocado,
    allSysConfig: state.allSysConfig,
    currentOrder: state.currentOrder,
  };
}

export default connect(mapStateToProps, {
  changeIgnoreReward,
  changeSelectedDiscount,
  changeFreeItem,
  changeLoginType,
  getCurrentItem,
  getCurrentCategory,
  removeFreeItemInOrder,
})(AdReward);
