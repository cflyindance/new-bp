import React, { useState, useMemo } from 'react';
import styles from './InputPassword.module.scss';
import Dialog from '@/component/dialog';
import { withTranslation } from 'react-i18next';
import { CloseOutlined } from '@ant-design/icons';
import { isOpenVtkeyboadrd } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';

const InputPassword = (props) => {
  const { visible, onCancel, onConfirm, warmingTxt, title, t } = props;
  const [password, setPassword] = useState('');
  const [keyboardToggle, setKeyboardToggle] = useState(false);

  const showKeyboard = () => {
    setKeyboardToggle(true);
  };

  const hideKeyboard = () => {
    setKeyboardToggle(false);
  };

  const submitPassword = () => {
    hideKeyboard();
    onConfirm(password);
  };

  const handleKeyUp = async (e) => {
    if (e.keyCode === 13) {
      submitPassword();
    }
  };

  const handlePasswordChange = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    setPassword(value);
  };

  return (
    <>
      <Dialog
        visible={visible}
        html={
          <div
            className={styles.passwordBox}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseOutlined className={styles.closeIcon} onClick={onCancel} />
            <div className={styles.title}>{title || 'PASSWORD INPUT'}</div>
            <div className={styles.subTitle}>
              {t('password-input-tips-title-sub')}
            </div>
            <input
              value={password}
              className={styles.passwordInput}
              placeholder={t('password')}
              type="password"
              onChange={handlePasswordChange}
              onKeyUp={handleKeyUp}
              onClick={() => {
                if (isOpenVtkeyboadrd()) {
                  showKeyboard();
                }
              }}
            />
            <p className={styles.noPasswordTxt}>{t('no-password-txt')}</p>
            <div className={styles.warmingTxt}>{warmingTxt || ''}</div>
            <div
              className={`${styles.confirm} linear-animate-btn`}
              onClick={submitPassword}
            >
              {t('confirm')}
            </div>
          </div>
        }
        onClose={onCancel}
      />

      {keyboardToggle ? (
        <VtKeyboard
          keyboardValue={password}
          handlePressEnter={submitPassword}
          changeInput={(v) => handlePasswordChange(v, true)}
          closeKeyboard={() => hideKeyboard()}
          VKOuterStyle={{ zIndex: 9999 }}
        />
      ) : null}
    </>
  );
};

export default withTranslation()(InputPassword);
