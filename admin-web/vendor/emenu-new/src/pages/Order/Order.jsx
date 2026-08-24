import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { makeStyles } from '@material-ui/core/styles'
import { useSetMenus } from '@/hooks/useSetMenus'
import TopBar from '@/components/TopBar'
import useSystemConfig from '@/hooks/useSystemConfig'
import OrderListWrapper from './components/OrderListWrapper'
import OldOrderPage from '@/components/OldOrderPage'
import CRMBanner from '@/components/CRMLogin/Banner'
import { useGlobalState } from '@/hooks/useGlobalState'
import getRewardItemByRules from '@/utils/getRewardItemByRules'
import LoadingOverlay from '@/components/common/LoadingOverlay'
import Poster from '@/components/Poster'
import Lottery from '@/components/Lottery'
import EmptyOrder from './components/EmptyOrder'
import { cloneDeep } from 'lodash-es'
import { META_ITEM_GROUP } from '@/constants'

const AdminLogin = lazy(() => import('@/components/AdminLogin'))

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexFlow: 'column',
    width: '100%',
    height: '100%',
    backgroundColor: '#1A2241',
    position: 'relative',
  },
  openPoster: {
    position: 'absolute',
    top: 135,
    right: 0,
    maxWidth: 200,
    padding: '8px 16px',
    color: '#fff',
    background: '#96272f',
    borderRadius: '100px 0px 0px 100px',
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 1,
    display: 'box',
    lineClamp: 2,
    boxOrient: 'vertical',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
})

