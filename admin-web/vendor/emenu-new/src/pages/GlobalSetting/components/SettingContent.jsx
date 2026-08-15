import MenuConfig from './MenuConfig'
import TipMessage from './TipMessage'
import GlobalOrderSetting from './GlobalOrderSetting'
import GlobalMenuSetting from './GlobalMenuSetting'
import AuthConfig from './AuthConfig'
import MessageType from './MessageType'
import UserSetting from './UserSetting'
import WaiterSetting from './WaiterSetting'
import Schedule from './Schedule'
import LabelsSetting from './LabelsSetting'
import {
  notificationMap,
  userSettingMap,
  waiterSettingMap,
  menuStyleMap,
  authSettingMap,
  receiptSettingMap,
  pemiumMemberMap,
  lotteryMap,
} from '@/constants/systemConfig'
import MenuStyle from './MenuStyle'
import AuthorizationSetting from './AuthorizationSetting'
import PosterAds from './PosterAds'
import HomepageVideoSetting from './HomepageVideoSetting'
import LanguageSetting from './LanguageSetting'
import PemiumMember from './PemiumMember'
import LotterySetting from './LotterySetting'

const ComponentMap = {
  menuConfig: <MenuConfig />,
  tipMessage: <TipMessage />,
  orderSetting: <GlobalOrderSetting />,
  menuSetting: <GlobalMenuSetting />,
  authConfig: <AuthConfig />,
  messageType: <MessageType />,
  userSetting: <UserSetting data={userSettingMap} />,
  schedule: <Schedule />,
  labels: <LabelsSetting />,
  notification: <UserSetting data={notificationMap} />,
  waiterSetting: <WaiterSetting data={waiterSettingMap} />,
  menuStyle: <MenuStyle data={menuStyleMap} />,
  authorization: <AuthorizationSetting data={authSettingMap} />,
  pemiumMember: <PemiumMember data={pemiumMemberMap} />,
  posterAds: <PosterAds />,
  homepageVideo: <HomepageVideoSetting />,
  languages: <LanguageSetting />,
  receipt: <UserSetting data={receiptSettingMap} />,
  lottery: <LotterySetting data={lotteryMap} />,
}

const SettingContent = (props) => {
  const { selectedCate } = props

  return <>{ComponentMap[selectedCate]}</>
}

export default SettingContent
