import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { getDeviceOrientation } from '@/utils';
import LOGINSTAR from '@/assets/images/login_star.png';
import LOGINGIFT from '@/assets/images/login_gift.png';
import LOGINDISCOUNT from '@/assets/images/login_discount.png';
import styles from './LoginBanner.module.scss';
import { Trans, withTranslation } from 'react-i18next';
import IMG_HOST from '@/utils/getImageHost';

const LoginBanner = (props) => {
  const { t, handleConfirm, selfConfig } = props;
  const bannerBgInfo =
    selfConfig?.configList?.find((item) => item.id === 45)?.value?.banner || {};
  const [orientation, setOrientation] = useState(getDeviceOrientation());

  useEffect(() => {
    const handleResize = () => {
      setOrientation(getDeviceOrientation());
    };
    const handleOrientationChange = () => {
      setOrientation(getDeviceOrientation());
    };
    // 监听 resize 和 orientationchange 事件
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  //   如果后台没传引导图 用默认样式
  const showDefaultBanner = useMemo(() => {
    return !bannerBgInfo[`${orientation}Img`];
  }, [bannerBgInfo, orientation]);

  return (
    <div
      className={`${styles.containerBox} ${showDefaultBanner ? '' : styles.picContainerBox}`}
    >
      {showDefaultBanner ? (
        <div className={styles.defaultBox} onClick={handleConfirm}>
          <div className={styles.bannerText}>
            <div className={styles.title}>
              <div>
                <div className={styles.notMember}>
                  {t('login-guide-not-member')}
                </div>
                <div className={styles.joinNow}>
                  <Trans
                    t={t}
                    i18nKey="login-guide-register"
                    components={[<span></span>]}
                  />
                </div>
              </div>
              {orientation === 'vertical' && (
                <div className={styles.joinBtn}>
                  {t('login-guide-join-for-free')}
                </div>
              )}
            </div>
            <div className={styles.benefitsList}>
              <div className={styles.benefits}>
                <img src={LOGINSTAR} alt="star" />
                <span>{t('login-guide-earn-points')}</span>
              </div>
              <div className={`${styles.benefits} ${styles.benefitsGift}`}>
                <img src={LOGINGIFT} alt="gift" />
                <span>{t('login-guide-claim-free-items')}</span>
              </div>
              <div className={styles.benefits}>
                <img src={LOGINDISCOUNT} alt="discount" />
                <span>{t('login-guide-exclusive-member-discounts')}</span>
              </div>
            </div>
          </div>
          {orientation === 'horizontal' && (
            <div className={styles.joinBtn}>
              {t('login-guide-join-for-free')}
            </div>
          )}
        </div>
      ) : (
        <img
          src={`${IMG_HOST}/${bannerBgInfo[`${orientation}Img`] || ''}`}
          alt="bannerBg"
          className={styles.bannerBgImg}
          onClick={handleConfirm}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    selfConfig: state.selfConfig,
  };
};

export default connect(mapStateToProps)(withTranslation()(LoginBanner));
