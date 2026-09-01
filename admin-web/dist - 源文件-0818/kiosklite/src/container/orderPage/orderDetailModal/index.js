import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './orderDetailModal.module.scss';
import Dialog from '@/component/dialog';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import VtKeyboard from '@/component/VtKeyboard';
import Toast from '@/component/toast';
import Icon from '@/component/icon';
import SizeOptionSelect from '../sizeOptionSelect';
import ItemOptionSelectWithSub from '../ItemOptionSelectWithSub';
import FixComboOption from '../fixComboOption';
import MoreTip from '@/component/moreTip';
import ImgCard from '@/component/imgCard';
import arrowLeft from '@/assets/images/arrow-left.png';
import { replaceItemOrder, getCurrentItem, addCombo2Order } from '@/actions';
import { on, off, isOpenVtkeyboadrd, compare, solveScrollElem } from '@/utils';
import { removeEmoji } from '@/utils/sanitizeInput';
import {
  getDishItemLanguage,
  getComboItemDetailInfo,
} from '@/utils/busTools';
import DescModal from '@/component/DescModal';
import cloneDeep from 'lodash/cloneDeep';
// import NoActivityTag from '../noActivityTag';
import POINT from '@/assets/images/star.png';
import { setTempCampaign } from '@/actions/crm_action';
import {
  getCartItemQtyByStockId,
  getStockItemId,
  isTotalQtyWithinStock,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';

import Big from 'big.js';
import { getPromotionModalDisplayPrice } from '@/utils/localExchangePurchase';
const defaultMax = 99;

class OrderDetailModal extends React.Component {
  constructor() {
    super();
    this.state = {
      maxNum: defaultMax,
      defaultItemSizeId: -1,
      toggleSizePanel: false,
      toggleItemDetailPanel: false,
      keyboardValue: '',
      sizeInfo: {},
      options: [],
      totalPrice: '0.00',
      keyboardToggle: false,
      chooseNum: 1,
      isScroll: false,
      isShowMore: false,
      descVisible: false,
      showRequired: false,
    };
    this.itemOptionChild = {};
    this.flag = false;
  }

  // 清空文本域
  handleResetEmpty = () => {
    this.setState({
      keyboardValue: '',
    });
  };

  changeSize = (sizeInfo) => {
    this.setState(
      {
        sizeInfo,
      },
      () => this.calPrice()
    );
  };

  viewOrderPanel = () => {
    const {
      currentCategory,
      currentCategoryList,
      itemInfo,
      max,
      isInFreeItem = false,
      isPromotionItem,
      isSpecialItem = false,
    } = this.props;
    // 兑换商品数量限制

    if ((isInFreeItem || isPromotionItem || isSpecialItem) && max) {
      this.setState({
        maxNum: max,
      });
    }

    const { defaultItemSizeId: preSelectItemSize } = itemInfo;
    let options = [];
    if (itemInfo?.options?.length) {
      options = options.concat(itemInfo.options);
    }
    const itemCategoryId = itemInfo.isFreeItem
      ? itemInfo.oCategoryId
      : itemInfo.categoryId;
    if (currentCategoryList?.length && itemCategoryId) {
      let result = currentCategoryList.find(
        (cate) => cate.id == itemCategoryId
      );
      // 找类option
      if (result?.options?.length) {
        options = options.concat(result.options);
      }
    }

    let defaultItemSizeId;
    // 如果有size选项，默认不选
    if (itemInfo?.itemPrices?.length) {
      const isExist = itemInfo.itemPrices.find(
        (each) => each.sizeId === preSelectItemSize
      );
      let minObj = itemInfo.itemPrices[0];
      itemInfo.itemPrices.forEach((p) => {
        if (p.price < minObj.price) {
          minObj = p;
        }
      });
      defaultItemSizeId = isExist ? preSelectItemSize : null; // 默认最小时：minObj.sizeId
    }

    // 当点击购物车中的菜品，改变默认值defaultItemSizeId
    if (itemInfo?.sectionDetail?.length) {
      itemInfo.sectionDetail.forEach((p) => {
        if (p.id == -1) {
          defaultItemSizeId = p.sizeInfo.sizeId;
        }
      });
    }

    let chooseNum = 1;
    if (
      this.props.history.location.pathname.indexOf('/orderReview') > -1 &&
      !isInFreeItem &&
      !isPromotionItem &&
      !isSpecialItem
    ) {
      chooseNum = itemInfo?.quantity || 1;
    }

    this.setState(
      {
        defaultItemSizeId,
        options,
        chooseNum,
        keyboardValue: (itemInfo.remark && itemInfo.remark.optionName) || '',
        sizeInfo: {},
        totalPrice: '0.00',
      },
      () => {
        solveScrollElem(true);
        this.calPrice();
      }
    );
  };

  closePanel = () => {
    const { onCloseModal } = this.props;
    solveScrollElem(false);
    this.setState({
      isScroll: false,
      isShowMore: false,
      keyboardToggle: false,
      chooseNum: 1,
      keyboardValue: '',
      sizeInfo: {},
      totalPrice: '0.00',
    });
    onCloseModal?.();
  };

  // 固定套餐价格计算抽离
  calFixItemPrice = () => {
    let fixItemPrice = Big(0);
    const { itemInfo, currentCategoryList, currentOrder } = this.props;
    // 如果当前是固定套餐的选项（需加上ADJUSTABLE_PRICE的价格）
    if (
      itemInfo?.comboType === 'FIXED_SELECTION' &&
      itemInfo?.comboSections?.length
    ) {
      let orderType = currentOrder.orderType;

      itemInfo.comboSections.forEach((cs) => {
        if (cs.priceRule == 'ADJUSTABLE_PRICE') {
          if (cs.comboSectionSaleItems) {
            cs.comboSectionSaleItems.forEach((csItem) => {
              const sItem = cloneDeep(
                getComboItemDetailInfo(csItem.saleItemId, currentCategoryList)
              );
              if (sItem) {
                if (sItem.itemPrices) {
                  // 是否堂吃
                  if (orderType == 'DINE_IN') {
                    let dineInList = sItem.itemPrices.filter(
                      (f) => f.type == 'DINE_IN'
                    );
                    if (dineInList.length) {
                      sItem.itemPrices = cloneDeep(dineInList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  } else if (orderType == 'TO_GO') {
                    // 是否打包
                    let togoList = sItem.itemPrices.filter(
                      (f) => f.type == 'TOGO'
                    );
                    if (togoList.length) {
                      sItem.itemPrices = cloneDeep(togoList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  } else if (orderType == 'PICK_UP') {
                    // 预约点单
                    let pickUpList = sItem.itemPrices.filter(
                      (f) => f.type == 'PICKUP'
                    );
                    if (pickUpList.length) {
                      sItem.itemPrices = cloneDeep(pickUpList);
                    } else {
                      let AllList = sItem.itemPrices.filter(
                        (f) => f.type == 'ALL'
                      );
                      if (AllList.length) {
                        sItem.itemPrices = cloneDeep(AllList);
                      } else {
                        delete sItem.itemPrices;
                        sItem.price = sItem.price ? sItem.price : 0;
                      }
                    }
                  }
                }
                // 有size 的 itemPrice选项
                if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
                  // 取默认最小
                  let minObj = sItem.itemPrices[0];
                  sItem.itemPrices.forEach((p) => {
                    if (p.price < minObj.price) {
                      minObj = p;
                    }
                  });
                  fixItemPrice = fixItemPrice.plus(minObj.price);
                } else {
                  fixItemPrice = fixItemPrice.plus(sItem.price);
                }
              }
            });
          }
        }
      });
    }

    return fixItemPrice;
  };

  calPrice = () => {
    const { state } = this.itemOptionChild;
    const { itemInfo } = this.props;
    const { chooseNum, sizeInfo } = this.state;
    const itemPrice = itemInfo?.itemPrices;
    let isItemPrice = itemPrice != undefined && itemPrice.length > 0;
    let totalPrice = '0.00';
    let optionTotalPrice = Big(0);
    if (state?.selectedItemList?.length) {
      state?.selectedItemList.map((item) => {
        optionTotalPrice = optionTotalPrice.plus(
          item.isFreeItem ? 0 : item.price
        );
      });
    }

    // 如果当前是固定套餐的选项（需加上ADJUSTABLE_PRICE的价格）
    optionTotalPrice = optionTotalPrice.plus(this.calFixItemPrice());

    if (!isItemPrice) {
      totalPrice = optionTotalPrice
        .plus(itemInfo?.price)
        .times(chooseNum)
        .toFixed(2);
    } else if (sizeInfo?.price) {
      totalPrice = optionTotalPrice
        .plus(sizeInfo?.price)
        .times(chooseNum)
        .toFixed(2);
    }

    if (totalPrice == 'NaN') {
      this.setState({
        totalPrice: '0.00',
      });
    } else {
      this.setState({
        totalPrice,
      });
    }
  };

  addOrder = () => {
    const {
      t,
      currentOrder,
      itemInfo,
      currentCategoryList,
      isInFreeItem = false,
      isPromotionItem,
      onAddFreeItem,
      promotionFn,
      isSpecialItem = false,
    } = this.props;

    const stoppedStatus = getItemStoppedStatus(itemInfo);
    if (stoppedStatus) {
      Toast.info(
        t(
          stoppedStatus === 'unavailable'
            ? 'dish-item-unavailable'
            : 'dish-sold-out',
          {
            item: itemInfo.name,
          }
        )
      );
      return;
    }

    const { state, showRuleToast } = this.itemOptionChild;
    const { chooseNum, keyboardValue, sizeInfo } = this.state;
    itemInfo.remark.optionName = keyboardValue;
    const itemPrice = itemInfo?.itemPrices;
    let isItemPrice = itemPrice && itemPrice.length > 0;
    itemInfo.quantity = chooseNum;
    const tempItem = Object.assign({}, itemInfo);
    tempItem.sectionDetail = [];

    // 没有选择规格
    if (isItemPrice && !Object.keys(sizeInfo).length) {
      Toast.info(t('choose-size'), 1000);
      this.setState({
        showRequired: true,
      });
      return;
    }

    const options = itemInfo.options || [];
    for (let option of options) {
      if (option.min > 0) {
        const count =
          state?.selectedItemList?.reduce((acc, item) => {
            if (item.itemOptionId === option.id) {
              acc = acc + item.quantity;
            }
            return acc;
          }, 0) || 0;
        if (count < option.min) {
          showRuleToast?.(option);
          return;
        }
      }
    }

    showRuleToast?.(null);

    let opts_2 = {
      id: -2,
      options: [],
    };
    let opts_3 = {
      id: -3,
      options: [],
    };
    // 给tempItem添加options
    if (state?.selectedItemList?.length) {
      state?.selectedItemList.map((item) => {
        if (item?.menuCategoryId) {
          opts_3.options.push({ ...item, quantity: 1 });
        } else {
          opts_2.options.push({ ...item, quantity: 1 });
        }
      });

      // options（id:-2, -3），进行排序（id: 小 -> 大）
      if (opts_2.options.length) {
        opts_2.originalOptions = cloneDeep(opts_2.options);
        opts_2.options.sort(compare('id'));
        tempItem.sectionDetail.push(opts_2);
      }
      if (opts_3.options.length) {
        opts_3.options.sort(compare('id'));
        tempItem.sectionDetail.push(opts_3);
      }
    }

    // 判断是否是固定套餐
    if (
      tempItem?.comboType === 'FIXED_SELECTION' &&
      tempItem.comboSections &&
      tempItem.comboSections.length
    ) {
      let orderType = currentOrder.orderType;
      tempItem.comboSections.forEach((cs) => {
        let fixObj = {
          id: cs.id,
          items: [],
        };
        if (cs.comboSectionSaleItems) {
          cs.comboSectionSaleItems.forEach((csItem) => {
            let sItem = cloneDeep(
              getComboItemDetailInfo(csItem.saleItemId, currentCategoryList)
            );
            if (sItem) {
              sItem.remark = {
                optionName: '',
                optionType: 'NOTE',
                quantity: 1,
                price: 0,
              };
              sItem.quantity = 1;
              sItem.selectedOptionList = [];

              if (sItem.itemPrices) {
                // 是否堂吃
                if (orderType == 'DINE_IN') {
                  let dineInList = sItem.itemPrices.filter(
                    (f) => f.type == 'DINE_IN'
                  );
                  if (dineInList.length) {
                    sItem.itemPrices = cloneDeep(dineInList);
                  } else {
                    let AllList = sItem.itemPrices.filter(
                      (f) => f.type == 'ALL'
                    );
                    if (AllList.length) {
                      sItem.itemPrices = cloneDeep(AllList);
                    } else {
                      delete sItem.itemPrices;
                      sItem.price = sItem.price ? sItem.price : 0;
                    }
                  }
                } else if (orderType == 'TO_GO') {
                  // 是否打包
                  let togoList = sItem.itemPrices.filter(
                    (f) => f.type == 'TOGO'
                  );
                  if (togoList.length) {
                    sItem.itemPrices = cloneDeep(togoList);
                  } else {
                    let AllList = sItem.itemPrices.filter(
                      (f) => f.type == 'ALL'
                    );
                    if (AllList.length) {
                      sItem.itemPrices = cloneDeep(AllList);
                    } else {
                      delete sItem.itemPrices;
                      sItem.price = sItem.price ? sItem.price : 0;
                    }
                  }
                } else if (orderType == 'PICK_UP') {
                  // 预约点单
                  let pickUpList = sItem.itemPrices.filter(
                    (f) => f.type == 'PICKUP'
                  );
                  if (pickUpList.length) {
                    sItem.itemPrices = cloneDeep(pickUpList);
                  } else {
                    let AllList = sItem.itemPrices.filter(
                      (f) => f.type == 'ALL'
                    );
                    if (AllList.length) {
                      sItem.itemPrices = cloneDeep(AllList);
                    } else {
                      delete sItem.itemPrices;
                      sItem.price = sItem.price ? sItem.price : 0;
                    }
                  }
                }
              }

              // 有size 的 itemPrice选项，取默认值
              if (sItem && sItem.itemPrices && sItem.itemPrices.length) {
                // 取默认最小
                let minObj = sItem.itemPrices[0];
                sItem.itemPrices.forEach((p) => {
                  if (p.price < minObj.price) {
                    minObj = p;
                  }
                });
                sItem.price = 0;
                if (cs.priceRule == 'FIXED_PRICE') {
                  minObj.price = 0;
                }
                sItem.selectedOptionList.push({
                  id: -1,
                  sizeInfo: minObj,
                });
                fixObj.items.push(sItem);
              } else {
                if (cs.priceRule == 'FIXED_PRICE') {
                  sItem.price = 0;
                }
                fixObj.items.push(sItem);
              }
            }
          });
        }
        tempItem.sectionDetail.push(fixObj);
      });
    }

    // 上面是数据组装逻辑
    // 这里开始是保存逻辑
    if (
      this.props.history.location.pathname.indexOf('/orderPage') > -1 ||
      (isInFreeItem && !itemInfo.isFreeItem) ||
      (isPromotionItem && promotionFn) ||
      isSpecialItem
    ) {
      // 有size选项，并且选中
      if (isItemPrice) {
        if (sizeInfo?.sizeId) {
          tempItem.sectionDetail.unshift({
            id: -1,
            sizeInfo: Object.assign({}, sizeInfo),
          });
          tempItem.price = 0;
          if ((isInFreeItem && !itemInfo.isFreeItem) || isSpecialItem) {
            onAddFreeItem(tempItem);
            this.closePanel();
            return;
          } else if (isPromotionItem && promotionFn) {
            promotionFn(tempItem);
            this.closePanel();
            return;
          }
          const addRes = this.props.addCombo2Order(tempItem);
          if (addRes === false) {
            this.closePanel();
            return;
          }
          if (itemInfo.isFreeItem) {
            this.props.setTempCampaign([tempItem]);
          }
          // Toast.info(t('add-success'), 1000);
        } else {
          return;
        }
      } else {
        if ((isInFreeItem && !itemInfo.isFreeItem) || isSpecialItem) {
          onAddFreeItem(tempItem);
          this.closePanel();
          return;
        } else if (isPromotionItem && promotionFn) {
          promotionFn(tempItem);
          this.closePanel();
          return;
        }
        const addRes = this.props.addCombo2Order(tempItem);
        if (addRes === false) {
          this.closePanel();
          return;
        }
        if (itemInfo.isFreeItem) {
          this.props.setTempCampaign([tempItem]);
        }
        // Toast.info(t('add-success'), 1000);
      }
    } else if (
      this.props.history.location.pathname.indexOf('/orderReview') > -1
    ) {
      // 有size选项，并且选中，则添加到tempItem
      if (sizeInfo?.sizeId) {
        tempItem.sectionDetail.unshift({
          id: -1,
          sizeInfo: Object.assign({}, sizeInfo),
        });
        tempItem.price = 0;
      }
      // 直接全部替换原菜品
      const replaceRes = this.props.replaceItemOrder(
        tempItem,
        tempItem.sequence
      );
      if (replaceRes === false) {
        this.closePanel();
        return;
      }

      Toast.info(t('edit-success'), 1000);
    }
    this.closePanel();
    return;
  };

  onChange = (input) => {
    this.setState({
      keyboardValue: input,
    });
    this.inputRef.scrollIntoViewIfNeeded(true);
  };

  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };
  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  keyboardChange = (eventOrValue) => {
    let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    value = removeEmoji(value);
    if (eventOrValue?.target) {
      eventOrValue.target.value = value;
    }
    if (value.length > 255) {
      value = value.substr(0, 255);
    }
    this.setState({
      keyboardValue: value,
    });
  };

  changeChooseNum = (isAdd) => {
    const { t, itemInfo, currentOrder, menuItemList, crm } = this.props;
    let { chooseNum, maxNum } = this.state;
    let n = isAdd ? chooseNum + 1 : chooseNum - 1;
    if (isAdd) {
      const cartQty = getCartItemQtyByStockId(
        currentOrder.itemList,
        getStockItemId(itemInfo),
        itemInfo.cloudId
      );
      if (
        !isTotalQtyWithinStock({
          itemInfo,
          totalQty: cartQty + n,
          menuItemList,
          itemList: currentOrder.itemList,
          currentOrderCombo: this.props.currentOrderCombo,
          crm,
        })
      ) {
        showInsufficientStockToast();
        return;
      }
    }
    // 最大提示
    if (n >= maxNum) {
      Toast.info(t('max-up', { rplc: maxNum || defaultMax }), 1000);
      n = maxNum;
    }
    this.setState(
      {
        chooseNum: n,
      },
      () => {
        this.calPrice();
      }
    );
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
    this.props.onRef(this);
    this.viewOrderPanel();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.orderPanelShow) {
      if (prevProps.orderPanelShow !== this.props.orderPanelShow) {
        // 清空上一次，添加的options
        this.itemOptionChild?.clearSelectedItemList &&
          this.itemOptionChild.clearSelectedItemList();
        if (this.scrollDom) {
          this.setState({
            isShowMore: !!(
              this.scrollDom.scrollHeight > this.scrollDom.offsetHeight
            ),
          });
          on(this.scrollDom, 'scroll', this.handleScroll);
        }
      }

      // 当备注长度达到上线，展示出完整提示
      let isExceedlimit = !!(String(this.state.keyboardValue).length >= 255);
      if (isExceedlimit && this.maxNoteRef) {
        this.maxNoteRef.scrollIntoViewIfNeeded(true);
      }

      if (this.state.keyboardToggle != prevState.keyboardToggle) {
        // 打开，键盘height：380px
        if (this.state.keyboardToggle) {
          this.scrollDom.parentNode.style.height = 'calc(90vh - 10rem)';
          this.scrollDom.style.minHeight = 'auto';
          this.scrollDom.style.height = 'calc(90vh - 40rem - 380px)';
          // 将textarea滚动到可视区域
          this.inputRef.scrollIntoViewIfNeeded(true);
        } else {
          // 关闭
          this.scrollDom.parentNode.style.height = 'auto';
          this.scrollDom.style.minHeight = 'calc(70vh - 40rem)';
          this.scrollDom.style.height = 'auto';
        }
      }
    }
  }

  componentWillUnmount() {
    off(this.scrollDom, 'scroll', this.handleScroll);
  }

  render() {
    const {
      t,
      i18n: { language },
      itemInfo,
      selfConfig,
      orderPanelShow,
      isInFreeItem = false,
      isSpecialItem = false,
      isPromotionItem,
      isExchangePurchase = false,
      isMountOnBody,
    } = this.props;
    const {
      keyboardToggle,
      keyboardValue,
      sizeInfo,
      totalPrice,
      chooseNum,
      options,
      defaultItemSizeId,
      maxNum,
      descVisible,
      showRequired,
    } = this.state;

    const isItemPrice = itemInfo?.itemPrices?.length > 0;
    const isItemOption = options.length > 0;
    const isFixCombo = itemInfo?.comboType === 'FIXED_SELECTION';
    const itemName = itemInfo?.id
      ? getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
        itemInfo.name
      : '';

    // textarea是否提示长度超过255
    let isExceedlimit = !!(String(keyboardValue).length >= 255);

    // 文案显示
    let showText = 'addToOrder';
    if (this.props.history.location.pathname.indexOf('/orderReview') > -1) {
      showText = 'confirm';
    }

    // 是否显示备注（id:3）
    const isShowRemark = selfConfig?.configMap?.id_3;
    const stoppedStatus = getItemStoppedStatus(itemInfo);

    let isDisabled = true;
    // 没有选择规格
    if (
      !stoppedStatus &&
      ((isItemPrice && Object.keys(sizeInfo).length) || !isItemPrice)
    ) {
      isDisabled = false;
    }

    return (
      <>
        <Dialog
          isMountOnBody={isMountOnBody}
          visible={orderPanelShow}
          html={
            <div
              className={styles.drawBody}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.header}>
                <img
                  src={arrowLeft}
                  className={styles.backPrePage}
                  onClick={this.closePanel}
                />
                <div className={styles.text}>{itemName}</div>
              </div>

              <div
                className={styles.contentTopBox}
                ref={(el) => (this.scrollDom = el)}
              >
                {/* 左 */}
                <div className={styles.leftBox}>
                  {/* 图片 */}
                  {/* {itemInfo.thumbPath ? ( */}
                  <div className={styles.areaImg}>
                    <ImgCard selfConfig={selfConfig} itemInfo={itemInfo} />
                  </div>
                  {/* ) : null} */}
                </div>
                {/* 右 */}
                <div className={styles.rightBox}>
                  {/* 描述 */}
                  {(itemInfo.description || itemInfo.otherDescription) && (
                    <div className={styles.areaDetail}>
                      <div style={{ marginTop: 0 }} className={styles.title}>
                        {t('description')}
                      </div>
                      <div className={styles.word}>
                        {itemInfo.otherDescription && (
                          <div
                            style={{
                              fontWeight: 'bolder',
                              marginBottom: '2.5rem',
                              fontSize: '3.5rem',
                            }}
                          >
                            {itemInfo.otherDescription || ''}
                          </div>
                        )}
                        <div>{itemInfo.description || ''}</div>
                      </div>
                    </div>
                  )}
                  {isFixCombo && (
                    <div className={styles.areaFixCombo}>
                      <div className={styles.title}>{t('items')}</div>
                      <div className={styles.word}>
                        <FixComboOption
                          sectionItemList={itemInfo.comboSections}
                        />
                      </div>
                    </div>
                  )}
                  <div
                    className={styles.area}
                    style={{ display: isItemPrice ? 'block' : 'none' }}
                  >
                    <div className={styles.title}>
                      <span>{t('section')}</span>
                      {showRequired && (
                        <span className={styles.required}>{t('required')}</span>
                      )}
                    </div>
                    <div className={styles.word}>
                      {/* 显示size item prices */}
                      <SizeOptionSelect
                        sectionItemList={itemInfo.itemPrices || []}
                        defaultItemSizeId={defaultItemSizeId}
                        selectedItem={sizeInfo}
                        changeSize={this.changeSize}
                        fixItemPrice={this.calFixItemPrice().toFixed(2) || 0}
                        itemInfo={itemInfo}
                        isInFreeItem={isInFreeItem}
                        isSpecialItem={isSpecialItem}
                        isPromotionItem={isPromotionItem && !isExchangePurchase}
                      />
                    </div>
                  </div>
                  <div
                    className={styles.area}
                    style={{ display: isItemOption ? 'block' : 'none' }}
                  >
                    <ItemOptionSelectWithSub
                      onRef={(ref) => (this.itemOptionChild = ref)}
                      calPrice={this.calPrice}
                      sectionItemList={options}
                      itemInfo={itemInfo}
                      parentQty={chooseNum}
                      isSpecialItem={isSpecialItem}
                      isInFreeItem={isInFreeItem}
                      isPromotionItem={isPromotionItem && !isExchangePurchase}
                    />

                    {/* <NoActivityTag itemId={itemInfo.id} /> */}
                  </div>

                  <div
                    className={styles.area}
                    style={{
                      display: isShowRemark ? 'block' : 'none',
                    }} /*  && !isInFreeItem */
                  >
                    <div className={styles.title}>
                      {t('dishExtraDescription')}
                    </div>
                    <textarea
                      ref={(el) => (this.inputRef = el)}
                      maxLength={255}
                      placeholder={`${t('noteDishPlaceholder')},${t('note_tip')}`}
                      value={keyboardValue}
                      className={styles.textContent}
                      onFocus={() => {
                        window.scroll(0, 0);
                      }}
                      onBlur={() => {
                        window.scroll(0, 0);
                      }}
                      onClick={() => {
                        this.setState({
                          descVisible: true,
                        });
                      }}
                      onCompositionStart={() => {
                        this.flag = true;
                      }}
                      onCompositionEnd={() => {
                        this.flag = false;
                        this.inputRef.value = this.inputRef.value;
                      }}
                      onChange={this.keyboardChange}
                    />
                    {!!keyboardValue ? (
                      <Icon
                        className={styles.iconEmpty}
                        type="round_close_light"
                        size={5}
                        onClick={this.handleResetEmpty}
                      />
                    ) : null}
                    <span
                      ref={(el) => (this.maxNoteRef = el)}
                      className={styles.maxNote}
                      style={{ display: isExceedlimit ? 'block' : 'none' }}
                    >
                      {t('maxNoteTip')}
                    </span>
                  </div>
                </div>

                {/* {!this.state.isScroll && this.state.isShowMore && <MoreTip />} */}
              </div>
              <div className={styles.foot}>
                <div className={styles.countBtn}>
                  <Fab
                    disabled={chooseNum === 1}
                    aria-label="Remove"
                    className={
                      chooseNum > 1
                        ? `${styles.btnEn} animate-btn`
                        : styles.btnDis
                    }
                    onClick={() => this.changeChooseNum(false)}
                  >
                    <RemoveIcon className={styles.muiDiyIcon} />
                  </Fab>
                  <div className={styles.count}>{chooseNum}</div>
                  <Fab
                    disabled={chooseNum >= maxNum}
                    aria-label="Add"
                    className={
                      chooseNum !== maxNum
                        ? `${styles.btnEn} animate-btn`
                        : styles.btnDis
                    }
                    onClick={() => this.changeChooseNum(true)}
                  >
                    <AddIcon className={styles.muiDiyIcon} />
                  </Fab>
                </div>
                <div
                  className={`${styles.addCart} ${isDisabled ? styles.addCartDisabled : 'linear-animate-btn'} `}
                  onClick={this.addOrder}
                >
                  <span>{t([showText])}</span>
                  <div className={styles.price}>
                    {isInFreeItem ? (
                      itemInfo.itemPoints ? (
                        <>
                          <img
                            className={styles.pointImg}
                            src={POINT}
                            alt="point"
                          />
                          <span>
                            {itemInfo.itemPoints} {t('pts')}
                          </span>
                        </>
                      ) : (
                        <>${itemInfo.price?.toFixed(2)}</>
                      )
                    ) : (
                      <span>
                        $
                        {getPromotionModalDisplayPrice({
                          isPromotionItem,
                          isExchangePurchase,
                          totalPrice,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {keyboardToggle ? (
                <VtKeyboard
                  keyboardValue={keyboardValue}
                  changeInput={this.onChange}
                  closeKeyboard={() => {
                    this.hideKeyboard();
                  }}
                />
              ) : null}
            </div>
          }
          onClose={this.closePanel}
        />

        <DescModal
          isMountOnBody={isMountOnBody}
          preVal={keyboardValue}
          visible={descVisible}
          title={t('dishExtraDescription')}
          onClose={() =>
            this.setState({
              descVisible: false,
            })
          }
          onSetVal={(v) => this.keyboardChange(v)}
        />
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    currentCategoryList: state.currentCategoryList,
    promotion: state.promotion,
    itemSizeList: state.itemSizeList,
    menuItemList: state.menuItemList,
    currentOrderCombo: state.currentOrderCombo,
    crm: state.crm,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    replaceItemOrder,
    getCurrentItem,
    addCombo2Order,
    setTempCampaign,
  })(withTranslation()(OrderDetailModal))
);
