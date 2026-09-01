import { Box, makeStyles, Typography } from '@material-ui/core'
import React from 'react'

const useStyles = makeStyles(() => ({
  title: {
    // fontSize: 100,
    fontWeight: 500,
  },
  text: {
    // fontSize: 40,
    fontWeight: 500,
  },
}))

export default function NotFound() {
  const classes = useStyles()
  return (
    <Box
      display="flex"
      width="100vw"
      height="100vh"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Typography variant="h1" color="primary" className={classes.title}>
        404
      </Typography>
      <Typography variant="h4" color="secondary" className={classes.text}>
        Not Found
      </Typography>
    </Box>
  )
}
