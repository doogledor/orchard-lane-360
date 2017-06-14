const HotspotCallToActionFrag = `
precision mediump float;
uniform float height;
uniform float width;

varying vec2 vUv;

#define INITIAL 0.01
#define BORDER 0.04
#define BACKGROUND 0.0

void main () {
    vec2 uv = vUv;

    //we need to scale this 'step' on X and Y
    float aspect = height / width;
    float aspectInitial = INITIAL * aspect;
    float aspectBorder = BORDER * aspect;

    //we will stack this
    float borderColor = 0.;

    //smoothstep performs smooth Hermite interpolation
    // between 0 and 1 when edge0 < x < edge1.
    //This is useful in cases where a threshold function with
    // a smooth transition is desired.

    //smoothstep(edge0, edge1, value) eg: smoothstep(0.01, 0.05, 0.03) = 0.65
    // eg: smoothstep(0.01, 0.05, 0.5) = 1.

    //left side: most of the borderColor would be 1. so we need to invert it
    borderColor += 1. - smoothstep(aspectInitial, aspectInitial + aspectBorder, uv.x);
    //right side
    borderColor += smoothstep((1. - (aspectInitial + aspectBorder)), (1. - aspectInitial), uv.x);
    //top side
    borderColor += 1.- smoothstep(INITIAL, INITIAL + BORDER, uv.y);
    //bottom side
    borderColor += smoothstep(1. - (INITIAL + BORDER), 1. - INITIAL, uv.y);

    //We let some on the values from smoothstep pass so the edge is slighty soft
    if(borderColor < 0.6) {
        gl_FragColor = vec4(vec3(0.0), 0.09);
    } else {
        gl_FragColor = vec4(vec3(borderColor), 0.7);
    }


}
`;

export {HotspotCallToActionFrag};


const HotspotCircleFrag = `
precision mediump float;
uniform float progress;
varying vec2 vUv;
varying vec4 vColor;

void main () {
  gl_FragColor = vColor;
}
`;

export {HotspotCircleFrag};
