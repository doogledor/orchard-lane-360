import * as ActionTypes from "../constants/actionTypes";
import {CAMERA_EASE} from "../constants";
import Device from "../../utils/Device";

const defaultOptions = {
    time: 0,
    cameraEase: Device.isMobile ? 1 : CAMERA_EASE,
    cameraRotation: {
        lat:0,
        lon:0,
    },
};

// TODO split this out with combine reducers

export default function(state = defaultOptions, action) {
    switch (action.type) {
    case ActionTypes.SET_CAMERA_ROTATION:
        state.cameraRotation = {
            ...state.cameraRotation,
            ...action.cameraRotation,
        };
        return state;
    case ActionTypes.SET_PLAYBACK_TIME:
        state.time = action.timeValue;
        return state;
    case ActionTypes.SET_CAMERA_EASE:
        state.cameraEase = action.cameraEase;
        return state;
    default:
        return state;
    }
}
