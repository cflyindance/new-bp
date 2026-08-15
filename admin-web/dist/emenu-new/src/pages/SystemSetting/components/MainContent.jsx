import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styles from './MainContent.module.less'

const { Title } = Typography

const SETTING_TYPE = [
  {
    label: 'deviceSetting',
    path: './device',
  },
  {
    label: 'globalSetting',
    path: './global',
  },
  {
    label: 'categorySetting',
    path: './category',
  },
  {
    label: 'menuClassify',
    path: './menuClassify',
  },
]

const MainContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={styles.MainContent}>
      <div className={styles.settingType}>
        {SETTING_TYPE.map((each) => {
          return (
            <div
              key={each.label}
              className={styles.typeItem}
              onClick={() => navigate(`${each.path}`)}
            >
              <Title level={2}>{t(`SystemSetting.${each.label}`)}</Title>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MainContent
