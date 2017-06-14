import {Raycaster, Vector2} from "three";
import {autobind} from "core-decorators";
import BaseModel from "../models/BaseModel";


export default class ObjectPicker {
    constructor(renderingContext) {
        this.renderingContext = renderingContext;

        this.raycaster = new Raycaster();
        this.mouse = new Vector2();

        this.renderingContext.containerElement.addEventListener("touchstart", this.onMouseDown);
        this.renderingContext.containerElement.addEventListener("touchend", this.onMouseUp);
        this.renderingContext.containerElement.addEventListener("mousedown", this.onMouseDown);
        this.renderingContext.containerElement.addEventListener("mouseup", this.onMouseUp);
        this.renderingContext.containerElement.addEventListener("mousemove", this.onMouseMove);
        this.renderingContext.containerElement.addEventListener("touchmove", this.onTouchMove);
    }


    @autobind
    onMouseUp(e) {
        const userData = this.getIntersection(e);
        if (userData && userData === this.storedUserData) {
            //the player hotspot data is on config
            if (userData instanceof BaseModel) {
                userData.pushUIEvent("click", e);
            }
            this.storedUserData = null;
        }
    }

    @autobind
    onMouseDown(e) {
        this.storedUserData = this.getIntersection(e);
    }

    @autobind
    onMouseMove(e) {
        this.storedUserData = null;
        const userData = this.getIntersection(e);
        if (userData instanceof BaseModel) {
            if (this.previousMouseOverObject !== userData) {

                if (this.previousMouseOverObject) {
                    this.previousMouseOverObject.pushUIEvent("mouseout", e);
                }

                userData.pushUIEvent("mouseover", e);
            }

            this.previousMouseOverObject = userData;
        }
    }

    @autobind
    onTouchMove() {
        this.storedUserData = null;
    }

    getIntersection(e) {
        this.mouse.x = (e.layerX / this.renderingContext.width) * 2 - 1;
        this.mouse.y = -(e.layerY / this.renderingContext.height) * 2 + 1;

        this.raycaster.setFromCamera(
            this.mouse,
            this.renderingContext.camera
        );

        const perspectiveIntersects = this.raycaster.intersectObjects(this.renderingContext.scene.children, true);

        this.raycaster.setFromCamera(
            this.mouse,
            this.renderingContext.orthographicCamera
        );

        const orthographicIntersects = this.raycaster.intersectObjects(this.renderingContext.scene.children, true);

        const meshes = [
            ...orthographicIntersects,
            ...perspectiveIntersects,
        ].sort((a,b) => (b.distance < a.distance));


        if (meshes[0]) {
            return meshes[0].object.userData;
        }

        return null;
    }

    destroy() {
        this.renderingContext.containerElement.removeEventListener("touchstart", this.onMouseDown);
        this.renderingContext.containerElement.removeEventListener("touchend", this.onMouseUp);
        this.renderingContext.containerElement.removeEventListener("touchmove", this.onTouchMove);
        this.renderingContext.containerElement.removeEventListener("mousedown", this.onMouseDown);
        this.renderingContext.containerElement.removeEventListener("mouseup", this.onMouseUp);
        this.renderingContext.containerElement.removeEventListener("mousemove", this.onMouseMove);
    }
}
