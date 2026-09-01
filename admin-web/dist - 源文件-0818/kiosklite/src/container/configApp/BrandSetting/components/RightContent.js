import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './rightContent.module.scss';
import BrandManage from './BrandManage';
import MenuSetting from './MenuSetting';

class RightContent extends Component {
  render() {
    const { selected, brandManage, handleEditBrandManage } = this.props;
    return (
      <div className={styles.rightContent}>
        {selected === 'brand-manage' && (
          <BrandManage brandManage={brandManage} handleEditBrandManage={handleEditBrandManage} />
        )}
        {selected === 'menu-setting' && (
          <MenuSetting brandManage={brandManage} handleEditBrandManage={handleEditBrandManage} />
        )}
      </div>
    );
  }
}

export default withRouter(withTranslation()(RightContent));
