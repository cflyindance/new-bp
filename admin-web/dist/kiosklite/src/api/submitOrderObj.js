import { getCookie } from '@/utils';
import floatNumberRounding from '../utils/formatNumberRounding';
import { getItemPrice } from '@/utils/priceCalculator';
import OrderPricing from '../utils/orderPricing/orderPricing';
import SalesTaxCalculator from '../utils/orderPricing/salesTaxCalculator';
import DiscountChargeCalculator from '../utils/orderPricing/discountChargeCalculator';
import CanadaOntarioTaxCalculator from '../utils/orderPricing/CanadaOntarioTaxCalculator';
import WholeOrderCharge from '../utils/orderPricing/wholeOrderCharge';
import { checkIsRuleValid } from '@/utils/PromotionCenterIntegration/checkCloudPromotion';
import TogoCharge from '../utils/orderPricing/togoCharge';
import i18n from '../assets/i18n/i18n';
import checkCRMStatus from '../utils/checkCRMStatus';
import cloneDeep from 'lodash/cloneDeep';
import getPosVersion from '@/utils/getPosVersion';
import resources from '../assets/i18n/resources';
import Toast from '@/component/toast';
import { isNumber } from 'lodash';
import store from '@/reducers/store';
import { recordKioskDiscountPromotion } from '@/actions';
import { isHasCRMCampaignFn } from '@/utils/CRMIntegration/crmPromotionContrary';
import { ORDER_TYPE } from '@/constants/order';
import getCurrentPaymentType, {
  isGiftCardWithCreditCardOrder,
} from '@/utils/getCurrentPaymentType';
import safeBig from '@/utils/safeBig';
import {
  countActualPrice,
  reCountDiscountRate,
} from '@/utils/rewardDiscountCalculator';
import { getExchangePurchaseUnitDiscount } from '@/utils/localExchangePurchase';

import Big from 'big.js';
const { t } = i18n;
let itemList = [];

const getTakeoutTaxFree = (item, category, currentOrderType) => {
  const takeoutTaxFree =
    item?.takeoutTaxFree ?? category?.takeoutTaxFree ?? false;

  return (
    takeoutTaxFree &&
    (currentOrderType === 'TO_GO' || currentOrderType === 'PICK_UP')
  );
};

