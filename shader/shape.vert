attribute vec4 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec2 vUv;

#define PI 3.14

void main() {
  vUv = uv;

  vec4 worldPos = modelViewMatrix * position;
  vec4 projected = projectionMatrix * worldPos;
  gl_Position = projected;
}
