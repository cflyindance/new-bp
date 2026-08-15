import React, { memo, useEffect, useMemo, useRef } from 'react'
import { FixedSizeList } from 'react-window'
import RewardRow from './RewardRow'
import { MEMBER_REDEMPTION_ROW_HEIGHT } from './model'
import styles from './index.module.less'

function getRewardRowKey(row, index) {
  return `${row.type}:${
    row.item?.crmIntegrationVoucherItemKey ||
    row.item?.crmIntegrationPointItemKey ||
    row.item?.id ||
    index
  }:${index}`
}

const MemberRedemptionVirtualRow = ({ index, style, data }) => {
  const row = data.rows[index]
  return (
    <RewardRow
      {...data.rowProps}
      {...data.getRowProps(row)}
      key={getRewardRowKey(row, index)}
      row={row}
      stateKey={data.stateKey}
      style={style}
    />
  )
}

const RewardList = ({
  rows = [],
  height,
  resetKey,
  stateKey,
  rowProps = {},
  getRowProps = () => ({}),
}) => {
  const listRef = useRef(null)
  const itemData = useMemo(
    () => ({ rows, rowProps, getRowProps, stateKey }),
    [getRowProps, rowProps, rows, stateKey]
  )

  useEffect(() => {
    listRef.current?.scrollTo(0)
  }, [resetKey])

  return (
    <FixedSizeList
      ref={listRef}
      className={styles.rewardList}
      height={height}
      itemCount={rows.length}
      itemData={itemData}
      itemSize={MEMBER_REDEMPTION_ROW_HEIGHT}
      width="100%"
    >
      {MemberRedemptionVirtualRow}
    </FixedSizeList>
  )
}

export default memo(RewardList)
