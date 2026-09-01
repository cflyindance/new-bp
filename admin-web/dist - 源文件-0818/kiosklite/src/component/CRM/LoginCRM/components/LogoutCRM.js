import React from 'react';
import styles from './LogoutCRM.module.scss';
import { connect } from 'react-redux';
import {
  setCRMMemberInfo,
  changeFreeItem,
  changeLoginType,
  setCRMAuthCodeVerified,
  changeSelectedDiscount,
  setOnboardGiftRule,
  setTempCampaign,
} from '@/actions/crm_action';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import {
  setCommitId,
  setOrderRewardId,
  setThirdPartyCommitId,
  setCRMCustomerInfo,
  setNeedCommit,
  setCustomerVouchers,
} from '@/actions/avocado';
import { removeItemFromOrder } from '@/actions';
import { posFrontLog } from '@/api';

const LogoutCRM = (props) => {
  const {
    setCRMMemberInfo,
    t,
    changeFreeItem,
    changeSelectedDiscount,
    changeLoginType,
    setCRMAuthCodeVerified,
    setCommitId,
    setOrderRewardId,
    setThirdPartyCommitId,
    removeItemFromOrder,
    setOnboardGiftRule,
    setCRMCustomerInfo,
    setNeedCommit,
    setTempCampaign,
    setCustomerVouchers,
  } = props;

  const handleLogOut = () => {
    setCRMCustomerInfo(null);
    setCRMMemberInfo({});
    changeFreeItem([]);
    changeSelectedDiscount({});
    setTempCampaign(null);
    setNeedCommit(false);
    changeLoginType(null);
    setCRMAuthCodeVerified(false);
    setCommitId(null);
    setOrderRewardId(null);
    setThirdPartyCommitId(null);
    setOnboardGiftRule({});
    setCustomerVouchers(null);
    const freeItem = props.currentOrder?.itemList?.find((_) => _.isFreeItem);
    if (freeItem) {
      removeItemFromOrder(freeItem.id);
    }
    posFrontLog(`log out active`);
  };

  return (
    <div
      className={styles.logoutWrapper}
      onClick={(e) => {
        e.stopPropagation();
        handleLogOut();
      }}
    >
      {t('logout')}
    </div>
  );
};

export default withRouter(
  connect(
    (state) => {
      return {
        currentOrder: state.currentOrder,
      };
    },
    {
      setCRMMemberInfo,
      changeFreeItem,
      changeLoginType,
      setCRMAuthCodeVerified,
      changeSelectedDiscount,
      setCommitId,
      setOrderRewardId,
      setThirdPartyCommitId,
      removeItemFromOrder,
      setOnboardGiftRule,
      setCRMCustomerInfo,
      setNeedCommit,
      setTempCampaign,
      setCustomerVouchers,
    }
  )(withTranslation()(LogoutCRM))
);
