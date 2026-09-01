import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { useCloseModalOnHomePage } from '@/hooks';
import styles from './index.module.scss';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import ComboHeader from '@/container/comboPanel/ComboHeader';
import {
  isOpenVtkeyboadrd,
  getDeviceOrientation,
  subscribeDeviceOrientation,
} from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';
import IMG_HOST from '@/utils/getImageHost';

const CallerBoard = (props) => {
  const { onClose, setLocator, isShowDesc, selfConfig } = props;
  // isShowDesc 调整为denin的两种用餐方式、togo都展示提示字样，传入数值的逻辑不变动，只先把当前页面isShowDesc控制去掉
  const [locatorVal, setLocatorVal] = useState('');
  const [keyboardToggle, setKeyboardToggle] = useState(false);
  const [orientation, setOrientation] = useState(getDeviceOrientation());
  const locatorInputRef = useRef(null);
  const keyboardManagerRef = useRef(null);
  useCloseModalOnHomePage(onClose);
  const { t } = useTranslation();

  useEffect(() => {
    if (getDeviceOrientation() !== 'vertical') {
      keyboardManagerRef.current = new LandscapeKeyboardManager(
        () => locatorInputRef.current
      );
      keyboardManagerRef.current.setup();
    }
    return () => {
      keyboardManagerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => subscribeDeviceOrientation(setOrientation), []);

  const numberPlateImageConfig = selfConfig?.configMap?.id_69 || {};
  const numberPlateImage = numberPlateImageConfig.status
    ? numberPlateImageConfig[`${orientation}Img`]
    : '';
  const showNumberPlateImage = Boolean(numberPlateImage);

  const changeLocator = (event, isVKboard = false) => {
    let value = isVKboard ? event : event.target.value;
    if (!/^\d*$/.test(value)) return;
    if (value?.length > 2) return;
    setLocatorVal(value);
  };

  const showKeyboard = () => {
    setKeyboardToggle(true);
  };

  const hideKeyboard = () => {
    setKeyboardToggle(false);
  };

  const handleConfirm = () => {
    if (!locatorVal) return;
    setLocator(locatorVal);
    onClose?.(locatorVal);
  };

  const handleKeyUp = (e) => {
    if (e.keyCode === 13) {
      handleConfirm();
    }
  };

  return (
    <div className={styles.callerWrapper}>
      <ComboHeader
        handleGoBack={() => {
          setLocator('');
          onClose?.();
        }}
      />
      <div
        className={classNames(styles.pageContent, {
          [styles.horizontalWithImage]:
            showNumberPlateImage && orientation === 'horizontal',
          [styles.verticalWithImage]:
            showNumberPlateImage && orientation === 'vertical',
        })}
      >
        <div className={styles.formWrapper}>
          <div className={styles.title}>{t('callBoard-title')}</div>
          <div className={styles.contentWrapper}>
            <div className={styles.content}>{t('callBoard-desc')}</div>
          </div>

          <div className={styles.inputWrapper}>
            <input
              ref={locatorInputRef}
              placeholder={t('callBoard-input')}
              value={locatorVal}
              className={styles.showPhone}
              onChange={changeLocator}
              onFocus={() => {
                const isVertical = getDeviceOrientation() === 'vertical';
                if (!isVertical && !isOpenVtkeyboadrd()) {
                  setTimeout(() => {
                    keyboardManagerRef.current?.handleKeyboardChange();
                  }, 300);
                }
              }}
              onBlur={() => {
                const isVertical = getDeviceOrientation() === 'vertical';
                if (!isVertical && !isOpenVtkeyboadrd()) {
                  setTimeout(() => {
                    keyboardManagerRef.current?.handleKeyboardClose();
                  }, 300);
                }
              }}
              onClick={() => {
                if (isOpenVtkeyboadrd()) {
                  showKeyboard();
                }
              }}
              type="number"
              onKeyUp={handleKeyUp}
            />
          </div>
          <div
            onClick={handleConfirm}
            className={classNames(
              styles.confirmBtn,
              !locatorVal ? styles.disableConfirm : 'animate-btn'
            )}
          >
            {t('confirm')}
          </div>
          {showNumberPlateImage && orientation === 'vertical' && (
            <img
              className={styles.numberPlateImage}
              src={`${IMG_HOST}/${numberPlateImage}`}
              alt=""
            />
          )}
        </div>
        {showNumberPlateImage && orientation === 'horizontal' && (
          <img
            className={styles.numberPlateImage}
            src={`${IMG_HOST}/${numberPlateImage}`}
            alt=""
          />
        )}
      </div>

      {keyboardToggle ? (
        <VtKeyboard
          keyboardType={'number'}
          keyboardValue={locatorVal}
          handlePressEnter={handleConfirm}
          changeInput={(v) => changeLocator(v, true)}
          closeKeyboard={() => hideKeyboard()}
          VKOuterStyle={{ zIndex: 9999 }}
        />
      ) : null}
    </div>
  );
};

const mapStateToProps = (state) => ({
  selfConfig: state.selfConfig,
});

export default connect(mapStateToProps)(CallerBoard);
