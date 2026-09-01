import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Trans, withTranslation } from 'react-i18next';
import styles from './Reward.module.scss';
import {
  changeFreeItem,
  changeIgnoreReward,
  changeSelectedDiscount,
  changeLoginType,
  setTempCampaign,
} from '@/actions/crm_action';
import {
  payByCash,
  saveOrderResult,
  removeFreeItemInOrder,
  removeItemRewardInfoFromOrder,
  removeRewardItemFromList,
} from '@/actions';
import checkCRMType from '@/utils/checkCRMType';
import CRMReward from './CRMReward';
import AdReward from './AdReward';
import SelectedRewards from './SelectedRewards';
import SendAuthCode from '@/component/CRM/LoginCRM/components/SendAuthCode';
import Dialog from '@/component/dialog';
import Toast from '@/component/toast';
import Loading from '@/component/loading';
import {
  calculateTotalAmount,
  processZeroAmountOrder,
} from '@/utils/processZeroAmountOrder';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import store from '@/reducers/store';

class Reward extends Component {
  state = {
    crmType: 0,
    AuthCodeVisible: false,
    hasAdReward: false,
    loading: false,
  };

  async componentDidMount() {
    const {
      crm: { isIgnoreReward },
      allSysConfig,
      isReorderFlag,
    } = this.props;
    // 后退到活动页，如果没有活动 则继续后退
    if (isIgnoreReward || isReorderFlag) {
      this.backToPhoneInput();
      return;
    }
    const crmType = checkCRMType(allSysConfig);
    this.setState({ crmType });
  }

  // 删除crm相关信息
  removeCRMCampaign = () => {
    const {
      changeFreeItem,
      changeSelectedDiscount,
      setTempCampaign,
      removeFreeItemInOrder,
      removeItemRewardInfoFromOrder,
      removeRewardItemFromList,
      currentOrder: { itemList },
    } = this.props;
    setTempCampaign(null);
    changeFreeItem([]);
    changeSelectedDiscount({});
    // 删除奖励菜品
    removeRewardItemFromList();
    // 删除菜品上的discountList信息
    removeItemRewardInfoFromOrder();
    //删除购物车里 M件N折、特价优惠 积分菜单添加的免费兑换 的商品
    const rewardItemInOrder = itemList.find((each) => each.isFreeItem);
    if (rewardItemInOrder) {
      removeFreeItemInOrder({
        freeItemId: rewardItemInOrder.id,
      });
    }
  };

  initStatus = () => {
    const {
      changeIgnoreReward,
      crm: { memberCRMInfo },
    } = this.props;
    const { crmType, hasAdReward } = this.state;
    // 重置 有无活动状态，
    let hasReward = false;
    if (crmType === 1) {
      hasReward = Object.keys(memberCRMInfo).length;
    }
    if (crmType === 2) {
      hasReward = hasAdReward;
    }
    changeIgnoreReward(!hasReward);
    this.removeCRMCampaign();
  };

  backToPhoneInput = () => {
    const { history } = this.props;
    this.initStatus();
    history.goBack();
  };

  handleSkip = () => {
    this.initStatus();
    // 使用 setTimeout 确保 Redux 状态更新完成后再执行 onNextStep
    setTimeout(() => {
      this.onNextStep();
    }, 0);
  };

  handleConfirm = () => {
    const {
      selfConfig,
      crm: { loginType, tempCampaign },
      t,
    } = this.props;
    if (!tempCampaign || !tempCampaign?.length)
      return Toast.info(t('select_goods'), 2000);
    const isNeedAuthCode = selfConfig?.configList?.find(
      (each) => each.id === 37
    )?.value;
    if (loginType === 'passive' && isNeedAuthCode) {
      this.setState({
        AuthCodeVisible: true,
      });
      return;
    }
    this.onNextStep();
  };

  adInitFinished = (hasReward) => {
    this.setState({
      hasAdReward: hasReward,
    });
    if (!hasReward) {
      this.handleSkip();
    }
  };

  onNextStep = async () => {
    const {
      history,
      selfConfig,
      systemConfig,
      changeFreeItem,
      changeSelectedDiscount,
      store: storeState,
    } = this.props;
    // 直接从 store 实例读取最新的 tempCampaign，确保获取到更新后的值
    // 因为 props 中的 store 是 state 快照，可能不是最新的
    const tempCampaign = store.getState().crm?.tempCampaign;
    const selectedCampaign = tempCampaign?.[0];
    if (selectedCampaign) {
      const campaignType = selectedCampaign.rewardRule?.redeemRule.strategy;
      if (campaignType === 'byFreeItem') {
        changeFreeItem([selectedCampaign]);
      } else if (['byPercentageOff', 'byFixedAmount'].includes(campaignType)) {
        changeSelectedDiscount(selectedCampaign);
      }
    }
    if (selfConfig?.configMap?.id_1) {
      history.push('./enterName');
      return;
    }

    // 使用 handlePaymentTypeRoute 判断支付方式路由
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);

