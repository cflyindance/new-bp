import { IconButton } from '@material-ui/core'
import { AddCircleRounded } from '@material-ui/icons'
import React from 'react'
import RemoveRoundedIcon from '@material-ui/icons/RemoveRounded'
import styles from './index.module.less'

const ManualCounter = (props) => {
  const {
    value = 0,
    disabled = false,
    onClickAdd,
    onClickReduce,
    max = 99,
    min = 0,
  } = props
  return !value ? (
    <IconButton
      disabled={disabled}
      color="primary"
      className={styles.addIcon}
      onClick={() => onClickAdd(value + 1)}
    >
      <AddCircleRounded style={{ fontSize: 32 }} />
    </IconButton>
  ) : (
    <div className={styles.counterWrapper}>
      <IconButton
        disabled={disabled || value <= min}
        color="primary"
        className={styles.addIcon}
        onClick={() => onClickReduce(value - 1)}
      >
        <RemoveRoundedIcon style={{ fontSize: 26, color: '#333' }} />
      </IconButton>
      <div className={styles.counterNum}>{value}</div>
      <IconButton
        disabled={disabled || value >= max}
        color="primary"
        className={styles.addIcon}
        onClick={() => onClickAdd(value + 1)}
      >
        <AddCircleRounded style={{ fontSize: 32 }} />
      </IconButton>
    </div>
  )
}

export default ManualCounter
