import { BRAND_SETTING_CATEGORY } from '@/constants/systemConfig'
import LeftCategory from '@/components/ConfigCommon/LeftCategory'
const { SettingCategoryContent } = LeftCategory

const LeftSetting = (props) => {
  const { selectedCate, setSelectedCate } = props

  const handleSwitchCate = (newCategory) => {
    setSelectedCate(newCategory)
  }

  return (
    <LeftCategory
      handleSwitchCate={handleSwitchCate}
      selectedCate={selectedCate}
      categoryList={BRAND_SETTING_CATEGORY}
    >
      <SettingCategoryContent />
    </LeftCategory>
  )
}

export default LeftSetting
