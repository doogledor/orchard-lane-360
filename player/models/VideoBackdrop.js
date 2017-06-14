import BaseModel from "./BaseModel";
import Device from "../utils/Device";
import {autobind} from "core-decorators";
import {
    LinearFilter,
    Mesh,
    MeshBasicMaterial,
    SphereBufferGeometry,
    VideoTexture,
    Texture,
    ShaderMaterial,
    RGBFormat,
    RGBAFormat,
} from "three";
import HelperCanvas from "../utils/HelperCanvas";
import {
    FPS,
    THEATER_RADIUS,
    THEATER_GEO_SEG_H,
    THEATER_GEO_SEG_V,
} from "../data/constants";

export default class VideoBackdrop extends BaseModel {

    setContext(context) {
        super.setContext(context);
        const {configuration} = this.context.store.getState();
        this.videoFps = configuration.fps;
        this.drawScreenShot();
    }

    makeObject3D() {
        this.videoFps = FPS;
        this.useHelperCanvas = Device.isIE && !Device.isEdge;

        if (this.useHelperCanvas) {
            this.helperCanvas = new HelperCanvas(this.config.videoEl);
            this.videoTexture = new Texture(this.helperCanvas.canvas);
        } else {
            this.videoTexture = new VideoTexture(this.config.videoEl);
        }

        this.videoTexture.generateMipmaps = false;
        this.videoTexture.minFilter = LinearFilter;
        this.videoTexture.magFilter = LinearFilter;
        this.videoTexture.format = Device.isSafari ? RGBAFormat : RGBFormat;

        let material;
        if (Device.isSafari) {
            material = this.getHLSMaterial(this.videoTexture);
        } else {
            material  = new MeshBasicMaterial({map: this.videoTexture});
        }

        this.lastClockTime = 0;

        // Sphere for the video
        const geometry = new SphereBufferGeometry(THEATER_RADIUS, THEATER_GEO_SEG_H, THEATER_GEO_SEG_V);
        geometry.scale(-1, 1, 1);
        return new Mesh(geometry, material);
    }

    //https://github.com/mrdoob/three.js/issues/9754
    getHLSMaterial(videoTexture) {
        videoTexture.flipY = false;

        this.config.videoEl.setAttribute("playsinline", "");
        this.config.videoEl.setAttribute("webkit-playsinline", "");
        this.config.videoEl.setAttribute("crossorigin", "anonymous");

        const uniforms = {
            texture: {value: videoTexture},
        };

        const vertexShader = `varying vec2 vUV;
            void main() {
            vUV = vec2( uv.x, 1.0 - uv.y );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`;

        //feels like a bug, watch this in future
        const colorOrderOutput = Device.isMobileSafari ? "bgra" : "rgba";

        const fragmentShader = `
            uniform sampler2D texture;
            varying vec2 vUV;
            void main() {
              gl_FragColor = texture2D(texture, vUV).${colorOrderOutput};
        }`;

        return new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
        });
    }

    get currentClockTime() {
        return window.performance ? window.performance.now() : new Date().getTime();
    }

    get forceNeedsUpdate() {
        return this.useHelperCanvas || Device.isMobileSafari;
    }

    get renderer() {
        return this.context.renderingContext.renderer;
    }

    drawScreenShot() {
        const dataURI = this.context.store.getState().configuration.screenshotURI;
        if (!dataURI || this.config.videoEl.readyState > 3) {
            return;
        }

        this.screenShotEl = new Image();
        this.screenShotEl.onload = () => {
            const {width, height} = this.screenShotEl;
            let shouldDraw = false;
            if (typeof window.orientation === "undefined") {
                //desktop
                if (this.context.renderingContext.width === width) {
                    shouldDraw = true;
                }
            } else {
                //mobile
                const isDeviceLandscape = Math.abs(window.orientation) > 0;
                const isImageLandscape = (width / height > 1);
                const phoneRotatedAfterScreenshot = isDeviceLandscape !== isImageLandscape;
                shouldDraw = !phoneRotatedAfterScreenshot;
            }
            if (shouldDraw) {
                this.screenShotEl.classList.add("screenshot");
                this.renderer.domElement.parentElement.appendChild(this.screenShotEl);
            } else {
                this.screenShotEl = null;
            }
        };

        this.screenShotEl.src = dataURI;
        this.config.videoEl.addEventListener("loadeddata", this.onVideoLoadedData);
    }

    @autobind
    onVideoLoadedData() {
        const {parentElement} = this.renderer.domElement;
        this.config.videoEl.removeEventListener("loadeddata", this.onVideoLoadedData);
        if (parentElement.contains(this.screenShotEl)) {
            parentElement.removeChild(this.screenShotEl);
        }
        this.screenShotEl = null;
    }

    onBeforeFrameRendered() {
        super.onBeforeFrameRendered();
        if (this.forceNeedsUpdate) {
            const currentTime = this.currentClockTime;
            if (currentTime - this.lastClockTime >= this.videoFps) {
                if (this.helperCanvas) {
                    this.helperCanvas.update();
                }
                this.videoTexture.needsUpdate = true;
                this.lastClockTime = currentTime;
            }
        }
    }

    destroy() {
        super.destroy();
        this.videoTexture.dispose();
        this.videoTexture = null;
        if (this.useHelperCanvas) {
            this.helperCanvas.destroy();
        }
        this.onVideoLoadedData();
    }
}
