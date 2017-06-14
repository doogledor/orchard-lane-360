
import {createStore} from "redux";
import appReducer from "./reducers";


const createDefaultStore = () => createStore(
    appReducer,
);

export default createDefaultStore;
