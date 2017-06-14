import GyroControls from "./GyroControls";
import {mapValues, clamp, easeInQuart} from "../utils/Math";

const HORIZONTAL_TILT_IGNORE = 1;
const HORIZONTAL_TILT_SENS = 4;
const VERTICAL_TILT_SENS = 4;
const FOCUS_TIMEOUT = 500;


/*
PEN TO ILLUSTRATE: open with a gyro device

http://codepen.io/samrad/pen/NpPpdj


ANDROID:
alpha : 0 -> 360
gamma : -90 -> 90


*/
export default class CustomGyroControls extends GyroControls {

    constructor(camera, mListenerTarget = window, mRadius = 500, options = {}) {
        super(camera, mListenerTarget, mRadius, options);

        this._screenOrientation = this.orientationAngle;

        this._restingHorizontalAngle = null;
        this._restingVerticalAngle = null;

        this._horizontalValue = 0;
        this._verticalValue = 0;

        this._previousHorizontalValue = 0;
        this._previousVerticalValue = 0;

        this._gyroSensitivity = options.gyroSensitivity || 0.3; //eg: 1 * 0.3

        this.setCustomMode(true);

        this.dEl = document.createElement("div");
        this.dEl.style.position = "absolute";
        this.dEl.style.top = "0px";
        this.dEl.style.left = "0px";
        this.alphaEl = document.createElement("div");
        this.alphaEl.style.position = "absolute";
        this.alphaEl.style.top = "20px";
        this.alphaEl.style.left = "0px";
        this.betaEl = document.createElement("div");
        this.betaEl.style.position = "absolute";
        this.betaEl.style.top = "40px";
        this.betaEl.style.left = "0px";
        this.gammaEl = document.createElement("div");
        this.gammaEl.style.position = "absolute";
        this.gammaEl.style.top = "60px";

        mListenerTarget.appendChild(this.dEl);
        mListenerTarget.appendChild(this.alphaEl);
        mListenerTarget.appendChild(this.betaEl);

        this.diffHoriz = 0;
        this.diffVert = 0;
    }

    _resetControls() {
        this._restingHorizontalAngle = null;
        this._restingVerticalAngle = null;
    }

    /*
    Reset the resting when rotate device
    */
    _onScreenOrientationChangeEvent(e) {
        super._onScreenOrientationChangeEvent(e);
        this._resetControls();
    }

    get isLandscape() {
        return this.orientationAngle < 0 || this.orientationAngle > 0;
    }

    get orientationAngle() {
        return window.orientation || screen.orientation.angle || 0;
    }

    getHorizontalValue(e) {
        const _landscape = this.isLandscape;
        const _v = _landscape ? e.alpha : e.gamma;
        const _rangeMin = _landscape ? 0 : -90;
        const _rangeMax = _landscape ? 360 : 90;
        return mapValues(_v, _rangeMin, _rangeMax, -180, 180);
    }

    getVerticalValue(e) {
        return this.isLandscape ? e.gamma : e.beta;
    }

    //tap to reset
    _onUp() {
        this._resetControls();
        super._onUp();
    }

    _onDeviceOrientationChangeEvent(e) {
        super._onDeviceOrientationChangeEvent(e);

        //the raw angles
        const horizontalVal = this.getHorizontalValue(e);
        const verticalVal = this.getVerticalValue(e);

        //set the resting positions
        if (!this._restingHorizontalAngle) {
            this._restingHorizontalAngle = horizontalVal;
        }

        if (!this._restingVerticalAngle) {
            this._restingVerticalAngle = verticalVal;
        }

        this.alphaEl.innerHTML = `horizontal: ${horizontalVal}`;
        //this.betaEl.innerHTML = `vertical: ${verticalAccel} diffVert: ${diffVert.toFixed(3)}`;
        /*
        From the resting positions we map values from -1 -> 1
        */
        //const horizontalOffset = this._restingHorizontalAngle + (horizontalVal - this._restingHorizontalAngle);
        const horizontalDiff = Math.abs(this._restingHorizontalAngle) - Math.abs(horizontalVal);
        let horizontalAccel = clamp(mapValues(
            this._restingHorizontalAngle + horizontalDiff,
            this._restingHorizontalAngle - HORIZONTAL_TILT_SENS,
            this._restingHorizontalAngle + HORIZONTAL_TILT_SENS, -1,
            1), -1, 1) * -1;

        horizontalAccel = Math.abs(horizontalDiff) > HORIZONTAL_TILT_IGNORE ? horizontalAccel : 0;
        //apply easeIn
        const signedH = Math.sign(horizontalAccel);
        horizontalAccel = easeInQuart(Math.abs(horizontalAccel)) * signedH;


        const verticalDiff = Math.abs(this._restingVerticalAngle) - Math.abs(verticalVal);
        let verticalAccel = clamp(mapValues(
            this._restingVerticalAngle + verticalDiff,
            this._restingVerticalAngle - VERTICAL_TILT_SENS,
            this._restingVerticalAngle + VERTICAL_TILT_SENS, -1,
            1), -1, 1);

        verticalAccel = Math.abs(verticalDiff) > HORIZONTAL_TILT_IGNORE ? verticalAccel : 0;
        const _self = this;

        if (!horizontalAccel || !verticalAccel) {
            if (!this.focusTimeout) {
                this.focusTimeout = setTimeout(function _timeout() {
                    _self.betaEl.innerHTML = "resset";
                    _self._resetControls();
                }, FOCUS_TIMEOUT);
            }
        } else {
            this.betaEl.innerHTML = "cleared";
            clearTimeout(this.focusTimeout);
            this.focusTimeout = null;
        }

        const signedV = Math.sign(verticalAccel);
        verticalAccel = easeInQuart(Math.abs(verticalAccel)) * signedV / 2;

        //in case the previous values have not been set yet
        this._previousHorizontalValue = !(this._previousHorizontalValue) ? this._horizontalValue : this._previousHorizontalValue;
        this._previousVerticalValue = !(this._previousVerticalValue) ? this._verticalValue : this._previousVerticalValue;
        //add the modifier

        //this.dEl.innerHTML = `h raw: ${horizontalVal.toFixed(3)} v raw: ${verticalVal.toFixed(3)}`

        this._horizontalValue += horizontalAccel * this._gyroSensitivity;
        this._verticalValue += verticalAccel * this._gyroSensitivity;


        //differnce between previous
        const diffHoriz = (Math.abs(this._horizontalValue) - Math.abs(this._previousHorizontalValue));
        const diffVert = (Math.abs(this._verticalValue) - Math.abs(this._previousVerticalValue));
        this.diffHoriz = diffHoriz;
        this.diffVert = diffVert;


        /*
        These are values in radians
        */
        //this.alphaEl.innerHTML = `horizontal: ${horizontalAccel} diffHoriz: ${diffHoriz.toFixed(3)}`;
        //this.betaEl.innerHTML = `vertical: ${verticalAccel} diffVert: ${diffVert.toFixed(3)}`;



        this._previousHorizontalValue = this._horizontalValue;
        this._previousVerticalValue = this._verticalValue;
    }

    update() {
        const _preHoriz = this._theta.value;
        this._theta.value = _preHoriz + (this.diffHoriz * this.sensitivity); //in OrbitControls
        const _preVert = this._phi.value;
        this._phi.value = _preVert + (this.diffVert * this.sensitivity); //in OrbitControls
        super.update();
    }
}