export function generateSubmitOrderObj(state) {
  if (
    !state.currentOrder.orderType &&
    !window.selectedOrderType &&
    !['#/', '#/orderType'].includes(window.location.hash)
  ) {
    Toast.info('No Order Type, Please refresh kiosk and try again ', 1500);
    return;
  }
  const currentOrderType =
    state.currentOrder.orderType || window.selectedOrderType;
  let obj = {};
  let order = {};

  // crm集成, 促销活动订单折扣信息
  let orderRewardDiscountList = [];

  itemList = cloneDeep(state.currentOrder.itemList); //选购的菜

  // 自研crm/crm集成 赠菜数据处理
  const needCommit = state.avocado.needCommit;
  if (state.avocado.outletInfo?.enabled === 1) {
    const extraInfo = {
      discountType: 'giftItemCoupon',
      enableBenefit: true,
      templateId: state.crm.tempCampaign?.[0]?.couponTemplate?.id,
    };
    let freeItem = null;
    // crm集成 要处理直接加入到currentOrder中和selectedFreeItem两种情况
    // crm集成被直接加入到currentOrder中的赠菜需要被过滤掉单独处理
    if (itemList?.length > 0) {
      const freeItemInOrder = itemList.find((item) => item.isFreeItem);
      if (freeItemInOrder) {
        freeItem = {
          ...cloneDeep(freeItemInOrder),
          // 重置部分数据
          id: freeItemInOrder.oId,
          categoryId: freeItemInOrder.oCategoryId,
        };
        delete freeItem.oId;
        itemList = itemList.filter((each) => each.id !== freeItemInOrder.id);
      }
    }
    if (state.crm.selectedFreeItem.length > 0) {
      freeItem = cloneDeep(state.crm.selectedFreeItem[0]);
    }
    if (freeItem) {
      // 解决因为给菜加了isFreeItem标记但是没有oId导致下单id读取失败问题
      if (freeItem.isFreeItem && !freeItem.oId) {
        delete freeItem.isFreeItem;
      }
      // 重置金额
      const { freeItemOriginPrice } = freeItem;
      freeItem.price = freeItemOriginPrice;
      // 这里要先重置price，否则菜品总价中不包含主菜
      let totalPrice = Big(
        getItemPrice({
          ...freeItem,
          price: freeItem.itemPrices?.length ? 0 : freeItem.originalPrice, // 有详情价为0 否则按照原价取
        })
      )
        .times(freeItem.quantity)
        .toNumber();
      // 如果 totalPrice > freeItemOriginPrice 基本可以理解为复杂菜
      const isComplexItem = totalPrice > freeItemOriginPrice;
      freeItem.totalPrice = totalPrice;
      freeItem.totalAmount = isComplexItem ? totalPrice : freeItemOriginPrice;
      // 增加 crm集成积分兑换
      freeItem.isCRMIntegrationFreeItem = true;
      const {
        crmIntegrationRule: { coupon },
        couponTemplate: { templateName },
      } = freeItem;
      const { ruleId, type } = coupon;
      const discountInfo = {
        name: templateName,
        id: ruleId,
        amount: isComplexItem ? totalPrice : freeItemOriginPrice,
        type,
        isReward: true,
        commited: needCommit,
        extraInfo,
      };
      // 赠菜增加折扣信息
      freeItem.discountList = [discountInfo];
      // 订单增加折扣信息
      orderRewardDiscountList = [discountInfo];
      // crm集成兑换菜 删除rewardRule,itemPoints 字段, 避免走原逻辑
      delete freeItem.rewardRule;
      delete freeItem.itemPoints;
      delete freeItem.isFreeItem;
      delete freeItem.oId;
      itemList.push(freeItem);
    }
  } else {
    // 自研crm这里只处理 加入到 selectedFreeItem 中的数据
    if (state.crm.selectedFreeItem.length > 0) {
      const freeItem = state.crm.selectedFreeItem[0];
      // 增加自研crm兑换免费菜标识
      freeItem.isCRMFreeItem = true;
      if (freeItem.isFreeItem && !freeItem.oId) {
        delete freeItem.isFreeItem;
      }
      itemList.push(freeItem);
    }
    if (itemList?.length > 0) {
      itemList = itemList.map((each) => {
        return each.isFreeItem ? { ...each, isCRMFreeItem: true } : each;
      });
    }
  }

  // 促销菜品买赠、 云促销订单满赠
  if (state?.promotion?.buyGifts?.length) {
    const giftItems = state.promotion.buyGifts[0]?.items.map((each) => {
      // 云促销-订单买赠
      if (each?.promotionInfo?.promotionType === 'WholeOrderGift') {
        const { promotionInfo, price } = each;
        return {
          ...each,
          promotionItem: true,
          promotionInfo: JSON.stringify(promotionInfo),
          price,
          isCloudPromotion: true,
          quantity: 1,
          //  云促销-订单买赠让POS那边不显示满减活动的具体信息
          // PIT:37427
          // discountID: -1,
          // discountRateType: 1,
          // discountName: promotionInfo.promotionName,
          // discount: price,
          // discountRate: 100,
        };
      }
      // 促销-菜品买赠
      let promotionInfo = {
        promotionName: each.name,
        promotionId: each.ruleId,
        promotionType: state?.promotion?.buyGiftRule[0]?.activityType,
      };
      return {
        ...each,
        isGiftItem: true,
        promotionInfo: JSON.stringify(promotionInfo),
        quantity: Number(each.quantity || 1),
      };
    });
    // 促销-订单买赠，无论是本地or云都需要给订单增加promotionInfo用于pos展示
    // if (giftItems[0]?.promotionInfo?.promotionType === 'WholeOrderGift') {
    order.promotionInfo = JSON.stringify(giftItems[0].promotionInfo);
    // }
    itemList.push(...giftItems);
  }
  const orderPriceDetail = getOrderInfoObj(state);
  const orderPriceDetailAfterDp = orderPriceDetail?.orderDetailAfterDp;
  const isDpEnabled = !!orderPriceDetailAfterDp;
  const dpMultiplier = isDpEnabled
    ? Number(
        Big(1).plus(Big(state.allSysConfig?.CREDIT_CHARGE_RATE || 0).div(100))
      )
    : 1;
  const toRoundedNumber = (val) => Number(floatNumberRounding(val ?? 0));
  const toDpAmount = (val) => {
    if (val === undefined || val === null || val === '') {
      return val;
    }
    return toRoundedNumber(Big(val).times(dpMultiplier).toNumber());
  };
  if (isDpEnabled) {
    Object.keys(orderPriceDetail.orderTaxDetail || {}).forEach((taxId) => {
      const taxInfo = orderPriceDetail.orderTaxDetail[taxId];
      const dpTaxInfo = orderPriceDetailAfterDp.orderTaxDetail?.[taxId];
      if (taxInfo) {
        taxInfo.taxAmountAfterDp = dpTaxInfo ? dpTaxInfo.taxAmount : 0;
      }
    });
  }
  const baseWholeOrderCharge = toRoundedNumber(orderPriceDetail?.chargeTotal);
  const wholeOrderChargeAfterDp = isDpEnabled
    ? toRoundedNumber(orderPriceDetailAfterDp?.chargeTotal)
    : null;
  order.customer = state.currentOrder.customer;
  // 兼容 kds
  order.customerName = state.currentOrder.customerName;
  const posVersionNum = Number(
    getPosVersion(localStorage.getItem('posVersion'))
  );
  if (posVersionNum >= 18030120000) {
    if (state.currentOrder.locator) {
      order.locatorNumber = ` Pager NO. ${state.currentOrder.locator}`;
    }
  } else {
    // 将locator 信息加入到name中
    if (
      state.currentOrder.locator &&
      !order.customer.firstName.includes('Pager NO.')
    ) {
      order.customer.firstName = `${order.customer.firstName} Pager NO. ${state.currentOrder.locator}`;
    }
  }
  order.totalPrice = orderPriceDetail.orderSubtotal;
  order.totalTax = orderPriceDetail.orderTaxTotal;
  order.totalTips = orderPriceDetail.orderTotalTips;
  if (isDpEnabled) {
    order.totalPriceAfterDp = orderPriceDetailAfterDp.orderSubtotal;
    order.totalTaxAfterDp = orderPriceDetailAfterDp.orderTaxTotal;
    order.totalTipsAfterDp = orderPriceDetailAfterDp.orderTotalTips;
  }
  // 整单加收
  order.chargeTotal = baseWholeOrderCharge;
  if (isDpEnabled) {
    order.chargeTotalAfterDp = wholeOrderChargeAfterDp;
  }
  // togo加收
  order.togoTotal = parseFloat(floatNumberRounding(orderPriceDetail.togoTotal));

  // 促销-订单折扣 全部菜品折扣，折扣后算税
  if (orderPriceDetail.orderDiscount) {
    order.discount = orderPriceDetail.orderDiscount;
    order.discountID = -1;
    order.discountRateType = 1;
    order.discountName = 'promotion discount';
    if (isDpEnabled) {
      order.discountAfterDp = orderPriceDetailAfterDp.orderDiscount;
    }
  }

  order.userPassword = '56854b3d95d5d154e1fbca66'; // for api test
  order.creatTime = +new Date();
  order.status = 'ORDERED';
  order.notes = state.currentOrder?.notes || '';
  order.pickupTime = state.currentOrder?.pickupTime || '';
  if (order.pickupTime && currentOrderType === 'PICK_UP') {
    order.notes += order.pickupTime;
  }

  let orderItems = [];
  // 4.7.2暂用 isSelectDiscount 来做是否选择crm集成折扣商品
  const isSelectDiscount = Object.keys(state.crm.selectedDiscount)?.length > 0;
  let isStillValid = false; //当前是否有选中的促销活动 且生效
  const isPromotionSelect = state.promotion.itemValidPromotion?.find(
    (e) => e.isSelected
  );
  if (isPromotionSelect) {
    isStillValid = checkIsRuleValid(isPromotionSelect.validateInfo);
  }
  const itemSizeListForSubmit = Array.isArray(state.itemSizeList)
    ? state.itemSizeList
    : [];
  const getItemSizeListNameBySizeId = (sizeId) => {
    const matched = itemSizeListForSubmit.find((s) => s.id == sizeId);
    return matched?.name ?? '';
  };
  itemList.forEach((item, i) => {
    // crm 赠菜菜品
    const isCrmRewardItem = item.isCRMFreeItem === true;
    // crm集成 赠菜菜品
    const isCRMIntegrationFreeItem = item.isCRMIntegrationFreeItem === true;
    // 是否是ad折扣菜品
    const isDiscountItem = item.rewardRule?.voucherRules;
    // 是否是crm集成 m件n折菜品
    const isBundleRewardItem =
      item.isCRMIntegrationBundleDiscountItem &&
      item.hasOwnProperty('actualDiscount');
    // 是否是crm集成 特价商品
    const isSpecialItem = item.isCRMIntegrationSpecialItem;
    // 是否是crm集成 折扣商品
    const isCRMIntegrationDiscountItem =
      item.isCRMIntegrationDiscountItem && isSelectDiscount;
    // 是否是促销中台奖励商品
    const isPromotionCenterRewardItem =
      item.promotionRewardItem && isStillValid;
    const isPromotionRewardItem = item.isGiftItem;
    const isFreeItem = isCrmRewardItem || isPromotionRewardItem;
    let tempItem = {};
    if (isCrmRewardItem) {
      tempItem.isCrmRewardItem = isCrmRewardItem;
    }
    // 促销 手动选赠菜信息
    tempItem.manualSelectRewardDiscount = item.manualSelectRewardDiscount;
    // 计算price,当前菜品为有规格菜时，取规格价，否则originalSalePrice始终为0，影响报表计价
    let price = 0;
    if (item.itemPrices?.length) {
      // 取选中的规格价
      const sizePrice = item?.sectionDetail?.find((sct) => sct.id === -1)
        ?.sizeInfo?.price;
      if (!sizePrice) {
        // 找不到就取默认或最小的规格价
        let minObj = item.itemPrices[0];
        if (
          Object.hasOwnProperty.call(item, 'defaultItemSizeId') &&
          item.defaultItemSizeId !== null &&
          item.defaultItemSizeId !== undefined
        ) {
          const defaultItem = item.itemPrices.find(
            (priceItem) => priceItem.sizeId === item.defaultItemSizeId
          );
          if (defaultItem) {
            minObj = defaultItem; // 如果找到了，返回该对象
          } else {
            // 没找到对应的默认值的话，还是显示最小的价格
            item.itemPrices.forEach((p) => {
              if (p.price < minObj.price) {
                minObj = p;
              }
            });
          }
        } else {
          item.itemPrices.forEach((p) => {
            if (p.price < minObj.price) {
              minObj = p;
            }
          });
        }
        price = minObj.price;
      } else {
        price = sizePrice;
      }
    } else {
      price = item.price;
    }

    if (isFreeItem) price = 0;
    if (isDiscountItem) price = item.price;
    tempItem.price = price;
    let totalAmount = Big(getItemPrice(item)).times(item.quantity).toNumber();
    if (isFreeItem) totalAmount = 0;
    if (isDiscountItem) totalAmount = price;
    if (isCRMIntegrationFreeItem) {
      // totalPrice > price可以认定为是复杂菜，重置totalAmount字段
      const { totalPrice, price } = item;
      const isComplexItem = totalPrice > price;
      totalAmount = isComplexItem ? totalPrice : price;
      tempItem.isCRMIntegrationFreeItem = isCRMIntegrationFreeItem;
    }
    // CRM集成赠菜 增加折扣字段
    if (isCRMIntegrationFreeItem) {
      tempItem.discountList = JSON.stringify(item.discountList);
    }
    if (
      isBundleRewardItem ||
      isSpecialItem ||
      isCRMIntegrationDiscountItem ||
      isPromotionCenterRewardItem
    ) {
      const { itemDiscountInfo, orderDiscountInfo } = item;
      tempItem.discountList = JSON.stringify(itemDiscountInfo);
      // 这里可能有坑 目前只允许选一个 活动时没有问题
      orderRewardDiscountList = orderDiscountInfo;
    }
    tempItem.categoryId = item.categoryId;
    tempItem.totalAmount = totalAmount;
    tempItem.rewardItem = isCrmRewardItem || !!isDiscountItem;
    tempItem.saleItemId = item.isFreeItem ? item.oId : item.id;
    tempItem.displayName = item.name;
    tempItem.quantity = item.quantity;
    // 记录uniqueItemTempId, 用于crm活动以及促销中台活动
    tempItem.uniqueItemTempId = item.uniqueItemTempId;
    tempItem.originalSalePrice = isFreeItem ? 0 : tempItem.price;
    // 云Promotion 需要的字段
    if (item.promotionItem) {
      tempItem.promotionItem = item.promotionItem;
      tempItem.promotionInfo = item.promotionInfo;
      tempItem.itemId = item.id;
      tempItem.itemPrice = item.price;
    }
    if (item.itemType == 'COMBO_SALE_ITEM') {
      tempItem.comboOrderDetails = {};
      tempItem.comboOrderDetails.comboSections = [];
      tempItem.comboOrderItemId = isFreeItem ? item.oId : item.id;
      tempItem.comboDisplayName = item.name;
    }
    let options = [];
    if (item.sectionDetail) {
      item.sectionDetail.forEach((sct) => {
        if (sct.id == -2 || sct.id == -3) {
          sct.options.forEach((opt) => {
            let tempOption = {};
            tempOption.optionType = 'ITEM';
            tempOption.quantity = 1;
            tempOption.price = opt.isFreeItem || isFreeItem ? 0 : undefined;
            if (isDpEnabled) {
              const optBase = opt.isFreeItem || isFreeItem ? 0 : opt.price;
              tempOption.priceAfterDp = isCRMIntegrationFreeItem
                ? toRoundedNumber(optBase)
                : toDpAmount(optBase);
            }

            if (opt.itemOption) {
              tempOption.subOptionId = opt.id;
              tempOption.subOptionName = opt.name;

              let itemOption = options.find(
                (option) => option.optionId === opt.itemOption.id
              );
              if (itemOption) {
                itemOption.subOptions.push(tempOption);
              } else {
                let itemOption = {
                  optionId: opt.itemOption.id,
                  optionName: opt.itemOption.name,
                  optionType: 'ITEM',
                  quantity: 1,
                  subOptions: [tempOption],
                };
                options.push(itemOption);
              }
            } else {
              tempOption.optionId = opt.id;
              tempOption.optionName = opt.name;
              options.push(tempOption);
            }
          });
        }
        if (sct.id == -1) {
          tempItem.type = sct.sizeInfo.type;
          tempItem.size = getItemSizeListNameBySizeId(sct.sizeInfo?.sizeId);
          tempItem.sizeId = sct.sizeInfo.id;
          tempItem.crmIntegrationSizeId = sct.sizeInfo.sizeId;
          let sizePrice = sct.sizeInfo.price;
          if (isFreeItem) sizePrice = 0;
          if (isDiscountItem) sizePrice = price;
          tempItem.price = sizePrice;
        }
        if (sct.id > 0) {
          const comboSections = tempItem.comboOrderDetails.comboSections;
          const sctName = getItemFromCategoryList(
            item.id,
            state.currentCategoryList
          ).comboSections.filter((combo) => combo.id == sct.id)[0].name;
          const tempSection = {
            id: sct.id,
            name: sctName,
          };
          let orderItems = [];
          sct.items.forEach((item) => {
            let subItem = {
              saleItemId: item.id,
              displayName: item.name,
              quantity: tempItem.quantity || item.quantity,
              price: isFreeItem ? 0 : item.price,
              originalSalePrice: isFreeItem ? 0 : item.price,
              printerIds: item.printerIds,
              // status: "ORDERED",
              categoryId: tempSection.id,
              categoryName: tempSection.sctName,
            };
            let subItemOptions = [];
            if (item.selectedOptionList?.length > 0) {
              item.selectedOptionList.forEach((subSct) => {
                if (subSct.id == -1) {
                  subItem.price = isFreeItem
                    ? 0
                    : (subSct.sizeInfo?.price ?? 0);
                  subItem.size = getItemSizeListNameBySizeId(
                    subSct.sizeInfo?.sizeId
                  );
                  subItem.sizeId = subSct.sizeInfo?.sizeId;
                  if (subSct.sizeInfo?.originalSaleItem) {
                    const originalSaleItem = subSct.sizeInfo.originalSaleItem;
                    subItem.saleItemId = originalSaleItem.id;
                    subItem.displayName = originalSaleItem.name;
                    subItem.categoryId = originalSaleItem.categoryId;
                    subItem.categoryName = originalSaleItem.categoryName;
                  }
                }
                if (subSct.id == -2 || subSct.id == -3) {
                  subSct.options.forEach((opt) => {
                    let tempOption = {};
                    tempOption.optionType = 'ITEM';
                    tempOption.quantity = 1;
                    tempOption.price =
                      opt.isFreeItem || isFreeItem ? 0 : opt.price;
                    if (isDpEnabled) {
                      tempOption.priceAfterDp = isCRMIntegrationFreeItem
                        ? toRoundedNumber(tempOption.price)
                        : toDpAmount(tempOption.price);
                    }

                    if (opt.itemOption) {
                      tempOption.subOptionId = opt.id;
                      tempOption.subOptionName = opt.name;

                      let itemOption = subItemOptions.find(
                        (option) => option.optionId === opt.itemOption.id
                      );
                      if (itemOption) {
                        itemOption.subOptions.push(tempOption);
                      } else {
                        let itemOption = {
                          optionId: opt.itemOption.id,
                          optionName: opt.itemOption.name,
                          optionType: 'ITEM',
                          quantity: 1,
                          subOptions: [tempOption],
                        };
                        subItemOptions.push(itemOption);
                      }
                    } else {
                      tempOption.optionId = opt.id;
                      tempOption.optionName = opt.name;
                      subItemOptions.push(tempOption);
                    }
                  });
                }
              });
            }
            // 自选套餐中，子菜如果有备注
            if (item.remark.optionName) {
              subItemOptions.push({ ...item.remark });
            }
            subItem.options = subItemOptions;
            orderItems.push(subItem);
          });
          tempSection.orderItems = orderItems;
          comboSections.push(tempSection);
        }
      });
    }
    tempItem.options = options;
    if (item.remark.optionName) {
      tempItem.options = [...tempItem.options, item.remark];
    }

    tempItem.printerIds = item.printerIds;
    tempItem.taxIds = item.taxIds;
    tempItem.status = 'ORDERED';
    const cateForTakeoutTax = state.currentCategoryList?.find(
      (c) => c.id == item.categoryId
    );
    const takeoutTaxFree = getTakeoutTaxFree(
      item,
      cateForTakeoutTax,
      currentOrderType
    );
    tempItem.taxExempt = takeoutTaxFree;
    tempItem.takeoutTaxFree = takeoutTaxFree;
    if (item.discountID) {
      tempItem.discountID = item.discountID;
      tempItem.discountName = `${item.discountName}` + `\n`; // 这个\n 是pos要求，作为标识符
      tempItem.discountRate = item.discountRate;
      tempItem.discountRateType = item.discountRateType;
      tempItem.discount = item.isLocalExchangePurchaseItem
        ? getExchangePurchaseUnitDiscount(item)
        : item.discount;
      // 没这个字段，后台会根据实际去计算这个菜的totalAmount
      delete tempItem.totalAmount;
      if (isDpEnabled) {
        if (!isCRMIntegrationFreeItem) {
          tempItem.discount = toDpAmount(tempItem.discount ?? 0);
        }
        tempItem.discountAfterDp = tempItem.discount;
      }
      // 有不参与折扣的子菜时，需要使用自定义discount
      if (item.isHasNoDiscountSubDish) {
        tempItem.discountID = -1;
        tempItem.discountRateType = 1;
      }
    }
    if (isDpEnabled) {
      // 开了DP需要totalAmount字段，即使是活动菜品
      if (isCRMIntegrationFreeItem) {
        tempItem.priceAfterDp = toRoundedNumber(tempItem.price ?? 0);
        tempItem.totalAmount =
          toRoundedNumber(totalAmount ?? 0) - (tempItem.discount ?? 0);
      } else {
        tempItem.priceAfterDp = toDpAmount(tempItem.price ?? 0);
        tempItem.totalAmount =
          toDpAmount(totalAmount ?? 0) - (tempItem.discount ?? 0);
      }
    }
    tempItem.type = tempItem.type || ORDER_TYPE[currentOrderType];
    orderItems.push(tempItem);
  });
  order.orderItems = orderItems;
  order.orderTax = state.taxList.map((tax) => {
    const taxAmount = orderPriceDetail.orderTaxDetail[tax.id]
      ? orderPriceDetail.orderTaxDetail[tax.id].taxAmount
      : 0;
    const taxAmountAfterDp = isDpEnabled
      ? orderPriceDetailAfterDp.orderTaxDetail[tax.id]
        ? orderPriceDetailAfterDp.orderTaxDetail[tax.id].taxAmount
        : 0
      : undefined;
    return {
      taxId: tax.id,
      taxAmount,
      ...(isDpEnabled ? { taxAmountAfterDp } : {}),
    };
  });
  order.productLine = 'KIOSK';
  order.printReceipt = true;
  order.printReceiptMerchantCopy = true;
  order.printReceiptNumberOfCopies = true;
  order.fetchOrder = true;
  order.fetchPayments = true;
  order.updateOrderDetials = true;
  order.userAuth = {
    sessionKey: getCookie('sessionKey'),
  };
  const guests = state.currentOrder?.numOfGuests;
  order.numOfGuests = guests != null && Number(guests) > 0 ? Number(guests) : 1;

  let allCharge = 0;
  let allChargeName = [];
  let allOrderCharge = [];

  if (state.currentOrder.paymentType == 'CREDIT_CARD') {
    const { selfConfig } = state;
    selfConfig.charge.map((item) => {
      if (
        item.id === 1 &&
        item.select?.id &&
        state.allSysConfig?.CREDIT_CHARGE_ENABLE !== 'true' &&
        state.allSysConfig?.CREDIT_CHARGE_ENABLE !== true
      ) {
        allCharge = Big(allCharge)
          .plus(parseFloat(floatNumberRounding(orderPriceDetail.chargeTotal)))
          .toNumber();
        allChargeName.push(item.select.name);
        allOrderCharge.push({
          charge: parseFloat(floatNumberRounding(allCharge)),
          chargeName: item.select.name,
          ...(isDpEnabled ? { chargeAfterDp: wholeOrderChargeAfterDp } : {}),
        });
      }
    });
  }

  if (currentOrderType === 'TO_GO' || currentOrderType === 'PICK_UP') {
    order.taxExempt =
      state.systemConfig['IS_EXEMPT_TAX_ON_TAKEOUT_ORDER'].booleanValue;
    let togoNotesList = [];
    let notesMultiLanguage = {}; //多语言时候，把所有的语言内容都放进去,如{"en": "Need utensil, Need bag","zh-cn": "需要餐具, 需要打包单","zh-Hant": "需要餐具, 需要打包单"}

    Object.keys(resources).forEach((lanItem) => {
      if (order.notes) {
        notesMultiLanguage[lanItem] = order.notes;
      } else {
        notesMultiLanguage[lanItem] = '';
      }
    });
    if (currentOrderType === 'TO_GO') {
      order.type = 'TOGO';
    } else if (currentOrderType === 'PICK_UP') {
      order.type = 'PICKUP';
    }
    allCharge = Big(allCharge)
      .plus(parseFloat(floatNumberRounding(orderPriceDetail.togoTotal)))
      .toNumber();

    // 配置了打包带，餐具等加收项
    if (state.selfConfig?.charge?.length) {
      let r2 = state.selfConfig.charge.find((c) => c.id == 2);
      let r3 = state.selfConfig.charge.find((c) => c.id == 3);
      let r4 = state.selfConfig.charge.find((c) => c.id == 4);
      if (r2?.select?.id) {
        let res2 = state.togoList.find((item) => item.id == 2);
        if (res2.select?.id) {
          togoNotesList.push(t('need-' + res2.name));
          Object.keys(notesMultiLanguage).forEach((lanItem) => {
            if (notesMultiLanguage[lanItem].length > 0)
              notesMultiLanguage[lanItem] =
                notesMultiLanguage[lanItem] +
                ', ' +
                resources[lanItem].translation['need-' + res2.name];
            else
              notesMultiLanguage[lanItem] =
                resources[lanItem].translation['need-' + res2.name];
          });
          allChargeName.push(res2.name);
          allOrderCharge.push({
            charge: res2.select.rate,
            chargeName: res2.name,
          });
        } else {
          togoNotesList.push(t('no-need-' + res2.name));
          Object.keys(notesMultiLanguage).forEach((lanItem) => {
            if (notesMultiLanguage[lanItem].length > 0) {
              notesMultiLanguage[lanItem] =
                notesMultiLanguage[lanItem] +
                ', ' +
                resources[lanItem].translation['no-need-' + res2.name];
            } else
              notesMultiLanguage[lanItem] =
                resources[lanItem].translation['no-need-' + res2.name];
          });
        }
      }
      if (r3?.select?.id) {
        let res3 = state.togoList.find((item) => item.id == 3);
        if (res3.select?.id) {
          togoNotesList.push(t('need-' + res3.name));

          Object.keys(notesMultiLanguage).forEach((lanItem) => {
            if (notesMultiLanguage[lanItem].length > 0)
              notesMultiLanguage[lanItem] =
                notesMultiLanguage[lanItem] +
                ', ' +
                resources[lanItem].translation['need-' + res3.name];
            else
              notesMultiLanguage[lanItem] =
                resources[lanItem].translation['need-' + res3.name];
          });
          allChargeName.push(res3.name);
          allOrderCharge.push({
            charge: res3.select.rate,
            chargeName: res3.name,
          });
        } else {
          togoNotesList.push(t('no-need-' + res3.name));
          Object.keys(notesMultiLanguage).forEach((lanItem) => {
            if (notesMultiLanguage[lanItem].length > 0)
              notesMultiLanguage[lanItem] =
                notesMultiLanguage[lanItem] +
                ', ' +
                resources[lanItem].translation['no-need-' + res3.name];
            else
              notesMultiLanguage[lanItem] =
                resources[lanItem].translation['no-need-' + res3.name];
          });
        }
      }
      if (r4?.select?.id) {
        let res4 = state.togoList.find((item) => item.id == 4);
        // 默认需要打包盒
        togoNotesList.push(t('need-' + res4.name.replace(' ', '-')));

        Object.keys(notesMultiLanguage).forEach((lanItem) => {
          if (notesMultiLanguage[lanItem].length > 0)
            notesMultiLanguage[lanItem] =
              notesMultiLanguage[lanItem] +
              ', ' +
              resources[lanItem].translation[
                'need-' + res4.name.replace(' ', '-')
              ];
          else
            notesMultiLanguage[lanItem] =
              resources[lanItem].translation[
                'need-' + res4.name.replace(' ', '-')
              ];
        });
        allChargeName.push(res4.name.replace(' ', '-'));
        allOrderCharge.push({
          charge: res4.select?.rate * getItemCount(itemList),
          chargeName: res4.name.replace(' ', '-'),
        });
      }
    }
    if (order.notes) {
      order.notes = [order.notes, ...togoNotesList].join(', ');
    } else {
      order.notes = togoNotesList.join(', ');
    }
    order.notesMultiLanguage = notesMultiLanguage;
  } else if (currentOrderType === 'DINE_IN') {
    if (state.currentOrder.tabelServiceType == 'KIOSK_PICKUP') {
      order.type = 'KIOSK_PICKUP';
    } else {
      order.type = 'DINE_IN';
    }
  }
  order.charge = allCharge;
  if (isDpEnabled) {
    order.chargeAfterDp = Number(
      Big(order.charge)
        .minus(baseWholeOrderCharge)
        .plus(wholeOrderChargeAfterDp || 0)
        .toFixed(2)
    );
  }
  order.chargeName = allChargeName.join('+');
  order.orderCharges = allOrderCharge.map((each) => {
    return {
      ...each,
      taxed: state.systemConfig['IS_CHARGE_TAX']?.booleanValue,
    };
  });

  // ad/CRM 相关
  const {
    allSysConfig,
    crm: {
      earningRule: { expiration },
      memberCRMInfo,
      selectedDiscount,
    },
    avocado: { orderRewardId, outletInfo, crmCustomerInfo },
  } = state;

  const isCRMDisabled = checkCRMStatus(allSysConfig);
  // 自研CRM
  if (outletInfo?.enabled !== 1) {
    const freeItem = itemList.find((_) => _.isCRMFreeItem === true);
    if (freeItem) {
      const item = freeItem;
      const { rewardRule, itemPoints } = item;
      const { rewardType } = rewardRule;
      const orderRewards = {
        rewardId: rewardRule._id,
        rewardName: rewardRule.name,
        strategy: rewardRule.redeemRule.strategy,
        point: itemPoints || 0,
        itemId: item.isFreeItem ? item.oId : item.id,
        id: orderRewardId,
      };
      if (['voucher', 'loyalty'].includes(rewardType)) {
        orderRewards.rewardType = rewardType;
      }
      order.orderRewards = [orderRewards];
    }
    if (Object.keys(selectedDiscount)?.length > 0) {
      const { rewardType } = selectedDiscount;
      const orderRewards = {
        rewardId: selectedDiscount._id,
        rewardName: selectedDiscount.name,
        strategy: selectedDiscount.redeemRule.strategy,
        point: selectedDiscount.redeemRule.parameters.points || 0,
        discountRate: selectedDiscount.redeemRule.parameters.discount,
        discount: selectedDiscount.actualDiscount,
        id: orderRewardId,
      };
      if (['voucher', 'loyalty'].includes(rewardType)) {
        orderRewards.rewardType = rewardType;
      }
      if (
        selectedDiscount.redeemRule.strategy === 'byPercentageOff' &&
        selectedDiscount.redeemRule.parameters.maxDiscount
      ) {
        orderRewards.maxDiscount =
          selectedDiscount.redeemRule.parameters.maxDiscount;
      }
      const rewardDiscount = selectedDiscount.actualDiscount;
      order.orderRewards = [orderRewards];
      order.rewardDiscount = rewardDiscount;
      if (isDpEnabled) {
        orderRewards.discountAfterDp = toDpAmount(orderRewards.discount ?? 0);
        order.rewardDiscount =
          selectedDiscount.redeemRule.strategy === 'byPercentageOff'
            ? toDpAmount(rewardDiscount)
            : rewardDiscount;
        order.rewardDiscountAfterDp = order.rewardDiscount;
      }
    }
    if (memberCRMInfo.userId) {
      order.crmMemberId = memberCRMInfo.userId;
    }
  } else {
    // CRM 集成
    order.crmCustomerInfo = JSON.stringify(crmCustomerInfo);
    order.crmMemberId = crmCustomerInfo?.id;
    order.needCommit = needCommit ? '1' : '0';
  }

  if (isDpEnabled && order.orderRewards?.length) {
    order.orderRewards = order.orderRewards.map((reward) => ({
      ...reward,
      discountAfterDp: toDpAmount(reward.discount ?? 0),
    }));
  }

  // 计算crm积分
  if (!isCRMDisabled && memberCRMInfo.userId && outletInfo?.enabled !== 1) {
    order.point = handleCalculatePoint(state, order);
    order.expiration = JSON.stringify(expiration);
  }

  const tableId = state.currentOrder.tableId;
  if (isNumber(tableId)) {
    order.tableId = tableId;
  }
  order.kioskOrderServerName = getCookie('kioskLicense') || 'kiosklite';

  // 开启了dual price,要和pos价格展示一致的话，需要加priceType字段；CASH_PRICE 可以为空，兼容信用卡情况
  if (
    state.currentOrder?.paymentType == 'CREDIT_CARD' &&
    allSysConfig?.CREDIT_CHARGE_ENABLE === 'true'
  ) {
    order.priceType = 'CREDIT_PRICE';
  }

  // 订单级别的crm, 促销活动reward信息
  if (orderRewardDiscountList?.length) {
    order.discountList = JSON.stringify(orderRewardDiscountList);
    // 支付了才核销
    order.needCommit = needCommit ? '1' : '0';
  }

  // 促销中台需求: 商品级别的促销, totalPrice需要减去discount
  const itemPromotionAmount = orderRewardDiscountList?.reduce((pre, cur) => {
    if (cur.type !== 'promotion' || !cur.extraInfo.isItemDetailDiscount)
      return pre;
    return pre + cur.amount;
  }, 0);
  const itemPromotionAmountAfterDp = isDpEnabled
    ? toDpAmount(itemPromotionAmount || 0)
    : 0;
  if (itemPromotionAmount > 0) {
    order.totalPrice = Number(
      Big(order.totalPrice - itemPromotionAmount).toFixed(2)
    );
    if (isDpEnabled) {
      order.totalPriceAfterDp = Number(
        Big(order.totalPriceAfterDp)
          .minus(itemPromotionAmountAfterDp || 0)
          .toFixed(2)
      );
    }
  }

  obj.order = order;
  return obj;
}

