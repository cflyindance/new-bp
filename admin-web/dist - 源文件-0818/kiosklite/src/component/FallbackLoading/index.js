import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import RotateLoading from '@/component/rotateLoading';

const FallbackLoading = (props) => {
  const [show, setShow] = useState(false);
  const { visible, delay = 300 } = props;
  const isControlled = visible !== undefined;

  useEffect(() => {
    if (isControlled) {
      if (!visible) {
        setShow(false);
        return undefined;
      }
      const timer = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [isControlled, visible, delay]);

  if (!show) {
    return null;
  }

  return (
    <div className={styles.loadingWrapper}>
      <RotateLoading />
    </div>
  );
};

export default FallbackLoading;