function Order({ crmIntegrationRedemption }) {
  const { t } = useTranslation()
  const classes = useStyles()
  // 全部菜单数据
  const { allMenus, saleItems } = useSetMenus()
  const { getFinalConfigById } = useSystemConfig()
  const {
    benefitDisabledOverride: crmIntegrationBenefitDisabledOverride,
    handleBenefitSelect: handleCrmIntegrationBenefitSelect,
    handlePointItemBeforeAdd: handleCrmIntegrationPointItemBeforeAdd,
    handlePointItemChange: handleCrmIntegrationPointItemChange,
    openRewardDialog: openCrmIntegrationRewardDialog,
    pointItemGlobalLocked: crmIntegrationPointItemGlobalLocked,
    redeemMenu: crmIntegrationRedeemMenu,
    selectedBenefitId: selectedCrmIntegrationBenefitId,
  } = crmIntegrationRedemption

  const isLazyLoading = getFinalConfigById(23)?.open
  const posterInfo = getFinalConfigById(56)
  const isBrandOpen = getFinalConfigById(13)?.open
  const lotteryConfig = getFinalConfigById(88)
  const [keyword, setKeyword] = useState('')
  const [, setPosterConfig] = useGlobalState('poster')

  const [crmRewardRules] = useGlobalState('crmRewardRules')
  const [orderAdminPermission, setOrderAdminPermission] = useGlobalState(
    'orderAdminPermission'
  )
  const [orders] = useGlobalState('Orders')
  const orderId = useMemo(() => orders?.[0]?.id, [orders])

  const noHiddenItem = useMemo(() => {
    return saleItems.current?.map((each) => ({
      ...each,
      hidden: false,
    }))
  }, [saleItems.current])

  const isPosterOpen = useMemo(() => {
    return posterInfo?.open && posterInfo?.posterAds?.[0]
  }, [posterInfo])

  const isShowPosterButton = useMemo(() => {
    return isPosterOpen ? posterInfo?.displayButton : false
  }, [isPosterOpen])

  useEffect(() => {
    if (isPosterOpen) {
      setPosterConfig({
        open: true,
      })
    }
  }, [isPosterOpen])

  const closeAdminLogin = () => {
    setOrderAdminPermission({
      open: false,
      permission: '',
      next: () => {},
    })
  }

  // useEffect(() => {
  //   if (prePartySize && !isNeedSelectGuest) {
  //     setStorageValue('emenu_partySize', 1)
  //   }
  // }, [isNeedSelectGuest, prePartySize])

  const handleSearch = (keyword) => {
    setKeyword(keyword)
  }

  const crmFreeItem = useMemo(() => {
    if (crmRewardRules.length > 0) {
      const freeItemRule = crmRewardRules.filter(
        (each) => each.redeemRule.strategy === 'byFreeItem'
      )
      const ruleItems = getRewardItemByRules(freeItemRule, noHiddenItem)
      const items = ruleItems
        .map((rule) => rule.items)
        .flat()
        ?.map((item) => {
          let originalPrice = item.price ?? 0
          if (item.itemPrices) {
            originalPrice = cloneDeep(item.itemPrices).sort(
              (a, b) => a.price - b.price
            )?.[0]?.price
          }
          return {
            ...item,
            // 积分兑换菜品，只能兑换主菜，无法兑换子菜
            optionList: [],
            comboList: [],
            itemPrices: [],
            price: 0,
            // 混合模式下展示小图
            large: false,
            showLarge: false,
            itemMax: 1,
            benefitPrice: undefined,
            realBenefitPrice: undefined,
            freeItemOriginalPrice: originalPrice ?? 0,
            freeItemDiscount: originalPrice ?? 0,
          }
        })
      return {
        id: 'crm-point-item',
        expand: true,
        hidden: false,
        list: [
          {
            id: 'crm-point-item',
            hidden: false,
            list: items,
          },
        ],
      }
    }
    return {}
  }, [crmRewardRules, noHiddenItem])

  const menuWithCrm = useMemo(() => {
    if (allMenus.length) {
      if (Object.keys(crmIntegrationRedeemMenu)?.length) {
        return [crmIntegrationRedeemMenu, ...allMenus]
      }
      if (Object.keys(crmFreeItem)?.length) {
        return [crmFreeItem, ...allMenus]
      }
      return allMenus
    }
    return []
  }, [allMenus, crmIntegrationRedeemMenu, crmFreeItem])

  const baseMenu = useMemo(() => {
    return menuWithCrm.filter(
      (group) =>
        group.name !== 'ALL_YOU_CAN_EAT' &&
        group.name !== META_ITEM_GROUP &&
        !group.hidden
    )
  }, [menuWithCrm])

  const isHasMenu = useMemo(() => {
    if (!isBrandOpen) return baseMenu?.length > 0
    return orderId ? baseMenu?.length > 0 : true
  }, [isBrandOpen, baseMenu, orderId])

  return (
    <div className={classes.root}>
        <TopBar onSearch={handleSearch} />
        <CRMBanner />
        {isShowPosterButton ? (
          <div
            onClick={() =>
              setPosterConfig({
                open: true,
              })
            }
            className={classes.openPoster}
          >
            {t('button', { ns: 'Poster' })}
          </div>
        ) : null}
        {isHasMenu ? (
          isLazyLoading ? (
            <OrderListWrapper
            keyword={keyword}
            baseMenu={baseMenu}
            onCrmIntegrationRewardClick={openCrmIntegrationRewardDialog}
            onCrmIntegrationBenefitSelect={handleCrmIntegrationBenefitSelect}
            crmIntegrationBenefitDisabledOverride={
              crmIntegrationBenefitDisabledOverride
            }
            onCrmIntegrationPointItemChange={
              handleCrmIntegrationPointItemChange
            }
            onCrmIntegrationPointItemBeforeAdd={
              handleCrmIntegrationPointItemBeforeAdd
            }
            crmIntegrationPointItemGlobalLocked={
              crmIntegrationPointItemGlobalLocked
            }
            selectedCrmIntegrationBenefitId={selectedCrmIntegrationBenefitId}
            />
          ) : (
            <OldOrderPage
            keyword={keyword}
            baseMenu={baseMenu}
            onCrmIntegrationRewardClick={openCrmIntegrationRewardDialog}
            onCrmIntegrationBenefitSelect={handleCrmIntegrationBenefitSelect}
            crmIntegrationBenefitDisabledOverride={
              crmIntegrationBenefitDisabledOverride
            }
            onCrmIntegrationPointItemChange={
              handleCrmIntegrationPointItemChange
            }
            onCrmIntegrationPointItemBeforeAdd={
              handleCrmIntegrationPointItemBeforeAdd
            }
            crmIntegrationPointItemGlobalLocked={
              crmIntegrationPointItemGlobalLocked
            }
            selectedCrmIntegrationBenefitId={selectedCrmIntegrationBenefitId}
            />
          )
        ) : (
          <EmptyOrder />
        )}
      <Poster />
      {lotteryConfig?.open ? <Lottery {...lotteryConfig} /> : null}
      <Suspense fallback={<LoadingOverlay loading={true} />}>
        <AdminLogin
          isOpen={orderAdminPermission.open}
          handleClose={closeAdminLogin}
          permission={orderAdminPermission.permission}
          next={orderAdminPermission.next}
        />
      </Suspense>
    </div>
  )
}

export default Order
