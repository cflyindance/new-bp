import React, { useState, useEffect, useCallback, useRef } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './numPad.module.scss';
import NUMDELETE from '@/assets/images/numDelete.png';

const NumPad = (props) => {
  const {
    keys,
    propValue,
    maxLength = 10,
    mode = 'concat', // 'concat' 拼接模式, 'direct' 直接返回模式
    keyPress,
    showDelete = true,
    selectedKey,
  } = props;
  const [inputValue, setInputValue] = useState(propValue || '');
  const isFirstRender = useRef(true);

  // 监听props.value的变化，同步到本地状态
  useEffect(() => {
    if (propValue !== undefined) {
      setInputValue(propValue);
    }
  }, [propValue]);

  // 数字按钮点击处理
  const buttonClickHandler = (key) => {
    if (mode === 'direct') {
      // 直接返回模式：直接调用keyPress传递按键值
      keyPress(key);
      return;
    }

    // 拼接模式：更新状态
    setInputValue((prevValue) => {
      const newValue = prevValue + key;
      // 如果超过maxLength个字符，不更新状态
      if (newValue.length > maxLength) {
        return prevValue;
      }
      return newValue;
    });
  };

  // 删除按钮处理
  const deleteButtonhandler = () => {
    if (mode === 'direct') {
      // 直接返回模式：传递删除标识
      keyPress('delete');
      return;
    }

    // 拼接模式：更新状态
    setInputValue((prevValue) => {
      if (prevValue.length > 0) {
        return prevValue.slice(0, -1);
      }
      return prevValue;
    });
  };

  useEffect(() => {
    // 只在拼接模式下监听value变化
    if (mode === 'concat') {
      // 首次渲染时不触发keyPress，避免初始化时清空customNumber
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      keyPress(inputValue);
    }
  }, [inputValue, mode]);

  return (
    <div>
      <div className={styles.keysWrapper}>
        {keys.map((key) => (
          <div
            key={key}
            className={[
              styles.btnWrapper,
              key === 0 || key === '0' ? styles.zeroBtn : '',
              selectedKey != null && String(selectedKey) === String(key)
                ? styles.btnSelected
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => buttonClickHandler(key)}
          >
            <div className={styles.btnNum}>{key}</div>
          </div>
        ))}
        {showDelete ? (
          <div
            className={`${styles.btnWrapper} ${styles.delBtn}`}
            onClick={deleteButtonhandler}
          >
            <img src={NUMDELETE} className={styles.times} alt="" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default withTranslation()(NumPad);
