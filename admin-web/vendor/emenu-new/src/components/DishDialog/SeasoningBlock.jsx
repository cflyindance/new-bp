import React from 'react'
import { Box, Typography, ButtonBase, Grid } from '@material-ui/core'
import { CheckRounded } from '@material-ui/icons'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { useTranslation } from 'react-i18next'
import { SEASONING_ACTION_LABELS } from '@/utils/seasoningGuest'

const useStyles = makeStyles((theme) => ({
  optionLabelWrapper: {
    marginBottom: theme.spacing(2),
  },
  optionLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    lineHeight: 1.2,
    fontWeight: 700,
    marginBottom: 4,
  },
  labelDot: {
    display: 'inline-block',
    width: 18,
    height: 18,
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
  },
  optionPaper: {
    flexDirection: 'column',
    padding: 10,
    width: '100%',
    height: '100%',
    minHeight: 46,
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

export default function SeasoningBlock({
  groups,
  selections,
  onToggleChoice,
  hidePrice = false,
}) {
  const classes = useStyles()
  const { t } = useTranslation()
  if (!groups?.length) return null

  const selectedKey = new Set(
    (selections || []).map((s) => `${s.action}::${s.optionId}`)
  )

  return (
    <Box marginBottom={4}>
      {groups.map((group) => {
        const choices = group.choices || []
        const space = choices.length < 3 ? 12 / Math.max(choices.length, 1) : 4
        const hasSelection = choices.some((c) =>
          selectedKey.has(`${c.action}::${c.optionId}`)
        )

        return (
          <Box key={group.action} marginBottom={3}>
            <Typography
              variant="h6"
              component="h6"
              className={classes.optionLabelWrapper}
            >
              <Box className={classes.optionLabel}>
                <Box component="strong" display="flex" alignItems="center">
                  <i className={classes.labelDot} />
                  <Box
                    component="span"
                    marginLeft={-1}
                    style={{ maxWidth: '200px', wordBreak: 'break-word' }}
                  >
                    {SEASONING_ACTION_LABELS[group.action] || group.action}
                  </Box>
                </Box>
                <Box
                  component="span"
                  display="flex"
                  alignItems="center"
                  color="textSecondary"
                  fontWeight="normal"
                >
                  <Box
                    component="span"
                    padding={'1px 4px'}
                    fontSize={14}
                    borderRadius={5}
                    style={{ color: '#4F4F4F' }}
                  >
                    {t('DishDialog.option_optional')}
                  </Box>
                  {hasSelection && (
                    <CheckRounded fontSize="small" color="primary" />
                  )}
                </Box>
              </Box>
            </Typography>
            <Grid container spacing={2}>
              {choices.map((choice) => {
                const key = `${choice.action}::${choice.optionId}`
                const active = selectedKey.has(key)
                const price = Number(choice.priceDelta) || 0
                const showPrice = `$${price.toFixed(2)}`

                return (
                  <Grid key={key} item xs={space}>
                    <ButtonBase
                      classes={{
                        root: `${classes.optionPaper}${active ? ' active' : ''}`,
                      }}
                      onClick={() => onToggleChoice(choice)}
                    >
                      <Box
                        component="div"
                        display="flex"
                        alignItems="center"
                        className={classes.optionPaperText}
                      >
                        {choice.optionName}
                        {!hidePrice && (
                          <Box fontSize={14} color="#828282">
                            {showPrice}
                          </Box>
                        )}
                      </Box>
                    </ButtonBase>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )
      })}
    </Box>
  )
}
