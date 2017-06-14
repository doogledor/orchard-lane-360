import {
    Euler,
    Matrix3,
    Quaternion,
    Math as THREEMath,
    Vector3,
} from "three";

export const FPS = 24;
export const CAMERA_FOV = 75;

//controls
export const CAMERA_EASE = .1;

export const TAO = Math.PI * 2;
export const PI = Math.PI;
export const HALF_PI = Math.PI / 2;
export const PI_OVER_180 = Math.PI / 180;

export const HOTSPOT_TEXT_SIZE = 14;
export const HOTSPOT_TEXT_DEPTH = 0.05;
export const HOTSPOT_Z_DEPTH = 450;

//sphere
export const THEATER_RADIUS = 500;
export const THEATER_GEO_SEG_H = 60;
export const THEATER_GEO_SEG_V = 40;

//heading
export const HEADING_WIDTH = 60;
export const HEADING_HEIGHT = 60;
export const HEADING_ICON_WIDTH = 45;
export const HEADING_ICON_HEIGHT = 45;

export const HOTSPOT_DOTS_RADIUS = 14; //the dots are positioned around a circle
export const HOTSPOT_DOT_RADIUS = 2;

export const ZER0_VECTOR3 = new Vector3(0,0,0);
export const Y_REFLECT_MATRIX = new Matrix3().set(1,  0, 0,
                                                  0, -1, 0,
                                                  0,  0, 1);
const rightAngleRad = THREEMath.degToRad(90);
export const CAMERA_ORIENTATION_X = new Quaternion(-Math.sin(rightAngleRad / 2), 0, 0, Math.cos(rightAngleRad / 2));
export const CAMERA_ORIENTATION_Y = new Quaternion().setFromEuler(new Euler(0, rightAngleRad, 0));

