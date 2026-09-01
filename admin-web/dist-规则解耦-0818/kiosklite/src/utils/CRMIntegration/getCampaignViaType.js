/**
 * 根据type返回对应的活动
 * @param campaigns 营销活动
 * @param types, 数组 营销活动类型 运费券(deliveryFee) 赠品券(addItem) 满折(percentage) 满减(minus) 特价商品(setPrice)
 * @param source, 活动来源。 reward 积分活动， voucher券活动
 * @returns 根据类型过滤出的活动
 */
import { isCampaignInTypes } from './getTemplateAction';

const getCampaignViaType = ({ campaigns, types, source }) => {
  return campaigns.filter((campaign) => {
    const template = campaign.couponTemplate;
    const campaignSource = campaign.type;
    if (campaignSource !== source) return false;
    return (
      template.productLine.includes('KIOSK') &&
      isCampaignInTypes({ template, types })
    );
  });
};

export default getCampaignViaType;
