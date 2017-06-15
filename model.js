import styles from "./index.css";
import Scene from './player'
import MTLLoader from './MTLLoader'
import * as THREE from 'three'
import OBJLoader from 'three-obj-loader';
import Q from 'bluebird';
import {values} from 'lodash';
const glslify = require('glslify')
OBJLoader(THREE);

export default (modelPath, imagePath, options = {}) => {
  return new Q((yes, no) => {
    const objLoader = new THREE.OBJLoader();
    objLoader.load(
      modelPath,
      function(object) {

        const mesh = object.children[0]

        const shaderMat = new THREE.RawShaderMaterial({
          uniforms: {
            tDiffuse: { type: 't', value: new THREE.TextureLoader().load(imagePath) },
          },
          vertexShader: glslify('./shader/shape.vert'),
          fragmentShader: glslify('./shader/shape.frag'),
          side: THREE.DoubleSide
        });

        mesh.material = shaderMat
        mesh.scale.x = mesh.scale.y = mesh.scale.z = options.scale

        object.rotateZ(Math.PI)

        object.position.set(...values({
          ...object.position,
          ...options.position,
        }))

        yes(object)

      })
  })
}
