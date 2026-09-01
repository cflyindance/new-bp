import useSystemConfig from '@/hooks/useSystemConfig'
import { useMemo } from 'react'

const useClassifyOrderMode = () => {
  const { getFinalConfigById } = useSystemConfig()
  // 菜单分类模式
  const isMenuClassifyMode = getFinalConfigById(52)?.open
  // 品类模式
  const isBrandModeOpen = getFinalConfigById(13)?.open
  // 纯品类模式
  const isPureBrandMode = useMemo(() => {
    return isBrandModeOpen && !isMenuClassifyMode
  }, [isBrandModeOpen, isMenuClassifyMode])
  // 纯分类模式
  const isPureMenuClassifyMode = useMemo(() => {
    return !isBrandModeOpen && isMenuClassifyMode
  }, [isBrandModeOpen, isMenuClassifyMode])
  // 菜单分类 + 品类 模式
  const isMixMode = useMemo(() => {
    return isBrandModeOpen && isMenuClassifyMode
  }, [isBrandModeOpen, isMenuClassifyMode])

  return {
    isMenuClassifyMode,
    isBrandModeOpen,
    isPureBrandMode,
    isPureMenuClassifyMode,
    isMixMode,
  }
}

export default useClassifyOrderMode
