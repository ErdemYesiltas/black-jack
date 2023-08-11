declare namespace GlobalMixins {
    interface SceneManager { }
    interface SceneManagerEvents { }
    interface Scene {
        data: import('../data').DataManager;
        tween: import('../tween').Group;
    }
    interface SceneConfig { }
    interface DisplayObjectEvents {
        preupdate: [deltaTime: number];
        postupdate: [deltaTime: number];
        init: [];
        created: [];
        deleted: [];
        stopped: [];
        paused: [];
        resume: [];
        slept: [];
        wokeup: [];
        resize: [width: number, height: number, orientation: import('../const').ORIENTATION];
    }
}
