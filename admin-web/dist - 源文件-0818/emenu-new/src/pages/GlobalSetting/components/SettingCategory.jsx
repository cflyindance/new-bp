import { SYSTEM_SETTING_CATEGORY } from '@/constants/systemConfig'
import LeftCategory from '@/components/ConfigCommon/LeftCategory'

const { SettingCategoryContent } = LeftCategory

const SettingCategory = (props) => {
  const { selectedCate, setSelectedCate } = props

  const handleSwitchCate = (newCategory) => {
    setSelectedCate(newCategory)
  }

  return (
    <LeftCategory
      handleSwitchCate={handleSwitchCate}
      selectedCate={selectedCate}
      categoryList={SYSTEM_SETTING_CATEGORY}
    >
      <SettingCategoryContent />
    </LeftCategory>
  )
}

export default SettingCategory
