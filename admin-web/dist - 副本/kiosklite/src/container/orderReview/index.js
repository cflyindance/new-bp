import React from 'react';
import styles from './orderReview.module.scss';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import DeleteIcon from '@material-ui/icons/Delete';
import Alert from '@material-ui/lab/Alert';
import { RightOutlined } from '@ant-design/icons';
import CardMinAmount from '@/component/cardMinAmount';
import RequireCategoryTip from '@/component/requireCategoryTip';
import BottomToast from '@/component/bottomToast';
import Icon from '@/component/icon';
import ImgCard from '@/component/imgCard';
import Toast from '@/component/toast';
import Loading from '@/component/loading';
import SoldoutModal from '@/component/soldoutModal';
import CardPayTipModal from '@/component/cardPayTipModal';
import { isTipEnabledForPaymentType } from '@/utils/tipPaymentTypes';
import OrderDetailModal from '../orderPage/orderDetailModal';
import DeleteDishModal from '@/component/deleteDishModal';
import VtKeyboard from '@/component/VtKeyboard';
import ComboItemsDetailModal from '../comboPanel/comboFooter/comboItemsDetailModal';
import { removeEmoji } from '@/utils/sanitizeInput';
import _ from 'lodash';
import {
  editOrderItemAction,
  getCurrentCategory,
  getCurrentItem,
  notes,
  payByCard,
  payByCash,
  initEditOrderMode,
  resetCurrentOrderCombo,
  setEditOrderMode,
  setTogoOption,
  setLocator,
  setSelfConfig,
  setSideNavIndex,
  setSideNavList,
  setTabelServiceType,
  spliceOrderBySoldout,
  saveOrderResult,
  addCampaignItemsToOrder,
} from '@/actions';
import {
  setPromotionCode,
  setItemValidPromotion,
  changePromotionStatusAfterCheck,
} from '@/actions/promotion';
import { checkIsRuleValid } from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import {
  handleCheckOrderPromotion,
  isSameItems,
  getPromotionCenterActivityRuleText,
  getPromotionCenterTextFromTextObject,
} from '@/utils/PromotionCenterIntegration';
import { getItemPrice } from '@/utils/priceCalculator';
import {
  getItemStockNum,
  getOccupiedQtyByStockId,
  getStockItemId,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';
import itemIsSoldOut from '@/utils/itemIsSoldOut';
import { fetchCompanyProfile } from '@/api';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import { solveScrollElem } from '@/utils';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
  getCurrentItemLanguage,
  getDishItemLanguage,
  // judegEnv,
  judgeCharge,
  judgeNeedPayOtherCharge,
  judgeHasDetailInfo,
  getItemSizeName,
  judegOrderDishIsHasSoldout,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import Dialog from '@/component/dialog';
import ComboPanel from '../comboPanel';
import DescModal from '@/component/DescModal';
import Modal from '@/component/Modal';
import CallerBoard from '@/component/CallerBoard';
import Big from 'big.js';
import classNames from 'classnames';
import PromotionItems, {
  getVariantDescription,
} from './components/PromotionItems';
import giftDeleteStyles from '@/component/RewardCenter/ItemDeleteDrawer.module.scss';
import PromoCodeInput from './components/PromoCodeInput';
import { setBuyGifts, setSatisfyRules } from '@/actions/promotion';
import handleCalculatePromotion from '@/utils/handleCalculateCloudPromotion.js';
import cartBagIMG from '@/assets/images/cart-bag.png';
import POINT from '@/assets/images/star.png';
import RIGHT_SIGN from '@/assets/images/right_sign.png';
import CHANGE from '@/assets/images/change.png';
import { setTempCampaign, changeFreeItem } from '@/actions/crm_action';
import judgeOnlyHaveFreeItem from '@/utils/judgeOnlyHaveFreeItem';
import ItemPromotionModal from '@/component/CloudPromotionCenter/ItemPromotionModal';
import AddOnPromotion from '@/component/AddOnPromotion';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import { GIFT_PROMOTION_TYPE } from '@/constants/promotion';
import handlePaymentTypeRoute from '@/utils/handlePaymentTypeRoute';
import { navigatePartySizeIfNeeded } from '@/utils/navigatePartySizeIfNeeded';
import { runJudgeSMSAfterOperation } from '@/utils/runJudgeSMSAfterOperation';
import { getValidCategoryList } from '@/utils/getStandardCateDish';
import {
  applyExchangePurchaseDiscount,
  getExchangePurchaseDiscountedUnitPrice,
  getSatisfiedExchangePurchaseRules,
} from '@/utils/localExchangePurchase';

const defaultMax = 99;

class OrderReview extends React.Component {
  constructor(props) {
    super(props);
    this.addOnPromotionRef = React.createRef();
    this.state = {
      isScroll: false,
      maxNum: defaultMax,
      keyboardValue: props.currentOrder.notes || '',
      keyboardToggle: false,
      selectedItem: {},
      lastReuqireItem: {},
      deleteLoading: false, // 删除提示弹框
      deleteSequence: -1, // 删除菜品的下标
      promoCodeVisiable: false, //促销码弹窗
      isHasSoldoutDish: false,
      dishMap: {},
      errorApiMsg: '',
      errorApiShow: false,
      isShowCardMinModal: false, // 刷卡最低小费弹框
      currentAmount: 0,
      isHasOrderCharge: false,
      orderPanelShow: false,
      comboPanelVisible: false,
      comboPanelIdx: 0,
      descVisible: false,
      promotionFn: undefined,
      selectedPromotion: [],
      shouldAnimate: false, // 动画控制
      showCallBoard: false,
      tableServiceType: '',
      isShowDesc: false,
      itemPromotionVisible: false, // 菜品促销选择弹窗
      // 删除赠菜
      deleteFreeItem: {},
      giftDeleteSelection: null,
    };
    this.orderDetailModal = React.createRef();
    this.comboItemModal = React.createRef();
    this.timer = null;
    this.flag = false;
    this.callBoardPromiseResolve = null;
  }

  openOrderDetailModal = (ref) => {
    this.orderDetailModal = ref;
  };

  openItemsDetailModal = (ref) => {
    this.comboItemModal = ref;
  };

  resolveItemDetail = (str) => {
    return (
      str
        // 删除多余 ','
        .replace(/,+/g, ',')
        // 删除 x1, (x1)
        .replace(/x1|\(x1\)/g, '')
        // 删除 ($0)
        .replace(/\(\$0\)/g, '')
    );
  };

  // 拼接每一项菜品的options
  orderDetailWriter = (item) => {
    const {
      i18n: { language },
    } = this.props;
    let price = null;
    let options = null;
    let cateOptions = null;
    let stack = [];
    const isFreeItem = item.isFreeItem;
    const promotionItem = item.promotionItem;
    const isPromotionItemFree =
      promotionItem && !item.isLocalExchangePurchaseItem;
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
      );
      if (isFreeItem || isPromotionItemFree) {
        stack.push(size + '($0.00); ');
      } else {
        stack.push(
          size + ` ($${_.round(price.sizeInfo.price, 2).toFixed(2)}); `
        );
      }
    }
    if (options) {
      const optionList = this.getOptionList(options.options);
      optionList.forEach((opt) => {
        let str = '';
        if (isFreeItem || isPromotionItemFree) {
          str = opt.name + ' ($0.00),';
        } else {
          str =
            opt.name +
            (' ($' + _.round(opt.price, 2).toFixed(2) + ')') +
            (' x' + opt.quantity) +
            ',';
        }
        stack.push(str);
      });
    }

    if (cateOptions) {
      const optMap = this.getOptionMap(cateOptions.options);
      Object.keys(optMap).forEach((id, i) => {
        let str = '';
        if (isFreeItem || isPromotionItemFree) {
          str = optMap[id].name + ' ($0.00),';
        } else {
          str =
            optMap[id].name +
            (' ($' + _.round(optMap[id].price, 2).toFixed(2) + ')') +
            (' x' + optMap[id].quantity) +
            ',';
        }
        stack.push(str);
      });
    }

    if (item.sectionDetail) {
      item.sectionDetail.forEach((sct) => {
        let itemsArr = [];
        if (sct.id > 0 && sct.items.length > 0) {
          sct.items.map((item) => {
            let str = '';
            if (!item.itemPrices) {
              let name =
                getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
                item.name;
              str =
                name +
                ' ($' +
                (isFreeItem || isPromotionItemFree
                  ? '0.00'
                  : _.round(item.price, 2).toFixed(2)) +
                ')' +
                ' x' +
                item.quantity +
                ',';
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
                    list?.sizeInfo?.sizeId,
                    list?.sizeInfo?.size,
                    this.props.itemSizeList,
                    language
                  );

                  optArr.push(
                    `${name}(${size}) ($${isFreeItem || isPromotionItemFree ? '0.00' : list.sizeInfo.price})(x${item.quantity}),`
                  );
                } else if (list.id === -2) {
                  const subOptList = this.getOptionList(list.options);
                  subOptList.forEach((opt) => {
                    optArr.push(
                      opt.name +
                        (' ($' +
                          (isFreeItem || isPromotionItemFree
                            ? '0.00'
                            : _.round(opt.price, 2).toFixed(2)) +
                          ')') +
                        (' x' + opt.quantity) +
                        ','
                    );
                  });
                } else if (list.id === -3) {
                  const subOptMap = this.getOptionMap(list.options);
                  Object.keys(subOptMap).map((id) => {
                    optArr.push(
                      subOptMap[id].name +
                        (' ($' +
                          (isFreeItem || isPromotionItemFree
                            ? '0.00'
                            : _.round(subOptMap[id].price, 2).toFixed(2)) +
                          ')') +
                        (' x' + subOptMap[id].quantity) +
                        ','
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

    // 处理详情信息
    return this.resolveItemDetail(
      stackStr.endsWith(',') ? stackStr.slice(0, stackStr.length - 1) : stackStr
    );
  };

  getOptionMap(options) {
    const map = {};
    options.forEach((opt) => {
      if (map[opt.id]) {
        map[opt.id].quantity++;
      } else {
        map[opt.id] = {
          id: opt.id,
          name: opt.name,
          quantity: 1,
          price: opt.price,
        };
      }
    });
    return map;
  }

  getOptionList(options) {
    const {
      i18n: { language },
    } = this.props;
    const list = [];
    options.forEach((opt) => {
      const idx = list.findIndex(
        (item) => item.id === opt.id && item.price === opt.price
      );
      if (idx > -1) {
        list[idx].quantity += opt.quantity;
      } else {
        let name =
          getCurrentItemLanguage(opt.fieldDisplayNameGroups, language) ||
          opt.name;
        list.push({
          id: opt.id,
          name: name,
          quantity: opt.quantity,
          price: opt.isFreeItem ? 0 : opt.price,
        });
      }
    });
    return list;
  }

  // 删除菜弹框-继续
  handleContinue = () => {
    const {
      currentOrder,
      setTempCampaign,
      changeFreeItem,
      editOrderItemAction,
    } = this.props;
    const { deleteFreeItem, deleteSequence } = this.state;
    console.log('deleteFreeItem', deleteFreeItem);
    // 删除赠菜
    if (deleteFreeItem?.isFreeItem || deleteFreeItem?.isCRMFreeItem) {
      setTempCampaign(null);
      changeFreeItem([]);
      const isFreeItemInOrder = currentOrder.itemList?.find(
        (each) => each.isFreeItem || each?.isCRMFreeItem
      );
      if (isFreeItemInOrder) {
        editOrderItemAction({
          deleteSequence,
          isSub: true,
        });
      }
    } else {
      editOrderItemAction({
        deleteSequence,
        isSub: true,
      });
    }
    // Toast.info(t('delete-tip'), 1000);
    this.handleCancel();
  };

  // 删除菜弹框-取消
  handleCancel = () => {
    solveScrollElem(false);
    this.setState({
      lastReuqireItem: {},
      deleteLoading: false,
      deleteFreeItem: {},
    });
  };

  // 刷卡不足最小金额后，返回并继续点单
  handleContinueOrder = () => {
    solveScrollElem(false);
    this.setState({ isShowCardMinModal: false });
  };
  // 刷卡不足最小金额后，关闭弹框
  handleCloseMin = () => {
    this.handleContinueOrder();
  };

  // 清空文本域
  handleResetEmpty = () => {
    this.setState({
      keyboardValue: '',
    });
    this.props.notes('');
  };

  // 加，减
  handleAddSubNum = (item, isSub = false) => {
    const { t, changePromotionStatusAfterCheck } = this.props;
    changePromotionStatusAfterCheck(item);
    // 当前打开键盘，则关闭
    if (this.state.keyboardToggle) {
      this.hideKeyboard();
    }
    // 减
    if (isSub) {
      let newNum = item.quantity - 1;
      if (newNum < 1) {
        if (this.props.requireCategory.length) {
          let m = this.formatterRequireCategory();
          let arr = [];
          for (let key in m) {
            arr.push(m[key]);
          }

          let count = m[item.categoryId];
          if (count <= 1) {
            solveScrollElem(true);
            this.setState({
              lastReuqireItem: cloneDeep(item),
              deleteLoading: true,
              deleteSequence: item.sequence,
            });
          } else {
            solveScrollElem(true);
            this.setState({
              lastReuqireItem: {},
              deleteLoading: true,
              deleteSequence: item.sequence,
            });
          }
        } else {
          solveScrollElem(true);
          // 删除当前菜品弹框
          this.setState({
            lastReuqireItem: {},
            deleteLoading: true,
            deleteSequence: item.sequence,
          });
        }
      } else {
        // 减
        this.props.editOrderItemAction({
          deleteSequence: item.sequence,
          isSub,
        });
      }
    } else {
      let newNum = item.quantity + 1;
      if (newNum <= this.state.maxNum) {
        const nextItemList = (this.props.currentOrder.itemList || []).map(
          (orderItem) => {
            if (orderItem.sequence === item.sequence) {
              return {
                ...orderItem,
                quantity: newNum,
              };
            }
            return orderItem;
          }
        );
        const stockCheckMap = {};
        const appendStockCheckItem = (checkItem) => {
          const checkStockItemId = getStockItemId(checkItem);
          const checkStockCloudId = checkItem?.cloudId;
          if (checkStockItemId == null && checkStockCloudId == null) {
            return;
          }
          const key = checkStockCloudId
            ? `${checkStockCloudId}`
            : `${checkStockItemId}`;
          if (!stockCheckMap[key]) {
            stockCheckMap[key] = checkItem;
          }
        };
        for (const section of item.sectionDetail || []) {
          if (section.id === -2 || section.id === -3) {
            for (const option of section.options || []) {
              appendStockCheckItem(option);
            }
            continue;
          }
          if (section.id <= 0) {
            continue;
          }
          for (const subItem of section.items || []) {
            appendStockCheckItem(subItem);
            const optionSectionList = subItem.selectedOptionList?.length
              ? subItem.selectedOptionList
              : subItem.sectionDetail;
            for (const optionSection of optionSectionList || []) {
              if (optionSection.id !== -2) {
                continue;
              }
              for (const option of optionSection.options || []) {
                appendStockCheckItem(option);
              }
            }
          }
        }
        for (const checkItem of Object.values(stockCheckMap)) {
          const checkStockNum = getItemStockNum(
            checkItem,
            this.props.store?.menuItemList
          );
          if (checkStockNum === undefined) {
            continue;
          }
          const checkStockItemId = getStockItemId(checkItem);
          const checkStockCloudId = checkItem.cloudId;
          const checkOccupiedQty = getOccupiedQtyByStockId({
            itemList: nextItemList,
            currentOrderCombo: this.props.store?.currentOrderCombo,
            crm: this.props.crm,
            stockItemId: checkStockItemId,
            stockCloudId: checkStockCloudId,
          });
          if (checkOccupiedQty > checkStockNum) {
            showInsufficientStockToast();
            return;
          }
        }
        // 加
        const editRes = this.props.editOrderItemAction({
          deleteSequence: item.sequence,
          isSub,
        });
        if (editRes === false) {
          return;
        }
        if (newNum == this.state.maxNum) {
          Toast.info(t('max-up', { rplc: defaultMax }), 1000);
        }
      }
      // 当商品数量变化触发动画
      this.setState({ shouldAnimate: true }, () => {
        this.animationTimer = setTimeout(() => {
          this.setState({ shouldAnimate: false });
        }, 500);
      });
    }
  };

  // 文本域输入
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
    this.props.notes(value);
  };

  // 键盘输入
  onChange = (input) => {
    this.setState({
      keyboardValue: input,
    });
    this.props.notes(input);
    this.inputRef.scrollIntoViewIfNeeded(true);
  };

  // 打开键盘
  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };

  // 关闭键盘
  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  dineInProcess = async () => {
    // 判断是否开通（柜台自取0、送餐到桌1）(id: 4)
    const { selfConfig, history, setLocator, setTabelServiceType } = this.props;
    const serviceTypes = selfConfig?.configList?.find(
      (each) => each.id === 4
    )?.value;
    // 展示送餐方式页面开关
    const serviceSwitch = selfConfig?.configList?.find(
      (each) => each.id === 29
    )?.value;

    // 选择桌子页面开关
    const chooseTableSwitch = selfConfig?.configList?.find(
      (each) => each.id === 39
    )?.value;

    // 送餐到桌
    const sendFoodToTable = !!serviceTypes.find((each) => each === 1);

    const isActualSwitchOpen = serviceSwitch && serviceTypes?.length > 0;

    if (isActualSwitchOpen || serviceTypes?.length === 2) {
      history.push('./tabelService');
      return;
    } else if (chooseTableSwitch && sendFoodToTable) {
      history.push('./chooseTable');
      return;
    }

    if (!isActualSwitchOpen) {
      if (!serviceTypes?.length) {
        await this.judgeSMSAfterOperation();
        return;
      }
      if (serviceTypes?.length === 1) {
        const isShowDesc = serviceTypes[0] === 1;
        setLocator('');
        // 号码牌
        const locatorType = selfConfig?.configMap?.id_28;
        if (locatorType === 1) {
          this.setState({
            tableServiceType: 'DINE_IN',
            isShowDesc,
            showCallBoard: true,
          });
          await this.showCallBoard();
        } else {
          setTabelServiceType('DINE_IN');
        }
        await this.judgeSMSAfterOperation();
      }
    }
  };

  togoProcess = async () => {
    const { selfConfig, systemConfig, setLocator, currentOrder } = this.props;
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
    setLocator('');
    const locatorType = selfConfig?.configMap?.id_28;
    const togoShowNumCards = selfConfig?.configMap?.id_36; //togo时候是不是需要展示号码牌

    if (
      locatorType === 1 &&
      (currentOrder.orderType !== 'TO_GO' ||
        (currentOrder.orderType === 'TO_GO' && togoShowNumCards))
    ) {
      this.setState({
        tableServiceType: 'TO_GO',
        isShowDesc: false,
        showCallBoard: true,
      });
      await this.showCallBoard();
    }
    // 有整单加收
    if (judgeCharge()) {
      // 仅开通卡支付
      if (paymentRouteResult.onlyCard) {
        // this.setState({ isHasOrderCharge: true });
        this.handleConfirmOrderCharge();
      } else {
        await this.judgeSMSAfterOperation();
      }
    } else {
      // 无整单加收、未开通小费，提示刷卡最低金额
      if (
        !isTipEnabledForPaymentType(
          selfConfig,
          'CREDIT_CARD',
          this.props.systemConfig
        ) &&
        calcCardMinAmout() &&
        paymentRouteResult.onlyCard
      ) {
        // 仅开通卡支付
        this.setState({
          isShowCardMinModal: true,
          currentAmount: calcCardMinAmout(),
        });
      } else {
        await this.judgeSMSAfterOperation();
      }
    }
  };

  getSatisfyRules = (rules, itemList) => {
    return rules.filter((rule) => {
      const inThisRuleItems = itemList.filter((item) =>
        rule.activityRule.buyDishes.includes(item.id)
      );
      const orderNumbers = inThisRuleItems.reduce((pre, cur) => {
        return pre + (cur.quantity ?? 0);
      }, 0);
      const needOrderNumbers = Number(rule.activityRule.buyNumber);
      if (rule.activityRule.buyType === 'identical') {
        const quantityByItemId = inThisRuleItems.reduce((result, item) => {
          result[item.id] = (result[item.id] || 0) + Number(item.quantity || 0);
          return result;
        }, {});
        return Object.values(quantityByItemId).some(
          (quantity) => quantity >= needOrderNumbers
        );
      }
      if (orderNumbers >= needOrderNumbers) return true;
      return false;
    });
  };

  getLocalPromotionOrderAmount = (itemList) => {
    const { currentCategoryList } = this.props;
    return Number(
      itemList
        .filter((item) => !item.isLocalExchangePurchaseItem)
        .filter((item) => {
          const categoryId = item.oCategoryId || item.categoryId;
          return currentCategoryList.find(
            (category) => category.id === categoryId
          )?.applicableToTriggerPromotion;
        })
        .reduce(
          (total, item) =>
            Big(total).plus(
              Big(getItemPrice(item) || 0).times(item.quantity || 0)
            ),
          Big(0)
        )
        .toFixed(2)
    );
  };

  handleCheckExchangePurchase = async () => {
    const {
      crm: { tempCampaign, selectedDiscount },
      selfConfig,
      currentOrder,
      t,
      promotion: { exchangePurchaseRule, isSkipPromotionCalculation },
      addCampaignItemsToOrder,
    } = this.props;
    if (!exchangePurchaseRule?.length || isSkipPromotionCalculation)
      return true;
    if (Object.keys(selectedDiscount)?.length > 0 || tempCampaign?.length > 0) {
      return true;
    }

    const normalItems = currentOrder.itemList.filter(
      (item) => !item.isLocalExchangePurchaseItem
    );
    const satisfiedRules = getSatisfiedExchangePurchaseRules(
      exchangePurchaseRule,
      normalItems,
      this.getLocalPromotionOrderAmount(normalItems)
    );
    const selectedExchangeItems = currentOrder.itemList.filter(
      (item) => item.isLocalExchangePurchaseItem
    );
    if (selectedExchangeItems.length) {
      const satisfiedRuleIds = satisfiedRules.map((rule) => rule.id);
      const selectionIsStillValid = selectedExchangeItems.every((item) =>
        satisfiedRuleIds.includes(item.exchangePurchaseRuleId)
      );
      if (selectionIsStillValid) return true;
      addCampaignItemsToOrder(normalItems);
      Toast.info(t('exchangePurchaseInvalid'), 2000);
      return false;
    }
    if (!satisfiedRules.length) return true;

    const result = await Modal.loadDrawer(
      <PromotionItems
        selfConfig={selfConfig}
        satisfyRules={satisfiedRules}
        categoryList={this.getPromotionCategoryList()}
        currentOrder={currentOrder}
        onNext={this.handleContinueConfirm}
        handleEditItem={this.handleEdit}
        exchangePurchase
      />
    );
    if (result?.length > 0) {
      const exchangeItems = result.flatMap((selection) => {
        const rule = satisfiedRules.find(
          (item) => item.id === selection.ruleId
        );
        return (selection.items || []).map((item) =>
          applyExchangePurchaseDiscount(item, rule)
        );
      });
      addCampaignItemsToOrder([...normalItems, ...exchangeItems]);
    }
    return false;
  };

  getPromotionCategoryList = () => {
    const { menuGroup, currentOrder, allMenu } = this.props;
    const categoryListWithHiddenItems = getValidCategoryList(
      menuGroup,
      currentOrder?.orderType,
      false
    );

    if (categoryListWithHiddenItems?.length) return categoryListWithHiddenItems;

    return allMenu?.map((each) => each.menuCategories)?.flat() || [];
  };

  // 编辑赠送商品（重选按钮）
  handleEditGifts = async () => {
    const {
      selfConfig,
      promotion: { satisfyRules, buyGifts, cloudPromotion },
      setBuyGifts,
    } = this.props;
    const promotionCategoryList = this.getPromotionCategoryList();
    const res = await Modal.loadDrawer(
      <PromotionItems
        selfConfig={selfConfig}
        satisfyRules={satisfyRules}
        categoryList={promotionCategoryList}
        currentOrder={this.props.currentOrder}
        onNext={this.handleContinueConfirm}
        alreadySelectedPromotion={buyGifts}
        cloudPromotion={cloudPromotion}
        handleEditItem={this.handleEdit}
      />
    );
    if (res?.length > 0) {
      setBuyGifts(res);
      return;
    }
    setBuyGifts([]);
  };

  // kiosk本地promotion 或 旧云promotion - 赠菜活动 弹窗交互
  handleCheckPromotion = async () => {
    const {
      crm: { tempCampaign, selectedDiscount },
      selfConfig,
      promotion: {
        buyGiftRule,
        buyGifts,
        cloudPromotion,
        isSkipPromotionCalculation,
      },
      setBuyGifts,
      setSatisfyRules,
    } = this.props;
    const promotionCategoryList = this.getPromotionCategoryList();
    // 是否已选crm活动
    const isSelectedDiscount = Object.keys(selectedDiscount)?.length > 0;
    const isHasCrmCampaign = isSelectedDiscount || tempCampaign?.length > 0;
    const canContinueAfterExchangePurchase =
      await this.handleCheckExchangePurchase();
    if (!canContinueAfterExchangePurchase) return false;
    // 判断是否有菜品买赠促销 或者 云Promotion-订单满赠
    if (
      (buyGiftRule?.length > 0 || cloudPromotion?.length > 0) &&
      !isSkipPromotionCalculation &&
      !isHasCrmCampaign
    ) {
      let satisfyRules = [];
      // 判断是否能命中云促销订单满赠
      if (cloudPromotion?.length > 0) {
        satisfyRules = this.handleGetCloudOrderGift();
      }
      // 判断是否能命中菜品买赠促销
      if (buyGiftRule?.length > 0) {
        satisfyRules = this.getSatisfyRules(
          buyGiftRule,
          this.props.currentOrder.itemList
        );
      }
      setSatisfyRules(satisfyRules);
      if (satisfyRules?.length > 0 && !buyGifts?.length) {
        const res = await Modal.loadDrawer(
          <PromotionItems
            selfConfig={selfConfig}
            satisfyRules={satisfyRules}
            categoryList={promotionCategoryList}
            currentOrder={this.props.currentOrder}
            onNext={this.handleContinueConfirm}
            cloudPromotion={cloudPromotion}
            handleEditItem={this.handleEdit}
          />
        );
        if (res?.length > 0) {
          setBuyGifts(res);
        }
        return false;
      }
      return true;
    }
    return true;
  };

  // 提交，跳转支付选择页面
  handleConfirm = async () => {
    const {
      t,
      i18n: { language },
      currentOrder,
      selfConfig,
    } = this.props;
    const { itemList } = currentOrder;

    // 后台新增“购物车只有兑换商品是否可以下单”的配置
    const onlyHaveFreeItem = judgeOnlyHaveFreeItem();
    if (onlyHaveFreeItem) {
      const canCheckOnlyFreeItem = selfConfig?.configList?.find(
        (config) => config.id === 46
      )?.value;

      if (!canCheckOnlyFreeItem) {
        Toast.info(t('order-uncheckable-only-reward'), 2000);
        return;
      }
    }

    // 下单含有售罄菜
    const dishMap = judegOrderDishIsHasSoldout(cloneDeep(itemList || []));
    if (dishMap?.slodoutList?.length) {
      this.setState({ dishMap, isHasSoldoutDish: true });
      return;
    }

    const isContinue = await this.handleCheckPromotion();

    if (isContinue) {
      this.handleContinueConfirm();
    }
  };

  // 旧云promotion 买赠活动 数据处理
  handleGetCloudOrderGift = () => {
    const {
      store,
      currentOrder,
      promotion: { cloudPromotion },
    } = this.props;
    const { itemList, orderType } = currentOrder;
    const orderInfoObj = getOrderInfoObj(store);
    const data = {
      promotionRules: cloudPromotion,
      orderType,
      itemList,
      totalAmount: orderInfoObj.orderSubtotal,
    };
    const res = handleCalculatePromotion(data);
    return res.map((each) => {
      const {
        condition: { maxNum, menuItem },
        promotionInfo,
      } = each;
      const giftsDishes = menuItem.map((each) => each['menuItem/itemId']);
      const giftsNumber = maxNum;
      const id = promotionInfo.promotionId;
      return {
        activityRule: { giftsDishes, giftsNumber },
        id,
        isOrderGift: true,
        promotionInfo,
      };
    });
  };

  handleContinueConfirm = () => {
    const { store, selfConfig, systemConfig, currentOrder } = this.props;
    const paymentRouteResult = handlePaymentTypeRoute(systemConfig, selfConfig);
    // 堂吃（dinein）
    if (currentOrder.orderType == 'DINE_IN') {
      // 有整单加收
      if (judgeCharge()) {
        // 仅开通卡支付
        if (paymentRouteResult.onlyCard) {
          // this.setState({ isHasOrderCharge: true });
          this.handleConfirmOrderCharge();
        } else {
          this.dineInProcess();
        }
      } else {
        // 无整单加收、未开通小费，提示刷卡最低金额
        if (
          !isTipEnabledForPaymentType(
            selfConfig,
            'CREDIT_CARD',
            this.props.systemConfig
          ) &&
          calcCardMinAmout() &&
          paymentRouteResult.onlyCard
        ) {
          // 仅开通卡支付
          this.setState({
            isShowCardMinModal: true,
            currentAmount: calcCardMinAmout(),
          });
        } else {
          this.dineInProcess();
        }
      }
    } else {
      // 打包（to_go、pick_up）
      // 配置了打包带，餐具，打包盒等加收项
      if (selfConfig?.charge?.length) {
        let r2 = selfConfig.charge.find((c) => c.id == 2);
        let r3 = selfConfig.charge.find((c) => c.id == 3);
        let r4 = selfConfig.charge.find((c) => c.id == 4);
        if (r2?.select?.id || r3?.select?.id) {
          this.props.history.push('./togoOption');
        } else {
          const togoList = cloneDeep(store.togoList);
          // 默认加收打包盒，但不在页面上展示
          if (r4?.select?.id) {
            for (let i = 0; i < togoList.length; i++) {
              if (togoList[i].id === 4) {
                togoList[i] = {
                  id: r4?.id,
                  name: togoList[i].name,
                  select: r4?.select,
                };
                break;
              }
            }
            this.props.setTogoOption(togoList);
          }
          this.togoProcess();
        }
      } else {
        this.togoProcess();
      }
    }
  };

  // 判断是否开通SMS、及后续配置操作
  judgeSMSAfterOperation = async () => {
    const { systemConfig, selfConfig, store } = this.props;

    if (navigatePartySizeIfNeeded(this.props.history, selfConfig)) {
      return;
    }

    await runJudgeSMSAfterOperation({
      systemConfig,
      selfConfig,
      store,
      history: this.props.history,
      payByCard: this.props.payByCard,
      payByCash: this.props.payByCash,
      saveOrderResult: this.props.saveOrderResult,
      kioskConfigUserId: this.props.userId,
      judgeConfigToSoldout: this.judgeConfigToSoldout,
      judgeFillCardMinAmout: this.judgeFillCardMinAmout,
      setLoading: (loading) => this.setState({ loading }),
      onError: this.showApiModalTip,
    });
  };

  // 查询配置项、判断订单内，是否含售罄菜
  judgeConfigToSoldout = (fn) => {
    judgeConfigToSoldoutUtil(fn, {
      setSelfConfig: this.props.setSelfConfig,
      setState: this.setState.bind(this),
      showApiModalTip: this.showApiModalTip,
      onSoldoutDetected: () => {
        solveScrollElem(true);
      },
    });
  };

  // 判断是否满足刷卡最低消费金额
  judgeFillCardMinAmout = () => {
    if (calcCardMinAmout()) {
      this.setState({
        isShowCardMinModal: true,
        currentAmount: calcCardMinAmout(),
      });
    } else {
      this.props.history.push('/cardPayment');
    }
  };

  // 返回orderPage，重新点单
  reorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    solveScrollElem(false);
    this.setState({
      isHasSoldoutDish: false,
    });
  };

  // 仍然下单
  continueReorder = () => {
    if (this?.state?.dishMap?.allSoldIds?.length) {
      this.props.spliceOrderBySoldout(this.state.dishMap.allSoldIds);
    }
    solveScrollElem(false);
    this.setState({
      isHasSoldoutDish: false,
    });
    setTimeout(async () => {
      await this.judgeSMSAfterOperation();
    }, 0);
  };

  handleCancelOrderCharge = () => {
    this.setState({ isHasOrderCharge: false });
  };

  handleConfirmOrderCharge = async () => {
    const { selfConfig, currentOrder } = this.props;
    this.setState({ isHasOrderCharge: false });
    // 堂吃（dinein）
    if (currentOrder.orderType == 'DINE_IN') {
      // 未开通小费，提示刷卡最低金额
      if (
        !isTipEnabledForPaymentType(
          selfConfig,
          'CREDIT_CARD',
          this.props.systemConfig
        ) && calcCardMinAmout()
      ) {
        this.setState({
          isShowCardMinModal: true,
          currentAmount: calcCardMinAmout(),
        });
      } else {
        await this.dineInProcess();
      }
    } else {
      // 打包（to_go），已经未开通打包带和餐具等加收项，再未开通小费，提示刷卡最低金额
      if (
        !isTipEnabledForPaymentType(
          selfConfig,
          'CREDIT_CARD',
          this.props.systemConfig
        ) && calcCardMinAmout()
      ) {
        this.setState({
          isShowCardMinModal: true,
          currentAmount: calcCardMinAmout(),
        });
      } else {
        await this.judgeSMSAfterOperation();
      }
    }
  };

  //返回
  backBtnHandler = () => {
    this.props.history.goBack();
  };

  // 存储sideNav
  saveSideNav = (currentItem) => {
    const {
      t,
      i18n: { language },
    } = this.props;
    const sectionList = Object.assign([], currentItem.comboSections);

    sectionList.unshift({
      id: -1,
      name:
        getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) ||
        currentItem.name,
      info: currentItem,
    });

    // 菜的options和类的options，合并
    if (currentItem.categoryOptions) {
      sectionList.push({
        id: -3,
        name: t('item_option'),
        key: 'item_option',
        numOfItemOptionAllowed: currentItem?.numOfItemOptionAllowed || 0,
      });
    }

    const sectionId = sectionList[0].id;
    this.props.setSideNavIndex(sectionId);
    this.props.setSideNavList(sectionList);
  };

  // 点击菜品，编辑当前菜品
  handleEdit = (itemInfo, promotionObj = {}) => {
    const {
      t,
      promotion: { buyGifts },
      changePromotionStatusAfterCheck,
    } = this.props;
    changePromotionStatusAfterCheck(itemInfo);
    if (
      itemInfo.isFreeItem ||
      (itemInfo.promotionRewardItem &&
        itemInfo.manualSelectRewardDiscount?.length > 0)
    )
      return Toast.info(t('no-edit-freeItem'), 1000);
    const { selectedPromotion, Fn: promotionFn } = promotionObj;
    // 当前打开键盘，则关闭
    if (this.state.keyboardToggle) {
      this.hideKeyboard();
    }
    // 单项菜品，或者是固定套餐
    if (
      !itemInfo.itemType ||
      itemInfo.itemType === 'SALE_ITEM' ||
      itemInfo?.comboType === 'FIXED_SELECTION'
    ) {
      // 判断当前菜，是否有详情等字段
      if (judgeHasDetailInfo(itemInfo)) {
        this.setState({
          selectedItem: cloneDeep(itemInfo),
          orderPanelShow: true,
          promotionFn: promotionFn || undefined,
          selectedPromotion: selectedPromotion || [],
        });
      } else {
        if (promotionFn) {
          const clonedItem = cloneDeep(itemInfo);
          if (clonedItem.itemPrices?.length === 1) {
            clonedItem.sectionDetail = [
              {
                id: -1,
                sizeInfo: Object.assign({}, clonedItem.itemPrices[0]),
              },
            ];
            clonedItem.price = 0;
          } else {
            clonedItem.sectionDetail = [];
          }
          promotionFn(clonedItem);
        } else {
          Toast.info(t('no-details'), 1000);
        }
      }
    } else {
      // 当选择的是赠菜列表里的菜
      if (promotionFn) {
        const deepCloneObj = cloneDeep(itemInfo);
        if (!selectedPromotion.length) {
          this.props.resetCurrentOrderCombo();
        }
        this.props.getCurrentCategory(itemInfo.categoryId);
        this.props.getCurrentItem(itemInfo.id);
        this.setState({
          selectedItem: deepCloneObj,
          comboPanelVisible: true,
          promotionFn: promotionFn,
          selectedPromotion: selectedPromotion,
        });

        // 已经选择了某个菜,再次点击（编辑）要带入上一次选择的信息
        if (selectedPromotion.length) {
          this.props.setEditOrderMode(deepCloneObj);
        } else {
          this.props.initEditOrderMode();
        }
      } else {
        // 自选套餐，保存当前combo
        const deepCloneObj = cloneDeep(itemInfo);
        this.saveSideNav(deepCloneObj);
        this.props.setEditOrderMode(deepCloneObj);

        this.setState(
          {
            selectedItem: cloneDeep(itemInfo),
            promotionFn: undefined,
            selectedPromotion: [],
          },
          () => {
            // 打开items详细
            this.comboItemModal.viewOrderPanel();
          }
        );
      }
    }
  };

  // 必选类，菜的个数
  formatterRequireCategory = () => {
    const { requireCategory, currentOrder } = this.props;
    if (requireCategory.length) {
      let obj = {};

      requireCategory.forEach((c) => {
        obj[c.id] = 0;
      });

      currentOrder.itemList.forEach((item) => {
        if (obj.hasOwnProperty(item.categoryId)) {
          obj[item.categoryId] += item.quantity;
        }
      });

      return obj;
    } else {
      return null;
    }
  };

  // 判断是否可以点击[确认订单]
  judgeClick = () => {
    const {
      requireCategory,
      currentOrder,
      crm: { selectedFreeItem },
      promotion,
    } = this.props;

    const count = [
      ...currentOrder.itemList,
      ...selectedFreeItem,
      ...(promotion?.buyGifts?.[0]?.items || []),
    ].reduce((total, item) => total + (item.quantity || 1), 0);

    if (requireCategory.length) {
      let m = this.formatterRequireCategory();
      const arr = Object.values(m);

      const isClick = arr.every((n) => n > 0);
      return {
        isClick,
        count,
      };
    } else {
      return {
        isClick: count > 0,
        count,
      };
    }
  };

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

  async componentDidMount() {
    const { isReorderFlag } = this.props;
    // 若从上一个页面返回，传来的重新下单状态为true，则继续返回
    if (isReorderFlag) {
      this.backBtnHandler();
    } else {
      await this.handleCheckPromotion();
      await this.handleSetPosVersion();
    }
  }

  handleSetPosVersion = async () => {
    const res = await fetchCompanyProfile();
    const posVersion = res?.data?.company?.appInfo?.version;
    if (posVersion) {
      localStorage.setItem('posVersion', JSON.stringify(posVersion));
    }
  };

  handleGoBackToOrderPage = (prevProps) => {
    const goBackToOrderPage = () => {
      this.props.history.goBack();
      this.props.notes('');
    };
    const { currentOrder: prevOrder, crm: preCrm } = prevProps;
    const prevItemLst = [
      ...(prevOrder?.itemList || []),
      ...(preCrm?.selectedFreeItem || []),
    ];
    const { currentOrder, crm } = this.props;
    const currentItemList = [
      ...(currentOrder?.itemList || []),
      ...(crm?.selectedFreeItem || []),
    ];
    // 当购物车没有菜品，返回上一页
    if (prevItemLst.length > 0 && currentItemList.length <= 0) {
      goBackToOrderPage();
    }
  };

  handleCheckPromotionGiftItem = (prevProps) => {
    const { currentOrder: prevOrder } = prevProps;
    const { currentOrder, t } = this.props;
    const preOrderGiftItem = prevOrder?.itemList?.filter(
      (e) => e.promotionRewardItem && e.manualSelectRewardDiscount?.length > 0
    );
    const isPreOrderHasGiftItem = preOrderGiftItem?.length > 0;

    if (isPreOrderHasGiftItem) {
      const onCheckFailed = () => {
        const timer = setTimeout(() => {
          Toast.info(t('gift-item-change'));
          clearTimeout(timer);
        }, 100);
      };
      const currentOrderGiftItem = currentOrder?.itemList?.filter(
        (e) => e.promotionRewardItem && e.manualSelectRewardDiscount?.length > 0
      );
      const isCurrentOrderHasGiftItem = currentOrderGiftItem?.length > 0;
      if (!isCurrentOrderHasGiftItem) {
        onCheckFailed();
        return;
      }
      const isSameGiftItems = isSameItems(
        preOrderGiftItem,
        currentOrderGiftItem
      );
      if (!isSameGiftItems) onCheckFailed();
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const { t } = this.props;
    // 当购物车没有菜品，返回上一页
    this.handleGoBackToOrderPage(prevProps);
    // 促销中台 - 买赠满赠赠菜有变化时
    this.handleCheckPromotionGiftItem(prevProps);

    let isScroll = this.state.isScroll;
    let isExceedlimit = !!(String(this.state.keyboardValue).length >= 255);
    if (!isScroll && isExceedlimit && this.scrollDom) {
      if (this.scrollDom.scrollHeight > this.scrollDom.offsetHeight) {
        let scrollTop =
          this.scrollDom.scrollHeight - this.scrollDom.offsetHeight;
        this.scrollDom.scrollTop = scrollTop;
        this.setState({
          isScroll: true,
        });
      }
    }

    if (this.state.keyboardToggle != prevState.keyboardToggle) {
      // 打开
      if (this.state.keyboardToggle) {
        this.scrollDom.style.height = 'calc(100vh - 80px - 380px)';
        // 将textarea滚动到可视区域
        this.inputRef.scrollIntoViewIfNeeded(true);
      } else {
        // 关闭
        this.scrollDom.style.height = 'calc(100vh - 24.8rem)';
      }
    }

    if (this.props.currentOrder.itemList !== prevProps.currentOrder.itemList) {
      const {
        promotion: { buyGiftRule, buyGifts, cloudPromotion },
        setSatisfyRules,
        setBuyGifts,
      } = this.props;
      if (
        (buyGiftRule.length > 0 || cloudPromotion.length > 0) &&
        buyGifts.length > 0
      ) {
        let satisfyRules = [];
        if (cloudPromotion.length > 0) {
          satisfyRules = this.handleGetCloudOrderGift();
        }
        if (buyGiftRule.length > 0) {
          satisfyRules = this.getSatisfyRules(
            buyGiftRule,
            this.props.currentOrder.itemList
          );
        }
        setSatisfyRules(satisfyRules);
        // 检查已选赠菜 是否依旧满足当前下单菜品规则
        const invalidRule = buyGifts.filter((each) => {
          const promotionIds = satisfyRules.map((promotion) => promotion.id);
          return !promotionIds.includes(each.ruleId);
        });
        if (invalidRule?.length > 0) {
          const newBuyGifts = buyGifts.filter((each) => {
            const ruleIds = invalidRule.map((rule) => rule.ruleId);
            return !ruleIds.includes(each.ruleId);
          });
          setBuyGifts(newBuyGifts);
        }
      }

      // 之前有生效的活动,现在没有生效的促销平台的活动时,清除促销码并提示
      const hasValidPromotionBefore = prevProps?.currentOrder?.itemList?.some(
        (item) =>
          item?.promotionRewardItem ||
          item?.manualSelectRewardDiscount?.length > 0
      );
      const hasValidPromotionNow = this.props?.currentOrder?.itemList?.some(
        (item) =>
          item?.promotionRewardItem ||
          item?.manualSelectRewardDiscount?.length > 0
      );
      if (hasValidPromotionBefore && !hasValidPromotionNow) {
        Toast.info(t('activityInvalidPleaseReselect'));
        this.props.setPromotionCode('');
      }
    }
  }

  // 打开callerBoard弹框后
  showCallBoard = () => {
    return new Promise((resolve) => {
      this.callBoardPromiseResolve = resolve;
    });
  };

  closeCallBoard = (locatorVal) => {
    this.setState(
      {
        showCallBoard: false,
      },
      () => {
        if (!locatorVal) {
          return;
        } else {
          if (this.callBoardPromiseResolve) {
            this.callBoardPromiseResolve(true);
          }
        }
        if (this.callBoardPromiseResolve) {
          this.callBoardPromiseResolve = null;
        }
      }
    );
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
    }
  }

  // 删除本地or旧云promotion买赠菜品
  updateGiftItem = (updatedItem, originalItem) => {
    const {
      promotion: { buyGifts },
      setBuyGifts,
    } = this.props;
    setBuyGifts(
      buyGifts.map((giftRule) => ({
        ...giftRule,
        items: giftRule.items.map((item) =>
          item.id === originalItem.id && item.sequence === originalItem.sequence
            ? {
                ...updatedItem,
                sequence: originalItem.sequence,
                ruleId: giftRule.ruleId,
              }
            : item
        ),
      }))
    );
  };

  editGiftItem = (item) => {
    if (!judgeHasDetailInfo(item) && !item.comboSections?.length) return;
    this.handleEdit(item, {
      selectedPromotion: this.props.promotion.buyGifts,
      Fn: (updatedItem) => this.updateGiftItem(updatedItem, item),
    });
  };

  removeGiftItem = (item) => {
    const {
      promotion: { buyGifts },
      setBuyGifts,
    } = this.props;
    const giftRule = buyGifts.find((each) => each.ruleId === item.ruleId);
    const sameItems = (giftRule?.items || []).filter(
      (giftItem) => giftItem.id === item.id
    );
    if (sameItems.length > 1) {
      this.setState({
        giftDeleteSelection: {
          item,
          ruleId: giftRule.ruleId,
          items: sameItems,
        },
      });
      return;
    }
    const newBuyGifts = buyGifts
      .map((each) => {
        if (each.ruleId !== item.ruleId) return each;
        const { items } = each;
        const newItems = items.reduce((result, giftItem) => {
          const isTarget =
            giftItem.id === item.id &&
            (item.sequence == null || giftItem.sequence === item.sequence);
          if (!isTarget) {
            result.push(giftItem);
          } else if (Number(giftItem.quantity || 1) > 1) {
            result.push({
              ...giftItem,
              quantity: Number(giftItem.quantity || 1) - 1,
            });
          }
          return result;
        }, []);
        if (!newItems?.length) return null;
        return {
          ...each,
          items: newItems,
        };
      })
      ?.filter(Boolean);
    setBuyGifts(newBuyGifts);
  };

  stageGiftVariantRemoval = (sequence) => {
    this.setState(({ giftDeleteSelection }) => ({
      giftDeleteSelection: {
        ...giftDeleteSelection,
        items: giftDeleteSelection.items.filter(
          (item) => item.sequence !== sequence
        ),
      },
    }));
  };

  confirmGiftVariantRemoval = () => {
    const { giftDeleteSelection } = this.state;
    if (!giftDeleteSelection) return;
    const {
      promotion: { buyGifts },
      setBuyGifts,
    } = this.props;
    const retainedSequences = new Set(
      giftDeleteSelection.items.map((item) => item.sequence)
    );
    const nextBuyGifts = buyGifts
      .map((giftRule) => {
        if (giftRule.ruleId !== giftDeleteSelection.ruleId) return giftRule;
        const items = giftRule.items.filter(
          (item) =>
            item.id !== giftDeleteSelection.item.id ||
            retainedSequences.has(item.sequence)
        );
        return items.length ? { ...giftRule, items } : null;
      })
      .filter(Boolean);
    setBuyGifts(nextBuyGifts);
    this.setState({ giftDeleteSelection: null });
  };

  // 拼接活动满减金额文案 discountNumber
  discountNumberText = (activityRule) => {
    const discountNumber = `${
      activityRule?.discountType === 'fixDiscount' ? '$' : ''
    }${activityRule?.discountNumber}${
      activityRule?.discountType === 'rateDiscount' ? '% ' : ''
    }`;
    return discountNumber;
  };

  // 应用促销码
  handlePromoCodeContinue = async (code) => {
    const {
      t,
      store,
      promotion: {
        orderDiscount,
        isOpenCloudPromotion,
        promotionCenterList,
        itemValidPromotion,
      },
    } = this.props;
    if (isOpenCloudPromotion) {
      const rules = promotionCenterList?.filter(
        (item) => item?.promotionCodes?.length
      );
      const hitPromoCodeActivity = rules.find((item) =>
        item?.promotionCodes?.includes(code)
      );
      // 无效促销码
      if (Object.keys(hitPromoCodeActivity || {}).length === 0) {
        Toast.info(t('promoCodeInvalid'), 2000);
        return;
      }
      const isPromotionAlreadySelect = itemValidPromotion?.find(
        (e) => e.isSelected
      );
      // 已参与其他促销活动
      if (isPromotionAlreadySelect) {
        Toast.info(
          t('haveJoin', {
            activeTxt: `${getPromotionCenterActivityRuleText({
              t,
              activityRule: isPromotionAlreadySelect?.promotion?.activityRule,
              type: isPromotionAlreadySelect?.promotion?.type,
              promotionName: isPromotionAlreadySelect?.promotion?.promotionName,
              selfConfig: this.props.selfConfig,
              promoCenterHitActivity: isPromotionAlreadySelect,
            })}`,
          }),
          2000
        );
        return;
      }
      // 已参与会员活动
      const hasCampaign = this.getHasCampaignInfo();
      if (hasCampaign) {
        Toast.info(
          t('haveJoin', {
            activeTxt: `${t('reward_point')}${t('activity')}`,
          }),
          2000
        );
        return;
      }

      this.handleCheckPromotionCenter({ code });
    } else {
      // 本地促销码
      const hitPromoCodeActivity = orderDiscount.find(
        (item) => item?.activityRule?.promotionCode === code
      );
      // 无效促销码
      if (Object.keys(hitPromoCodeActivity || {}).length === 0) {
        Toast.info(t('promoCodeInvalid'), 2000);
        return;
      }
      const { activityRule } = hitPromoCodeActivity;
      const orderInfo = getOrderInfoObj(store);
      // 条件不满足
      if (orderInfo.orderSubtotal < activityRule.satisfyPrice) {
        const discountNumber = this.discountNumberText(activityRule);
        Toast.info(
          t('promoCodeUnderCondition', {
            price: activityRule.satisfyPrice,
            discountNumber,
          }),
          2000
        );
        return;
      }
      this.props.setPromotionCode(code);
      this.handlePromoCodeCancel();
    }
  };

  // 取消输入促销码
  handlePromoCodeCancel = () => {
    this.setState({
      promoCodeVisiable: false,
    });
  };

  // 校验当前生效\未生效的促销活动[促销中台]
  handleCheckPromotionCenter = async ({ code }) => {
    const {
      t,
      promotion: {
        itemValidPromotion,
        promotionCenterList,
        promotionCenterMetas,
      },
      setItemValidPromotion,
      merchantProfile,
    } = this.props;

    // 当前有选中的  isSelected
    //   促销码没命中 - 通知促销码无效 弹出促销框
    //   促销码命中未生效 - 弹出促销框
    //   促销码命中也生效 - 改促销码isSelected 弹出促销框
    // 当前没有选中的  && 没有命中的促销
    //   促销码没命中 - 通知促销码无效
    //   促销码命中未生效 改促销码isSelected
    //   促销码命中也生效 改促销码isSelected
    // 其他
    //   促销码没命中 - 通知促销码无效
    //   促销码命中未生效 弹出促销框
    //   促销码命中也生效 改促销码isSelected 弹出促销框

    const onCheckSuccess = (validateRes) => {
      // 点单商品无可用促销
      if (!validateRes?.length) {
        setItemValidPromotion(null);
        this.handlePromoCodeCancel();
        return;
      }

      const promotionCodeInfo = validateRes?.find((item) =>
        item?.promotion?.promotionCodes?.includes(code)
      );
      if (promotionCodeInfo === undefined) {
        // 促销码活动校验未命中 告知活动无效
        Toast.info(t('promoCodeActivityInvalid'), 2000);
      }
      const disabledPromotionCodeInfo =
        promotionCodeInfo.validateInfo?.result?.result?.discounts?.[0]
          ?.amount === 0;
      if (disabledPromotionCodeInfo) {
        Toast.info(t('notReachThreshold'), 2000);
      }

      const afterCheckValidatePromotion = validateRes?.map((r) => {
        const isPromotionAlreadySelect = itemValidPromotion?.find(
          (e) => e.isSelected && e.promotion.id === r.promotion.id
        );
        if (isPromotionAlreadySelect) {
          const isStillValid = checkIsRuleValid(r.validateInfo);
          return { ...r, isSelected: isStillValid };
        }
        return r;
      });

      const isRuleValid = checkIsRuleValid(
        afterCheckValidatePromotion?.[0]?.validateInfo
      );
      // 只有一个满足条件的促销码活动
      const promotionCodeIsValidOnly =
        afterCheckValidatePromotion?.length === 1 &&
        isRuleValid &&
        !GIFT_PROMOTION_TYPE.includes(
          afterCheckValidatePromotion?.[0]?.promotion?.type
        );
      if (promotionCodeIsValidOnly) {
        setItemValidPromotion(
          afterCheckValidatePromotion?.map((item) => ({
            ...item,
            isSelected: true,
          }))
        );
      } else {
        setItemValidPromotion(afterCheckValidatePromotion);
      }
      this.props.setPromotionCode(code);
      this.handlePromoCodeCancel();

      // 只有促销码的活动 且没有命中当前输入的;
      //  只有一个促销码活动,且满足条件
      // 不展示促销选择窗

      const onlyCodePromotion = afterCheckValidatePromotion?.every(
        (item) => item?.promotion?.promotionCodes?.length
      );
      if (
        (onlyCodePromotion &&
          promotionCodeInfo &&
          !disabledPromotionCodeInfo) ||
        !onlyCodePromotion ||
        !promotionCodeIsValidOnly
      ) {
        this.setState({
          itemPromotionVisible: true,
        });
      }
    };

    const onCheckFailed = () => {
      setItemValidPromotion(null);
      this.handlePromoCodeCancel();
      Toast.info(t('promoCodeActivityInvalid'), 2000);
      return;
    };

    // 检查当前订单可用的促销活动, 并检查活动是否可用, 不可用给出原因
    await handleCheckOrderPromotion({
      promotionCenterList,
      promotionCenterMetas,
      onCheckSuccess,
      onCheckFailed,
      merchantId: merchantProfile?.merchantId,
    });
  };

  // 关闭促销冲突弹窗
  handleClosePromotionModal = () => {
    this.setState({
      itemPromotionVisible: false,
    });
  };

  // 跳过冲突促销弹窗交互
  handleSkipPromotion = () => {
    this.handleClosePromotionModal();
    this.props.setPromotionCode('');
  };

  // 促销冲突弹窗- 选中促销活动
  handleSelectPromotion = (rule) => {
    const {
      promotion: { itemValidPromotion, promotionCode },
      setItemValidPromotion,
    } = this.props;
    const updatedItemPromotion = itemValidPromotion?.map((each) => {
      return {
        ...each,
        isSelected: each.promotion.id === rule.promotion.id ? true : undefined,
      };
    });
    if (
      !updatedItemPromotion
        ?.find((item) => item?.isSelected)
        ?.promotion?.promotionCodes?.includes(promotionCode)
    ) {
      this.props.setPromotionCode('');
    }
    setItemValidPromotion(updatedItemPromotion);
    this.handleClosePromotionModal();
  };

  // kiosk本地促销提示文案
  renderLocalPromotionInfo = (orderInfo) => {
    const {
      t,
      promotion: { orderDiscount, promotionCode, isOpenCloudPromotion },
    } = this.props;
    if (isOpenCloudPromotion) return;
    if (orderInfo.promotionDiscountInfo) {
      const { activityRule } = orderInfo.promotionDiscountInfo;
      const discountNumber = this.discountNumberText(activityRule);
      if (activityRule.isFirstOrderDiscount === '1') {
        return activityRule.satisfyPrice === '0'
          ? t('firstOrder_no_threshold', { discountNumber })
          : t('firstOrder_threshold', {
              satisfyPrice: activityRule.satisfyPrice,
              discountNumber,
            });
      }
      if (activityRule.satisfyPrice === '0') {
        return t('no_threshold_coupon', { discountNumber });
      }
      return t('discountItemInfo', {
        price: activityRule.satisfyPrice,
        discountNumber,
      });
    } else {
      // 命中的促销码活动
      const hitPromoCodeActivity = orderDiscount.find(
        (item) => item?.activityRule?.promotionCode === promotionCode
      );
      const discountNumber = this.discountNumberText(
        hitPromoCodeActivity?.activityRule
      );
      return `${t('promoCodeUnderCondition', {
        price: hitPromoCodeActivity?.activityRule.satisfyPrice,
        discountNumber,
      })} ${hitPromoCodeActivity?.activityRule?.isFirstOrderDiscount === '1' ? `, ${t('only-newMember')}` : ''}`;
    }
  };

  // 清空已输入的促销码
  delPromoCodeInput = () => {
    const {
      promotion: { itemValidPromotion },
      setItemValidPromotion,
    } = this.props;
    this.props.setPromotionCode('');

    const updatedItemPromotion = itemValidPromotion?.map((each) => {
      return {
        ...each,
        isSelected: each?.promotion?.promotionCodes?.length
          ? undefined
          : each?.isSelected,
      };
    });
    setItemValidPromotion(updatedItemPromotion);
  };

  // 是否参与crm
  getHasCampaignInfo = () => {
    const {
      currentOrder: { itemList },
      crm: { selectedDiscount, selectedFreeItem },
    } = this.props;
    return isHasCRMCampaignFn({
      itemList,
      selectedFreeItem,
      selectedDiscount,
    });
  };

  // 促销码渲染
  renderPromotionCode = (orderInfo) => {
    const {
      t,
      promotion: {
        orderDiscount,
        promotionCode,
        promotionCenterList,
        isOpenCloudPromotion,
        itemValidPromotion,
      },
    } = this.props;

    // 是否有促销码活动 (本地 or 促销中台)
    const hasLocalPromocodeActivity =
      orderDiscount?.some(
        (item) => item?.activityRule?.usePromotionCode === '1'
      ) && !isOpenCloudPromotion;
    const hasPromoCenterCodeActivity =
      promotionCenterList?.some((item) => item?.promotionCodes?.length) &&
      isOpenCloudPromotion;
    const hasPromoCodeActivity =
      hasLocalPromocodeActivity || hasPromoCenterCodeActivity;

    // 促销码活动是否可以点击enter
    let validActivityIsPromoCode = false;
    // 本地促销活动：无命中促销活动、或命中促销码活动时，才可以点击
    if (hasLocalPromocodeActivity) {
      validActivityIsPromoCode =
        !orderInfo?.promotionDiscountInfo ||
        (orderInfo?.promotionDiscountInfo &&
          orderInfo?.promotionDiscountInfo?.activityRule?.usePromotionCode ===
            '1');
    } else if (hasPromoCenterCodeActivity) {
      // 促销中台: 只要有促销码活动都可以点，活动冲突时可以出选择弹窗
      validActivityIsPromoCode = true;
    }

    const PromoCenterHitActivity =
      isOpenCloudPromotion && itemValidPromotion?.find((e) => e.isSelected);
    // 活动是否有效 促销码
    let isRuleValid = false;
    if (
      PromoCenterHitActivity &&
      PromoCenterHitActivity.promotion?.promotionCodes?.includes(promotionCode)
    ) {
      isRuleValid = checkIsRuleValid(PromoCenterHitActivity?.validateInfo);
    }
    // 活动是否选中 促销码
    const isSelected =
      PromoCenterHitActivity?.isSelected &&
      PromoCenterHitActivity.promotion?.promotionCodes?.includes(promotionCode);

    if (!hasPromoCodeActivity) return null;
    return (
      <div className={styles.promoCodeArea}>
        <div className={styles.promoCodeWrap}>
          <div className={styles.promoCodeTitle}>{t('promotion')}</div>
          {!promotionCode ? (
            <div
              className={`${styles.promoCodeBtn} ${validActivityIsPromoCode ? '' : styles.promoCodeBtnDisabled}`}
              onClick={() => {
                if (validActivityIsPromoCode) {
                  this.setState({
                    promoCodeVisiable: true,
                  });
                } else {
                  Toast.info(t('currentOtherValidPromotion'), 2000);
                }
              }}
            >
              {t('enterPromoCode')}
            </div>
          ) : (
            <>
              {hasLocalPromocodeActivity && (
                <div className={styles.promoCodeOpration}>
                  <div className={styles.promoCodeText}>
                    {this.renderLocalPromotionInfo(orderInfo)}
                  </div>
                  <Fab
                    aria-label="Remove"
                    className={styles.btnEn}
                    onClick={this.delPromoCodeInput}
                  >
                    <DeleteIcon className={styles.muiDiyIcon} />
                  </Fab>
                  <div
                    className={styles.promoCodeBtn}
                    onClick={() => {
                      this.setState({
                        promoCodeVisiable: true,
                      });
                    }}
                  >
                    <span>{t('ExchangeCode')}</span>
                    <img src={CHANGE} alt="change code" />
                  </div>
                </div>
              )}
              {hasPromoCenterCodeActivity && (
                <div className={styles.promoCodeOpration}>
                  <div className={styles.promoCodeText}>
                    {isSelected
                      ? getPromotionCenterActivityRuleText({
                          t,
                          promotionName:
                            PromoCenterHitActivity?.promotion?.promotionName,
                          selfConfig: this.props.selfConfig,
                          promoCenterHitActivity: PromoCenterHitActivity,
                        })
                      : PromoCenterHitActivity
                        ? t('haveJoin', {
                            activeTxt: ` ${getPromotionCenterActivityRuleText({
                              t,
                              promotionName:
                                PromoCenterHitActivity?.promotion
                                  ?.promotionName,
                              selfConfig: this.props.selfConfig,
                              promoCenterHitActivity: PromoCenterHitActivity,
                            })}`,
                          })
                        : t('notHasValidPromotion')}
                  </div>
                  <Fab
                    aria-label="Remove"
                    className={styles.btnEn}
                    onClick={this.delPromoCodeInput}
                  >
                    <DeleteIcon className={styles.muiDiyIcon} />
                  </Fab>
                  {!isRuleValid && isSelected && (
                    <div
                      className={styles.promoCodeBtn}
                      onClick={() => {
                        this.handleContinueAddPromotionItem(
                          PromoCenterHitActivity
                        );
                      }}
                    >
                      <span>{t('goAddItem')}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // 去加菜\去凑单
  handleContinueAddPromotionItem = (hasNextLevelPromotion) => {
    if (this.addOnPromotionRef.current) {
      this.addOnPromotionRef.current.goAddOnPromotion(hasNextLevelPromotion);
    }
  };

  // 去凑单,当全部商品参与促销时，返回到 orderPage 页面
  handleCloseAddOnPromotion = () => {
    this.props.history.push('/orderPage');
  };

  getNextLevelPromotionDom = ({
    hasNextLevelPromotion,
    orderOriginPrice,
    nextLevel,
  }) => {
    const {
      validateInfo,
      discountRate,
      targetCount,
      selectQuantity,
      benefitAmount,
      promotion,
      discountAmount,
      extraInfo,
    } = hasNextLevelPromotion;

    const { activityRule, type } = promotion;
    const { t } = this.props;
    let addItemDom = null;
    let widthRate = null;
    let moreItemDom = null;
    let nextLevelText = null;
    const discountValue = discountRate
      ? `${discountRate}%`
      : `$${benefitAmount}`;

    // 满赠要单独处理...
    if (GIFT_PROMOTION_TYPE.includes(type)) {
      if (!extraInfo) return;
      const { nextBenefit } = extraInfo;
      const nextThresholdPrice = nextBenefit.condition.totalAmount;
      const orderedPrice = Big(nextThresholdPrice)
        .minus(targetCount)
        .toNumber();
      const sameRule = activityRule.find(
        (e) => e.satisfyPrice === nextThresholdPrice
      );
      nextLevelText = sameRule.text;
      widthRate = Big(orderedPrice).div(nextThresholdPrice).toNumber() * 100;
      moreItemDom = (
        <div className={styles.nextThresholdPrice}>
          ${orderedPrice.toFixed(2)} / ${nextThresholdPrice}
        </div>
      );
      const nextLevelSelectQuantity =
        extraInfo?.nextBenefit?.actions?.[0]?.params?.quantity;
      addItemDom = (
        <span>
          {t('buyMoreAmountEnjoyGiftItem', {
            targetCount: targetCount.toFixed(2),
            selectQuantity: nextLevelSelectQuantity,
          })}
        </span>
      );
      return {
        addItemDom,
        widthRate,
        moreItemDom,
        nextLevelText,
      };
    }

    const { key } = nextLevel;
    if (key === 'SHORT_OF_NEXT_QUANTITY_THRESHOLD') {
      // 满件数折扣
      const {
        result: {
          result: { orderItems },
        },
      } = validateInfo;

      const promotionItemNumber = orderItems?.reduce((pre, cur) => {
        return pre + cur.quantity;
      }, 0);
      const nextLevelItemNumber = promotionItemNumber + targetCount;
      const sameRule = activityRule.find(
        (e) => e.buyNumber === nextLevelItemNumber
      );
      if (!sameRule) return;
      nextLevelText = sameRule.text;
      widthRate =
        Big(promotionItemNumber).div(nextLevelItemNumber).toNumber() * 100;
      moreItemDom = (
        <div className={styles.nextThresholdPrice}>
          {promotionItemNumber} / {nextLevelItemNumber}
        </div>
      );
      addItemDom = (
        <span>
          {t('buyMoreAmountEnjoyDiscount', { targetCount, discountValue })}
        </span>
      );
    } else if (key === 'SHORT_OF_NEXT_AMOUNT_THRESHOLD') {
      // 满金额折扣
      const orderedPrice = Number(orderOriginPrice);
      const nextThresholdPrice = Big(Number(orderOriginPrice))
        .plus(Number(targetCount))
        .toNumber();
      const sameRule = activityRule.find(
        (e) => e.satisfyPrice === nextThresholdPrice
      );
      if (!sameRule) return;
      nextLevelText = sameRule.text;
      widthRate = Big(orderedPrice).div(nextThresholdPrice).toNumber() * 100;
      moreItemDom = (
        <div className={styles.nextThresholdPrice}>
          ${orderedPrice.toFixed(2)} / ${nextThresholdPrice}
        </div>
      );
      addItemDom = (
        <span>
          {t('buyMoreItemEnjoyDiscount', {
            targetCount: targetCount.toFixed(2),
            discountValue,
          })}
        </span>
      );
    }

    return {
      addItemDom,
      widthRate,
      moreItemDom,
      nextLevelText,
    };
  };

  renderPromotionCenterNextLevel = ({
    hasNextLevelPromotion,
    orderOriginPrice,
  }) => {
    if (!hasNextLevelPromotion) return null;
    const { validateInfo, promotion } = hasNextLevelPromotion;
    const { t, selfConfig } = this.props;

    const nextLevel = validateInfo.invalidReason.find((e) =>
      [
        'SHORT_OF_NEXT_AMOUNT_THRESHOLD',
        'SHORT_OF_NEXT_QUANTITY_THRESHOLD',
        'SHORT_OF_NEXT_DISCOUNT_ROUND ',
      ].includes(e.key)
    );
    // 有下一阶梯 或者 有nextBenefit的满赠促销
    if (nextLevel || GIFT_PROMOTION_TYPE.includes(promotion.type)) {
      const domSet = this.getNextLevelPromotionDom({
        hasNextLevelPromotion,
        orderOriginPrice,
        nextLevel,
      });
      if (!domSet) return null;
      const { addItemDom, widthRate, moreItemDom, nextLevelText } = domSet;
      return (
        <div className={styles.promotionCenterInfo}>
          <div>{addItemDom}</div>
          <div className={styles.progressBar}>
            <div className={styles.progressRow}>
              <div className={styles.progressWrapper}>
                <div
                  style={{ width: `${widthRate}%` }}
                  className={styles.progressInner}
                ></div>
              </div>
              <div>{moreItemDom}</div>
            </div>
            <div className={styles.nextLevelReward}>
              {getPromotionCenterTextFromTextObject({
                t,
                text: nextLevelText,
                promotionName: promotion?.promotionName,
                selfConfig,
              })}
            </div>
          </div>
          <div
            className={styles.goAddItems}
            onClick={() =>
              this.handleContinueAddPromotionItem(hasNextLevelPromotion)
            }
          >
            <span>{t('addItems')}</span>
            <RightOutlined />
          </div>
        </div>
      );
    }
  };

  // 促销中台标签
  renderPromotionTag = (item) => {
    const {
      t,
      promotion: { promotionCenterList },
    } = this.props;
    const {
      promotionRewardItem,
      manualSelectRewardDiscount,
      itemDiscountInfo,
    } = item;
    if (!promotionRewardItem) return null;
    // manualSelectRewardDiscount - 赠菜
    if (manualSelectRewardDiscount?.length) {
      return (
        <div className={styles.promotionTagList}>
          <div className={styles.promotionTag}>{t('gift')}</div>
        </div>
      );
    }

    // 当前菜品参与的促销活动
    const ItemJoinedPromotion = promotionCenterList?.find(
      (item) => item?.id === itemDiscountInfo?.[0]?.id
    );
    // M件N折
    if (ItemJoinedPromotion?.type === 'quantityItemDiscount') {
      const discountType = ItemJoinedPromotion?.activityRule?.[0]?.discountType;
      const discountNumber =
        ItemJoinedPromotion?.activityRule?.[0]?.discountNumber;
      const discountText =
        discountType &&
        `${discountType === 'minus' ? '$' : ''}${discountNumber}${
          discountType === 'percentage' ? '%' : ''
        }`;
      return (
        <div className={styles.promotionTagList}>
          <div
            className={styles.promotionTag}
          >{`${discountText} ${t('off')}`}</div>
        </div>
      );
    }
    // 特价优惠
    if (ItemJoinedPromotion?.type === 'orderItemFixedPrice') {
      return (
        <div className={styles.promotionTagList}>
          <div className={styles.promotionTag}>
            {t('orderItemFixedPrice_tag')}
          </div>
        </div>
      );
    }
  };

  render() {
    const {
      t,
      i18n: { language },
      store,
      selfConfig,
      requireCategory,
      crm: { isShowLoginBar, selectedFreeItem, selectedDiscount },
      currentOrder,
      promotion: { buyGifts, itemValidPromotion, promotionCenterList },
      setLocator,
    } = this.props;
    const {
      keyboardToggle,
      keyboardValue,
      selectedItem,
      maxNum,
      deleteLoading,
      lastReuqireItem,
      promoCodeVisiable,
      isHasSoldoutDish,
      dishMap,
      errorApiShow,
      errorApiMsg,
      isShowCardMinModal,
      currentAmount,
      isHasOrderCharge,
      orderPanelShow,
      comboPanelVisible,
      comboPanelIdx,
      descVisible,
      promotionFn,
      selectedPromotion,
      showCallBoard,
      isShowDesc,
      tableServiceType,
      itemPromotionVisible,
    } = this.state;
    const { isShowCheckFooter } = currentOrder;
    // 订单价格明细
    const orderInfo = getOrderInfoObj(store);
    // 克隆一份购物车内的菜品，防止（item.price = 0）影响合并菜品函数
    const orderItemList = cloneDeep([
      ...currentOrder.itemList,
      ...selectedFreeItem,
    ])?.map((item, i) => {
      if (item.itemPrices && item.itemPrices.length > 0) {
        item.price = 0;
      }

      const renderPrice = (item) => {
        const { rewardRule, promotionRewardItem, manualSelectRewardDiscount } =
          item;
        const originalPrice = (getItemPrice(item) || 0).toFixed(2);
        if (promotionRewardItem && manualSelectRewardDiscount?.length > 0)
          return null;
        if (item.discountID) {
          const exchangePurchaseActivityRule =
            item.exchangePurchaseRule?.activityRule;
          const discountText = item.isLocalExchangePurchaseItem
            ? `${
                exchangePurchaseActivityRule?.discountType === 'fixDiscount'
                  ? '$'
                  : ''
              }${exchangePurchaseActivityRule?.discountNumber || 0}${
                exchangePurchaseActivityRule?.discountType === 'rateDiscount'
                  ? '%'
                  : ''
              }`
            : `${item.discountRate}%`;
          const discountedPrice = item.isLocalExchangePurchaseItem
            ? getExchangePurchaseDiscountedUnitPrice(item)
            : Big(originalPrice).minus(item.discount).toFixed(2);
          return (
            <div className={styles.discountPrice}>
              <div className={styles.originPrice}> ${originalPrice}</div>
              <div className={styles.price}>${discountedPrice}</div>
              <div className={styles.tag}>{`${discountText} ${t('off')}`}</div>
            </div>
          );
        }
        if (
          rewardRule?.rewardType === 'voucher' &&
          rewardRule?.redeemRule?.strategy === 'byFreeItem'
        ) {
          return (
            <div className={styles.price}>
              <span>$0.00</span>
            </div>
          );
        }
        if (
          item.isFreeItem ||
          item.discountList?.[0]?.isReward ||
          item.isCRMFreeItem
        ) {
          return (
            <div className={styles.price}>
              <img className={styles.pointImg} src={POINT} alt="point" />
              <span>{`${item.itemPoints || item.redeemRule?.parameters?.point} ${t('pts')}`}</span>
            </div>
          );
        }
        if (
          item.isCRMIntegrationSpecialItem ||
          (item.isCRMIntegrationBundleDiscountItem &&
            item.hasOwnProperty('actualDiscount'))
        ) {
          const { actualDiscount } = item;
          const originalPrice = Number(
            Big(item.totalAmount ?? item.totalPrice ?? item.price)
              .div(item.quantity)
              .toFixed(2)
          );
          const specialPrice = Number(
            Big(originalPrice).minus(actualDiscount).toFixed(2)
          );
          return (
            <div className={styles.discountPrice}>
              <div className={styles.originPrice}>
                ${originalPrice.toFixed(2)}
              </div>
              <div className={styles.price}>${specialPrice.toFixed(2)}</div>
            </div>
          );
        }
        if (item.promotionRewardItem) {
          const { actualDiscount } = item;
          const originalPrice = Number(
            Big(item.totalPrice ?? item.price).toFixed(2)
          );
          const specialPrice = Number(
            Big(originalPrice).minus(Big(actualDiscount)).toFixed(2)
          );
          return (
            <div className={styles.discountPrice}>
              <div className={styles.originPrice}>
                ${originalPrice.toFixed(2)}
              </div>
              <div className={styles.promotionItemPrice}>
                ${specialPrice.toFixed(2)}
              </div>
            </div>
          );
        }
        // if (item.isCRMIntegrationDiscountItem) {
        //   const discountAmount = item.itemDiscountInfo?.[0]?.amount;
        //   const discountPrice = Number(
        //     Big(originalPrice).minus(discountAmount).toFixed(2)
        //   );
        //   return (
        //     <div className={styles.discountPrice}>
        //       <div className={styles.price}>${discountPrice.toFixed(2)}</div>
        //       <div className={styles.originPrice}>${originalPrice}</div>
        //     </div>
        //   );
        // }
        return <div className={styles.price}>${originalPrice}</div>;
      };

      const _maxNum = item.isFreeItem ? 1 : maxNum;

      const optText = this.orderDetailWriter(item);

      // 标记promotion赠菜
      const isPromotionRewardItem =
        item.promotionRewardItem && item.manualSelectRewardDiscount?.length > 0;
      const promotionRewardMoreThanOne =
        isPromotionRewardItem && item.quantity > 1;
      const onlyOnePromotionReward =
        isPromotionRewardItem && item.quantity === 1;

      // 是否展示counter
      let isShowCounter =
        !item.discountID &&
        !item.isFreeItem &&
        !item.isCRMFreeItem &&
        !item.isCRMIntegrationSpecialItem &&
        !(
          item.isCRMIntegrationBundleDiscountItem &&
          item.hasOwnProperty('actualDiscount')
        ) &&
        !isPromotionRewardItem;
      if (promotionRewardMoreThanOne) isShowCounter = true;

      // 菜品counter add
      const isAddItemBtnDisabled =
        item.quantity >= _maxNum || isPromotionRewardItem;

      return (
        <div
          key={`${item.sequence}-${item.id}-${i}`}
          className={classNames(styles.orderItemInfoBx)}
        >
          <div
            className={styles.orderBox}
            onClick={() => this.handleEdit(item)}
          >
            <div
              className={`${styles.info} ${item?.remark?.optionName.trim() ? styles.hasNoteInfo : ''}`}
            >
              <div className={styles.orderItemImage}>
                <ImgCard itemInfo={item} selfConfig={selfConfig} />
              </div>
              <div className={styles.textInfo}>
                <div className={styles.name}>
                  {getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
                    item.name}
                </div>
                {optText && (
                  <div className={styles.opt}>
                    <div className={styles.optText}>{optText}</div>
                  </div>
                )}
                {this.renderPromotionTag(item)}
                {renderPrice(item)}
              </div>
            </div>
            {item?.remark?.optionName.trim() && (
              <div className={styles.note}>{item.remark.optionName}</div>
            )}
          </div>

          {isShowCounter && (
            <div className={styles.calcBox}>
              <div className={styles.calcBoxIcons}>
                <Fab
                  aria-label="Remove"
                  className={styles.btnEn}
                  onClick={() => {
                    this.handleAddSubNum(item, true);
                  }}
                >
                  {item.quantity > 1 ? (
                    <RemoveIcon className={styles.muiDiyIcon} />
                  ) : (
                    <DeleteIcon className={styles.muiDiyIcon} />
                  )}
                </Fab>
                <div className={styles.qty}>{item.quantity}</div>
                <Fab
                  disabled={isAddItemBtnDisabled}
                  aria-label="Add"
                  className={
                    isAddItemBtnDisabled
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
          )}
          {(item.isLocalExchangePurchaseItem ||
            (item.discountID &&
              item.secondHalfInfo?.activityRule?.buyType === 'random') ||
            item.isFreeItem ||
            item.isCRMFreeItem ||
            onlyOnePromotionReward) && (
            <div className={styles.promotion}>
              {item.isLocalExchangePurchaseItem &&
                Number(item.quantity || 1) > 1 && (
                  <div className={styles.qty}>{item.quantity}</div>
                )}
              <Fab
                aria-label="Remove"
                className={styles.removeBtnBg}
                onClick={() => {
                  if (item.isFreeItem || item.isCRMFreeItem) {
                    this.setState({
                      deleteFreeItem: item,
                    });
                  }
                  this.handleAddSubNum(item, true);
                }}
              >
                <DeleteIcon className={styles.removeBtn} />
              </Fab>
            </div>
          )}
        </div>
      );
    });

    // 买赠 - 赠品列表, 目前仅能选一个促销规则, 先取[0]
    const giftsList = buyGifts?.[0]?.items?.map((item, index) => {
      const optText = this.orderDetailWriter(item);
      return (
        <div
          key={item.sequence || `${item.id}-${index}`}
          className={styles.orderItemInfoBx}
          onClick={() => this.editGiftItem(item)}
        >
          <div className={styles.orderBox}>
            <div className={styles.info}>
              <div className={styles.orderItemImage}>
                <ImgCard itemInfo={item} selfConfig={selfConfig} />
              </div>
              <div className={styles.textInfo}>
                <div className={styles.name}>
                  {getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
                    item.name}
                </div>
                {optText && (
                  <div className={styles.opt}>
                    <div className={styles.optText}>{optText}</div>
                  </div>
                )}
                <div className={styles.price}>$0.00</div>
              </div>
            </div>
          </div>
          <div className={styles.giftsNumber}>
            {Number(item.quantity || 1) > 1 && (
              <div className={styles.qty}>{item.quantity}</div>
            )}
            <Fab
              aria-label="Remove"
              className={styles.removeBtnBg}
              onClick={(e) => {
                e.stopPropagation();
                this.removeGiftItem(item);
              }}
            >
              <DeleteIcon className={styles.removeBtn} />
            </Fab>
          </div>
        </div>
      );
    });

    // textarea是否提示长度超过255
    let isExceedlimit = !!(String(keyboardValue).length >= 255);
    // 是否显示备注（id:2）
    const isShowRemark = selfConfig?.configMap?.id_2;

    const { isClick, count } = this.judgeClick();
    // const isSameWidth = judegEnv();
    const { shouldAnimate } = this.state; //动画控制

    // 实际折扣
    let discount = orderInfo?.orderDiscount || 0;
    if (selectedDiscount?.actualDiscount) {
      discount += selectedDiscount?.actualDiscount;
    }
    let freeItemPrice = 0;
    if (selectedFreeItem) {
      const freeItemDiscount = selectedFreeItem.reduce((pre, cur) => {
        return (
          pre +
            getItemPrice({
              ...cur,
              price: cur.itemPrices?.length ? 0 : cur.freeItemOriginPrice, // 有详情价为0 否则按照原价取
            }) || cur.totalPrice
        );
      }, 0);
      discount += freeItemDiscount;
      freeItemPrice = freeItemDiscount;
    }
    const freeItemInOrder = currentOrder?.itemList?.find(
      (item) => item.isFreeItem
    );
    if (freeItemInOrder) {
      // crm集成使用freeItemOriginPrice字段， 自研crm使用totalPrice
      if (freeItemInOrder.hasOwnProperty('freeItemOriginPrice')) {
        freeItemInOrder.price = freeItemInOrder.freeItemOriginPrice;
        const freeItemOrderTotalPrice = Big(
          getItemPrice({
            ...freeItemInOrder,
            price: freeItemInOrder.itemPrices?.length
              ? 0
              : freeItemInOrder.freeItemOriginPrice, // 有详情价为0 否则按照原价取
          })
        )
          .times(freeItemInOrder.quantity)
          .toNumber();
        discount += freeItemOrderTotalPrice;
        freeItemPrice = freeItemOrderTotalPrice;
      } else {
        discount += freeItemInOrder.totalPrice || 0;
        freeItemPrice = freeItemInOrder.totalPrice;
      }
    }

    // 特价商品, m件N折菜
    const bundleDiscountItems = currentOrder?.itemList.filter(
      (each) =>
        each.isCRMIntegrationBundleDiscountItem ||
        each.isCRMIntegrationSpecialItem
    );
    if (bundleDiscountItems?.length > 0) {
      const bundleItemsDiscount = bundleDiscountItems.reduce((pre, cur) => {
        return Number(
          Big(pre)
            .plus(cur.actualDiscount || 0)
            .toFixed(2)
        );
      }, 0);
      discount += bundleItemsDiscount || 0;
    }

    // 促销中台
    const promotionRewardItems = currentOrder?.itemList.filter(
      (e) => e.promotionRewardItem
    );
    if (promotionRewardItems?.length > 0) {
      const promotionItemsDiscount = promotionRewardItems.reduce((pre, cur) => {
        return Number(
          Big(pre)
            .plus(cur.actualDiscount || 0)
            .toFixed(2)
        );
      }, 0);
      discount += promotionItemsDiscount || 0;
    }

    const exchangePurchaseDiscount = currentOrder?.itemList
      .filter((item) => item.isLocalExchangePurchaseItem)
      .reduce(
        (total, item) =>
          Number(
            Big(total)
              .plus(item.discount || 0)
              .toFixed(2)
          ),
        0
      );
    const savedDiscount = Number(
      Big(discount)
        .plus(exchangePurchaseDiscount || 0)
        .toFixed(2)
    );
    const hasDiscount = savedDiscount > 0;
    // 实际价格
    let totalPrice = orderInfo.orderSubtotal.toFixed(2);
    if (hasDiscount) {
      totalPrice = Big(totalPrice)
        .plus(freeItemPrice)
        .minus(discount)
        .toFixed(2);
      totalPrice = Number(totalPrice) < 0 ? `0.00` : totalPrice;
    }

    // 促销中台信息
    const isValidPromotionHasNextLevel = itemValidPromotion?.find((e) => {
      const { isSelected, validateInfo, promotion, extraInfo } = e;
      // 满赠特殊处理 根据extraInfo.nextBenefit 处理
      if (GIFT_PROMOTION_TYPE.includes(promotion.type)) {
        return (
          isSelected && Object.keys(extraInfo?.nextBenefit || {})?.length > 0
        );
      }
      return (
        isSelected &&
        validateInfo.invalidReason?.find((r) =>
          [
            'SHORT_OF_NEXT_AMOUNT_THRESHOLD',
            'SHORT_OF_NEXT_QUANTITY_THRESHOLD',
            'SHORT_OF_NEXT_DISCOUNT_ROUND ',
          ].includes(r.key)
        )
      );
    });

    // 促销中台 - 百分比满减 最多省xx
    const saveUpto = itemValidPromotion?.find(
      (e) =>
        e.isSelected &&
        e.discountAmount >= e.promotion?.activityRule[0]?.maxAmount &&
        e.promotion?.activityRule[0]?.maxAmount
    );

    return (
      <React.Fragment>
        <div
          id="orderReviewId"
          className={`${styles.orderReview} ${isShowLoginBar ? '' : styles.noCrmBar}`}
          style={{
            visibility: this.props.isReorderFlag ? 'hidden' : 'visible',
            // top: isShowLoginBar ? 'auto' : '8.8rem',
          }}
          ref={(el) => (this.scrollDom = el)}
        >
          {/* 必选类的提示 */}
          {requireCategory.length ? (
            <div className={styles.tipBox}>
              <RequireCategoryTip />
            </div>
          ) : null}

          <div className={styles.orderItemListContainer}>
            {/* 订单列表 */}
            <div>{orderItemList}</div>

            {/* 买赠 - 赠品列表 */}
            {buyGifts?.[0]?.items?.length > 0 && (
              <div className={styles.giftListWrapper}>
                <div className={styles.titleRow}>
                  <div className={styles.titleText}>{t('giveAway')}</div>
                  <div className={styles.btn} onClick={this.handleEditGifts}>
                    {t('reselect')}
                  </div>
                </div>
                {giftsList}
              </div>
            )}
          </div>

          <div
            className={styles.area}
            style={{ display: isShowRemark ? 'block' : 'none' }}
          >
            <div className={styles.title}>{t('orderExtraDescription')}</div>
            <div className={styles.textareaBox}>
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
            </div>
            <div
              className={styles.maxNote}
              style={{ display: isExceedlimit ? 'block' : 'none' }}
            >
              {t('maxNoteTip')}
            </div>
          </div>

          {/* 促销码输入部分 */}
          {this.renderPromotionCode(orderInfo)}

          <BottomToast />
        </div>
        {/* 促销-订单折扣信息 */}
        {orderInfo.promotionDiscountInfo &&
          isShowCheckFooter &&
          Number(orderInfo?.orderDiscount) > 0 && (
            <div className={styles.orderDiscountInfo}>
              <span>
                {t('alreadyDiscount', {
                  price: orderInfo?.orderDiscount.toFixed(2),
                })}
              </span>
              <span className={styles.aimRule}>
                ({this.renderLocalPromotionInfo(orderInfo)})
              </span>
            </div>
          )}

        {/* 促销阶梯 */}
        {/*{this.renderPromotionCenterNextLevel({*/}
        {/*  hasNextLevelPromotion: isValidPromotionHasNextLevel,*/}
        {/*  orderOriginPrice: orderInfo.orderSubtotal.toFixed(2),*/}
        {/*})}*/}

        {/* 促销凑单 */}
        <AddOnPromotion
          ref={this.addOnPromotionRef}
          onClose={this.handleCloseAddOnPromotion}
          isGiftPromotionAutoOpenRewardModal
          promotionCenterList={promotionCenterList}
        />

        {isShowCheckFooter && (
          <div className={styles.footBtnBox}>
            <div className={styles.cartIcon}>
              <img
                src={cartBagIMG}
                className={`${styles.cart} ${shouldAnimate ? styles.cartAnimation : ''}`}
              />
              <i
                className={`${styles.count} ${shouldAnimate ? styles.countAnimation : ''}`}
              >
                {count}
              </i>
            </div>
            <div
              className={[
                styles.footContent,
                hasDiscount && styles.hasDiscount,
                isClick
                  ? `${styles.actived} linear-animate-btn`
                  : styles.noActived,
              ].join(' ')}
              onClick={() => {
                if (isClick) {
                  this.handleConfirm();
                }
              }}
            >
              <div className={styles.text}>{t('confirm-order')}</div>
              <div className={styles.total}>${totalPrice}</div>
              {hasDiscount && (
                <div className={styles.discountInfo}>
                  <img
                    className={styles.right_img}
                    src={RIGHT_SIGN}
                    alt="right sign"
                  />
                  <div className={styles.savedInfo}>
                    <div className={styles.saved}>
                      {saveUpto ? t('save_up_to') : t('saved')}
                    </div>
                    <div className={styles.discountNum}>
                      ${savedDiscount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Dialog
          visible={showCallBoard}
          html={
            <CallerBoard
              tableServiceType={tableServiceType}
              setLocator={setLocator}
              isShowDesc={isShowDesc}
              onClose={this.closeCallBoard}
            />
          }
        />

        {orderPanelShow && (
          <OrderDetailModal
            isMountOnBody={Boolean(promotionFn)}
            orderPanelShow={orderPanelShow}
            onCloseModal={() => {
              this.setState({
                orderPanelShow: false,
              });
            }}
            itemInfo={selectedItem}
            onRef={this.openOrderDetailModal}
            {...(selectedItem.isFreeItem
              ? {
                  isInFreeItem: true,
                  max: 1,
                }
              : {})}
            {...(selectedItem.promotionItem
              ? {
                  isPromotionItem: true,
                  isExchangePurchase: selectedItem.isExchangePurchaseSelection,
                  promotionFn,
                  max: 1,
                }
              : {})}
          />
        )}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={keyboardValue}
            changeInput={this.onChange}
            closeKeyboard={this.hideKeyboard}
          />
        ) : null}

        {/* 是否删除菜品弹框 */}
        <DeleteDishModal
          isShowModal={deleteLoading}
          lastReuqireItem={lastReuqireItem}
          handleContinue={this.handleContinue}
          handleCancel={this.handleCancel}
        />

        {/* 輸入促销码弹框 */}
        <PromoCodeInput
          isShowModal={promoCodeVisiable}
          handleContinue={this.handlePromoCodeContinue}
          handleCancel={this.handlePromoCodeCancel}
        />

        {/* 刷卡最低消费弹框 */}
        {isShowCardMinModal ? (
          <CardMinAmount
            isShowCardMinModal={isShowCardMinModal}
            currentAmount={currentAmount}
            handleContinueOrder={this.handleContinueOrder}
            handleCloseMin={this.handleCloseMin}
          />
        ) : null}

        {/* combo-items-详细 */}
        <ComboItemsDetailModal
          onRef={this.openItemsDetailModal}
          comboInfo={selectedItem}
          handleCloseDetail={this.handleCloseDetail}
          setCurSectionId={this.props.setCurSectionId}
          getOneUncompletedSection={this.props.getOneUncompletedSection}
          openComboDetail={(idx) =>
            this.setState({
              comboPanelVisible: true,
              comboPanelIdx: idx,
            })
          }
          isInFreeItem={selectedItem.isFreeItem}
          isPromotionItem={selectedItem.promotionItem}
          isExchangePurchase={selectedItem.isExchangePurchaseSelection}
          itemPoints={selectedItem.itemPoints}
        />

        {/* combo 菜品详情 */}
        <Dialog
          isMountOnBody={Boolean(promotionFn)}
          visible={comboPanelVisible}
          html={
            <ComboPanel
              comboPanelIdx={comboPanelIdx}
              editingSequence={selectedItem.sequence}
              onCloseModal={() => {
                this.setState({
                  comboPanelVisible: false,
                });
              }}
              {...(selectedItem.isFreeItem
                ? {
                    isInFreeItem: true,
                    max: 1,
                    itemPoints: selectedItem.itemPoints,
                  }
                : {})}
              {...(selectedItem.promotionItem
                ? {
                    isPromotionItem: true,
                    isExchangePurchase:
                      selectedItem.isExchangePurchaseSelection,
                    max: 1,
                    onEditPromotionItem: promotionFn,
                    ruleId: selectedItem.ruleId,
                    selectedPromotion,
                  }
                : {})}
            />
          }
        />

        {/* 售罄弹框 */}
        {isHasSoldoutDish ? (
          <SoldoutModal
            isHasSoldoutDish={isHasSoldoutDish}
            dishMap={dishMap}
            reorder={this.reorder}
            continueReorder={this.continueReorder}
          />
        ) : null}

        {isHasOrderCharge ? (
          <CardPayTipModal
            isHasOrderCharge={isHasOrderCharge}
            handleCancel={this.handleCancelOrderCharge}
            handleConfirm={this.handleConfirmOrderCharge}
          />
        ) : null}

        {/* 促销可选弹窗 */}
        {itemPromotionVisible && (
          <ItemPromotionModal
            visible={itemPromotionVisible}
            onConfirm={this.handleSelectPromotion}
            onSkip={this.handleSkipPromotion}
            onClose={this.handleClosePromotionModal}
            goOrder={() => {
              this.backBtnHandler();
              Toast.info(t('selectItemInMenuPage'), 2000);
            }}
          />
        )}

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}

        <Loading visible={this.state.loading} />

        {this.state.giftDeleteSelection && (
          <Dialog
            visible
            html={
              <div
                className={giftDeleteStyles.deleteContainer}
                onClick={() => this.setState({ giftDeleteSelection: null })}
              >
                <div
                  className={giftDeleteStyles.deleteBox}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={giftDeleteStyles.deleteList}>
                    {this.state.giftDeleteSelection.items.map((item, index) => (
                      <div
                        className={giftDeleteStyles.itemBox}
                        key={item.sequence || index}
                      >
                        <div className={giftDeleteStyles.itemName}>
                          {getDishItemLanguage(
                            item.fieldDisplayNameGroups,
                            language
                          ) || item.name}
                        </div>
                        <div className={giftDeleteStyles.itemLeft}>
                          <div className={giftDeleteStyles.opt}>
                            {getVariantDescription(item, language)}
                          </div>
                          <div className={giftDeleteStyles.price}>$0.00</div>
                        </div>
                        <div className={giftDeleteStyles.calcBox}>
                          <Fab
                            aria-label="Remove"
                            className={giftDeleteStyles.btnEn}
                            onClick={() =>
                              this.stageGiftVariantRemoval(item.sequence)
                            }
                          >
                            <RemoveIcon
                              className={giftDeleteStyles.muiDiyIcon}
                            />
                          </Fab>
                          <div className={giftDeleteStyles.qty}>1</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={giftDeleteStyles.deleteBottom}>
                    <div
                      className={`${giftDeleteStyles.addCart} linear-animate-btn`}
                      onClick={this.confirmGiftVariantRemoval}
                    >
                      <span>{t('confirm')}</span>
                      <div className={giftDeleteStyles.price}>
                        {this.state.giftDeleteSelection.items.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        )}

        <DescModal
          preVal={keyboardValue}
          visible={descVisible}
          title={t('orderExtraDescription')}
          onClose={() =>
            this.setState({
              descVisible: false,
            })
          }
          onSetVal={(v) => this.keyboardChange(v)}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    store: state,
    requireCategory: state.requireCategory,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    isReorderFlag: state.orderEdit.isReorderFlag,
    itemSizeList: state.itemSizeList,
    crm: state.crm,
    discount: state.discount,
    promotion: state.promotion,
    currentCategoryList: state.currentCategoryList,
    allMenu: state.cateDish.allMenu,
    menuGroup: state.menuGroup,
    userId: state.sysCookie.kioskConfigUserId,
    merchantProfile: state.merchantProfile,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    setSideNavIndex,
    setSideNavList,
    initEditOrderMode,
    resetCurrentOrderCombo,
    setEditOrderMode,
    setTogoOption,
    notes,
    editOrderItemAction,
    spliceOrderBySoldout,
    payByCard,
    payByCash,
    getCurrentCategory,
    setSelfConfig,
    setLocator,
    setTabelServiceType,
    setBuyGifts,
    setSatisfyRules,
    getCurrentItem,
    setTempCampaign,
    changeFreeItem,
    setPromotionCode,
    saveOrderResult,
    setItemValidPromotion,
    addCampaignItemsToOrder,
    changePromotionStatusAfterCheck,
  })(withTranslation()(OrderReview))
);
