import React, { memo, useMemo } from 'react'
import { Box, Grid } from '@material-ui/core'
import { useTranslation } from 'react-i18next'
import CategoryLabel from '../common/CategoryLabel'
import DishItemCard from '../DishItemCard'

// const useStyles = makeStyles((theme) => ({}))
const MemoDishItemCard = memo(DishItemCard)

function OrderMiniContent({ list }) {
  // const classes = useStyles()
  const { t } = useTranslation()
  // 传统辣汤底
  const spicyList = useMemo(() => list?.filter((i) => i.spicy), [list])
  // 不辣汤底
  const nonSpicyList = useMemo(() => list?.filter((i) => !i.spicy), [list])

  const renderList = (spicyList, text) => (
    <Box marginTop={2} marginBottom={4}>
      <CategoryLabel fontSize={20} dotSize={23} text={t(`OrderBase.${text}`)} />
      <Grid
        container
        // style={{
        //   marginInline: -32,
        //   width: 'calc(100% + 64px)',
        // }}
        spacing={4}
      >
        {spicyList.map((e) => (
          <Grid
            item
            key={e.id}
            md={6}
            xs={12}
            // style={{ paddingInline: 32 }}
          >
            <MemoDishItemCard key={e.id} {...e} comboItem />
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  return (
    <>
      {spicyList.length > 0 && renderList(spicyList, 'base_type_1')}
      {nonSpicyList.length > 0 && renderList(nonSpicyList, 'base_type_2')}
    </>
  )
}

export default OrderMiniContent
