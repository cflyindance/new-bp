import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './deviceSetting.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { selfConfigList } from '@/constants/selfConfig';
import ConfigHeader from '@/component/configHeader';
import ConfigFooter from '@/component/configFooter';
import { getCookie, on, off, compare } from '@/utils';
import { Checkbox, Radio, Modal, Button } from 'antd';
import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
} from '@/api/kioskConfigApi';
import { fetchSystemConfig } from '@/api';
import { initConfigParams } from '@/actions';
import {
  ensureAllSysConfigLoaded,
  fetchAndDispatchAllSysConfig,
  isCreditChargeEnabled,
} from '@/utils/allSysConfigHelper';
import Toast from '@/component/toast';
import { getKioskConfigFromPos } from '@/api/apiPos';
import cloneDeep from 'lodash/cloneDeep';
import { XMLObjTree } from '@/utils/ObjectTree';

// pos迁移的功能的key值
const keysList = [
  'CHOOSE_ORDER_TYPE',
  'KIOSK_SEND_MESSAGE',
  'KIOSK_PAYMENT_TYPE',
];
class DeviceSetting extends Component {
  constructor() {
    super();
    this.state = {
      msg: '',
      open: false,
      errorApiMsg: '',
      errorApiShow: false,
      dataList: [],
      posConfigList: [],
      kioskConfig: {},
      menuDisplay: '',
      isTopMenu: false,
      needUpdate: true,
      deleteModalOpen: false,
      pendingDeleteDeviceId: null,
      deleteConfirmLoading: false,
    };
    this.timer = null;
    this.deviceIdToDelete = null;
    this.isComponentMounted = false;
  }

