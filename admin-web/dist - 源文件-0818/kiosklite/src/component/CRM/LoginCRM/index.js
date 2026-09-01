import React, { useEffect, useMemo, useRef, useState } from 'react';
import { withRouter } from 'react-router-dom';
import styles from './index.module.scss';
import LoginModal from './components/LoginModal';
import NewMemberGift from './components/NewMemberGift';
import { connect } from 'react-redux';
import {
  changeBarVisible,
  changeFreeItem,
  changeIgnoreReward,
  changeLoginType,
  setCRMAuthCodeVerified,
  changeSelectedDiscount,
  setCRMMemberInfo,
  setEarnRule,
  setMemberStatus,
  setRewardRule,
  setOnboardGiftRule,
  setIsMemberOrderedBefore,
  setTempCampaign,
} from '@/actions/crm_action';
import {
  getPointRule,
  listStaff,
  searchRewardRule,
} from '@/api/kioskConfigApi';
import checkCRMStatus from '@/utils/checkCRMStatus';
import { withTranslation } from 'react-i18next';
import { getKioskConfigFromPos, saveKioskConfigFromPos } from '@/api/apiPos';
import { parseLicenseXml } from '@/utils/parseLicenseXml';
import checkCRMType from '@/utils/checkCRMType';
import { XMLObjTree } from '@/utils/ObjectTree';
import {
  setADOutletInfo,
  setCommitId,
  setOrderRewardId,
  setThirdPartyCommitId,
  setCRMIntegrationRewards,
  setCustomerVouchers,
  setSDKMeta,
  setCRMCustomerInfo,
  setNeedCommit,
  setAssertListStatus,
} from '@/actions/avocado';
import { EventBus } from '@/utils/EventBus';
import Dialog from '@/component/dialog';
import LoginBanner from './components/LoginBanner';
import RewardBanner from './components/RewardBanner';
import crmIntegration from '@/api/crm-integration';
import useReward from '@/hooks/useReward';
import { posFrontLog } from '@/api';

const SHOW_LOGIN_ROUTE = [
  // '/orderType',
  '/orderPage',
  '/orderReview',
  // '/reward',
];
// pos迁移的功能的key值
const keysList = [
  'CHOOSE_ORDER_TYPE',
  'KIOSK_SEND_MESSAGE',
  'KIOSK_PAYMENT_TYPE',
];

