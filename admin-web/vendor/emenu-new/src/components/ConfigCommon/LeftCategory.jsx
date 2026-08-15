import { cloneElement } from 'react'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import styles from './LeftCategory.module.less'

const LeftCategory = (props) => {
  const { selectedCate, handleSwitchCate, categoryList = [], children } = props

  return (
    <div className={styles.settingCategory}>
      {categoryList.map((each) => {
        return (
          <div
            className={classNames(
              styles.categoryItem,
              selectedCate === each && styles.currentCategory
            )}
            key={each}
            onClick={() => handleSwitchCate(each)}
          >
            {cloneElement(children, { contentKey: each })}
          </div>
        )
      })}
    </div>
  )
}

const SettingCategoryContent = (props) => {
  const { t } = useTranslation()
  const { contentKey } = props
  return (
    <span className={styles.itemText}>{t(`SystemSetting.${contentKey}`)}</span>
  )
}

LeftCategory.SettingCategoryContent = SettingCategoryContent

export default LeftCategory
