import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { TreeSelect } from 'antd';
import { getAllKioskMenu } from '@/api/kioskConfigApi';
import menuUtils from '@/utils/getKioskMenu';
import { transformTreeDishIds } from '@/utils/transformTreeMenu';
import styles from './dishDetailSimpleItem.module.scss';

const { resolveKioskMenu } = menuUtils;

const DishDetailSimpleItem = (props) => {
  const {
    t,
    visible,
    configInfo,
    onDishIdsChange,
    i18n: { language },
  } = props;
  const [kioskMenu, setKioskMenu] = useState([]);
  const dishIds = configInfo?.value?.dishIds || [];

  useEffect(() => {
    const loadMenu = async () => {
      const res = await getAllKioskMenu();
      if (res?.data?.data?.menus) {
        const menuGroups = res?.data?.data?.menus?.[0]?.menuGroups || [];
        const comboMenu =
          res?.data?.data?.menus?.[0]?.comboSectionSaleItemDTOList || [];
        setKioskMenu(resolveKioskMenu(menuGroups, comboMenu, language));
      }
    };
    loadMenu();
  }, [language]);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.subLabel}>{t('dish-detail-select-no-attr')}</div>
      <TreeSelect
        className={styles.tree}
        maxTagCount={10}
        allowClear
        treeCheckable
        value={transformTreeDishIds(dishIds)}
        onChange={(val) => {
          onDishIdsChange(configInfo.id, transformTreeDishIds(val, true));
        }}
        getPopupContainer={(node) => node.parentNode}
        fieldNames={{
          label: 'name',
          value: '_id',
          children: 'children',
        }}
        treeData={kioskMenu}
        listHeight={256}
        treeNodeFilterProp="name"
        placeholder={t('dish-detail-select-no-attr')}
      />
    </div>
  );
};

export default withTranslation()(DishDetailSimpleItem);
