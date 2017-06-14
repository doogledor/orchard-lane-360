
import * as ActionTypes from "../constants/actionTypes";
import {FPS,THEATER_RADIUS} from "../constants";
import {defaults, isNil, omitBy} from "lodash";


const defaultOptions = {
    designMode: false,
    fps: FPS,
    hotspotFont: "RobotoCondensed-Bold",
    hotspots: [],
    initialRotation: {lat:0, lon:0},
    screenshotURI: null,
    videoRadius: THEATER_RADIUS,
};


export default function(state = defaultOptions, action) {
    switch (action.type) {
    case ActionTypes.SET_INITIAL_CONFIG:
        if (typeof action.configuration.initialRotation === "number") {
            action.configuration.initialRotation = {lon: action.configuration.initialRotation, lat: 0};
        }
        return defaults(omitBy(action.configuration, isNil), defaultOptions);
    default:
        return state;
    }
}
