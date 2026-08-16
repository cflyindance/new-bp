import React from 'react'
import { Box, Typography, Button } from '@material-ui/core'
import { alpha, makeStyles } from '@material-ui/core/styles'
import { SEASONING_ACTION_LABELS } from '@/utils/seasoningGuest'

const useStyles = makeStyles((theme) => ({
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
  optionButton: {
    minWidth: '100%',
    width: '100%',
    height: 50,
    fontSize: 16,
    color: '#4F4F4F',
    borderRadius: 15,
    boxShadow: 'none',
    backgroundColor: alpha(theme.palette.common.white, 0.5),
    '&:not(:last-child)': { marginBottom: theme.spacing(1) },
    '&.active': {
      boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
      backgroundColor: theme.palette.common.white,
    },
  },
}))

export default function SeasoningBlock({ groups, selections, onToggleChoice }) {
  const classes = useStyles()
  if (!groups?.length) return null

  const selectedKey = new Set((selections || []).map((s) => `${s.action}::${s.optionId}`))

  return (
    <Box marginBottom={4}>
      {groups.map((group) => (
        <Box key={group.action} marginBottom={3}>
          <Typography variant="h6" component="h6" className={classes.optionLabel}>
            <Box component="strong" display="flex" alignItems="center">
              <i className={classes.labelDot} />
              <Box component="span" marginLeft={-1}>
                {SEASONING_ACTION_LABELS[group.action] || group.action}
              </Box>
            </Box>
          </Typography>
          {group.choices.map((choice) => {
            const key = `${choice.action}::${choice.optionId}`
            const active = selectedKey.has(key)
            return (
              <Button
                key={key}
                className={`${classes.optionButton}${active ? ' active' : ''}`}
                onClick={() => onToggleChoice(choice)}
              >
                <Box width="100%" display="flex" justifyContent="space-between">
                  <span>{choice.optionName}</span>
                  {choice.priceDelta > 0 ? <span>+${Number(choice.priceDelta).toFixed(2)}</span> : null}
                </Box>
              </Button>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
