import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import styles from './configApp.module.scss';
import ConfigHeader from '../../component/configHeader';
import GeneralSetting from './generalSetting';
import { initCompanyParams } from '@/actions';
import { fetchCompanyProfile } from '@/api/kioskConfigApi';
import DataBackupButton from './Backup/DataBackupButton';
import DataRestoreButton from './Backup/DataRestoreButton';

class ConfigApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      actived: 0,
    };
  }

  handleChoose = (i) => {
    this.setState({
      actived: i,
    });
  };

  handleGotoPath = (path) => {
    this.props.history.push(path);
  };

  componentDidMount() {
    document.documentElement.style.fontSize = '62.5%';
    // 初始化 merchantProfile，确保 CloudPromotion 组件可以正常加载
    this.initMerchantProfile();
  }

  initMerchantProfile = async () => {
    // 如果 merchantProfile 已经存在，则不需要重新获取
    if (this.props.merchantProfile?.merchantId) {
      return;
    }
    try {
      const res = await fetchCompanyProfile();
      if (res?.data?.result?.successful && res?.data?.company) {
        this.props.initCompanyParams(res.data);
      }
    } catch (error) {
      console.error('ConfigApp: 初始化 merchantProfile 失败', error);
    }
  };

  render() {
    const { t } = this.props;
    const { actived } = this.state;

    return (
      <div className={styles.configContainer}>
        <ConfigHeader headTitle={t('kiosk-config')} showVersion={true} />
        <GeneralSetting
          actived={actived}
          handleChoose={this.handleChoose}
          handleGotoPath={this.handleGotoPath}
        />
        <div className={styles.footer}>
          <div className={styles.backup}>
            <DataBackupButton />
            <DataRestoreButton />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    merchantProfile: state.merchantProfile,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    initCompanyParams: (merchantProf) =>
      dispatch(initCompanyParams(merchantProf)),
  };
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ConfigApp))
);
