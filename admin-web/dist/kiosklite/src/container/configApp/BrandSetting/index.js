import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { postMarginappConfig, getMarginappFetchKioskConfig } from '@/api/kioskConfigApi';
import ConfigHeader from '../../../component/configHeader';
import ConfigFooter from '../../../component/configFooter';
import LeftType from './components/LeftType';
import RightContent from './components/RightContent';
import styles from './index.module.scss';
import { off, on } from '@/utils';
import Toast from '../../../component/toast';

const LEFT_TYPE = ['brand-manage', 'menu-setting'];

const devSessionKey = '7drej9rn3d3qc0ersnke18u73v';

class BrandSetting extends Component {
  constructor() {
    super();
    this.isComponentMounted = false;
  }

  state = {
    selected: 'brand-manage',
    brandManage: [],
    allKioskConfig: {},
  };

  componentDidMount() {
    this.isComponentMounted = true;
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.initConfig);

    // for dev
    // this.getKioskConfig(devSessionKey);
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    off(window, 'message', this.initConfig);
    off(window, 'message', this.saveConfig);
  }

  initConfig = (event) => {
    if (event.data.type === 'sessionKey') {
      this.getKioskConfig(event.data.data);
    }
  };

  getKioskConfig = async (sessionKey) => {
    if (!this.isComponentMounted) {
      return;
    }
    const res = await getMarginappFetchKioskConfig(sessionKey);
    if (!this.isComponentMounted) {
      return;
    }
    if (res.data.result.successful) {
      const list = res.data.marginAppConfigTypes;
      const kioskConfig = list?.find((l) => l.product === 'KIOSKLITE');
      const parsedConfig = JSON.parse(kioskConfig?.data || '{}');
      if (!parsedConfig?.brandManage) {
        parsedConfig.brandManage = [];
        await this.setBrandSetting(parsedConfig, sessionKey);
        off(window, 'message', this.initConfig);
        return;
      }
      this.setState({
        brandManage: parsedConfig.brandManage,
        allKioskConfig: parsedConfig,
      });
      off(window, 'message', this.initConfig);
    }
  };

  setBrandSetting = async (config, sessionKey) => {
    if (!this.isComponentMounted) {
      return;
    }
    const newData = JSON.stringify(config);
    const res = await postMarginappConfig(newData, sessionKey);
    if (this.isComponentMounted && res.data?.result?.successful) {
      await this.getKioskConfig(sessionKey);
      Toast.info('SUCCESS', 1000);
    }
    off(window, 'message', this.saveConfig);
  };

  handleChangeType = (type) => {
    this.setState({
      selected: type,
    });
  };

  handleEditBrandManage = (newBrandManage) => {
    this.setState({
      brandManage: newBrandManage,
    });
  };

  handleSave = () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.saveConfig);

    // for dev
    // this.handleSaveConfig(devSessionKey);
  };

  saveConfig = (event) => {
    if (event.data.type === 'sessionKey') {
      this.handleSaveConfig(event.data.data);
    }
  };

  handleSaveConfig = async (sessionKey) => {
    const { allKioskConfig, brandManage } = this.state;
    const newData = {
      ...allKioskConfig,
      brandManage,
    };
    await this.setBrandSetting(newData, sessionKey);
  };

  render() {
    const { t } = this.props;
    const { selected, brandManage } = this.state;

    return (
      <div className={styles.brandWrapper}>
        <ConfigHeader headTitle={t('brand-setting')} />
        <div className={styles.mainWrapper}>
          <LeftType
            types={LEFT_TYPE}
            selected={selected}
            handleChangeType={this.handleChangeType}
          />
          <RightContent
            selected={selected}
            brandManage={brandManage}
            handleEditBrandManage={this.handleEditBrandManage}
          />
        </div>
        <ConfigFooter handleSave={this.handleSave} />
      </div>
    );
  }
}

export default withRouter(withTranslation()(BrandSetting));
