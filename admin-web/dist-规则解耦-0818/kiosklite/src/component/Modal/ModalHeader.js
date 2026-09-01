import React from 'react';
import styles from './modalHeader.module.scss';
import homeBGI from '@/assets/images/home-new.png';

const ModalHeader = (props) => {
  const { handleGoBack } = props;

  return (
    <header className={styles.brandHeader}>
      <div className={styles.homeIconWrapper} onClick={handleGoBack}>
        <img src={homeBGI} className={styles.homeIcon} />
      </div>
    </header>
  );
};

export default ModalHeader;
