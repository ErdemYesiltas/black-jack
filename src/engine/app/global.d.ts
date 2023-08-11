declare namespace GlobalMixins {
    interface Application {
        data: import('../data').DataManager;
        scene: import('../scene').SceneManager
        safeWidth: number;
        safeHeight: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
        align: import('../const').ALIGN
        orientation: import('../const').ORIENTATION;
    }
    interface IApplicationOptions {
        scenes?: SceneConfig[];
        safeWidth?: number;
        safeHeight?: number;
        align?: import('../const').ALIGN;
    }
}
