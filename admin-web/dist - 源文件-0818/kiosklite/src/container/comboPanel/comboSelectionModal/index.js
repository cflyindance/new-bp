import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './comboSelectionModal.module.scss';
import Dialog from '../../../component/dialog';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import VtKeyboard from '../../../component/VtKeyboard';
import Toast from '../../../component/toast';
import Icon from '../../../component/icon';
import SizeOptionSelect from '../../orderPage/sizeOptionSelect';
import ItemOptionSelectWithSub from '../../orderPage/ItemOptionSelectWithSub';
import FixComboOption from '../../orderPage/fixComboOption';
// import MoreTip from '../../../component/moreTip';
import arrowLeft from '@/assets/images/arrow-left.png';
import {
  addItem2ComboSection,
  editDefaultDish,
  removeFootItemComboSection,
} from '@/actions';
import ImgCard from '../../../component/imgCard';
import { on, off, compare, solveScrollElem } from '@/utils';
import { removeEmoji } from '@/utils/sanitizeInput';
import {
  getDishItemLanguage,
  getOneUncompletedSection,
  getComboSectionInfo,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import { isOpenVtkeyboadrd } from '@/utils';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';

import Big from 'big.js';
import { getPromotionModalDisplayPrice } from '@/utils/localExchangePurchase';
const defaultMax = 99;

class ComboSelectionModal extends React.Component {
  constructor() {
    super();
    this.state = {
      maxNum: defaultMax,
      orderPanelShow: false,
      keyboardValue: '',
      sizeInfo: {},
      options: [],
      totalPrice: '0.00',
      keyboardToggle: false,
      chooseNum: 1,
      defaultItemSizeId: -1,
      isScroll: false,
      isShowMore: false,
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

  changeSize = (sizeInfo, config) => {
    const {
      t,
      itemInfo,
      sideNavList,
      currentOrderCombo,
    } = this.props;
    const {
      chooseNum,
    } = this.state;

    if (config?.isLimitReached) {
      Toast.info(t('choose-size-limit-reached'), 1000);
      return;
    }

    const sideNavId = itemInfo.sideNavId;
    // 套餐项
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (sectionInfo?.mergeDisplay && itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
      let maxNum = this.state.maxNum;
      // 获取可以添加最大数量
      let obj = currentOrderCombo.find((sct) => sct.id == sideNavId);
       // 获取之前添加的菜数量
       if (obj?.items) {
        let orderedItemQty = 0;
        let currentOrderedItemQty = 0;
        obj.items.forEach((i) => {
          orderedItemQty += i.quantity;
          if (i.id === itemInfo.id) {
            const iSizeInfo = i.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo;
            if (iSizeInfo?.sizeId === sizeInfo.sizeId) {
              currentOrderedItemQty += i.quantity;
            }
          }
        });
        const max = sectionInfo.maxNumOfSelectionAllowed;
        const addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit
        maxNum = Math.min(
          addLimit > 0 ? addLimit - currentOrderedItemQty : max,
          max - orderedItemQty
        );
      }
      this.setState(
        {
          sizeInfo,
          chooseNum: maxNum && (chooseNum > maxNum) ? maxNum : chooseNum
        },
        () => this.calPrice()
      );
    } else {
      this.setState(
        {
          sizeInfo,
        },
        () => this.calPrice()
      );
    }
  };

  viewOrderPanel = () => {
    const { itemInfo } = this.props;
    let options = [];
    const { defaultItemSizeId: preSelectItemSize } = itemInfo;
    if (itemInfo?.options?.length > 0) {
      options = options.concat(itemInfo.options);
    }

    // 自选套餐，里面的子菜也加上*自己*父类的options
    if (itemInfo?.categoryOptions?.length > 0) {
      options = options.concat(itemInfo.categoryOptions);
    }

    let defaultItemSizeId;
    // 如果有size选项，默认空值
    if (itemInfo.itemPrices?.length) {
      const isExist = itemInfo.itemPrices.find(
        (each) => each.sizeId === preSelectItemSize
      );
      let minObj = itemInfo.itemPrices[0];
      itemInfo.itemPrices.forEach((p) => {
        if (p.price < minObj.price) {
          minObj = p;
        }
      });
      defaultItemSizeId = isExist ? preSelectItemSize : null; //minObj.sizeId
    }

    this.setState(
      {
        options,
        defaultItemSizeId,
        orderPanelShow: true,
        chooseNum: 1,
        keyboardValue: '',
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
    solveScrollElem(false);
    this.setState({
      isScroll: false,
      isShowMore: false,
      keyboardToggle: false,
      orderPanelShow: false,
      chooseNum: 1,
      keyboardValue: '',
      sizeInfo: {},
      totalPrice: '0.00',
    });
    this.props.onCloseEffect?.();
  };

  calPrice = () => {
    const { state } = this.itemOptionChild;
    const { itemInfo } = this.props;
    const { chooseNum, sizeInfo } = this.state;
    const itemPrice = itemInfo?.itemPrices;
    let isItemPrice = itemPrice && itemPrice.length > 0;
    // 单价
    let unitPrice = Big(0);
    // 总价
    let totalPrice = '0.00';
    // options的价格
    let optionTotalPrice = Big(0);
    if (state?.selectedItemList?.length) {
      state.selectedItemList.map((item) => {
        optionTotalPrice = optionTotalPrice.plus(
          item.isFreeItem ? 0 : item.price
        );
      });
    }

    if (!isItemPrice) {
      unitPrice = optionTotalPrice.plus(itemInfo?.price);
    } else if (sizeInfo?.price) {
      unitPrice = optionTotalPrice.plus(sizeInfo?.price);
    }

    totalPrice = unitPrice.times(chooseNum).toFixed(2);

    // 自选套餐内部的菜，价格需要根据计算规则显示
    const { sideNavList, currentOrderCombo } = this.props;
    const sideNavId = itemInfo?.sideNavId;
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    const priceRule = sectionInfo?.priceRule;
    if (priceRule === 'FIXED_PRICE') {
      totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
    } else if (priceRule === 'FIXED_UNTIL_MAX') {
      // 获取之前添加的菜数量
      const orderedItemQty =
        currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ??
        0;
      let max = sectionInfo?.maxNumOfSelectionAllowed;
      if (orderedItemQty <= max) {
        let reduce = max - orderedItemQty;
        if (chooseNum <= reduce) {
          totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
        } else {
          totalPrice = unitPrice
            .times(chooseNum - reduce)
            .plus(optionTotalPrice.times(reduce))
            .toFixed(2);
        }
      }
    } else if (sectionInfo?.freeQuantity > 0) {
      // 获取之前添加的菜数量
      const orderedItemQty =
        currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ??
        0;
      let freeQuantity = sectionInfo?.freeQuantity;
      if (orderedItemQty <= freeQuantity) {
        let reduce = freeQuantity - orderedItemQty;
        if (chooseNum <= reduce) {
          totalPrice = optionTotalPrice.times(chooseNum).toFixed(2);
        } else {
          totalPrice = unitPrice
            .times(chooseNum - reduce)
            .plus(optionTotalPrice.times(reduce))
            .toFixed(2);
        }
      }
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
      sideNavList,
      itemInfo,
      currentOrderCombo,
      isEditPreSelect,
      t,
      selfConfig,
    } = this.props;
    const { state, showRuleToast } = this.itemOptionChild;
    const { chooseNum, keyboardValue, sizeInfo } = this.state;
    const sideNavId = itemInfo.sideNavId;
    const itemPrice = itemInfo?.itemPrices;
    let isItemPrice = itemPrice && itemPrice.length > 0;

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

    if (!itemInfo.remark) {
      itemInfo.remark = {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      };
      itemInfo.remark.optionName = keyboardValue;
    } else {
      itemInfo.remark.optionName = keyboardValue;
    }
    itemInfo.quantity = chooseNum;
    const tempItem = Object.assign({}, itemInfo);
    // 选项集合
    let selectedOptionList = [];
    // 存储自身的options选项，id是-2
    let id2List = [];
    // 存储父级options选项，id是-3
    let id3List = [];

    // 存储size选项，id是-1
    if (sizeInfo?.sizeId) {
      selectedOptionList.push({
        id: -1,
        sizeInfo,
      });
    }

    if (state?.selectedItemList?.length) {
      state.selectedItemList.forEach((item) => {
        // 判断是否是父级的options
        if (item.menuCategoryId) {
          id3List.push(item);
        } else {
          id2List.push(item);
        }
      });
    }

    if (id2List.length) {
      id2List.originalOptions = cloneDeep(id2List.options);
      id2List.sort(compare('id'));
      selectedOptionList.push({
        id: -2,
        options: id2List,
      });
    }
    if (id3List.length) {
      id3List.sort(compare('id'));
      selectedOptionList.push({
        id: -3,
        options: id3List,
      });
    }

    const tempComboItem = Object.assign({}, tempItem);
    tempComboItem.selectedOptionList = selectedOptionList;
    if (tempComboItem.itemPrices && tempComboItem.itemPrices.length > 0) {
      tempComboItem.price = 0;
    }
    tempComboItem.quantity = 1;

    // 获取价格规则
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (!sectionInfo) {
      return;
    }
    const { priceRule, maxNumOfSelectionAllowed, freeQuantity } = sectionInfo;
    // 获取之前添加的菜数量
    const orderedItemQty =
      currentOrderCombo.find((sct) => sct.id == sideNavId)?.items?.length ?? 0;
    // 单选模式
    const onlySelectOneMode =
      maxNumOfSelectionAllowed === 1 && priceRule !== 'FIXED_UNTIL_MAX';

    // 定义删除之前的项的函数
    const removePreviousItems = (sideNavId) => {
      const result = currentOrderCombo.find((c) => c.id == sideNavId);
      if (result?.items.length > 0) {
        const indicesToRemove = result.items
          .map((item, idx) => {
            return result.items.findIndex((i) => i.id == item.id) > -1
              ? idx
              : -1;
          })
          .filter((idx) => idx > -1);

        // 反向排序索引，以便从后往前删除，避免索引错位
        indicesToRemove.sort((a, b) => b - a);

        // 统一删除操作
        indicesToRemove.forEach((idx) => {
          this.props.removeFootItemComboSection({
            sectionId: sideNavId,
            idx,
            sideNavList,
          });
        });
      }
    };

    // 处理单选模式
    if (onlySelectOneMode) {
      removePreviousItems(sideNavId);
    }

    const addComboList = [];
    // 当前菜品有size选项，且必须选中一项
    if (itemInfo.itemPrices && itemInfo.itemPrices.length) {
      if (sizeInfo && sizeInfo.sizeId) {
        if (priceRule == 'FIXED_UNTIL_MAX') {
          let max = sectionInfo?.maxNumOfSelectionAllowed;
          // 剩余x个price需要为0
          let residue = max - orderedItemQty;
          for (let i = 0; i < chooseNum; i++) {
            // 克隆，防止将price置为0，被影响
            let cloneItem = cloneDeep(tempComboItem);
            if (i < residue) {
              // 不加price
              let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
              obj.sizeInfo.price = 0;
            }
            addComboList.push(cloneItem);
          }
        } else if (priceRule == 'FIXED_PRICE') {
          // FIXED规则，不计算size
          for (let i = 0; i < chooseNum; i++) {
            let cloneItem = cloneDeep(tempComboItem);
            let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
            obj.sizeInfo.price = 0;
            addComboList.push(cloneItem);
          }
        } else if (freeQuantity > 0) {
          // 剩余x个price需要为0
          let residue = freeQuantity - orderedItemQty;
          for (let i = 0; i < chooseNum; i++) {
            // 克隆，防止将price置为0，被影响
            let cloneItem = cloneDeep(tempComboItem);
            if (i < residue) {
              // 不加price
              let obj = cloneItem.selectedOptionList.find((c) => c.id == -1);
              obj.sizeInfo.price = 0;
            }
            addComboList.push(cloneItem);
          }
        } else {
          for (let i = 0; i < chooseNum; i++) {
            addComboList.push(cloneDeep(tempComboItem));
          }
        }
        // 添加自定义字段，用于combo中items排序

        addComboList.forEach(
          (addItem) =>
            (addItem.id_sizeId = addComboList[0].id + sizeInfo.sizeId)
        );
      }
    } else {
      // 无size ，itemPrices
      if (priceRule == 'FIXED_UNTIL_MAX') {
        let max = sectionInfo?.maxNumOfSelectionAllowed;
        // 剩余x个price需要为0
        let residue = max - orderedItemQty;
        for (let i = 0; i < chooseNum; i++) {
          let cloneItem = cloneDeep(tempComboItem);
          if (i < residue) {
            // 不加price
            cloneItem.price = 0;
          }
          addComboList.push(cloneItem);
        }
      } else if (priceRule == 'FIXED_PRICE') {
        for (let i = 0; i < chooseNum; i++) {
          let cloneItem = cloneDeep(tempComboItem);
          cloneItem.price = 0;
          addComboList.push(cloneItem);
        }
      } else if (freeQuantity > 0) {
        // 剩余x个price需要为0
        let residue = freeQuantity - orderedItemQty;
        for (let i = 0; i < chooseNum; i++) {
          let cloneItem = cloneDeep(tempComboItem);
          if (i < residue) {
            // 不加price
            cloneItem.price = 0;
          }
          addComboList.push(cloneItem);
        }
      } else {
        for (let i = 0; i < chooseNum; i++) {
          addComboList.push(cloneDeep(tempComboItem));
        }
      }
      // 添加自定义字段，用于combo中items排序
      addComboList.forEach(
        (addItem) => (addItem.id_sizeId = addComboList[0].id)
      );
    }

    if (isEditPreSelect && !onlySelectOneMode) {
      this.props.editDefaultDish(sideNavId, addComboList);
    } else {
      this.props.addItem2ComboSection(sideNavId, addComboList);
    }

    this.closePanel();
    return;
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

  keyboardChange = (event, isVKboard = false) => {
    let value = isVKboard ? event : removeEmoji(event.target.value);
    if (value.length > 255) {
      value = value.substr(0, 255);
    }
    this.setState({
      keyboardValue: value,
    });
    if (isVKboard) {
      this.inputRef.scrollIntoViewIfNeeded(true);
    }
  };

  changeChooseNum = (isAdd) => {
    const { itemInfo } = this.props;
    const sideNavId = itemInfo.sideNavId;
    const { chooseNum, sizeInfo } = this.state;
    let maxNum = this.state.maxNum;

    // 获取可以添加最大数量
    const { t, sideNavList } = this.props;
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (!sectionInfo) {
      return;
    }
    const orderedItems =
      this.props.currentOrderCombo.find((sct) => sct.id == sideNavId)?.items ??
      [];
    // 获取之前添加的菜数量
    const orderedItemQty = orderedItems.length;
    // 获取之前添加的当前菜的数量
    const currentOrderedItemQty = orderedItems.filter(
      (item) => {
        if (sectionInfo?.mergeDisplay) {
          if (itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
            const iSizeInfo = item.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo;
            if (iSizeInfo?.sizeId === sizeInfo.sizeId) {
              return true;
            }
          }
        } else {
          return item.id === itemInfo.id
        }
      }
    ).length;

    let min = sectionInfo?.minNumOfSelectionAllowed;
    let max = sectionInfo?.maxNumOfSelectionAllowed;
    let addLimit;
    if (sectionInfo) {
      if (sectionInfo.mergeDisplay && itemInfo?.itemPrices?.length > 0) {
        addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit
      } else {
        addLimit = sectionInfo.comboSectionSaleItems?.find(
          (item) => item.saleItemId === itemInfo.id
        )?.addLimit;
      }
    }

    // +1
    if (isAdd) {
      if (min == undefined) {
        // 至多选择max个
        // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
        if (sectionInfo?.priceRule == 'FIXED_UNTIL_MAX') {
          max = this.state.maxNum;
        }
        if (
          chooseNum <
          Math.min(
            addLimit > 0 ? addLimit - currentOrderedItemQty : max,
            max - orderedItemQty
          )
        ) {
          this.setState(
            {
              chooseNum: chooseNum + 1,
            },
            () => this.calPrice()
          );
        }
      } else if (max == undefined) {
        // 至少选则min个
        let n = chooseNum + 1;
        if (n >= maxNum) {
          Toast.info(t('max-up', { rplc: defaultMax }), 1000);
        }
        this.setState(
          {
            chooseNum: n,
          },
          () => this.calPrice()
        );
      } else if (min == max) {
        if (
          sectionInfo?.itemSelectionRule == 'RANGE' &&
          sectionInfo?.priceRule == 'FIXED_UNTIL_MAX'
        ) {
          max = this.state.maxNum;
        }
        if (
          chooseNum <
          Math.min(
            addLimit > 0 ? addLimit - currentOrderedItemQty : max,
            max - orderedItemQty
          )
        ) {
          this.setState(
            {
              chooseNum: chooseNum + 1,
            },
            () => this.calPrice()
          );
        }
      } else {
        // range: min < x < max
        // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
        if (sectionInfo?.priceRule == 'FIXED_UNTIL_MAX') {
          max = this.state.maxNum;
        }
        if (
          chooseNum <
          Math.min(
            addLimit > 0 ? addLimit - currentOrderedItemQty : max,
            max - orderedItemQty
          )
        ) {
          this.setState(
            {
              chooseNum: chooseNum + 1,
            },
            () => this.calPrice()
          );
        }
      }
    } else {
      // -1减
      this.setState(
        {
          chooseNum: chooseNum - 1,
        },
        () => this.calPrice()
      );
    }
  };

  showChangeChooseNumDisabledTip = () => {
    const { sizeInfo } = this.state;
    const { t, itemInfo, sideNavList } = this.props;
    const sideNavId = itemInfo.sideNavId;
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (sectionInfo?.mergeDisplay && itemInfo?.itemPrices?.length && !Object.keys(sizeInfo).length) {
      Toast.info(t('choose-size'), 1000);
      this.setState({
        showRequired: true,
      });
      return;
    }
  } 

  componentDidMount() {
    this.props.onRef(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.orderPanelShow != this.state.orderPanelShow) {
      if (this.state.orderPanelShow) {
        // 清空上一次，添加的options
        this.itemOptionChild?.clearSelectedItemList &&
          this.itemOptionChild.clearSelectedItemList();
        if (this.scrollDom) {
          off(this.scrollDom, 'scroll', this.handleScroll);
          this.setState({
            isShowMore: !!(
              this.scrollDom.scrollHeight > this.scrollDom.offsetHeight
            ),
          });
          on(this.scrollDom, 'scroll', this.handleScroll);
        }
      } else {
        // 选择完成后，关闭draw，判断当前步骤是否完成（equal，max，range），自动跳下一步
        const { itemInfo, sideNavList, currentOrderCombo } = this.props;
        const sideNavId = itemInfo.sideNavId;
        const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
        if (!sectionInfo) {
          return;
        }
        let sectionIdx = sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;

        let min = sectionInfo.minNumOfSelectionAllowed;
        let max = sectionInfo.maxNumOfSelectionAllowed;
        let obj = getOneUncompletedSection(sideNavList, currentOrderCombo);
        let isCompleted = obj[sideNavId]?.isCompleted;
        let isContinueChoose = obj[sideNavId]?.isContinueChoose;

        // 除-2的长度
        let len = sideNavList?.length ?? 0;
        let optIdx = sideNavList?.findIndex((p) => p.id == -2) ?? -1;
        if (optIdx > -1) {
          len--;
        }

        if (min == undefined) {
          // 至多选择max个
          if (isCompleted && !isContinueChoose) {
            // 当前不是最后一项
            if (sectionIdx < len - 1) {
              //this.props.setCurSectionId(sectionIdx + 1);
              //this.props.comboStepUpTop(sectionIdx + 1);
            }
          }
        } else if (max == undefined) {
          // 至少选则min个
          return false;
        } else if (min == max) {
          if (isCompleted && !isContinueChoose) {
            if (sectionIdx < len - 1) {
              //this.props.setCurSectionId(sectionIdx + 1);
              //this.props.comboStepUpTop(sectionIdx + 1);
            }
          }
        } else {
          // range: min < x < max
          if (isCompleted && !isContinueChoose) {
            if (sectionIdx < len - 1) {
              //this.props.setCurSectionId(sectionIdx + 1);
              //this.props.comboStepUpTop(sectionIdx + 1);
            }
          }
        }
      }
    }

    // 当备注长度达到上线，展示出完整提示
    let isExceedlimit = !!(String(this.state.keyboardValue).length >= 255);
    if (isExceedlimit && this.maxNoteRef) {
      this.maxNoteRef.scrollIntoViewIfNeeded(true);
    }

    if (
      this.state.keyboardToggle != prevState.keyboardToggle &&
      this.state.orderPanelShow
    ) {
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

  componentWillUnmount() {
    off(this.scrollDom, 'scroll', this.handleScroll);
  }

  render() {
    const {
      t,
      i18n: { language },
      itemInfo,
      sideNavList,
      currentOrderCombo,
      selfConfig,
      isInFreeItem,
      isPromotionItem,
      isExchangePurchase = false,
    } = this.props;
    const {
      orderPanelShow,
      keyboardToggle,
      keyboardValue,
      sizeInfo,
      totalPrice,
      chooseNum,
      options,
      defaultItemSizeId,
      showRequired,
    } = this.state;

    const sideNavId = itemInfo.sideNavId;
    const isItemPrice = itemInfo?.itemPrices?.length > 0;
    const isItemOption = options.length > 0;
    const isFixCombo = itemInfo?.comboType === 'FIXED_SELECTION';
    const itemName = itemInfo?.id
      ? getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
        itemInfo.name
      : '';
    // textarea是否提示长度超过255
    let isExceedlimit = !!(String(keyboardValue).length >= 255);
    // 套餐项
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);

    let maxNum = this.state.maxNum;
    // 自选套餐，判断当前菜是否可以重复选择
    const allowRepeatedItems =
      getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems;
    if (!allowRepeatedItems) {
      // 若不可重复，菜只能选择一份
      maxNum = 1;
    } else {
      // 获取可以添加最大数量
      let obj = currentOrderCombo.find((sct) => sct.id == sideNavId);
      // 获取之前添加的菜数量
      if (obj?.items) {
        let orderedItemQty = 0;
        let currentOrderedItemQty = 0;
        obj.items.forEach((i) => {
          orderedItemQty += i.quantity;
          if (sectionInfo?.mergeDisplay) {
            if (i.id === itemInfo.id && itemInfo.itemPrices?.length && Object.keys(sizeInfo).length) {
              const iSizeInfo = i.selectedOptionList?.find((item) => item.id === -1)?.sizeInfo;
              if (iSizeInfo?.sizeId === sizeInfo.sizeId) {
                currentOrderedItemQty += i.quantity;
              }
            }
          } else {
            if (i.id === itemInfo.id) {
              currentOrderedItemQty += i.quantity;
            }
          }
        });
        const min = sectionInfo?.minNumOfSelectionAllowed;
        const max = sectionInfo?.maxNumOfSelectionAllowed;
        let addLimit;
        if (sectionInfo) {
          if (sectionInfo.mergeDisplay && isItemPrice) {
            if (Object.keys(sizeInfo).length) {
              addLimit = sizeInfo.originalComboSectionSaleItem?.addLimit
            } else {
              addLimit = 1
            }
          } else {
            addLimit = sectionInfo.comboSectionSaleItems?.find(
              (item) => item.saleItemId === itemInfo.id
            )?.addLimit;
          }
        }

        if (min == undefined) {
          // 至多选择max个
          // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
          if (sectionInfo?.priceRule == 'FIXED_UNTIL_MAX') {
            maxNum = this.state.maxNum;
          } else {
            maxNum = Math.min(
              addLimit > 0 ? addLimit - currentOrderedItemQty : max,
              max - orderedItemQty
            );
          }
        } else if (max == undefined) {
          // 至少选则min个
          maxNum = this.state.maxNum;
        } else if (min == max) {
          if (
            sectionInfo?.itemSelectionRule == 'RANGE' &&
            sectionInfo?.priceRule == 'FIXED_UNTIL_MAX'
          ) {
            maxNum = this.state.maxNum;
          } else {
            maxNum = Math.min(
              addLimit > 0 ? addLimit - currentOrderedItemQty : max,
              max - orderedItemQty
            );
          }
        } else {
          // range
          // 当规则是FIXED_UNTIL_MAX，没有自身最大限制
          if (sectionInfo?.priceRule == 'FIXED_UNTIL_MAX') {
            maxNum = this.state.maxNum;
          } else {
            maxNum = Math.min(
              addLimit > 0 ? addLimit - currentOrderedItemQty : max,
              max - orderedItemQty
            );
          }
        }
      }
    }

    // 是否显示备注（id:3）
    const isShowRemark = selfConfig?.configMap?.id_3;
    // 套餐子菜是否展示备注
    const isSubDishRemark = selfConfig?.configList?.find(
      (config) => config.id === 30
    )?.value;
    // 当前子菜是否是单选模式
    const isSingleMaxChosen =
      sectionInfo?.maxNumOfSelectionAllowed === 1 &&
      sectionInfo?.priceRule !== 'FIXED_UNTIL_MAX';

    let isDisabled = true;

    const isSoldOut = Boolean(getItemStoppedStatus(itemInfo));

    // 没有选择规格
    if (!isSoldOut && (Object.keys(sizeInfo).length || !isItemPrice)) {
      isDisabled = false;
    }

    return (
      <Dialog
        visible={orderPanelShow}
        html={
          <div className={styles.drawBody} onClick={(e) => e.stopPropagation()}>
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
                      itemInfo={itemInfo}
                      sectionItemList={itemInfo.itemPrices || []}
                      defaultItemSizeId={defaultItemSizeId}
                      selectedItem={sizeInfo}
                      changeSize={this.changeSize}
                      isInFreeItem={isInFreeItem}
                      isPromotionItem={isPromotionItem && !isExchangePurchase}
                      isSingleMaxChosen={isSingleMaxChosen}
                      sideNavList={sideNavList}
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
                    isInFreeItem={isInFreeItem}
                    isPromotionItem={isPromotionItem && !isExchangePurchase}
                    isSingleMaxChosen={isSingleMaxChosen}
                  />
                </div>

                {isShowRemark && isSubDishRemark && (
                  <div className={styles.area}>
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
                        if (this.props.showDescModal) {
                          this.props.showDescModal(
                            t('dishExtraDescription'),
                            keyboardValue,
                            (value) => this.keyboardChange(value, true)
                          );
                        } else {
                          if (isOpenVtkeyboadrd()) {
                            this.showKeyboard();
                          }
                        }
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
                )}
              </div>

              {/* {!this.state.isScroll && this.state.isShowMore && <MoreTip />} */}
            </div>

            <div className={styles.foot}>
              <div className={styles.countBtn} onClick={() => this.showChangeChooseNumDisabledTip()}>
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
                    chooseNum < maxNum
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
                <span>{t('confirm')}</span>
                <div className={styles.price}>
                  $
                  {isInFreeItem
                    ? '0.00'
                    : getPromotionModalDisplayPrice({
                        isPromotionItem,
                        isExchangePurchase,
                        totalPrice,
                      })}
                </div>
              </div>
            </div>
            {keyboardToggle ? (
              <VtKeyboard
                keyboardValue={keyboardValue}
                changeInput={(v) => this.keyboardChange(v, true)}
                closeKeyboard={() => {
                  this.hideKeyboard();
                }}
              />
            ) : null}
          </div>
        }
        onClose={this.closePanel}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    sideNavList:
      ownProps.sideNavList || state.sideNav.sideNavList,
    selfConfig: state.selfConfig,
    currentOrderCombo: state.currentOrderCombo,
    currentItem: state.currentItem,
  };
}

export default connect(mapStateToProps, {
  addItem2ComboSection,
  editDefaultDish,
  removeFootItemComboSection,
})(withTranslation()(ComboSelectionModal));
