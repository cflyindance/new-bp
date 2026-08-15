import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './chooseDeleteOrder.module.scss';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import Icon from '@/component/icon';
import MoreTip from '@/component/moreTip';
import Toast from '@/component/toast';
import DeleteDishModal from '@/component/deleteDishModal';
import { on, off } from '@/utils';
import { getItemPrice } from '@/utils/priceCalculator';
import { deleteAllById, spliceOrderItemAction } from '@/actions';
import {
  getCurrentItemLanguage,
  getDishItemLanguage,
  getItemSizeName,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import {
  getItemStockNum,
  getOccupiedQtyByStockId,
  getStockItemId,
  isTotalQtyWithinStock,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import cartBagIMG from '@/assets/images/cart-bag.png';
import Big from 'big.js';
const defaultMax = 99;

class ChooseDeleteOrder extends React.Component {
  constructor() {
    super();
    this.state = {
      isShowMore: false,
      isScroll: false,
      deleteLoading: false, // 删除提示弹框
      maxNum: defaultMax,
      deleteSequence: -1,
      cloneItemList: [],
    };
  }

  // 拼接每一项菜品的options
  orderDetailWriter = (item) => {
    const {
      i18n: { language },
    } = this.props;

    let price = null;
    let options = null;
    let cateOptions = null;
    let stack = [];
    if (item.sectionDetail) {
      item.sectionDetail.forEach((sct) => {
        if (sct.id == -1) {
          price = sct;
        }
        if (sct.id == -2) {
          options = sct;
        }
        if (sct.id == -3) {
          cateOptions = sct;
        }
      });
    }
    if (price) {
      let size = getItemSizeName(
        price.sizeInfo.sizeId,
        price.sizeInfo.size,
        this.props.itemSizeList,
        language
      )
      stack.push(size + '($' + price.sizeInfo.price + ') ');
    }

    if (options) {
      const optMap = this.getOptionMap(options.options);
      Object.keys(optMap).forEach((id, i) => {
        let str =
          optMap[id].name +
          (' ($' + optMap[id].price + ')') +
          (' x' + optMap[id].quantity) +
          (i < Object.keys(optMap).length - 1 ? ', ' : '');
        stack.push(str);
      });
    }

    if (cateOptions) {
      const optMap = this.getOptionMap(cateOptions.options);
      Object.keys(optMap).forEach((id, i) => {
        let str =
          optMap[id].name +
          (' ($' + optMap[id].price + ')') +
          (' x' + optMap[id].quantity) +
          (Object.keys(optMap).length > 0 && i < Object.keys(optMap).length - 1
            ? ', '
            : '');
        stack.push(str);
      });
    }

    if (item.sectionDetail) {
      item.sectionDetail.forEach((sct) => {
        let itemsArr = [];
        // 给固定套餐拼接
        if (sct.id > 0 && sct.items.length > 0) {
          sct.items.map((item) => {
            let str = '';
            if (!item.itemPrices) {
              let name =
                getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
                item.name;
              str = name + ' ($' + item.price + ')' + ' x' + item.quantity;
            }

            let optArr = [];
            if (item.selectedOptionList) {
              item.selectedOptionList.forEach((list) => {
                if (list.id == -1) {
                  let name =
                    getDishItemLanguage(
                      item.fieldDisplayNameGroups,
                      language
                    ) || item.name;
                  let size = getItemSizeName(
                    list.sizeInfo.sizeId,
                    list.sizeInfo.size,
                    this.props.itemSizeList,
                    language
                  )

                  optArr.push(
                    `${name}(${size}) ($${list.sizeInfo.price})(x${item.quantity})`
                  );
                } else {
                  const subOptMap = this.getOptionMap(list.options);
                  Object.keys(subOptMap).map((id) => {
                    optArr.push(
                      subOptMap[id].name +
                        (' ($' + subOptMap[id].price + ')') +
                        (' x' + subOptMap[id].quantity)
                    );
                  });
                }
              });
            }
            if (optArr.length > 0) {
              str += optArr.join(',');
              itemsArr.push(str);
            } else {
              itemsArr.push(str);
            }
          });
          stack.push(itemsArr);
        }
      });
    }

    const stackStr = stack.join('');
    return stackStr;
  };

  getOptionMap(options) {
    const {
      i18n: { language },
    } = this.props;

    const map = {};
    options.forEach((opt) => {
      let nameStr =
        (opt?.fieldDisplayNameGroups?.length &&
          getCurrentItemLanguage(opt.fieldDisplayNameGroups, language)) ||
        opt.name;

      if (map[opt.id]) {
        map[opt.id].quantity++;
      } else {
        map[opt.id] = {
          id: opt.id,
          name: nameStr,
          quantity: 1,
          price: opt.price,
        };
      }
    });
    return map;
  }

  // 拼接选择单个菜品的size，options显示
  showCollectOptions = (list) => {
    const {
      i18n: { language },
    } = this.props;
    let sizeArr = [];
    let optionArr = [];
    if (list && list.length) {
      list.forEach((item) => {
        if (item.sizeInfo) {
          let size = getItemSizeName(
            item.sizeInfo.sizeId,
            item.sizeInfo.size,
            this.props.itemSizeList,
            language
          )
          sizeArr.push(`${size}($${item.sizeInfo.price})`);
        }
        if (item.options && item.options.length) {
          let t = item.options.reduce((pre, cur) => {
            let nameStr =
              (cur?.fieldDisplayNameGroups?.length &&
                getCurrentItemLanguage(cur.fieldDisplayNameGroups, language)) ||
              cur.name;
            if (cur.id in pre) {
              pre[cur.id].count++;
            } else {
              pre[cur.id] = {
                count: 1,
                name: nameStr,
                price: cur.price,
              };
            }
            return pre;
          }, {});

          let tArr = [];
          for (let g in t) {
            tArr.push(t[g]);
          }

          tArr.forEach((tItem) => {
            optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
          });
        }
      });
    }
    let nList = [...sizeArr, ...optionArr];
    return nList.join(', ');
  };

  // 拼接自选套餐有categoryOptions的options显示
  showCategoryOptions = (optionsList) => {
    const {
      i18n: { language },
    } = this.props;
    let optionArr = [];
    if (optionsList && optionsList.length) {
      let t = optionsList.reduce((pre, cur) => {
        let nameStr =
          (cur?.fieldDisplayNameGroups?.length &&
            getCurrentItemLanguage(cur.fieldDisplayNameGroups, language)) ||
          cur.name;
        if (cur.id in pre) {
          pre[cur.id].count++;
        } else {
          pre[cur.id] = {
            count: 1,
            name: nameStr,
            price: cur.price,
          };
        }
        return pre;
      }, {});

      let tArr = [];
      for (let g in t) {
        tArr.push(t[g]);
      }

      tArr.forEach((tItem) => {
        optionArr.push(`${tItem.name}($${tItem.price})x${tItem.count}`);
      });
    }
    return optionArr.join(', ');
  };

  // 删除菜弹框-继续
  handleContinue = () => {
    const { t } = this.props;
    let cloneItemList = this.state.cloneItemList;
    let idx = cloneItemList.findIndex(
      (c) => c.sequence == this.state.deleteSequence
    );
    if (idx > -1) {
      cloneItemList.splice(idx, 1);
    }
    this.setState({
      cloneItemList,
    });
    // Toast.info(t('delete-tip'), 1000);
    this.handleCancel();
  };

  // 删除菜弹框-取消
  handleCancel = () => {
    this.setState({
      deleteLoading: false,
    });
  };

  // 加，减
  handleAddSubNum = (item, isSub = false) => {
    const { t } = this.props;
    let cloneItemList = this.state.cloneItemList;
    // 减
    if (isSub) {
      let newNum = item.quantity - 1;
      if (newNum < 1) {
        // 删除当前菜品弹框
        this.setState({
          deleteLoading: true,
          deleteSequence: item.sequence,
        });
      } else {
        // 减
        item.quantity -= 1;
        let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
        if (idx > -1) {
          let cloneItem = cloneDeep(cloneItemList[idx]);
          cloneItem.quantity = item.quantity;
          cloneItemList.splice(idx, 1, cloneItem);
        }
        this.setState({
          cloneItemList,
        });
      }
    } else {
      // 加
      let newNum = item.quantity + 1;
      const { menuItemList, currentOrderCombo, crm, currentOrder } = this.props;
      const totalQty = this.state.cloneItemList.reduce((sum, cloneItem) => {
        if (cloneItem.sequence === item.sequence) {
          return sum + newNum;
        }
        return sum + (cloneItem.quantity || 0);
      }, 0);
      if (
        !isTotalQtyWithinStock({
          itemInfo: item,
          totalQty,
          menuItemList,
          itemList: this.props.currentOrder.itemList,
          currentOrderCombo: this.props.currentOrderCombo,
          crm: this.props.crm,
        })
      ) {
        showInsufficientStockToast();
        return;
      }
      const draftItemList = (currentOrder?.itemList || []).map((orderItem) => {
        const editedItem = this.state.cloneItemList.find(
          (cloneItem) => cloneItem.sequence === orderItem.sequence
        );
        if (!editedItem) {
          return orderItem;
        }
        if (orderItem.sequence === item.sequence) {
          return {
            ...cloneDeep(editedItem),
            quantity: newNum,
          };
        }
        return cloneDeep(editedItem);
      });
      const optionAddMap = {};
      const optionSection = item.sectionDetail?.find((section) => section.id === -2);
      for (const option of optionSection?.options || []) {
        const optionStockItemId = getStockItemId(option);
        const optionStockCloudId = option.cloudId;
        if (optionStockItemId == null && optionStockCloudId == null) {
          continue;
        }
        const optionKey = optionStockCloudId
          ? `${optionStockCloudId}`
          : `${optionStockItemId}`;
        if (!optionAddMap[optionKey]) {
          optionAddMap[optionKey] = option;
        }
      }
      for (const optionItem of Object.values(optionAddMap)) {
        const optionStockNum = getItemStockNum(optionItem, menuItemList);
        if (optionStockNum === undefined) {
          continue;
        }
        const optionStockItemId = getStockItemId(optionItem);
        const optionStockCloudId = optionItem.cloudId;
        const optionOccupiedQty = getOccupiedQtyByStockId({
          itemList: draftItemList,
          currentOrderCombo,
          crm,
          stockItemId: optionStockItemId,
          stockCloudId: optionStockCloudId,
        });
        if (optionOccupiedQty > optionStockNum) {
          showInsufficientStockToast();
          return;
        }
      }
      if (newNum <= this.state.maxNum) {
        item.quantity += 1;
        let idx = cloneItemList.findIndex((c) => c.sequence == item.sequence);
        if (idx > -1) {
          let cloneItem = cloneDeep(cloneItemList[idx]);
          cloneItem.quantity = item.quantity;
          cloneItemList.splice(idx, 1, cloneItem);
        }
        this.setState({
          cloneItemList,
        });
        if (newNum == this.state.maxNum) {
          Toast.info(t('max-up', { rplc: defaultMax }), 1000);
        }
      }
    }
  };

  // 最终确定，并替换修改redux里面的菜
  handleConfirm = () => {
    let cloneItemList = this.state.cloneItemList;
    let id = cloneItemList[0].id;
    this.props.spliceOrderItemAction({ id, cloneItemList });
    this.props.handleCloseDeleteModal();
  };

  // dom元素滚动事件
  handleScroll = () => {
    if (!this.state.isScroll) {
      this.setState(
        {
          isScroll: true,
        },
        () => {
          off(this.scrollDom, 'scroll', this.handleScroll);
        }
      );
    }
  };

  componentDidMount() {
    // 深克隆，+-操作不影响redux中的数据
    const cloneArr = cloneDeep(this.props.currentOrder.itemList);
    // id过滤出不同属性，对应的菜品
    const cloneItemList = cloneArr.filter(
      (o) => o.id == this.props.itemInfo.id
    );
    this.setState({
      cloneItemList,
    });

    if (this.scrollDom) {
      on(this.scrollDom, 'scroll', this.handleScroll);
    }
  }

  componentDidUpdate() {
    // 当菜品全都清空，则关闭弹框
    if (!this.state.cloneItemList.length) {
      // 真正清空菜
      this.props.deleteAllById({
        foodId: this.props.itemInfo.id,
      });

      this.props.handleCloseDeleteModal();
      return;
    }

    // 当前没有滚动过，判断是否提示more
    if (!this.state.isScroll) {
      let bool = !!(this.scrollDom.scrollHeight > this.scrollDom.offsetHeight);
      if (bool != this.state.isShowMore) {
        this.setState({
          isShowMore: bool,
        });
      }
    }
  }

  componentWillUnmount() {
    off(this.scrollDom, 'scroll', this.handleScroll);
  }

  render() {
    // 底部总价格显示
    let bottomTotalPrice = 0;
    // item显示个数
    let itemNum = 0;
    const { cloneItemList, maxNum, deleteLoading, isScroll, isShowMore } =
      this.state;
    const {
      t,
      i18n: { language },
      itemInfo,
      handleCloseDeleteModal,
    } = this.props;

    let deleteList = [];
    let title =
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
      itemInfo.name;
    // 克隆一份，防止添加购物车，影响类（-3）
    const showFoodList = cloneDeep(cloneItemList);

    if (showFoodList.length) {
      // 单项菜品，或者是固定套餐
      if (
        itemInfo.itemType == 'SALE_ITEM' ||
        itemInfo?.comboType == 'FIXED_SELECTION'
      ) {
        deleteList = showFoodList.map((item, idx) => {
          const isHasDiscount = Number(item.discount || 0) > 0;
          itemNum += item.quantity;
          // 单个item的价格
          let itemTotalPrice = Big(getItemPrice(item))
            .minus(item.discount || 0)
            .toFixed(2);
          // 底部显示总价格
          bottomTotalPrice = Big(bottomTotalPrice)
            .plus(Big(itemTotalPrice).times(item.quantity))
            .toFixed(2);

          const isAddDisabled = item.quantity >= maxNum || isHasDiscount;

          return (
            <div className={styles.itemBox} key={item.id + '_' + idx}>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemLeft}>
                <div
                  className={styles.opt}
                  dangerouslySetInnerHTML={{
                    __html: this.orderDetailWriter(item),
                  }}
                ></div>
                <div className={styles.price}>${itemTotalPrice}</div>
                {item?.remark?.optionName && (
                  <div className={styles.note}>{item.remark.optionName}</div>
                )}
              </div>
              <div className={styles.calcBox}>
                <Fab
                  aria-label="Remove"
                  className={styles.btnEn}
                  onClick={() => {
                    this.handleAddSubNum(item, true);
                  }}
                >
                  <RemoveIcon className={styles.muiDiyIcon} />
                </Fab>
                <div className={styles.qty}>{item.quantity}</div>
                <Fab
                  disabled={isAddDisabled}
                  aria-label="Add"
                  className={
                    isAddDisabled
                      ? styles.btnDis
                      : `${styles.btnEn} animate-btn`
                  }
                  onClick={() => {
                    this.handleAddSubNum(item);
                  }}
                >
                  <AddIcon className={styles.muiDiyIcon} />
                </Fab>
              </div>
            </div>
          );
        });
      } else {
        showFoodList.forEach((clone) => {
          const OptList = clone.sectionDetail.find((c) => c.id == -2);
          const cateOptList = clone.sectionDetail.find((c) => c.id == -3);
          if (cateOptList) {
            if (OptList) {
              let idx = clone.sectionDetail.findIndex((c) => c.id == -3);
              OptList.options.push(...cateOptList.options);
              clone.sectionDetail.splice(idx, 1);
            } else {
              cateOptList.id = -2;
            }
          }
        });

        // 自选套餐
        deleteList = showFoodList.map((item, index) => {
          let comboList = [];
          itemNum += item.quantity;
          // 单个item的价格
          let itemTotalPrice = Big(getItemPrice(item)).toFixed(2);
          // 底部显示总价格
          bottomTotalPrice = Big(bottomTotalPrice)
            .plus(Big(itemTotalPrice).times(item.quantity))
            .toFixed(2);

          if (item.sectionDetail && item.sectionDetail.length) {
            comboList = item.sectionDetail.map((sct, idx) => {
              // 当自选套餐有size
              if (sct.id == -1) {
                return (
                  <div className={styles.sizePrice} key={sct.id + '_' + idx}>
                    {
                      getItemSizeName(
                        sct.sizeInfo.sizeId,
                        sct.sizeInfo.size,
                        this.props.itemSizeList,
                        this.props.i18n.language
                      )
                    }
                    ($
                    {sct.sizeInfo.price})
                  </div>
                );
              } else if (sct.id == -2 && sct.options?.length) {
                // 当自选套餐有options，或类的options
                return (
                  <div className={styles.sidenavBox} key={sct.id + '_' + idx}>
                    <div className={styles.sidenavTitle}>
                      {t('item_option')}:
                    </div>
                    <div className={styles.comboItemBox}>
                      {this.showCategoryOptions(sct.options)}
                    </div>
                  </div>
                );
              } else if (sct.id > 0) {
                // 当自选套餐有单个菜品
                let sideNavName = '';
                const sideNav = item.comboSections.find(
                  (com) => com.id == sct.id
                );
                if (sideNav) {
                  sideNavName =
                    (sideNav?.fieldDisplayNameGroups?.length &&
                      getCurrentItemLanguage(
                        sideNav.fieldDisplayNameGroups,
                        language
                      )) ||
                    sideNav.name;
                }

                return (
                  <div className={styles.sidenavBox} key={sct.id + '_' + idx}>
                    <div className={styles.sidenavTitle}>{sideNavName}:</div>
                    {sct.items.map((combo, sId) => {
                      const comboName =
                        (combo?.fieldDisplayNameGroups?.length &&
                          getDishItemLanguage(
                            combo.fieldDisplayNameGroups,
                            language
                          )) ||
                        combo.name;

                      return (
                        <div
                          className={styles.comboBox}
                          key={combo.id + '_' + sId}
                        >
                          <div className={styles.itemLeft}>
                            <div
                              className={styles.comboItemBox}
                              key={combo.id + '_' + sId}
                            >
                              {comboName}
                              {combo.selectedOptionList?.length
                                ? ': ' +
                                  this.showCollectOptions(
                                    combo.selectedOptionList
                                  )
                                : null}
                              {combo.remark && combo.remark.optionName && (
                                <div className={styles.note}>
                                  {combo.remark.optionName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            });
          }

          return (
            <div className={styles.comboDeleteList} key={item.id + '_' + index}>
              <div className={styles.itemName}>{item.name}</div>
              {comboList}
              <div className={styles.price}>${itemTotalPrice}</div>
              {item?.remark?.optionName && (
                <div className={styles.note}>{item.remark.optionName}</div>
              )}
              <div className={styles.calcBox}>
                <Fab
                  aria-label="Remove"
                  className={styles.btnEn}
                  onClick={() => {
                    this.handleAddSubNum(item, true);
                  }}
                >
                  <RemoveIcon className={styles.muiDiyIcon} />
                </Fab>
                <div className={styles.qty}>{item.quantity}</div>
                <Fab
                  disabled={item.quantity >= maxNum}
                  aria-label="Add"
                  className={
                    item.quantity < maxNum
                      ? `${styles.btnEn} animate-btn`
                      : styles.btnDis
                  }
                  onClick={() => {
                    this.handleAddSubNum(item);
                  }}
                >
                  <AddIcon className={styles.muiDiyIcon} />
                </Fab>
              </div>
            </div>
          );
        });
      }
    }

    return (
      <div className={styles.deleteContainer} onClick={handleCloseDeleteModal}>
        <div className={styles.deleteBox} onClick={(e) => e.stopPropagation()}>
          <div
            className={styles.deleteList}
            ref={(el) => (this.scrollDom = el)}
          >
            {deleteList}
            {/* {!isScroll && isShowMore && <MoreTip />} */}
          </div>
          <div className={styles.deleteBottom}>
            <div className={styles.cartIcon}>
              <img src={cartBagIMG} className={`${styles.cart}`} />
              <i className={styles.count}>{itemNum}</i>
            </div>
            <div
              className={`${styles.addCart} linear-animate-btn`}
              onClick={this.handleConfirm}
            >
              <span>{t('confirm')}</span>
              <div className={styles.price}>${bottomTotalPrice}</div>
            </div>
          </div>
        </div>
        {/* 提示-1是否删除菜品弹框 */}
        <DeleteDishModal
          isShowModal={deleteLoading}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    itemSizeList: state.itemSizeList,
    menuItemList: state.menuItemList,
    crm: state.crm,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default connect(mapStateToProps, {
  deleteAllById,
  spliceOrderItemAction,
})(withTranslation()(ChooseDeleteOrder));
