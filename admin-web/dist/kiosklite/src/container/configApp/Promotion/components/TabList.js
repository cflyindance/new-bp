import React, { useMemo, useState } from 'react';
import { Checkbox, Tabs, Divider } from 'antd';
import TabBuyGifts from './TabBuyGifts';
import TabBuyDiscount from './TabBuyDiscount';
import { useTranslation } from 'react-i18next';
import TabOrderDiscount from './TabOrderDiscount';
import TabExchangePurchase from './TabExchangePurchase';
import { activityTypes } from '@/constants/selfConfig';
import TipsModal from './TipsModal';

const TabList = (props) => {
  const {
    promotion,
    setPromotion,
    handleAddOrEditActivity,
    kioskMenu,
    activeKey,
    setActiveKey,
    promotionEnableType,
    setPromotionEnableType,
  } = props;
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [tipsTypeText, setTipsTypeText] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const handleContinue = () => {
    if (pendingAction) {
      const { action, id, activityType, value } = pendingAction;
      if (action === 'changeStatus') {
        executeChangePromotionStatus(id, value);
      } else if (action === 'remove') {
        executeRemovePromotion(id, activityType);
      }
    }
    handleCancel();
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingAction(null);
  };
  const menuWithSubDish = useMemo(() => {
    return kioskMenu.map((group) => {
      return {
        ...group,
        key: group.id,
        _id: 'group_' + group.id,
        children: group.children.map((category) => {
          return {
            ...category,
            key: category.id,
            _id: 'category_' + category.id,
            children: category.children.map((item) => {
              return item.comboSections
                ? {
                    ...item,
                    key: item.id,
                    _id: 'dish_' + item.id,
                    children: item.comboSections.map((sub) => {
                      return {
                        ...sub,
                        id: `${item.id}${sub.id}`,
                        key: `${item.id}${sub.id}`,
                        _id: 'dish_combo_' + `${item.id}${sub.id}`,
                      };
                    }),
                  }
                : {
                    ...item,
                    _id: 'dish_' + item.id,
                    key: item.id,
                  };
            }),
          };
        }),
      };
    });
  }, [kioskMenu]);

  const executeChangePromotionStatus = (id, v) => {
    const newPromotion = promotion.map((each) => {
      if (each.id === id) {
        return {
          ...each,
          enable: v,
        };
      }
      return each;
    });
    setPromotion(newPromotion);
  };

  const changePromotionStatus = (id, v) => {
    const targetPromotion = promotion.find((each) => each.id === id);

    // 检查是否需要显示确认对话框(满减、促销码、准备关闭时)
    if (
      targetPromotion &&
      targetPromotion.activityType === 'orderDiscount' &&
      targetPromotion.activityRule?.usePromotionCode === '1' &&
      !v
    ) {
      setTipsTypeText(t('closeText'));
      setPendingAction({
        action: 'changeStatus',
        id,
        activityType: targetPromotion.activityType,
        value: v,
      });
      setShowModal(true);
      return;
    }

    // 执行后续操作
    executeChangePromotionStatus(id, v);
  };

  const executeRemovePromotion = (id, activityType) => {
    const newPromotion = promotion.filter((each) => each.id !== id);
    const leftPromotion = newPromotion.filter(
      (each) => each.activityType === activityType
    );
    // 无当前促销类型
    if (leftPromotion.length === 0) {
      // 选第一个促销类型的可以
      const otherKey = newPromotion?.[0]?.activityType || null;
      setActiveKey(otherKey);
    }
    setPromotion(newPromotion);
  };

  const removePromotion = (id, activityType) => {
    const targetPromotion = promotion.find((each) => each.id === id);

    // 检查是否需要显示确认对话框
    if (
      targetPromotion &&
      targetPromotion.activityType === 'orderDiscount' &&
      targetPromotion.activityRule?.usePromotionCode === '1'
    ) {
      setTipsTypeText(t('deleteText'));
      setPendingAction({ action: 'remove', id, activityType });
      setShowModal(true);
      return;
    }

    // 执行后续操作
    executeRemovePromotion(id, activityType);
  };

  const buyGifts = useMemo(() => {
    return promotion.filter((item) => item.activityType === 'buyGifts') || [];
  }, [promotion]);

  const buyDiscount = useMemo(() => {
    return (
      promotion.filter((item) => item.activityType === 'buyDiscount') || []
    );
  }, [promotion]);

  const orderDiscount = useMemo(() => {
    return (
      promotion.filter((item) => item.activityType === 'orderDiscount') || []
    );
  }, [promotion]);

  const exchangePurchase = useMemo(() => {
    return (
      promotion.filter((item) => item.activityType === 'exchangePurchase') || []
    );
  }, [promotion]);

  const items = useMemo(() => {
    const promotionTypes = promotion.map((each) => each.activityType);
    return activityTypes
      .map((each) => {
        return {
          key: each.value,
          label: t(each.value),
          children: null,
        };
      })
      .filter((item) => promotionTypes.includes(item.key));
  }, [activityTypes, promotion]);

  return (
    <div>
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key)}
        items={items}
      />
      {promotion.length > 0 && (
        <Checkbox
          checked={promotionEnableType === activeKey}
          onChange={() =>
            setPromotionEnableType(
              promotionEnableType === activeKey ? '' : activeKey
            )
          }
        >
          {t('openPromotion')}
        </Checkbox>
      )}
      <Divider />
      {buyGifts.length > 0 && activeKey === 'buyGifts' && (
        <TabBuyGifts
          buyGifts={buyGifts}
          changePromotionStatus={changePromotionStatus}
          handleAddOrEditActivity={handleAddOrEditActivity}
          removePromotion={removePromotion}
          kioskMenu={menuWithSubDish}
        />
      )}
      {buyDiscount.length > 0 && activeKey === 'buyDiscount' && (
        <TabBuyDiscount
          buyDiscount={buyDiscount}
          changePromotionStatus={changePromotionStatus}
          handleAddOrEditActivity={handleAddOrEditActivity}
          removePromotion={removePromotion}
          kioskMenu={menuWithSubDish}
        />
      )}
      {orderDiscount.length > 0 && activeKey === 'orderDiscount' && (
        <TabOrderDiscount
          orderDiscount={orderDiscount}
          changePromotionStatus={changePromotionStatus}
          handleAddOrEditActivity={handleAddOrEditActivity}
          removePromotion={removePromotion}
        />
      )}
      {exchangePurchase.length > 0 && activeKey === 'exchangePurchase' && (
        <TabExchangePurchase
          exchangePurchase={exchangePurchase}
          changePromotionStatus={changePromotionStatus}
          handleAddOrEditActivity={handleAddOrEditActivity}
          removePromotion={removePromotion}
          kioskMenu={menuWithSubDish}
        />
      )}

      <TipsModal
        isShowModal={showModal}
        tipsType={tipsTypeText}
        handleContinue={handleContinue}
        handleCancel={handleCancel}
      />
    </div>
  );
};

export default TabList;
