import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import {
  ClearRounded as ClearIcon,
  ShoppingCartRounded as ShoppingCartIcon,
} from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'
import { getStorageValue } from '@/utils/storage'
import TabPanel from '../common/TabPanel'
import PendingOrders from './PendingOrders'
import SentOrders from './SentOrders'
import { useBoolean, useRequest } from 'ahooks'
import { fetchCompanyProfile } from '@/services/system'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import LoadingOverlay from '../common/LoadingOverlay'
import { createPortal } from 'react-dom'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
    width: 440,
    maxWidth: '100vw',
    overflow: 'hidden',
    borderTopLeftRadius: theme.shape.borderRadius * 2,
    borderBottomLeftRadius: theme.shape.borderRadius * 2,
  },
  cartIcon: {
    color: theme.palette.common.white,
    backgroundColor: theme.palette.secondary.main,
    pointerEvents: 'none',
  },
  tableName: {
    marginLeft: 4,
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  divider: {
    transform: 'translateY(-2px)',
  },
  tabs: {
    minHeight: 26,
  },
  tabsScroller: {
    backgroundColor: theme.palette.common.white,
  },
  tabsIndicator: {
    height: 3,
    borderRadius: theme.shape.borderRadius,
    // transition: 'none',
  },
  tab: {
    marginRight: theme.spacing(4),
    padding: '8px 0',
    minWidth: 0,
    fontWeight: 700,
    fontSize: 18,
    minHeight: 21,
    lineHeight: 1,
    letterSpacing: -0.4,
    color: '#828282',
    opacity: 1,
  },
  tabWrapper: {
    marginBottom: 3,
  },
  tabSelected: {
    color: '#333',
  },
  orderPlacingOverlay: {
    zIndex: theme.zIndex.modal + 1,
  },
}))

function ShoppingCart({ isOpen, handleClose }) {
  const classes = useStyles()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(0)
  const [cart] = useGlobalState('Cart')
  const tableInfo = getStorageValue('emenu_table', {})
  const [, setPosVersion] = useLocalStorage('posVersion', {})
  const { currentArea, currentTable } = tableInfo
  const orderId = useMemo(() => tableInfo?.currentOrder?.id, [tableInfo])
  const displayTable = useMemo(
    () =>
      currentArea?.id && currentTable?.id
        ? `${currentArea?.name} ${currentTable?.name}`
        : '',
    [currentArea, currentTable]
  )

  useEffect(async () => {
    setActiveTab(0)
  }, [cart])

  // 购物车中检查pos 版本
  const { run: runFetchCompanyProfile } = useRequest(fetchCompanyProfile, {
    manual: true,
    throttleWait: 5000,
    // ready: isEmpty(companyInfo),
    onSuccess: (result) => {
      setPosVersion(result.company.appInfo.version)
    },
  })

  const [isOrderPlacing, { set: toggleOrderPlaceStatus }] = useBoolean()
  useEffect(() => {
    if (isOpen) {
      runFetchCompanyProfile()
      toggleOrderPlaceStatus(false)
    }
  }, [isOpen])

  return (
    <>
      <Drawer
        anchor="right"
        classes={{ paper: classes.root }}
        open={isOpen}
        onClose={handleClose}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={3}
        >
          <Box display="flex" alignItems="center">
            <IconButton className={classes.cartIcon} disableRipple>
              <ShoppingCartIcon fontSize="small" />
            </IconButton>
            <Typography
              variant="subtitle2"
              color="primary"
              component="strong"
              className={classes.tableName}
            >
              {displayTable}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <ClearIcon />
          </IconButton>
        </Box>
        <Tabs
          value={activeTab}
          indicatorColor="primary"
          onChange={(e, v) => setActiveTab(v)}
          classes={{
            root: classes.tabs,
            scroller: classes.tabsScroller,
            indicator: classes.tabsIndicator,
          }}
        >
          {['pending_orders', 'sent_orders'].map((e, i) => (
            <Tab
              key={i}
              label={t(`ShoppingCart.${e}`)}
              disabled={e === 'sent_orders' && !orderId}
              classes={{
                root: classes.tab,
                wrapper: classes.tabWrapper,
                selected: classes.tabSelected,
              }}
            />
          ))}
        </Tabs>
        <Divider className={classes.divider} />
        <TabPanel value={activeTab} index={0}>
          <PendingOrders
            jumpTab={setActiveTab}
            handleClose={handleClose}
            toggleOrderPlaceStatus={toggleOrderPlaceStatus}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <SentOrders />
        </TabPanel>
      </Drawer>
      {createPortal(
        <LoadingOverlay
          loading={isOrderPlacing}
          className={classes.orderPlacingOverlay}
        >
          <span>{t('ShoppingCart.order_placing')}</span>
        </LoadingOverlay>,
        document.body
      )}
    </>
  )
}

export default ShoppingCart
