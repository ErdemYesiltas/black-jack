declare namespace GlobalMixins {
    interface SoundManager extends HowlerGlobal {
        sounds: Record<string, import('howler').Howl>;
        add(name: string, option: import('howler').HowlOptions): import('howler').Howl;
        get(name: string): undefined | import('howler').Howl;
        has(name: string): boolean;
    }
    interface Application {
        data: import('../data').DataManager;
        scene: import('../scene').SceneManager;
        sound: SoundManager;
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
