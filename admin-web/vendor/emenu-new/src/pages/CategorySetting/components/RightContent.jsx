import TypeSetting from './TypeSetting'
import BrandMenuSetting from './BrandMenuSetting'
import BrandBusinessTime from './BrandBusinessTime'
import SpecialMenu from '@/pages/CategorySetting/components/SpecialMenu'

const ComponentMap = {
  typeSetting: <TypeSetting />,
  brandMenuSetting: <BrandMenuSetting />,
  brandBusinessTime: <BrandBusinessTime />,
  specialMenu: <SpecialMenu />,
}

const RightContent = (props) => {
  const { selectedCate } = props

  return <>{ComponentMap[selectedCate]}</>
}

export default RightContent
