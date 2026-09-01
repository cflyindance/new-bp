import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { TreeSelect, Button } from 'antd';
import styles from './menuSetting.module.scss';
import { getAllKioskMenu } from '@/api/kioskConfigApi';
import menuUtils from '../../../../utils/getKioskMenu';
import { transformTreeDishIds } from '@/utils/transformTreeMenu';

const { resolveKioskMenu } = menuUtils;

class MenuSetting extends Component {
  componentDidMount() {
    this.handleGetMenu();
  }

  state = {
    kioskMenu: [],
  };

  handleGetMenu = async () => {
    const {
      i18n: { language },
    } = this.props;
    const res = await getAllKioskMenu();
    if (res?.data?.data?.menus) {
      const kioskMenu = res?.data?.data?.menus?.[0]?.menuGroups || [];
      const comboMenu =
        res?.data?.data?.menus?.[0]?.comboSectionSaleItemDTOList || [];
      const validMenu = resolveKioskMenu(kioskMenu, comboMenu, language);
      this.setState({
        kioskMenu: validMenu,
      });
    }
  };

  handleResetSettingDish = (val, id) => {
    const { brandManage, handleEditBrandManage } = this.props;
    const newBrandManage = brandManage.map((each) => {
      if (each.id === id)
        return {
          ...each,
          dishIds: val,
        };
      return each;
    });
    handleEditBrandManage(newBrandManage);
  };

  render() {
    const { brandManage, t } = this.props;
    const { kioskMenu } = this.state;
    return brandManage?.length ? (
      <div className={styles.menuSetting}>
        {brandManage.map((each) => {
          return (
            <div key={each.id} className={styles.menuItem}>
              <div className={styles.itemName}>{each.name}</div>
              <div className={styles.itemSetting}>
                <TreeSelect
                  maxTagCount={10}
                  treeCheckable
                  value={transformTreeDishIds(each.dishIds || [])}
                  onChange={(val) =>
                    this.handleResetSettingDish(
                      transformTreeDishIds(val, true),
                      each.id
                    )
                  }
                  fieldNames={{
                    label: 'name',
                    value: '_id',
                    children: 'children',
                  }}
                  treeData={kioskMenu}
                  listHeight={660}
                  showArrow
                  treeNodeFilterProp="name"
                  getPopupContainer={(node) => node.parentNode}
                />
                <Button
                  type="link"
                  onClick={() => this.handleResetSettingDish(null, each.id)}
                >
                  {t('operate-clear')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className={styles.empty}>{t('create-brand')}</div>
    );
  }
}

export default withRouter(withTranslation()(MenuSetting));
