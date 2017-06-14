
import BaseModel from "./BaseModel";
import {Object3D} from "three";

export default class ContainerModel extends BaseModel {
    makeObject3D() {
        return new Object3D();
    }
}
