export default class HelperCanvas {
    constructor(videoEl) {
        this.videoEl = videoEl;
        const canvas = document.createElement("canvas");
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");

        //use the interval vs screen resizing because we want to catch,
        // when Dash changes streams. TIP: have to use function() or it doesn't clear
        this.videoDimensionsInterval = setInterval(function() {
            const {clientWidth, clientHeight} = this.videoEl;
            if (this.width !== clientWidth || this.height !== clientHeight) {
                //IE will freak if Zero or undefined
                this.width = clientWidth || 0;
                this.height = clientHeight || 0;
                if (this.width > 0 || this.height > 0) {
                    this.handleResize();
                }
            }
        }.bind(this), 500);
    }

    update() {
        this.context.drawImage(this.videoEl, 0, 0, this.width, this.height);
    }

    handleResize() {
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.height = this.height * pixelRatio;
        this.canvas.width = this.width * pixelRatio;
        this.context.scale(pixelRatio, pixelRatio);
    }

    destroy() {
        clearInterval(this.videoDimensionsInterval);
    }
}
