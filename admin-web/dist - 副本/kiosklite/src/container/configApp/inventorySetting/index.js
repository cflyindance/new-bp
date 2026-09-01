import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './inventorySetting.module.scss';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import Icon from '../../../component/icon';
import ConfigHeader from '../../../component/configHeader';
// import {selfConfigList} from "../../../constants/selfConfig"
import ConfigFooter from '../../../component/configFooter';
import FoodTree from './foodTree';
import Radio from '../radio';
import {
  fetchMenuGroupList,
  postMarginappConfig,
  getMarginappFetchKioskConfig,
} from '@/api/kioskConfigApi';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import { on, off } from '@/utils';
import { getDishItemLanguage } from '@/utils/busTools';

class InventorySetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allDishes: [],
      idLen: 0,
      msg: '',
      open: false,
      keywords: '',
      selectValue: 'all',
      originalFoodList: [],
      foodList: [],
      soldOutList: [],
      errorApiMsg: '',
      errorApiShow: false,
    };
    this.timer = null;
    this.isComponentMounted = false;
  }

  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  // 格式化菜品树
  getFormatterTree = (list, comboMenu = []) => {
    const comboMenuIds = comboMenu.map((item) => item.saleItemId);
    let idLen = 0;
    let r = [];
    let obj = (item) => {
      let t = {
        id: item.id,
        name: item.name,
        fieldDisplayNameGroups: item.fieldDisplayNameGroups || [],
        itemType: item.itemType,
        comboType: item.comboType,
        children: [],
      };
      if (item.menuCategories && item.menuCategories.length) {
        let c = item.menuCategories;
        c.forEach((k) => {
          if (k.saleItems && k.saleItems.length) {
            const _k = {
              ...k,
              saleItems: k.saleItems.filter((each) =>
                !(
                  comboMenuIds.includes(each.id) &&
                  each.itemPrices?.length > 0 &&
                  each.itemPrices.every(item => item.type.toUpperCase() === 'ALL')
                )
              ),
            };
            t.children.push(obj(_k));
            let g = _k.saleItems;
            g.forEach((s) => {
              idLen++;
              t.children[t.children.length - 1].children.push({ ...obj(s), type: 'dish' });
            });
          }
        });
      }
      return t;
    };

    list.forEach((i) => {
      if (i.menuCategories?.length) {
        r.push(obj(i));
      }
    });

    this.setState({
      idLen,
    });
    return r;
  };

  // 清空搜索
  handleClear = () => {
    let keywords = this.state.keywords;
    if (keywords) {
      this.setState({
        keywords: '',
      });
      this.setState({
        foodList: this.state.originalFoodList,
      });
    }
  };

  // 关键字搜索
  mapTree = (value, arr) => {
    let newarr = [];
    arr.forEach((element) => {
      const {
        i18n: { language },
      } = this.props;
      const itemName =
        getDishItemLanguage(element?.fieldDisplayNameGroups, language) || element?.name;

      if (itemName?.toLowerCase()?.indexOf(value) > -1) {
        newarr.push(element);
      } else {
        if (element?.children && element?.children?.length > 0) {
          let redata = this.mapTree(value, element.children);
          if (redata && redata.length > 0) {
            let obj = {
              ...element,
              children: redata,
            };
            newarr.push(obj);
          }
        }
      }
    });
    return newarr;
  };

  // 匹配后的菜品树
  getNewTree = () => {
    let arr = this.mapTree(
      String(this.state.keywords).trim().toLowerCase(),
      this.state.originalFoodList,
    );
    this.setState({
      foodList: arr,
    });
  };

  // 模糊搜索
  handleInput = debounce(() => {
    this.getNewTree();
  }, 500);

  // all soldout sale
  handleChooseType = (e) => {
    this.setState({ selectValue: e }, () => {
      this.scrollDom.scrollTop = 0;
    });
  };

  // 关联（自选套餐）是否是售罄菜（必选子菜售罄，数量不符合规则等，置为售罄）
  judgeComboIsOpenOrSoldout = (itemInfo, arr, id) => {
    if (itemInfo.itemType !== 'SALE_ITEM' && itemInfo?.comboType !== 'FIXED_SELECTION') {
      let isSoldout = false;
      let isHasId = false;

      // 1、如果有不可重复选择情况
      for (let k = 0; k < itemInfo.comboSections.length; k++) {
        let sct = itemInfo.comboSections[k];
        const min = sct.minNumOfSelectionAllowed;

        // 可以重复选择
        if (sct.allowRepeatedItems) {
          let isAllSoldoutFlag = true;
          // 检查子菜是否是全部售罄状态
          for (let j = 0; j < sct.comboSectionSaleItems.length; j++) {
            let com = sct.comboSectionSaleItems[j];
            if (id && com.saleItemId == id) {
              isHasId = true;
            }
            if (!arr?.includes(com.saleItemId)) {
              isAllSoldoutFlag = false;
              break;
            }
          }

          if (min == undefined) {
            // 至多选择max个
            continue;
          } else {
            // 至少选择min个，equal，range
            if (isAllSoldoutFlag) {
              isSoldout = true;
              if (arr?.indexOf(itemInfo.id) < 0) {
                arr?.push(itemInfo.id);
              }
              break;
            } else {
              continue;
            }
          }
        } else {
          // 不可以重复选择
          let saleLen = 0;
          // 剔除售罄的子菜
          sct.comboSectionSaleItems?.forEach((com) => {
            if (id && com.saleItemId == id) {
              isHasId = true;
            }
            if (!arr?.includes(com.saleItemId)) {
              saleLen++;
            }
          });

          if (min == undefined) {
            // 至多选择max个
            continue;
          } else {
            // 至少选择min个，equal，range
            if (saleLen < min) {
              isSoldout = true;
              if (arr?.indexOf(itemInfo.id) < 0) {
                arr?.push(itemInfo.id);
              }
              break;
            }
          }
        }
      }

      // 2、必选子菜是否是售罄菜的情况
      if (!isSoldout) {
        for (let k = 0; k < itemInfo.comboSections.length; k++) {
          let sct = itemInfo.comboSections[k];
          for (let i = 0; i < sct.comboSectionSaleItems.length; i++) {
            let com = sct.comboSectionSaleItems[i];
            if (id && com.saleItemId == id) {
              isHasId = true;
            }
            // 必选标识
            if (com.preSelected) {
              let bool = arr?.includes(com.saleItemId);
              if (bool) {
                isSoldout = true;
                if (arr?.indexOf(itemInfo.id) < 0) {
                  // arr?.push(itemInfo.id);
                }
                break;
              }
            }
          }
        }
      }

      if (!id) {
        return isSoldout;
      } else if (id && isHasId && !isSoldout) {
        // 售罄的子菜都open，固定套餐也open
        let i = arr?.findIndex((i) => i == itemInfo.id);
        if (i > -1) {
          arr?.splice(i, 1);
        }
      }
    }
  };

  // 当包含的子菜open，判断关联（固定套餐）是否open
  judgeFixedIsOpenOrSoldout = (itemInfo, arr, id) => {
    if (itemInfo.comboType == 'FIXED_SELECTION') {
      let isHasId = false;
      let isSoldout = false;
      for (let k = 0; k < itemInfo.comboSections.length; k++) {
        let sct = itemInfo.comboSections[k];
        // 检查子菜是否有售罄状态
        if (!isSoldout) {
          for (let j = 0; j < sct.comboSectionSaleItems.length; j++) {
            let com = sct.comboSectionSaleItems[j];
            if (id && com.saleItemId == id) {
              isHasId = true;
            }
            if (arr?.includes(com.saleItemId)) {
              isSoldout = true;
              if (arr?.indexOf(itemInfo.id) < 0) {
                arr?.push(itemInfo.id);
              }
              break;
            }
          }
        } else {
          break;
        }
      }

      if (!id) {
        return isSoldout;
      } else if (id && isHasId && !isSoldout) {
        // 售罄的子菜都open，固定套餐也open
        let i = arr?.findIndex((i) => i == itemInfo.id);
        if (i > -1) {
          arr?.splice(i, 1);
        }
      }
    }
  };

  // 在售，售罄切换
  handleSetSoldout = (id, bool, { itemType, comboType }) => {
    let arr = this.state.soldOutList;
    const allDishes = this.state.allDishes;
    // 单个菜
    if (itemType === 'SALE_ITEM') {
      if (bool) {
        arr?.push(id);
        allDishes?.forEach((itemInfo) => {
          this.judgeFixedIsOpenOrSoldout(itemInfo, arr);
          this.judgeComboIsOpenOrSoldout(itemInfo, arr);
        });
      } else {
        let i = arr?.findIndex((i) => i == id);
        if (i > -1) {
          arr?.splice(i, 1);
          allDishes.forEach((itemInfo) => {
            this.judgeFixedIsOpenOrSoldout(itemInfo, arr, id);
            this.judgeComboIsOpenOrSoldout(itemInfo, arr, id);
          });
        }
      }
    } else if (comboType === 'FIXED_SELECTION') {
      if (bool) {
        arr?.push(id);
      } else {
        const allDishes = this.state.allDishes;
        let itemInfo = allDishes?.find((d) => d.id == id);
        if (itemInfo) {
          let isHas = this.judgeFixedIsOpenOrSoldout(itemInfo, arr);
          if (isHas) {
            // 因为子菜有售罄，固定套餐不可设置为open
            const { t } = this.props;
            this.showApiModalTip(t('open-tip'));
            return;
          } else {
            if (bool) {
              arr?.push(id);
            } else {
              let i = arr?.findIndex((i) => i == id);
              if (i > -1) {
                arr?.splice(i, 1);
              }
            }
          }
        }
      }
    } else {
      if (bool) {
        arr?.push(id);
      } else {
        const allDishes = this.state.allDishes;
        let itemInfo = allDishes?.find((d) => d.id == id);
        if (itemInfo) {
          let isHas = this.judgeComboIsOpenOrSoldout(itemInfo, arr);
          if (isHas) {
            // 因为子菜有售罄，自选套餐不可设置为open
            const { t } = this.props;
            this.showApiModalTip(t('open-tip'));
            return;
          } else {
            if (bool) {
              arr?.push(id);
            } else {
              let i = arr?.findIndex((i) => i == id);
              if (i > -1) {
                arr?.splice(i, 1);
              }
            }
          }
        }
      }
    }

    this.setState(
      {
        soldOutList: cloneDeep(arr),
      },
      () => {
        this.handleSave();
      },
    );
  };

  saveData = (event) => {
    if (event.data.type == 'sessionKey') {
      getMarginappFetchKioskConfig(event.data.data)
        .then((res) => {
          if (!this.isComponentMounted) {
            return;
          }
          if (res.data.result.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            let params = cloneDeep(JSON.parse(obj.data));
            params.soldOut = this.state.soldOutList;
            postMarginappConfig(JSON.stringify(params), event.data.data).then((res) => {
              if (!this.isComponentMounted) {
                return;
              }
              if (res.data.result.successful) {
                this.setState({
                  msg: 'SUCCESS',
                  open: true,
                });
              } else {
                this.setState({
                  msg: 'FAIL',
                  open: true,
                });
              }
              setTimeout(() => {
                this.setState({
                  msg: '',
                  open: false,
                });
              }, 800);
            });
          } else {
            this.showApiModalTip(res.data?.result?.failureReason);
          }
          off(window, 'message', this.saveData);
        })
        .catch((err) => {
          this.showApiModalTip(err?.message);
          off(window, 'message', this.saveData);
        });
    }
  };

  handleSave = () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.saveData);
  };

  openData = (event) => {
    if (event.data.type == 'sessionKey') {
      getMarginappFetchKioskConfig(event.data.data)
        .then((res) => {
          if (!this.isComponentMounted) {
            return;
          }
          if (res.data.result.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            let params = cloneDeep(JSON.parse(obj.data));
            params.soldOut = [];
            this.setState({
              soldOutList: [],
            });
            postMarginappConfig(JSON.stringify(params), event.data.data).then((res) => {
              if (!this.isComponentMounted) {
                return;
              }
              if (res.data.result.successful) {
                this.setState({
                  msg: 'SUCCESS',
                  open: true,
                });
              } else {
                this.setState({
                  msg: 'FAIL',
                  open: true,
                });
              }
              setTimeout(() => {
                this.setState({
                  msg: '',
                  open: false,
                });
              }, 800);
            });
          } else {
            this.showApiModalTip(res.data?.result?.failureReason);
          }
          off(window, 'message', this.openData);
        })
        .catch((err) => {
          this.showApiModalTip(err?.message);
          off(window, 'message', this.openData);
        });
    }
  };

  // 一键开启在售
  handleOneOpen = () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.openData);
  };

  // 获取所有菜
  getAllDishes = (menuGroup, comboMenu = []) => {
    let allDishes = [];
    const comboMenuIds = comboMenu.map((item) => item.saleItemId);
    for (let group of menuGroup) {
      if (group.menuCategories) {
        for (let food of group.menuCategories) {
          if (
            food.saleItems &&
            Object.prototype.toString.call(food.saleItems) === '[object Array]'
          ) {
            const saleItems = food.saleItems.filter((each) =>
              !(
                comboMenuIds.includes(each.id) &&
                each.itemPrices?.length > 0 &&
                each.itemPrices.every(item => item.type.toUpperCase() === 'ALL')
              )
            );
            allDishes = allDishes.concat(saleItems);
          }
        }
      }
    }
    this.setState({
      allDishes,
    });
  };

  // 初始化，配置项
  initConfigList = (params) => {
    if (!this.isComponentMounted) {
      return;
    }
    getMarginappFetchKioskConfig(params)
      .then((res) => {
        if (!this.isComponentMounted) {
          return;
        }
        if (res.data.result.successful) {
          // 获取配置成功后，调菜品树接口
          fetchMenuGroupList((resp, comboMenu) => {
            if (!this.isComponentMounted) {
              return;
            }
            if (resp && resp?.length) {
              this.getAllDishes(resp, comboMenu);
              let treeList = this.getFormatterTree(resp, comboMenu);
              this.setState({
                originalFoodList: cloneDeep(treeList),
                foodList: treeList,
              });
            }
          });

          let list = res.data.marginAppConfigTypes;
          let obj = list?.find((l) => l.product == 'KIOSKLITE');
          if (obj) {
            let arr = JSON.parse(obj.data);
            if (arr?.soldOut?.length) {
              this.setState({
                soldOutList: arr.soldOut,
              });
            }
          }
        } else {
          this.showApiModalTip(res.data?.result?.failureReason);
        }
        off(window, 'message', this.getData);
      })
      .catch((err) => {
        this.showApiModalTip(err?.message);
        off(window, 'message', this.getData);
      });
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      this.initConfigList(event.data.data);
    }
  };

  componentDidMount() {
    this.isComponentMounted = true;
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.getData);
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    clearTimeout(this.timer);
    off(window, 'message', this.getData);
    off(window, 'message', this.openData);
    off(window, 'message', this.saveData);
  }

  render() {
    const { t } = this.props;
    const {
      idLen,
      selectValue,
      foodList,
      soldOutList,
      keywords,
      msg,
      open,
      errorApiShow,
      errorApiMsg,
    } = this.state;
    let isShowOneOpen = true;
    if (selectValue == 'sale') {
      isShowOneOpen = false;
    }

    let isOpenBtn = !!soldOutList.length;

    let noFood = false;
    if (
      !foodList.length ||
      (selectValue == 'sale' && soldOutList.length == idLen) ||
      (selectValue == 'sell-out' && !soldOutList.length)
    ) {
      noFood = true;
    }

    return (
      <div className={styles.inventoryBox}>
        <ConfigHeader />

        <div className={styles.search}>
          <input
            type="text"
            placeholder={t('config-search')}
            value={keywords}
            onChange={(e) => {
              this.setState(
                {
                  keywords: e.target.value,
                },
                () => {
                  this.handleInput();
                },
              );
            }}
          />
          <Icon
            className={styles.iconEmpty}
            type="round_close_light"
            size={3}
            onClick={this.handleClear}
          />
        </div>

        {/* radio选择 */}
        <div className={styles.inventoryContent}>
          <div className={styles.type}>
            <div className={styles.radioBox}>
              <div onClick={() => this.handleChooseType('all')}>
                <Radio checkedB={selectValue == 'all'} />
                <span>{t('all')}</span>
              </div>
              <div onClick={() => this.handleChooseType('sale')}>
                <Radio checkedB={selectValue == 'sale'} />
                <span>{t('sale')}</span>
              </div>
              <div onClick={() => this.handleChooseType('sell-out')}>
                <Radio checkedB={selectValue == 'sell-out'} />
                <span>{t('sell-out')}</span>
              </div>
            </div>
          </div>

          {/* 一键开启 */}
          <div
            className={styles.one}
            style={{
              display: isShowOneOpen ? 'flex' : 'none',
            }}
          >
            <span>{t('one-click-dishes')}</span>
            {/* <span>{JSON.stringify(errorApiShow)}</span> */}
            {/* <span>{JSON.stringify(errorApiMsg)}</span> */}
            <span
              className={[styles.open, isOpenBtn && styles.actived].join(' ')}
              onClick={() => {
                if (isOpenBtn) {
                  this.handleOneOpen();
                }
              }}
            >
              {t('config-open')}
            </span>
          </div>

          {/* 菜品树 */}
          <div
            className={styles.foodListTree}
            ref={(el) => (this.scrollDom = el)}
            style={{
              height: isShowOneOpen ? 'calc(100vh - 26rem)' : 'calc(100vh - 19.6rem)',
              marginTop: isShowOneOpen ? 0 : '0.5rem',
            }}
          >
            {noFood ? (
              <div className={styles.noFood}>{t('no-dishes-result')}</div>
            ) : (
              foodList.map((f) => {
                return (
                  <FoodTree
                    key={f.id}
                    foodInfo={f}
                    soldOutList={soldOutList}
                    selectValue={selectValue}
                    handleSetSoldout={this.handleSetSoldout}
                  />
                );
              })
            )}
          </div>
        </div>

        <ConfigFooter isHidden={true} />

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={open}
          message={msg}
          key={'topcenter'}
        />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        
      </div>
    );
  }
}

export default withRouter(withTranslation()(InventorySetting));
