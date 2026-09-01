import React from 'react';
import { withTranslation } from 'react-i18next';
import styles from './chooseTable.module.scss';
import {
  compare,
  getCookie,
  getDeviceOrientation,
  judgeSskeyIsActiveTime,
} from '@/utils';
import {
  getTableAreaList,
  getTableInfoById,
  postMarginappConfig,
} from '@/api/kioskConfigApi';
import {
  payByCard,
  payByCash,
  setIsReorderFlag,
  setLocator,
  setSelfConfig,
  setTabelServiceType,
  setTableId,
  spliceOrderBySoldout,
  saveOrderResult,
} from '@/actions';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { getMarginappFetchConfig } from '@/api';
import { cloneDeep } from 'lodash';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
  judgeNeedPayOtherCharge,
} from '@/utils/busTools';
import Loading from '@/component/loading';
import { Alert } from '@material-ui/lab';
import CallerBoard from '@/component/CallerBoard';
import { getChooseTableStatus } from '@/utils/chooseTable';
import Toast from '@/component/toast';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import Dialog from '@/component/dialog';
import { navigatePartySizeIfNeeded } from '@/utils/navigatePartySizeIfNeeded';
import { runJudgeSMSAfterOperation } from '@/utils/runJudgeSMSAfterOperation';

class ChooseTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabIndex: 0,
      tableLayout: { width: 0, height: 0 },
      areaList: [],
      kioskTableInUseList: [],
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      isHasSoldoutDish: false,
      isShowCardMinModal: false,
      currentAmount: 0,
      loadingCount: 0,
      loading: false,
      showCallBoard: false,
      afterCallBoardClearTale: null,
    };
    this.tableLayoutRef = React.createRef();
    this.tableTimer = undefined;
    this.errorTipTimer = undefined;
  }

  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.errorTipTimer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  handleTabChange = (tabIndex) => (e) => {
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'end',
    });
    this.setState({
      tabIndex,
    });
  };

  handleChooseTable = (tableId) => async () => {
    const { t, setTableId } = this.props;

    this.setState({
      loadingCount: this.state.loadingCount + 1,
    });
    try {
      const [tableInfoRes, kioskConfigRes] = await Promise.all([
        getTableInfoById(tableId),
        getMarginappFetchConfig(),
      ]);
      if (tableInfoRes.data?.code === 0) {
        const tableOrders = tableInfoRes.data.data?.table?.orders;
        if (tableOrders.length > 0) {
          Toast.info(t('table-in-use'), 2000);
          const areaList = this.state.areaList;
          const tableList = areaList.find((_) => _.id === this.state.tabIndex);
          if (tableList?.tables) {
            const table = tableList.tables.find((_) => _.id === tableId);
            table.orders = tableOrders;
          }
          this.setState({
            areaList,
            loadingCount: this.state.loadingCount - 1,
          });
          return;
        }
      } else {
        throw new Error(tableInfoRes.data?.msg);
      }

      if (kioskConfigRes.data?.result?.successful) {
        let list = kioskConfigRes.data.marginAppConfigTypes || [];
        let obj = list.find((l) => l.product == 'KIOSKLITE');
        if (obj && obj.data) {
          let arr = JSON.parse(obj.data);
          if (arr.configList) {
            const kioskLicense = getCookie('kioskLicense');
            const inUseConfig = {
              lisense: kioskLicense,
              id: tableId,
            };
            const kioskTableInUseConfig = arr.configList.find(
              (e) => e.id === 41
            );
            if (kioskTableInUseConfig) {
              const kioskTableInUse = kioskTableInUseConfig.value || [];
              const kioskTableInUseFiltered = kioskTableInUse.filter(
                (_) => _.lisense !== kioskLicense
              );
              const tableInUse = kioskTableInUseFiltered.find(
                (_) => _.id === tableId
              );
              if (tableInUse) {
                Toast.info(t('table-in-use'), 2000);
                this.setState({
                  kioskTableInUseList: kioskTableInUseFiltered,
                  loadingCount: this.state.loadingCount - 1,
                });
                return;
              }
              kioskTableInUseFiltered.push(inUseConfig);
              kioskTableInUseConfig.value = kioskTableInUseFiltered;
            } else {
              arr.configList.push({
                id: 41,
                value: [inUseConfig],
                key: 'table-in-use-by-lisense',
              });
              arr.configList.sort(compare('id'));
            }

            const postRes = await postMarginappConfig(
              JSON.stringify(cloneDeep(arr)),
              getCookie('sessionKey')
            );
            if (postRes.data?.result?.successful) {
              this.setState({
                tableId,
              });
              setTableId(tableId);
            } else {
              throw new Error(kioskConfigRes.data?.result?.failureReason);
            }
          }
        }
      } else {
        throw new Error(kioskConfigRes.data?.result?.failureReason);
      }
    } catch (e) {
      this.showApiModalTip(e?.message);
      this.setState({
        loadingCount: this.state.loadingCount - 1,
      });
      return;
    }
    this.setState({
      loadingCount: this.state.loadingCount - 1,
    });

    this.afterChooseTable(true);
  };

  afterChooseTable = async (clearTale) => {
    const { selfConfig, setLocator, setTabelServiceType } = this.props;

    setLocator('');
    setTabelServiceType('DINE_IN');
    const locatorType = selfConfig?.configList?.find(
      (config) => config.id === 28
    )?.value;

    if (locatorType === 1) {
      this.setState({
        showCallBoard: true,
        afterCallBoardClearTale: clearTale,
      });
      return;
    }
    await this.judgeSMSAfterOperation();
  };

  clearTimers = () => {
    if (this.tableTimer) {
      clearInterval(this.tableTimer);
      this.tableTimer = undefined;
    }
    if (this.errorTipTimer) {
      clearTimeout(this.errorTipTimer);
      this.errorTipTimer = undefined;
    }
  };

  initTableData = () => {
    this.props.setTableId(null);
    this.getTableAreaListFromPos(true);
    this.getKioskTableInUseList(true);

    if (this.tableTimer) {
      clearInterval(this.tableTimer);
    }
    this.tableTimer = setInterval(
      () => {
        this.getTableAreaListFromPos();
        this.getKioskTableInUseList();
      },
      1000 * 60 * 5
    );
  };

  getTableAreaListFromPos = async (init) => {
    init &&
      this.setState({
        loadingCount: this.state.loadingCount + 1,
      });
    try {
      const res = await getTableAreaList();
      if (res.data?.msg === 'success') {
        const areaList = res.data.data?.areas || [];
        this.setState({
          areaList,
        });
        if (init && areaList.length > 0) {
          this.getTableLayoutRect();
          this.setState({
            tabIndex: areaList[0].id,
          });
        }
      }
    } catch (e) {}
    init &&
      this.setState({
        loadingCount: this.state.loadingCount - 1,
      });
  };

  getKioskTableInUseList = async (init) => {
    init &&
      this.setState({
        loadingCount: this.state.loadingCount + 1,
      });
    try {
      const res = await getChooseTableStatus(init);
      if (res) {
        this.setState({
          kioskTableInUseList: res,
        });
      }
    } catch (e) {}
    init &&
      this.setState({
        loadingCount: this.state.loadingCount - 1,
      });
  };

  getTableLayoutRect = () => {
    const dom = this.tableLayoutRef.current;
    if (dom) {
      this.setState({
        tableLayout: {
          height: dom.clientHeight,
          width: dom.clientWidth,
        },
      });
    }
  };

  handleClickBack = async () => {
    this.props.setTableId(null);
    getChooseTableStatus(true);
    this.props.history.goBack();
  };

  judgeSMSAfterOperation = async () => {
    const { systemConfig, selfConfig, store } = this.props;

    if (navigatePartySizeIfNeeded(this.props.history, selfConfig)) {
      return;
    }

    await runJudgeSMSAfterOperation({
      systemConfig,
      selfConfig,
      store,
      history: this.props.history,
      payByCard: this.props.payByCard,
      payByCash: this.props.payByCash,
      saveOrderResult: this.props.saveOrderResult,
      kioskConfigUserId: this.props.userId,
      judgeConfigToSoldout: this.judgeConfigToSoldout,
      judgeFillCardMinAmout: this.judgeFillCardMinAmout,
      setLoading: (loading) => this.setState({ loading }),
      onError: this.showApiModalTip,
    });
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
      this.handleClickBack();
    }, 0);
  };

  // 判断是否满足刷卡最低消费金额
  judgeFillCardMinAmout = () => {
    if (calcCardMinAmout()) {
      this.setState({
        isShowCardMinModal: true,
        currentAmount: calcCardMinAmout(),
      });
    } else {
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

  // 仍然下单
  continueReorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    this.setState({
      isHasSoldoutDish: false,
    });
    setTimeout(async () => {
      await this.judgeSMSAfterOperation();
    }, 0);
  };

  closeCallBoard = (locatorVal) => {
    this.setState(
      {
        showCallBoard: false,
      },
      async () => {
        if (!locatorVal) {
          if (this.state.afterCallBoardClearTale) {
            this.initTableData();
            this.setState({ afterCallBoardClearTale: null });
          }
          return;
        } else {
          await this.judgeSMSAfterOperation();
        }
      }
    );
  };

  handleSkip = () => {
    this.afterChooseTable();
  };

  componentDidMount() {
    if (this.props.isReorderFlag) {
      this.handleClickBack();
      return;
    }

    this.initTableData();
  }

  componentWillUnmount() {
    this.clearTimers();
  }

  render() {
    const { t } = this.props;
    const {
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      loadingCount,
      tabIndex,
      areaList,
      tableLayout,
      kioskTableInUseList,
      showCallBoard,
    } = this.state;

    const isVertical = getDeviceOrientation() === 'vertical';

    return (
      <>
        <div className={styles.chooseTable}>
          <div className={styles.chooseTableContent}>
            <div className={styles.chooseTableTitle}>
              {t('choose-table-title')}
            </div>
            <div
              className={`${styles.tableBox} ${isVertical ? styles.tableBoxVertical : ''}`}
            >
              {areaList.length > 0 && (
                <div
                  className={`${styles.tableContent} ${isVertical ? styles.tableContentVertical : ''}`}
                >
                  <div
                    className={`${styles.tableTabs} ${isVertical ? styles.tableTabsVertical : ''}`}
                  >
                    {areaList.map((area) => {
                      const guestNumber = area.tables.reduce((tpv, tcv) => {
                        return (
                          tpv +
                          tcv.orders.reduce((opv, ocv) => {
                            return opv + ocv.numOfGuests;
                          }, 0)
                        );
                      }, 0);
                      return (
                        <div
                          key={area.id}
                          className={`${styles.tableTab} ${isVertical ? styles.tableTabVertical : ''} ${tabIndex === area.id ? styles.tableTabSelected : ''}`}
                          onClick={this.handleTabChange(area.id)}
                        >
                          <span className={styles.tableTabAreaName}>
                            {area.name || ''}({guestNumber})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div ref={this.tableLayoutRef} className={styles.tableLayout}>
                    {areaList.map((area) => (
                      <div
                        key={area.id}
                        style={{
                          display: tabIndex === area.id ? 'block' : 'none',
                        }}
                      >
                        {area.tables.map((table) => {
                          const tableWidth = Math.max(
                            isVertical ? 100 : 120,
                            tableLayout.width *
                              (isVertical ? table.height : table.width)
                          );
                          const tableHeight = Math.max(
                            isVertical ? 120 : 100,
                            tableLayout.height *
                              (isVertical ? table.width : table.height)
                          );
                          const left = isVertical
                            ? tableLayout.width * (1 - table.y) - tableWidth
                            : tableLayout.width * table.x;
                          const top =
                            tableLayout.height *
                            (isVertical ? table.x : table.y);
                          const borderRadius =
                            table.shape === 'ROUND'
                              ? `${(tableLayout.width * table.width) / 2}px`
                              : '0.8rem';
                          const inUse =
                            table.orders.length > 0 ||
                            kioskTableInUseList.find((e) => e.id === table.id);

                          return (
                            <div
                              key={table.id}
                              className={`${styles.table} ${inUse ? styles.tableInUse : ''}`}
                              style={{
                                width: `${tableWidth}px`,
                                height: `${tableHeight}px`,
                                left: `${left}px`,
                                top: `${top}px`,
                                borderRadius,
                              }}
                              onClick={
                                inUse
                                  ? undefined
                                  : this.handleChooseTable(table.id)
                              }
                            >
                              <div className={styles.tableTitle}>
                                {table.name}
                              </div>
                              {inUse && (
                                <div className={styles.tableInUseTip}>
                                  <PeopleAltIcon fontSize="inherit" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.footer}>
              <div className={styles.skipBtn} onClick={this.handleSkip}>
                {t('skip')}
              </div>
            </div>
          </div>
        </div>

        <Dialog
          visible={showCallBoard}
          html={
            <CallerBoard
              tableServiceType="DINE_IN"
              setLocator={setLocator}
              isShowDesc={true}
              onClose={this.closeCallBoard}
            />
          }
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

        <Loading visible={loadingCount > 0 || this.state.loading} />
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    crm: state.crm,
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    currentOrder: state.currentOrder,
    isReorderFlag: state.orderEdit.isReorderFlag,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setLocator,
    setTableId,
    payByCard,
    payByCash,
    spliceOrderBySoldout,
    setIsReorderFlag,
    saveOrderResult,
    setTabelServiceType,
    setSelfConfig,
  })(withTranslation()(ChooseTable))
);
