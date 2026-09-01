import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './transferPosSetting.module.scss';
import Checkbox from '../../checkbox';
import Switch from '../../switch';
import Toast from '@/component/toast';
import { getKioskConfigFromPos, saveKioskConfigFromPos } from '@/api/apiPos';
import { XMLObjTree } from '@/utils/ObjectTree';
import cloneDeep from 'lodash/cloneDeep';
import CONFIG_MAP_DETAIL from '@/constants/configDetailMap';
import { initConfigParams } from '@/actions';
import {
  fetchAndDispatchAllSysConfig,
  isCreditChargeEnabled,
} from '@/utils/allSysConfigHelper';
import Modal from '@/component/Modal/index';
import SubmitModal from './SubmitModal';
import { promiseFinally } from '@/utils/promiseFinally';

// pos迁移的功能的key值
const keysList = [
  'CHOOSE_ORDER_TYPE',
  'KIOSK_SEND_MESSAGE',
  'KIOSK_PAYMENT_TYPE',
];

class TransferPosSetting extends Component {
  constructor() {
    super();
    this.state = {
      posConfigList: [],
      originalPosConfigList: [],
      isCRMEnable: false,
      posConfigLoading: false,
    };
  }

  handleCheckBox = (id, e) => {
    const { t, waitList } = this.props;
    const { posConfigList } = this.state;
    let waitValue = waitList[0]?.props?.configInfo?.value;
    let i = posConfigList.findIndex((c) => c['app:id'] == id);
    let arr = posConfigList[i]['app:value'].split(',');
    if (waitValue) {
      if (posConfigList[i]['app:name'] === 'CHOOSE_ORDER_TYPE') {
        let idx = arr?.indexOf(e);
        if (idx > -1) {
          arr?.splice(idx, 1);
        } else {
          arr?.push(e);
        }
      } else {
        if (i > -1) {
          if (arr.length == 1) {
            if (arr[0] == '') {
              arr?.splice(0, 1, e);
            } else if (arr[0] == e) {
              Toast.info(t('pay-tip'), 1000);
            } else {
              let idx = arr?.indexOf(e);
              if (idx > -1) {
                arr?.splice(idx, 1);
              } else {
                arr?.push(e);
              }
            }
          } else {
            let idx = arr?.indexOf(e);
            if (idx > -1) {
              arr?.splice(idx, 1);
            } else {
              arr?.push(e);
            }
          }
        }
      }
      posConfigList[i]['app:value'] = arr?.join(',');
    } else {
      if (i > -1) {
        if (arr.length == 1) {
          if (arr[0] == '') {
            arr?.splice(0, 1, e);
          } else if (arr[0] == e) {
            let tip = '';
            if (posConfigList[i]['app:name'] === 'KIOSK_PAYMENT_TYPE') {
              tip = 'pay-tip';
            } else {
              tip = 'order-type-tip';
            }
            Toast.info(t([tip]), 1000);
          } else {
            let idx = arr?.indexOf(e);
            if (idx > -1) {
              arr?.splice(idx, 1);
            } else {
              arr?.push(e);
            }
          }
        } else if (
          arr.length == 2 &&
          posConfigList[i]['app:name'] === 'KIOSK_PAYMENT_TYPE'
        ) {
          const isCardAndCash = arr.every((v) => v === '0' || v === '1');
          let idx = arr?.indexOf(e);
          if (!isCardAndCash && idx > -1 && e !== '2') {
            Toast.info(t('cannot-select-only-ecard'), 2000);
            return;
          }
          if (idx > -1) {
            arr?.splice(idx, 1);
          } else {
            arr?.push(e);
          }
        } else {
          let idx = arr?.indexOf(e);
          if (idx > -1) {
            arr?.splice(idx, 1);
          } else {
            arr?.push(e);
          }
        }
        posConfigList[i]['app:value'] = arr?.join(',');
      }
    }

    const orderTypeValue = posConfigList?.find(
      (each) =>
        each['app:id'] === 601 || each['app:name'] === 'CHOOSE_ORDER_TYPE'
    )?.['app:value'];

    // orderType都开启时，自动开启展示页面配置
    if (orderTypeValue?.split(',')?.length > 1) {
      this.props.handleChange(25, false);
    }

    this.setState({
      posConfigList: cloneDeep(posConfigList),
    });
  };

  handleChangeSwitch = (id, bool, itemInfo) => {
    const { isCRMEnable } = this.state;
    const { t } = this.props;

    // 开启CRM时， 不允许关闭SMS
    if (isCRMEnable && itemInfo['app:name'] === 'KIOSK_SEND_MESSAGE' && bool) {
      Toast.info(t('crmOpen'), 1000);
      return;
    }
    const { posConfigList } = this.state;
    let i = posConfigList?.findIndex((c) => c['app:id'] == id);
    if (i > -1) {
      posConfigList[i]['app:value'] = String(!bool);
    }

    this.setState({
      posConfigList: cloneDeep(posConfigList),
    });
  };

