import {assign} from "lodash";
import {
    CAMERA_ORIENTATION_X,
    CAMERA_ORIENTATION_Y,
    PI,
    Y_REFLECT_MATRIX,
} from "../data/constants";
import {
    Euler,
    Math as THREEMath,
    Quaternion,
    Spherical,
    Vector3,
} from "three";


export function normalizeObjectToRadians(object) {
    const newObj = assign({}, object);
    Object.keys(newObj).forEach(key => (newObj[key] = newObj[key] * PI)); //eslint-disable-line
    return newObj;
}

export function normalizedToVector3(lng, lat, radius) {
    lng *= PI;
    lat *= PI;

    //lat = PI / 2 - lat;
    return new Vector3().set(
        Math.sin(lat) * Math.sin(lng),
        Math.cos(lat),
        Math.sin(lat) * Math.cos(lng)
    ).multiplyScalar(radius);
}

export function polarToVector3(lon, lat, radius, vector) {
    vector = vector || new Vector3();
    const phi = THREEMath.degToRad(90 - lat);
    const theta = THREEMath.degToRad(lon);

    vector.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );

    return vector;
}

export function vector3ToPolar(vector) {
    const spherical = new Spherical();
    spherical.setFromVector3(vector);
    return {
        lat: THREEMath.radToDeg(spherical.phi),
        lon: THREEMath.radToDeg(spherical.theta),
    };
}


export function mapValues(val, in_min, in_max, out_min, out_max) {
    return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

export function clamp(val, min, max) {
    return Math.min(Math.max(min, val), max);
}

export function easeInQuart(t) {
    return t * t * t;
}

export function getCameraOrientation(x, y, z) {
    const xRad = THREEMath.degToRad(x);
    const yRad = THREEMath.degToRad(y);
    const zRad = THREEMath.degToRad(z);
    const euler = new Euler(xRad, zRad, -yRad, "YXZ"); // apply in YXZ rotation order
    const orientQuaternion = new Quaternion();

    orientQuaternion.setFromEuler(euler); // Setup rotation vector from euler rotations
    // adjust 90 deg neg around the x world axis
    orientQuaternion.multiply(CAMERA_ORIENTATION_X);

    const vec = new Vector3(0, 0, 1); // head aligned to z axis by default
    vec.applyQuaternion(orientQuaternion);
    // Rotate camera around the y axis 90 deg to make initial output equal
    vec.applyQuaternion(CAMERA_ORIENTATION_Y);


    // reflect the y coord so that phone forward means facing down
    vec.applyMatrix3(Y_REFLECT_MATRIX);
    return vec;
}
