import React, { Component } from 'react';
import classNames from 'classnames';
import styles from './LoginModal.module.scss';
import {
  createCRMMember,
  getCRMMemberInfo,
  getOnboardGiftRule,
  searchCRMMember,
  checkIsFirstOrder,
} from '@/api/kioskConfigApi';
import Loading from '@/component/loading';
import Alert from '@material-ui/lab/Alert';
import SendAuthCode from './SendAuthCode';
import Dialog from '@/component/dialog';
import { isOpenVtkeyboadrd, getDeviceOrientation, subscribeDeviceOrientation } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import crmIntegration from '@/api/crm-integration';
import Toast from '@/component/toast';
import syncLandscapeKeyboardManager from '@/utils/syncLandscapeKeyboardManager';
import { posFrontLog } from '@/api';
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
import { isValidUSPhone, normalizePhoneDigits } from '@/utils/phoneNumber';

class LoginModal extends Component {
  constructor(props) {
    super(props);
    this.phoneInputRef = null;
    this.keyboardManager = null;
    this.unsubscribeOrientation = null;
  }

  state = {
    phoneNum: '',
    isPhoneValid: false,
    isPrivacyConfirm: false,
    step: 0,
    loading: false,
    errorApiShow: false,
    errorApiMsg: '',
    tempMemberInfo: null, // 已存在的会员暂存会员信息
    keyboardToggle: false,
    deviceOrientation: getDeviceOrientation(),
  };

  handleOrientationChange = (orientation) => {
    if (orientation === this.state.deviceOrientation) {
      return;
    }

    this.setState({ deviceOrientation: orientation }, () => {
      syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
    });
  };

  componentDidMount() {
    window.addEventListener('popstate', this.handleLocationChange);
    crmIntegration.getValidToken();

    // 初始化键盘状态
    // this.setState({
    //   keyboardToggle: isOpenVtkeyboadrd() && !this.getIsVertical(),
    // });

    // 初始化隐私条款选中状态
    const privacyConfirm = this.props.selfConfig?.configMap?.id_49;
    this.setState({
      isPrivacyConfirm: privacyConfirm,
    });

    syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
    this.unsubscribeOrientation = subscribeDeviceOrientation(
      this.handleOrientationChange
    );
  }

  componentWillUnmount() {
    window.removeEventListener('popstate', this.handleLocationChange);
    if (this.unsubscribeOrientation) {
      this.unsubscribeOrientation();
    }
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
  }

  handleLocationChange = () => {
    if (window.location.hash === '#/') {
      this.props.onClose();
    }
  };

  keyboardChange = (nextFormattedValue) => {
    this.setState({
      phoneNum: nextFormattedValue,
      isPhoneValid: isValidUSPhone(nextFormattedValue),
    });
  };

