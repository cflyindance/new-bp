import React, { forwardRef, useImperativeHandle } from 'react';
import useAddOnPromotion from '@/hooks/useAddOnPromotion';
import ItemsDrawer from '@/component/RewardCenter/ItemsDrawer';

/**
 * 促销凑单功能组件
 * 封装了 useAddOnPromotion hooks，可以在类组件中使用
 */
const AddOnPromotion = forwardRef((props, ref) => {
  const {
    onSkip,
    onClose,
    isGiftPromotionAutoOpenRewardModal,
    promotionCenterList,
  } = props;

  const {
    drawerProps,
    goAddOnPromotion,
    handleCloseDrawer,
    handleDrawerConfirm,
  } = useAddOnPromotion({
    onSkip,
    onClose,
    isGiftPromotionAutoOpenRewardModal,
    promotionCenterList,
  });

  // 通过 ref 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    drawerProps,
    goAddOnPromotion,
    handleCloseDrawer,
    handleDrawerConfirm,
  }));

  return (
    <ItemsDrawer
      {...drawerProps}
      onClose={handleCloseDrawer}
      handleConfirm={handleDrawerConfirm}
    />
  );
});

AddOnPromotion.displayName = 'AddOnPromotion';

export default AddOnPromotion;
