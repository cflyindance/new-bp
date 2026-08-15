import { SET_CARD_RESULT } from '../constants/actionTypes'

const initState = {
  result: {},
}

export default function cardResult(state = initState.result, action) {
  switch (action.type) {
    case SET_CARD_RESULT:
      return action.data
    default:
      return state
  }
}
