import TypeSetting from './TypeSetting'
import MenuClassifySetting from './MenuClassifySetting'
import MenuBusinessTime from './MenuBusinessTime'

const ComponentMap = {
  typeSetting: <TypeSetting />,
  menuClassifySetting: <MenuClassifySetting />,
  menuBusinessTime: <MenuBusinessTime />,
}

const RightContent = (props) => {
  const { selectedCate } = props

  return <>{ComponentMap[selectedCate]}</>
}

export default RightContent
