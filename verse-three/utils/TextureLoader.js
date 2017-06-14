import * as THREE from "three";
import ImageLoader from "../lib/ImageLoader"; //eslint-disable-line

const TextureLoader = (() => {

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    function load(src, callback) {
        loader.load(src, callback);
    }

    return {
        load,
    };

})();

export default TextureLoader;
