import { Dialog } from '@material-ui/core'
import styles from './MenuClassify.module.less'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import { useGlobalState } from '@/hooks/useGlobalState'
import Toast from '@/components/Toast'
import { getRestaurantHour } from '@/services/menus'
import { getBsTime } from '@/utils/getBsTime'
import { useBoolean, useMount } from 'ahooks'
import checkBusinessTime from '@/utils/checkBusinessTime'
import BuffetSelect from '@/components/BuffetSelect'
import { getSystemTime } from '@/services/system'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { setStorageValue } from '@/utils/storage'

const MenuClassify = (props) => {
  const {
    open,
    onCancel,
    onclose,
    setOpenPickSize,
    onSubmitBuffet,
    isShowMask = true,
    isInOrder = false,
  } = props
  const [hourInfo, setHourInfo] = useState([])
  const { t } = useTranslation()
  const { getFinalConfigById } = useSystemConfig()
  const menuClassifyInfo = getFinalConfigById(52)
  const brandCategoryInfo = getFinalConfigById(13)
  const isNeedSelectGuest = getFinalConfigById(11)?.open
  const [selectedType, setSelectedType] = useState(null)
  const [systemTime, setSystemTime] = useState(null)
  const [
    openBuffetSelect,
    { setTrue: setOpenBuffetSelect, setFalse: setCloseBuffetSelect },
  ] = useBoolean()
  const [menuClassify, setMenuClassify] = useGlobalState('selectedMenuClassify')

  const navigate = useNavigate()

  useMount(() => {
    initBsHour()
  })

  const initBsHour = async () => {
    const res = await getRestaurantHour()
    if (res?.hours?.length) {
      const newHours = getBsTime(res.hours)
      setHourInfo(newHours)
    }
  }

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
    if (
      hourInfo?.length &&
      menuClassifyInfo?.open &&
      menuClassifyInfo?.menuClassifySetting?.length
    ) {
      fetchSystemTime()
    }
  }, [menuClassifyInfo, hourInfo])

  const menuClassifySetting = useMemo(() => {
    if (
      !hourInfo?.length ||
      !menuClassifyInfo?.open ||
      !menuClassifyInfo?.menuClassifySetting?.length ||
      !systemTime
    )
      return []
    // 根据营业时间过滤
    return (
      menuClassifyInfo.menuClassifySetting?.filter((each) => {
        const currentClassifyBusinessTime = each.businessTime
        if (!currentClassifyBusinessTime?.length) return true
        return checkBusinessTime({
          hourInfo,
          businessTime: currentClassifyBusinessTime,
          systemTime,
        })
      }) || []
    )
  }, [menuClassifyInfo, hourInfo, checkBusinessTime, systemTime])

  const categoryModeName = useMemo(() => {
    return brandCategoryInfo?.open
      ? brandCategoryInfo.categoryModeName || '自助餐'
      : null
  }, [brandCategoryInfo])

  const displayMenuClassify = useMemo(() => {
    return categoryModeName && !isInOrder
      ? menuClassifySetting.concat({
          name: categoryModeName,
          id: 'emenuBrandModeId',
        })
      : menuClassifySetting
  }, [menuClassifySetting, categoryModeName])

  const handleConfirm = () => {
    if (!selectedType) return
    if (selectedType.id === 'emenuBrandModeId') {
      setMenuClassify(null)
      onclose()
      setOpenBuffetSelect()
      return
    }
    setMenuClassify(selectedType.id)
    onclose()
    if (!isInOrder) {
      if (isNeedSelectGuest) {
        setOpenPickSize()
      } else {
        setStorageValue('emenu_partySize', 1)
        navigate('/order')
      }
    }
  }

  const handleClose = () => {
    onCancel()
  }

  const isDisableItem = (each) => {
    if (each.id === 'emenuBrandModeId') return false
    return each.allowedOrderDish?.length <= 0
  }

  const onCancelSelect = () => {
    setCloseBuffetSelect()
    handleClose()
  }

  useEffect(() => {
    if (menuClassify && isInOrder && open) {
      const menuClassifyData = displayMenuClassify.find(
        (each) => each.id === menuClassify
      )
      if (menuClassifyData) {
        setSelectedType(menuClassifyData)
      }
    }
  }, [menuClassify, isInOrder, open])

  return (
    <>
      <Dialog open={open} BackdropProps={{ invisible: !isShowMask }}>
        <div className={styles.menuClassifyWrapper}>
          <div className={styles.titleHeader}>
            {t('menuClassify.please_select')}
          </div>
          {displayMenuClassify?.length > 0 ? (
            <div className={styles.menuClassifyList}>
              {displayMenuClassify?.map((each) => {
                return (
                  <div
                    onClick={() => {
                      if (isDisableItem(each)) {
                        Toast.error(t('SystemSetting.needSet'))
                        return
                      }
                      setSelectedType(each)
                    }}
                    key={each.id}
                    className={classNames(
                      styles.menuClassifyItem,
                      selectedType === each && styles.selectedType,
                      isDisableItem(each) && styles.disabledType
                    )}
                  >
                    {each.name}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={styles.notInTime}>
              {t('SystemSetting.notInTime')}
            </div>
          )}

          <div className={styles.footerOperation}>
            <Button size="large" type="primary" onClick={handleConfirm}>
              {t('ChooseLicense.confirm')}
            </Button>
            <Button size="large" onClick={handleClose}>
              {t('AdminSetting.btn_cancel')}
            </Button>
          </div>
        </div>
      </Dialog>
      <BuffetSelect
        open={openBuffetSelect}
        isShowMask={false}
        onCancel={onCancelSelect}
        onSubmit={onSubmitBuffet}
      />
    </>
  )
}

export default MenuClassify