export function getOrderInfoObj(state) {
  const {
    crm: { selectedDiscount, selectedFreeItem, isMemberOrderedBefore },
    promotion: { orderDiscount, isSkipPromotionCalculation, promotionCode },
    avocado,
    menuItemList,
    currentOrder,
  } = state;
  const { outletInfo } = avocado;
  const currentOrderListWithoutFreeItem = state.currentOrder.itemList.filter(
    (item) => !item.isFreeItem
  );
  // 是否有选择的discount
  const isHasRewardDiscount = Object.keys(selectedDiscount)?.length > 0;
  // true -> 菜价为折扣后价格 false -> 菜价为折扣前价格
  const isCountTaxAfterDiscount =
    state.systemConfig['IS_DISCOUNT_VOID_TAX']?.booleanValue;
  const isNeedPriceDiscount = isHasRewardDiscount && isCountTaxAfterDiscount;
  const isDpEnabled =
    state.currentOrder?.paymentType == 'CREDIT_CARD' &&
    (state.allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' ||
      state.allSysConfig?.CREDIT_CHARGE_ENABLE === true);
  const dpMultiplier = isDpEnabled
    ? Number(
        Big(1).plus(Big(state.allSysConfig?.CREDIT_CHARGE_RATE || 0).div(100))
      )
    : 1;
  const toDpAmount = (val) => {
    if (val === undefined || val === null || val === '') {
      return val;
    }
    return Number(floatNumberRounding(Big(val).times(dpMultiplier).toNumber()));
  };
  // 不参与折扣菜id
  let notEligibleId = [];
  if (isHasRewardDiscount) {
    if (avocado.outletInfo?.enabled === 1) {
      const { couponTemplate } = selectedDiscount;
      const { type, value } =
        couponTemplate?.ruleExpression?.condition?.itemFilter;
      if (type === 'all') {
        notEligibleId = [];
      } else if (type === 'exclude') {
        notEligibleId = value.map((each) => each.itemId);
      } else {
        const allItemsId = Object.keys(menuItemList).map((each) =>
          Number(each)
        );
        const includeItemId = value.map((each) => each.itemId);
        notEligibleId = allItemsId.filter(
          (each) => !includeItemId.includes(each)
        );
      }
    } else {
      notEligibleId =
        selectedDiscount.redeemRule?.eligibility?.object?.items?.map(
          (item) => item.itemId
        ) || [];
    }
  }
  let rewardDiscountRate = null;
  if (isNeedPriceDiscount) {
    const orderItems = [];
    currentOrderListWithoutFreeItem.forEach((item) => {
      orderItems.push({
        ...item,
        orderItemPrice: getItemPrice(item),
      });
    });
    if (orderItems?.length > 0) {
      // 实际抵扣金额
      const { actualDiscount } = selectedDiscount;
      // 百分比折扣
      if (selectedDiscount.redeemRule.strategy === 'byPercentageOff') {
        // actualDiscount 已按整单金额四舍五入；商品级折后价必须使用同一权威金额
        // 反算折后比例，否则 整单价格与商品价格有差值 导致 pos反推出折扣不对，
        rewardDiscountRate = reCountDiscountRate(
          orderItems,
          notEligibleId,
          actualDiscount,
          () => Toast.info(t('current-amount-error'), 2000)
        );
      }
      // 固定折扣要换算成百分比
      if (selectedDiscount.redeemRule.strategy === 'byFixedAmount') {
        const fixedAmountOrderItems = isDpEnabled
          ? orderItems.map((orderItem) => ({
              ...orderItem,
              orderItemPrice: toDpAmount(orderItem.orderItemPrice),
            }))
          : orderItems;
        rewardDiscountRate = reCountDiscountRate(
          fixedAmountOrderItems,
          notEligibleId,
          actualDiscount,
          () => Toast.info(t('current-amount-error'), 2000)
        );
      }
    }
  }
  let order = {};
  order.totalTips = 0; //餐前小费，类似于服务费，kiosk不需要，所以值为0
  order.roundingStrategy =
    state.systemConfig['ORDER_TOTAL_ROUNDING_STRATEGY']?.value;
  order.isTaxWithDiscount =
    state.systemConfig['IS_DISCOUNT_VOID_TAX']?.booleanValue;
  order.isTaxWithCharge = state.systemConfig['IS_CHARGE_TAX']?.booleanValue;
  const currentOrderType =
    state.currentOrder.orderType || window.selectedOrderType;
  if (currentOrderType === 'DINE_IN') {
    order.isTaxExempt = false;
  } else {
    // togo下，是否全部免税
    order.isTaxExempt =
      state.systemConfig['IS_EXEMPT_TAX_ON_TAKEOUT_ORDER']?.booleanValue;
  }
  order.itemInfoList = [];

  // 要把 ad 积分兑换菜/券兑换菜 算进来
  const list = [...currentOrderListWithoutFreeItem];
  // 优先取订单中的赠菜，其次取活动中心选的赠菜
  const freeItem =
    state.currentOrder?.itemList?.find((e) => e.isFreeItem) ||
    selectedFreeItem?.[0];
  const isBeforeDiscountCountTaxForFreeItem =
    outletInfo?.enabled === 1 && !isCountTaxAfterDiscount && freeItem;
  if (isBeforeDiscountCountTaxForFreeItem) {
    list.push({
      ...freeItem,
      isCRMIntegrationFreeItem: true,
      price: freeItem.itemPrices?.length ? 0 : freeItem.freeItemOriginPrice,
    });
  }

  list.forEach((item) => {
    let tempItem = {};
    tempItem.id = item.id;
    const isSkipFreeItemPrice =
      item.isCRMIntegrationFreeItem && isCountTaxAfterDiscount;
    state.currentCategoryList.forEach((cate) => {
      if (cate.id == item.categoryId) {
        tempItem.isApplicablePromotion = cate.applicableToTriggerPromotion;
        tempItem.isSkipDiscount = !cate.applicableToOrderDiscount;
        tempItem.taxObj = [];
        state.taxList.forEach((tax) => {
          if (item.taxIds && item.taxIds.includes(tax.id)) {
            let tempTax = {};
            tempTax.taxId = tax.id;
            tempTax.taxRate = tax.rate;
            tempTax.taxName = tax.name;
            tempTax.extraInfo = {
              isTaxIncrease: tax.taxIncreaseRate > 0,
              priceThreshold: tax.priceLimit,
              taxIncreaseRate: tax.taxIncreaseRate,
              takeoutTaxFree: getTakeoutTaxFree(item, cate, currentOrderType),
            };

            tempItem.taxObj.push(tempTax);
          }
          if (cate.taxIds && cate.taxIds.includes(tax.id)) {
            let tempTax = {};
            tempTax.taxId = tax.id;
            tempTax.taxRate = tax.rate;
            tempTax.taxName = tax.name;
            tempTax.extraInfo = {
              isTaxIncrease: tax.taxIncreaseRate > 0,
              priceThreshold: tax.priceLimit,
              taxIncreaseRate: tax.taxIncreaseRate,
              takeoutTaxFree: getTakeoutTaxFree(item, cate, currentOrderType),
            };
            tempItem.taxObj.push(tempTax);
          }
        });

        tempItem.extraInfo = {
          categroyId: cate.id,
          isQuantityRule: cate.qtyQualifyingForZeroRated > 0,
          quantityThreshold: cate.qtyQualifyingForZeroRated,
        };
      }
    });
    if (item.isCRMIntegrationFreeItem) {
      tempItem.isCRMIntegrationFreeItem = true;
    }
    tempItem.itemPrice = isSkipFreeItemPrice ? 0 : item.price || 0;
    tempItem.quantity = item.quantity;
    tempItem.options = [];
    if (item.sectionDetail) {
      item.sectionDetail.forEach((sct) => {
        if (sct.id == -2 || sct.id == -3) {
          sct.options.forEach((opt) => {
            tempItem.options.push({
              optionPrice:
                opt.isFreeItem || isSkipFreeItemPrice ? 0 : opt.price,
              quantity: opt.quantity,
            });
          });
        }
        if (sct.id == -1) {
          tempItem.itemPrice = isSkipFreeItemPrice ? 0 : sct.sizeInfo.price;
        }
      });
    }

    if (item.itemType == 'COMBO_SALE_ITEM') {
      tempItem.itemPrice = isSkipFreeItemPrice ? 0 : getItemPrice(item);
      tempItem.options = [];
    }

    if (item.discountID) {
      tempItem.discountID = item.discountID;
      tempItem.discountName = item.discountName;
      tempItem.discountRate = item.discountRate;
      tempItem.discountRateType = item.discountRateType;
      tempItem.discount = Number(item.discount);
      if (isDpEnabled && item.isCRMIntegrationFreeItem !== true) {
        tempItem.discount = toDpAmount(tempItem.discount ?? 0);
      }
      if (item.isHasNoDiscountSubDish) {
        tempItem.discountID = -1;
        tempItem.discountRateType = 1;
      }
    }

    // 折扣后算税，针对促销中台/ad集成进行处理算税，后续还要在订单价格上加上折扣值
    if (
      isCountTaxAfterDiscount &&
      (item.promotionRewardItem || item.campaignRewardItem)
    ) {
      // 记录原价,最后重新用原价加出原本总价，再取和折扣后价格的差值作为折扣，
      // 否则因为itemPrice除过份数，会有计价的分数级误差，到底无法下单
      // tempItem.rewardItemDiscountValue = item.actualDiscount;
      tempItem.originItemPrice = tempItem.itemPrice;

      // 计算options总价：累加所有选项的价格（选项价格 * 数量）
      const optionsTotalPrice =
        tempItem.options?.reduce((pre, cur) => {
          return Big(pre).plus(
            Big(cur.optionPrice || 0).times(cur.quantity || 1)
          );
        }, 0) || Big(0);

      // 新的itemPrice = 原itemPrice + options总价 - 折扣（按数量均摊）
      tempItem.itemPrice = Number(
        Big(tempItem.itemPrice)
          .plus(optionsTotalPrice)
          .minus(Big(item.actualDiscount).div(tempItem.quantity).toFixed(2))
          .toFixed(2)
      );
    }

    order.itemInfoList.push(tempItem);
  });

  let taxCalculator = new SalesTaxCalculator();
  if (
    state.systemConfig.COUNTRY_STATES_PROVINCE_TERRITORY?.value == 'ONTARIO'
  ) {
    taxCalculator = new CanadaOntarioTaxCalculator();
  }

  // 整单加收(开DP时不能整单加收)
  let chargeDetail = null;
  order.chargeObj = {};
  const currentPaymentType = getCurrentPaymentType(
    state.currentOrder?.paymentType,
    state.currentOrder?.paymentTypeTrail || []
  );
  const isGiftCardAndCreditCardMixed = isGiftCardWithCreditCardOrder(
    state.currentOrder?.paymentTypeTrail || []
  );
  if (currentPaymentType === 'CREDIT_CARD') {
    if (
      state.selfConfig?.charge?.length &&
      state.allSysConfig?.CREDIT_CHARGE_ENABLE !== 'true' &&
      state.allSysConfig?.CREDIT_CHARGE_ENABLE !== true
    ) {
      let noNeedChargeAmount = 0;
      if (state.giftCardPaymentInfo?.paidTotal) {
        noNeedChargeAmount = state.giftCardPaymentInfo?.paidTotal;
      }
      let r = state.selfConfig.charge.find((c) => c.id === 1);
      // 要设置加收且开启加收需要收税
      if (r?.select?.id) {
        chargeDetail = new WholeOrderCharge(
          r.select.ratetype,
          r.select.rate,
          state.systemConfig.IS_CHARGE_TAX.booleanValue,
          noNeedChargeAmount
        );
      }
    }
    // DP
    if (
      state.allSysConfig?.CREDIT_CHARGE_ENABLE === 'true' &&
      !isGiftCardAndCreditCardMixed
    ) {
      order.DPRate = Number(
        Big(state.allSysConfig?.CREDIT_CHARGE_RATE).div(100)
      );
    }
  }

  // togo加收
  let togoTaxDetail = null;
  if (currentOrderType === 'TO_GO' || currentOrderType === 'PICK_UP') {
    let bool = state.togoList.some((item) => item?.select?.id);
    // 选择了Togo加收（餐具，包等）
    if (bool) {
      // 开启加收需要收税
      togoTaxDetail = new TogoCharge(
        state.togoList,
        state.systemConfig.IS_CHARGE_TAX.booleanValue,
        getItemCount(itemList)
      );
    }
  }

  const discountChargeCalculator = new DiscountChargeCalculator();
  const orderPricing = new OrderPricing(
    discountChargeCalculator,
    taxCalculator,
    chargeDetail,
    togoTaxDetail
  );

  // 配置了kiosk本地促销 - 整单折扣
  let promotionDiscountInfo = undefined;
  const isHasCrmCampaign = isHasCRMCampaignFn({
    itemList: currentOrder.itemList,
    selectedFreeItem,
    selectedDiscount,
  });
  if (
    orderDiscount.length > 0 &&
    !isSkipPromotionCalculation &&
    !isHasCrmCampaign
  ) {
    const validPromotionItem = currentOrderListWithoutFreeItem.filter(
      (item) => {
        const cId = item.oCategoryId || item.categoryId;
        return state.currentCategoryList.find((c) => c.id === cId)
          ?.applicableToTriggerPromotion;
      }
    );
    const itemPrices = validPromotionItem.reduce((pre, cur) => {
      return Big(pre).plus(Big(getItemPrice(cur) || 0).times(cur.quantity));
    }, 0);
    const totalItemPrices = Number(itemPrices.toFixed(2));
    // 金额满足的discount、促销码活动不参与自动计算满减，需要手动输入码
    const overStandardDiscounts = orderDiscount.filter(
      (discountInfo) =>
        totalItemPrices >= Number(discountInfo?.activityRule?.satisfyPrice) &&
        discountInfo?.activityRule?.usePromotionCode !== '1'
    );
    // 有多个同样最大金额促销时
    const findBestDiscount = (promotions, totalItemPrices) => {
      const satisfyDiscount = promotions
        .map((each) => {
          const {
            activityRule: {
              discountNumber,
              discountType,
              isFirstOrderDiscount,
            },
          } = each;
          const actualDiscount =
            discountType === 'fixDiscount'
              ? Number(discountNumber)
              : Number(
                  Big(totalItemPrices)
                    .times(Big(discountNumber).div(100))
                    .toFixed(2)
                );
          return {
            ...each,
            activityRule: {
              ...each.activityRule,
              isFirstOrderDiscount: isFirstOrderDiscount || '0',
            },
            actualDiscount,
          };
        })
        .sort((a, b) => b.actualDiscount - a.actualDiscount);
      // 首单总是选择最优折扣
      if (!isMemberOrderedBefore) return satisfyDiscount[0];
      // 非首单选择第一个非首单折扣
      return satisfyDiscount.find(
        (each) => each.activityRule.isFirstOrderDiscount === '0'
      );
    };

    // 输入过促销码的时候取选中的促销码活动 否则才走自动找最优
    if (promotionCode) {
      const selectedPromotion = orderDiscount.find(
        (item) => item?.activityRule?.promotionCode === promotionCode
      );

      const {
        activityRule: {
          discountNumber,
          discountType,
          satisfyPrice,
          isFirstOrderDiscount,
        },
      } = selectedPromotion;

      const actualDiscount =
        discountType === 'fixDiscount'
          ? Number(discountNumber)
          : Number(
              Big(totalItemPrices)
                .times(Big(discountNumber).div(100))
                .toFixed(2)
            );

      if (totalItemPrices >= Number(satisfyPrice)) {
        if (
          (isFirstOrderDiscount === '1' && !isMemberOrderedBefore) ||
          isFirstOrderDiscount === '0'
        ) {
          promotionDiscountInfo = { ...selectedPromotion, actualDiscount };
        }
      }
    } else {
      // 最优折扣
      promotionDiscountInfo = findBestDiscount(
        overStandardDiscounts,
        totalItemPrices
      );
    }
    if (promotionDiscountInfo) {
      const {
        activityRule: { discountNumber, discountType },
      } = promotionDiscountInfo;
      const discountIsPer = discountType === 'rateDiscount';
      // 用于折扣计算器，最终还是平摊到菜上，涉及到算税问题
      order.discountObj = {
        promotionDiscount: {
          discountIsPer: discountIsPer,
          discountRate: discountIsPer
            ? Number(Big(discountNumber).div(100).toFixed(2))
            : null,
          discount: discountIsPer
            ? null
            : Number(Big(discountNumber).toFixed(2)),
        },
      };
      // 往redux里记录一份 以避免调用getOrderInfoObj来判断是否有kiosk本地折扣促销
      // 不能往redux记录了 会死循环... 先记录到window上...
      window.kioskLocalDiscountPromotion = promotionDiscountInfo;
    } else {
      window.kioskLocalDiscountPromotion = null;
    }
  } else {
    window.kioskLocalDiscountPromotion = null;
  }

  const orderPrice = orderPricing.orderDetailPrice(order);
  if (promotionDiscountInfo) {
    orderPrice.promotionDiscountInfo = promotionDiscountInfo;
  }
  // 有crm discount, 且开启折扣后算税 时需要重新算税信息
  if (isNeedPriceDiscount) {
    const discountOrder = cloneDeep(order);
    const newItemInfoList = discountOrder.itemInfoList.map((orderItem) => {
      let isNeedDiscount = !notEligibleId.includes(orderItem.id);
      if (orderItem.options?.length > 0) {
        const newOptions = orderItem.options.map((opts) => {
          return {
            ...opts,
            optionPrice: countActualPrice(
              opts.optionPrice,
              rewardDiscountRate,
              isNeedDiscount
            ),
          };
        });
        return {
          ...orderItem,
          options: newOptions,
          itemPrice: countActualPrice(
            orderItem.itemPrice,
            rewardDiscountRate,
            isNeedDiscount
          ),
        };
      }
      return {
        ...orderItem,
        itemPrice: countActualPrice(
          orderItem.itemPrice,
          rewardDiscountRate,
          isNeedDiscount
        ),
      };
    });
    discountOrder.itemInfoList = newItemInfoList;
    const discountOrderPrice = orderPricing.orderDetailPrice(discountOrder);
    return {
      ...orderPrice,
      orderTaxTotal: discountOrderPrice.orderTaxTotal,
      orderTaxDetail: discountOrderPrice.orderTaxDetail,
      orderSubtotal:
        orderPrice.orderSubtotal -
        orderPrice.orderCharge +
        discountOrderPrice.orderCharge,
      orderCharge: discountOrderPrice.orderCharge,
    };
  }

  // 有ad 兑换免费菜(积分/券), 且折扣前算税 时需要重新算订单信息
  if (isBeforeDiscountCountTaxForFreeItem) {
    const itemPrice = getItemPrice({
      ...freeItem,
      price: freeItem.itemPrices?.length ? 0 : freeItem.freeItemOriginPrice,
    });
    const subtract = (val) => Number(Big(val).minus(itemPrice).toFixed(2));

    return {
      ...orderPrice,
      orderOriginalTotal: subtract(orderPrice.orderOriginalTotal),
      orderSubtotal: subtract(orderPrice.orderSubtotal),
      orderTotal: subtract(orderPrice.orderTotal),
    };
  }

  // 折扣后算税，针对促销中台/crm集成进行处理订单价格
  const isHasRewardItem = list.find(
    (e) => e.promotionRewardItem || e.campaignRewardItem
  );
  if (isCountTaxAfterDiscount && isHasRewardItem) {
    // const orderPromotionCenterDiscountVal = order.itemInfoList?.reduce(
    //   (pre, cur) => {
    //     return Big(pre).plus(cur.rewardItemDiscountValue || 0);
    //   },
    //   0
    // );
    // const discountVal = Number(orderPromotionCenterDiscountVal.toFixed(2));
    // const addPrice = (val) => Number(Big(val).plus(discountVal).toFixed(2));
    const orderOriginPrice = order.itemInfoList?.reduce((pre, cur) => {
      // 计算选项总价：累加所有选项的价格（选项价格 * 数量）
      const optionsPrice =
        cur?.options?.reduce((preOption, curOption) => {
          return Big(preOption).plus(
            Big(curOption.optionPrice || 0).times(curOption.quantity || 1)
          );
        }, 0) || 0;

      // 计算单个商品原价：商品原价 + 选项总价
      const itemOriginPrice = Big(
        cur.originItemPrice || cur.itemPrice || 0
      ).plus(optionsPrice);

      // 累加：商品原价 * 数量
      return Big(pre).plus(itemOriginPrice.times(cur.quantity || 1));
    }, 0);
    const discountVal = Number(
      Big(orderOriginPrice).minus(orderPrice.orderSubtotal)
    );
    const addPrice = (val) => Number(Big(val).plus(discountVal).toFixed(2));
    return {
      ...orderPrice,
      orderOriginalTotal: addPrice(orderPrice.orderOriginalTotal),
      orderSubtotal: addPrice(orderPrice.orderSubtotal),
      orderTotal: addPrice(orderPrice.orderTotal),
    };
  }

  return orderPrice;
}

