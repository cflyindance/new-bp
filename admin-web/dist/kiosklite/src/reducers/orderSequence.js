import { ORDER_SEQUENCE, INIT_ORDER_SEQUENCE, SET_ORDER_SEQUENCE } from '@/constants/actionTypes';

const initState = {
  orderSequence: 0,
};

export default function orderSequence(state = initState.orderSequence, action) {
  switch (action.type) {
    case ORDER_SEQUENCE:
      return state + action.increaseInterval;
    case INIT_ORDER_SEQUENCE:
      return action.initSequence;
    case SET_ORDER_SEQUENCE:
      return action.data;
    default:
      return state;
  }
}
