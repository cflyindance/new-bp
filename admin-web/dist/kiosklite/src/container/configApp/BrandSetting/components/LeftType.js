import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './leftType.module.scss';
import classNames from 'classnames';

class LeftType extends Component {
  constructor() {
    super();
  }

  render() {
    const { types, selected, handleChangeType, t } = this.props;
    return (
      <div className={styles.leftType}>
        {types.map((each) => {
          return (
            <div
              className={classNames(styles.typeItem, selected === each && styles.select)}
              key={each}
              onClick={() => handleChangeType(each)}
            >
              {t(`${each}`)}
            </div>
          );
        })}
      </div>
    );
  }
}

export default withRouter(withTranslation()(LeftType));
