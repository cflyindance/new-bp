import { combineReducers } from 'redux'
import { FETCH_LANGUAGE, CURRENT_LANGUAGE } from '../constants/actionTypes'

const initState = {
  languageList: [],
  currentLanguage: 'en',
}

export function languageList(state = initState.languageList, action) {
  switch (action.type) {
    case FETCH_LANGUAGE:
      return action.languageList
    default:
      return state
  }
}

function currentLanguage(state = initState.currentLanguage, action) {
  switch (action.type) {
    case CURRENT_LANGUAGE:
      document.documentElement.setAttribute('data-lang', action.currentLanguage)
      return action.currentLanguage
    default:
      return state
  }
}

export default combineReducers({
  languageList,
  currentLanguage,
})
