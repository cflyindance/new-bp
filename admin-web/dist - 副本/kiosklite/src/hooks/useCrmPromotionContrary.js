import {
  isHasCRMCampaignFn,
  isHasPromotionFn,
} from '@/utils/CRMIntegration/crmPromotionContrary';
import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { changeCrmPromotionContraryInfo } from '@/actions/promotion';

const useCrmPromotionContrary = () => {
  const currentOrder = useSelector((state) => state.currentOrder);
  const crm = useSelector((state) => state.crm);
  const promotion = useSelector((state) => state.promotion);
  const dispatch = useDispatch();

  const itemList = useMemo(() => {
    return currentOrder.itemList || [];
  }, [currentOrder]);

  const handleCheckIsHasPromotion = () => {
    const promotionReward = isHasPromotionFn({
      promotion,
      itemList,
    });
    if (promotionReward) {
      dispatch(
        changeCrmPromotionContraryInfo({
          visible: true,
          type: 'promotion',
          content: promotionReward,
        })
      );
      return true;
    }
    return false;
  };

  const handleCheckIsHasCampaign = () => {
    const { selectedFreeItem, selectedDiscount } = crm;
    const crmCampaignItem = isHasCRMCampaignFn({
      itemList,
      selectedFreeItem,
      selectedDiscount,
    });
    if (crmCampaignItem) {
      dispatch(
        changeCrmPromotionContraryInfo({
          visible: true,
          type: 'crm',
          content: crmCampaignItem,
        })
      );
      return true;
    }
    return false;
  };

  return {
    handleCheckIsHasCampaign,
    handleCheckIsHasPromotion,
  };
};

export default useCrmPromotionContrary;