const LoginCRM = (props) => {
  const {
    t,
    crm: { isShowLoginBar, memberCRMInfo, onboardGiftRule, rewardRule },
    menuGroup,
    comboMenu,
    currentOrder,
    setEarnRule,
    setMemberStatus,
    setCRMMemberInfo,
    changeLoginType,
    selfConfig,
    allSysConfig,
    changeFreeItem,
    changeSelectedDiscount,
    changeBarVisible,
    setCommitId,
    setOrderRewardId,
    setThirdPartyCommitId,
    setOnboardGiftRule,
    setCRMIntegrationRewards,
    setCustomerVouchers,
    setSDKMeta,
    merchantProfile,
    setADOutletInfo,
    setCRMCustomerInfo,
    setNeedCommit,
    setIsMemberOrderedBefore,
    avocado,
    setTempCampaign,
    setAssertListStatus,
  } = props;
  const { rewards, vouchers, metaData } = avocado;
  const [isInShowRoute, setIsInShowRoute] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [showNewMemberGift, setShowNewMemberGift] = useState(false);
  const [rewardList, setRewardList] = useState([]);
  const [voucherList, setVoucherList] = useState([]);
  const metaRef = useRef(null);

  const { rewardList: hookRewardList, voucherList: hookVoucherList } =
    useReward({
      rewards,
      vouchers,
      allSysConfig,
      menuGroup,
      comboMenu,
      metaData,
      rewardRule,
      currentOrder,
    });

  const getPosDetail = () => {
    return new Promise((resolve, reject) => {
      getKioskConfigFromPos()
        .then((res) => {
          const list = [];
          let r = res.data ? parseLicenseXml(res.data) || [] : [];
          if (r?.length) {
            keysList.forEach((k, i) => {
              let result = r.find((item) => item.name === k);
              if (result) {
                switch (i) {
                  case 0:
                  case 2:
                    let newArr = [];
                    let arr = String(result.value).split(',');
                    arr.forEach((t) => {
                      if (t !== '' && t !== 'undefined' && t !== 'null') {
                        newArr.push(t);
                      }
                    });
                    list.push({
                      'app:id': result.id,
                      'app:name': result.name,
                      'app:value': String(newArr.join(',')),
                      'app:dataType': 'String',
                    });
                    break;
                  case 1:
                    list.push({
                      'app:id': result.id,
                      'app:name': result.name,
                      'app:value': String(result.value),
                      'app:dataType': 'Boolean',
                    });
                    break;
                }
              }
            });
          }
          return resolve(list);
        })
        .catch(() => {
          reject('error');
        });
    });
  };

  const savePosDetail = async (posConfigList) => {
    let str = '';
    const res = await listStaff();
    let staffList = [];
    if (res?.data?.data) {
      staffList = res?.data?.data?.staff;
    }
    return new Promise((resolve, reject) => {
      posConfigList.forEach((item) => {
        str += `<app:systemConfiguration><app:id>${item['app:id']}</app:id><app:name>${item['app:name']}</app:name><app:value>${item['app:value']}</app:value><app:dataType>${item['app:dataType']}</app:dataType></app:systemConfiguration>`;
      });
      if (!str || !staffList?.length) return;
      const userId = staffList[0]?.user?.id;
      saveKioskConfigFromPos(str, userId).then((res) => {
        let findAppInstances = res.data;
        try {
          let start = findAppInstances?.indexOf('<soap:Body>');
          let end = findAppInstances?.indexOf('</soap:Body>');
          findAppInstances = findAppInstances?.substring(start + 11, end);
          let objTree = new XMLObjTree();
          let instanceList = objTree?.parseXML(findAppInstances);
          let r = instanceList?.updatesystemconfigurationresponsetype?.result;
          if (r.successful === 'true') {
            resolve(r);
          } else {
            reject('err');
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  };

  const handleGetConfigInfo = async () => {
    try {
      const res = await getPosDetail();
      const kioskSendMessage = res.find(
        (config) => config['app:name'] === 'KIOSK_SEND_MESSAGE'
      );
      if (kioskSendMessage['app:value'] === 'true') return;
      const newConfig = res.map((each) => {
        if (each['app:name'] === 'KIOSK_SEND_MESSAGE') {
          return {
            ...each,
            ['app:value']: 'true',
          };
        }
        return each;
      });
      await savePosDetail(newConfig);
    } catch (e) {
      console.log(e);
    }
  };

  const isCRMEnable = useMemo(() => {
    if (allSysConfig && Object.keys(allSysConfig).length) {
      return !checkCRMStatus(allSysConfig);
    }
    return false;
  }, [allSysConfig]);

  const crmType = useMemo(() => {
    if (isCRMEnable) {
      return checkCRMType(allSysConfig);
    }
    return 0;
  }, [isCRMEnable, allSysConfig]);

  const mid = useMemo(() => {
    return merchantProfile?.merchantId ?? null;
  }, [merchantProfile]);

  useEffect(() => {
    if (isCRMEnable && props.location.pathname === '/') {
      handleGetConfigInfo();
      // crm
      if (crmType === 1) {
        handleGetPointRule();
        handleGetRewardRule();
      }
      // ad
      if (crmType === 2 && mid) {
        initCRMIntegration();
      }
    }
    return () => {
      if (metaRef.current) {
        clearInterval(metaRef.current);
        metaRef.current = null;
      }
    };
  }, [isCRMEnable, crmType, mid, props.location.pathname]);

  const initCRMIntegration = async () => {
    crmIntegration.setMerchantId(mid);
    setADOutletInfo({
      enabled: 1,
    });
    await getMerchantReward();
    await getSDKMeta();
  };

  const getMerchantReward = async () => {
    const res = await crmIntegration.getMerchantReward();
    if (res.data?.success) {
      const rewards = res.data.data?.filter((each) =>
        each.couponTemplate?.validMerchantIds?.includes(mid)
      );
      setCRMIntegrationRewards(rewards || []);
    }
  };

  const getSDKMeta = () => {
    const queryFn = async () => {
      const res = await crmIntegration.getSDKMeta();
      if (res.data?.success) {
        setSDKMeta(res.data.data);
      }
    };
    queryFn();
    metaRef.current = setInterval(queryFn, 1000 * 60 * 30);
  };

  const handleGetPointRule = async () => {
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
        setEarnRule(earningRule);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetRewardRule = async () => {
    const { setRewardRule, changeIgnoreReward } = props;
    try {
      const res = await searchRewardRule();
      if (res.status === 200 && res.data.code === 0) {
        const rules = res.data.data || [];
        setRewardRule(rules);
        changeIgnoreReward(rules.length === 0);
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const countIsInShowRoute = () => {
    let tempShowBar = false;
    if (SHOW_LOGIN_ROUTE.includes(props.location.pathname)) {
      tempShowBar = true;
    }
    setIsInShowRoute(tempShowBar);
  };

  const handleClick = () => {
    setLoginModalVisible(true);
  };

  const loginModalHide = (res) => {
    setLoginModalVisible(false);
    if (
      res?.isNewMember &&
      ((res?.onboardGiftRule?.onboardGift &&
        res?.onboardGiftRule?.data?.[0]?.giftContent?.number > 0) ||
        res?.giftVoucher?.length > 0)
    ) {
      setShowNewMemberGift(true);
    } else {
      checkIsShowBanner();
    }
  };

  // 检查是否显示 banner 的方法 - 通过 EventBus 通知 orderPage
  const checkIsShowBanner = () => {
    EventBus.emit('show_banner_in_orderpage');
  };

  const isNeedAuthCode = useMemo(() => {
    return selfConfig?.configList?.find((each) => each.id === 37)?.value;
  }, [selfConfig]);

  const loginGuideBanner = useMemo(() => {
    return selfConfig?.configList?.find((each) => each.id === 45)?.value
      ?.banner;
  }, [selfConfig]);

  // 是否有资产或积分兑换活动；rewardRule->自研crm，vouchers、rewards->ad
  const assertList = useMemo(() => {
    const isRewardArray = Array.isArray(rewardList);
    const isVoucherArray = Array.isArray(voucherList);

    // 两个都不是数组时返回空数组
    if (!isRewardArray && !isVoucherArray) return [];
    const rewards = isRewardArray ? rewardList : [];
    const vouchers = isVoucherArray ? voucherList : [];

    return [...rewards, ...vouchers];
  }, [rewardList, voucherList]);

  const hasAssert = useMemo(() => {
    return assertList.length > 0;
  }, [assertList]);

  const handleAutoLogOut = () => {
    // 退出
    setCRMMemberInfo({});
    setCRMCustomerInfo(null);
    // 清除crm reward
    changeFreeItem([]);
    // 清除 discount
    changeSelectedDiscount({});
    setTempCampaign(null);
    setNeedCommit(false);
    // 重置登陆类型
    changeLoginType(null);
    setCRMAuthCodeVerified(false);
    // 清除ad兑换相关信息
    setCommitId(null);
    setOrderRewardId(null);
    setThirdPartyCommitId(null);
    // 清除crm新人礼配置信息
    setOnboardGiftRule({});
    setCustomerVouchers(null);
    posFrontLog(`log out index`);
  };

  useEffect(() => {
    EventBus.on('open_login_modal', () => handleClick());
    return () => {
      EventBus.off('open_login_modal');
    };
  }, [handleClick]);

  useEffect(() => {
    countIsInShowRoute();
    if (props.location.pathname === '/') {
      handleAutoLogOut();
    }
  }, [props.location.pathname]);

  useEffect(() => {
    // ad 资产
    setRewardList(hookRewardList || []);
    setVoucherList(hookVoucherList || []);
  }, [hookRewardList, hookVoucherList]);

  useEffect(() => {
    // 同步账户是否有资产
    setAssertListStatus(hasAssert);
  }, [hasAssert]);

  useEffect(() => {
    // 不在展示路由中，未开通CRM -> false
    const countIsShow = !(!isInShowRoute || !isCRMEnable);
    // 没登陆 没资产 没开kiosk本地引导广告开关时 也不展示bar
    const barInvisible =
      !memberCRMInfo.userId && !loginGuideBanner?.status && !hasAssert;
    changeBarVisible(countIsShow && !barInvisible);
  }, [isInShowRoute, isCRMEnable, memberCRMInfo, loginGuideBanner, hasAssert]);

  return (
    <>
      {isShowLoginBar && (
        <div className={`${styles.loginBar}`}>
          {/* 未登录 && kiosk开启了banner && 没有资产时,展示登录引导banner */}
          {!memberCRMInfo.userId && loginGuideBanner?.status && !hasAssert && (
            <LoginBanner handleConfirm={handleClick} />
          )}
          {(memberCRMInfo.userId || hasAssert) && (
            <RewardBanner handleConfirm={handleClick} assertList={assertList} />
          )}
        </div>
      )}

      <Dialog
        visible={loginModalVisible}
        html={
          <LoginModal
            t={t}
            setCustomerVouchers={setCustomerVouchers}
            changeLoginType={(loginType) => changeLoginType(loginType)}
            setCRMAuthCodeVerified={(isVerified) =>
              setCRMAuthCodeVerified(isVerified)
            }
            setMemberStatus={(isNewMember) => setMemberStatus(isNewMember)}
            setCRMMemberInfo={(memberInfo) => setCRMMemberInfo(memberInfo)}
            setOnboardGiftRule={(onboardGiftRule) =>
              setOnboardGiftRule(onboardGiftRule)
            }
            isNeedAuthCode={isNeedAuthCode}
            crmType={crmType}
            onClose={loginModalHide}
            setCRMCustomerInfo={setCRMCustomerInfo}
            setIsMemberOrderedBefore={setIsMemberOrderedBefore}
            selfConfig={selfConfig}
          />
        }
      />

      {isShowLoginBar && (
        <NewMemberGift
          visible={showNewMemberGift}
          onboardGiftRule={onboardGiftRule}
          handleConfirm={() => {
            checkIsShowBanner();
            setShowNewMemberGift(false);
          }}
        />
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    allSysConfig: state.allSysConfig,
    crm: state.crm,
    selfConfig: state.selfConfig,
    merchantProfile: state.merchantProfile,
    avocado: state.avocado,
    menuGroup: state.menuGroup,
    comboMenu: state.comboMenu,
    currentOrder: state.currentOrder,
  };
};

export default withRouter(
  connect(mapStateToProps, {
    changeBarVisible,
    setCRMMemberInfo,
    setEarnRule,
    setMemberStatus,
    changeLoginType,
    setCRMAuthCodeVerified,
    changeFreeItem,
    changeSelectedDiscount,
    setADOutletInfo,
    setCommitId,
    setOrderRewardId,
    setThirdPartyCommitId,
    changeIgnoreReward,
    setRewardRule,
    setOnboardGiftRule,
    setCRMIntegrationRewards,
    setCustomerVouchers,
    setSDKMeta,
    setCRMCustomerInfo,
    setNeedCommit,
    setIsMemberOrderedBefore,
    setTempCampaign,
    setAssertListStatus,
  })(withTranslation()(LoginCRM))
);
