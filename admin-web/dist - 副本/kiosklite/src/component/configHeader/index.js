import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './configHeader.module.scss';
import { getVersion } from '@/api';
import { getMarginappFetchKioskConfig } from '@/api/kioskConfigApi';
import { setSelfConfig } from '@/actions';
import {
  getCookie,
  isDevelopment,
  isIntegration,
  requestKioskConfigSessionKey,
} from '@/utils';
import DescViewModal from '@/component/DescViewModal';
import VersionRecordDescription from '@/component/VersionRecordDescription';
import ConfigPageLoading from '@/container/configApp/ConfigPageLoading';

class ConfigHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: '',
      environment: '',
      showVersionRecordModal: false,
    };
  }
  // 检测版本更新
  getCurrentVersion = () => {
    getVersion().then((res) => {
      this.setState({ version: res.data.version });
    });
  };

  // 环境
  getEnvironment = () => {
    this.setState({
      environment: isDevelopment() ? 'DEV' : isIntegration() ? 'QA' : '',
    });
  };

  syncSelfConfigIfNeeded = async () => {
    const { showVersion, selfConfig, setSelfConfig: setSelfConfigAction } =
      this.props;
    if (!showVersion || selfConfig?.configList?.length) {
      return;
    }
    try {
      const sessionKey =
        process.env.NODE_ENV === 'development'
          ? getCookie('sessionKey')
          : await requestKioskConfigSessionKey();
      const res = await getMarginappFetchKioskConfig(sessionKey);
      if (!res?.data?.result?.successful) {
        return;
      }
      const obj = res.data.marginAppConfigTypes?.find(
        (item) => item.product === 'KIOSKLITE'
      );
      if (!obj?.data) {
        return;
      }
      const config = JSON.parse(obj.data);
      if (config?.configList?.length) {
        setSelfConfigAction(config);
      }
    } catch (e) {
      // 配置页 iframe 内 sessionKey 未就绪时静默失败，由 generalSetting 后续同步
    }
  };

  componentDidMount() {
    this.getCurrentVersion();
    this.getEnvironment();
    this.syncSelfConfigIfNeeded();
  }

  render() {
    const { headTitle, showVersion = false, selfConfig, t } = this.props;
    const { version, environment, showVersionRecordModal } = this.state;
    return (
      <>
        <ConfigPageLoading />
        <div className={styles.configHeader}>
          <div className={styles.title}>
            <span></span>
            <span>{headTitle || ''}</span>
            {showVersion ? (
              <span
                className={styles.version}
                onClick={(e) => {
                  e.stopPropagation();
                  this.setState({ showVersionRecordModal: true });
                }}
              >{`${environment ? `[${environment}]` : ''}Kiosk-V${version}`}</span>
            ) : (
              <span></span>
            )}
          </div>
        </div>
        {showVersion && (
          <DescViewModal
            visible={showVersionRecordModal}
            title={t('version_record_title')}
            description={
              <VersionRecordDescription selfConfig={selfConfig} />
            }
            onClose={() => this.setState({ showVersionRecordModal: false })}
          />
        )}
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setSelfConfig: (data) => dispatch(setSelfConfig(data)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation()(ConfigHeader));
