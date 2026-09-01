import HeaderTitle from '@/components/ConfigCommon/HeaderTitle'
import useCheckVersion from '@/hooks/useCheckVersion'
import MainContent from './components/MainContent'
import styles from './index.module.less'
import DataBackupButton from './components/Backup/DataBackupButton'
import DataRestoreButton from './components/Backup/DataRestoreButton'
import LocalImageFolderSync from './components/LocalImageFolderSync'

const SystemSetting = () => {
  const { version } = useCheckVersion()

  return (
    <div className={styles.configurationWrapper}>
      <HeaderTitle title="SystemSetting.configuration" />
      <span className={styles.versionText}>E-V{version}</span>
      <MainContent />
      <div className={styles.footer}>
        <div className={styles.backup}>
          <DataBackupButton />
          <DataRestoreButton />
        </div>
        <LocalImageFolderSync />
      </div>
    </div>
  )
}

export default SystemSetting
