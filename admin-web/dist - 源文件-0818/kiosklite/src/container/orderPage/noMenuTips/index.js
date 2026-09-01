import React, { useMemo, useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './noMenuTips.module.scss';
import { connect } from 'react-redux';
import { getCookie } from '@/utils';

const NoMenuTips = (props) => {
  const { t, handleBackHome, time } = props;

  return (
    <div className={styles.containerBox}>
      <div className={styles.noMenuTitle}>{t('no-menu')}</div>
      <div className={styles.noMenuCheck}>{t('no-menu-check')}</div>
      <ul className={styles.noMenuReason}>
        <li className={styles.reasonTitle}>{t('menu-time-zone')}</li>
        <li className={styles.reasonTitle}>
          {t('menu-license', {
            licenseName: getCookie('kioskLicense'),
          })}
        </li>
        <li className={styles.reasonTitle}>{t('menu-business-time')}</li>
        <li className={styles.reasonTitle}>{t('menu-set')}</li>
        <li className={styles.reasonTitle}>{t('menu-hidden')}</li>
      </ul>
      <div className={styles.backHome} onClick={handleBackHome}>
        {`${t('go-back-home')}(${time}s)`}
      </div>
    </div>
  );
};

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, {})(withTranslation()(NoMenuTips));
