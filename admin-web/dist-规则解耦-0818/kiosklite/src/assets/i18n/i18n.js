import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from './resources'
import store from '../../reducers/store'

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: store.getState()?.language?.currentLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
