import BaseModel from "./BaseModel";
import {
    HotspotCircleVert,
    HotspotCallToActionVert,
} from "./hotspotVert";
import {
    HotspotCircleFrag,
    HotspotCallToActionFrag,
} from "./hotspotFrag";
import {
    DoubleSide,
    Font,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PlaneBufferGeometry,
    RawShaderMaterial,
    RingGeometry,
    TextGeometry,
    Vector3,
} from "three";
import {
    PI,
    HOTSPOT_TEXT_SIZE,
    HOTSPOT_TEXT_DEPTH,
    HOTSPOT_Z_DEPTH,
    ZER0_VECTOR3,
} from "../data/constants";
import {
    polarToVector3,
} from "../utils/Math";
import * as Utils from "../utils/Utils";
import {autobind} from "core-decorators";
import * as EventTypes from "../events/eventTypes";
import EaseNumber from "../utils/EaseNumber";

import hotspotFont from "../fonts/RobotoCondensed-Regular.json";


const FONT_COLOR = 0xffffff;
const TEXT_OPACITY = 0.7;

export default class HotspotModel extends BaseModel {

    constructor(config) {
        super(config);
        this.addEventListener("click", this.handleClick, false);
        this.addEventListener("mouseover", this.handleMouseOver, false);
        this.addEventListener("mouseout", this.handleMouseOut, false);
    }

    get titleText() {
        return (this.config.title || "").toUpperCase();
    }

    get callToActionText() {
        return this.config.callToAction || "";
    }

