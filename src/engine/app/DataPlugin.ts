import * as PIXI from 'pixi.js';
import { DataManager } from '../data';

export class SceneDataPlugin {
    /** @ignore */
    static extension: PIXI.ExtensionMetadata = PIXI.ExtensionType.Application;
    static _data: DataManager;
    static data: DataManager;

    static init(options?: GlobalMixins.IApplicationOptions): void {
        // Set default
        options = Object.assign({
            data: {}
        }, options);

        Object.defineProperty(this, 'data',
            {
                set(data) {
                    this._data = data;
                },
                get() {
                    return this._data;
                },
            });
        this._data = null;
        this.data = new DataManager((options as any).data, 'Game-Storage');
    }
    static destroy(): void {
        if (this._data) {
            this._data.destroy();
        }
    }
}

PIXI.extensions.add(SceneDataPlugin);
