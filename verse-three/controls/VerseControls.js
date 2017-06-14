import {polarToVector3, getCameraOrientation, vector3ToPolar} from "../utils/Math";
import {THEATER_RADIUS} from "../data/constants";
import EaseNumber from "../utils/EaseNumber";
import Device from "../utils/Device";
import {autobind} from "core-decorators";
import {setCameraRotation} from "../data/actions/sceneActions";
import {isEqual} from "lodash";
import {
    Vector3,
} from "three";


export default class VerseControls {
    sensitivity = 0.3;

    constructor(camera, containerElement, dataStore) {
        this.orientationConstant = window.orientation;
        this.store = dataStore;
        this.storeUnsubscribe = this.store.subscribe(this.handleStoreUpdate);
        this.camera = camera;
        this.cameraVector = new Vector3();
        const {cameraEase} = this.store.getState().scene;
        this.initialRotation = 0;
        this.lon = new EaseNumber(0, cameraEase);
        this.lat = new EaseNumber(0, cameraEase);
        this.lat.limit(90, -90);

        this.isDragging = false;
        this.containerElement = containerElement;
        this.attachEventListeners();
        this.handleStoreUpdate();
    }

    get initialRotation() {
        return this._initialRotation || this.store.getState().configuration.initialRotation;
    }

    set initialRotation(stateConfigValue) {
        this._initialRotation = stateConfigValue;
    }

    get deviceOrientation() {
        return this._deviceOrientation || {lat: 0, lon: 0};
    }

    set deviceOrientation(latLon) {
        this._deviceOrientation = latLon;
    }

    @autobind
    handleStoreUpdate() {
        const state = this.store.getState();
        const newInitialRotation = isEqual(this.initialRotation, state.configuration.initialRotation);
        //so we dont set it after first time
        this.initialRotation = state.configuration.initialRotation;
        if (!newInitialRotation) {
            this.lon.setTo(this.initialRotation.lon);
            this.lat.setTo(this.initialRotation.lat);
        }

        const {cameraRotation, cameraEase} = state.scene;

        this.lat.easing = cameraEase;
        this.lon.easing = cameraEase;

        if (this.lastTargetRotation && !isEqual(cameraRotation, this.lastTargetRotation)) {
            const targetLon = cameraRotation.lon;
            const targetLat = cameraRotation.lat;
            this.lon.value = targetLon;
            this.lat.value = targetLat;
        }
    }

    @autobind
    attachEventListeners() {
        if (!this.containerElement) {
            console.warn("attached called before container element assigned"); // eslint-disable-line  no-console
            return;
        }
        this.containerElement.addEventListener("mousedown", this.handleMouseDown);
        this.containerElement.addEventListener("mouseup", this.handleMouseUp);
        this.containerElement.addEventListener("mouseleave", this.handleMouseUp);
        this.containerElement.addEventListener("mousemove", this.handleMouseMove);
        this.containerElement.addEventListener("touchstart", this.handleMouseDown);
        this.containerElement.addEventListener("touchmove", this.handleMouseMove);
        if (Device.isMobile || Device.isTablet) {
            window.addEventListener("deviceorientation", this.handleDeviceOrientation, false);
        }
    }

    removeEventListeners() {
        if (!this.containerElement) {
            console.warn("remove called after container element destroyed"); // eslint-disable-line  no-console
            return;
        }

        this.containerElement.removeEventListener("mousedown", this.handleMouseDown);
        this.containerElement.removeEventListener("mouseup", this.handleMouseUp);
        this.containerElement.removeEventListener("mouseleave", this.handleMouseUp);
        this.containerElement.removeEventListener("mousemove", this.handleMouseMove);
        this.containerElement.removeEventListener("touchstart", this.handleMouseDown);
        this.containerElement.removeEventListener("touchmove", this.handleMouseMove);
        if (Device.isMobile || Device.isTablet) {
            window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
        }
    }

    @autobind
    handleMouseDown(e) {
        this.isDragging = true;

        const coords = VerseControls.getPageCoords(e);
        this.startX = coords.x;
        this.startY = coords.y;
    }

    @autobind
    handleMouseMove(e) {
        if (this.isDragging) {
            e.stopPropagation();
            e.preventDefault();
            const {
                x: clientX,
                y: clientY,
            } = VerseControls.getPageCoords(e);
            const targetLon = (this.startX - clientX) * this.sensitivity;
            this.lon.add(targetLon);
            const targetLat = (clientY - this.startY) * this.sensitivity;
            this.lat.add(targetLat);
            this.startX = clientX;
            this.startY = clientY;
        }
    }

    /*
    We get the difference between Previous and Current gyro positions
    Use difference in the update()
    */
    @autobind
    handleDeviceOrientation(e) {
        this.z = getCameraOrientation(e.beta, e.gamma, e.alpha);
        const deviceOrientation = vector3ToPolar(this.z);
        //to match the rotation on desktop
        deviceOrientation.lon *= -1;
        deviceOrientation.lat -= 90;
        deviceOrientation.lat *= -1;

        //We need to use a difference and add this difference
        this.orientationFrameDifference = {
            lat: this.deviceOrientation.lat - deviceOrientation.lat,
            lon: this.deviceOrientation.lon - deviceOrientation.lon,
        };

        this.deviceOrientation = deviceOrientation;
    }

    static getPageCoords(e) {
        const coords = {};
        if (e.touches) {
            coords.x = e.touches[0].pageX;
            coords.y = e.touches[0].pageY;
        } else {
            coords.x = e.clientX;
            coords.y = e.clientY;
        }
        return coords;
    }

    @autobind
    handleMouseUp() {
        this.isDragging = false;
    }

    getCoordinates() {
        return {
            lat: this.lat.value,
            lon: this.lon.value,
        };
    }

    update() {
        if (this.orientationFrameDifference) {
            //add the inverted difference
            this.lon.add(-this.orientationFrameDifference.lon);
            this.lat.add(-this.orientationFrameDifference.lat);
            //sometimes (during desktop debug mostly) the difference get's stuck
            //slowly bring the difference to Zero
            this.orientationFrameDifference.lon = Math.max(this.orientationFrameDifference.lon - 0.01, 0);
            this.orientationFrameDifference.lat = Math.max(this.orientationFrameDifference.lat - 0.01, 0);
        }
        this.lon.update();
        this.lat.update();
        const lon = this.lon.value;
        const lat = this.lat.value;

        this.lastTargetRotation = {lat, lon};
        this.camera.lookAt(polarToVector3(lon, lat, THEATER_RADIUS, this.cameraVector));
        //save the actual position including the gyro
        this.store.dispatch(setCameraRotation(this.lastTargetRotation));
        const latitude = Math.abs(lat % 360);
        const multiplier = latitude > 90 && latitude < 270 ? 1 : 0;
        this.camera.rotateZ(Math.PI * multiplier);
    }

    destroy() {
        this.removeEventListeners();
    }
}
