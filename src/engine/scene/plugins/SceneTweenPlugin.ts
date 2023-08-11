import * as PIXI from 'pixi.js';
import { Group } from '../../tween';

export class SceneTweenPlugin {
    /** @ignore */
    static extension = 'scene';
    static _tween: Group;
    static tween: Group;

    static init(_options: GlobalMixins.SceneConfig): void {

        Object.defineProperty(this, 'tween',
            {
                set(tween) {
                    this._tween = tween;
                },
                get() {
                    return this._tween;
                },
            });
        this._tween = null;
        this.tween = new Group(this as any);
    }
    static destroy(): void {
        if (this._tween) {
            this._tween.destroy();
        }
    }
}

PIXI.extensions.add(SceneTweenPlugin);