    @autobind
    handleClick() {
        const {scene} = this.context.store.getState();
        this.context.globalEmitter.emit(EventTypes.SCENE_SCREEN_SHOT, this.context.renderingContext.takeScreenshot());
        this.context.globalEmitter.emit(EventTypes.CAMERA_ROTATION, scene.cameraRotation);
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_CLICKED, this.config);
    }

    @autobind
    handleMouseOver() {
        this.zDepth.value = HOTSPOT_Z_DEPTH - 20;
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_MOUSE_OVER);
    }

    @autobind
    handleMouseOut() {
        this.zDepth.value = HOTSPOT_Z_DEPTH;
        this.context.globalEmitter.emit(EventTypes.HOTSPOT_MOUSE_OUT);
    }

    storeUpdate(state) {
        const {time} = state.scene;
        this.sceneStore = state.scene;
        //compare the time if it possible
        const isVisible = Utils.isHotspotVisible(this.config, time);
        if (isVisible) {
            this.show();
        } else {
            this.hide();
        }
        if (this.hasProgressRing && isVisible) {
            const {startTime, duration} = this.config;
            this.updateProgressRing((time - startTime) / duration);
        }
        this.updatePosition();

        if (state.configuration.designMode && !this.inDesignMode) {
            this.inDesignMode = true;
        } else if (this.inDesignMode && !state.configuration.designMode) {
            this.inDesignMode = false;
        }
    }

    updatePosition() {
        const {left, top} = this.config;
        polarToVector3(left, top, this.zDepth.value, this.object3D.position);
    }

    ///------------
    //HELPERS
    ///------------

    get hasCallToAction() {
        return this.config.hotspotType === "automatic";
    }

    get hasProgressRing() {
        return !this.config.alwaysShow && this.config.hotspotType === "automatic";
    }

    isMesh(object3D) {
        return object3D instanceof Mesh;
    }

    createContainer() {
        const container = new Object3D();
        return container;
    }

    getObject3DHeight(object3D) {
        const children = object3D.children.filter(child => (this.isMesh(child)));
        return this.getGeometryHeight(children.sort((a, b) => {
            return this.getGeometryHeight(b.geometry) > this.getGeometryHeight(a.geometry);
        })[0].geometry);
    }

    getObject3DWidth(object3D) {
        const children = object3D.children.filter(child => (this.isMesh(child)));
        return this.getGeometryWidth(children.sort((a, b) => {
            return this.getGeometryWidth(b.geometry) > this.getGeometryWidth(a.geometry);
        })[0].geometry);
    }

    getGeometryHeight(geometry) {
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }
        return Math.abs(geometry.boundingBox.max.y) +
            Math.abs(geometry.boundingBox.min.y);
    }

    getGeometryWidth(geometry) {
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }
        return Math.abs(geometry.boundingBox.max.x) +
            Math.abs(geometry.boundingBox.min.x);
    }

    hide() {
        if (this.object3D.visible) {
            this.object3D.visible = false;
        }
    }

    show() {
        if (!this.object3D.visible) {
            this.object3D.visible = true;
        }
    }

    chooseTextTitleStyling() {
        switch (this.config.hotspotType) {
        case "automatic":
            return this.makeBasicStyleMesh.bind(this);
        case "tag":
            return this.makeBorderStyleMesh.bind(this);
        }
    }

    //-------------
    //CREATE OBJECTS
    //-------------

    //STYLING

    //invisible
    makeBasicStyleMesh(geometry) {
        const backdropGeo = new PlaneBufferGeometry(
            this.getGeometryWidth(geometry),
            this.getGeometryHeight(geometry), //extra margin
            2, 2);

        return new Mesh(backdropGeo, new MeshBasicMaterial({
            opacity: 0,
            transparent: true,
            color: 0xff0000,
        }));
    }

    //little bordeer
    makeBorderStyleMesh(geometry) {
        const textWidth = this.getGeometryWidth(geometry) + HOTSPOT_TEXT_SIZE * .75; //extra margin
        const textHeight = this.getGeometryHeight(geometry) + HOTSPOT_TEXT_SIZE * .75; //extra margin
        const backdropGeo = new PlaneBufferGeometry(
            textWidth,
            textHeight,
            Math.floor(textWidth),
            Math.floor(textHeight));

        return new Mesh(backdropGeo, new RawShaderMaterial({
            vertexShader: HotspotCallToActionVert,
            fragmentShader: HotspotCallToActionFrag,
            side: DoubleSide,
            uniforms: {
                width: {value: textWidth},
                height: {value: textHeight},
            },
            transparent: true,
        }));
    }


    createTextMesh(text, options, color = FONT_COLOR) {
        const titleTextGeo = new TextGeometry(text, options);

        titleTextGeo.computeBoundingBox();
        titleTextGeo.computeVertexNormals();
        titleTextGeo.center();

        return new Mesh(titleTextGeo, new MeshBasicMaterial({
            color,
            opacity: TEXT_OPACITY,
            transparent: true,
        }));
    }


    createTitleTextGeo(font) {

        const hotspotContainer = this.createContainer();

        const titleTextMesh = this.createTextMesh(this.titleText, {
            font: font,
            size: HOTSPOT_TEXT_SIZE,
            height: HOTSPOT_TEXT_DEPTH,
            curveSegments: 8,
        });
        hotspotContainer.add(this.chooseTextTitleStyling()(titleTextMesh.geometry));
        hotspotContainer.add(titleTextMesh);

        return hotspotContainer;
    }


    createCallToActionTextGeo(font) {

        const hotspotContainer = this.createContainer();

        const titleTextMesh = this.createTextMesh(this.callToActionText, {
            font: font,
            size: HOTSPOT_TEXT_SIZE * 0.8, //smaller than title
            height: HOTSPOT_TEXT_DEPTH,
            curveSegments: 8,
        });

        hotspotContainer.add(this.makeBorderStyleMesh(titleTextMesh.geometry));
        hotspotContainer.add(titleTextMesh);

        return hotspotContainer;
    }

    createTimerRing(height) {

        const geometry = new RingGeometry(height * 0.7, height * 1.2, 32);
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        const material = new RawShaderMaterial({
            vertexShader: HotspotCircleVert,
            fragmentShader: HotspotCircleFrag,
            side: DoubleSide,
            uniforms: {
                progress: {value: 0.0},
            },
            transparent: true,
        });
        const mesh = new Mesh(geometry, material);
        mesh.rotateZ(-PI / 2);
        mesh.rotateY(PI);

        return mesh;
    }

    getTotalSize(containerObj) {
        // Assume
        const maxVector = new Vector3();
        const minVector = new Vector3();
        let left = 0;
        let top = 0;
        containerObj.children.forEach((obj) => {

            if (this.isMesh(obj)) {
                // mesh top level obj
                if (!obj.geometry.boundingBox) {
                    obj.geometry.computeBoundingBox();
                }

                maxVector.max(obj.geometry.boundingBox.max.sub(obj.position));
                minVector.min(obj.geometry.boundingBox.min.sub(obj.position));
                left = Math.min(obj.position.x, left);
                top = Math.max(obj.position.y, top);
            } else {
                // container object
                obj.traverse((child) => {
                    if (this.isMesh(child)) {
                        if (!child.geometry.boundingBox) {
                            child.geometry.computeBoundingBox();
                        }

                        maxVector.max(child.geometry.boundingBox.max.add(obj.position));
                        minVector.min(child.geometry.boundingBox.min.add(obj.position));
                        left = Math.min(minVector.x, left);
                        top = Math.max(maxVector.y, top);
                    }
                });
            }
        });

        return {
            width: maxVector.x - minVector.x,
            height: maxVector.y - minVector.y,
            left,
            top,
        };
    }

    createClickPlane(hotspotContainer) {
        const size = this.getTotalSize(hotspotContainer);
        // add padding
        size.width += 1;
        size.height += 1;
        const backdropGeo = new PlaneBufferGeometry(
            size.width,
            size.height,
            Math.floor(size.width),
            Math.floor(size.height)
        );

        const material = new MeshBasicMaterial({
            color: 0xff0000,
            opacity: 0.0,
            side: DoubleSide,
            transparent: true,
        });
        const clickPlane = new Mesh(backdropGeo, material);
        clickPlane.position.x = size.left + size.width / 2 - 1;
        clickPlane.position.y = size.top - size.height / 2 + 1;
        clickPlane.position.z = -1;
        return clickPlane;
    }

    makeObject3D() {
        const object3D = new Object3D();
        this.zDepth = new EaseNumber(HOTSPOT_Z_DEPTH, 0.2);

        const hotspotContainer = this.createContainer();

        object3D.add(hotspotContainer);

        const font = new Font(hotspotFont);

        //title text
        const textContainer = this.createTitleTextGeo(font);
        hotspotContainer.add(textContainer);

        //call to action
        if (this.hasCallToAction) {
            const textCalltoActionContainer = this.createCallToActionTextGeo(font);
            const titleHeight = this.getObject3DHeight(textContainer);
            textCalltoActionContainer.position.y = -titleHeight - HOTSPOT_TEXT_SIZE * 0.75;
            textCalltoActionContainer.position.x = -(this.getObject3DWidth(textContainer) -
                this.getObject3DWidth(textCalltoActionContainer)) / 2 - HOTSPOT_TEXT_SIZE * 0.25; //because the geo s centered
            hotspotContainer.add(textCalltoActionContainer);
        }

        if (this.hasProgressRing) {
            this.progressRingMesh = this.createTimerRing(
                this.getObject3DHeight(textContainer) / 2
            );
            //fudge values
            this.progressRingMesh.position.x = -this.getObject3DWidth(textContainer) / 2 - HOTSPOT_TEXT_SIZE;
            hotspotContainer.add(this.progressRingMesh);
        }

        object3D.add(this.createClickPlane(hotspotContainer));

        object3D.position.z = this.zDepth.value;


        object3D.traverse((obj) => {
            obj.userData = this;
        });

        return object3D;
    }

    updateProgressRing(progress) {
        if (this.progressRingMesh) {
            this.progressRingMesh.material.uniforms.progress.value = progress;
        }
    }

    @autobind
    onBeforeFrameRendered() {
        super.onBeforeFrameRendered();

        this.zDepth.update();
        this.object3D.lookAt(ZER0_VECTOR3);
        this.object3D.position.z = this.zDepth.value;
    }

    destroy() {
        super.destroy();
    }
}
