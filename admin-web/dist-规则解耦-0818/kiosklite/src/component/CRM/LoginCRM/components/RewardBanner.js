import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { connect } from 'react-redux';
import styles from './RewardBanner.module.scss';
import { Trans, withTranslation } from 'react-i18next';
import { formatPhoneNumber } from '@/utils';
import LogoutCRM from '@/component/CRM/LoginCRM/components/LogoutCRM';
import RewardItem from '@/component/RewardCenter/RewardItem';
import { changeRewardModalVisible } from '@/actions/avocado';
import { changeFreeItem, changeSelectedDiscount } from '@/actions/crm_action';
import useDeviceOrientation from '@/hooks/useDeviceOrientation';
import STAR from '@/assets/images/star.png';
import { removeFreeItemInOrder } from '@/actions';

const RewardBanner = (props) => {
  const orientation = useDeviceOrientation();
  const isVertical = orientation === 'vertical';
  const {
    t,
    handleConfirm,
    changeRewardModalVisible,
    changeFreeItem,
    changeSelectedDiscount,
    assertList,
    crm: { memberCRMInfo },
    removeFreeItemInOrder,
    selfConfig,
  } = props;
  const assertListBoxRef = useRef(null);
  const [isManyAsserts, setIsManyAsserts] = useState(false);
  const isLogin = useMemo(() => {
    return Object.keys(memberCRMInfo)?.length > 0;
  }, [memberCRMInfo]);

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

  // 资产多到产生滚动条，用来做see all的区别展示
  useEffect(() => {
    if (assertListBoxRef.current) {
      const { scrollWidth, clientWidth } = assertListBoxRef.current;
      setIsManyAsserts(scrollWidth > clientWidth);
    }
  }, [assertList]);

  const checkAllRewards = useCallback(() => {
    if (isLogin) {
      // reward center
      changeRewardModalVisible(true);
    } else {
      // 登录
      handleConfirm();
    }
  }, [isLogin]);

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

  const firstTenAssert = useMemo(() => {
    return assertList?.filter((_, i) => i <= 4);
  }, [assertList]);

  const showOwnPoints = useMemo(() => {
    return selfConfig?.configMap?.id_48;
  }, [selfConfig]);

  return (
    <div
      className={`${styles.containerBox} ${isLogin ? styles.hasLoginContainerBox : ''} ${isLogin && !assertList.length ? styles.hasLoginNoAssertBox : ''}`}
    >
      {!isLogin && (
        <div className={styles.loginBox}>
          <div className={styles.notMember}>{t('login-guide-not-member')}</div>
          <div className={styles.joinNow}>
            <Trans
              t={t}
              i18nKey="login-guide-register"
              components={[<span></span>]}
            />
          </div>
          <div className={styles.joinBtn} onClick={handleConfirm}>
            {t('login')}
          </div>
        </div>
      )}
      {isLogin && (
        <div className={`${styles.hasLoginBox}`}>
          <div className={styles.memberTitle}>
            <span>{t('login-guide-banner-member-rewards')}</span>
            <LogoutCRM />
          </div>
          <div className={styles.memberInfo}>
            <div className={styles.phone}>{phone}</div>
            {showOwnPoints && (
              <div className={styles.points}>
                <span>{t('login-guide-banner-member-points')}</span>
                <img src={STAR} alt="points"></img>
                <span className={styles.pointsValue}>
                  {memberCRMInfo.pointBalance || 0} {t('pts')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {firstTenAssert.length > 0 && (
        <div
          className={`${styles.assertList} ${isLogin && styles.hasLogin}`}
          ref={assertListBoxRef}
        >
          {firstTenAssert.map((each) => {
            return (
              <div key={each.id} className={styles.assertItem}>
                <RewardItem
                  isNeedAutoUpdate
                  data={each}
                  disabled={!isLogin}
                  isLong={!isVertical}
                  onSelectItem={onSelectItem}
                  onRemoveItem={onRemoveItem}
                />
              </div>
            );
          })}
          <div
            className={`${styles.seeAll} ${isManyAsserts ? styles.seeAllSmall : ''}`}
            onClick={checkAllRewards}
          >
            {t('see_all')}
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    crm: state.crm,
    selfConfig: state.selfConfig,
  };
};

export default connect(mapStateToProps, {
  changeRewardModalVisible,
  changeFreeItem,
  changeSelectedDiscount,
  removeFreeItemInOrder,
})(withTranslation()(RewardBanner));
