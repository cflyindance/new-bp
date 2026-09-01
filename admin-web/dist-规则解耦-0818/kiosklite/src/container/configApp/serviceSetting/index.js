import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import styles from './serviceSetting.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import ConfigHeader from '@/component/configHeader';
import ConfigFooter from '@/component/configFooter';
import Toast from '@/component/toast';
import ServiceItem from './serviceItem';
import TransferPosSetting from './transferPosSetting';
import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
  fetchCompanyProfile,
} from '@/api/kioskConfigApi';
import { initCompanyParams, initConfigParams } from '@/actions';
import cloneDeep from 'lodash/cloneDeep';
import LeftCategory from './LeftCategory';
import { on, off, compare, getCookie } from '@/utils';
import {
  ensureAllSysConfigLoaded,
  fetchAndDispatchAllSysConfig,
  isCreditChargeEnabled,
} from '@/utils/allSysConfigHelper';
import { selfConfigList } from '@/constants/selfConfig';
import CONFIG_MAP_DETAIL from '@/constants/configDetailMap';
import InputPassword from '../InputPassword';
import { PASSWORD } from '@/constants/mockData';

class ServiceSetting extends Component {
  constructor() {
    super();
    this.state = {
      isLoad: true,
      msg: '',
      open: false,
      configList: [],
      kioskConfig: {},
      errorApiMsg: '',
      errorApiShow: false,
      leftCategoryVal: Object.keys(CONFIG_MAP_DETAIL)[0],
      authorization: false,
      showPassword: false,
      resolvePassword: null,
    };
    this.timer = null;
    this.posDetail = null;
    this.tipItemDetail = null;
    this.minAmoutItemDetail = null;
    this.tableClearItemDetail = null;
    this.waitingTimeItemDetail = null;
    this.waitingTimeRangeItemDetail = null;
    this.fontSizeItemDetail = null;
    this.fontBackgroundColorItemDetail = null;
    this.fontColorItemDetail = null;
    this.isComponentMounted = false;
  }

  openDetail = (ref) => {
    this.posDetail = ref;
  };

  openTipItemDetail = (ref) => {
    this.tipItemDetail = ref;
  };

  openMinItemDetail = (ref) => {
    this.minAmoutItemDetail = ref;
  };

  openTableClearItemDetail = (ref) => {
    this.tableClearItemDetail = ref;
  };

  openWaitingTimeItemDetail = (ref) => {
    this.waitingTimeItemDetail = ref;
  };

  openWaitingTimeRangeItemDetail = (ref) => {
    this.waitingTimeRangeItemDetail = ref;
  };

  openFontSizeItemDetail = (ref) => {
    this.fontSizeItemDetail = ref;
  };

  openFontBackgroundColorItemDetail = (ref) => {
    this.fontBackgroundColorItemDetail = ref;
  };

