import { Box } from '@material-ui/core'
import WhiteMember from '@/assets/image/white.png'
import MemberPrice from '@/assets/image/memberPrice.png'
import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useGlobalState } from '@/hooks/useGlobalState'

const useStyles = makeStyles(() => ({
  vipImg: {
    width: 16,
    marginRight: 4,
  },
}))

const VipPriceWithImg = (props) => {
  const { benefitPrice, style = {}, imgType } = props
  const classes = useStyles()
  const [isOpenPrivilege] = useGlobalState('isOpenPrivilege')

  return isOpenPrivilege ? (
    <Box
      style={{ ...style }}
      fontSize={14}
      color="#96272F"
      display="flex"
      alignItems="center"
    >
      <img
        className={classes.vipImg}
        src={imgType === 'white' ? WhiteMember : MemberPrice}
        alt="member price"
      />
      <span>{benefitPrice}</span>
    </Box>
  ) : null
}

export default VipPriceWithImg
