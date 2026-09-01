import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import styles from './QueryGiftCard.module.scss';
import Loading from '@/component/loading';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import CreditCardIcon from '@material-ui/icons/CreditCard';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import {
  getDeviceOrientation,
  isOpenVtkeyboadrd,
  subscribeDeviceOrientation,
} from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';
import { withTranslation } from 'react-i18next';
import {
  PHONE_NUMBER,
  CARD_NUMBER,
  EMAIL,
} from '@/constants/constantUnit';
import SendAuthCode from '@/component/CRM/LoginCRM/components/SendAuthCode';
import { fetchAvailableECards } from '@/actions';
import Toast from '@/component/toast';
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
import {
  formatUSPhoneInput,
  isValidUSPhone,
  normalizePhoneDigits,
} from '@/utils/phoneNumber';

class QueryGiftCard extends Component {
  constructor(props) {
    super(props);
    this.phoneInputRef = null;
    this.queryInputRef = null;
    this.keyboardManager = null;
    this.timer = null;
  }

  state = {
    cardSearchType: PHONE_NUMBER,
    phoneNum: '',
    cardNum: '',
    emailAddress: '',
    isPhoneValid: false,
    isEmailValid: false,
    isCardValid: false,
    isPrivacyConfirm: false,
    keyboardToggle: false,
    step: 1,
    orientation: getDeviceOrientation(),
  };

  componentDidMount() {
    const privacyConfirm = this.props.selfConfig?.configMap?.id_49;
    this.setState({
      isPrivacyConfirm: privacyConfirm,
    });

    const { currentOrder, ecardLastQuery } = this.props;
    const savedPhoneNum = currentOrder?.customer?.phone?.[0]?.number;
    if (ecardLastQuery) {
      this.setState({
        cardSearchType: ecardLastQuery.cardSearchType || PHONE_NUMBER,
        phoneNum: ecardLastQuery.phoneNum || '',
        cardNum: ecardLastQuery.cardNum || '',
        emailAddress: ecardLastQuery.emailAddress || '',
        isPhoneValid:
          ecardLastQuery.cardSearchType === PHONE_NUMBER &&
          isValidUSPhone(ecardLastQuery.phoneNum),
        isEmailValid:
          ecardLastQuery.cardSearchType === EMAIL &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ecardLastQuery.emailAddress || ''),
        isCardValid:
          ecardLastQuery.cardSearchType === CARD_NUMBER &&
          !!ecardLastQuery.cardNum,
      });
    } else if (savedPhoneNum) {
      const formattedPhone = formatUSPhoneInput(savedPhoneNum);
      this.setState({
        phoneNum: formattedPhone,
        isPhoneValid: isValidUSPhone(formattedPhone),
      });
    }

