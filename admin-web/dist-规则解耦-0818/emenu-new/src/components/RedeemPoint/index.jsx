import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import POINTS from '@/assets/image/points.png'
import { Typography } from '@material-ui/core'

const useStyles = makeStyles(() => {
  return {
    redeemPoints: {
      display: 'flex',
      alignItems: 'center',
    },
    points: {
      paddingLeft: 8,
      fontWeight: 'bold',
    },
  }
})

const RedeemPoint = (props) => {
  const classes = useStyles()
  const { points, imgUrl } = props

  if (!points) return null
  return (
    <div className={classes.redeemPoints}>
      <img src={imgUrl || POINTS} alt="points" />
      <Typography variant="body1" component="h4" className={classes.points}>
        {points}
      </Typography>
    </div>
  )
}

export default RedeemPoint
