precision mediump float;
uniform vec3 color;
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main () {
  vec3 rgb = color;
  vec4 texelColor = texture2D( tDiffuse, vUv );
  gl_FragColor = vec4(texelColor.rgb, 1.0);
}