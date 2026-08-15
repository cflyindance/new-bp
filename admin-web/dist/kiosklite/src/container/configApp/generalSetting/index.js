import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import styles from './generalSetting.module.scss';
import CoverPictureSetting from './coverPictureSetting';
import LogoSetting from './logoSetting';
import BannerSetting from './bannerSetting';
import { selfConfigList } from '@/constants/selfConfig';
import { compare, getCookie, off, on } from '@/utils';
import getPosVersion from '@/utils/getPosVersion';
import {
  fetchCompanyProfile,
  getMarginappFetchKioskConfig,
  postMarginappConfig,
} from '@/api/kioskConfigApi';
import Toast from '@/component/toast';
import { initCompanyParams, setSelfConfig } from '@/actions';

class GeneralSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      setConfigList: [],
      generalSetBtn: [],
      kioskConfig: {},
    };
    this.isComponentMounted = false;
  }

  componentDidMount() {
    this.isComponentMounted = true;
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.getData);

    this.initGeneralSetBtn();
  }

  componentDidUpdate(_, prevState) {
    if (prevState.kioskConfig !== this.state.kioskConfig) {
      this.updateOpenStatus();
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    off(window, 'message', this.getData);
  }

  // 初始化 generalSetBtn 列表
  initGeneralSetBtn = () => {
    const { t } = this.props;
    let generalSetBtnList = [
      {
        path: '/serviceSetting',
        name: t('service-set'),
        open: true,
      },
      {
        path: '/inventorySetting',
        name: t('inventory-set'),
        open: false,
      },
      {
        path: '/allChargeSetting',
        name: t('all-charge-set'),
        open: true,
      },
      {
        path: '/brandSetting',
        name: t('brand-setting'),
        open: true,
      },
      {
        path: '/promotion',
        name: t('promotion'),
        open: true,
      },
      {
        path: '/deviceSetting',
        name: t('device-manage-set'),
        open: true,
      },
      {
        path: '/screenSaver',
        name: t('screen-saver'),
        open: true,
      },
      {
        path: '/menuLabel',
        name: t('menu-label'),
        open: false,
      },
      {
        path: '/posterPro',
        name: t('poster-pro'),
        open: true,
      },
      {
        path: '/loginGuide',
        name: t('login-guide'),
        open: true,
      },
    ];

    this.setState({
      // 通用配置下内容
      generalSetBtn: generalSetBtnList,
      // 通用配置，封面图，标志，海报
      setConfigList: [
        t('general-set'),
        t('cover-pic'),
        t('logo-pic'),
        t('banner'),
      ],
    });
  };

  updateOpenStatus = () => {
    const { kioskConfig } = this.state;
    const promotionConfig = kioskConfig?.configList?.find(
      (each) => each.id === 52
    );
    const inventoryLocaleConfig = kioskConfig?.configList?.find(
      (each) => each.id === 53
    );
    const labelLocaleConfig = kioskConfig?.configList?.find(
      (each) => each.id === 54
    );

    const posVersionNum = Number(
      getPosVersion(
        localStorage.getItem('poslocalversion') ||
          localStorage.getItem('posVersion')
      )
    );

    this.setState((prevState) => {
      const updatedGeneralSetBtn = prevState.generalSetBtn.map((btn) => {
        if (btn.path === '/promotion') {
          return {
            ...btn,
            open: promotionConfig?.value ?? true,
          };
        }
        if (btn.path === '/inventorySetting') {
          return {
            ...btn,
            open: posVersionNum >= 18030160400 ? false : true,
          };
        }
        if (btn.path === '/menuLabel') {
          return {
            ...btn,
            open: labelLocaleConfig?.value ?? false,
          };
        }
        return btn;
      });
      return {
        generalSetBtn: updatedGeneralSetBtn,
      };
    });
  };

  initConfigList = (params) => {
    if (!this.isComponentMounted) {
      return Promise.resolve();
    }
    return getMarginappFetchKioskConfig(params)
      .then(async (res) => {
        if (!this.isComponentMounted) {
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

              if (needsSaveConfig) {
                DBconfigList = DBconfigList.concat(defectList);
                DBconfigList.sort(compare('id'));
                arr.configList = DBconfigList;
                postMarginappConfig(JSON.stringify(arr), params).then(() => {
                  if (this.isComponentMounted) {
                    this.initConfigList(params);
                  }
                });
              }
            }
            this.setState({ kioskConfig: arr });
            this.props.setSelfConfig(arr);
          } else {
            // 数据库无值，使用本地js并存数据库 ,注意error：会报空指针异常
            postMarginappConfig(JSON.stringify(selfConfigList), params).then(
              (pres) => {
                if (this.isComponentMounted) {
                  this.initConfigList(params);
                }
              }
            );
          }
        }
        off(window, 'message', this.getData);
      })
      .catch((err) => {
        off(window, 'message', this.getData);
      });
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      // console.log('event.data.data',event.data.data);
      this.initConfigList(event.data.data);
    }
    if (process.env.NODE_ENV === 'development') {
      // console.log('NODE_ENV',getCookie('sessionKey'));
      this.initConfigList(getCookie('sessionKey'));
    }
  };

  handleClick = (btn) => {
    const {
      handleGotoPath,
      promotion: { isOpenCloudPromotion },
      t,
    } = this.props;
    if (btn.path === '/promotion' && isOpenCloudPromotion) {
      // 开启促销中心并且有促销活动时 提示去促销中心配置
      Toast.info(t('promotion-conflict-msg'), 2000);
    } else {
      handleGotoPath(btn.path);
    }
  };

  render() {
    const { actived, handleChoose } = this.props;
    const { setConfigList, generalSetBtn } = this.state;
    let configContent = null;
    if (actived == 0) {
      configContent = (
        <div className={styles.configBtns}>
          {generalSetBtn.map((btn, idx) => {
            if (!btn.open) return;
            return (
              <span
                key={idx}
                onClick={() => {
                  this.handleClick(btn);
                }}
              >
                {btn.name}
              </span>
            );
          })}
        </div>
      );
    } else if (actived == 1) {
      configContent = <CoverPictureSetting />;
    } else if (actived == 2) {
      configContent = <LogoSetting />;
    } else if (actived == 3) {
      configContent = <BannerSetting />;
    }

    return (
      <div className={styles.configBox}>
        <div className={styles.configItem}>
          {setConfigList.map((c, idx) => {
            return (
              <span
                className={idx == actived ? styles.actived : ''}
                key={idx}
                onClick={() => {
                  handleChoose(idx);
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
        {configContent}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    promotion: state.promotion,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    initCompanyParams: (merchantProf) =>
      dispatch(initCompanyParams(merchantProf)),
    setSelfConfig: (data) => dispatch(setSelfConfig(data)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation()(GeneralSetting));
