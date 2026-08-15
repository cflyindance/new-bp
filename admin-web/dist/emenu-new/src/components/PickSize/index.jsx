import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Box, Dialog, makeStyles, Typography } from '@material-ui/core'
import StyledButton from '../common/StyledButton'
import {
  generateOrder,
  saveOrder,
  getChargeList,
  dealTimeAlert,
} from '@/services/orders'
import { getStorageValue } from '@/utils/storage'
import { useGlobalState } from '@/hooks/useGlobalState'
import { nanoid } from 'nanoid'
import useGetDefaultDish from '@/hooks/useGetDefaultDish'
import useGetUserId from '@/hooks/useGetUserId'
import { listTaxes } from '@/services/system'
import useSystemConfig from '@/hooks/useSystemConfig'

const useStyles = makeStyles((theme) => ({
  form: {
    padding: theme.spacing(4),
    width: 368,
    // height: 450,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.common.white,
  },
  title: {
    // width: 264,
    // height: 72,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: -0.6,
  },
  logo: {
    width: 40,
    height: 40,
    // marginLeft: theme.spacing(1),
    // verticalAlign: 'text-top',
  },
  desc: {
    fontSize: 18,
    fontWeight: 590,
    lineHeight: 1.2,
    letterSpacing: -0.4,
    margin: theme.spacing(3, 0, 2),
  },
  sizes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridAutoRows: '1fr',
    gridColumnGap: theme.spacing(2),
    gridRowGap: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  sizeItem: {
    width: 48,
    height: 48,
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    justifyContent: 'center',
    display: 'flex',
    alignItems: 'center',
  },
  sizeBtn: {
    fontSize: 16,
    fontWeight: 600,
  },
  btn: {
    width: 144,
    height: 53,
    fontSize: 18,
    fontWeight: 600,
  },
}))

function PickSize({
  open,
  sizes = 12,
  name,
  onCancel,
  onSubmit,
  selectedNum = 0,
  isShowMask = true,
}) {
  const classes = useStyles()
  const [, setPartySize] = useLocalStorage('emenu_partySize', 0)
  const [active, setActive] = useState(0)
  const { getUserId } = useGetUserId()
  const [orders] = useGlobalState('Orders')

  const { t } = useTranslation()
  const { defaultDish, defaultDishIds } = useGetDefaultDish()
  const [cart, setCart] = useGlobalState('Cart')
  const [, setStoragedCart] = useLocalStorage('emenu_cart', [])
  const { getFinalConfigById } = useSystemConfig()
  const isOpenDuration = getFinalConfigById(5)?.open
  const durationTime = getFinalConfigById(5)?.duration
  const isOpenAlert = getFinalConfigById(14)?.open
  const alertTime = getFinalConfigById(14)?.restTimeAlert
  const [, setIsUpdatingPartySize] = useGlobalState('isUpdatingPartySize')

  const handleInitPartySize = () => {
    const numOfGuests =
      getStorageValue('emenu_table')?.currentOrder?.numOfGuests
    setActive(selectedNum || numOfGuests || 0)
  }

  useEffect(() => {
    if (open) {
      handleInitPartySize()
    }
  }, [open])

  // 取消时不记录用餐人数
  const handleCancel = () => {
    handleInitPartySize()
    onCancel()
  }

  const selectSize = (e) => () => {
    setActive(e)
  }

  const handleAddDefaultDish = (active) => {
    if (!defaultDish?.length) return
    // 顾客下单菜品
    const customerDish = cart.filter(
      (each) => !defaultDishIds.includes(each.id)
    )
    const addDish = defaultDish.map((each) => {
      return {
        ...each,
        key: nanoid(),
        count: active,
        realBenefitPrice: each?.benefitPrice,
      }
    })
    const newCart = [...customerDish, ...addDish]
    setCart(newCart)
    setStoragedCart(newCart)
  }

  const handleSubmit = async (e) => {
    setPartySize(active)
    onSubmit(active)
    handleAddDefaultDish(active)
    if (orders?.[0]?.id) {
      setIsUpdatingPartySize(true)
      await saveNumber()
      setIsUpdatingPartySize(false)
    }
    e.preventDefault()
  }

  const saveNumber = async () => {
    try {
      const taxList = await listTaxes()
      const res = await getChargeList()
      const timeAlert = dealTimeAlert(
        { isOpenAlert, alertTime },
        { isOpenDuration, durationTime }
      )

      const order = generateOrder({
        order: {
          ...orders?.[0],
          chargeInfo: res.charge,
          taxes: taxList.taxes,
          ...timeAlert,
        },
        prevOrder: {},

        isResendOrder: true,
        userId: getUserId(),
      })
      await saveOrder({ order })
    } catch (error) {
      console.log(error)
    }
  }

  const SizeList = (
    <Box className={classes.sizes}>
      {Array.from({ length: sizes }, (_, i) => i + 1).map((e) => (
        <Box
          key={e}
          className={classes.sizeItem}
          onClick={selectSize(e)}
          style={{
            color: `${active === e ? '#96272F' : 'rgba(0, 0, 0, 0.87)'}`,
            borderColor: `${active === e ? '#96272F' : '#e0e0e0'}`,
          }}
        >
          <div className={classes.sizeBtn}>{e}</div>
        </Box>
      ))}
    </Box>
  )

  return (
    <Dialog open={open} BackdropProps={{ invisible: !isShowMask }}>
      <form className={classes.form} onSubmit={handleSubmit}>
        <Box display="flex" alignItems="flex-end">
          <Typography variant="h4" className={classes.title}>
            {t('PickSize.title', { name })}
          </Typography>
          {/* <img
          className={classes.logo}
          src={logo}
          alt="Logo"
          width={40}
          height={40}
        /> */}
        </Box>
        <Typography className={classes.desc}>{t('PickSize.desc')}</Typography>
        {SizeList}
        <Box display="flex" justifyContent="space-between">
          <StyledButton
            variant="outlined"
            // color="primary"
            className={classes.btn}
            onClick={handleCancel}
          >
            {t('PickSize.btn_cancel')}
          </StyledButton>
          <StyledButton
            type="submit"
            variant="contained"
            color="primary"
            className={classes.btn}
            disabled={!active}
          >
            {t('PickSize.btn_continue')}
          </StyledButton>
        </Box>
      </form>
    </Dialog>
  )
}

export default PickSize
