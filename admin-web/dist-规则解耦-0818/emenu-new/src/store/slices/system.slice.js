import { createSlice } from '@reduxjs/toolkit'
import { sendPosLog } from '@/services/setting'
import { getAreas } from '@/services/tables'

export const systemSlice = createSlice({
  name: 'systemSlice',
  initialState: {
    areas: [],
    isWSDisconnect: false,
  },
  reducers: {
    setAreas(state, action) {
      state.areas = action.payload
    },
    setWSStatus(state, action) {
      state.isWSDisconnect = action.payload
    },
  },
})

export default systemSlice.reducer
export const actions = systemSlice.actions

const fetchAreas = () => async (dispatch) => {
  try {
    const res = await getAreas()
    if (res) {
      const areas = res?.areas
      dispatch(actions.setAreas(areas))
    }
  } catch (e) {
    sendPosLog(e?.message)
  }
}

export const effects = {
  fetchAreas,
}
