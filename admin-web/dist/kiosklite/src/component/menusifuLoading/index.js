import React from 'react';
import styles from './menusifuLoading.module.scss';
import loading from '@/assets/images/loading.gif';

const menusifuLoading = () => {
  return (
    <div className={styles.menusifuLoading}>
      <img src={loading} alt="loading" />
    </div>
  );
};

export default menusifuLoading;
