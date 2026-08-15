import React from 'react';
import styles from './index.module.scss';
import Icon from '../icon';

const BackIcon = (props) => {
  const { clickHandler, userStyle } = props;
  return (
    <div
      className={styles.back}
      style={userStyle}
      onClick={() => {
        clickHandler();
      }}
    >
      <Icon type="fenxiang" size="5" color={userStyle?.color || '#666'} />
    </div>
  );
};

export default BackIcon;
