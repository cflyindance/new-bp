import useSystemConfig from '@/hooks/useSystemConfig'
import { useTranslation } from 'react-i18next'
import styles from './LanguageSetting.module.less'
import { Card, CardContent, Divider } from '@material-ui/core'
import { Checkbox, message, Radio } from 'antd'
import { useMemo } from 'react'
import { supportLanguages } from '@/locales/resources'

const LanguageSetting = () => {
  const { t } = useTranslation()
  const { changeGlobalConfig, getGlobalConfig } = useSystemConfig()

  const valueObj = getGlobalConfig(71)
  const choosedLanguages = useMemo(() => {
    const languages = valueObj?.languages || []
    return supportLanguages.filter((item) => languages.includes(item))
  }, [valueObj])

  const onLanguageChange = (val) => {
    if (val.length === 0) {
      message.warn(t('SystemSetting.languages_choose_error_one'))
      return
    }
    const defaultLanguage = val.includes(valueObj?.defaultLanguage)
      ? valueObj?.defaultLanguage
      : val[0]
    changeGlobalConfig(71, {
      ...valueObj,
      languages: val,
      defaultLanguage,
    })
  }

  const onDefaultLanguageChange = (e) => {
    changeGlobalConfig(71, {
      ...valueObj,
      defaultLanguage: e.target.value,
    })
  }

  return (
    <div className={styles.languageSettingWrapper}>
      <div className={styles.innerContent}>
        <div className={styles.settingItem}>
          <Card elevation={0}>
            <CardContent className={styles.cardContent}>
              <span className={styles.itemTitle}>
                {t('SystemSetting.languages_choose')}
              </span>
              <div>
                <Checkbox.Group
                  value={choosedLanguages}
                  onChange={onLanguageChange}
                  className={styles.checkboxGroup}
                >
                  {supportLanguages.map((item) => (
                    <Checkbox
                      value={item}
                      key={item}
                      className={styles.checkboxItem}
                    >
                      {t(`SystemSetting.languages_list.${item}`)}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            </CardContent>
            <Divider />
            <CardContent className={styles.cardContent}>
              <span className={styles.itemTitle}>
                {t('SystemSetting.languages_default')}
              </span>
              <div>
                <Radio.Group
                  value={valueObj?.defaultLanguage}
                  onChange={onDefaultLanguageChange}
                  className={styles.radioGroup}
                >
                  {choosedLanguages.map((item) => (
                    <Radio value={item} key={item}>
                      {t(`SystemSetting.languages_list.${item}`)}
                    </Radio>
                  ))}
                </Radio.Group>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LanguageSetting
