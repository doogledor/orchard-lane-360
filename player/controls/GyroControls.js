import OrbitControls from "./OrbitControls";
import * as THREE from "three";


export default class GyroControls extends OrbitControls {

    constructor(camera, mListenerTarget = window, mRadius = 500, options = {}) {
        super(camera, mListenerTarget, mRadius, options);

        this._gyroscope = {
            alpha: null,
            beta: null,
            gamma: null,
        };

        this.euler = new THREE.Euler();
        this.zee = new THREE.Vector3(0, 0, 1);
        this.q0 = new THREE.Quaternion();
        this.q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

        this.setCustomMode(options.customMode);

        this.enableGyro(true);
    }

    _addListeners() {
        this._windowListeners = [{
            type: "deviceorientation",
            handler: (e) => this._onDeviceOrientationChangeEvent(e),
        }, {
            type: "orientationchange",
            handler: (e) => this._onScreenOrientationChangeEvent(e),
        }];
        super._addListeners();
    }

    setCustomMode(value = false) {
        this._customMode = value;
        if (value) {
            this._camera.rotation.reorder("XYZ");
        } else {
            this._camera.rotation.reorder("YXZ");
        }
    }

    _onScreenOrientationChangeEvent(e) {
        this._screenOrientation = window.orientation || screen.orientation.angle || 0;
    }

    _onDeviceOrientationChangeEvent(e) {
        this._deviceOrientation = e;

        this._gyroscope.alpha = e.alpha ? THREE.Math.degToRad(e.alpha) : 0; // Z
        this._gyroscope.beta = e.beta ? THREE.Math.degToRad(e.beta) : 0; // X'
        this._gyroscope.gamma = e.gamma ? THREE.Math.degToRad(e.gamma) : 0 + this._gammaOffsetAngle; // X'

        this.orient = this._screenOrientation ? THREE.Math.degToRad(this._screenOrientation) : 0; // O
    }

    update() {
        if (this._gyroEnabled && !this._customMode) {
            this._setObjectQuaternion(
                this._camera.quaternion,
                this._gyroscope.alpha,
                this._gyroscope.beta,
                this._gyroscope.gamma,
                this.orient,
            );
        }
        super.update();
    }

    _setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
        this.euler.set(beta, alpha, -gamma, "YXZ"); // 'ZXY' for the device, but 'YXZ' for us
        quaternion.setFromEuler(this.euler); // orient the device
        quaternion.multiply(this.q1); // camera looks out the back of the device, not the top
        quaternion.multiply(this.q0.setFromAxisAngle(this.zee, -orient)); // adjust for screen orientation
    }
}
