import React, { useState, useRef, useCallback, memo } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import styles from './AdFreeItem.module.scss';
import { changeFreeItem, setTempFreeItem } from '@/actions/crm_action';
import { judgeHasDetailInfo } from '@/utils/busTools';
import { getItemPrice } from '@/utils/priceCalculator';
import { getCurrentItem, getCurrentCategory } from '@/actions';
import ADItemList from '../ADItemList';
import OrderDetailModal from '@/container/orderPage/orderDetailModal';
import ComboPanel from '@/container/comboPanel';
import Dialog from '@/component/dialog';
import Toast from '@/component/toast';
import { getOrderInfoObj } from '@/api/submitOrderObj';
import { roundToPrecision } from '@/utils/resolveAvocadoSku';

const MemoADItemList = memo(ADItemList);
const AdFreeItem = (props) => {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const {
    store,
    countRow,
    crm: { tempFreeItem, memberCRMInfo, selectedDiscount },
    crmType,
    changeFreeItem,
    setTempFreeItem,
    getCurrentItem,
    getCurrentCategory,
    ruleWithItem,
  } = props;
  const [orderPanelShow, setOrderPanelShow] = useState(false);
  const [comboPanelVisible, setComboPanelVisible] = useState(false);
  const orderSubtotal = getOrderInfoObj(store)?.orderSubtotal;

  const orderDetailModal = useRef(null);

  const countADRedeemPrice = useCallback((voucherRules, price) => {
    const { option, value, amountCapped } = voucherRules;

    if (option === 'dollarOff') {
      const afterDiscountPrice = roundToPrecision(price - value);
      return afterDiscountPrice < 0 ? 0 : afterDiscountPrice;
    }

    if (option === 'percentageOff') {
      const discount = roundToPrecision((value / 100) * price);
      const cappedDiscount = discount > amountCapped ? amountCapped : discount;
      return roundToPrecision(price - cappedDiscount);
    }

    return 0;
  }, []);

  const handleSetFreeItem = useCallback(
    (itemInfo, isNormalDish = false) => {
      const { itemPoints, rewardRule, crmIntegrationRule } = tempFreeItem;
      let baseItemInfo = {
        remark: {
          optionName: '',
          optionType: 'NOTE',
          quantity: 1,
          price: 0,
        },
        ...itemInfo,
        quantity: 1,
      };
      const item = isNormalDish
        ? baseItemInfo
        : { ...baseItemInfo, itemPoints, rewardRule, crmIntegrationRule };

      // ad 折扣商品
      const { voucherRules } = item.rewardRule;
      if (voucherRules) {
        // 计算菜品原价
        const itemPrice = getItemPrice({
          ...item,
          price: item.itemPrices?.length ? 0 : item.originalPrice, // 有详情价为0 否则按照原价取
        });
        // 计算折扣后价格，放到主菜上，子菜会在下单时价格置为0
        item.price = countADRedeemPrice(voucherRules, itemPrice);
        item.originalPrice = itemPrice;
      }
      changeFreeItem([item]);
    },
    [tempFreeItem]
  );

  const handleClickItem = useCallback(
    (itemInfo) => {
      const languageKey = language.replace('_', '-');
      if (!Object.keys(memberCRMInfo).length) {
        Toast.info(t('redeem-login-first'), 2000);
        return;
      }
      if (Object.keys(selectedDiscount).length) {
        Toast.info(t('onlyOneFree'), 2000);
        return;
      }
      if ((memberCRMInfo?.pointBalance ?? 0) < itemInfo.itemPoints) {
        Toast.info(t('noEnoughPoints'), 2000);
        return;
      }
      if (!itemInfo.rewardRule.isValid) {
        Toast.info(t(itemInfo.rewardRule.invalidReason[0][languageKey]), 2000);
        return;
      }
      setTempFreeItem({
        ...itemInfo,
        remark: {
          optionName: '',
          optionType: 'NOTE',
          quantity: 1,
          price: 0,
        },
      });
      if (itemInfo.itemType === 'SALE_ITEM') {
        // 判断当前菜，是否有详情等字段
        if (judgeHasDetailInfo(itemInfo)) {
          setOrderPanelShow(true);
          return;
        }
        const clonedItem = cloneDeep(itemInfo);
        if (clonedItem.itemPrices?.length === 1) {
          clonedItem.sectionDetail = [{
            id: -1,
            sizeInfo: Object.assign({}, clonedItem.itemPrices[0]),
          }]
          clonedItem.price = 0;
        } else {
          clonedItem.sectionDetail = [];
        }
        handleSetFreeItem(clonedItem, true);
        return;
      }
      // 固定套餐
      if (itemInfo.comboType === 'FIXED_SELECTION') {
        setOrderPanelShow(true);
        return;
      }
      // 自选套餐
      getCurrentCategory(itemInfo.categoryId);
      getCurrentItem(itemInfo.id);
      setComboPanelVisible(true);
    },
    [selectedDiscount, memberCRMInfo]
  );

  const openOrderDetailModal = (ref) => {
    orderDetailModal.current = ref;
  };

  return (
    <div>
      <div className={styles.rewardList}>
        <MemoADItemList
          crmType={crmType}
          ruleWithItem={ruleWithItem}
          countRow={countRow}
          handleClickItem={handleClickItem}
          orderSubtotal={orderSubtotal}
        />
      </div>

      {/* 详情菜 */}
      {orderPanelShow && (
        <OrderDetailModal
          onAddFreeItem={handleSetFreeItem}
          isInFreeItem
          max={1}
          orderPanelShow={orderPanelShow}
          itemInfo={tempFreeItem}
          onRef={openOrderDetailModal}
          onCloseModal={() => setOrderPanelShow(false)}
        />
      )}

      {/* combo菜 */}
      <Dialog
        visible={comboPanelVisible}
        html={
          <ComboPanel
            onAddFreeItem={handleSetFreeItem}
            isInFreeItem
            max={1}
            itemPoints={tempFreeItem.itemPoints}
            itemVoucherPrice={tempFreeItem.price}
            onCloseModal={() => setComboPanelVisible(false)}
          />
        }
      />
    </div>
  );
};

function mapStateToProps(state) {
  return {
    store: state,
  };
}

export default connect(mapStateToProps, {
  changeFreeItem,
  setTempFreeItem,
  getCurrentItem,
  getCurrentCategory,
})(AdFreeItem);
