import { SET_TAX_INFO } from "../constants/actionTypes";

const initState = {
    taxList: []
};

export default function taxList(state = initState.taxList, action) {
    switch(action.type) {
        case SET_TAX_INFO:
            return action.taxInfo;
        default: 
            return state;
    }
}