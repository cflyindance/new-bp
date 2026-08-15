import { MENU_CLASSIFY_SETTING } from '@/constants/systemConfig'
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
      categoryList={MENU_CLASSIFY_SETTING}
    >
      <SettingCategoryContent />
    </LeftCategory>
  )
}

export default LeftSetting
