import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './configFooter.module.scss';
import Icon from '../icon';

class ConfigFooter extends Component {
  render() {
    const { t, isHidden } = this.props;

    return (
      <div className={styles.serviceFoot}>
        <div
          className={styles.serviceBack}
          onClick={() => {
            this.props.history.replace('/configApp');
          }}
        >
          <Icon type="fenxiang" size="3" color="#666" />
        </div>

        {!isHidden ? (
          <div className={styles.serviceSave} onClick={this.props.handleSave}>
            {t('save')}
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(withTranslation()(ConfigFooter));
