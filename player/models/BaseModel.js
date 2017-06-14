import {
    Mesh,
    Group,
    Object3D,
} from "three";

export default class BaseModel{

    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.object3D = this.makeObject3D();
        this.object3D.userData = this;
        this.children = [];
        this.object3D.traverse((object3D) => {
            object3D.userData = this;
        });
        this.eventListeners = new Map();
    }

    validateConfig() {
        // override and add assertions
    }

    makeObject3D() {
        throw new Error("must implement makeObject3D() when subclassed");
    }

    addChild(model, container) {
        container = container || this.object3D;
        const isModel = model.prototype instanceof BaseModel;
        if (isModel) {
            throw Error("addChild requires a BaseModel descendent");
        }
        if (this.context) {
            model.setContext(this.context);
        }
        container.add(model.object3D);
        this.children.push(model);
    }

    setContext(context) {
        this.context = context;
        this.children.forEach(child => child.setContext(this.context));
    }

    pushUIEvent(eventName, eventData) {
        if (this.eventListeners.get(eventName) && this.eventListeners.get(eventName).length) {
            this.eventListeners.get(eventName).forEach((callback) => callback(eventData));
        }
    }

    addEventListener(eventName, callback) {
        this.eventListeners.get(eventName) || this.eventListeners.set(eventName, []);
        this.eventListeners.get(eventName).push(callback);
    }

    onBeforeFrameRendered() {
        if (this.children && this.children.length) {
            this.children.forEach((child) => child.onBeforeFrameRendered());
        }
    }

    onAfterFrameRendered() {
        if (this.children && this.children.length) {
            this.children.forEach((child) => child.onAfterFrameRendered());
        }
    }

    //*****
    //Dispose
    //*****

    removeChildren() {
        const l = this.children.length;
        for (let i = l - 1; i >= 0; i -= 1) {
            this.children[i].destroy();
        }
    }

    removeObject3DChildren() {
        const l = this.object3D.children.length;
        for (let i = l - 1; i >= 0; i -= 1) {
            const child = this.object3D.children[i];
            this.disposeChild(child);
            this.object3D.remove(child);
        }
    }

    disposeGeometry(geometry) {
        if (geometry) {
            geometry.dispose();
            geometry = null;
        }
    }

    disposeMaterial(material) {
        if (material) {
            this.disposeTexture(material.map);
            material.dispose();
            material = null;
        }
    }

    disposeTexture(texture) {
        if (texture) {
            texture.dispose();
        }
    }

    disposeChild(child) {
        if (child instanceof Mesh) {
            this.disposeMaterial(child.material);
            this.disposeGeometry(child.geometry);
            child.parent.remove(child);
        } else if (child instanceof Object3D || child instanceof Group) {
            const l = child.children.length;
            for (let i = l - 1; i >= 0; i -= 1) {
                const subChild = child.children[i];
                this.disposeChild(subChild);
                if (subChild.parent) {
                    subChild.parent.remove(subChild);
                }
            }
        }
    }


    onResize() {

    }

    destroy() {
        super.destroy();
        this.eventListeners.clear();
        this.removeChildren();
        this.removeObject3DChildren();
    }
}