  getPosDetail = () => {
    getKioskConfigFromPos().then((res) => {
      if (!this.isComponentMounted) {
        return;
      }
      const list = [];
      let r = res.data ? this.parseLicenseXml(res.data) || [] : [];
      if (r?.length) {
        keysList.forEach((k, i) => {
          let result = r?.find((item) => item.name === k);
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

      this.setState({
        posConfigList: cloneDeep(list),
      });
    });
  };

  parseLicenseXml = (data) => {
    let findAppInstances = data;
    let start = findAppInstances?.indexOf('<soap:Body>');
    let end = findAppInstances?.indexOf('</soap:Body>');
    findAppInstances = findAppInstances?.substring(start + 11, end);
    let objTree = new XMLObjTree();
    let instanceList = objTree.parseXML(findAppInstances);
    let r =
      instanceList?.listsystemconfigurationsresponsetype?.systemconfiguration;
    return r;
  };

  initConfigList = async (params) => {
    if (!this.isComponentMounted) {
      return;
    }
    const allSysConfig = await ensureAllSysConfigLoaded(
      this.props.initConfigParams,
      this.props.allSysConfig
    );
    if (!this.isComponentMounted) {
      return;
    }
    // 当【服务设置】中支付方式（现金、信用卡）全部开启且没配置DP，再保存设备支付方式时，优先记录设备支付方式
    // 当【服务设置】中支付方式（现金、信用卡）只开启了一个，或配置了DP时，所有设备支付方式（现金、信用卡）默认继承【服务设置】中设置
    // 礼品卡支付方式，仅在【服务设置】配置时，全局同步，除此之外，始终记录设备自定义的值
    fetchSystemConfig().then((fRes) => {
      if (!this.isComponentMounted) {
        return;
      }
      const canPayByCard = fRes?.data?.KIOSK_PAYMENT_TYPE?.value?.includes('0');
      const canPayByCash = fRes?.data?.KIOSK_PAYMENT_TYPE?.value?.includes('1');
      const canPayByEcard =
        fRes?.data?.KIOSK_PAYMENT_TYPE?.value?.includes('2');
      const devicePaymentTypeFromService = {
        canPayByCard,
        canPayByCash,
        canPayByEcard,
      };
      getMarginappFetchKioskConfig(params)
        .then((res) => {
          if (!this.isComponentMounted) {
            return;
          }
          if (res?.data?.result?.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l?.product == 'KIOSKLITE');
            let arr = JSON.parse(obj?.data);
            let result = [];
            let isTopMenu = false;
            if (arr?.configList) {
              // 本地js和数据库对比
              let index = arr.configList?.findIndex((item) => item?.id === 34);
              //顶部展示目录
              isTopMenu =
                arr.configList?.findIndex((item) => item?.id === 33)?.value ===
                1;

              // 是否配置了 DP
              const isOpenDualPrice = isCreditChargeEnabled(allSysConfig);

              if (index !== -1) {
                const deviceResult = arr.configList[index].value;
                // 现金/信用卡：仅当服务侧全开且未开 DP 时保留设备值；否则继承服务设置
                const inheritCardCashFromService =
                  !canPayByCard || !canPayByCash || isOpenDualPrice;
                let ecardNeedsPersist = false;

                deviceResult.forEach((i) => {
                  const prev = i?.devicePaymentType || {};
                  const nextCanPayByEcard = canPayByEcard
                    ? prev.canPayByEcard ?? false
                    : false;
                  if (
                    !canPayByEcard &&
                    (prev.canPayByEcard ?? false) !== nextCanPayByEcard
                  ) {
                    ecardNeedsPersist = true;
                  }
                  result.push({
                    ...i,
                    devicePaymentType: {
                      canPayByCard: inheritCardCashFromService
                        ? devicePaymentTypeFromService.canPayByCard
                        : (prev.canPayByCard ?? false),
                      canPayByCash: inheritCardCashFromService
                        ? devicePaymentTypeFromService.canPayByCash
                        : (prev.canPayByCash ?? false),
                      canPayByEcard: nextCanPayByEcard,
                    },
                  });
                });
                arr.configList[index].value = result;
                if (ecardNeedsPersist) {
                  postMarginappConfig(
                    JSON.stringify(cloneDeep(arr)),
                    params
                  ).then(() => {
                    if (this.isComponentMounted) {
                      this.initConfigList(params);
                    }
                  });
                }
              } else {
                selfConfigList.configList.forEach((item) => {
                  if (item.id === 34) {
                    arr.configList.push(item);
                  }
                });
                arr.configList.sort(compare('id'));
              }
              if (this.state.needUpdate) {
                postMarginappConfig(
                  JSON.stringify(cloneDeep(arr)),
                  params
                ).then(() => {
                  if (!this.isComponentMounted) {
                    return;
                  }
                  this.setState({
                    needUpdate: false,
                  });
                  this.initConfigList(params);
                });
              }
            }

            this.setState({
              dataList: result,
              kioskConfig: arr,
            });
          }
          off(window, 'message', this.getData);
        })
        .catch((err) => {
          if (this.isComponentMounted) {
            this.showApiModalTip(err?.message);
          }
          off(window, 'message', this.getData);
        });
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

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      this.initConfigList(event.data.data);
    }
    this.getPosDetail();
    if (process.env.NODE_ENV === 'development') {
      this.initConfigList(getCookie('sessionKey'));
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
    off(window, 'message', this.deleteDeviceConfig);
  }

  handleChangePaymentType = ({ index, type, value }) => {
    const { dataList, posConfigList } = this.state;
    const { t, allSysConfig } = this.props;
    const paymentType = posConfigList?.find(
      (item) => item['app:name'] === 'KIOSK_PAYMENT_TYPE'
    )?.['app:value'];
    const canPayByCard = paymentType.includes('0');
    const canPayByCash = paymentType.includes('1');
    const canPayByEcard = paymentType.includes('2');

    // 不能切换到全局不支持的支付模式
    if (
      (!canPayByCard && type === 'canPayByCard' && value) ||
      (!canPayByCash && type === 'canPayByCash' && value) ||
      (!canPayByEcard && type === 'canPayByEcard' && value)
    ) {
      Toast.info(t('paymentType-not-support'), 2000);
      return;
    }

    //开启charge时，card和cash都必须打开（ecard不受此限制）
    if (
      isCreditChargeEnabled(allSysConfig) &&
      !value &&
      (type === 'canPayByCard' || type === 'canPayByCash')
    ) {
      Toast.info(t('dual-price-pay-tip'), 2000);
      return;
    }

    // 至少支持一种支付模式（card 或 cash，ecard 单独不算）
    const { canPayByCard: prePayByCard, canPayByCash: prePayByCash } =
      dataList[index]?.devicePaymentType || {};
    if (
      (!prePayByCard && type === 'canPayByCash' && !value) ||
      (!prePayByCash && type === 'canPayByCard' && !value)
    ) {
      Toast.info(t('paymentType-need-one'), 2000);
      return;
    }

    const newDataList = dataList.map((item, i) => {
      if (i !== index) {
        return item;
      }
      const { devicePaymentType = {} } = item;
      const newDevicePaymentType = {
        ...devicePaymentType,
        [type]: value,
      };
      return {
        ...item,
        devicePaymentType: newDevicePaymentType,
      };
    });
    this.setState({
      dataList: newDataList,
    });
  };

  handleChangeMenuDisplay = ({ index, menuDisplay }) => {
    const { dataList } = this.state;
    const newDataList = dataList.map((item, i) => {
      if (i !== index) {
        return item;
      }
      return {
        ...item,
        menuDisplay,
      };
    });
    this.setState({
      dataList: newDataList,
    });
  };

  handleChangeBrandDisplay = ({ index, brandDisplay }) => {
    const { dataList } = this.state;
    const newDataList = dataList.map((item, i) => {
      if (i !== index) {
        return item;
      }
      return {
        ...item,
        brandDisplay,
      };
    });
    this.setState({
      dataList: newDataList,
    });
  };

  saveData = (event) => {
    if (event.data.type == 'sessionKey') {
      const { kioskConfig, dataList } = this.state;
      const { configList } = kioskConfig;
      const newConfigList = configList.map((item) => {
        return item.id === 34 ? { ...item, value: dataList } : item;
      });
      const params = {
        ...kioskConfig,
        configList: newConfigList,
      };
      postMarginappConfig(JSON.stringify(params), event.data.data)
        .then((res) => {
          if (!this.isComponentMounted) {
            return;
          }
          this.initConfigList(event.data.data);
          if (res.data.result.successful) {
            Toast.info('SUCCESS!', 2000);
          } else {
            Toast.info('FAILED!', 2000);
          }
          off(window, 'message', this.saveData);
        })
        .catch(() => {
          off(window, 'message', this.saveData);
        });
    }
  };

  handleSave = () => {
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

  openDeleteModal = (deviceId) => {
    this.setState({
      deleteModalOpen: true,
      pendingDeleteDeviceId: deviceId,
    });
  };

  closeDeleteModal = () => {
    this.setState({
      deleteModalOpen: false,
      pendingDeleteDeviceId: null,
      deleteConfirmLoading: false,
    });
  };

  deleteDeviceConfig = (event) => {
    if (event.data.type !== 'sessionKey') {
      return;
    }
    const deviceId = this.deviceIdToDelete;
    if (deviceId == null) {
      off(window, 'message', this.deleteDeviceConfig);
      return;
    }
    const sessionKey = event.data.data;
    const { kioskConfig, dataList } = this.state;
    const newDataList = dataList.filter(
      (d) => String(d.deviceId) !== String(deviceId)
    );
    const newConfigList = kioskConfig.configList.map((item) =>
      item.id === 34 ? { ...item, value: newDataList } : item
    );
    const params = {
      ...kioskConfig,
      configList: newConfigList,
    };
    postMarginappConfig(JSON.stringify(params), sessionKey)
      .then((res) => {
        if (!this.isComponentMounted) {
          return;
        }
        this.deviceIdToDelete = null;
        this.setState({
          deleteModalOpen: false,
          pendingDeleteDeviceId: null,
          deleteConfirmLoading: false,
        });
        this.initConfigList(sessionKey);
        if (res.data.result.successful) {
          Toast.info('SUCCESS!', 2000);
        } else {
          Toast.info('FAILED!', 2000);
        }
        off(window, 'message', this.deleteDeviceConfig);
      })
      .catch(() => {
        this.setState({ deleteConfirmLoading: false });
        off(window, 'message', this.deleteDeviceConfig);
      });
  };

  handleDeleteConfirm = () => {
    const { pendingDeleteDeviceId } = this.state;
    if (pendingDeleteDeviceId == null) {
      return;
    }
    this.deviceIdToDelete = pendingDeleteDeviceId;
    this.setState({ deleteConfirmLoading: true });
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.deleteDeviceConfig);
    if (process.env.NODE_ENV === 'development') {
      this.deleteDeviceConfig({
        data: {
          type: 'sessionKey',
          data: getCookie('sessionKey'),
        },
      });
    }
  };

  render() {
    const { t } = this.props;
    const {
      open,
      msg,
      errorApiShow,
      errorApiMsg,
      dataList: dataList,
      deleteModalOpen,
      deleteConfirmLoading,
    } = this.state;

    return (
      <React.Fragment>
        <div className={styles.serviceBox}>
          <ConfigHeader headTitle={t('device-manage-set')} />
          <div
            style={{
              padding: '2rem',
              height: 'calc(100vh - 15rem)',
              overflowY: 'auto',
              border: '1px solid #ccc',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {dataList.map((item, index) => (
                  <Fragment key={item.deviceId}>
                    <tr key={index}>
                      <td style={{ padding: '10px' }}>
                        License:{item.displayname}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('app_version')}：{item.appVersion}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('device_name')}：{item.deviceName}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('device_ID')}:{item.deviceId}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('system_version')}：{item.deviceType}-
                        {item.deviceSysVersion}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('webview_version')} ：{item?.webviewVersion}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {t('update_time')} ：{item?.updateTime}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <Button
                          danger
                          type="link"
                          onClick={() => this.openDeleteModal(item.deviceId)}
                        >
                          {t('deleteText')}
                        </Button>
                      </td>
                    </tr>
                    <tr key={`${index}-cash`}>
                      <td style={{ padding: '10px' }}>{t('cash')}</td>
                      <td style={{ padding: '10px' }} colSpan={7}>
                        <Checkbox
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByCash',
                              value: true,
                            })
                          }
                          checked={item.devicePaymentType?.canPayByCash}
                        >
                          Yes
                        </Checkbox>
                        <Checkbox
                          style={{ marginLeft: '10px' }}
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByCash',
                              value: false,
                            })
                          }
                          checked={!item.devicePaymentType?.canPayByCash}
                        >
                          No
                        </Checkbox>
                      </td>
                    </tr>
                    <tr
                      key={`${index}-card`}
                      // style={{ borderBottom: '1px solid #ccc' }}
                    >
                      <td style={{ padding: '10px' }}>
                        {t('credit_debit_card')}
                      </td>
                      <td style={{ padding: '10px' }} colSpan={7}>
                        <Checkbox
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByCard',
                              value: true,
                            })
                          }
                          checked={item.devicePaymentType?.canPayByCard}
                        >
                          Yes
                        </Checkbox>
                        <Checkbox
                          style={{ marginLeft: '10px' }}
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByCard',
                              value: false,
                            })
                          }
                          checked={!item.devicePaymentType?.canPayByCard}
                        >
                          No
                        </Checkbox>
                      </td>
                    </tr>
                    <tr key={`${index}-ecard`}>
                      <td style={{ padding: '10px' }}>{t('ecard')}</td>
                      <td style={{ padding: '10px' }} colSpan={7}>
                        <Checkbox
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByEcard',
                              value: true,
                            })
                          }
                          checked={item.devicePaymentType?.canPayByEcard}
                        >
                          Yes
                        </Checkbox>
                        <Checkbox
                          style={{ marginLeft: '10px' }}
                          onClick={() =>
                            this.handleChangePaymentType({
                              index,
                              type: 'canPayByEcard',
                              value: false,
                            })
                          }
                          checked={!item.devicePaymentType?.canPayByEcard}
                        >
                          No
                        </Checkbox>
                      </td>
                    </tr>

                    <tr key={`${index}-menu-display`}>
                      <td style={{ padding: '10px' }}>{t('MenuDisplay')}</td>
                      <td style={{ padding: '10px' }} colSpan={7}>
                        <Radio.Group
                          onChange={(e) =>
                            this.handleChangeMenuDisplay({
                              index,
                              menuDisplay: e.target.value,
                            })
                          }
                          value={item.menuDisplay}
                        >
                          <Radio value={2}>{t('one_two')}</Radio>
                          <Radio value={3}>{t('one_three')}</Radio>
                          <Radio value={4}>{t('one_four')}</Radio>
                          <Radio value={5}>{t('one_five')}</Radio>
                        </Radio.Group>
                      </td>
                    </tr>
                    <tr
                      key={`${index}-brand-display`}
                      style={{ borderBottom: '1px solid #ccc' }}
                    >
                      <td style={{ padding: '10px' }}>
                        {t('BrandDisplayLayout')}
                      </td>
                      <td style={{ padding: '10px' }} colSpan={7}>
                        <Radio.Group
                          onChange={(e) =>
                            this.handleChangeBrandDisplay({
                              index,
                              brandDisplay: e.target.value,
                            })
                          }
                          value={item.brandDisplay}
                        >
                          <Radio value={1}>{t('one_one')}</Radio>
                          <Radio value={2}>{t('one_two')}</Radio>
                          <Radio value={3}>{t('one_three')}</Radio>
                        </Radio.Group>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <ConfigFooter handleSave={this.handleSave} />
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

        <Modal
          open={deleteModalOpen}
          title={t('deleteText')}
          okText={t('confirm')}
          cancelText={t('cancel')}
          confirmLoading={deleteConfirmLoading}
          onOk={this.handleDeleteConfirm}
          onCancel={this.closeDeleteModal}
        >
          <p>{t('device-delete-reset-global-tip')}</p>
        </Modal>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  allSysConfig: state.allSysConfig,
});

export default connect(mapStateToProps, { initConfigParams })(
  withTranslation()(DeviceSetting)
);
