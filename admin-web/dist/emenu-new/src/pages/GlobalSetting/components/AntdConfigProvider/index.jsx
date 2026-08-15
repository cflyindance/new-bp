import { ConfigProvider } from 'antd'
import { useTranslation } from 'react-i18next'
import { getAntdLocaleResources } from '@/locales/resources'
import { useState, useEffect } from 'react'

const AntdConfigProvider = ({ children }) => {
  const { i18n } = useTranslation()

  const [locale, setLocale] = useState()

  useEffect(() => {
    const locale = getAntdLocaleResources(i18n.language)
    setLocale(locale)
  }, [i18n.language])

  return <ConfigProvider locale={locale}>{children}</ConfigProvider>
}

export default AntdConfigProvider
