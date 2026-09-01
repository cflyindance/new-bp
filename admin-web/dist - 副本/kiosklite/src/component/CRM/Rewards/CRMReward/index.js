import { connect } from 'react-redux';
import {
  changeFreeItem,
  changeIgnoreReward,
  changeLoginType,
  changeSelectedDiscount,
} from '@/actions/crm_action';
import {
  getCurrentCategory,
  getCurrentItem,
  removeFreeItemInOrder,
} from '@/actions';
import { withTranslation } from 'react-i18next';
import useReward from '@/hooks/useReward';
import styles from './CRMReward.module.scss';
import RewardCenter from '@/component/RewardCenter';
import remToPx from '@/utils/CountRemToPx';
import React, { useCallback, useEffect, useMemo } from 'react';

const CRMReward = (props) => {
  const {
    menuGroup,
    comboMenu,
    crm: { rewardRule, memberCRMInfo },
    allSysConfig,
    changeSelectedDiscount,
    changeFreeItem,
    currentOrder,
    onNextStep,
    changeIgnoreReward,
    removeFreeItemInOrder,
  } = props;

  const { rewardList } = useReward({
    rewardRule,
    allSysConfig,
    menuGroup,
    comboMenu,
    currentOrder,
  });

  const pointBalance = useMemo(() => {
    return memberCRMInfo?.pointBalance;
  }, [memberCRMInfo]);

  useEffect(() => {
    if (Array.isArray(rewardList) && typeof pointBalance === 'number') {
      const isShowCampaign = pointBalance > 0 && rewardList.length > 0;
      if (!isShowCampaign) {
        // 开启crm 但无活动, 或者没有可用的活动 -  记录无活动
        changeIgnoreReward(true);
        // 跳下一页
        onNextStep();
      }
    }
  }, [rewardList, pointBalance]);

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
    store: state,
    crm: state.crm,
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    currentOrder: state.currentOrder,
    menuGroup: state.menuGroup,
    comboMenu: state.comboMenu,
    allSysConfig: state.allSysConfig,
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
})(withTranslation()(CRMReward));