    this.unsubscribeOrientation = subscribeDeviceOrientation(
      this.handleDeviceOrientation
    );
    this.updateKeyboardManager(this.state.orientation);
  }

  updateKeyboardManager = (orientation) => {
    if (orientation !== 'vertical' && !this.keyboardManager) {
      this.keyboardManager = new LandscapeKeyboardManager(
        () => this.phoneInputRef
      );
      this.keyboardManager.setup();
    } else if (orientation === 'vertical' && this.keyboardManager) {
      this.keyboardManager.cleanup();
      this.keyboardManager = null;
    }
  };

  handleDeviceOrientation = (orientation) => {
    this.setState({ orientation });
    this.updateKeyboardManager(orientation);
  };

  componentWillUnmount() {
    this.unsubscribeOrientation?.();
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
    clearTimeout(this.timer);
  }

  keyboardChange = (nextFormattedValue) => {
    this.setState({
      phoneNum: nextFormattedValue,
      isPhoneValid: isValidUSPhone(nextFormattedValue),
    });
  };

  validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    this.setState({
      isEmailValid: isValid,
    });
    return isValid;
  };

  emailChange = (event) => {
    const emailAddress = event.target.value;
    this.setState({
      emailAddress,
    });
    this.validateEmail(emailAddress);
  };

  validateCard = (cardNum) => {
    const isValid = cardNum.length > 0;
    this.setState({
      isCardValid: isValid,
    });
    return isValid;
  };

  cardChange = (event) => {
    const cardNum = event.target.value;
    const trimmedCardNum = cardNum.slice(0, 20);
    this.setState({
      cardNum: trimmedCardNum,
    });
    this.validateCard(trimmedCardNum);
  };

  changePrivacyConfirm = (value) => {
    this.setState({
      isPrivacyConfirm: value,
    });
  };

  queryGiftCard = async () => {
    const { cardSearchType, phoneNum, cardNum, emailAddress } = this.state;
    const { fetchAvailableECards, t } = this.props;
    const result = await fetchAvailableECards({
      cardSearchType,
      phoneNum,
      cardNum,
      emailAddress,
    });

    if (!result.success) {
      Toast.info(result.errorMsg || t('query_failed'));
      return;
    }

    if (!result.cards || result.cards.length === 0) {
      this.setState({ step: 1 });
      Toast.info(t('no_available_gift_cards'));
    }
  };

  onConfirm = async () => {
    this.hideKeyboard();
    const { cardSearchType, phoneNum } = this.state;
    const { crm } = this.props;
    const currentPhone = normalizePhoneDigits(phoneNum);
    const isCurrentPhoneVerified =
      crm?.isCRMAuthCodeVerified &&
      crm?.crmAuthCodeVerifiedPhone === currentPhone;

    if (cardSearchType === PHONE_NUMBER && !isCurrentPhoneVerified) {
      this.setState({ step: 2 });
      return;
    }

    await this.queryGiftCard();
  };

  handleKeyUp = async (e) => {
    if (e.keyCode === 13) {
      await this.onConfirm();
    }
  };

  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };

  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  handleSetQueryType = (type) => {
    this.setState(
      {
        cardSearchType: type,
        phoneNum: '',
        cardNum: '',
        emailAddress: '',
        isPhoneValid: false,
        isEmailValid: false,
        isCardValid: false,
      },
      () => {
        if (type === EMAIL || type === CARD_NUMBER) {
          requestAnimationFrame(() => {
            this.queryInputRef?.focus();
          });
        }
      }
    );
  };

  handleVerifySuccess = async () => {
    await this.queryGiftCard();
  };

  getIsQueryDisabled = () => {
    const {
      cardSearchType,
      isPrivacyConfirm,
      isPhoneValid,
      isEmailValid,
      isCardValid,
    } = this.state;

    if (cardSearchType === PHONE_NUMBER) {
      return !isPrivacyConfirm || !isPhoneValid;
    }
    if (cardSearchType === EMAIL) {
      return !isEmailValid;
    }
    if (cardSearchType === CARD_NUMBER) {
      return !isCardValid;
    }
    return true;
  };

  backToPrevStep = () => {
    // this.setState({ step: 1 });
  };

  renderQueryMethodOptions = () => {
    const { t } = this.props;
    const { cardSearchType } = this.state;
    const queryMethodOptions = [
      {
        type: PHONE_NUMBER,
        label: t('query_by_phone_number'),
        icon: PhoneIphoneIcon,
      },
      {
        type: EMAIL,
        label: t('query_by_email'),
        icon: MailOutlineIcon,
      },
      {
        type: CARD_NUMBER,
        label: t('query_by_card_number'),
        icon: CreditCardIcon,
      },
    ].filter((item) => item.type !== cardSearchType);

    return queryMethodOptions.map((item, index) => {
      const QueryIcon = item.icon;
      return (
        <React.Fragment key={item.type}>
          {index > 0 ? (
            <span className={styles.queryMethodDivider}>|</span>
          ) : null}
          <button
            type="button"
            className={styles.queryMethodItem}
            onClick={() => this.handleSetQueryType(item.type)}
          >
            <QueryIcon className={styles.queryMethodIcon} />
            <span className={styles.queryMethodText}>{item.label}</span>
          </button>
        </React.Fragment>
      );
    });
  };

  render() {
    const {
      phoneNum,
      cardNum,
      isPrivacyConfirm,
      keyboardToggle,
      cardSearchType,
      emailAddress,
      step,
      orientation,
    } = this.state;
    const isVertical = orientation === 'vertical';
    const {
      t,
      onClose,
      ecardLoading,
      showBackToPartialPay,
      onBackToPartialPay,
    } = this.props;
    const titleKey =
      cardSearchType === EMAIL
        ? 'gift_card_email_title'
        : cardSearchType === CARD_NUMBER
          ? 'gift_card_card_number_title'
          : 'ecardPhone';

    const isQueryDisabled = this.getIsQueryDisabled();

    const queryAction = (
      <button
        type="button"
        className={classNames(
          styles.queryButton,
          isQueryDisabled
            ? styles.disableQueryButton
            : styles.enableQueryButton,
          !isQueryDisabled && 'linear-animate-btn'
        )}
        onClick={isQueryDisabled ? undefined : this.onConfirm}
        disabled={isQueryDisabled}
      >
        {t('gift_card_query_button')}
      </button>
    );

    if (step === 2) {
      return (
        <SendAuthCode
          goBackStep={this.backToPrevStep}
          phoneNum={phoneNum}
          onVerifySuccess={this.handleVerifySuccess}
          onClose={onClose}
          t={t}
          tempMemberInfo={null}
          isShowHeader={false}
        />
      );
    }

    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginModal}>
          {cardSearchType === PHONE_NUMBER ? (
            <PhoneNumberEntryLayout
              title={t(titleKey)}
              value={phoneNum}
              placeholder={t('inputPhone')}
              inputRef={(el) => (this.phoneInputRef = el)}
              isVertical={isVertical}
              onPhoneChange={this.keyboardChange}
              onKeyUp={this.handleKeyUp}
              onFocus={() => {
                if (!isVertical && !isOpenVtkeyboadrd()) {
                  if (this.keyboardManager) {
                    this.keyboardManager.forceCheck();
                    setTimeout(() => {
                      this.keyboardManager.handleKeyboardChange();
                    }, 300);
                  }
                } else if (isOpenVtkeyboadrd() && !isVertical) {
                  this.showKeyboard();
                }
              }}
              onBlur={() => {
                if (!isVertical && !isOpenVtkeyboadrd()) {
                  setTimeout(() => {
                    if (this.keyboardManager) {
                      this.keyboardManager.handleKeyboardClose();
                    }
                  }, 300);
                }
              }}
              onClick={() => {
                if (isOpenVtkeyboadrd() && !isVertical) {
                  this.showKeyboard();
                }
              }}
              afterField={
                <div className={styles.queryMethodWrapper}>
                  {this.renderQueryMethodOptions()}
                </div>
              }
              isPrivacyConfirm={isPrivacyConfirm}
              changePrivacyConfirm={this.changePrivacyConfirm}
              actions={queryAction}
            />
          ) : (
            <>
              <div className={styles.queryTitle}>{t(titleKey)}</div>

              {cardSearchType === EMAIL && (
                <input
                  ref={(el) => (this.queryInputRef = el)}
                  name="emailAddress"
                  value={emailAddress}
                  autoFocus={false}
                  className={styles.queryInput}
                  type="email"
                  placeholder={t('input_email')}
                  onChange={this.emailChange}
                  onKeyUp={this.handleKeyUp}
                />
              )}

              {cardSearchType === CARD_NUMBER && (
                <input
                  ref={(el) => (this.queryInputRef = el)}
                  name="cardNum"
                  value={cardNum}
                  autoFocus={false}
                  className={styles.queryInput}
                  type="text"
                  placeholder={t('input_card_number')}
                  onChange={this.cardChange}
                  onKeyUp={this.handleKeyUp}
                />
              )}

              <div className={styles.queryMethodWrapper}>
                {this.renderQueryMethodOptions()}
              </div>

              {queryAction}
            </>
          )}

          {/*/!* {showBackToPartialPay ? (*/}
          {/*  <div*/}
          {/*    className={styles.backToPartialPay}*/}
          {/*    onClick={onBackToPartialPay}*/}
          {/*  >*/}
          {/*    {t('choose_other_payment_method')}*/}
          {/*  </div>*/}
          {/*) : null} *!/*/}
        </div>

        <Loading visible={ecardLoading} />

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={phoneNum}
            handlePressEnter={this.onConfirm}
            changeInput={(value) => this.keyboardChange(value)}
            closeKeyboard={() => this.hideKeyboard()}
            VKOuterStyle={{ zIndex: 9999 }}
          />
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    crm: state.crm,
    ecardLastQuery: state.ecard?.lastQuery,
    ecardLoading: state.ecard?.loading,
  };
}

export default withTranslation()(
  connect(mapStateToProps, { fetchAvailableECards })(QueryGiftCard)
);
