import Device from "../utils/Device";
import {normalizeObjectToRadians} from "../utils/Math";
import OrbitControls from "./OrbitControls";
import CustomGyroControls from "./CustomGyroControls";
export default class Controls {

    constructor(camera, targetEl, controlsConfig = {}, deviceProps = {}) {
        this.controlsConfig = controlsConfig;

        if (Device.isMobile) {

            this.controls = new CustomGyroControls(
                camera,
                targetEl,
                controlsConfig.radius,
                normalizeObjectToRadians(controlsConfig.lookAt)
            );
        } else {
            this.controls = new OrbitControls(
                camera,
                targetEl,
                controlsConfig.radius,
                normalizeObjectToRadians(controlsConfig.lookAt)
            );
        }

        //const loop = createLoop(() => (this.controls._onDeviceOrientationChangeEvent()));
        //loop.start()

    }

    lookAtToRadianCoords(coords) {
        return normalizeObjectToRadians(coords);
    }

    lookAt(radianCoords) {
        /*let {x, y} = radianCoords;
        x += PI;
        const rWrap = this.controls.preRY % TAO - x;
        //this.controls.rx.value = y
        this.controls.ry.value = x +    (-Math.PI * 0.5);*/
    }

    setRadius(r) {
        this.controls.setRadius(r);
    }

    update() {
        this.controls.update();
    }

    destroy() {
        this.controls.destroy();
    }
}
