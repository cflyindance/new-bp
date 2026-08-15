import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './foodTree.module.scss';
import Switch from '../../switch';
import { getCurrentItemLanguage, getDishItemLanguage } from '@/utils/busTools';

class FoodTree extends Component {
  handleChangeSwitch = (id, bool, itemInfo) => {
    this.props.handleSetSoldout(id, bool, itemInfo);
  };

  // 子节点都空，不展示父节点
  showFoodTitleById = (cate) => {
    let isHasCildrenEl = true;
    const { soldOutList, selectValue } = this.props;
    if (selectValue == 'all') {
      isHasCildrenEl = true;
    } else if (selectValue == 'sell-out') {
      if (cate.children.length) {
        let arr = [];
        for (let k = 0; k < cate.children.length; k++) {
          let o = cate.children[k];
          arr.push(soldOutList.includes(o.id));
        }
        let result = arr.every((_) => _ == false);
        isHasCildrenEl = !result;
      }
    } else if (selectValue == 'sale') {
      if (cate.children.length) {
        let arr = [];
        for (let k = 0; k < cate.children.length; k++) {
          let o = cate.children[k];
          arr.push(soldOutList.includes(o.id));
        }
        let result = arr.every((_) => _ == true);
        isHasCildrenEl = !result;
      }
    }

    return isHasCildrenEl;
  };

  // 判断子节点，是否售罄
  showDishById = (id) => {
    const { soldOutList, selectValue } = this.props;
    let isShow = true;
    if (selectValue == 'all') {
      isShow = true;
    } else if (selectValue == 'sell-out') {
      isShow = soldOutList.includes(id);
    } else if (selectValue == 'sale') {
      isShow = !soldOutList.includes(id);
    }
    return isShow;
  };

  showpSale = () => {
    let fArr = [];
    let arr = [];
    const { foodInfo, soldOutList } = this.props;
    const menuCategories = foodInfo.children;
    menuCategories.forEach((m) => {
      m.children.forEach((c) => {
        arr.push(c.id);
      });
    });

    for (let i = 0; i < arr.length; i++) {
      fArr.push(soldOutList.includes(arr[i]));
    }

    return !fArr.map((_) => _);
  };

  showp = () => {
    let flag = false;
    let arr = [];
    const { foodInfo, soldOutList } = this.props;
    const menuCategories = foodInfo.children;
    menuCategories.forEach((m) => {
      m.children.forEach((c) => {
        arr.push(c.id);
      });
    });

    for (let i = 0; i < soldOutList.length; i++) {
      if (arr.includes(soldOutList[i])) {
        flag = true;
        break;
      }
    }

    return flag;
  };

  render() {
    const {
      t,
      i18n: { language },
      foodInfo,
      soldOutList,
      selectValue,
    } = this.props;
    const menuCategories = foodInfo.children;

    let f = true;
    if (selectValue == 'sell-out') {
      f = this.showp();
    } else if (selectValue == 'sale') {
      f = this.showpSale();
    }

    return (
      <div className={styles.foodTreeBox}>
        <div
          className={styles.foodTreeTitle}
          style={{
            display: f ? 'block' : 'none',
          }}
        >
          {getDishItemLanguage(foodInfo.fieldDisplayNameGroups, language) || foodInfo.name}
        </div>

        {menuCategories.map((cate) => {
          return this.showFoodTitleById(cate) ? (
            <div className={styles.cateContent} key={cate.id}>
              <div className={styles.cateName}>
                {getCurrentItemLanguage(cate.fieldDisplayNameGroups, language) || cate.name}
              </div>
              {cate.children.map((c) => {
                let checkedB = !soldOutList.includes(c.id);

                return this.showDishById(c.id) ? (
                  <div className={styles.foodContent} key={c.id}>
                    <span className={styles.foodName}>
                      {getCurrentItemLanguage(c.fieldDisplayNameGroups, language) || c.name}
                    </span>
                    <span className={styles.foodSet}>
                      <i>{t('sell-out')}</i>
                      <Switch
                        itemInfo={c}
                        fId={c.id}
                        checkedB={checkedB}
                        handleChangeSwitch={this.handleChangeSwitch}
                      />
                      <i>{t('sale')}</i>
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          ) : null;
        })}
      </div>
    );
  }
}

export default withTranslation()(FoodTree);
