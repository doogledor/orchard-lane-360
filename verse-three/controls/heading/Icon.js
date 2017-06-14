import {
    PI_OVER_180,
    HEADING_WIDTH,
    HEADING_HEIGHT,
    HEADING_ICON_HEIGHT,
    HEADING_ICON_WIDTH,
} from "../../data/constants";
import Device from "../../utils/Device";

// 360 heading image is slightly off center.  This is a fudge factor to get it corrected.
const IMG_CORRECTION_FACTOR = Math.PI / 3.75;

export default class Icon {
    constructor(context) {
        this.headingIcon = document.createElement("img");
        const usePng = Device.isIE && !Device.isEdge;
        this.headingIcon.src = ""//usePng ? require("url-loader?limit=10000!./360-heading.png") : require("url-loader?limit=10000!./360-heading.svg");
        this.canvasContext = context;

    }

    render(state) {
        const {cameraRotation} = state.scene;
        this.rotateAndPaintImage(cameraRotation.lon * PI_OVER_180 + IMG_CORRECTION_FACTOR);
    }

    rotateAndPaintImage(angleInRad) {
        this.canvasContext.fillStyle = "#FFFFFF";
        this.canvasContext.translate(HEADING_WIDTH / 2, HEADING_HEIGHT / 2);
        this.canvasContext.rotate(angleInRad);
        this.canvasContext.drawImage(
            this.headingIcon,
            (-HEADING_ICON_WIDTH / 2),
            (-HEADING_ICON_HEIGHT / 2),
            HEADING_ICON_WIDTH,
            HEADING_ICON_HEIGHT);
        this.canvasContext.rotate(-angleInRad);
        this.canvasContext.translate(-HEADING_WIDTH / 2, -HEADING_HEIGHT / 2);
    }

    destroy() {
    }
}
