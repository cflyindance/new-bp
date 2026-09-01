import { combineReducers } from 'redux'
import { SIDENAVLISTINFO, SIDENAVINDEX } from '../constants/actionTypes'

const initState = {
  sectionId: 0,
  sectionList: [],
}

function sideNavList(state = initState.sectionList, action) {
  switch (action.type) {
    case SIDENAVLISTINFO:
      return Object.assign([], action.data)
    default:
      return state
  }
}

function sideNavId(state = initState.sectionId, action) {
  switch (action.type) {
    case SIDENAVINDEX:
      state = action.data
      return state
    default:
      return state
  }
}

export default combineReducers({
  sideNavList,
  sideNavId,
})
