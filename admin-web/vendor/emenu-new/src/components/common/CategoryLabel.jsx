import { makeStyles, Typography } from '@material-ui/core'
import React, { memo } from 'react'

const useStyles = makeStyles((theme) => ({
  RightContent: {},
  title: {
    // position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  titleDot: ({ dotSize }) => ({
    // display: 'inline-block',
    // position: 'absolute',
    // inset: 0,
    width: dotSize,
    height: dotSize,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
  }),
  titleText: ({ fontSize, dotSize }) => ({
    // position: 'relative',
    fontSize,
    lineHeight: 1.2,
    fontWeight: 700,
    marginLeft: -dotSize / 2,
  }),
}))

function CategoryLabel({ fontSize, dotSize, text }) {
  const classes = useStyles({ fontSize, dotSize })

  return (
    <Typography variant="h5" color="secondary" className={classes.title}>
      <i className={classes.titleDot}></i>
      <span className={classes.titleText}>{text}</span>
    </Typography>
  )
}

export default memo(CategoryLabel)
