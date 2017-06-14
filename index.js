import styles from "./index.css";
import Scene from './player'

const S = new Scene(document.querySelector('video'), document.body)
S.start()