    if (paymentRouteResult.shouldSkipPaymentType) {
      // 跳过 paymentType，直接支付
      if (paymentRouteResult.canPayByCard) {
        // 只开通卡支付
        // 计算总金额
        const totalAmount = calculateTotalAmount(storeState);
        // 如果总价为0，使用零金额订单处理流程
        if (totalAmount === 0) {
          const { userId: kioskConfigUserId } = this.props;
          this.setState({ loading: true });
          const result = await processZeroAmountOrder({
            store: storeState,
            payByCash: this.props.payByCash,
            saveOrderResult: this.props.saveOrderResult,
            userId: null, // 将从 store 中获取
            checksum: null, // 将从 store 中获取
            kioskConfigUserId,
            onError: (errMsg) => {
              this.setState({ loading: false });
              Toast.info(errMsg, 2000);
            },
          });
          this.setState({ loading: false });
          // 如果订单提交成功，跳转到订单完成页
          if (result) {
            history.push('/orderFinish');
          }
          return;
        }

        if (selfConfig?.configMap?.id_5) {
          // 区分刷卡前小费
          const isPayFirst = selfConfig?.configList?.find(
            (each) => each.id === 24
          )?.value;
          if (isPayFirst) {
            history.push('/cardPayment');
          } else {
            history.push('/tippingPanel');
          }
          return;
        }
        history.push('/cardPayment');
        return;
      } else if (paymentRouteResult.canPayByCash) {
        // 只开通现金支付 - 跳转到 paymentType
        history.push('/paymentType');
        return;
      }
    }

    // 多种支付方式或有 ecard，进入 paymentType 选择
    history.push('/paymentType');
  };

  // 兑换按钮不同情况
  renderSelectedBtn = () => {
    const {
      crm: { tempCampaign },
      t,
    } = this.props;

    // 未选中商品 按钮状态
    if (!tempCampaign || !tempCampaign?.length) {
      return (
        <div className={styles.btnNotConfirm} onClick={this.handleConfirm}>
          {t('select_to_redeem')}
        </div>
      );
    }

    const selectedCampaign = tempCampaign?.[0];
    const costPoints =
      selectedCampaign?.rewardRule?.redeemRule?.parameters?.points ||
      selectedCampaign?.redeemRule?.parameters?.points ||
      0;
    return (
      <div
        className={`${styles.selectedBtn} linear-animate-btn`}
        onClick={this.handleConfirm}
      >
        {selectedCampaign?.rewardRule?.rewardType !== 'voucher' ? (
          <Trans
            i18nKey="redeem_cost_points"
            values={{ points: costPoints }}
            components={{
              star: <span className={styles.star}></span>,
            }}
          />
        ) : (
          t('membership-point-redeem-menu')
        )}
      </div>
    );
  };

  render() {
    const {
      crm: { memberCRMInfo, tempCampaign },
      changeLoginType,
      t,
    } = this.props;
    const { AuthCodeVisible, crmType } = this.state;
    const phoneNum = memberCRMInfo?.phone?.slice(-10);

    return (
      <div className={styles.rewardContainer}>
        {crmType === 1 ? (
          <CRMReward crmType={crmType} onNextStep={this.onNextStep} />
        ) : crmType === 2 ? (
          <AdReward crmType={crmType} adInitFinished={this.adInitFinished} />
        ) : null}

        <div className={styles.bottom}>
          <div className={styles.skipBtn} onClick={this.handleSkip}>
            {t('skip')}
          </div>
          {this.renderSelectedBtn()}
        </div>

        {/* 已选中 */}
        {tempCampaign?.length > 0 && <SelectedRewards />}

        {/* 验证码 */}
        <Dialog
          visible={AuthCodeVisible}
          html={
            <SendAuthCode
              t={t}
              phoneNum={phoneNum}
              goBackStep={() => {
                this.setState({
                  AuthCodeVisible: false,
                });
              }}
              onVerifySuccess={() => {
                changeLoginType('active');
              }}
            />
          }
        />

        <Loading visible={this.state.loading} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    crm: state.crm,
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    allSysConfig: state.allSysConfig,
    userId: state.sysCookie.kioskConfigUserId,
    currentOrder: state.currentOrder,
    isReorderFlag: state.orderEdit.isReorderFlag,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    changeIgnoreReward,
    changeSelectedDiscount,
    changeFreeItem,
    setTempCampaign,
    removeFreeItemInOrder,
    removeItemRewardInfoFromOrder,
    removeRewardItemFromList,
    changeLoginType,
    payByCash,
    saveOrderResult,
  })(withTranslation()(Reward))
);
