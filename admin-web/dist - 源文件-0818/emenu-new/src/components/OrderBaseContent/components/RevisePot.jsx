import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  IconButton,
  Typography,
} from '@material-ui/core'
import { useGlobalState } from '@/hooks/useGlobalState'
import styles from './RevisePot.module.less'
import {
  AddCircleRounded,
  ArrowBackIosRounded,
  RemoveCircleRounded,
} from '@material-ui/icons'
import { useTranslation } from 'react-i18next'
import { RecommendIcon } from '@/components/common/SvgIcons'
import ImgFallback from '@/components/common/ImgFallback'
import { serverUrl } from '@/utils/env_var'
import { makeStyles } from '@material-ui/core/styles'
import React, { useEffect, useMemo } from 'react'
import { roundToPrecision } from '@/utils/number'
import { nanoid } from 'nanoid'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import useTranslateOptions from '@/hooks/useTranslateOptions'
import CornerBadge from '@/components/common/CornerBadge'

const useStyles = makeStyles((theme) => {
  const borderRadius = theme.shape.borderRadius * 2
  return {
    comboRoot: {
      position: 'relative',
      boxShadow: 'none',
      backgroundColor: 'transparent',
      marginBottom: theme.spacing(2),
    },
    comboContent: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      marginLeft: 50,
      paddingLeft: 58,
      height: 140,
      borderRadius,
      boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
      backgroundColor: theme.palette.common.white,
      overflow: 'hidden',
      '&:last-child': {
        paddingBottom: theme.spacing(2),
      },
    },
    comboImageWrapper: {
      position: 'absolute',
      top: 20,
      width: 100,
      height: 100,
      borderRadius: '50%',
      filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.15))',
    },
    comboImage: {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '50%',
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: theme.palette.secondary.main,
    },
    title: {
      maxHeight: 48,
      fontWeight: 700,
      lineHeight: '24px',
      letterSpacing: -1,
      marginBottom: 8,
      '& > span': {
        display: 'inline-box',
        maxWidth: 'calc(100% - 27px)',
        overflow: 'hidden',
        lineClamp: 2,
        boxOrient: 'vertical',
      },
    },
    recommendFlagIcon: {
      width: 20,
      height: 20,
      marginLeft: 4,
      // verticalAlign: 1,
    },
    comboDesc: {
      color: '#828282',
      marginBottom: 8,
      height: 20,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
    price: {
      fontWeight: 700,
      color: '#4F4F4F',
      lineHeight: '26px',
      display: 'flex',
      alignItems: 'center',
    },
    addIcon: {
      padding: 0,
      '&[disabled]': {
        color: '#e0e0e0',
      },
    },
    countBadge: {
      padding: '8px 8px 0',
      transform: 'scale(0.8) translate(50%, -50%)',
      fontSize: 20,
      verticalAlign: 'middle',
    },
  }
})

