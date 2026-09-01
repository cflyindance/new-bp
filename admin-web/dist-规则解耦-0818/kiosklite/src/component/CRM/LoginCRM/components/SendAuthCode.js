import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import styles from './LoginModal.module.scss';
import maskPhoneNumber from '@/utils/maskPhoneNumber';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import OtpInput from 'react18-input-otp';
import CountDown from '@/component/CountDown';
import { getAuthCode, verifyAuthCode } from '@/api/kioskConfigApi';
import Loading from '@/component/loading';
import Alert from '@material-ui/lab/Alert';
import Policy from './Policy';
import { useCloseModalOnHomePage } from '@/hooks';
import jingleBell from '@/assets/images/jingleBell.png';
import Toast from '@/component/toast';
import ComboHeader from '@/container/comboPanel/ComboHeader';
import { isOpenVtkeyboadrd } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import { getDeviceOrientation } from '@/utils';
import NumPad from '@/component/numPad';
import {
  setCRMAuthCodeVerified,
  setCRMAuthCodeVerifiedPhone,
} from '@/actions/crm_action';

const numInputs = 6;

const SendAuthCode = (props) => {
  const {
    goBackStep,
    phoneNum,
    onVerifySuccess,
    onClose,
    t,
    tempMemberInfo,
    isShowHeader = true,
    setCRMAuthCodeVerified,
    setCRMAuthCodeVerifiedPhone,
  } = props;
  const [authCode, setAuthCode] = useState('');
  const [showTotalPhone, setShowTotalPhone] = useState(false);
  const countDownRef = useRef(null);
  const [reSendCode, setReSendCode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState('');
  const [errInfo, setErrorInfo] = useState({
    errorApiMsg: '',
    errorApiShow: false,
  });
  const [isPrivacyConfirm, setPrivacyConfirm] = useState(true);
  const [keyboardToggle, setKeyboardToggle] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isVertical = getDeviceOrientation() === 'vertical';

  useCloseModalOnHomePage(onClose);

  useEffect(() => {
    handleSendAuthCode(true);
    return () => {};
  }, []);

  useEffect(() => {
    if (authCode?.length === 6) {
      if (!isPrivacyConfirm) return Toast.info(t('confirm-policy'), 2000);
      onSubmitAuthCode();
    }
  }, [authCode, isPrivacyConfirm]);

  const showApiModalTip = (errMsg) => {
    setErrorInfo({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    const timer = setTimeout(() => {
      setErrorInfo({
        errorApiMsg: '',
        errorApiShow: false,
      });
      clearTimeout(timer);
    }, 2000);
  };

  const backToPrevStep = () => {
    goBackStep?.();
    setAuthCode('');
  };

  const changePrivacyConfirm = (v) => {
    setPrivacyConfirm(v);
  };

  const handleSendAuthCode = async (defaultSend = false) => {
    if (!defaultSend && !isPrivacyConfirm)
      return Toast.info(t('confirm-policy'), 2000);
    const onSendError = (msg) => {
      setReSendCode(true);
      showApiModalTip(msg);
      countDownRef.current.stop();
      return false;
    };
    try {
      setLoading(true);
      setReSendCode(false);
      const data = {
        phone: `+1${phoneNum.replace(/\D/g, '')}`,
        countryCode: '+1',
        options: {
          autoSignUp: true,
        },
      };
      const codeRes = await getAuthCode(data);
      // 发送成功
      if (codeRes.status === 200 && codeRes.data.successful) {
        setSession(codeRes.data?.otpLogin?.Session || '');
        countDownRef.current.start();
        Toast.info(t('sentSuccess'), 2000);
        return true;
      }
      return onSendError(codeRes.data.message);
    } catch (e) {
      return onSendError(
        e.response?.data?.message || e.message || 'Network Error'
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAuthCode = async () => {
    const onVerifyError = (msg) => {
      setAuthCode('');
      showApiModalTip(msg);
      countDownRef.current?.stop();
    };
    hideKeyboard();
    try {
      setLoading(true);
      const phone = phoneNum.replace(/\D/g, '');
      const data = {
        phone: `+1${phone}`,
        countryCode: '+1',
        code: authCode,
        session,
      };
      const res = await verifyAuthCode(data);
      if (res.status === 200 && res.data.token) {
        setCRMAuthCodeVerified(true);
        setCRMAuthCodeVerifiedPhone(phone);
        await onVerifySuccess(phone, tempMemberInfo);
        await backToPrevStep();
        return;
      }
      onVerifyError(res.data.message);
    } catch (e) {
      if (e.response?.data?.code === 'INCORRECT_CODE') {
        const session = e.response.data.retrySession;
        setSession(session);
      }
      onVerifyError(e.response?.data?.message || e.message || 'Network Error');
    } finally {
      setLoading(false);
    }
  };

  const changeAuthCode = (key, isVKboard = false) => {
    if (isVKboard) {
      if (key === 'bksp' || key === 'delete') {
        handlePressDelete();
      } else if (/^\d$/.test(key)) {
        // 数字键逻辑
        if (authCode.length < numInputs) {
          // 在活动位置插入数字
          const newAuthCode =
            authCode.substring(0, activeIndex) +
            key +
            authCode.substring(activeIndex);
          setAuthCode(newAuthCode);

          // 自动跳转到下一个输入框
          if (activeIndex < numInputs - 1) {
            setActiveIndex(activeIndex + 1);
          }
        }
      }
    } else {
      setAuthCode(key);
    }
  };

  const showKeyboard = () => {
    setKeyboardToggle(true);
  };

  const hideKeyboard = () => {
    setKeyboardToggle(false);
  };

  // 处理输入框聚焦
  const handleInputFocus = (index) => {
    setActiveIndex(index);
  };

  const handlePressEnter = () => {
    if (isComplete) {
      onSubmitAuthCode();
    }
  };

  const handlePressDelete = () => {
    if (activeIndex > 0) {
      // 删除当前值并跳转到前一个输入框
      const newAuthCode =
        authCode.substring(0, activeIndex - 1) +
        authCode.substring(activeIndex);
      setAuthCode(newAuthCode);
      setActiveIndex(activeIndex - 1);
    } else if (activeIndex === 0 && authCode.length > 0) {
      // 删除第一个输入框的值
      setAuthCode(authCode.substring(1));
    }
  };

  return (
    <div className={styles.authCodeWrapper}>
      {isShowHeader && <ComboHeader handleGoBack={backToPrevStep} />}
      <div className={styles.authCodeBox}>
        <div className={styles.authCode}>
          <img src={jingleBell} className={styles.jingleBell} />
          <span>{t('plsEnterAuth')}</span>
        </div>
        <div className={styles.sendTo}>
          <span>{t('sendAuthTo')}:</span>
          <div className={styles.sendToPhone}>
            +1{maskPhoneNumber(phoneNum, showTotalPhone)}
          </div>
          <span onClick={() => setShowTotalPhone(!showTotalPhone)}>
            {showTotalPhone ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          </span>
        </div>
        <div
          className={styles.authCodeInputBox}
          onClick={() => {
            if (isOpenVtkeyboadrd() && !isVertical) {
              showKeyboard();
            }
          }}
        >
          <OtpInput
            value={authCode}
            onChange={(v) => changeAuthCode(v)}
            numInputs={numInputs}
            separator={<span style={{ padding: '0 0.5rem' }}></span>}
            isInputNum
            renderInput={(props, index) => (
              <input
                {...props}
                onFocus={() => handleInputFocus(index)}
                className={`otp-input-box ${index === activeIndex ? 'active' : ''}`}
              />
            )}
            containerStyle={{
              width: '100%',
              justifyContent: 'center',
              marginBottom: '10rem',
              opacity: isVertical ? 0 : 1,
            }}
            inputStyle={{
              width: '11rem',
              height: '13rem',
              outline: 'none',
              border: 'none',
              background: 'var(--background-grey)',
              fontSize: '6rem',
              color: '#000',
              borderRadius: '20rem',
              boxShadow: '0.1rem 0.2rem 1rem rgba(0, 0, 0, 0.1) inset',
            }}
            autoComplete="on"
          />
          {isVertical && (
            <div className={styles.displayAuthCode}>
              {Array.from({ length: numInputs }, (_, index) => (
                <div key={index} className={styles.displayAuthCodeText}>
                  {authCode[index] || ''}
                </div>
              ))}
            </div>
          )}
        </div>
        {isVertical && (
          <NumPad
            keys={['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']}
            maxLength={6}
            mode="direct"
            keyPress={(v) => changeAuthCode(v, true)}
          />
        )}
        <Policy
          isPrivacyConfirm={isPrivacyConfirm}
          changePrivacyConfirm={changePrivacyConfirm}
        />
        <div
          className={classNames(
            styles.confirmBtn,
            !reSendCode || !isPrivacyConfirm
              ? styles.disableConfirm
              : 'linear-animate-btn'
          )}
          onClick={() => {
            if (!reSendCode) return;
            handleSendAuthCode();
          }}
        >
          <CountDown
            t={t}
            ref={countDownRef}
            onFinishedEffect={() => setReSendCode(true)}
          />
        </div>
      </div>
      <Loading visible={loading} />
      {errInfo.errorApiShow && (
        <Alert variant="filled" severity="error">
          {errInfo.errorApiMsg}
        </Alert>
      )}
      {keyboardToggle ? (
        <VtKeyboard
          keyboardValue={authCode}
          handlePressEnter={handlePressEnter}
          handlePressDelete={handlePressDelete}
          onKeyPress={(button) => changeAuthCode(button, true)}
          closeKeyboard={() => hideKeyboard()}
          VKOuterStyle={{ zIndex: 9999 }}
        />
      ) : null}
    </div>
  );
};

export default connect(null, {
  setCRMAuthCodeVerified,
  setCRMAuthCodeVerifiedPhone,
})(SendAuthCode);
