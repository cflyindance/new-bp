import HeaderTitle from './HeaderTitle'
import FooterOperation from './FooterOperation'
import styles from './index.module.less'

const ConfigWrapper = (props) => {
  const {
    title,
    handleBack,
    handleSave,
    footerTip,
    leftContent,
    rightContent,
    renderEmpty = null,
  } = props

  return (
    <div className={styles.configWrapper}>
      <HeaderTitle title={title} />
      {renderEmpty ? (
        renderEmpty
      ) : (
        <>
          <main className={styles.configContent}>
            <div className={styles.leftCategoryWrapper}>{leftContent}</div>
            <div className={styles.rightContentWrapper}>{rightContent}</div>
          </main>
          <FooterOperation
            handleBack={handleBack}
            handleSave={handleSave}
            tip={footerTip}
          />
        </>
      )}
    </div>
  )
}

export default ConfigWrapper
