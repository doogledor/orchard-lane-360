import BaseModel from "./BaseModel";
import {
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneBufferGeometry,
} from "three";
import {
    CAMERA_FOV,
} from "../data/constants";
import {autobind, throttle} from "core-decorators";
import * as EventTypes from "../events/eventTypes";

export default class InvisibleHotspotModel extends BaseModel {

    constructor(config) {
        super(config);
        this.addEventListener("click", this.handleClick);
        this.addEventListener("mouseover", this.handleMouseOver);
        this.addEventListener("mouseout", this.handleMouseOut);
    }

    @autobind
    handleClick() {
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_CLICKED, this.config);
    }

    @autobind
    handleMouseOver() {
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_MOUSE_OVER);
    }

    @autobind
    handleMouseOut() {
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_MOUSE_OUT);
    }

    makeObject3D() {
        return new Object3D();
    }
    /*
    Size coming from CMS
    */
    get widthPercent() {
        return this.config.width / 1920;
    }

    get heightPercent() {
        return this.config.height / 1080;
    }

    /*
    Sizes relative to the calculated screen width
    see onResize
    */
    get planeWidth() {
        return this.calculatedScreenWidth * this.widthPercent;
    }

    get planeHeight() {
        return this.calculatedScreenHeight * this.heightPercent;
    }

    /*
    We add hotspot here to a container because we need the context
    */
    setContext(context) {
        super.setContext(context);
        this.onResize();
        this.createMesh();

    }

    disposeMesh() {
        if (this.object3D.children.length) {
            let mesh = this.object3D.children[0];
            this.disposeMaterial(mesh.material);
            this.disposeGeometry(mesh.geometry);
            this.object3D.remove(mesh);
            mesh = null;
        }
    }

    createMesh() {
        this.disposeMesh();
        const {designMode} = this.context.store.getState().configuration;

        const planeWidth = this.planeWidth;
        const planeHeight = this.planeHeight;

        const geometry = new PlaneBufferGeometry(
            planeWidth,
            planeHeight,
            2,
            2);

        const material = new MeshBasicMaterial({color: 0xff0000,
            wireframe: true,
            transparent: !designMode,
            opacity: designMode ? 1 : 0,
        });

        const mesh = new Mesh(geometry, material);
        /*
        calculatedScreenWidth
        ----------------------
        | .____.                   |
        | . (1)    .   (2)         |
        | .____.                   |
        ----------------------

        (1) the viewport on this big, theoretical plane
        We put the invisible hotspot (2) on a big plane
        */
        this.updateMeshPosition(mesh);

        //store for scaling onResize
        this.initialWidth = planeWidth;
        this.initialHeight = planeHeight;

        this.object3D.add(mesh);

        this.object3D.traverse((obj) => {
            obj.userData = this;
        });
    }

    storeUpdate(state) {
        this.updateContainerPosition(state.scene.cameraRotation);
    }

    updateMeshPosition(mesh) {
        const {left, top} = this.config;
        mesh.position.x = this.calculatedScreenWidth * (left / 360);
        mesh.position.y = this.calculatedScreenHeight * (top / 180);
    }

    /*
    We move the container, the big theoretical plane based on camera
    */
    updateContainerPosition(cameraRotation) {
        //wrap
        let lon = cameraRotation.lon;
        //dragging to the left
        if (lon < 0) {
            lon %= -360;
            lon += 360;
        } else {
            //dragging to the right
            lon %= 360;
        }
        this.object3D.position.x = -(this.calculatedScreenWidth * (lon / 360));
        this.object3D.position.y = -(this.calculatedScreenHeight * (cameraRotation.lat / 180));
    }

    get hotspotMesh() {
        return this.object3D.children[0];
    }

    get renderingContext() {
        return this.context.renderingContext;
    }

    @throttle(500)
    onResize() {
        //need to destroy everytime or object picker fails
        this.createMesh();

        const {width, height} = this.renderingContext;
        this.calculatedScreenWidth = 360 / CAMERA_FOV * width;
        this.calculatedScreenHeight = 180 / CAMERA_FOV * height;

        this.updateContainerPosition(this.context.store.getState().scene.cameraRotation);
    }

    set visible(value) {
        this.object3D.visible = value;
    }

    destroy() {
        super.destroy();
    }

}
