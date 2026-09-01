import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './requireCategoryTip.module.scss';
import { getCurrentItemLanguage } from '@/utils/busTools';

class RequireCategoryTip extends Component {
  render() {
    const {
      t,
      i18n: { language },
      requireCategory,
    } = this.props;
    let categoryNameList = [];
    let tip = '';

    requireCategory.forEach((item) => {
      const itemName = getCurrentItemLanguage(item.fieldDisplayNameGroups, language) || item.name;
      categoryNameList.push(itemName);
    });
    if (categoryNameList.length == 1) {
      tip = t('category-tip-single');
    } else {
      tip = t('category-tips');
    }

    return (
      <div className={styles.categoryTipBox}>
        <div className={styles.tipTitle}>
          {categoryNameList.join(', ')}, {tip}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    requireCategory: state.requireCategory,
  };
}

export default connect(mapStateToProps)(withTranslation()(RequireCategoryTip));
