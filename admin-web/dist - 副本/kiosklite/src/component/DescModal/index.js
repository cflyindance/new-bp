import React, { useState, useRef, useEffect } from 'react';
import Dialog from '@/component/dialog';
import styles from './index.module.scss';
import { useTranslation } from 'react-i18next';
import { isOpenVtkeyboadrd } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import classNames from 'classnames';
import { removeEmoji } from '@/utils/sanitizeInput';

const DescModal = (props) => {
  const { visible, title, onClose, preVal, onSetVal, isMountOnBody } = props;
  const [val, setVal] = useState('');
  const [keyboardToggle, setKeyboardToggle] = useState(false);
  const inputRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    setVal(preVal || '');
  }, [preVal]);

  const keyboardChange = (event, isVKboard = false) => {
    let value = isVKboard ? event : removeEmoji(event.target.value);
    if (!isVKboard) {
      event.target.value = value;
    }
    if (value.length > 255) {
      value = value.substr(0, 255);
    }
    setVal(value);
  };

  const showKeyboard = () => {
    setKeyboardToggle(true);
  };

  const hideKeyboard = () => {
    setKeyboardToggle(false);
  };

  const handleCancelVal = () => {
    setVal('');
    onClose();
    hideKeyboard();
  };

  const handleConfirmVal = () => {
    onSetVal(val);
    handleCancelVal();
  };

  return (
    <>
      <Dialog
        isMountOnBody={isMountOnBody}
        visible={visible}
        html={
          <div
            className={styles.descContentWrapper}
            style={{ top: '30%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.titleText}>{title}</div>
            <div className={styles.textArea}>
              <textarea
                autoFocus
                ref={inputRef}
                maxLength={255}
                placeholder={t('noteDishPlaceholder')}
                value={val}
                className={styles.textContent}
                onChange={keyboardChange}
                onClick={() => {
                  if (isOpenVtkeyboadrd()) {
                    showKeyboard();
                  }
                }}
                onFocus={(e) => {
                  // 自动聚焦到文本末尾
                  const textLen = e.target?.value?.length;
                  if (textLen) {
                    e.currentTarget.setSelectionRange(textLen, textLen);
                  }
                }}
              />
              <span className={styles.textLength}>{val.length}/255</span>
            </div>

            <footer className={styles.footerBtn}>
              <div
                onClick={handleCancelVal}
                className={classNames(styles.btn, styles.btnNormal)}
              >
                {t('cancel')}
              </div>
              <div
                onClick={handleConfirmVal}
                className={classNames(
                  styles.btn,
                  styles.btnActive,
                  'linear-animate-btn'
                )}
              >
                {t('confirm')}
              </div>
            </footer>
          </div>
        }
        onClose={handleCancelVal}
      />
      {keyboardToggle ? (
        <VtKeyboard
          keyboardValue={val}
          changeInput={(v) => keyboardChange(v, true)}
          closeKeyboard={() => hideKeyboard()}
          VKOuterStyle={{ zIndex: 9999 }}
        />
      ) : null}
    </>
  );
};

export default DescModal;
