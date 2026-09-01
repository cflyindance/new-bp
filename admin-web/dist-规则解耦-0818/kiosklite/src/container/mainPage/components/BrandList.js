import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './BrandList.module.scss';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { homeHash } from '@/constants/mockData';
import { EventBus } from '@/utils/EventBus';
import ModalHeader from '@/component/Modal/ModalHeader';
import BackHomeModal from '@/component/backHomeModal';
import BrandListContent from './BrandListContent';

dayjs.extend(isBetween);

class BrandList extends Component {
  state = {
    hourInfo: [],
    showModal: false,
  };

  handleCloseBrandList = () => {
    const { onClose, GoBack } = this.props;
    onClose?.(false);
    if (!homeHash.includes(window.location.hash)) GoBack?.();
  };

  handleGoBack = () => {
    const { currentOrder } = this.props;
    if (!currentOrder?.itemList?.length) {
      this.handleCloseBrandList();
      return;
    }
    this.setState({
      showModal: true,
    });
  };

  handleContinue = () => {
    this.setState({
      showModal: false,
    });
    this.handleCloseBrandList();
  };

  handleCancel = () => {
    this.setState({
      showModal: false,
    });
  };

  render() {
    const { onClose, menuGroup, brandManage, t, showHomePage, selfConfig } =
      this.props;
    const { showModal } = this.state;

    return (
      <>
        <div className={styles.brandList}>
          {/* <ModalHeader handleGoBack={this.handleGoBack} /> */}
          <BrandListContent
            menuGroup={menuGroup}
            brandManage={brandManage}
            selfConfig={selfConfig}
            onSelectEffect={onClose}
          />
          {(showHomePage || !homeHash.includes(window.location.hash)) && (
            <div
              className={styles.cancel}
              onClick={() => {
                onClose(false);
              }}
            >
              {t('cancel')}
            </div>
          )}
        </div>

        {/* 返回首页comfirm */}
        <BackHomeModal
          isShowModal={showModal}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />
      </>
    );
  }
}

export default withTranslation()(BrandList);