const RevisePot = (props) => {
  const { open, combo, potType, onClose, maxCount, handleEditItem } = props

  const { t } = useTranslation('dish')
  const [comboCart, setComboCart] = useGlobalState('ComboCart')
  const classes = useStyles()

  const disabledAdd = useMemo(() => {
    return comboCart?.length >= maxCount
  }, [maxCount, comboCart])

  const { renderItemOption } = useTranslateOptions()

  useEffect(() => {
    if (open) {
      if (!comboCart?.length) onClose?.()
    }
  }, [open, comboCart, onClose])

  const handleChangeCount = (type, idx, each) => {
    let newComboCart =
      type === 'remove'
        ? comboCart.filter((_, i) => i !== idx)
        : [...comboCart, { ...each, key: nanoid() }]
    if (combo?.freeQuantity > 0) {
      let freeQuantityCount = combo?.freeQuantity
      newComboCart = newComboCart.map((item) => {
        const tmpFreeQuantityCount = freeQuantityCount - item.count
        const newItem = {
          ...item,
          count: item.count,
          freeQuantityCount:
            tmpFreeQuantityCount >= 0 ? item.count : freeQuantityCount,
        }
        freeQuantityCount = tmpFreeQuantityCount > 0 ? tmpFreeQuantityCount : 0
        return newItem
      })
    }
    setComboCart(newComboCart)
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className={styles.reviseWrapper}>
        <header className={styles.reviseHeader}>
          <IconButton className={styles.backIcon} onClick={onClose}>
            <ArrowBackIosRounded />
          </IconButton>
          <div className={styles.titleText}>
            {t(potType?.id, { defaultValue: potType?.name, ns: 'dish' })}
          </div>
        </header>
        <main className={styles.orderPotList}>
          {comboCart.map((each, idx) => {
            const repeatable = each.combo.repeatable
            const currentCount = comboCart.reduce(
              (acc, item) => acc + (item.id === each.id ? item.count : 0),
              0
            )
            const disabled =
              disabledAdd || !repeatable || currentCount >= each.addLimit
            const allBadgeLabel = (each.badgeTags || []).slice(0, 1)
            const realShowPrice = roundToPrecision(
              each.freeQuantityCount >= each.count
                ? (each.realSubPrice ?? 0)
                : (each.realMainPrice ?? each.realPrice ?? 0) +
                    (each.realSubPrice ?? 0)
            )?.toFixed(2)
            const realShowBenefitPrice = roundToPrecision(
              each.freeQuantityCount >= each.count
                ? (each.realSubBenefitPrice ?? each.realSubPrice ?? 0)
                : (each.realMainBenefitPrice ??
                    each.realMainPrice ??
                    each.realPrice ??
                    each.price) +
                    (each.realSubBenefitPrice ?? each.realSubPrice ?? 0)
            )?.toFixed(2)
            return (
              <Card
                key={idx}
                className={classes.comboRoot}
                style={{ overflow: 'visible' }}
              >
                <CardContent className={classes.comboContent}>
                  {allBadgeLabel.map((badge, idx) => (
                    <CornerBadge key={idx} text={badge.name} />
                  ))}
                  <CardActionArea>
                    <Typography
                      gutterBottom
                      variant="h6"
                      component="h3"
                      className={classes.title}
                    >
                      <span>{t(each.id, { defaultValue: each.name })}</span>
                      {each.isRecommend && (
                        <RecommendIcon className={classes.recommendFlagIcon} />
                      )}
                    </Typography>
                  </CardActionArea>
                  <CardActionArea>
                    <Typography
                      variant="body2"
                      component="p"
                      className={classes.comboDesc}
                    >
                      {renderItemOption(each)?.join(', ')}
                    </Typography>
                  </CardActionArea>
                  <Box display="flex" justifyContent="space-between" mt="auto">
                    <Typography
                      variant="body1"
                      component="h4"
                      className={classes.price}
                    >
                      ${realShowPrice}
                      {realShowPrice !== realShowBenefitPrice && (
                        <VipPriceWithImg
                          style={{ marginLeft: 8 }}
                          benefitPrice={realShowBenefitPrice}
                        />
                      )}
                    </Typography>
                    <div>
                      <IconButton
                        onClick={() => handleChangeCount('remove', idx, each)}
                        className={classes.addIcon}
                      >
                        <RemoveCircleRounded style={{ fontSize: 32 }} />
                      </IconButton>
                      <span className={classes.countBadge}>{each.count}</span>
                      <IconButton
                        disabled={disabled}
                        onClick={() => handleChangeCount('add', idx, each)}
                        color="primary"
                        className={classes.addIcon}
                      >
                        <AddCircleRounded style={{ fontSize: 32 }} />
                      </IconButton>
                    </div>
                  </Box>
                </CardContent>
                <CardActionArea className={classes.comboImageWrapper}>
                  <ImgFallback
                    className={classes.comboImage}
                    src={serverUrl + each.pic}
                    alt={each.name}
                    onClick={() => {
                      handleEditItem(each)()
                    }}
                    itemName={each.name}
                  />
                </CardActionArea>
              </Card>
            )
          })}
        </main>
      </div>
    </Dialog>
  )
}

export default RevisePot
