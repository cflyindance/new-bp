import {
  SET_ECARD_SETTINGS,
  SET_ECARD_QUICK_AMOUNTS,
  SET_ECARD_CLOUD_GIFT_CARD_ITEM,
  SET_AVAILABLE_ECARDS,
  SET_ECARD_LAST_QUERY,
  SET_ECARD_LOADING,
  SET_SELECTED_ECARD,
} from '@/constants/actionTypes';

const initialState = {
  settings: null,
  quickAmounts: [],
  cloudGiftCardItem: null,
  selectedCard: null,
  availableCards: [],
  lastQuery: null,
  loading: false,
};

export default function ecard(state = initialState, action) {
  switch (action.type) {
    case SET_ECARD_SETTINGS:
      return {
        ...state,
        settings: action.data,
      };
    case SET_ECARD_QUICK_AMOUNTS:
      return {
        ...state,
        quickAmounts: action.data,
      };
    case SET_ECARD_CLOUD_GIFT_CARD_ITEM:
      return {
        ...state,
        cloudGiftCardItem: action.data,
      };
    case SET_SELECTED_ECARD:
      return {
        ...state,
        selectedCard: action.data,
      };
    case SET_AVAILABLE_ECARDS:
      return {
        ...state,
        availableCards: action.data,
      };
    case SET_ECARD_LAST_QUERY:
      return {
        ...state,
        lastQuery: action.data,
      };
    case SET_ECARD_LOADING:
      return {
        ...state,
        loading: action.data,
      };
    default:
      return state;
  }
}
