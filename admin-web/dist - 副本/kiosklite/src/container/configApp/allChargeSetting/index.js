import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './allChargeSetting.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import ConfigHeader from '@/component/configHeader';
import ConfigFooter from '@/component/configFooter';
import ChargeItem from './chargeItem';
import { getChargeList } from '@/api/apiPos';
import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
} from '@/api/kioskConfigApi';
import cloneDeep from 'lodash/cloneDeep';
import { on, off } from '@/utils';
import { XMLObjTree } from '@/utils/ObjectTree';
import { PASSWORD } from '@/constants/mockData';
import Toast from '@/component/toast';
import InputPassword from '../InputPassword';
import { initConfigParams } from '@/actions';
import {
  fetchAndDispatchAllSysConfig,
  isCreditChargeEnabled,
} from '@/utils/allSysConfigHelper';

import Big from 'big.js';

class AllChargeSetting extends Component {
  constructor() {
    super();
    this.state = {
      msg: '',
      open: false,
      errorApiMsg: '',
      errorApiShow: false,
      chargeList: [
        {
          id: 1,
          title: 'entire-order-charge',
          data: [],
          select: {},
        },
        {
          id: 2,
          title: 'utensil-charge',
          data: [],
          select: {},
        },
        {
          id: 3,
          title: 'bag-charge',
          data: [],
          select: {},
        },
        {
          id: 4,
          title: 'takeout-box-charge',
          data: [],
          select: {},
        },
      ],
      showPassword: false,
      passwordTitle: null, // 密码输入框的标题
      resolvePassword: null,
    };
    this.isComponentMounted = false;
    this.timer = null;
  }