  isPosConfigReady = () => {
    const { posConfigList } = this.state;
    return (
      posConfigList?.length === keysList.length &&
      keysList.every((key) =>
        posConfigList.some((item) => item['app:name'] === key)
      )
    );
  };

  // 判断
  judgeIsSave = () => {
    const { t, waitList } = this.props;
    const { posConfigList } = this.state;

    return new Promise((resolve, reject) => {
      let r1 = posConfigList?.find(
        (p1) => p1['app:name'] === 'CHOOSE_ORDER_TYPE'
      );
      let r2 = posConfigList?.find(
        (p2) => p2['app:name'] === 'KIOSK_PAYMENT_TYPE'
      );
      let waitValue = waitList[0]?.props?.configInfo?.value;
      if (waitValue) {
        if (r2['app:value'] === '') {
          Toast.info(t('pay-tip'), 1000);
          reject(t('pay-tip'));
        } else {
          resolve('pass');
        }
      } else {
        if (r1['app:value'] === '' && r2['app:value'] === '') {
          Toast.info(t('order-type-tip') + ', ' + t('pay-tip'), 1000);
          reject(t('order-type-tip') + ', ' + t('pay-tip'));
        } else if (r1['app:value'] === '') {
          Toast.info(t('order-type-tip'), 1000);
          reject(t('order-type-tip'));
        } else if (r2['app:value'] === '') {
          Toast.info(t('pay-tip'), 1000);
          reject(t('pay-tip'));
        } else {
          resolve('pass');
        }
      }
    });
  };

