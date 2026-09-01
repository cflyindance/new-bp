import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './phoneInput.module.scss';
import Dialog from '@/component/dialog';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import NewMemberGift from '@/component/CRM/LoginCRM/components/NewMemberGift';
import Alert from '@material-ui/lab/Alert';
import {
  customer,
  payByCard,
  payByCash,
  setIsReorderFlag,
  setSelfConfig,
  spliceOrderBySoldout,
  setLanModal,
  saveOrderResult,
} from '@/actions';
import { saveCustomerInfo } from '@/api';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
  judgeNeedPayOtherCharge,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import { pushPaymentMethodEntry } from '@/utils/tipProcedure';
import {
  createCRMMember,
  getCRMMemberInfo,
  getPointRule,
  searchCRMMember,
  getOnboardGiftRule,
  checkIsFirstOrder,
} from '@/api/kioskConfigApi';
import {
  setCRMMemberInfo,
  setMemberStatus,
  changeLoginType,
  changeIgnoreReward,
  setEarnRule,
  setOnboardGiftRule,
  setIsMemberOrderedBefore,
} from '@/actions/crm_action';
import Loading from '@/component/loading';
import checkCRMStatus from '@/utils/checkCRMStatus';
import checkCRMType from '@/utils/checkCRMType';
import { isOpenVtkeyboadrd } from '@/utils';
import VtKeyboard from '@/component/VtKeyboard';
import crmIntegration from '@/api/crm-integration';
import { setCustomerVouchers, setCRMCustomerInfo } from '@/actions/avocado';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import { getDeviceOrientation, subscribeDeviceOrientation } from '@/utils';
import Toast from '@/component/toast';
import syncLandscapeKeyboardManager from '@/utils/syncLandscapeKeyboardManager';
import {
  calculateTotalAmount,
  processZeroAmountOrder,
} from '@/utils/processZeroAmountOrder';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { posFrontLog } from '@/api';
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
import {
  formatUSPhoneInput,
  isValidUSPhone,
  normalizePhoneDigits,
} from '@/utils/phoneNumber';

class PhoneInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      saveNumber: '',
      customNumber: '',
      isPhoneValid: false,
      isHasSoldoutDish: false,
      dishMap: {},
      errorLoading: false,
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      isPrivacyConfirm: false,
      loading: false,
      showNewMemberGift: false,
      resolveNewMemberGift: null,
      keyboardToggle: false,
      deviceOrientation: getDeviceOrientation(),
    };
    this.timer = null;
    this.phoneInputRef = null;
    this.keyboardManager = null;
    this.unsubscribeOrientation = null;
  }

  handleOrientationChange = (orientation) => {
    if (orientation === this.state.deviceOrientation) {
      return;
    }

    this.setState({ deviceOrientation: orientation }, () => {
      syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
    });
  };

  handleCancel = () => {
    this.setState({
      errorLoading: false,
    });
  };

  handleRetry = () => {
    this.savePhoneNumber(this.state.saveNumber);
  };

  backBtnHandler = () => {
    this.props.history.goBack();
  };

  // 查询配置项、判断订单内，是否含售罄菜
  judgeConfigToSoldout = (fn) => {
    judgeConfigToSoldoutUtil(fn, {
      setSelfConfig: this.props.setSelfConfig,
      setState: this.setState.bind(this),
      showApiModalTip: this.showApiModalTip,
      reorder: this.reorder,
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

  // 同步新人礼和后续跳转页面逻辑
  showNewMemberGiftAndWait = () => {
    return new Promise((resolve) => {
      this.setState({
        showNewMemberGift: true,
        resolveNewMemberGift: resolve,
      });
    });
  };

  handleCloseNewMemberGift = () => {
    this.setState({ showNewMemberGift: false });
    if (this.state.resolveNewMemberGift) {
      this.state.resolveNewMemberGift();
      this.setState({ resolveNewMemberGift: null });
    }
  };

  checkIsMemberOrderedBefore = async (number) => {
    const noCountryCodeNumber = number.slice(-10);
    try {
      const res = await checkIsFirstOrder(noCountryCodeNumber);
      const isMemberOrdered = res?.data?.data === null ? true : res?.data?.data;
      this.props.setIsMemberOrderedBefore(isMemberOrdered);
    } catch (e) {
      console.log('checkIsFirstOrder接口调用失败:', e);
      this.props.setIsMemberOrderedBefore(true);
    }
  };

  // 保存客户信息到订单
  saveCustomerInfoToOrder = async (number) => {
    const { currentOrder } = this.props;
    try {
      // 获取有没有输入过手机号
      let firstName = currentOrder.customer?.firstName || '';
      const customerInfo = {
        id: '',
        firstName,
        phone: [
          {
            id: '',
            number,
          },
        ],
      };
      this.props.customer(customerInfo);

      const {
        data: { result, customer },
      } = await saveCustomerInfo(number, '');

      if (result.successful) {
        const customerInfo = {
          id: customer.id,
          firstName,
          phone: [
            {
              id: customer.phone[0].id,
              number,
            },
          ],
        };
        this.props.customer(customerInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.log('saveCustomerInfoToOrder 失败:', error);
      return false;
    }
  };

  savePhoneNumber = async (number) => {
    try {
      const success = await this.saveCustomerInfoToOrder(number);
      if (!success) {
        this.setState({
          errorLoading: true,
        });
        return;
      }
      const crmRes = await this.checkCRMInfo(number);
      await this.checkIsMemberOrderedBefore(number);
      this.setState({
        loading: false,
      });
      if (crmRes) {
        const {
          crm: { isNewMember, loginType }, // 只能用于主动登陆下判断，本页登录还没有流转过来...
          changeIgnoreReward,
        } = this.props;
        // 新会员新人礼 登陆展示过就不展示了
        let onboardGiftRule = {};
        if (isNewMember) {
          onboardGiftRule = await this.fetchOnboardGiftRule();
        }
        if (
          loginType !== 'active' &&
          isNewMember &&
          onboardGiftRule?.onboardGift &&
          onboardGiftRule?.data?.[0]?.giftContent?.number > 0
        ) {
          await this.showNewMemberGiftAndWait();
        }
        const goReward = this.goRewardAble(crmRes);
        const onBeforeJudge = (onNewMemberGo) => {
          if (goReward) {
            changeIgnoreReward(false);
            this.handleGotoRewards();
            return;
          }
          onNewMemberGo();
        };
        this.judgeAfterOperation(onBeforeJudge);
      } else {
        this.judgeAfterOperation();
      }
    } catch (error) {
      this.setState({
        errorLoading: true,
      });
    }
  };

  checkCRMInfo = async (phone) => {
    const {
      allSysConfig,
      crm: { memberCRMInfo, loginType },
      changeLoginType,
    } = this.props;
    // 已有会员信息, 且是主动登陆
    if (
      memberCRMInfo &&
      Object.keys(memberCRMInfo)?.length > 0 &&
      loginType === 'active'
    )
      return true;
    const isCRMDisabled = checkCRMStatus(allSysConfig);
    if (isCRMDisabled) return false;
    this.setState({
      loading: true,
    });
    changeLoginType('passive');
    const crmType = checkCRMType(allSysConfig);
    if (crmType === 2) {
      // ad
      return await this.getADMemberInfo(phone);
    }
    // crm
    const res = await this.searchIsInCRM(phone);
    if (!res) return false;
    if (Object.keys(res)?.length > 0) return res;
    const createRes = await this.createCRM(phone);
    if (createRes) {
      const { userId } = createRes;
      return await this.fetchCRMMemberInfo(userId);
    }
    return false;
  };

  getCustomerAssets = async (customerId) => {
    try {
      const assetsRes = await crmIntegration.getCustomerAssets(customerId);
      if (assetsRes.data?.success) {
        this.props.setCustomerVouchers(assetsRes.data.data.vouchers || []);
        return assetsRes.data.data.loyaltyAccount.pointBalance;
      }
      return 0;
    } catch (e) {
      this.setState({
        loading: false,
      });
      throw new Error(e);
    }
  };

  getADMemberInfo = async (phone) => {
    try {
      const data = {
        areaCode: 1,
        phone,
      };
      const { setCRMMemberInfo, setMemberStatus, setCRMCustomerInfo } =
        this.props;
      const res = await crmIntegration.searchCustomers(data);
      if (res.data?.success) {
        if (res?.data?.data?.length > 0) {
          const customerInfo = res?.data?.data?.[0];
          setCRMCustomerInfo(customerInfo);
          const customerId = customerInfo?.id;
          const memberInfo = {
            ...customerInfo,
            userId: customerId,
          };
          if (customerId) {
            memberInfo.pointBalance = await this.getCustomerAssets(customerId);
            setMemberStatus(false);
            setCRMMemberInfo(memberInfo);
            posFrontLog(
              `login -phoneInput- -not NewMember- -AD-  id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
               phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`
            );
            return memberInfo;
          }
        } else {
          setMemberStatus(true);
          return await this.createADMember(phone);
        }
      }
      this.showApiModalTip(res?.data?.message || 'failed to get member info');
    } catch (e) {
      console.log(e);
      this.setState({
        loading: false,
      });
      this.showApiModalTip(e?.message || 'failed to get member info');
    }
    return false;
  };

  createADMember = async (phone) => {
    try {
      const data = {
        areaCode: 1,
        phone,
        channelCode: 'KIOSK',
      };
      const res = await crmIntegration.createNewCustomer(data);
      if (res.data?.success) {
        const id = res.data.data;
        return await this.fetchMemberInfoViaId(id);
      }
      this.showApiModalTip(
        res.data.errorMessage || 'failed to create new member'
      );
      return false;
    } catch (e) {
      this.showApiModalTip(
        e.response?.data?.errorMessage || e.message || 'Network Error'
      );
      this.setState({
        loading: false,
      });
      return false;
    }
  };

  fetchMemberInfoViaId = async (userId) => {
    try {
      const { setCRMMemberInfo, setCRMCustomerInfo } = this.props;
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
          memberInfo.pointBalance = await this.getCustomerAssets(customerId);
          setCRMMemberInfo(memberInfo);
          posFrontLog(
            `login -phoneInput- -AD- id: ${memberInfo?.id} --- userId: ${memberInfo?.userId} ---  
             phone: ${memberInfo?.phone} --- pointBalance: ${memberInfo?.pointBalance}`
          );
          return true;
        }
      }
      this.showApiModalTip(
        res.data?.message || 'failed to fetch member via id'
      );
      return false;
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  searchIsInCRM = async (phone) => {
    const searchParams = {
      pageNo: 1,
      pageSize: 15,
      searchField: 'phone',
      searchKey: `${phone}`,
    };
    const { setCRMMemberInfo, setMemberStatus } = this.props;
    const res = await searchCRMMember(searchParams);
    if (res.status === 200 && res.data.code === 0) {
      // 存在 -> 是会员
      if (res.data.data?.total > 0) {
        setCRMMemberInfo(res.data.data?.data?.[0]);
        // 只做记录
        setMemberStatus(false);
        posFrontLog(
          `login -phoneInput- -not NewMember- -CRM-  id: ${res.data.data?.data?.[0]?.id} --- userId: ${res.data.data?.data?.[0]?.userId} ---  
           phone: ${res.data.data?.data?.[0]?.phone} --- pointBalance: ${res.data.data?.data?.[0]?.pointBalance}`
        );
        return res.data.data?.data?.[0];
      }
      // 非会员 -> 注册
      setMemberStatus(true);
      return {};
    }
    this.showApiModalTip(res.data?.msg);
  };

  createCRM = async (phone) => {
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
  };

  fetchCRMMemberInfo = async (userId) => {
    const res = await getCRMMemberInfo(userId);
    if (res.status === 200 && res.data.code === 0) {
      this.props.setCRMMemberInfo(res.data.data);
      posFrontLog(
        `login -phoneInput- -CRM-  id: ${res.data.data?.id} --- userId: ${res.data.data?.userId} ---  
         phone: ${res.data.data?.phone} --- pointBalance: ${res.data.data?.pointBalance}`
      );
      return true;
    }
    this.showApiModalTip(res.data?.msg);
    return false;
  };

  // 新人礼配置
  fetchOnboardGiftRule = async () => {
    const {
      crm: { memberCRMInfo },
    } = this.props;
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

  handleGotoRewards = (useReplace = false) => {
    if (useReplace) {
      this.props.history.replace('./reward');
    } else {
      this.props.history.push('./reward');
    }
  };

  // 判断是否开通姓名，及后续操作
  judgeAfterOperation = async (onBeforeJudge) => {
    const { selfConfig, store, payByCash, saveOrderResult, systemConfig } =
      this.props;
    const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
    const needPayForCharge = judgeNeedPayOtherCharge();

    // 开通输入姓名(id: 1)
    if (selfConfig?.configMap?.id_1) {
      if (onBeforeJudge) {
        onBeforeJudge?.(() => this.props.history.push('./enterName'));
        return;
      }
      // 开通输入姓名
      this.props.history.push('./enterName');
    } else {
      // 未开通输入姓名
      // 计算总金额
      const totalAmount = calculateTotalAmount(store);

      // 只有免费菜并且没有其它加收项，或者总价为0
      if ((onlyHaveFreeItem && !needPayForCharge) || totalAmount === 0) {
        // 零金额订单处理流程-完成订单
        const handleOverOrder = async () => {
          const { userId: kioskConfigUserId } = this.props;
          this.setState({ loading: true });
          const result = await processZeroAmountOrder({
            store,
            payByCash,
            saveOrderResult,
            userId: null, // 将从 store 中获取
            checksum: null, // 将从 store 中获取
            kioskConfigUserId,
            onError: (errMsg) => {
              this.setState({ loading: false });
              this.showApiModalTip(errMsg);
            },
          });
          this.setState({ loading: false });
          // 如果订单提交成功，跳转到订单完成页
          if (result) {
            this.props.history.push('/orderFinish');
          }
          return;
        };

        this.judgeConfigToSoldout(() => {
          if (onBeforeJudge) {
            onBeforeJudge?.(() => {
              if (totalAmount === 0) {
                handleOverOrder();
              } else {
                this.props.history.push('/paymentType');
              }
            });
            return;
          }
          if (totalAmount === 0) {
            handleOverOrder();
          } else {
            this.props.history.push('/paymentType');
          }
        });
        // 使用 handlePaymentTypeRoute 判断支付方式路由
      } else {
        const paymentRouteResult = handlePaymentTypeRoute(
          systemConfig,
          selfConfig
        );

        if (paymentRouteResult.shouldSkipPaymentType) {
          // 跳过 paymentType，直接支付
          if (paymentRouteResult.canPayByCard) {
            // 只开通卡支付
            this.props.payByCard();
            // 是否开通小费（id:5）
            if (
              isTipEnabledForPaymentType(
                selfConfig,
                'CREDIT_CARD',
                this.props.systemConfig
              )
            ) {
              // 开通小费
              const fn = () => {
                const isPayFirst = selfConfig?.configList?.find(
                  (each) => each.id === 24
                )?.value === 1;
                if (isPayFirst) {
                  // 是否满足信用卡支付
                  this.judgeConfigToSoldout(() =>
                    this.judgeFillCardMinAmout(onBeforeJudge)
                  );
                } else {
                  this.props.history.push('/tippingPanel');
                }
              };

              if (onBeforeJudge) {
                onBeforeJudge(fn);
                return;
              }

              fn();
            } else {
              // 未开通小费，再判断售罄情况，再判断是否符合刷卡最低消费
              this.judgeConfigToSoldout(() =>
                this.judgeFillCardMinAmout(onBeforeJudge)
              );
            }
          } else if (paymentRouteResult.canPayByCash) {
            // 只开通现金支付 - 跳转到 paymentType
            const fn = () => {
              this.props.history.push('/paymentType');
            };

            if (onBeforeJudge) {
              onBeforeJudge(fn);
              return;
            }

            fn();
          }
        } else {
          // 多种支付方式或有 ecard，进入 paymentType 选择
          const fn = () => {
            pushPaymentMethodEntry(
              this.props.history,
              selfConfig,
              systemConfig
            );
          };

          if (onBeforeJudge) {
            onBeforeJudge(fn);
            return;
          }

          fn();
        }
      }
    }
  };

  // 判断是否满足刷卡最低消费金额
  judgeFillCardMinAmout = (onBeforeJudge) => {
    if (calcCardMinAmout()) {
      this.setState({
        isShowCardMinModal: true,
        currentAmount: calcCardMinAmout(),
      });
    } else {
      if (onBeforeJudge) {
        onBeforeJudge?.(() => this.props.history.push('/cardPayment'));
        return;
      }
      this.props.history.push('/cardPayment');
    }
  };

  // 刷卡不足最小金额后，返回并继续点单
  handleContinueOrder = () => {
    this.setState({ isShowCardMinModal: false });
    this.reorder(true);
  };
  // 刷卡不足最小金额后，关闭弹框
  handleCloseMin = () => {
    this.setState({ isShowCardMinModal: false });
  };

  // 返回orderPage，重新点单
  reorder = (immediateBack = false) => {
    if (!immediateBack) {
      if (this?.state?.dishMap?.allSoldIds?.length) {
        this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
      }
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    this.props.setIsReorderFlag(true);
    setTimeout(() => {
      this.backBtnHandler();
    }, 0);
  };

  // 仍然下单
  continueReorder = () => {
    const { currentOrder } = this.props;
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    setTimeout(() => {
      // 判断之前提交订单，是否输入手机号
      if (
        currentOrder.customer.phone[0]?.number &&
        currentOrder.customer.phone[0]?.id
      ) {
        this.savePhoneNumber(this.state.saveNumber);
      } else {
        // 重置手机号
        const resetPhone = {
          phone: [{}],
        };
        this.props.customer(resetPhone);
        this.judgeAfterOperation();
      }
    }, 0);
  };

  componentDidMount() {
    this.handleGetPointRule();
    const {
      isReorderFlag,
      crm: { memberCRMInfo, loginType },
      history,
    } = this.props;

    // 若从上一个页面返回，传来的重新下单状态为true，则继续返回
    if (isReorderFlag) {
      this.backBtnHandler();
      return;
    }

    // 如果已有会员信息，跳过此页面
    if (memberCRMInfo && Object.keys(memberCRMInfo)?.length > 0) {
      // 如果是通过返回操作（goBack 或浏览器返回按钮）到达此页面的，直接返回上一页
      if (history.action === 'POP') {
        this.backBtnHandler();
        return;
      }
      this.setState({
        loading: true,
      });
      // 在跳过页面之前，先保存客户信息
      this.handleSkipWithCustomerInfo(memberCRMInfo);
      return;
    }

    this.handleGetDefaultPhone();

    // // 初始化键盘状态
    // this.setState({
    //   keyboardToggle: isOpenVtkeyboadrd() && !this.getIsVertical(),
    // });

    const isLogin = Object.keys(memberCRMInfo)?.length > 0;
    // 初始化隐私条款选中状态(已登录或随配置)
    const privacyConfirm = isLogin || this.props.selfConfig?.configMap?.id_49;
    this.setState({
      isPrivacyConfirm: privacyConfirm,
    });

    syncLandscapeKeyboardManager(this, () => this.phoneInputRef);
    this.unsubscribeOrientation = subscribeDeviceOrientation(
      this.handleOrientationChange
    );
  }

  // 被动登陆前 查询新的积积分接口
  handleGetPointRule = async () => {
    const res = await getPointRule();
    try {
      if (res.status === 200 && res.data.code === 0) {
        const { data } = res.data;
        const pointRule = data?.[0];
        if (!pointRule) return;
        const earningRule = {
          earningStrategy:
            pointRule?.rule?.strategy === 'byAmountSpent'
              ? 1
              : pointRule?.rule?.strategy === 'byItemQuantity'
                ? 3
                : 2,
          parameters: pointRule.rule.parameters,
          minimunPurchase: pointRule.minimunPurchase,
          includeTax: pointRule.spentAmountIncludeTax.enabled,
          expiration: pointRule.expiration,
          rounding: 1,
        };
        if (pointRule?.roundingPoints?.enabled) {
          const allRoundType = ['Round off', 'Round up', 'Round down'];
          const roundType = pointRule.roundingPoints.roundingType;
          const typeIdx = allRoundType.findIndex((each) => each === roundType);
          earningRule.rounding = typeIdx + 1;
        }
        if (pointRule?.rule?.strategy === 'byItemQuantity') {
          earningRule.eligibleCondition =
            pointRule?.eligibility?.condition === 'ALL'
              ? 1
              : pointRule?.eligibility?.condition === 'SELECTED'
                ? 2
                : 3;
          earningRule.eligibleFreeItems =
            !!pointRule?.freeItemEligibleEarnPoints?.enabled;
          earningRule.eligibleCategories =
            pointRule?.eligibility?.objects?.categories.map((item) => {
              return {
                id: item.menuCategoryId,
                orderType: item.orderType,
                merchantId: item.merchantId,
              };
            });
          earningRule.eligibleItems = pointRule?.eligibility?.objects?.items;
        }
        this.props.setEarnRule(earningRule);
      }
    } catch (error) {
      console.log(error);
    }
  };

  handleGetDefaultPhone = () => {
    const {
      crm: { memberCRMInfo },
      allSysConfig,
    } = this.props;
    const isCRMDisabled = checkCRMStatus(allSysConfig);
    if (!isCRMDisabled && memberCRMInfo?.phone) {
      const formattedPhone = formatUSPhoneInput(
        memberCRMInfo.phone?.slice(-10)
      );
      this.setState({
        customNumber: formattedPhone,
        isPhoneValid: isValidUSPhone(formattedPhone),
      });
    }
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.unsubscribeOrientation) {
      this.unsubscribeOrientation();
    }
    if (this.keyboardManager) {
      this.keyboardManager.cleanup();
    }
  }

  changePrivacyConfirm = (v) => {
    this.setState({
      isPrivacyConfirm: v,
    });
  };

  onPhoneChange = (nextFormattedValue) => {
    this.setState({
      customNumber: nextFormattedValue,
      isPhoneValid: isValidUSPhone(nextFormattedValue),
    });
  };

  handleKeyUp = async (e) => {
    if (e.keyCode === 13) {
      this.handleContinue();
    }
  };

  // 是否跳转兑换页
  goRewardAble = (crmRes) => {
    const {
      store,
      currentOrder,
      crm: {
        memberCRMInfo,
        isNewMember,
        rewardRule,
        selectedDiscount,
        selectedFreeItem,
        tempCampaign,
      },
      allSysConfig,
      promotion: { buyGifts, itemValidPromotion },
      avocado: { hasAssertList },
    } = this.props;
    const hasFreeItemInOrder = currentOrder.itemList.find((_) => _.isFreeItem);
    const hasFreeItemCampaign = selectedFreeItem?.length > 0;
    const hasCampaignDiscount = Object.keys(selectedDiscount)?.length > 0;
    const hasBundleDiscountOrSpecialItem = tempCampaign?.find((each) =>
      ['setPrice', 'orderItemFixedPriceCoupon'].includes(
        each.rewardRule.redeemRule.strategy
      )
    );

    const hasCampaign =
      hasFreeItemInOrder ||
      hasFreeItemCampaign ||
      hasCampaignDiscount ||
      hasBundleDiscountOrSpecialItem;
    let goReward = false;

    // 促销中心
    const validSelectedPromotion = itemValidPromotion?.find(
      (e) => e.isSelected
    );
    // 如果有本地promotion相关选择 不跳reward页
    const promotionItem = currentOrder.itemList.find(
      (_) => _.discountID === -1 && _.discountName === 'promotion discount'
    );

    if (promotionItem || buyGifts?.length > 0 || validSelectedPromotion) {
      return goReward;
    }
    const orderInfo = getOrderInfoObj(store);
    if (orderInfo.promotionDiscountInfo) {
      return goReward;
    }

    const crmType = checkCRMType(allSysConfig);

    //(crm) 未兑换过商品、不是新会员、是新会员且有积分，三种情况跳转兑换选择页;
    // 当前积分不足最小point时，跳过兑换页
    if (crmType === 1) {
      // 过滤kiosk产品线和折扣券
      const discountRuleSet = ['byPercentageOff', 'byFixedAmount'];
      const kioskReward = rewardRule.filter(
        (_) =>
          _?.redeemRule?.parameters?.freeItemPool?.objects?.items?.filter(
            (ruleItem) => ruleItem?.orderType === 'KIOSK'
          ).length > 0 || discountRuleSet.includes(_.redeemRule.strategy)
      );
      // 最小的point
      const lowestPointNumber = kioskReward.reduce((min, item) => {
        const points = item?.redeemRule?.parameters?.points;
        if (points === undefined) return min; // 如果没有points，跳过
        return points < min ? points : min;
      }, kioskReward[0]?.redeemRule?.parameters?.points || 0);

      goReward =
        !hasCampaign &&
        (!isNewMember ||
          (typeof crmRes === 'object' && Object.keys(crmRes)?.length > 0) ||
          (isNewMember && memberCRMInfo?.pointBalance > 0));
      // && lowestPointNumber <= memberCRMInfo?.pointBalance; //先做全量展示，不做不满足积分要求的阻拦
    }

    // (ad) 跳转兑换页(在兑换页判断是否需要继续跳转) 没有兑换商品且有资产情况
    if (crmType === 2) {
      goReward = !hasCampaign && hasAssertList;
    }

    return goReward;
  };

  // 跳过输入手机号（已有会员信息且是主动登录时调用）
  handleSkipWithCustomerInfo = async (memberCRMInfo) => {
    const { changeIgnoreReward } = this.props;
    // 从会员信息中获取手机号（取后10位）
    const phoneNumber = memberCRMInfo?.phone;
    if (!phoneNumber) {
      // 如果没有手机号，执行普通跳过逻辑
      this.handleSkip();
      return;
    }

    // 保存客户信息到订单（取后10位数字）
    const phone = phoneNumber.slice(-10).replace(/\D/g, '');
    if (phone.length !== 10) {
      // 如果手机号格式不正确，执行普通跳过逻辑
      this.handleSkip();
      return;
    }
    const success = await this.saveCustomerInfoToOrder(phone);

    if (!success) {
      // 如果保存失败，执行普通跳过逻辑
      this.handleSkip();
      return;
    }

    // 检查是否首次下单
    await this.checkIsMemberOrderedBefore(phone);

    // 判断后续操作
    const goReward = this.goRewardAble(memberCRMInfo);
    const onBeforeJudge = (onNewMemberGo) => {
      if (goReward) {
        changeIgnoreReward(false);
        // 使用 replace 避免 PhoneInput 页面留在历史栈中
        this.handleGotoRewards(true);
        return;
      }
      onNewMemberGo();
    };
    this.judgeAfterOperation(onBeforeJudge);
  };

  // 跳过输入手机号
  handleSkip = () => {
    const {
      crm: { memberCRMInfo },
      currentOrder,
      changeIgnoreReward,
    } = this.props;
    // 只清空手机号
    const resetPhone = cloneDeep(currentOrder.customer);
    resetPhone.phone = [{}];
    this.props.customer(resetPhone);

    const goReward = this.goRewardAble(memberCRMInfo);

    const onBeforeJudge = (onNewMemberGo) => {
      if (goReward) {
        changeIgnoreReward(false);
        this.handleGotoRewards();
        return;
      }
      onNewMemberGo();
    };
    this.judgeAfterOperation(onBeforeJudge);
  };

  handleContinue = () => {
    const { t } = this.props;
    const { isPrivacyConfirm, isPhoneValid, customNumber } = this.state;
    if (!isPrivacyConfirm) return Toast.info(t('confirm-policy'), 2000);
    const val = normalizePhoneDigits(customNumber);
    if (isPhoneValid) {
      this.setState({ saveNumber: val }, () => {
        this.savePhoneNumber(val);
      });
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
      t,
      selfConfig,
      crm: { loginType, onboardGiftRule, memberCRMInfo },
    } = this.props;
    const {
      customNumber,
      errorLoading,
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      isPrivacyConfirm,
      loading,
      isPhoneValid,
      keyboardToggle,
    } = this.state;

    const isVertical = this.state.deviceOrientation === 'vertical';

    // 手机号是否必填（id:12）
    const isRequire = selfConfig?.configMap?.id_12;

    const isCRMDisabled = checkCRMStatus(this.props.allSysConfig);

    const title = (
      <>
        <span>{t('input-phone-SMS-0')}</span>
        {!isCRMDisabled && loginType !== 'active' && (
          <span>{t('input-phone-SMS-1')}</span>
        )}
      </>
    );

    const actions = (
      <>
        {!isRequire && (
          <div className={styles.never} onClick={this.handleSkip}>
            {t('skip')}
          </div>
        )}
        <div
          className={[
            isPhoneValid && isPrivacyConfirm
              ? `${styles.btnConfirm} linear-animate-btn`
              : styles.btnNoConfirm,
          ].join(' ')}
          onClick={this.handleContinue}
        >
          {t('confirm')}
        </div>
      </>
    );

    return (
      <div
        className={styles.phoneInputPage}
        style={{
          visibility: this.props.isReorderFlag ? 'hidden' : 'visible',
        }}
      >
        <div
          className={styles.numPadContainer}
          style={{
            visibility:
              memberCRMInfo && Object.keys(memberCRMInfo)?.length > 0
                ? 'hidden'
                : 'visible',
          }}
        >
          {/* <div className={styles.tipsMsgTitle}>{t('text-msg-to')}</div> */}
          <PhoneNumberEntryLayout
            title={title}
            value={customNumber}
            placeholder={t('inputPhone')}
            inputRef={(el) => (this.phoneInputRef = el)}
            isVertical={isVertical}
            onPhoneChange={this.onPhoneChange}
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

        {/* <BackIcon clickHandler={this.backBtnHandler}></BackIcon> */}
        {/* 新人礼· */}
        <NewMemberGift
          visible={this.state.showNewMemberGift}
          onboardGiftRule={onboardGiftRule}
          handleConfirm={this.handleCloseNewMemberGift}
        />

        <Loading visible={loading} />
        {/* 发送失败提示 */}
        <Dialog
          visible={errorLoading}
          html={
            <div
              className={styles.containerBox}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.itemBox}>
                <div className={styles.itemName}>{t('order-create-fail')}</div>
                <div className={styles.subItemName}>
                  {t('order-create-sub-fail')}
                </div>
              </div>
              <div className={styles.btnBox}>
                <span onClick={this.handleCancel}>{t('cancel-order')}</span>
                <span onClick={this.handleRetry} className="linear-animate-btn">
                  {t('order-retry')}
                </span>
              </div>
            </div>
          }
          onClose={this.handleCancel}
        />

        {isHasSoldoutDish ? (
          <SoldoutModal
            isHasSoldoutDish={isHasSoldoutDish}
            dishMap={dishMap}
            reorder={this.reorder}
            continueReorder={this.continueReorder}
          />
        ) : null}

        {/* 刷卡最低消费弹框 */}
        {isShowCardMinModal ? (
          <CardMinAmount
            isShowCardMinModal={isShowCardMinModal}
            currentAmount={currentAmount}
            handleContinueOrder={this.handleContinueOrder}
            handleCloseMin={this.handleCloseMin}
          />
        ) : null}

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={customNumber}
            handlePressEnter={this.handleContinue}
            changeInput={(v) => this.onPhoneChange(v)}
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
    store: state,
    currentOrder: state.currentOrder,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    isReorderFlag: state.orderEdit.isReorderFlag,
    allSysConfig: state.allSysConfig,
    crm: state.crm,
    merchantProfile: state.merchantProfile,
    promotion: state.promotion,
    avocado: state.avocado,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    customer,
    payByCard,
    payByCash,
    spliceOrderBySoldout,
    setIsReorderFlag,
    setSelfConfig,
    setCRMMemberInfo,
    setMemberStatus,
    changeIgnoreReward,
    changeLoginType,
    setLanModal,
    setEarnRule,
    setOnboardGiftRule,
    setCustomerVouchers,
    setCRMCustomerInfo,
    setIsMemberOrderedBefore,
    saveOrderResult,
  })(withTranslation()(PhoneInput))
);
