import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { getDeviceOrientation } from '@/utils';
import LOGINSTAR from '@/assets/images/login_star.png';
import LOGINGIFT from '@/assets/images/login_gift.png';
import LOGINDISCOUNT from '@/assets/images/login_discount.png';
import styles from './loginGuideDialog.module.scss';
import { Trans, withTranslation } from 'react-i18next';
import coinSmile from '@/assets/lottie/coin_smile.json';
import LottiePlayer from '@/component/LottiePlayer';
import { CloseOutlined } from '@ant-design/icons';
import IMG_HOST from '@/utils/getImageHost';

const LoginGuideDialog = (props) => {
  const { t, handleConfirm, onClose, selfConfig } = props;
  const dialogBgInfo =
    selfConfig?.configList?.find((item) => item.id === 45)?.value?.dialog || {};
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
  const showDefaultDialog = useMemo(() => {
    return !dialogBgInfo[`${orientation}Img`];
  }, [dialogBgInfo, orientation]);

  return (
    <div
      className={`${styles.containerBox} ${showDefaultDialog ? '' : styles.picContainerBox}`}
    >
      <CloseOutlined className={styles.closeIcon} onClick={onClose} />
      {showDefaultDialog && (
        <div className={styles.swipeImageBx}>
          <LottiePlayer animationData={coinSmile} />
        </div>
      )}
      {showDefaultDialog ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
        >
          <div className={styles.notMember}>{t('login-guide-not-member')}</div>
          <div className={styles.joinNow}>
            <Trans
              t={t}
              i18nKey="login-guide-register"
              components={[<div className={styles.registerBr}></div>]}
            />
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
          <div className={styles.joinBtn}>{t('login-guide-join-for-free')}</div>
        </div>
      ) : (
        <img
          src={`${IMG_HOST}/${dialogBgInfo[`${orientation}Img`] || ''}`}
          alt="dialogBg"
          className={styles.dialogBgImg}
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
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

export default connect(mapStateToProps)(withTranslation()(LoginGuideDialog));
