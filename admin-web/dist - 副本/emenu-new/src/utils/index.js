export const getTableName = (tableName) => {
  if (tableName?.includes('undefined-undefined')) return '-'
  return tableName || '-'
}

export const formatSeconds = (seconds) => {
  if (!seconds) return '00:00'
  const mm = Math.floor(seconds / 60)
  const ss = seconds % 60
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
}
