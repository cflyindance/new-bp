import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './loadingText.module.scss';
import Dialog from '../dialog';
import MenusifuLoading from '../menusifuLoading';

const loadTextObj = {
  1: 'try-reconnect-network',
  2: 'completing_order',
  3: 'update-menu-load',
};
const DELAY = 600;

const LoadingText = (props) => {
  const { t } = useTranslation();
  const { visible, textKey } = props;
  const itemName = t(loadTextObj[textKey]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    if (visible) {
      // visible 为 true，启动定时器，600ms后显示
      timer = setTimeout(() => {
        setShow(true);
      }, DELAY);
    } else {
      // visible 为 false，取消定时器，立即隐藏
      clearTimeout(timer);
      setShow(false);
    }
    // 清理函数，组件卸载或 visible 变化时调用
    return () => clearTimeout(timer);
  }, [visible]);

  if (!show) {
    return null;
  }

  return (
    <Dialog
      visible={show}
      html={
        <div className={styles.loadingBox}>
          <MenusifuLoading />
          <div className={styles.itemBox}>
            <div className={styles.itemName}>{itemName}</div>
            <div className={styles.subItemName}>{t('wait')}</div>
          </div>
        </div>
      }
    />
  );
};

export default LoadingText;
