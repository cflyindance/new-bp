import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router-dom';
import styles from './orderType.module.scss';
import {
  clearCurrentCategory,
  changeOrderType,
  resetCurrentOrder,
  changePickupTime,
  setCateyPageDomTop,
  setorderPageDomTop,
  clearTogoOption,
  setSelectedBrand,
  setShowBanner,
} from '@/actions';
import ChoosePickUpTime from '@/component/ChoosePickUpTime';
import DINEINIMG from '@/assets/images/DINE_IN.png';
import TOGOIMG from '@/assets/images/TO_GO.png';
import PICKUPIMG from '@/assets/images/PICK_UP.png';

class OrderType extends Component {
  state = {
    showModal: false,
    showPickUpTimeModal: false,
    pickupTimeTip: null,
  };

  selectOrderType = (orderType) => {
    const { currentOrder, resetCurrentOrder, changePickupTime } = this.props;
    window.selectedOrderType = orderType;
    // 品类模式下 多订单类型 切换orderType时 重置订单信息
    if (currentOrder?.orderType !== orderType) {
      resetCurrentOrder();
      changePickupTime(this.state.pickupTimeTip);
      this.props.changeOrderType(orderType);
    }
    this.props.history.push('/orderPage');
  };

  componentDidMount() {
    this.props.clearTogoOption();
    this.props.clearCurrentCategory();
    this.props.setCateyPageDomTop(0);
    this.props.setorderPageDomTop(0);
    window.selectedOrderType = '';
    this.props.setShowBanner(true);
  }

  componentWillUnmount() {
  }

  handlePickUp = (value) => {
    this.setState({ pickupTimeTip: value }, () => {
      this.selectOrderType('PICK_UP');
    });
  };

  pickUpCancel = () => {
    this.setState({
      showPickUpTimeModal: false,
    });
  };

  render() {
    const { t, systemConfig } = this.props;
    const { showPickUpTimeModal } = this.state;

    let welContent = '';
    const orderTypeList =
      systemConfig?.CHOOSE_ORDER_TYPE?.value?.split(',') || [];
    if (orderTypeList?.length) {
      welContent = t('order_type_welcome');
    }

    // 订单类型配置
    const orderTypeConfig = [
      {
        value: '0',
        type: 'DINE_IN',
        bgImg: DINEINIMG,
        translationKey: 'order_type_0',
        onClick: () => this.selectOrderType('DINE_IN'),
      },
      {
        value: '1',
        type: 'TO_GO',
        bgImg: TOGOIMG,
        translationKey: 'order_type_1',
        onClick: () => this.selectOrderType('TO_GO'),
      },
      {
        value: '2',
        type: 'PICK_UP',
        bgImg: PICKUPIMG,
        translationKey: 'order_type_2',
        onClick: () => this.setState({ showPickUpTimeModal: true }),
      },
    ];

    return (
      <>
        <div className={styles.orderTypePanel}>
          <div className={styles.orderTypeContent}>
            <div className={styles.orderTypeTitle}> {welContent} </div>
            <div className={styles.orderTypeBtnList}>
              {orderTypeConfig.map((config) => {
                if (!orderTypeList?.includes(config.value)) {
                  return null;
                }
                return (
                  <div
                    key={config.value}
                    className={styles.card}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (orderTypeList.includes(config.value)) {
                        config.onClick();
                      }
                    }}
                  >
                    <img className={styles.bgImg} src={config.bgImg} />
                    <div className={styles.text}>
                      {t(config.translationKey)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <ChoosePickUpTime
          isShowModal={showPickUpTimeModal}
          handleContinue={this.handlePickUp}
          handleCancel={this.pickUpCancel}
        />
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    menuGroup: state.menuGroup,
    currentOrder: state.currentOrder,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    clearCurrentCategory,
    changeOrderType,
    resetCurrentOrder,
    changePickupTime,
    setCateyPageDomTop,
    setorderPageDomTop,
    clearTogoOption,
    setSelectedBrand,
    setShowBanner,
  })(withTranslation()(OrderType))
);
