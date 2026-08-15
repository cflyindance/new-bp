import { useCallback } from 'react'
import { useRequest } from 'ahooks'
import useSystemConfig from '@/hooks/useSystemConfig'
import { printReceipt } from '@/services/orders'

export function usePrintReceipt() {
  const { getFinalConfigById } = useSystemConfig()
  const isOpen = getFinalConfigById(80)?.open

  const printReceiptFn = useCallback(
    (orders) => {
      if (!isOpen) return
      return printReceipt({ orderId: orders[0].id })
    },
    [isOpen]
  )

  const { runAsync: runPrintReceipt } = useRequest(printReceiptFn, {
    manual: true,
  })

  return { runPrintReceipt }
}
