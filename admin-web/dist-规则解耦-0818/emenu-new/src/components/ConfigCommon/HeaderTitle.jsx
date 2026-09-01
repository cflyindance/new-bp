import { useTranslation } from 'react-i18next'
import styles from './HeaderTitle.module.less'

const Header = (props) => {
  const { t } = useTranslation()
  const { title } = props

  return (
    <header className={styles.systemSetting_header}>{t(`${title}`)}</header>
  )
}

export default Header
