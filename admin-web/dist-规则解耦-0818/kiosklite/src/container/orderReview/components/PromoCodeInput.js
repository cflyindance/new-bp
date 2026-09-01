import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styles from './PromoCodeInput.module.scss';
import Dialog from '@/component/dialog';
import { useTranslation } from 'react-i18next';
import { isOpenVtkeyboadrd } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';

const PromoCodeInput = (props) => {
  const { isShowModal, handleContinue, handleCancel } = props;

  const [promoCode, setPromoCode] = useState('');
  const [keyboardToggle, setKeyboardToggle] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (isShowModal) {
      setPromoCode('');
    }
  }, [isShowModal]);

  const changeLocator = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    if (value?.length > 15) return;
    setPromoCode(value);
  };

  const showKeyboard = () => {
    setKeyboardToggle(true);
  };

  const hideKeyboard = () => {
    setKeyboardToggle(false);
  };

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      handleContinue(promoCode);
    }
  };


  return (
    <>
      <Dialog
        visible={isShowModal}
        html={
          <div
            className={styles.containerBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.itemBox}>
              <div className={styles.itemName}>{t('enterPromoCode')}</div>
              <div className={styles.subItemName}>{t('promoCodeSubtitle')}</div>
            </div>
            <input
              name="promoCode"
              placeholder={t('enterPromoCode')}
              value={promoCode}
              className={styles.inputBox}
              type="text"
              onChange={changeLocator}
              onKeyUp={handleKeyUp}
              onClick={() => {
                if (isOpenVtkeyboadrd()) {
                  showKeyboard();
                }
              }}
            />
            <div className={styles.btnBox}>
              <div
                className={styles.cancel}
                onClick={() => {
                  handleCancel();
                  hideKeyboard();
                }}
              >
                {t('cancel')}
              </div>
              <div
                onClick={() => {
                  handleContinue(promoCode);
                  hideKeyboard();
                }}
                className={promoCode ? `${styles.apply} animate-btn` : styles.disabled}
              >
                {t('apply')}
              </div>
            </div>
          </div>
        }
        onClose={() => {
          handleCancel();
          hideKeyboard();
        }}
      />

      {keyboardToggle ? (
        <VtKeyboard
          keyboardValue={promoCode}
          handlePressEnter={() => {
            handleContinue(promoCode);
            hideKeyboard();
          }}
          changeInput={(v) => changeLocator(v, true)}
          closeKeyboard={() => hideKeyboard()}
          VKOuterStyle={{ zIndex: 9999 }}
        />
      ) : null}
    </>
  );
};

function mapStateToProps(state) {
  return {};
}

export default withRouter(connect(mapStateToProps)(PromoCodeInput));
