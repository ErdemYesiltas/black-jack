import * as PIXI from 'pixi.js';
import { SceneManager } from '../scene/SceneManager';

export class SceneManagerPlugin {
    /** @ignore */
    static extension: PIXI.ExtensionMetadata = PIXI.ExtensionType.Application;
    static _scene: SceneManager;
    static scene: SceneManager;

    static init(options?: GlobalMixins.IApplicationOptions): void {
        // Set default
        options = Object.assign({
            scenes: []
        }, options);

        Object.defineProperty(this, 'scene',
            {
                set(scene) {
                    this._scene = scene;
                },
                get() {
                    return this._scene;
                },
            });
        this._scene = null;
        this.scene = new SceneManager(this as any, options.scenes as any);
    }
    static destroy(): void {
        if (this._scene) {
            this._scene.destroy();
        }
    }
}

PIXI.extensions.add(SceneManagerPlugin);
