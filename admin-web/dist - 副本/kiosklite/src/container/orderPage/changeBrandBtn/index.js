import React, { useState } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { setBrandMenu, setSelectedBrand } from '@/actions';
import BrandList from '../../mainPage/components/BrandList';
import Dialog from '@/component/dialog';
import menuUtil from '@/utils/getKioskMenu';
import styles from './changeBrandBtn.module.scss';

const { handleGetBrandMenu } = menuUtil;

const ChangeBrandBtn = ({
  t,
  selfConfig,
  menuGroup,
  currentOrder,
  setSelectedBrand,
  setBrandMenu,
}) => {
  const [showBrandList, setShowBrandList] = useState(false);

  const isOpenBrandSetting = selfConfig?.configList?.find(
    (config) => config.id === 26
  )?.value;

  if (!isOpenBrandSetting) {
    return null;
  }

  const { brandManage } = selfConfig;

  const handleOpenBrandOption = () => {
    setShowBrandList(true);
  };

  const closeBrandList = (brand) => {
    setShowBrandList(false);
    if (!brand) return;
    const { dishIds } = brand;
    const brandMenu = handleGetBrandMenu(menuGroup, dishIds);
    setBrandMenu(brandMenu);
    setSelectedBrand(brand);
  };

  return (
    <>
      <div className={styles.changeBrandAnchor}>
        <div className={styles.changeBrandBtn} onClick={handleOpenBrandOption}>
          {t('changeBrand')}
        </div>
      </div>

      <Dialog
        visible={showBrandList}
        html={
          <BrandList
            brandManage={brandManage}
            menuGroup={menuGroup}
            currentOrder={currentOrder}
            selfConfig={selfConfig}
            onClose={closeBrandList}
          />
        }
      />
    </>
  );
};

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    menuGroup: state.menuGroup,
    currentOrder: state.currentOrder,
  };
}

export default connect(mapStateToProps, {
  setSelectedBrand,
  setBrandMenu,
})(withTranslation()(ChangeBrandBtn));