  parseSurchargeXml = (data) => {
    let start = data?.indexOf('<soap:Body>');
    let end = data?.indexOf('</soap:Body>');
    data = data?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let list = objTree?.parseXML(data);
    return list?.listchargesresponsetype?.charge;
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

  // radio
  handleSelectRadio = (id, e) => {
    if (id === 1 && isCreditChargeEnabled(this.props.allSysConfig)) {
      return;
    }
    let chargeList = this.state.chargeList;
    let r = chargeList?.find((c) => c.id == id);
    if (r) {
      if (r.select.id == e.id) {
        r.select = {};
      } else {
        r.select = e;
      }
    }

    this.setState({
      chargeList: cloneDeep(chargeList),
    });
  };

  saveData = async (event) => {
    if (event.data.type == 'sessionKey') {
      getMarginappFetchKioskConfig(event.data.data)
        .then(async (res) => {
          if (res.data.result.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            let params = JSON.parse(obj.data);
            let chargeList = cloneDeep(this.state.chargeList);
            let newMapList = chargeList.map((c) => {
              const { id, select, title } = c;
              return {
                id,
                select,
                title,
              };
            });

            // 如果Charge发生变化，则需要输入密码
            const oldCharge = params.charge?.find((c) => c.id === 1);
            const newCharge = newMapList?.find((c) => c.id === 1);
            const itemChanged =
              oldCharge?.select?.id !== newCharge?.select?.id ||
              oldCharge?.select?.ratetype !== newCharge?.select?.ratetype ||
              oldCharge?.select?.rate !== newCharge?.select?.rate;

            if (itemChanged) {
              await this.showPassWordAndWait();
            }

            params.charge = newMapList;
            postMarginappConfig(JSON.stringify(params), event.data.data).then(
              (res) => {
                if (!this.isComponentMounted) {
                  return;
                }
                if (res.data.result.successful) {
                  this.setState({
                    msg: 'SUCCESS',
                    open: true,
                  });
                  this.initConfigList(event.data.data);
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
              }
            );
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
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.saveData);
  };

  // 找出不同的charge项
  findDiffCharge = (arr1, arr2) => {
    const differences = [];
    const idsInArr1 = new Set(arr1.map((item) => item.id));
    arr2.forEach((item) => {
      if (!idsInArr1.has(item.id)) {
        differences.push(item);
      }
    });

    return differences;
  };

  initConfigList = async (params) => {
    if (!this.isComponentMounted) {
      return;
    }
    try {
      const res = await getMarginappFetchKioskConfig(params);
      if (!this.isComponentMounted) {
        return;
      }

      if (!res.data.result.successful) {
        this.showApiModalTip(res.data?.result?.failureReason);
        return;
      }

      let list = res.data.marginAppConfigTypes;
      let obj = list?.find((l) => l.product == 'KIOSKLITE');
      let arr = JSON.parse(obj.data);

      // 检查是否需要更新配置
      let needsUpdate = false;
      let updatedConfig = { ...arr };

      // 检查 charge 列表是否完整
      if (
        arr?.charge?.length > 0 &&
        this.state.chargeList.length !== arr?.charge?.length
      ) {
        const differentItems = this.findDiffCharge(
          arr.charge,
          this.state.chargeList
        );
        updatedConfig.charge = [...arr.charge, ...differentItems];
        needsUpdate = true;
      }

      // 需要更新配置
      if (needsUpdate) {
        await postMarginappConfig(JSON.stringify(updatedConfig), params);
        if (!this.isComponentMounted) {
          return;
        }
        // 重新获取更新后的配置
        return this.initConfigList(params);
      }

      // 获取 charge 列表数据
      const resp = await getChargeList();
      if (!this.isComponentMounted) {
        return;
      }

      // 所有charge类型数据
      let surchargeList = [];
      // 存固定金额
      let filterSurchargeList1 = [];

      let surchargeInfo = resp.data
        ? this.parseSurchargeXml(resp.data) || []
        : [];

      if (Object.prototype.toString.call(surchargeInfo) === '[object Object]') {
        surchargeList.push(surchargeInfo);
      } else {
        surchargeList = [...surchargeInfo];
      }

      surchargeList.forEach((sur) => {
        sur.rate = parseFloat(Big(sur.rate).toFixed(3));
      });

      filterSurchargeList1 = surchargeList.filter((sur) => sur.ratetype == 1);
      filterSurchargeList1.unshift({
        id: -1,
        name: 'Free',
        rate: 0,
        ratetype: 1,
        type: 'DEFAULT',
      });

      let chargeList = this.state.chargeList;
      chargeList.forEach((item) => {
        if (arr?.charge?.length) {
          let r = arr.charge?.find((g) => g.id == item.id);
          if (r) {
            item.select = r.select;
          }
        }
        if (item.id === 1) {
          item.data = surchargeList;
        } else {
          item.data = filterSurchargeList1;
        }
      });

      this.setState({
        chargeList: cloneDeep(chargeList),
      });
    } catch (err) {
      this.showApiModalTip(err?.message);
    } finally {
      off(window, 'message', this.getData);
    }
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      this.initConfigList(event.data.data);
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
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    clearTimeout(this.timer);
    off(window, 'message', this.getData);
    off(window, 'message', this.saveData);
  }

  handleCancel = () => {
    this.setState({
      showPassword: false,
      passwordTitle: '',
    });
  };

  handleConfirm = (password) => {
    const { t } = this.props;
    if (PASSWORD.includes(password)) {
      if (this.state.resolvePassword) {
        this.state.resolvePassword();
        this.setState({ resolvePassword: null });
      }
      this.handleCancel();
    } else {
      Toast.info(t('password-error'), 1500);
    }
  };

  showPassWordAndWait = () => {
    const { t } = this.props;
    const title = t('password-input-dulaPrice-title');
    return new Promise((resolve) => {
      this.setState({
        showPassword: true,
        resolvePassword: resolve,
        passwordTitle: title,
      });
    });
  };

  render() {
    const { t } = this.props;
    const {
      open,
      msg,
      errorApiShow,
      errorApiMsg,
      chargeList,
      showPassword,
      passwordTitle,
    } = this.state;
    const isShowSave = chargeList.some((c) => c.data.length);
    const creditChargeEnabled = isCreditChargeEnabled(this.props.allSysConfig);

    return (
      <React.Fragment>
        <div className={styles.serviceBox}>
          <ConfigHeader headTitle={t('all-charge-set')} />
          <div className={styles.serviceContent}>
            {chargeList.map((item) => {
              return (
                <ChargeItem
                  key={item.id}
                  info={item}
                  handleSelectRadio={this.handleSelectRadio}
                  disabled={creditChargeEnabled && item.id === 1}
                />
              );
            })}
          </div>
          <ConfigFooter handleSave={this.handleSave} isHidden={!isShowSave} />
        </div>

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
        <></>

        <InputPassword
          visible={showPassword}
          title={passwordTitle}
          onCancel={this.handleCancel}
          onConfirm={this.handleConfirm}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    allSysConfig: state.allSysConfig,
  };
}

export default connect(mapStateToProps, { initConfigParams })(
  withTranslation()(AllChargeSetting)
);
