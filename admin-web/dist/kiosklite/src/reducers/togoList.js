import { SET_TOGO_OPTION, CLEAR_TOGO_OPTION } from '../constants/actionTypes'

const initState = {
  togoList: [
    {
      id: 2,
      name: 'Utensil',
      select: {},
    },
    {
      id: 3,
      name: 'Bag',
      select: {},
    },
    {
      id: 4,
      name: 'Takeout Box',
      select: {},
    },
  ],
}

export default function togoList(state = initState.togoList, action) {
  switch (action.type) {
    case SET_TOGO_OPTION:
      return action.data
    case CLEAR_TOGO_OPTION:
      return [
        {
          id: 2,
          name: 'Utensil',
          select: {},
        },
        {
          id: 3,
          name: 'Bag',
          select: {},
        },
        {
          id: 4,
          name: 'Takeout Box',
          select: {},
        },
      ]
    default:
      return state
  }
}
