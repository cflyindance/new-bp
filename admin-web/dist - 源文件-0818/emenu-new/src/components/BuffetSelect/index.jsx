import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import { Steps, Button } from 'antd'
import { Dialog } from '@material-ui/core'
import useSystemConfig from '@/hooks/useSystemConfig'
import DishItemCount from '@/components/DishItemCount'
import InvalidBuffetModal from './InvalidBuffetModal'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { useSetMenus } from '@/hooks/useSetMenus'
import { useGlobalState } from '@/hooks/useGlobalState'
import useSendBuffetOrder from '@/hooks/useSendBuffetOrder'
import { useFetchOrder } from '@/hooks/useFetchOrder'
import { useSnackbar } from 'notistack'
import { getRestaurantHour } from '@/services/menus'
import { getBsTime } from '@/utils/getBsTime'
import { useMount } from 'ahooks'
import { useThrottleFn } from 'ahooks'
import checkBusinessTime from '@/utils/checkBusinessTime'
import { getSystemTime } from '@/services/system'
import dayjs from 'dayjs'
import { getStorageValue } from '@/utils/storage'

const BuffetSelect = (props) => {
  const {
    open,
    currentStep = 0,
    onCancel,
    onSubmit,
    isShowMask = true,
    isInOrder = false,
  } = props
  const { enqueueSnackbar } = useSnackbar()
  const { t } = useTranslation()
  const [stepIdx, setStepIdx] = useState(currentStep)
  const { allMenuItem } = useSetMenus()
  const [hourInfo, setHourInfo] = useState([])
  const [openInvalidModal, setOpenInvalidModal] = useState(false)
  const [invalidItem, setInvalidItem] = useState([])
  const [validItem, setValidItem] = useState([])
  const { runFetchOrder } = useFetchOrder()
  const [selectedType, setSelectedType] = useState(null)
  const [ageSetting, setAgeSetting] = useState([])
  const [systemTime, setSystemTime] = useState(null)
  const { getFinalConfigById } = useSystemConfig()
  const brandModeInfo = getFinalConfigById(13)
  const specialMenuInfo = getFinalConfigById(55)
  const [currentBuffetInfo] = useGlobalState('currentBuffetInfo')
  const [currentSpecialMenu] = useGlobalState('currentSpecialMenu')
  const [selectedSpecialMenu, setSelectedSpecialMenu] = useState(null)
  const [buffetNumOfGuests, setBuffetNumOfGuests] = useState(0)
  const [notCountAsGuestNumber, setNotCountAsGuestNumber] = useState(0)
  const [menuInit] = useGlobalState('menuInit')
  const [waitingMenu, setWaitingMenu] = useState(false)
  const allMenuItemRef = useRef(allMenuItem)
  const menuInitResolveRef = useRef(null)
  const menuInitPromise = useMemo(() => {
    return new Promise((resolve) => {
      menuInitResolveRef.current = resolve
    })
  }, [])

  useEffect(() => {
    allMenuItemRef.current = allMenuItem
  }, [allMenuItem])

  useEffect(() => {
    if (menuInit) {
      menuInitResolveRef?.current()
    }
  }, [menuInit])

  const tableInfo = getStorageValue('emenu_table') || {}
  const showPreviewSelect = useMemo(() => {
    const orderId = tableInfo?.currentOrder?.id
    return orderId || isInOrder
  }, [tableInfo, isInOrder, open])

  useMount(() => {
    initBsHour()
  })

  useEffect(() => {
    if (currentSpecialMenu && showPreviewSelect) {
      setSelectedSpecialMenu(currentSpecialMenu)
    }
  }, [currentSpecialMenu, showPreviewSelect])

  const initBsHour = async () => {
    const res = await getRestaurantHour()
    if (res?.hours?.length) {
      const newHours = getBsTime(res.hours)
      setHourInfo(newHours)
    }
  }

  const ages = useMemo(() => {
    return brandModeInfo?.typeSetting?.age || []
  }, [brandModeInfo])

  const types = useMemo(() => {
    return brandModeInfo?.typeSetting?.type || []
  }, [brandModeInfo])

  const businessTime = useMemo(() => {
    return brandModeInfo?.brandBusinessTime
  }, [brandModeInfo])

  const allBrandSetting = useMemo(() => {
    return brandModeInfo?.brandMeuSetting
  }, [brandModeInfo])

  const alias = useMemo(() => {
    return brandModeInfo?.alias || { age: null, type: null }
  }, [brandModeInfo])

  const isSpecialMenuOpen = useMemo(() => {
    return specialMenuInfo?.open
  }, [specialMenuInfo])

  const specialMenuList = useMemo(() => {
    if (!isSpecialMenuOpen) return []
    return (
      specialMenuInfo.specialMenu?.filter((each) => each.dishes?.length > 0) ||
      []
    )
  }, [isSpecialMenuOpen, specialMenuInfo])

  const { submitting, doSubmit } = useSendBuffetOrder(
    allBrandSetting,
    specialMenuList,
    onSubmit
  )

  const isDisableItem = useCallback(
    (type) => {
      const isExist = allBrandSetting.find((each) => each.typeBItem === type)
      if (!isExist) return true
      const currentTypeItem = allBrandSetting.filter(
        (each) =>
          each.typeBItem === type &&
          (!each.buffetId || !each.orderDishes?.length)
      )
      return currentTypeItem?.length === ages?.length
    },
    [allBrandSetting]
  )

  useEffect(() => {
    if (open) {
      runFetchOrder()
      return
    }
    setSelectedType(null)
    setAgeSetting([])
    setStepIdx(0)
  }, [runFetchOrder, open])

  useEffect(() => {
    if (!open) return
    if (ages?.length) {
      const originAges = ages.map((each) => {
        return {
          label: each,
          value: 0,
        }
      })
      if (!currentBuffetInfo?.length || !showPreviewSelect) {
        setAgeSetting(originAges)
        return
      }
      const orderedBrand = currentBuffetInfo?.map((each) => {
        const brandSetting = allBrandSetting.find(
          (brand) => brand.buffetId === each.saleItemId
        )
        return brandSetting ? { ...each, ...brandSetting } : each
      })
      const orderedType = orderedBrand?.[0]?.typeBItem
      setSelectedType(orderedType)
      const orderedAge = orderedBrand.map((each) => {
        return {
          label: each.typeAItem,
          value: each.count,
        }
      })
      const newAgeSetting = originAges.map((each) => {
        const orderedAgeValue = orderedAge?.find(
          (age) => age.label === each.label
        )?.value
        return orderedAgeValue
          ? { ...each, value: orderedAgeValue }
          : { ...each, value: 0 }
      })
      setAgeSetting(newAgeSetting)
    }
  }, [currentBuffetInfo, allBrandSetting, ages, open])

  const handleChangeCount = (num, idx) => {
    setAgeSetting(
      ageSetting.map((each, i) => {
        return idx === i ? { ...each, value: num } : each
      })
    )
  }

  const allSetNum = useMemo(() => {
    return ageSetting.reduce((pre, cur) => {
      return (pre += cur.value)
    }, 0)
  }, [ageSetting])

  const handleChangeStep = () => {
    if (!stepIdx && !allSetNum) {
      return
    }

    changeStep(!stepIdx ? stepIdx + 1 : stepIdx - 1)
  }

  const changeStep = (v) => {
    setStepIdx(v)
  }

  const { run: handleConfirmAdd } = useThrottleFn(
    async () => {
      if (!selectedType || submitting || waitingMenu) return
      if (!menuInit) {
        setWaitingMenu(true)
        await menuInitPromise
        setWaitingMenu(false)
      }
      const selectedBuffet = ageSetting
        .map((each) => {
          return {
            ...each,
            label: `${each.label}-${selectedType}`,
          }
        })
        .filter((item) => item.value)
      const buffetInfo = selectedBuffet.map((each) => {
        const buffetItemInfo = allBrandSetting?.find(
          (item) => item.itemName === each.label
        )
        return buffetItemInfo ? { ...buffetItemInfo, count: each.value } : each
      })
      // 自助餐可能被hidden 要从menuSource获取
      const filteredItem = allMenuItemRef.current.filter((each) =>
        buffetInfo.map((info) => info.buffetId).includes(each.id)
      )
      const buffetSalesItem = buffetInfo.map((each) => {
        const salesInfo = filteredItem?.find(
          (dish) => dish.id === each.buffetId
        )
        return salesInfo ? { ...each, ...salesInfo } : each
      })
      const invalidBuffet = buffetSalesItem.filter(
        (each) => !each.id && !each.buffetId
      )
      const validBuffet = buffetSalesItem.filter(
        (each) => each.id || each.buffetId
      )
      const buffetNumOfGuests = validBuffet.reduce((pre, cur) => {
        return (pre += cur.count)
      }, 0)

      const childType = allBrandSetting
        .filter((each) => each.mark === 'child')
        ?.map((item) => item.typeAItem)
      const notCountAsGuestNumber = validBuffet.reduce((pre, cur) => {
        const num = childType?.includes(cur.typeAItem) ? cur.count : 0
        return pre + num
      }, 0)

      if (invalidBuffet?.length) {
        setOpenInvalidModal(true)
        setInvalidItem(invalidBuffet)
        setValidItem(validBuffet)
        setBuffetNumOfGuests(buffetNumOfGuests)
        setNotCountAsGuestNumber(notCountAsGuestNumber)
        return
      }
      doSubmit({
        buffetSalesItem: validBuffet,
        selectedSpecialMenu,
        buffetNumOfGuests,
        notCountAsGuestNumber,
      })
    },
    { wait: 500 }
  )

  useEffect(() => {
    const fetchSystemTime = async () => {
      try {
        const res = await getSystemTime()
        setSystemTime(
          res?.data?.systemtime || dayjs().format('YYYY-MM-DD hh:mm:ss')
        )
      } catch (e) {
        console.log(e)
        setSystemTime(dayjs().format('YYYY-MM-DD hh:mm:ss'))
      }
    }
    if (types?.length && businessTime?.length && hourInfo?.length) {
      fetchSystemTime()
    }
  }, [types, businessTime, hourInfo])

  const filterTypes = useMemo(() => {
    return types?.filter((each) => {
      const currentBrandBusinessTime = businessTime?.find(
        (brandConfig) => brandConfig.name === each
      )?.businessTime
      // 未设置时默认全天
      if (!currentBrandBusinessTime?.length) return true
      // 设置营业时间后检查当前品类是否在营业时间中
      return checkBusinessTime({
        hourInfo,
        businessTime: currentBrandBusinessTime,
        systemTime,
      })
    })
  }, [types, businessTime, checkBusinessTime, hourInfo, systemTime])

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') return
    onCancel()
  }

  const handleEditSelectedSpecialMenu = (id) => {
    const isAlreadySelect = selectedSpecialMenu?.find((each) => each === id)
    if (isAlreadySelect) {
      setSelectedSpecialMenu(selectedSpecialMenu.filter((each) => each !== id))
      return
    }
    setSelectedSpecialMenu([...(selectedSpecialMenu || []), id])
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        BackdropProps={{ invisible: !isShowMask }}
        maxWidth="md"
      >
        <div className={styles.buffetSelect}>
          <div className={styles.stepHeader}>
            <Steps
              //onChange={changeStep}
              current={stepIdx}
              items={[
                {
                  title: alias.age || `${t('SystemSetting.chooseSize')}`,
                },
                { title: alias.type || `${t('SystemSetting.chooseType')}` },
              ]}
            />
          </div>
          {stepIdx === 0 && (
            <div className={styles.buffetAgeList}>
              {ageSetting.map((each, idx) => {
                return (
                  <div className={styles.buffetAgeItem} key={idx}>
                    <div className={styles.ageText}>{each.label}</div>
                    <DishItemCount
                      count={each.value || 0}
                      width={106}
                      onChange={(v) => {
                        handleChangeCount(v, idx)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
          {stepIdx === 1 &&
            (filterTypes?.length > 0 ? (
              <>
                <div className={styles.title}>
                  <div className={styles.labelDot}></div>
                  <span className={styles.titleText}>
                    {t('SystemSetting.brand_required')}
                  </span>
                  <span className={styles.titleRule}>select 1</span>
                </div>
                <div className={styles.buffetItemList}>
                  {filterTypes.map((each, i) => {
                    return (
                      <div
                        onClick={() => {
                          if (isDisableItem(each)) {
                            enqueueSnackbar(t('SystemSetting.needSet'), {
                              variant: 'warning',
                            })
                            return
                          }
                          setSelectedType(each)
                        }}
                        className={classNames(
                          styles.buffetItem,
                          selectedType === each && styles.selectedType,
                          isDisableItem(each) && styles.disabledType
                        )}
                        key={i}
                      >
                        {each}
                      </div>
                    )
                  })}
                </div>
                {specialMenuList?.length > 0 ? (
                  <>
                    <div className={styles.title}>
                      <div className={styles.labelDot}></div>
                      <span className={styles.titleText}>
                        {t('SystemSetting.brand_optional')}
                      </span>
                    </div>
                    <div className={styles.buffetItemList}>
                      {specialMenuList.map((each) => {
                        return (
                          <div
                            onClick={() =>
                              handleEditSelectedSpecialMenu(each.id)
                            }
                            className={classNames(
                              styles.buffetItem,
                              selectedSpecialMenu?.includes(each.id) &&
                                styles.selectedType
                            )}
                            key={each.id}
                          >
                            {each.name}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </>
            ) : (
              <div className={styles.notInTime}>
                {t('SystemSetting.notInTime')}
              </div>
            ))}

          <div className={styles.footerOperation}>
            <Button
              loading={submitting || waitingMenu}
              size="large"
              disabled={!allSetNum || submitting || waitingMenu}
              type="primary"
              onClick={handleChangeStep}
            >
              {stepIdx === 0
                ? `${t('SystemSetting.next')}`
                : `${t('SystemSetting.prev')}`}
            </Button>
            {stepIdx === 1 && (
              <Button
                loading={submitting || waitingMenu}
                size="large"
                disabled={!selectedType || submitting || waitingMenu}
                type="primary"
                onClick={handleConfirmAdd}
              >
                {t('ChooseLicense.confirm')}
              </Button>
            )}
            <Button
              loading={submitting || waitingMenu}
              disabled={submitting || waitingMenu}
              size="large"
              onClick={() => onCancel()}
            >
              {t('AdminSetting.btn_cancel')}
            </Button>
          </div>
        </div>
      </Dialog>
      <InvalidBuffetModal
        isAllInvalid={validItem?.length === 0}
        invalidItem={invalidItem}
        open={openInvalidModal}
        onCancel={() => setOpenInvalidModal(false)}
        sendOrder={() =>
          doSubmit({
            buffetSalesItem: validItem,
            selectedSpecialMenu,
            buffetNumOfGuests,
            notCountAsGuestNumber,
          })
        }
        submitting={submitting}
      />
    </>
  )
}

export default BuffetSelect
