import LargeContent from './LargeContent'
import SmallContent from './SmallContent'
import { useBoolean } from 'ahooks'
import DishDialog from '@/components/DishDialog'
import BuffetViewOnlyModal from '@/components/BuffetViewOnlyModal'
import React, { memo, useMemo, useState } from 'react'
import useShowBenefitPrice from '@/hooks/useShowBenefitPrice'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useGlobalState } from '@/hooks/useGlobalState'
import { shouldHideDishDialogPrice } from '@/utils/crmIntegrationRewards'

const NormalItemContent = (props) => {
  const {
    id,
    name,
    desc,
    price,
    itemPrices,
    taxIds,
    pic,
    comboType,
    optionList,
    changeCart,
    buffetViewOnly = false,
    benefitPrice,
    itemMax,
    checkDish,
    rewardRule,
    isSpecial = false,
    menuTitleFontSize,
    isNeedPasswordAuth,
    marketPriceItem,
  } = props
  const [openDishDialog, { setTrue, setFalse }] = useBoolean()
  const [disableBtn, setDisableBtn] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [, setOrderAdminPermission] = useGlobalState('orderAdminPermission')
  const { showPrice, actualBenefitPrice, isHasBenefitPrice, isShowPrice } =
    useShowBenefitPrice({
      price,
      itemPrices,
      benefitPrice,
      optionList,
      marketPriceItem,
    })

  const { getFinalConfigById } = useSystemConfig()
  const displayDishDetailsConfig = getFinalConfigById(27)
  const displayDishNote = getFinalConfigById(28)
  const restrictRedeemItem = getFinalConfigById(33)
  const isOpenSpecialDishPermission = getFinalConfigById(36)?.open //有没有开启可看不可见的配置参数
  const isSpecialDishServePermission = getFinalConfigById(49)?.open //有没有开启弹出服务员权限谈款
  const isShowDisplayNote = useMemo(() => {
    const isOpen = displayDishNote?.open
    if (!isOpen) return false
    const openList = displayDishNote?.displayDishNote
    return openList.includes(id)
  }, [displayDishNote, id])

  // 是否需要权限兑换菜品
  const isNeedPermissionToRedeem = useMemo(() => {
    if (!restrictRedeemItem?.open || !rewardRule) return false
    const configDishIds = restrictRedeemItem.restrictRedeemItem
    return configDishIds.includes(id)
  }, [restrictRedeemItem, id, rewardRule])

  const showPermissionModal = (next) => {
    setOrderAdminPermission({
      open: true,
      permission: 'errorMsg',
      next,
    })
  }
  const setDisable = (params) => {
    setDisableBtn(params)
  }

  const isDisplayDishDetails = useMemo(
    () =>
      displayDishDetailsConfig?.open &&
      displayDishDetailsConfig.showDishDetail?.includes(id),
    [displayDishDetailsConfig, id]
  )

  return (
    <>
      {props.showLarge ? (
        <LargeContent
          {...props}
          setOpenModal={setOpenModal}
          setTrue={setTrue}
          setDisable={setDisable}
          showPrice={showPrice}
          actualBenefitPrice={actualBenefitPrice}
          isHasBenefitPrice={isHasBenefitPrice}
          isDisplayDishDetails={isDisplayDishDetails}
          displayDishNote={displayDishNote}
          isShowDisplayNote={isShowDisplayNote}
          checkDish={checkDish}
          isNeedPermissionToRedeem={isNeedPermissionToRedeem}
          isSpecial={isSpecial}
          isOpenSpecialDishPermission={isOpenSpecialDishPermission}
          isSpecialDishServePermission={isSpecialDishServePermission}
          showPermissionModal={showPermissionModal}
          menuTitleFontSize={menuTitleFontSize}
          isNeedPasswordAuth={isNeedPasswordAuth}
          isShowPrice={isShowPrice}
        />
      ) : (
        <SmallContent
          {...props}
          setOpenModal={setOpenModal}
          setTrue={setTrue}
          setDisable={setDisable}
          showPrice={showPrice}
          actualBenefitPrice={actualBenefitPrice}
          isHasBenefitPrice={isHasBenefitPrice}
          isDisplayDishDetails={isDisplayDishDetails}
          displayDishNote={displayDishNote}
          isShowDisplayNote={isShowDisplayNote}
          checkDish={checkDish}
          isNeedPermissionToRedeem={isNeedPermissionToRedeem}
          isSpecial={isSpecial}
          isOpenSpecialDishPermission={isOpenSpecialDishPermission}
          isSpecialDishServePermission={isSpecialDishServePermission}
          showPermissionModal={showPermissionModal}
          menuTitleFontSize={menuTitleFontSize}
          isNeedPasswordAuth={isNeedPasswordAuth}
          isShowPrice={isShowPrice}
        />
      )}
      <DishDialog
        data={{
          id,
          name,
          desc,
          disableBtn,
          price,
          itemPrices,
          taxIds,
          pic,
          comboType,
          optionList,
          buffetViewOnly,
          benefitPrice,
          itemMax,
          isSpecial,
          isOpenSpecialDishPermission,
          isSpecialDishServePermission,
          marketPriceItem,
        }}
        open={openDishDialog}
        showPermissionModal={showPermissionModal}
        onSubmit={(data) => {
          // 有详情，需要权限的兑换菜
          if (rewardRule && isNeedPermissionToRedeem) {
            showPermissionModal(() => changeCart(data))
            return
          }
          changeCart(data)
        }}
        onClose={setFalse}
        isShowDisplayNote={isShowDisplayNote}
        isNeedPasswordAuth={isNeedPasswordAuth}
        hidePrice={shouldHideDishDialogPrice({
          rewardRule,
          crmIntegrationHideDetailPrice: props.crmIntegrationHideDetailPrice,
        })}
      />
      <BuffetViewOnlyModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  )
}

export default memo(NormalItemContent)
