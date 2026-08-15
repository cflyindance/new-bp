import { combineReducers } from 'redux'
import { SET_LANMODAL, SET_LANMODALFN } from '../constants/actionTypes'
import { solveScrollElem } from '../utils'

const initState = {
  isLanModalOpen: false,
  langFn: null,
}

export function lanModalshow(state = initState.isLanModalOpen, action) {
  switch (action.type) {
    case SET_LANMODAL:
      solveScrollElem(action.data)
      return action.data
    default:
      return state
  }
}

export function lanModalFn(state = initState.langFn, action) {
  switch (action.type) {
    case SET_LANMODALFN:
      return action.data
    default:
      return state
  }
}

export default combineReducers({
  lanModalshow,
  lanModalFn,
})
