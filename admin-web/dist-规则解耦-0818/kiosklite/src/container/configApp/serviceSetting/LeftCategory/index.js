import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './LeftCategory.module.scss';
import CONFIG_MAP_DETAIL from '@/constants/configDetailMap';

const LEFT_CATE = Object.keys(CONFIG_MAP_DETAIL);

class LeftCategory extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const { t, leftCategoryVal, handleChangeCate } = this.props;

    return (
      <div className={styles.leftCategory}>
        {LEFT_CATE.map((each) => {
          return (
            <div
              className={[
                styles.categoryItem,
                each === leftCategoryVal && styles.selectedCate,
              ].join(' ')}
              key={each}
              onClick={() => handleChangeCate(each)}
            >
              {t(each)}
            </div>
          );
        })}
      </div>
    );
  }
}

export default withRouter(withTranslation()(LeftCategory));
