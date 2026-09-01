import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './deleteDishModal.module.scss';
import Dialog from '../../component/dialog';
import { getDishItemLanguage } from '@/utils/busTools';

class DeleteDishModal extends Component {
  render() {
    const {
      t,
      i18n: { language },
      isShowModal,
      lastReuqireItem,
      requireCategory,
      handleContinue,
      handleCancel,
    } = this.props;

    let subTitle = '';
    if (lastReuqireItem?.categoryId) {
      let itemName = '';
      let r = requireCategory.find(
        (item) => item.id == lastReuqireItem.categoryId
      );
      if (r) {
        itemName =
          getDishItemLanguage(r.fieldDisplayNameGroups, language) || r.name;
      }
      subTitle = itemName + t('delete-sub-require-category');
    } else {
      subTitle = t('delete-sub');
    }

    return (
      <Dialog
        visible={isShowModal}
        html={
          <div
            className={styles.containerBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.itemBox}>
              <div className={styles.itemName}>{t('delete-dish')}</div>
              <div className={styles.subItemName}>{subTitle}</div>
            </div>
            <div className={styles.btnBox}>
              <span onClick={handleCancel}>{t('think-again')}</span>
              <span onClick={handleContinue} className='linear-animate-btn'>{t('delete')}</span>
            </div>
          </div>
        }
        onClose={handleCancel}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    requireCategory: state.requireCategory,
  };
}

export default connect(mapStateToProps)(withTranslation()(DeleteDishModal));
