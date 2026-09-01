import React from 'react'
import { Box, Container, Grid, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { MenuNotFoundIcon } from './SvgIcons'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'

const useStyles = makeStyles({
  root: {
    // display: 'flex',
    // justifyContent: 'center',
    // alignItems: 'center',
    // height: 'calc(100vh - 220px)',
    marginTop: 'calc(50vh - 90px)',
    transform: 'translateY(-50%)',
  },
  icon: {
    fontSize: 80,
  },
})

export default function MenuNotFound(props) {
  const classes = useStyles()
  const { t } = useTranslation()
  const { search } = props
  const isSearch = useMemo(() => search?.length > 0, [search])
  return (
    <Container maxWidth={false} className={classes.root}>
      <Grid item xs={12}>
        <Box textAlign="center" marginBottom={3}>
          <MenuNotFoundIcon className={classes.icon} />
        </Box>
        <Typography variant="h5" color="secondary">
          <Box fontWeight={700} textAlign="center" marginBottom={2}>
            {t(isSearch ? 'MenuNotFound.search_title' : 'MenuNotFound.no_menu')}
          </Box>
        </Typography>
        {isSearch && (
          <Typography variant="body2" align="center" color="secondary">
            {t('MenuNotFound.search_desc')}
          </Typography>
        )}
      </Grid>
    </Container>
  )
}
