import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';
import styles from './index.module.scss';
import classNames from 'classnames';
import RewardList from './RewardList';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import POINTS from '@/assets/images/points.png';
import remToPx from '@/utils/CountRemToPx';
import useReward from '@/hooks/useReward';
import useDeviceOrientation from '@/hooks/useDeviceOrientation';
import { formatPhoneNumber } from '@/utils';
import { setTempCampaign } from '@/actions/crm_action';
import { usePrevious } from 'ahooks';
import isEqual from 'lodash/isEqual';

const RewardCenter = (props) => {
  const orientation = useDeviceOrientation();
  const isVertical = orientation === 'vertical';
  const containerWidth = isVertical ? 79.4 : 118;
  const colNum = isVertical ? 1 : 2;
  const {
    // props
    isInRewardPage,
    height,
    // redux
    crm: { memberCRMInfo, selectedFreeItem, selectedDiscount, rewardRule },
    avocado: { rewards, vouchers, metaData, outletInfo },
    menuGroup,
    comboMenu,
    allSysConfig,
    onSelectItem,
    onRemoveItem,
    setTempCampaign,
    currentOrder,
    selfConfig,
  } = props;
  const [rewardType, setRewardType] = useState('point');
  const { t } = useTranslation();
  const [selectedPts, setSelectedPts] = useState('All');
  const [fixedVirtualListData, setFixedVirtualListData] = useState([]);

  const isCRMIntegration = useMemo(() => {
    return outletInfo?.enabled === 1;
  }, [outletInfo]);

  const isMemberLogin = useMemo(() => {
    return isCRMIntegration ? memberCRMInfo.id : memberCRMInfo._id;
  }, [memberCRMInfo, isCRMIntegration]);

  useEffect(() => {
    // crm集成有voucher, crm自研只有积分
    if (isMemberLogin && isCRMIntegration) {
      setRewardType('all');
      return;
    }
    setRewardType('point');
  }, [isMemberLogin, isCRMIntegration]);

  useEffect(() => {
    const selectedCampaign = selectedFreeItem?.[0]
      ? selectedFreeItem?.[0]
      : Object.keys(selectedDiscount)?.length > 0
        ? selectedDiscount
        : null;
    if (selectedCampaign) {
      setTempCampaign([selectedCampaign]);
    }
  }, [selectedFreeItem, selectedDiscount]);

  const { rewardList, voucherList } = useReward({
    rewards,
    vouchers,
    allSysConfig,
    menuGroup,
    comboMenu,
    metaData,
    rewardRule,
    currentOrder,
  });

  const pointList = useMemo(() => {
    if (rewardList?.length) {
      const pointArr = rewardList.reduce((pre, cur) => {
        const currentItemPoints =
          cur?.rewardRule?.redeemRule?.parameters?.points;
        if (!pre?.length) {
          return pre.concat(currentItemPoints);
        }
        const isExist = pre.some((e) => e === currentItemPoints);
        return isExist ? pre : pre.concat(currentItemPoints);
      }, []);
      return ['All', ...pointArr?.sort((a, b) => a - b)];
    }
  }, [rewardList]);

  const renderList = useMemo(() => {
    const isRewardArray = Array.isArray(rewardList);
    const isVoucherArray = Array.isArray(voucherList);

    // 两个都不是数组时返回空数组
    if (!isRewardArray && !isVoucherArray) return [];
    const rewards = isRewardArray ? rewardList : [];
    const vouchers = isVoucherArray ? voucherList : [];

    let actualRewardType =
      rewardType === 'all' && !vouchers?.length ? 'point' : rewardType;
    if (actualRewardType === 'all') {
      return [...rewards, ...vouchers];
    }
    if (actualRewardType === 'voucher') return vouchers;
    return selectedPts === 'All'
      ? rewards
      : rewards.filter(
          (each) =>
            each.rewardRule?.redeemRule?.parameters?.points === selectedPts
        );
  }, [rewardList, voucherList, rewardType, selectedPts]);

  const isShowFilter = useMemo(() => {
    return rewardList?.length > 0 && voucherList?.length > 0;
  }, [rewardList, voucherList]);

  const isDisplayPointList = useMemo(() => {
    if (rewardType === 'all') {
      return voucherList?.length <= 0;
    }
    return rewardType === 'point';
  }, [rewardType, voucherList]);

  const dataList = useMemo(() => {
    if (!renderList?.length) return [];
    if (colNum === 1) return renderList;
    const res = [];
    for (let i = 0; i < renderList?.length; i += 2) {
      res.push(renderList.slice(i, i + colNum));
    }
    return res;
  }, [colNum, renderList]);
  const preList = usePrevious(dataList);

  useEffect(() => {
    if (dataList?.length > 0 && !isEqual(dataList, preList)) {
      setFixedVirtualListData(dataList);
    }
  }, [dataList, preList]);

  const vListHeight = useMemo(() => {
    return isDisplayPointList ? height - remToPx(20) : height - remToPx(10);
  }, [height, isDisplayPointList]);

  // 手机号格式化脱敏
  const maskPhone = useCallback((phoneStr, maskCount = 6, maskChar = '•') => {
    const formatted = formatPhoneNumber(phoneStr || '');
    let result = '';
    let count = 0;
    for (const ch of formatted) {
      if (/\d/.test(ch) && count < maskCount) {
        result += maskChar;
        count++;
      } else {
        result += ch;
      }
    }
    return result;
  }, []);

  const phone = maskPhone(memberCRMInfo.phone);

  // 展示积分信息
  const showOwnPoints = useMemo(() => {
    return selfConfig?.configMap?.id_48;
  }, [selfConfig]);

  return (
    <div
      className={styles.reward_wrapper}
      style={{ width: `${containerWidth}rem` }}
    >
      <div
        className={styles.title}
        style={isInRewardPage ? { fontSize: '4rem' } : {}}
      >
        {t('reward_center')}
      </div>
      {isShowFilter && (
        <div className={styles.reward_filter}>
          {['all', 'point', 'voucher'].map((each) => {
            return (
              <div
                onClick={() => setRewardType(each)}
                key={each}
                className={classNames(
                  styles.filter_item,
                  rewardType === each && styles.selectedType
                )}
              >
                {t(`reward_${each}`)}
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{ display: isMemberLogin ? 'flex' : 'none' }}
        className={`${styles.memberInfo} ${!showOwnPoints ? styles.memberInfoPhone : ''}`}
      >
        <div className={styles.phone}>{phone}</div>
        {showOwnPoints && (
          <div className={styles.assets}>
            <span>{t('login-guide-banner-member-points')}</span>
            <img className={styles.pointsImg} src={POINTS} alt="points" />
            <span className={styles.pts}>
              {memberCRMInfo.pointBalance}
              {t('pts')}
            </span>
          </div>
        )}
      </div>

      {isDisplayPointList && (
        <div className={styles.pointList}>
          {pointList?.map((each) => {
            return (
              <div
                className={classNames(
                  styles.pointItem,
                  selectedPts === each && styles.select
                )}
                key={each}
                onClick={() => setSelectedPts(each)}
              >
                {each} {each !== 'All' && 'pts.'}
              </div>
            );
          })}
        </div>
      )}
      <RewardList
        colNum={colNum}
        containerWidth={containerWidth}
        isInRewardPage={isInRewardPage}
        vListHeight={vListHeight}
        fixedVirtualListData={fixedVirtualListData}
        onSelectItem={onSelectItem}
        onRemoveItem={onRemoveItem}
      />
    </div>
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    menuGroup: state.menuGroup,
    comboMenu: state.comboMenu,
    avocado: state.avocado,
    allSysConfig: state.allSysConfig,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
  };
}

export default withRouter(
  connect(mapStateToProps, { setTempCampaign })(withTranslation()(RewardCenter))
);
