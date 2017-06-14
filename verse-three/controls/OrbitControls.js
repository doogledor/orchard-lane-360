import EaseNumber from "../utils/EaseNumber";
import {vec3} from "gl-matrix";
import * as THREE from "three";
const {Vector3} = THREE;


export default class OrbitalControl {

    constructor(camera, mListenerTarget = window, mRadius = 500, options = {}) {

        this._camera = camera;
        this._listenerTarget = mListenerTarget;
        this._mouse = {};
        this._preMouse = {};
        this._gyroEnabled = options.gyroEnabled || false;
        this.center = vec3.create();
        this._up = vec3.fromValues(0, 1, 0);
        this.radius = new EaseNumber(mRadius);
        this.position = vec3.fromValues(0, 0, this.radius.value);
        this.positionOffset = vec3.create();
        this._phi = new EaseNumber((options.y - Math.PI * 0.5) || 0);
        this._phi.limit(-Math.PI / 2, Math.PI / 2);
        this._theta = new EaseNumber(-Math.PI * 0.5 + (options.x || 0));
        this._prePhi = 0;
        this._preTheta = this._theta.value;

        this._isLockZoom = false;
        this._isLockRotation = false;
        this._isInvert = false;
        this.sensitivity = 0.7;

        this._windowListeners = [];
        this._targetListeners = [];

        this._addListeners();

        this._position = new Vector3();
    }

    static getMouse(mEvent, mTarget) {

        const o = mTarget || {};
        if (mEvent.touches) {
            o.x = mEvent.touches[0].pageX;
            o.y = mEvent.touches[0].pageY;
        } else {
            o.x = mEvent.clientX;
            o.y = mEvent.clientY;
        }

        return o;
    }

    _removeListeners() {
        if (!this._targetListeners) {
            return;
        }
        this._targetListeners.forEach(listnerObj => (this._listenerTarget.removeEventListener(listnerObj.type, listnerObj.handler)));
        this._windowListeners.forEach(listnerObj => (window.removeEventListener(listnerObj.type, listnerObj.handler)));
        this._targetListeners.forEach(listnerObj => (listnerObj.handler = null));
        this._windowListeners.forEach(listnerObj => (listnerObj.handler = null));
        this._targetListeners.length = 0;
        this._windowListeners.length = 0;
        this._targetListeners = null;
        this._windowListeners = null;
    }

    _addListeners() {
        this._targetListeners = [...this._targetListeners, ...[{
            type: "mousewheel",
            handler: (e) => this._onWheel(e),
        }, {
            type: "DOMMouseScroll",
            handler: (e) => this._onWheel(e),
        }, {
            type: "mousedown",
            handler: (e) => this._onDown(e),
        }, {
            type: "touchstart",
            handler: (e) => this._onDown(e),
        }, {
            type: "mousemove",
            handler: (e) => this._onMove(e),
        }, {
            type: "touchmove",
            handler: (e) => this._onMove(e),
        }]];

        this._windowListeners = [...this._windowListeners, ...[{
            type: "touchend",
            handler: () => this._onUp(),
        }, {
            type: "mouseup",
            handler: () => this._onUp(),
        }]];

        this._targetListeners.forEach(listnerObj => (this._listenerTarget.addEventListener(listnerObj.type, listnerObj.handler, false)));
        this._windowListeners.forEach(listnerObj => (window.addEventListener(listnerObj.type, listnerObj.handler, false)));
    }


    //  PUBLIC METHODS

    lock(mValue = true) {
        this._isLockZoom = mValue;
        this._isLockRotation = mValue;
    }

    lockZoom(mValue = true) {
        this._isLockZoom = mValue;
    }

    lockRotation(mValue = true) {
        this._isLockRotation = mValue;
    }

    wrap(value) {
        this._wrap = value;
    }

    inverseControl(isInvert = true) {
        this._isInvert = isInvert;
    }

    setRadius(r) {
        this.radius.value = r;
    }

    enableGyro(value) {
        this._gyroEnabled = value;
    }

    //  EVENT HANDLERES
    _onDown(mEvent) {
        if (this._isLockRotation) {
            return;
        }
        this._isMouseDown = true;
        OrbitalControl.getMouse(mEvent, this._mouse);
        OrbitalControl.getMouse(mEvent, this._preMouse);
        this._prePhi = this._phi.targetValue;
        this._preTheta = this._theta.targetValue;
    }


    _onMove(mEvent) {
        if (this._isLockRotation) {
            return;
        }
        OrbitalControl.getMouse(mEvent, this._mouse);
        if (mEvent.touches) {
            mEvent.preventDefault();
        }
        if (this._isMouseDown) {
            let diffX = -(this._mouse.x - this._preMouse.x);
            if (this._isInvert) {
                diffX *= -1;
            }
            this._theta.value = this._preTheta - diffX * 0.01 * this.sensitivity;

            let diffY = -(this._mouse.y - this._preMouse.y);
            if (this._isInvert) {
                diffY *= -1;
            }
            this._phi.value = this._prePhi - diffY * 0.01 * this.sensitivity;
        }
    }

    _onUp() {
        if (this._isLockRotation) {
            return;
        }
        this._isMouseDown = false;
    }


    _onWheel(mEvent) {
        if (this._isLockZoom) {
            return;
        }
        const w = mEvent.wheelDelta;
        const d = mEvent.detail;
        let value = 0;
        if (d) {
            if (w) {
                value = w / d / 40 * d > 0 ? 1 : -1; // Opera
            } else {
                value = -d / 3; // Firefox;         TODO: do not /3 for OS X
            }
        } else {
            value = w / 120;
        }

        this.radius.add(-value * 2);
    }

    //  PRIVATE METHODS

    update() {
        //update if we are in custom mode
        if (this._gyroEnabled && !this._customMode) {
            return;
        }

        this._phi.update();
        this._theta.update();
        this._updatePosition();

        if (this._camera) {
            this._updateCamera();
        }
    }


    _updatePosition() {
        const tr = Math.cos(this._phi.value) * this.radius.value;
        this.position[0] = Math.cos(this._theta.value) * tr;
        this.position[1] = Math.sin(this._phi.value) * this.radius.value;
        this.position[2] = Math.sin(this._theta.value) * tr;
        vec3.add(this.position, this.position, this.positionOffset);
    }


    _updateCamera() {
        this._camera.lookAt(this._position.fromArray(this.position));
    }

    //  GETTER / SETTER

    get up() {
        return this._up;
    }


    get rx() {
        return this._phi;
    }


    get ry() {
        return this._theta;
    }

    get preRY() {
        return this._preTheta;
    }

    destroy() {
        this._removeListeners();
    }
}
