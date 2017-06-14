import * as THREE from "three";

THREE.ImageLoader = function(manager) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

};

Object.assign(THREE.ImageLoader.prototype, {

    load: function(url, onLoad, onProgress, onError) {

        const scope = this;

        const image = document.createElementNS("http://www.w3.org/1999/xhtml", "img");
        image.onload = function() {

            image.onload = null;

            URL.revokeObjectURL(image.src);

            if (onLoad) onLoad(image);

            scope.manager.itemEnd(url);

        };
        image.onerror = onError;

        const loader = new THREE.FileLoader();
        loader.setPath(this.path);
        loader.setResponseType("blob");
        loader.setWithCredentials(this.withCredentials);
        loader.load(url, function(blob) {

            image.src = URL.createObjectURL(blob);

        }, onProgress, onError);

        scope.manager.itemStart(url);

        return image;

    },

    setCrossOrigin: function(value) {

        this.crossOrigin = value;
        return this;

    },

    setWithCredentials: function(value) {

        this.withCredentials = value;
        return this;

    },

    setPath: function(value) {

        this.path = value;
        return this;

    },

});

export default THREE.ImageLoader;
