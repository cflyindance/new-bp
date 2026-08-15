import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './index.module.scss';
import arrowRight from '@/assets/images/arrow-right.png';
import Icon from '@/component/icon';
import { setLanModal } from '@/actions';
import { systemLanguage } from '@/constants/mockData';
import { solveScrollElem } from '@/utils';
import BackHomeModal from '@/component/backHomeModal';
import LangSwitch from '@/component/LangSwitch';
import NetworkStatus from '@/component/NetworkStatus';
import MobyStatus from '@/component/MobyStatus';
import MobyBattery from '@/component/MobyBattery';
import { getDishItemLanguage } from '@/utils/busTools';

class ComboHeader extends Component {
  state = {
    loading: false,
    isOpenLanSwitch: false,
    isOpenMulLanSelect: false,
  };

  setLoading = (e) => {
    solveScrollElem(e);
    this.setState({ loading: e });
  };

  handleLang = (flag) => {
    this.props.setLanModal(flag);
  };

  handleContinue = () => {
    this.props.history.push('/');
  };

  handleCancel = () => {
    this.setLoading(false);
  };

  // 展示语言开关
  judegIsShowLangSwitch = () => {
    const { selfConfig } = this.props;
    if (selfConfig?.configMap?.id_10?.length === 2) {
      this.setState({ isOpenLanSwitch: true, isOpenMulLanSelect: false });
    } else {
      this.setState({ isOpenLanSwitch: false, isOpenMulLanSelect: true });
    }
  };

  componentDidMount() {
    this.judegIsShowLangSwitch();
  }

  //返回
  backConfirm = () => {
    this.props.history.goBack();
  };

  render() {
    const {
      i18n: { language },
      currentItem,
      handleGoBack = null,
      comboScrollY,
      hideBackButton = false,
    } = this.props;
    const { loading, isOpenLanSwitch, isOpenMulLanSelect } = this.state;

    const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;

    return (
      <React.Fragment>
        <div className={styles.logoBox}>
          <div className={styles.navigateLeft}>
            {!hideBackButton && (
              <img
                src={arrowRight}
                className={styles.backPrePage}
                onClick={() => {
                  handleGoBack ? handleGoBack() : this.backConfirm();
                }}
              />
            )}
            {comboScrollY > 0 && (
              <span className={styles.comboItemsTitle}>
                {getDishItemLanguage(
                  currentItem.fieldDisplayNameGroups,
                  language
                ) || currentItem.name}
              </span>
            )}
          </div>

          <div className={styles.navigateRight}>
            {isOpenLanSwitch && <LangSwitch />}
            {isOpenMulLanSelect && (
              <div
                className={styles.langIcon}
                onClick={() => {
                  this.handleLang(true);
                }}
              >
                <Icon
                  className={styles.languageIcon}
                  type="language"
                  size={3.4}
                  color="#000"
                />
                <div>{langTxt}</div>
              </div>
            )}
            <NetworkStatus />
            <MobyStatus />
            <MobyBattery />
          </div>
        </div>

        {/* 返回首页comfirm */}
        <BackHomeModal
          isShowModal={loading}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    selfConfig: state.selfConfig,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setLanModal,
  })(withTranslation()(ComboHeader))
);
