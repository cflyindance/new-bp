import {
  RESET_ORDER,
  SET_GIFT_CARD_PAYMENT_INFO,
} from '../constants/actionTypes';

const initState = null;

export default function giftCardPaymentInfo(state = initState, action) {
  switch (action.type) {
    case SET_GIFT_CARD_PAYMENT_INFO:
      return action.data;
    case RESET_ORDER:
      return initState;
    default:
      return state;
  }
}
