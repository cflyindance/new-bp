import { FETCH_MERCHANT_PROFILE } from '../constants/actionTypes'

const initState = {
  merchantProfile: {},
}

export default function merchantProfile(state = initState.merchantProfile, action) {
  switch (action.type) {
    case FETCH_MERCHANT_PROFILE:
      return action.merchantProfile
    default:
      return state
  }
}
