import { useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'
import { useSetMenus } from '@/hooks/useSetMenus'

const useGetDefaultDish = () => {
  const { getFinalConfigById } = useSystemConfig()
  const { allMenuItem } = useSetMenus()
  const defaultDishConfig = getFinalConfigById(22)

  const defaultDishIds = useMemo(() => {
    return defaultDishConfig?.open ? defaultDishConfig.defaultOrderDish : []
  }, [defaultDishConfig])

  const defaultDish = useMemo(() => {
    if (defaultDishIds?.length > 0) {
      return allMenuItem.filter((each) => defaultDishIds.includes(each.id))
    }
    return []
  }, [defaultDishIds, allMenuItem])

  return {
    defaultDishIds,
    defaultDish,
  }
}
export default useGetDefaultDish