function getItemFromCategoryList(id, categoryList) {
  let targetItem = null;
  categoryList.forEach((cate) => {
    if (cate.saleItems) {
      cate.saleItems.forEach((item) => {
        if (item.id == id) {
          targetItem = item;
        }
      });
    }
  });
  return targetItem;
}

function handleCalculatePoint(state, order) {
  const {
    crm: { earningRule },
  } = state;
  const {
    type,
    orderItems,
    charge,
    totalTax,
    totalPrice,
    totalTips,
    rewardDiscount,
    discount,
  } = order;
  const total = Big(totalPrice)
    .plus(totalTax)
    .plus(totalTips)
    .plus(charge)
    .toNumber();
  let totalOrderDiscount = parseFloat(
    Big(rewardDiscount ?? 0)
      .plus(discount ?? 0)
      .toFixed(2)
  );
  const pointOrderInfo = {
    orderType: type,
    orderItems,
    price: {
      subTotal: totalPrice,
      total,
      charge,
      taxTotal: totalTax,
      tips: totalTips,
      discount: totalOrderDiscount ?? 0,
      round: 0,
    },
  };
  const cal = window.PointCalculator.Calculator;
  const pointCal = new cal({
    description: 'earning point calc',
    version: '1.0.0',
    createAt: '2023-06-01',
    updateAt: '2023-06-01',
    tasks: [
      {
        description: 'earning calc',
        name: 'earningTask',
      },
    ],
  });
  return pointCal.doEarningCalc(pointOrderInfo, earningRule);
}

