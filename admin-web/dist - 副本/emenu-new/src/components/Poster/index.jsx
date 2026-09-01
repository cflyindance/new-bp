import { Button, Dialog } from '@material-ui/core'
import useSystemConfig from '@/hooks/useSystemConfig'
import React, { useEffect, useMemo } from 'react'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import styles from './index.module.less'
import CancelIcon from '@material-ui/icons/Cancel'
import { useTranslation } from 'react-i18next'
import { useGlobalState } from '@/hooks/useGlobalState'

const Poster = () => {
  const { t } = useTranslation()

  const [posterConfig, setPosterConfig] = useGlobalState('poster')

  const { getFinalConfigById } = useSystemConfig()
  const posterInfo = getFinalConfigById(56)

  const posterSrc = useMemo(() => {
    return posterInfo?.posterAds?.[0]
  }, [posterInfo])

  const onClose = (closeType = 0) => {
    switch (closeType) {
      case 0:
        posterConfig.closeNext?.()
        setPosterConfig({
          open: false,
        })
        break
      case 1:
        posterConfig.orderNext?.()
        break
      default:
        setPosterConfig({
          open: false,
        })
        break
    }
  }

  useEffect(() => {
    return () => {
      setPosterConfig({
        open: false,
      })
    }
  }, [])

  return (
    <Dialog
      open={posterConfig.open}
      PaperProps={{
        style: {
          width: 'auto',
          height: 'auto',
          maxWidth: 'none',
          maxHeight: 'none',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <div className={styles.posterWrapper}>
        <ImgFallback
          src={serverUrl + `${posterSrc}`}
          className={styles.posterImage}
          alt="poster"
        />
        {posterConfig.posterBeforeOrder ? (
          <div className={styles.posterActions}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => onClose(0)}
            >
              {t('Order.order_wait')}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => onClose(1)}
            >
              {t('Order.order_immediate')}
            </Button>
          </div>
        ) : (
          <CancelIcon className={styles.closeBtn} onClick={onClose} />
        )}
      </div>
    </Dialog>
  )
}

export default Poster
