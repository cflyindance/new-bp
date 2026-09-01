import React from 'react'
import { Box } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { formatSeasoningSnapshotLabel, getSeasoningLabelsFromOptions } from '@/utils/seasoningGuest'

const useStyles = makeStyles(() => ({
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  // Match TextTag (.textTag): #f4e0e1 / #96272f / pill
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
    flex: '0 0 auto',
    marginRight: 2,
    padding: '2px 8px',
    borderRadius: 20,
    backgroundColor: '#f4e0e1',
    color: '#96272f',
    fontSize: 12,
    wordBreak: 'break-word',
  },
}))

export default function SeasoningTags({ snapshots, dish }) {
  const classes = useStyles()
  const fromSnaps = (snapshots || [])
    .map((snap) => formatSeasoningSnapshotLabel(snap))
    .filter(Boolean)
  const labels = fromSnaps.length
    ? fromSnaps
    : getSeasoningLabelsFromOptions(dish?.options)
  if (!labels.length) return null
  return (
    <Box className={classes.wrap}>
      {labels.map((label, index) => (
        <span key={`${label}-${index}`} className={classes.tag}>
          {label}
        </span>
      ))}
    </Box>
  )
}
