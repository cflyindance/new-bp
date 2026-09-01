import { Box, ButtonBase, Grid, Typography } from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import React, { useMemo, useState } from 'react'
import VipPriceWithImg from '@/components/common/VipPriceWithImg'
import useTranslateOptions from '@/hooks/useTranslateOptions'
import { useGlobalState } from '@/hooks/useGlobalState'

const useStyles = makeStyles((theme) => ({
  optionPaper: {
    flexDirection: 'column',
    padding: 10,
    width: '100%',
    height: '100%',
    minHeight: 50,
    cursor: 'pointer',
    borderRadius: 15,
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&.active': {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.2)',
      backgroundColor: theme.palette.common.white,
    },
  },
  optionPaperText: {
    flex: 1,
    display: 'flex',
    flexFlow: 'column wrap',
    justifyContent: 'space-between',
    fontWeight: 500,
    color: '#4F4F4F',
  },
}))

function PriceList({
  pricesList,
  priceItem,
  changePrice,
  combo,
  count,
  data,
  hidePrice = false,
}) {
  const classes = useStyles()
  const { getItemSizeName } = useTranslateOptions()

  const [selected, setSelected] = useState(priceItem)

  const [comboCart] = useGlobalState('ComboCart')

  const isHidePrice = useMemo(() => {
    if (hidePrice) return true
    if (combo?.isSpecialCombo) {
      const freeQuantity = combo?.freeQuantity ?? 0
      if (freeQuantity > 0) {
        const globalCount = comboCart.reduce((acc, cur) => acc + cur.count, 0)
        if (globalCount < freeQuantity) {
          return true
        } else {
          const needShowPrice =
            count <= 0 ||
            comboCart.some(
              (e) => e.id === data?.id && e.count > e.freeQuantityCount
            )
          return !needShowPrice
        }
      }
    }
    return false
  }, [hidePrice, combo, comboCart, data?.id, count])

  const selectPrice = (item) => () => {
    setSelected(item)
    changePrice(item)
  }

  return (
    <Grid container spacing={2}>
      {pricesList?.map((e, i, arr) => {
        const showPrice = e.price ? `$${e.price?.toFixed(2)}` : null
        const benefitPrice =
          typeof e.benefitPrice === 'number'
            ? `$${e.benefitPrice?.toFixed(2)}`
            : null
        const space = arr.length < 3 ? 12 / arr.length : 4
        const isIncluded = selected.sizeId === e.sizeId
        return (
          <Grid key={i} item xs={space}>
            <ButtonBase
              classes={{
                root: `${classes.optionPaper} ${isIncluded ? 'active' : ''}`,
              }}
              onClick={selectPrice(e)}
            >
              <Typography
                variant="body1"
                component="div"
                align="center"
                className={classes.optionPaperText}
              >
                {getItemSizeName(e.sizeId) || e.size}
                {!isHidePrice && (
                  <Box fontSize={14} color="#828282">
                    {showPrice}
                    {e.strikethroughPrice !== undefined &&
                      e.strikethroughPrice != null && (
                        <span
                          style={{
                            marginLeft: '5px',
                            fontSize: '12px',
                            textDecoration: 'line-through',
                          }}
                        >
                          ${e.strikethroughPrice.toFixed(2)}
                        </span>
                      )}
                  </Box>
                )}
                {!isHidePrice && benefitPrice && (
                  <VipPriceWithImg benefitPrice={benefitPrice} />
                )}
              </Typography>
            </ButtonBase>
          </Grid>
        )
      })}
    </Grid>
  )
}

export default PriceList