function getItemCount(itemList) {
  return itemList.reduce((pre, cur) => {
    return pre + cur.quantity;
  }, 0);
}

export async function countAmount(state, payByCash, payByCard) {
  const {
    currentOrder,
    currentOrder: { paymentType, paymentTypeTrail },
  } = state;

  const currentPaymentType = getCurrentPaymentType(
    paymentType,
    paymentTypeTrail
  );

  // 提取公共计算部分
  const calculateOrderAmount = (orderInfo, orderData, tipAmount = 0) => {
    const subTotal = orderInfo?.orderSubtotal;
    const totalTax = orderInfo?.orderTaxTotal;
    const charge = orderInfo?.chargeTotal;
    const togoTotal = orderInfo?.togoTotal;
    const orderDiscount = orderInfo?.orderDiscount;

    // 积分折扣, crm集成折扣
    let rewardDiscount = orderData?.rewardDiscount || 0;
    if (orderData?.discountList) {
      const orderRewardDiscountList = JSON.parse(orderData?.discountList);
      if (orderRewardDiscountList?.length > 0) {
        const discountInfo = orderRewardDiscountList[0];
        if (discountInfo?.type === 'promotion') {
          rewardDiscount = discountInfo?.amount;
        } else if (!discountInfo?.isReward) {
          rewardDiscount = discountInfo?.amount;
        }
      }
    }

    return {
      subTotal,
      totalTax,
      charge,
      togoTotal,
      rewardDiscount,
      orderDiscount,
      tipAmount,
    };
  };
  // 现金支付
  await payByCash();
  // 从 Redux store 获取最新状态，确保读取到更新后的 paymentType
  const updatedState_CASH = store.getState();
  const orderInfo_CASH = getOrderInfoObj(updatedState_CASH);
  const orderData_CASH = generateSubmitOrderObj(updatedState_CASH)?.order;
  const cashAmounts = calculateOrderAmount(orderInfo_CASH, orderData_CASH);

  const cashPaymentTotal = safeBig(cashAmounts?.subTotal)
    .plus(safeBig(cashAmounts?.totalTax))
    .plus(safeBig(cashAmounts?.togoTotal))
    .minus(safeBig(cashAmounts?.rewardDiscount))
    .minus(safeBig(cashAmounts?.orderDiscount))
    .toFixed(2);

  // 信用卡支付
  await payByCard();
  // 从 Redux store 获取最新状态，确保读取到更新后的 paymentType
  const updatedState = store.getState();
  const orderInfo = getOrderInfoObj(updatedState);
  const orderData = generateSubmitOrderObj(updatedState)?.order;
  const creditAmounts = calculateOrderAmount(
    orderInfo,
    orderData,
    currentOrder?.tipAmount
  );

  const creditPaymentTotal = safeBig(creditAmounts?.subTotal)
    .plus(safeBig(creditAmounts?.totalTax))
    .plus(safeBig(creditAmounts?.charge))
    .plus(safeBig(creditAmounts?.togoTotal))
    .plus(safeBig(creditAmounts?.tipAmount))
    .minus(safeBig(creditAmounts?.rewardDiscount))
    .minus(safeBig(creditAmounts?.orderDiscount))
    .toFixed(2);

  // 重新调用用户选择的支付方法
  if (currentPaymentType === 'CASH') {
    await payByCash();
  } else if (currentPaymentType === 'CREDIT_CARD') {
    await payByCard();
  }
  // 确保最终状态已更新
  await new Promise((resolve) => setTimeout(resolve, 0));

  // 根据支付方式返回对应的金额明细
  const finalAmounts =
    currentPaymentType === 'CASH' ? cashAmounts : creditAmounts;

  return {
    ...finalAmounts,
    cashPaymentTotal,
    creditPaymentTotal,
    totalAmount:
      currentPaymentType === 'CASH' ? cashPaymentTotal : creditPaymentTotal,
  };
}