  openFontColorItemDetail = (ref) => {
    this.fontColorItemDetail = ref;
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

  // switch
  handleChange = (id, bool) => {
    const { t } = this.props;
    const { configList } = this.state;
    const newConfig = cloneDeep(configList);
    let i = newConfig?.findIndex((c) => c.id == id);
    if (i > -1) {
      if (
        id === 40 ||
        id === 44 ||
        id === 47 ||
        id === 61 ||
        id === 66 ||
        id === 69
      ) {
        if (id === 66 && !bool) {
          const langConfig = newConfig.find((c) => c.id === 10);
          if (!langConfig?.value || langConfig.value.length <= 1) {
            Toast.info(t('menu-name-bilingual-only-one-language'), 2000);
            return;
          }
        }
        newConfig[i].value = {
          ...newConfig[i].value,
          status: !bool,
        };
      } else {
        newConfig[i].value = !bool;
      }
    }

    // 子菜remark开的前提是 item remark要开启
    if (id === 30 && !bool) {
      const itemRemarkIdx = newConfig?.findIndex((c) => c.id === 3);
      if (!newConfig[itemRemarkIdx]?.value) {
        Toast.info(t('sub-dish-operation'), 1000);
        return;
      }
    }
    // brand list 作为首页的前提是 brand setting 开启
    if (id === 31 && !bool) {
      const brandSettingIdx = newConfig?.findIndex((c) => c.id === 26);
      if (!newConfig[brandSettingIdx]?.value) {
        Toast.info(t('brand-setting-operation'), 1000);
        return;
      }
    }
    if (id === 26 && bool) {
      const brandHomePageIdx = newConfig?.findIndex((c) => c.id === 31);
      newConfig[brandHomePageIdx].value = false;
    }
    if (id === 3 && bool) {
      const subDishConfigIdx = newConfig?.findIndex((c) => c.id === 30);
      newConfig[subDishConfigIdx].value = false;
    }
    if (id === 23 && !bool === false) {
      const paymentReceiptIndex = newConfig?.findIndex((c) => c.id === 7);
      newConfig[paymentReceiptIndex].value = 2;
    }
    if (id === 17 && !bool) {
      const menuDisplayPosition = newConfig?.find(
        (each) => each.id === 33
      ).value;
      if (menuDisplayPosition === 1) {
        Toast.info(t('display-group-name-error'), 2000);
        return;
      }
    }
    if (id === 39 && bool) {
      const autoClearTableIdx = newConfig?.findIndex((c) => c.id === 40);
      newConfig[autoClearTableIdx].value.status = false;
    }
    if (id === 40 && !bool) {
      const showChooseTablePageIdx = newConfig?.findIndex((c) => c.id === 39);
      const v = newConfig[showChooseTablePageIdx].value;
      if (v === false) {
        Toast.info(t('auto-clear-table-error'), 2000);
        return;
      }
    }

    // 关闭具体金额展示开关 小费必须是百分比方式
    if (id === 55 && bool) {
      const tipCollectMethod = newConfig?.find((c) => c.id === 14).value[0];
      if (tipCollectMethod === 1) {
        Toast.info(t('tip-price-detail-cannot-close'), 1000);
        return;
      }
    }
    this.setState({
      configList: newConfig,
    });
  };

  handleChangeDishDetailIds = (id, dishIds) => {
    const { configList } = this.state;
    const newConfig = cloneDeep(configList);
    const i = newConfig?.findIndex((c) => c.id == id);
    if (
      i > -1 &&
      newConfig[i].value &&
      typeof newConfig[i].value === 'object'
    ) {
      newConfig[i].value = {
        ...newConfig[i].value,
        dishIds: Array.isArray(dishIds) ? dishIds : [],
      };
      this.setState({ configList: newConfig });
    }
  };

  handleChangeConfigValue = (id, value) => {
    const { configList } = this.state;
    const newConfig = cloneDeep(configList);
    const i = newConfig?.findIndex((c) => c.id === id);

    if (i > -1) {
      newConfig[i].value = value;
      this.setState({ configList: newConfig });
    }
  };

  handleChangeMenuNameDisplayLangs = (langCode) => {
    const { configList } = this.state;
    const newConfig = cloneDeep(configList);
    const i = newConfig?.findIndex((c) => c.id === 66);
    const langOptions = newConfig.find((c) => c.id === 10)?.value || [];

    if (i < 0 || !langOptions.includes(langCode)) {
      return;
    }

    const currentValue = newConfig[i].value || {};
    let displayLangs = [...(currentValue.displayLangs || [])];
    const idx = displayLangs.indexOf(langCode);

    if (idx > -1) {
      displayLangs.splice(idx, 1);
    } else if (displayLangs.length < 2) {
      displayLangs.push(langCode);
    } else {
      return;
    }

    let primaryLang = currentValue.primaryLang || '';
    if (!displayLangs.length) {
      primaryLang = '';
    } else if (!displayLangs.includes(primaryLang)) {
      primaryLang = displayLangs[0];
    }

    newConfig[i].value = {
      ...currentValue,
      displayLangs,
      primaryLang,
    };
    this.setState({ configList: newConfig });
  };

  handleChangeMenuNamePrimaryLang = (langCode) => {
    const { configList } = this.state;
    const newConfig = cloneDeep(configList);
    const i = newConfig?.findIndex((c) => c.id === 66);

    if (i < 0) {
      return;
    }

    const currentValue = newConfig[i].value || {};
    const displayLangs = currentValue.displayLangs || [];

    if (!displayLangs.includes(langCode)) {
      return;
    }

    newConfig[i].value = {
      ...currentValue,
      primaryLang: langCode,
    };
    this.setState({ configList: newConfig });
  };

  // checkbox
  handleChangeBox = (id, e) => {
    const { configList } = this.state;
    let i = configList?.findIndex((c) => c.id == id);
    if (i > -1) {
      let arr = configList[i].value;
      let idx = arr?.indexOf(e);
      if (idx > -1) {
        arr?.splice(idx, 1);
      } else {
        if (id === 65 && arr?.length >= 2) {
          return;
        }
        arr?.push(e);
      }
      configList[i].value = arr;

      // 修改默认语言
      if (id === 10) {
        let langIdx = configList?.findIndex((c) => c.id == id + 1);
        if (langIdx > -1) {
          let lang = configList[langIdx].value;
          if (arr?.indexOf(lang) < 0) {
            configList[langIdx].value = arr[0];
          }
        }

        const menuNameBilingualIdx = configList?.findIndex((c) => c.id === 66);
        if (menuNameBilingualIdx > -1) {
          const bilingualValue = configList[menuNameBilingualIdx].value || {};
          const filteredDisplayLangs = (
            bilingualValue.displayLangs || []
          ).filter((code) => arr.includes(code));
          let primaryLang = bilingualValue.primaryLang || '';

          if (!filteredDisplayLangs.includes(primaryLang)) {
            primaryLang = filteredDisplayLangs[0] || '';
          }

          configList[menuNameBilingualIdx].value = {
            ...bilingualValue,
            displayLangs: filteredDisplayLangs,
            primaryLang,
            status: arr.length > 1 ? bilingualValue.status : false,
          };
        }
      }
    }
    // 送餐到桌方式都开启时， 开启开关， 都关闭时， 关闭开关
    if (id === 4) {
      const switchId = configList?.findIndex((each) => each.id === 29);
      const methodValue = configList[i].value;
      if (methodValue?.length === 2) configList[switchId].value = true;
      if (!methodValue?.length) configList[switchId].value = false;
    }
    this.setState({
      configList: cloneDeep(configList),
    });
  };

  // radio
  handleChangeRadio = (id, e) => {
    const { t } = this.props;
    const { configList } = this.state;
    if (id === 33 && e === 1) {
      const isShowGroupName = configList?.find((each) => each.id === 17)?.value;
      if (isShowGroupName) {
        Toast.info(t('menu-display-position-error'), 2000);
        return false;
      }
    }
    let i = configList?.findIndex((c) => c.id == id);
    if (i > -1) {
      if (id == 8 || id == 9) {
        let idx_8 = configList?.findIndex((c) => c.id == 8);
        let idx_9 = configList?.findIndex((c) => c.id == 9);
        if (id == 8 && configList[idx_9].value === 0) {
          if (e === 0) {
            Toast.info(t('auto-print-sms-tip'), 1000);
            return false;
          }
        } else if (id == 9 && configList[idx_8].value === 0) {
          if (e === 0) {
            Toast.info(t('auto-print-sms-tip'), 1000);
            return false;
          }
        }
        configList[i].value = e;
      } else if (id === 7) {
        const signIndex = configList?.findIndex((c) => c.id === 23);
        if (configList[signIndex].value === false) {
          Toast.info(t('open-sign-first'), 1000);
          return false;
        }
        configList[i].value = e;
      } else if (id === 14) {
        configList[i].value[0] = e;
        // 选择小费为固定金额时，必须开启展示具体金额
        if (e === 1) {
          const tipPriceDetail = configList?.findIndex((c) => c.id === 55);
          configList[tipPriceDetail].value = true;
        }
      } else {
        configList[i].value = e;
      }

      this.setState({
        configList: cloneDeep(configList),
      });
    }
  };

  saveData = async (event) => {
    if (event.data.type == 'sessionKey') {
      if (this.posDetail?.state?.posConfigLoading) {
        const { t } = this.props;
        Toast.info(t('data-fetching-retry-later'), 2000);
        off(window, 'message', this.saveData);
        return;
      }

      getMarginappFetchKioskConfig(event.data.data)
        .then(async (res) => {
          if (res.data.result.successful) {
            const {
              t,
              promotion: { isOpenCloudPromotion },
            } = this.props;
            const { configList } = this.state;
            const allSysConfig = await ensureAllSysConfigLoaded(
              this.props.initConfigParams,
              this.props.allSysConfig
            );

            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            let params = cloneDeep(JSON.parse(obj.data));

            // 配置了 DP，默认先支付后小费，需要更改模式时要提示输入密码
            const tipsConfig = configList?.find((each) => each.id === 24); //先刷卡后小费
            const isOpenDualPrice = isCreditChargeEnabled(allSysConfig);
            const showAuthForTips =
              isOpenDualPrice &&
              tipsConfig?.value !== 1 &&
              !tipsConfig?.Authorization;

            // 售罄入口、标签入口配置
            const inventoryLocaleConfig = configList?.find(
              (each) => each.id === 53
            );
            const labelLocaleConfig = configList?.find(
              (each) => each.id === 54
            );
            const originInventoryLocaleConfig = params.configList?.find(
              (each) => each.id === 53
            );
            const originLabelLocaleConfig = params.configList?.find(
              (each) => each.id === 54
            );

            const showAuthForInventoryLocale =
              inventoryLocaleConfig?.value &&
              !originInventoryLocaleConfig?.value;
            const showAuthForLabelLocale =
              labelLocaleConfig?.value && !originLabelLocaleConfig?.value;

            const localPromotionConfig = configList?.find(
              (each) => each.id === 52
            );
            // 开启本地促销时,检查促销中心开没开
            // 没开促销中心需要输密码才能打开本地促销 ；开了促销中心弹警告并返回
            if (isOpenCloudPromotion || !localPromotionConfig?.value) {
              // 开启促销中台时,或没开本地促销时，置空本地kiosk促销开启的活动
              params.promotionEnableType = '';
            }
            // if (localPromotionConfig?.value && isOpenCloudPromotion) {
            // Toast.info(t('promotion-conflict-msg'), 2000);
            // const localPromotionConfigIdx = configList?.findIndex(
            //   (c) => c.id === 52
            // );
            // if (localPromotionConfigIdx > -1) {
            //   configList[localPromotionConfigIdx].value = false;
            //   this.setState({ configList: cloneDeep(configList) });
            // }
            // return false;
            // }

            // 需要切换dp小费出现方式为刷卡前时、
            // 需要打开售罄配置入口和标签配置入口时、
            // 打开输入密码弹窗
            if (
              showAuthForTips ||
              showAuthForInventoryLocale ||
              showAuthForLabelLocale
            ) {
              await this.showPassWordAndWait();
            }

            // 设置DP后,统一开启两种支付模式
            const { state, handleCheckBox } = this.posDetail || {};
            const { posConfigList } = state || {};
            const paymentType = posConfigList?.find(
              (each) => each['app:name'] === 'KIOSK_PAYMENT_TYPE'
            );
            const paymentTypeValue = paymentType?.['app:value']?.split(',');
            if (
              isOpenDualPrice &&
              paymentType &&
              (!paymentTypeValue?.includes('0') ||
                !paymentTypeValue?.includes('1'))
            ) {
              if (!paymentTypeValue?.includes('0')) {
                handleCheckBox(paymentType['app:id'], 0);
              } else if (!paymentTypeValue?.includes('1')) {
                handleCheckBox(paymentType['app:id'], 1);
              }
            }

            // 更新id:14的value值
            let i = configList?.findIndex((c) => c.id === 14);
            if (i > -1) {
              let tipList = this.tipItemDetail?.tipDetail?.state?.tipList;
              let arr =
                tipList?.[configList[i].value[0] - 1][configList[i].value[0]];
              // 判断三个input是否都有值
              let bool = arr?.every((_) => Boolean(_));
              if (bool) {
                configList[i].value[1] = arr?.map((n) => Number.parseFloat(n));
              } else {
                Toast.info(t('tip-must-num', { rplc: 3 }), 2000);
                return false;
              }
            }

            // 更新id:21的value值
            let idx = configList?.findIndex((c) => c.id == 21);
            if (idx > -1) {
              let minAmout =
                this.minAmoutItemDetail?.minAmoutDetail?.state?.minAmout || 0;
              configList[idx].value = Number.parseFloat(minAmout);
            }

            // 更新id:24的value值,只要输入过授权密码即视为已授权
            let idx_24 = configList?.findIndex((c) => c.id == 24);
            if (idx_24 > -1 && showAuthForTips) {
              configList[idx_24].Authorization = true;
            }

            // 更新id:40的value值
            let idx_40 = configList?.findIndex((c) => c.id == 40);
            if (idx_40 > -1) {
              let delayTime =
                this.tableClearItemDetail?.tableClearDetail?.state?.delayTime ||
                0;
              configList[idx_40].value.delayTime = Number.parseInt(delayTime);
            }

            // 更新id:44的value值
            let idx_44 = configList?.findIndex((c) => c.id == 44);
            if (idx_44 > -1) {
              let overTimeClose =
                this.waitingTimeItemDetail?.waitingTimeDetail?.state
                  ?.overTimeClose || 30;
              let overTimeShowModal =
                this.waitingTimeItemDetail?.waitingTimeDetail?.state
                  ?.overTimeShowModal || '';

              configList[idx_44].value.overTimeClose =
                Number.parseInt(overTimeClose);

              // 如果 overTimeShowModal 有值，转换为数字；否则保持为空
              if (overTimeShowModal !== '') {
                let showModalValue = Number.parseInt(overTimeShowModal);
                // 确保小于 overTimeClose
                if (showModalValue >= Number.parseInt(overTimeClose)) {
                  showModalValue = '';
                }
                configList[idx_44].value.overTimeShowModal = showModalValue;
              } else {
                configList[idx_44].value.overTimeShowModal = '';
              }
            }

            // 更新id:47【等待区间】的value值
            let idx_47 = configList?.findIndex((c) => c.id == 47);
            if (idx_47 > -1) {
              const state =
                this.waitingTimeRangeItemDetail?.waitingTimeRangeDetail
                  ?.state || {};
              const {
                overNumber = 10,
                overTimeMinutes = 10,
                rangeSubMinutes = 2,
                rangeAddMinutes = 2,
              } = state;

              Object.assign(configList[idx_47].value, {
                overNumber: +overNumber,
                overTimeMinutes: +overTimeMinutes,
                rangeSubMinutes: +rangeSubMinutes,
                rangeAddMinutes: +rangeAddMinutes,
              });
            }

            // 更新id:57【字体大小】的value值
            let idx_57 = configList?.findIndex((c) => c.id == 57);
            if (idx_57 > -1) {
              const state =
                this.fontSizeItemDetail?.fontSizeDetail?.state || {};
              const { type = 'default', fontsizeMultiple = 1 } = state;
              configList[idx_57].value = {
                type,
                fontsizeMultiple: Number.parseFloat(fontsizeMultiple) || 1,
              };
            }

            // 更新id:58【字体背景色】的value值
            let idx_58 = configList?.findIndex((c) => c.id == 58);
            if (idx_58 > -1) {
              const state =
                this.fontBackgroundColorItemDetail?.fontBackgroundColorDetail
                  ?.state || {};
              const { type = 'default', customColor = '#000000b3' } = state;
              configList[idx_58].value = {
                type,
                customColor,
              };
            }

            // 更新id:59【字体颜色】的value值
            let idx_59 = configList?.findIndex((c) => c.id == 59);
            if (idx_59 > -1) {
              const state =
                this.fontColorItemDetail?.fontColorDetail?.state || {};
              const { type = 'default', customColor = '#FFFFFF' } = state;
              configList[idx_59].value = {
                type,
                customColor,
              };
            }

            params.configList = configList;

            // 须在 savePosDetail 之前快照：savePosDetail 成功后会更新 originalPosConfigList，
            // 若在 POS 保存后再比较会导致 kioskPaymentTypeChanged 恒为 false，设备支付方式无法同步
            const normalizeKioskPaymentType = (list) =>
              list
                ?.find((each) => each['app:name'] === 'KIOSK_PAYMENT_TYPE')
                ?.['app:value']?.split(',')
                ?.filter((v) => v !== '')
                ?.sort((a, b) => Number(a) - Number(b))
                ?.join(',');
            const { posConfigList: posConfigListBeforeSave } =
              this.posDetail?.state || {};
            const paymentNormBeforeSave = normalizeKioskPaymentType(
              posConfigListBeforeSave
            );
            const originalPaymentNormBeforeSave = normalizeKioskPaymentType(
              this.posDetail?.state?.originalPosConfigList
            );
            const kioskPaymentTypeChanged =
              paymentNormBeforeSave !== originalPaymentNormBeforeSave;

            // 保存迁移pos功能
            // dev 注释
            this.posDetail
              ?.savePosDetail()
              .then(() => {
                // 同步支付设置到设备设置上：仅当 KIOSK_PAYMENT_TYPE 相对加载时的配置有变更时才更新 id 34
                const { posConfigList } = this.posDetail.state;

                if (kioskPaymentTypeChanged) {
                  const paymentType =
                    posConfigList?.find(
                      (each) => each['app:name'] === 'KIOSK_PAYMENT_TYPE'
                    )?.['app:value'] || '';
                  const canPayByCard = paymentType.includes('0');
                  const canPayByCash = paymentType.includes('1');
                  const canPayByEcard = paymentType.includes('2');
                  const newConfig = params.configList.map((each) => {
                    if (each.id === 34) {
                      const { value } = each;
                      const newVal = value.map((val) => {
                        return {
                          ...val,
                          devicePaymentType: {
                            canPayByCard,
                            canPayByCash,
                            canPayByEcard,
                          },
                        };
                      });
                      return {
                        ...each,
                        value: newVal,
                      };
                    }
                    return each;
                  });
                  params.configList = newConfig;
                }
                // 存kiosk数据
                postMarginappConfig(
                  JSON.stringify(params),
                  event.data.data
                ).then((res) => {
                  if (!this.isComponentMounted) {
                    return;
                  }
                  this.getLoadMoreData(event.data.data);

                  if (res.data.result.successful) {
                    this.setState({
                      msg: 'SUCCESS',
                      open: true,
                    });
                  } else {
                    this.setState({
                      msg: 'FAIL',
                      open: true,
                    });
                  }
                  setTimeout(() => {
                    this.setState({
                      msg: '',
                      open: false,
                    });
                  }, 800);
                });
                // dev 注释
              })
              .catch((rej) => {
                console.log(rej);
              });
          } else {
            this.showApiModalTip(res.data?.result?.failureReason);
          }
          off(window, 'message', this.saveData);
        })
        .catch((err) => {
          this.showApiModalTip(err?.message);
          off(window, 'message', this.saveData);
        });
    }
  };

  handleSave = () => {
    const { t } = this.props;
    const numberPlateImageConfig = this.state.configList.find(
      (config) => config.id === 69
    );
    const numberPlateImageValue = numberPlateImageConfig?.value;

    if (
      numberPlateImageValue?.status &&
      (!numberPlateImageValue.horizontalImg ||
        !numberPlateImageValue.verticalImg)
    ) {
      Toast.info(t('number-plate-images-required'), 2000);
      return;
    }

    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.saveData);

    // for dev
    if (process.env.NODE_ENV === 'development')
      this.saveData({
        data: {
          type: 'sessionKey',
          data: getCookie('sessionKey'),
        },
      });
  };

