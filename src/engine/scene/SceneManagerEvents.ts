import { ORIENTATION } from '../const';

export interface SceneManagerEvents extends GlobalMixins.SceneManagerEvents {
    sceneinit: [key: string];
    scenecreated: [key: string];
    scenedeleted: [key: string];
    scenestopped: [key: string];
    scenepaused: [key: string];
    sceneresume: [key: string];
    sceneslept: [key: string];
    scenewokeup: [key: string];
    sceneresize: [key: string, width: number, height: number, orientation: ORIENTATION]
}