  changePrivacyConfirm = (v) => {
    this.setState({
      isPrivacyConfirm: v,
    });
  };

  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  getADMemberInfo = async () => {
    try {
      this.setState({
        loading: true,
      });
      const { setMemberStatus } = this.props;
      const { phoneNum } = this.state;
      const data = {
        areaCode: 1,
        phone: normalizePhoneDigits(phoneNum),
      };
      const res = await crmIntegration.searchCustomers(data);
      if (res.data?.success) {
        if (res?.data?.data?.length > 0) {
          setMemberStatus(false);
          const customerInfo = res?.data?.data?.[0];
          this.props.setCRMCustomerInfo(customerInfo);
          const customerId = customerInfo?.id;
          const memberInfo = {
            ...customerInfo,
            userId: customerId,
          };
          if (customerId) {
            const { pointBalance } = await this.getCustomerAssets(customerId);
            memberInfo.pointBalance = pointBalance;
            return memberInfo;
          }
        } else {
          setMemberStatus(true);
          return {};
        }
      }
      this.showApiModalTip(res?.data?.message || 'failed to get member info');
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.message || e.message || 'Network Error'
      );
      return false;
    } finally {
      this.setState({
        loading: false,
      });
    }
  };

  checkIsMemberOrderedBefore = async () => {
    const { phoneNum } = this.state;
    const noCountryCodeNumber = normalizePhoneDigits(phoneNum);
    try {
      const res = await checkIsFirstOrder(noCountryCodeNumber);
      const isMemberOrdered = res?.data?.data === null ? true : res?.data?.data;
      this.props.setIsMemberOrderedBefore(isMemberOrdered);
    } catch (e) {
      console.log('checkIsFirstOrder接口调用失败:', e);
      this.props.setIsMemberOrderedBefore(true);
    }
  };

  onConfirmPhone = async () => {
    const { isPhoneValid, isPrivacyConfirm } = this.state;
    const { isNeedAuthCode, crmType, t } = this.props;
    if (!isPhoneValid) return;
    if (!isPrivacyConfirm) return Toast.info(t('confirm-policy'), 2000);
    // 查询crm/ad会员信息
    const checkInfoApi = [this.checkIsMemberExist, this.getADMemberInfo];
    const res = await checkInfoApi[crmType - 1]();
    if (!res) return;
    // 会员已存在
    if (res && Object.keys(res).length > 0) {
      this.setState({
        tempMemberInfo: res,
      });
    }
    // 不需要验证
    if (!isNeedAuthCode) {
      const { phoneNum } = this.state;
      await this.onVerifySuccess(normalizePhoneDigits(phoneNum), res);
      return;
    }
    this.setState({
      step: 1,
    });
    this.hideKeyboard();
  };

  checkIsMemberExist = async () => {
    try {
      this.setState({
        loading: true,
      });
      const { setMemberStatus } = this.props;
      const { phoneNum } = this.state;
      const searchParams = {
        pageNo: 1,
        pageSize: 15,
        searchField: 'phone',
        searchKey: normalizePhoneDigits(phoneNum),
      };
      // 查询 member 是否存在
      const res = await searchCRMMember(searchParams);
      if (res.status === 200 && res.data.code === 0) {
        // 存在member
        if (res.data.data?.total > 0) {
          // 非新会员
          setMemberStatus(false);
          return res.data.data?.data?.[0];
        }
        // 新会员
        setMemberStatus(true);
        return {};
      }
      this.showApiModalTip(res.data?.msg);
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.message || e.message || 'Network Error'
      );
      return false;
    } finally {
      this.setState({
        loading: false,
      });
    }
  };

  backToPrevStep = () => {
    this.setState({
      step: 0,
    });
  };

  onVerifySuccess = async (phone, tempMemberInfoParam = null) => {
    this.setState({
      loading: true,
    });
    // 优先使用传入的参数，避免setState异步导致的问题
    const tempMemberInfo = tempMemberInfoParam || this.state.tempMemberInfo;
    const { setCRMMemberInfo, changeLoginType, onClose, crmType } = this.props;
    if (tempMemberInfo && Object.keys(tempMemberInfo)?.length > 0) {
      setCRMMemberInfo(tempMemberInfo);
      changeLoginType('active');
      await this.checkIsMemberOrderedBefore();
      onClose?.({ memberCRMInfo: tempMemberInfo, isNewMember: false });
      this.setState({
        loading: false,
      });
      posFrontLog(
        `login  -not NewMember-  id: ${tempMemberInfo?.id} --- userId: ${tempMemberInfo?.userId} ---  
         phone: ${tempMemberInfo?.phone} ---  pointBalance: ${tempMemberInfo?.pointBalance}`
      );
      return;
    }
    // 验证成功 && 无会员信息 -> 创建crm/ad会员
    const createApi = [this.createCRM, this.createADMember];
    const createRes = await createApi[crmType - 1](phone);
    if (!createRes) {
      this.setState({
        loading: false,
      });
      return;
    }
    const { userId } = createRes;
    // 获取crm/ad会员信息
    const fetchApi = [this.fetchCRMMemberInfo, this.fetchMemberInfoViaId];
    const fetchRes = await fetchApi[crmType - 1](userId);
    if (!fetchRes) {
      this.setState({
        loading: false,
      });
      return;
    }
    await this.checkIsMemberOrderedBefore();
    this.setState({
      loading: false,
    });
  };

  getCustomerAssets = async (customerId) => {
    try {
      const assetsRes = await crmIntegration.getCustomerAssets(customerId);
      if (assetsRes.data?.success) {
        await this.props.setCustomerVouchers(
          assetsRes?.data?.data?.vouchers || []
        );
        return {
          pointBalance:
            assetsRes?.data?.data?.loyaltyAccount?.pointBalance || 0,
          giftVoucher: assetsRes?.data?.data?.vouchers || [],
        };
      }
      return 0;
    } catch (e) {
      throw new Error(e);
    }
  };

  createADMember = async (phone) => {
    try {
      // ad
      const data = {
        areaCode: 1,
        phone: phone,
        channelCode: 'KIOSK',
      };
      const res = await crmIntegration.createNewCustomer(data);
      if (res.data?.success) {
        const id = res.data.data;
        return {
          userId: id,
        };
      }
      this.showApiModalTip(
        res.data.errorMessage || 'failed to create new member'
      );
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.errorMessage || e.message || 'Network Error'
      );
      return false;
    }
  };

  createCRM = async (phone) => {
    try {
      // crm
      const data = {
        firstname: '',
        lastname: '',
        phone,
        email: '',
      };
      const res = await createCRMMember(data);
      if (res.status === 200 && res.data.code === 0) {
        return res.data.data;
      }
      this.showApiModalTip(res.data?.msg);
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.msg || e.message || 'Network Error'
      );
      return false;
    }
  };

  fetchMemberInfoViaId = async (userId) => {
    try {
      const { setCRMMemberInfo, changeLoginType, onClose, setCRMCustomerInfo } =
        this.props;
      const customerRes = await crmIntegration.getCustomerInfo(userId);
      if (customerRes.data?.success) {
        const customerInfo = customerRes?.data?.data;
        setCRMCustomerInfo(customerInfo);
        const customerId = customerInfo?.id;
        const memberInfo = {
          ...customerInfo,
          userId: customerId,
        };
        if (customerId) {
          const { pointBalance, giftVoucher } =
            await this.getCustomerAssets(customerId);
          memberInfo.pointBalance = pointBalance;
          setCRMMemberInfo(memberInfo);
          changeLoginType('active');
          // 新人礼取值
          const onboardGiftRule = await this.fetchOnboardGiftRule(memberInfo);
          this.props.setOnboardGiftRule(onboardGiftRule);
          onClose?.({
            isNewMember: true,
            onboardGiftRule,
            giftVoucher,
          });

          posFrontLog(
            `login  -AD -  id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
             phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`
          );
          return true;
        }
      }
      this.showApiModalTip(
        customerRes.data?.message || 'failed to fetch member via id'
      );
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.message || e.message || 'Network Error'
      );
      return false;
    }
  };

  fetchCRMMemberInfo = async (userId) => {
    try {
      const { setCRMMemberInfo, changeLoginType, onClose } = this.props;
      const res = await getCRMMemberInfo(userId);
      if (res.status === 200 && res.data.code === 0) {
        setCRMMemberInfo(res.data.data);
        changeLoginType('active');
        const onboardGiftRule = await this.fetchOnboardGiftRule(res.data.data);
        onClose?.({
          isNewMember: true,
          onboardGiftRule,
        });

        posFrontLog(
          `login -CRM -  id: ${res.data.data?.id} --- userId: ${res.data.data?.userId} ---  
           phone: ${res.data.data?.phone} --- pointBalance: ${res.data.data?.pointBalance}`
        );
        return true;
      }
      this.showApiModalTip(res.data?.msg);
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.message || e.message || 'Network Error'
      );
      return false;
    }
  };

  // 新人礼配置
  fetchOnboardGiftRule = async (memberCRMInfo) => {
    try {
      const res = await getOnboardGiftRule();
      if (res.status === 200 && res.data.code === 0) {
        this.props.setOnboardGiftRule(res.data.data);
        return res.data.data;
      }
    } catch (e) {
      // 静默处理错误，不向外抛出异常
    }

    // 兼容逻辑：接口失败或未打补丁时返回默认值
    let onboardGift = {
      onboardGift: memberCRMInfo.pointBalance > 0,
      data: [{ giftContent: { number: memberCRMInfo.pointBalance } }],
    };
    this.props.setOnboardGiftRule(onboardGift);
    return onboardGift;
  };

  handleKeyUp = async (e) => {
    if (e.keyCode === 13) {
      await this.onConfirmPhone();
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

  render() {
    const {
      phoneNum,
      isPhoneValid,
      isPrivacyConfirm,
      step,
      loading,
      errorApiShow,
      errorApiMsg,
      keyboardToggle,
    } = this.state;
    const { t, onClose } = this.props;

    const isVertical = this.state.deviceOrientation === 'vertical';
    const actions = (
      <>
        <div className={styles.never} onClick={onClose}>
          {t('cancel')}
        </div>
        <div
          className={classNames(
            styles.confirmBtn,
            !isPhoneValid || !isPrivacyConfirm
              ? styles.disableConfirm
              : 'linear-animate-btn'
          )}
          onClick={this.onConfirmPhone}
        >
          {t('confirm')}
        </div>
      </>
    );

    return (
      <div className={styles.loginWrapper}>
        {step === 0 && (
          <div className={styles.loginModal}>
            <PhoneNumberEntryLayout
              title={t('phoneLogin')}
              titleIcon={null}
              value={phoneNum}
              placeholder={t('inputPhone')}
              inputRef={(el) => (this.phoneInputRef = el)}
              isVertical={isVertical}
              onPhoneChange={this.keyboardChange}
              onKeyUp={this.handleKeyUp}
              onFocus={() => {
                // 横屏模式下，如果使用原生键盘，触发键盘检测
                if (!isVertical && !isOpenVtkeyboadrd()) {
                  if (this.keyboardManager) {
                    // 立即检测一次，然后延迟再检测一次（键盘弹出需要时间）
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
                // 键盘关闭时恢复样式
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
              isPrivacyConfirm={isPrivacyConfirm}
              changePrivacyConfirm={this.changePrivacyConfirm}
              actions={actions}
            />
          </div>
        )}

        <Dialog
          visible={step === 1}
          html={
            <SendAuthCode
              t={t}
              goBackStep={this.backToPrevStep}
              phoneNum={phoneNum}
              onVerifySuccess={this.onVerifySuccess}
              tempMemberInfo={this.state.tempMemberInfo}
            />
          }
        />
        <Loading visible={loading} />
        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={phoneNum}
            handlePressEnter={this.onConfirmPhone}
            changeInput={(v) => this.keyboardChange(v)}
            closeKeyboard={() => this.hideKeyboard()}
            VKOuterStyle={{ zIndex: 9999 }}
          />
        ) : null}
      </div>
    );
  }
}

export default LoginModal;
