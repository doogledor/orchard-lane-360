import styles from "../../VideoScene.css";
import {autobind} from "core-decorators";
import {
    CAMERA_EASE,
    HEADING_WIDTH,
    HEADING_HEIGHT,
    PI,
    TAO,
} from "../../data/constants";
import Icon from "./Icon";
import HotspotDots from "./HotspotDots";
import {setCameraRotation, setCameraEase} from "../../data/actions/sceneActions";

export default class Heading {
    constructor(targetEl, dataStore) {
        this.canvas = document.createElement("canvas");
        this.canvas.classList.add(styles["video-scene--heading"]);
        this.canvas.width = HEADING_WIDTH;
        this.canvas.height = HEADING_HEIGHT;
        this.targetEl = targetEl;
        this.targetEl.appendChild(this.canvas);

        this.canvasContext = this.canvas.getContext("2d");

        this.layers = [
            new Icon(this.canvasContext),
            new HotspotDots(this.canvasContext, dataStore),
        ];


        this.canvas.addEventListener("click", this.handleClick);
        this.canvas.addEventListener("mousemove", this.handleMouseMove, false);
        this.canvas.addEventListener("mousedown", this.onMouseDown, false);
        this.canvas.addEventListener("mouseup", this.onMouseUp, false);
        this.canvas.addEventListener("mouseleave", this.onMouseUp, false);
        this.store = dataStore;
        this.storeUnsubscribe = this.store.subscribe(this.handleStoreUpdate);
    }

    get hotspotDots() {
        return this.layers[1];
    }

    @autobind
    onMouseDown() {
        this.mouseDown = true;
        //on the store update the camera will snap to the lon value
        this.store.dispatch(setCameraEase(1));
    }

    @autobind
    onMouseUp() {
        this.mouseDown = false;
        this.store.dispatch(setCameraEase(CAMERA_EASE));
    }

    @autobind
    handleClick(e) {
        this.hotspotDots.handleClick(e.offsetX, e.offsetY);
    }

    @autobind
    handleMouseMove(e) {
        this.hotspotDots.updateMouse(e.offsetX, e.offsetY);
        if (this.mouseDown) {
            const x = e.offsetX / HEADING_WIDTH;
            const y = e.offsetY / HEADING_HEIGHT;
            this.handleMouseDrag(x, y);
        }
    }

    handleMouseDrag(x, y) {
        const lon = (TAO - ((Math.atan2(x * 2 - 1, y * 2 - 1) + PI))) / TAO * 360;
        this.store.dispatch(setCameraRotation({lon}));
    }

    @autobind
    handleStoreUpdate() {
        const state = this.store.getState();
        this.render(state);
    }

    render(state) {
        this.canvasContext.clearRect(0, 0, HEADING_WIDTH, HEADING_HEIGHT);
        this.layers.forEach(layer => layer.render(state));
    }

    destroy() {
        this.storeUnsubscribe();
        this.canvas.removeEventListener("click", this.handleClick);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        this.canvas.removeEventListener("mouseup", this.onMouseUp);
        this.canvas.removeEventListener("mouseleave", this.onMouseUp);
        this.targetEl.removeChild(this.canvas);
        this.layers.forEach(layer => layer.destroy());
    }
}
