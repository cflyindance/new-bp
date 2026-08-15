import useSystemConfig from '@/hooks/useSystemConfig'
import CrmIntegrationRewardItemsDialog from '@/components/CrmIntegrationRewardItemsDialog'
import MemberRedemptionCenter from '@/components/MemberRedemptionCenter'
import useCrmIntegrationRedemptionController from '@/hooks/useCrmIntegrationRedemptionController'
import OrderPage from './Order'
import EmenuProOrder from './components/emenuProOrder'

const Order = () => {
  const { getFinalConfigById } = useSystemConfig()
  const isEmenuProMenu = getFinalConfigById(63)?.open
  const crmIntegrationRedemption = useCrmIntegrationRedemptionController()

  return (
    <>
      {isEmenuProMenu ? (
        <EmenuProOrder crmIntegrationRedemption={crmIntegrationRedemption} />
      ) : (
        <OrderPage crmIntegrationRedemption={crmIntegrationRedemption} />
      )}
      <MemberRedemptionCenter
        crmIntegrationRedemption={crmIntegrationRedemption}
      />
      <CrmIntegrationRewardItemsDialog
        reward={crmIntegrationRedemption.rewardDialog}
        onClose={crmIntegrationRedemption.closeRewardDialog}
        onSelect={crmIntegrationRedemption.selectBenefit}
        onBeforeConfirm={crmIntegrationRedemption.validateBenefitBeforePending}
      />
    </>
  )
}

export default Order
