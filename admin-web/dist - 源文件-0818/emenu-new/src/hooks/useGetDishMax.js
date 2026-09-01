import { useMemo } from 'react'
import useSystemConfig from '@/hooks/useSystemConfig'

const useGetDishMax = (dishId) => {
  const { getFinalConfigById } = useSystemConfig()

  const dishQtyLimitForEachTime = getFinalConfigById(18)
  const dishQtyPerRound = getFinalConfigById(57)

  const itemMax = useMemo(() => {
    if (dishQtyPerRound?.open) {
      return 99
    }
    const validConfig = dishQtyLimitForEachTime?.filter((each) => each.copies)
    const isExistLimit = validConfig?.find((each) =>
      each.dishes.includes(dishId)
    )
    if (isExistLimit) {
      const { copies } = isExistLimit
      return copies
    }
    return 99
  }, [dishId, dishQtyLimitForEachTime])

  return itemMax
}

export default useGetDishMax
