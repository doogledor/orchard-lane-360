import styles from "./index.css";
import Scene from './player'
import Model from './model'
import MTLLoader from './MTLLoader'
import * as THREE from 'three'
import OBJLoader from 'three-obj-loader';
const glslify = require('glslify')

OBJLoader(THREE);

const ASSETS_URL = "assets/"

const S = new Scene(document.querySelector('video'),
  document.body, { hide: false })
S.start()
const { scene } = S.renderingContext
console.log(S);

var filename = `${ASSETS_URL}mesh_reduced.obj`;
var matname = `${ASSETS_URL}mesh_reduced.mtl`;

new Model(
  `${ASSETS_URL}mesh_reduced.obj`,
  `${ASSETS_URL}texture-fs8.png`, { scale: 6, position: { y: -2 } }
).then(model=>{
scene.add(model)
})

