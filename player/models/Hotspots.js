import BaseModel from "./BaseModel";
import Hotspot from "./Hotspot";
import InvisibleHotspot from "./InvisibleHotspot";
import {
    Object3D,
    Group,
} from "three";
import {autobind} from "core-decorators";

export default class Hotspots extends BaseModel {

    constructor(config) {
        super(config);
        this.hotspots = [];
        window.addEventListener("resize", this.onResize);
    }

    setContext(context) {
        super.setContext(context);
        this.createHotspots();
        this.createInvisibleHotspots();
        this.storeUnsubscribe = this.context.store.subscribe(this.handleStoreUpdate);
    }

    @autobind
    handleStoreUpdate() {
        const state = this.context.store.getState();
        this.hotspots.forEach(hotspot => (hotspot.storeUpdate(state)));
        this.invisibleHotspots.forEach(hotspot => (hotspot.storeUpdate(state)));
    }

    makeObject3D() {
        const hotspots = new Group();
        hotspots.add(new Object3D());
        hotspots.add(new Object3D());
        return hotspots;
    }

    get configurationStore() {
        return this.context.store.getState().configuration;
    }

    get hotspotGroup() {
        return this.object3D.children[0];
    }

    get invisibleHotspotGroup() {
        return this.object3D.children[1];
    }

    createInvisibleHotspots() {
        this.invisibleHotspots = this.configurationStore.hotspots
            .filter(h => h.hotspotType === "invisible")
            .map((hotspotData) => {
                const hotspot = new InvisibleHotspot(hotspotData);
                this.addChild(hotspot, this.invisibleHotspotGroup);
                return hotspot;
            });
    }

    createHotspots() {
        this.hotspots = this.configurationStore.hotspots
            .filter(h => h.hotspotType !== "invisible")
            .map((hotspotData) => {
                const hotspot = new Hotspot(hotspotData);
                this.addChild(hotspot, this.hotspotGroup);
                return hotspot;
            });
    }

      /*
    Render the scene first
    */
    onBeforeFrameRendered() {
        super.onBeforeFrameRendered();
        this.invisibleHotspots.forEach(hotspot => hotspot.visible = false);
    }

    onAfterFrameRendered() {
        super.onAfterFrameRendered();
        this.invisibleHotspots.forEach(hotspot => hotspot.visible = true);
        this.context.renderingContext.renderer.render(this.invisibleHotspotGroup, this.context.renderingContext.orthographicCamera);
    }

    @autobind
    onResize() {
        this.hotspots.forEach(hotspot => hotspot.onResize());
        this.invisibleHotspots.forEach(hotspot => hotspot.onResize());
    }

    destroy() {
        super.destroy();
        this.storeUnsubscribe();
        window.removeEventListener("resize", this.onResize);
    }
}