  initConfigList = (params) => {
    if (!this.isComponentMounted) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      getMarginappFetchKioskConfig(params)
        .then(async (res) => {
          if (!this.isComponentMounted) {
            resolve();
            return;
          }
          if (res.data.result.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            // 数据库有值
            if (obj && obj.data) {
              let arr = JSON.parse(obj.data);
              // 过滤无效值
              let DBconfigList = arr?.configList?.filter((item) => {
                return item.id;
              });
              if (DBconfigList) {
                // 本地js和数据库对比
                let defectList = [];
                selfConfigList.configList.forEach((item) => {
                  let incld = DBconfigList?.find((c) => c.id == item.id);
                  if (!incld) {
                    defectList.push(item);
                  }
                });

                // 小费配置更新是否授权
                let configTip = DBconfigList?.find((c) => c.id === 24);
                if (configTip && configTip?.Authorization === undefined) {
                  let configTipIdx = DBconfigList?.findIndex(
                    (c) => c.id === 24
                  );
                  DBconfigList = DBconfigList?.filter(
                    (_, index) => index !== configTipIdx
                  );
                  defectList.push({
                    ...configTip,
                    Authorization: selfConfigList.configList?.find(
                      (c) => c.id === 24
                    )?.Authorization,
                  });
                }

                let update = false;
                const inventoryLocaleConfig = DBconfigList?.find(
                  (each) => each.id === 53
                );
                const labelLocaleConfig = DBconfigList?.find(
                  (each) => each.id === 54
                );

                if (!inventoryLocaleConfig?.init || !labelLocaleConfig?.init) {
                  const companyProfileRes = await fetchCompanyProfile();
                  if (!this.isComponentMounted) {
                    resolve();
                    return;
                  }
                  // 将 merchantProfile 存储到 Redux store，以便 CloudPromotion 组件可以使用
                  if (
                    companyProfileRes?.data?.result?.successful &&
                    companyProfileRes?.data?.company
                  ) {
                    this.props.initCompanyParams(companyProfileRes.data);
                  }
                  const useShoppingCenter =
                    !!companyProfileRes?.data?.result?.successful &&
                    companyProfileRes?.data?.company?.brandId;

                  const inventoryLocaleConfigInDefectList = defectList.find(
                    (each) => each.id === 53
                  );
                  if (inventoryLocaleConfig && !inventoryLocaleConfig.init) {
                    inventoryLocaleConfig.value = useShoppingCenter
                      ? false
                      : true;
                    inventoryLocaleConfig.init = true;
                    update = true;
                  } else if (
                    !inventoryLocaleConfig &&
                    inventoryLocaleConfigInDefectList
                  ) {
                    inventoryLocaleConfigInDefectList.value = useShoppingCenter
                      ? false
                      : true;
                    inventoryLocaleConfigInDefectList.init = true;
                  }

                  const labelLocaleConfigInDefectList = defectList.find(
                    (each) => each.id === 54
                  );
                  if (labelLocaleConfig && !labelLocaleConfig.init) {
                    labelLocaleConfig.value = useShoppingCenter ? false : true;
                    labelLocaleConfig.init = true;
                    update = true;
                  } else if (
                    !labelLocaleConfig &&
                    labelLocaleConfigInDefectList
                  ) {
                    labelLocaleConfigInDefectList.value = useShoppingCenter
                      ? false
                      : true;
                    labelLocaleConfigInDefectList.init = true;
                  }
                }

                const hasInvalidConfigItems =
                  (arr?.configList?.length || 0) !== DBconfigList.length;
                const needsSaveConfig =
                  defectList.length > 0 || update || hasInvalidConfigItems;

                if (!needsSaveConfig) {
                  this.setState({
                    configList: DBconfigList,
                  });
                } else {
                  DBconfigList = DBconfigList.concat(defectList);
                  DBconfigList.sort(compare('id'));
                  arr.configList = DBconfigList;
                  postMarginappConfig(JSON.stringify(arr), params).then(() => {
                    if (this.isComponentMounted) {
                      this.getLoadMoreData(params);
                    }
                  });
                }
                this.setState({ kioskConfig: arr });
              } else {
                const { configList } = selfConfigList;
                const newData = {
                  ...arr,
                  configList,
                };
                // 有其他配置, 无config list 时
                postMarginappConfig(JSON.stringify(newData), params).then(
                  () => {
                    if (this.isComponentMounted) {
                      this.getLoadMoreData(params);
                    }
                  }
                );
                this.setState({ kioskConfig: newData });
              }
            } else {
              // 数据库无值，使用本地js并存数据库
              postMarginappConfig(JSON.stringify(selfConfigList), params).then(
                () => {
                  if (this.isComponentMounted) {
                    this.getLoadMoreData(params);
                  }
                }
              );
            }
          } else {
            reject(res.data?.result?.failureReason);
            this.showApiModalTip(res.data?.result?.failureReason);
          }
          off(window, 'message', this.getData);
          resolve(res.data);
        })
        .catch((err) => {
          this.showApiModalTip(err?.message);
          off(window, 'message', this.getData);
        });
    });
  };

  // 主配置先展示；POS 三项配置（订单类型/短信/支付方式）异步拉取，不阻塞页面
  getLoadMoreData = (data) => {
    if (!this.isComponentMounted) {
      return;
    }
    this.initConfigList(data)
      .then(() => {
        if (this.isComponentMounted) {
          this.setState({ isLoad: false });
        }
      })
      .catch((err) => {
        console.log(err);
      });
    this.posDetail?.getPosDetail()?.catch((err) => {
      console.log(err);
    });
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      this.getLoadMoreData(event.data.data);
    }
  };

  componentDidMount() {
    this.isComponentMounted = true;
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.getData);
    fetchAndDispatchAllSysConfig(
      this.props.initConfigParams,
      this.props.allSysConfig
    );

    // for dev
    if (process.env.NODE_ENV === 'development')
      this.getLoadMoreData(getCookie('sessionKey'));
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    clearTimeout(this.timer);
    off(window, 'message', this.getData);
    off(window, 'message', this.saveData);
  }

  handleChangeCate = (newLeftCategoryVal) => {
    this.setState({
      leftCategoryVal: newLeftCategoryVal,
    });
  };

  handlePasswordCancel = () => {
    this.setState({
      showPassword: false,
    });
  };

  handlePasswordConfirm = async (password) => {
    const { t } = this.props;
    if (PASSWORD.includes(password)) {
      await this.setState({ authorization: true });

      if (this.state.resolvePassword) {
        this.state.resolvePassword();
        this.setState({ resolvePassword: null });
      }
      this.handlePasswordCancel();
    } else {
      Toast.info(t('password-error'), 1500);
    }
  };

  showPassWordAndWait = () => {
    return new Promise((resolve) => {
      this.setState({
        showPassword: true,
        resolvePassword: resolve,
      });
    });
  };

  render() {
    const { t } = this.props;
    const {
      isLoad,
      configList,
      kioskConfig,
      open,
      msg,
      errorApiShow,
      errorApiMsg,
      leftCategoryVal,
      showPassword,
    } = this.state;
    const waitList = [];
    const receiptList = [];
    const phoneList = [];
    const serviceList = [];
    const tipList = [];
    // 获取 print-mode (id:8) 的值，用于判断是否显示 id:60 的配置
    const printModeConfig = configList.find((c) => c.id === 8);
    const printModeValue = printModeConfig?.value;
    // 获取 partial-payment-auto-print-receipt (id:60) 的配置
    const partialPaymentConfig = configList.find((c) => c.id === 60);
    const cashPayConfirmConfig = configList.find((c) => c.id === 68);
    const isOpenDualPrice = isCreditChargeEnabled(this.props.allSysConfig);
    // kiosk新增的功能配置，分类，过滤（id:6）配置项
    configList.map((c) => {
      // 跳过 id 为 60、68 的配置项，在特定条件下手动添加
      if (c.id === 60 || c.id === 68) {
        return;
      }
      let com = (
        <ServiceItem
          configList={configList}
          key={c.id}
          configInfo={c}
          handleChange={this.handleChange}
          handleChangeBox={this.handleChangeBox}
          handleChangeRadio={this.handleChangeRadio}
          posConfig={this.posDetail}
          {...(c.id === 61
            ? { handleChangeDishDetailIds: this.handleChangeDishDetailIds }
            : {})}
          {...(c.id === 66
            ? {
                handleChangeMenuNameDisplayLangs:
                  this.handleChangeMenuNameDisplayLangs,
                handleChangeMenuNamePrimaryLang:
                  this.handleChangeMenuNamePrimaryLang,
              }
            : {})}
          {...(c.id === 69
            ? { handleChangeConfigValue: this.handleChangeConfigValue }
            : {})}
        />
      );
      if (c.id === 13) {
        waitList.push(com);
      } else if (c.id === 7 || c.id === 8 || c.id === 9) {
        receiptList.push(com);
        // 如果当前是 print-mode (id:8) 且值为 0，则在后面添加 id:60 的配置
        if (c.id === 8 && printModeValue === 0 && partialPaymentConfig) {
          receiptList.push(
            <ServiceItem
              configList={configList}
              key={partialPaymentConfig?.id}
              configInfo={partialPaymentConfig}
              handleChange={this.handleChange}
              handleChangeBox={this.handleChangeBox}
              handleChangeRadio={this.handleChangeRadio}
              posConfig={this.posDetail}
            />
          );
        }
      } else if (c.id === 12 || c.id === 15) {
        phoneList.push(com);
      } else if (c.id === 5 || c.id === 14) {
        if (c.id === 5) {
          tipList.push(com);
        } else {
          tipList.push(
            <ServiceItem
              onRef={this.openTipItemDetail}
              configList={configList}
              key={c.id}
              configInfo={c}
              handleChange={this.handleChange}
              handleChangeBox={this.handleChangeBox}
              handleChangeRadio={this.handleChangeRadio}
            />
          );
        }
      } else if (c.id === 21) {
        serviceList.push(
          <ServiceItem
            onRef={this.openMinItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
        if (isOpenDualPrice && cashPayConfirmConfig) {
          serviceList.push(
            <ServiceItem
              configList={configList}
              key={cashPayConfirmConfig.id}
              configInfo={cashPayConfirmConfig}
              handleChange={this.handleChange}
              handleChangeBox={this.handleChangeBox}
              handleChangeRadio={this.handleChangeRadio}
            />
          );
        }
      } else if (c.id == 40) {
        serviceList.push(
          <ServiceItem
            onRef={this.openTableClearItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id == 44) {
        serviceList.push(
          <ServiceItem
            onRef={this.openWaitingTimeItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id == 47) {
        serviceList.push(
          <ServiceItem
            onRef={this.openWaitingTimeRangeItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id == 57) {
        serviceList.push(
          <ServiceItem
            onRef={this.openFontSizeItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id == 58) {
        serviceList.push(
          <ServiceItem
            onRef={this.openFontBackgroundColorItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id == 59) {
        serviceList.push(
          <ServiceItem
            onRef={this.openFontColorItemDetail}
            configList={configList}
            key={c.id}
            configInfo={c}
            handleChange={this.handleChange}
            handleChangeBox={this.handleChangeBox}
            handleChangeRadio={this.handleChangeRadio}
          />
        );
      } else if (c.id !== 6) {
        serviceList.push(com);
      }
    });

    return (
      <React.Fragment>
        <div className={styles.serviceBox}>
          <ConfigHeader headTitle={t('service-set')} />
          <div
            className={[
              styles.serviceContent,
              !isLoad ? styles.serviceShow : styles.serviceHide,
            ].join(' ')}
          >
            <div className={styles.leftCategory}>
              <LeftCategory
                leftCategoryVal={leftCategoryVal}
                handleChangeCate={this.handleChangeCate}
              />
            </div>
            {/* pos迁移的功能配置（订单类型、支付方式、SMS） */}
            <div className={styles.rightContent}>
              <TransferPosSetting
                onRef={this.openDetail}
                waitList={waitList}
                receiptList={receiptList}
                phoneList={phoneList}
                kioskConfig={kioskConfig}
                serviceList={serviceList}
                tipList={tipList}
                handleChange={this.handleChange}
                leftCategoryVal={leftCategoryVal}
              />
            </div>
          </div>
          <ConfigFooter handleSave={this.handleSave} />
        </div>

        <InputPassword
          visible={showPassword}
          warmingTxt={t('password-input-tips-title-sub')}
          onCancel={this.handlePasswordCancel}
          onConfirm={this.handlePasswordConfirm}
        />

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={open}
          message={msg}
          key={'topcenter'}
        />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    promotion: state.promotion,
    allSysConfig: state.allSysConfig,
  };
}

export default connect(mapStateToProps, { initCompanyParams, initConfigParams })(
  withTranslation()(ServiceSetting)
);
