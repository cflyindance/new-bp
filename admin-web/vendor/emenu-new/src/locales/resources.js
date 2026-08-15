import en from './en.json'
import zh from './zh.json'
import zh_Hant from './zh-Hant.json'
import fr from './fr.json'
import jp from './jp.json'
import ru from './ru.json'
import es from './es.json'
import vi from './vi.json'
import th from './th.json'
import ko from './ko.json'

import enUS from 'antd/es/locale/en_US'
import zhCN from 'antd/es/locale/zh_CN'
import zhTW from 'antd/es/locale/zh_TW'
import frFR from 'antd/es/locale/fr_FR'
import jaJP from 'antd/es/locale/ja_JP'
import ruRU from 'antd/es/locale/ru_RU'
import esES from 'antd/es/locale/es_ES'
import viVN from 'antd/es/locale/vi_VN'
import thTH from 'antd/es/locale/th_TH'
import koKR from 'antd/es/locale/ko_KR'

export const supportLanguages = [
  'en',
  'zh',
  'zh-Hant',
  'fr',
  'jp',
  'ru',
  'es',
  'vi',
  'th',
  'ko',
]

export const posLanguageCode2emenuLanguageCode = {
  en: 'en',
  'zh-cn': 'zh',
  'zh-Hant': 'zh-Hant',
  French: 'fr',
  jp: 'jp',
  ru: 'ru',
  es: 'es',
  vi: 'vi',
  th: 'th',
  ko: 'ko',
}

export const transformLanguageCode = (lang) => {
  return posLanguageCode2emenuLanguageCode[lang] || lang
}

const resourcesList = {
  en,
  zh: zh,
  'zh-Hant': zh_Hant,
  fr,
  jp,
  ru,
  es,
  vi,
  th,
  ko,
}

const resources = supportLanguages.reduce((acc, cur) => {
  if (resourcesList[cur]) {
    acc[cur] = {
      translation: resourcesList[cur],
      group: resourcesList[cur].ns_group,
      category: resourcesList[cur].ns_category,
    }
  }
  return acc
}, {})

export const getAntdLocaleResources = (lang) => {
  switch (lang) {
    case 'en':
      return enUS
    case 'zh':
      return zhCN
    case 'zh-Hant':
      return zhTW
    case 'fr':
      return frFR
    case 'jp':
      return jaJP
    case 'ru':
      return ruRU
    case 'es':
      return esES
    case 'vi':
      return viVN
    case 'th':
      return thTH
    case 'ko':
      return koKR
    default:
      return enUS
  }
}

export default resources
