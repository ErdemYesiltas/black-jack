import * as PIXI from 'pixi.js';
import { SoundManager } from '../sound';
import { Howl, Howler } from 'howler';

export class HowlerPlugin {
    /** @ignore */
    static extension: PIXI.ExtensionMetadata = PIXI.ExtensionType.Application;
    static _sound: HowlerGlobal;
    static sound: HowlerGlobal;

    static init(options?: GlobalMixins.IApplicationOptions): void {
        // Set default
        options = Object.assign({
            sounds: []
        }, options);

        Object.defineProperty(this, 'sound',
            {
                set(sound) {
                    this._sound = sound;
                },
                get() {
                    return this._sound;
                },
            });
        // extend howler
        Howler.sounds = {};
        Howler.add = function (name, option) {
            const sound = new Howl(option);
            this.sounds[name] = sound;
            return sound;
        };
        Howler.get = function (name) {
            return this.sounds[name];
        };
        Howler.has = function (name) {
            return this.sounds[name] !== undefined;
        };
        Howler.destroy = function () {
            this.unload();
        }
        this._sound = null;
        this.sound = Howler;
        if (options.sounds) {
            const keys = Object.keys(options.sounds);
            keys.forEach((s) => {
                Howler.add(s, options.sounds[s]);
            });
        }
    }
    static destroy(): void {
        if (this._sound) {
            this._sound.destroy();
        }
    }
}

PIXI.extensions.add(HowlerPlugin);