  savePosDetail = async () => {
    const { userId } = this.props;
    const { posConfigList, originalPosConfigList } = this.state;

    // POS 数据未拉全（接口失败/缺项）时跳过写入，避免提交空 XML；加载中由 saveData 入口拦截
    if (!this.isPosConfigReady()) {
      return Promise.resolve();
    }

    // 对比 choose order type
    const orderType = posConfigList
      .find((each) => each['app:name'] === 'KIOSK_PAYMENT_TYPE')
      ?.['app:value']?.split(',')
      .sort((a, b) => Number(a) - Number(b))
      .join(',');
    const preOrderType = originalPosConfigList
      .find((each) => each['app:name'] === 'KIOSK_PAYMENT_TYPE')
      ?.['app:value']?.split(',')
      .sort((a, b) => Number(a) - Number(b))
      .join(',');
    if (orderType !== preOrderType) {
      const res = await Modal.loadModal(<SubmitModal />, {
        width: '500px',
        footer: null,
        title: null,
        maskClosable: false,
      });
      if (!res) return Promise.reject('cancel save config');
    }
    let str = '';
    return new Promise((resolve, reject) => {
      this.judgeIsSave()
        .then(() => {
          posConfigList.forEach((item) => {
            str += `<app:systemConfiguration><app:id>${item['app:id']}</app:id><app:name>${item['app:name']}</app:name><app:value>${item['app:value']}</app:value><app:dataType>${item['app:dataType']}</app:dataType></app:systemConfiguration>`;
          });

          saveKioskConfigFromPos(str, userId).then((res) => {
            let findAppInstances = res.data;
            try {
              let start = findAppInstances?.indexOf('<soap:Body>');
              let end = findAppInstances?.indexOf('</soap:Body>');
              findAppInstances = findAppInstances?.substring(start + 11, end);
              let objTree = new XMLObjTree();
              let instanceList = objTree.parseXML(findAppInstances);
              let r =
                instanceList?.updatesystemconfigurationresponsetype?.result;
              if (r.successful === 'true') {
                this.setState({
                  originalPosConfigList: cloneDeep(posConfigList),
                });
                resolve(r);
              } else {
                reject(err);
              }
            } catch (err) {
              reject(err);
            }
          });
        })
        .catch((e) => {
          reject(e);
          console.log(e);
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

  getPosDetail = () => {
    this.setState({ posConfigLoading: true });
    return new Promise((resolve, reject) => {
      promiseFinally(
        getKioskConfigFromPos()
          .then((res) => {
            const list = [];
            let r = res?.data ? this.parseLicenseXml(res.data) || [] : [];
            if (r?.length) {
              keysList?.forEach((k, i) => {
                let result = r?.find((item) => item.name === k);
                if (result) {
                  switch (i) {
                    case 0:
                    case 2:
                      let newArr = [];
                      let arr = String(result.value)?.split(',');
                      arr?.forEach((t) => {
                        if (t !== '' && t !== 'undefined' && t !== 'null') {
                          newArr?.push(t);
                        }
                      });
                      list?.push({
                        'app:id': result.id,
                        'app:name': result.name,
                        'app:value': String(newArr.join(',')),
                        'app:dataType': 'String',
                      });
                      break;
                    case 1:
                      list?.push({
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
              originalPosConfigList: cloneDeep(list),
            });
            resolve(res.data);
          })
          .catch(reject),
        () => {
          this.setState({ posConfigLoading: false });
        }
      );
    });
  };

  handleGetCrmConfig = async () => {
    const config = await fetchAndDispatchAllSysConfig(
      this.props.initConfigParams,
      this.props.allSysConfig
    );
    if (Object.keys(config).length) {
      const isCRMEnable =
        config.CRM_SERVICE_ENABLED === 'true' ||
        config.CRM_SERVICE_ENABLED === true ||
        config.CRM_INTEGRATION_SERVICE_ENABLED === 'true' ||
        config.CRM_INTEGRATION_SERVICE_ENABLED === true;
      this.setState({
        isCRMEnable,
      });
    }
  };

  componentDidMount() {
    this.props.onRef(this);
    this.handleGetCrmConfig();
  }

  render() {
    const {
      t,
      allSysConfig,
      waitList,
      receiptList,
      phoneList,
      tipList,
      serviceList,
      leftCategoryVal,
    } = this.props;
    const { posConfigList } = this.state;
    const contentDom = [];

    // 是否配置了 DP
    const isOpenDualPrice = isCreditChargeEnabled(allSysConfig);

    // 将相似功能的按钮，放在一起
    posConfigList?.map((item) => {
      switch (item['app:name']) {
        case 'CHOOSE_ORDER_TYPE':
          contentDom?.push(
            // posName 用于根据左侧类来过滤
            <div
              posName={item['app:name']}
              key={item['app:id']}
              className={styles.serviceBox}
            >
              <div className={styles.serviceTop}>{t('choose-order-type')}</div>
              <div className={styles.serviceBottom}>
                <div
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '0');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('0') > -1} />
                  <span className={styles.checkText}>{t('order_type_0')}</span>
                </div>
                <div
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '1');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('1') > -1} />
                  <span className={styles.checkText}>{t('order_type_1')}</span>
                </div>
                <div
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '2');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('2') > -1} />
                  <span className={styles.checkText}>{t('order_type_2')}</span>
                </div>
              </div>
            </div>,
            ...waitList
          );
          break;
        case 'KIOSK_SEND_MESSAGE':
          contentDom?.push(
            ...receiptList,
            <div
              posName={item['app:name']}
              key={item['app:id']}
              className={styles.serviceBox}
            >
              <div className={styles.serviceTop}>{t('open-SMS')}</div>
              <div className={styles.serviceBottom}>
                <div className={styles.foodSet}>
                  <i>{t('config-close')}</i>
                  <Switch
                    itemInfo={item}
                    fId={item['app:id']}
                    checkedB={item['app:value'] === 'true'}
                    handleChangeSwitch={this.handleChangeSwitch}
                  />
                  <i>{t('config-open')}</i>
                </div>
              </div>
            </div>,
            ...phoneList
          );
          break;
        case 'KIOSK_PAYMENT_TYPE':
          contentDom?.push(
            <div
              posName={item['app:name']}
              key={item['app:id']}
              className={styles.serviceBox}
            >
              <div className={styles.serviceTop}>{t('payment_type')}</div>
              <div className={styles.serviceBottom}>
                {/* 配置了DP， 提示开启两种支付方式*/}
                {isOpenDualPrice && (
                  <span style={{ color: 'red' }}>
                    {t('dual-price-pay-tip')}
                  </span>
                )}

                <div
                  className={styles.checkText}
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '0');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('0') > -1} />
                  <span className={styles.checkText}>
                    {t('credit_debit_card')}
                  </span>
                </div>
                <div
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '1');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('1') > -1} />
                  <span className={styles.checkText}>{t('cash')}</span>
                </div>
                <div
                  onClick={() => {
                    this.handleCheckBox(item['app:id'], '2');
                  }}
                >
                  <Checkbox checkedB={item['app:value']?.indexOf('2') > -1} />
                  <span className={styles.checkText}>{t('ecard')}</span>
                </div>
              </div>
            </div>
          );
          break;
      }
    });

    const allComponent = [...contentDom, ...tipList, ...serviceList];
    const showItemValues = CONFIG_MAP_DETAIL[leftCategoryVal];
    const afterFilter = allComponent?.filter(
      (each) =>
        showItemValues?.includes(each.key) ||
        showItemValues?.includes(each.props.posName)
    );

    const afterSort = [];
    showItemValues?.forEach((id) => {
      const com = afterFilter?.find(
        (item) => item.key === id || item.props.posName === id
      );
      if (com) {
        afterSort?.push(com);
      }
    });

    return (
      <React.Fragment>
        {afterSort}
        {/* 之前代码太多通过ref获取子组件状态/方法的操作了 导致样式改造后获取不到子组件状态 会重置数据 先hack解决吧 */}
        <div
          style={{
            visibility: 'hidden',
            position: 'absolute',
            top: '9999px',
            left: '9999px',
          }}
        >
          {allComponent}
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    userId: state.sysCookie.kioskConfigUserId,
    allSysConfig: state.allSysConfig,
  };
}

export default connect(mapStateToProps, { initConfigParams })(
  withTranslation()(TransferPosSetting)
);
