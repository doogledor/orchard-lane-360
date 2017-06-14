
import * as ActionTypes from "../constants/actionTypes";

export const setPlaybackTime = (timeValue) => ({
    timeValue,
    type: ActionTypes.SET_PLAYBACK_TIME,
});

//{lat, lng}
export const setCameraRotation = (cameraRotation) => ({
    cameraRotation,
    type: ActionTypes.SET_CAMERA_ROTATION,
});

export const setCameraEase = (cameraEase) => ({
    cameraEase,
    type: ActionTypes.SET_CAMERA_EASE,
});

