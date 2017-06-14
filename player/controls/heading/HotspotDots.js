import {
    TAO,
    PI_OVER_180,
    HALF_PI,
    HEADING_HEIGHT,
    HEADING_WIDTH,
    HOTSPOT_DOTS_RADIUS,
    HOTSPOT_DOT_RADIUS,
} from "../../data/constants";
import * as Utils from "../../utils/Utils";
import {throttle} from "core-decorators";
import {setCameraRotation} from "../../data/actions/sceneActions";

export default class HotspotDots {
    constructor(context, dataStore) {
        this.canvasContext = context;
        this.hotspotDots = [];
        this.store = dataStore;
    }

    render(state) {
        const {hotspots} = state.configuration;
        const {time} = state.scene;
        this.hotspotDots = [];
        this.calculateDotPositions(hotspots, time);
        this.drawDots();
        //this.drawHotspotDots(hotspots, time);
    }

    handleClick(x, y) {
        this.setHoverState(x, y);
        const activeDots = this.hotspotDots.filter(dot => dot.isHovering);
        if (activeDots.length > 0) {
            this.store.dispatch(setCameraRotation({lon: activeDots[0].hotspot.left, lat: activeDots[0].hotspot.top}));
        }
    }

    setHoverState(x, y) {
        this.mouse = {x, y};
        this.hotspotDots.forEach(dot => {
            dot.isHovering = this.isHovering(dot.x, dot.y);
        });
    }

    @throttle(150)
    updateMouse(x, y) {
        this.setHoverState(x, y);
        this.drawDots();
    }

    isHovering(x, y) {
        if (!this.mouse) return false;
        const deltaX = Math.abs(this.mouse.x - x);
        const deltaY = Math.abs(this.mouse.y - y);
        const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
        if (distance < HOTSPOT_DOT_RADIUS * 1.5) { // 1.5 is a fudge factor to make hover feel better
            return true;
        }
        return false;
    }

    calculateDotPositions(hotspots, time) {
        this.hotspotDots = hotspots.map(hotspot => {
            const hotspotRotationPosition = hotspot.left * PI_OVER_180 - HALF_PI;

            const x = Math.cos(hotspotRotationPosition) * HOTSPOT_DOTS_RADIUS + HEADING_WIDTH / 2;
            const y = Math.sin(hotspotRotationPosition) * HOTSPOT_DOTS_RADIUS + HEADING_HEIGHT / 2;
            return {
                hotspot,
                isHovering: this.isHovering(x, y),
                isVisible: Utils.isHotspotVisible(hotspot, time),
                x,
                y,
            };
        });
    }

    drawDots() {
        this.hotspotDots.forEach(dot => {
            if (dot.isVisible) {
                const radiusMultiplier = dot.isHovering ? 2 : 1;
                this.canvasContext.fillStyle = "#ffffff";
                this.canvasContext.beginPath();
                this.canvasContext.arc(
                    dot.x,
                    dot.y,
                    HOTSPOT_DOT_RADIUS * radiusMultiplier,
                    0,
                    TAO,
                    true);
                this.canvasContext.closePath();
                this.canvasContext.fill();
            }
        });
    }

    destroy() {}
}
