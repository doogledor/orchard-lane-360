import createStore from "./data/store";
import styles from "./VideoScene.css";
import RenderingContext from "./utils/RenderingContext";
import ContainerModel from "./models/ContainerModel";
import Heading from "./controls/heading";
import ObjectPicker from "./utils/ObjectPicker";
import VideoBackdrop from "./models/VideoBackdrop";
import Hotspots from "./models/Hotspots";
import createLoop from "raf-loop";
import {autobind} from "core-decorators";
import {setInitialConfig} from "./data/actions/configurationActions";
import {setPlaybackTime} from "./data/actions/sceneActions";
import ExternalEventEmitter from "./events/ExternalEventEmitter";
import * as EventTypes from "./events/eventTypes";


export default class VideoScene {
    constructor(videoEl, containerEl, config = {}) {
        this.store = createStore();
        this.videoEl = videoEl;
        this.renderBound = this.render.bind(this);
        this.containerEl = containerEl;
        this.renderingContext = this.createRenderingContext(config);
        this.videoEl.addEventListener("timeupdate", this.onVideoPlayerUpdate);
        this.store.dispatch(setInitialConfig(config));
        this.heading = new Heading(this.containerDiv, this.store);
        this.globalEmitter = new ExternalEventEmitter();
    }

    @autobind
    onVideoPlayerUpdate(e) {
        this.store.dispatch(setPlaybackTime(this.videoEl.currentTime * 1000));
    }

    updateConfig(config) {
        this.store.dispatch(setInitialConfig(config));
    }

    setHandlers(handlers = {}) {
        this.globalEmitter.clearObservers();
        if (handlers.onHotspotClicked) {
            this.globalEmitter.addObserver(EventTypes.HOTSPOT_CLICKED, (data) => handlers.onHotspotClicked(data));
        }
        if (handlers.cameraRotation) {
            this.globalEmitter.addObserver(EventTypes.CAMERA_ROTATION, (data) => handlers.cameraRotation(data));
        }
        if (handlers.screenShot) {
            this.globalEmitter.addObserver(EventTypes.SCENE_SCREEN_SHOT, (data) => handlers.screenShot(data));
        }
        this.globalEmitter.addObserver(EventTypes.HOTSPOT_MOUSE_OVER, () => this.setItemHovered(true));
        this.globalEmitter.addObserver(EventTypes.HOTSPOT_MOUSE_OUT, () => this.setItemHovered(false));
    }

    setItemHovered(hovering) {
        if (hovering) {
            this.containerDiv.className = `${this.defaultClasses} ${styles.hoveringItem}`;
        } else {
            this.containerDiv.className = this.defaultClasses;
        }
    }

    get defaultClasses() {
        return `video-scene-container ${styles.root}`;
    }

    createRenderingContext(config) {
        const containerDiv = document.createElement("div");
        containerDiv.className = this.defaultClasses;
        if (config.insertBefore) {
            this.containerEl.insertBefore(containerDiv, this.containerEl.childNodes[0]);
        } else {
            this.containerEl.appendChild(containerDiv);
        }
        this.containerDiv = containerDiv;

        return new RenderingContext(containerDiv, this.store, config);
    }

    createModelContext() {
        return {
            globalEmitter: this.globalEmitter,
            renderingContext: this.renderingContext,
            store: this.store,
        };
    }

    initialize() {
        if (!this.initialized) {
            const {scene} = this.renderingContext;
            this.baseContainer = new ContainerModel();
            this.baseContainer.setContext(this.createModelContext());

            this.baseContainer.addChild(new VideoBackdrop({
                videoEl: this.videoEl,
            }));

            const hotspots = new Hotspots();
            this.baseContainer.addChild(hotspots);

            this.objectPicker = new ObjectPicker(this.renderingContext);

            scene.add(this.baseContainer.object3D);
            this.initialized = true;
        }
    }

    pause() {
        if (this.loop) {
            this.loop.stop();
            this.loop = null;
        }
    }

    resume() {
        this.pause();
        this.loop = createLoop(this.renderBound);
        this.loop.start();
    }

    start() {
        this.initialize();
        this.resume();
    }

    resize() {
        if (this.renderingContext) {
            this.renderingContext.resize();
        }
    }

    render(time) {
        this.baseContainer.onBeforeFrameRendered();
        this.renderingContext.render();
        this.baseContainer.onAfterFrameRendered();
        console.log("rer");
    }

    destroy() {
        this.videoEl.removeEventListener("timeupdate", this.onVideoPlayerUpdate);
        this.pause();
        this.heading.destroy();
        this.baseContainer.destroy();
        this.objectPicker.destroy();
        this.renderingContext.destroy();
        this.containerEl.removeChild(this.containerDiv);
        this.renderingContext = null;
    }
}
