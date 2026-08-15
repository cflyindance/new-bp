import { useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useGlobalState } from '@/hooks/useGlobalState'
import { actions as crmIntegrationValidationActions } from '@/store/slices/crmIntegrationValidation.slice'

export default function useCrmIntegrationOrderContextReset() {
  const dispatch = useDispatch()
  const [orders] = useGlobalState('Orders')
  const orderId = useMemo(() => orders?.[0]?.id ?? '', [orders])
  const initializedRef = useRef(false)
  const previousOrderIdRef = useRef(orderId)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      previousOrderIdRef.current = orderId
      return
    }

    if (previousOrderIdRef.current === orderId) return

    previousOrderIdRef.current = orderId
    dispatch(crmIntegrationValidationActions.resetCrmIntegrationValidation())
  }, [dispatch, orderId])
}
