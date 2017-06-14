const HotspotCallToActionVert = `
attribute vec4 position;
attribute vec2 uv;
attribute vec3 normal;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;

void main() {
  vUv = uv;

  //convert local to world
  vec4 worldPos = modelViewMatrix * position;
  //add camera
  vec4 projected = projectionMatrix * worldPos;

  gl_Position = projected;
}
`;

export {HotspotCallToActionVert};


const HotspotCircleVert = `
precision mediump float;

attribute vec4 position;
attribute vec3 normal;
attribute vec2 uv;
uniform float progress;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;
varying vec4 vColor;

#define PI 3.14159265359
#define TAO 6.28318530718
#define BASE_COLOR 0.91

void main() {
  vUv = uv;
  float p = 1. - progress;
  //remap uvs to cartessian so the trigonometry works
  vec2 normPos = vUv * 2. - 1.;
  //flip left
  normPos.x *= -1.;

  //GET THE ANGLES
  //map -PI to PI
  float progressTheta = TAO * p - PI;
  //get the angle of the position
  float positionTheta = atan(normPos.y, normPos.x);
  //step compairs two values and returns 0 or 1. 'float step(float edge, float x) '
  if (progressTheta < positionTheta) {
    vColor = vec4(1.0);
  } else {
    vColor = vec4(vec3(BASE_COLOR), .2);
  }

  vec4 worldPos = modelViewMatrix * position;
  vec4 projected = projectionMatrix * worldPos;
  gl_Position = projected;
}
`;

export {HotspotCircleVert};
