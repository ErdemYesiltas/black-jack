import * as PIXI from 'pixi.js';
import { SceneManager } from './SceneManager';
import { SceneConfig } from './SceneConfig';
import { GameObjectConfig, GameObjects } from '../game-objects';

export interface Scene extends GlobalMixins.Scene, PIXI.Container { }

export class Scene extends PIXI.Container {
    /** Collection of installed plugins. */
    static _plugins:
        {
            init(options: SceneConfig): void;
            destroy(): void;
        }[] = [];

    readonly key: string;
    readonly game: PIXI.Application<PIXI.ICanvas>;
    isBooted = false;
    isActive = true;
    isSleeping = false;
    constructor(readonly manager: SceneManager, config: SceneConfig) {
        super();
        this.key = config.key;
        this.game = manager.game;
        this.name = config.key.toUpperCase();

        // install plugins here
        Scene._plugins.forEach((plugin) => {
            plugin.init.call(this, config);
        });
    }
    buildMap(map?: string | GameObjectConfig | GameObjectConfig[]): void {
        if (map !== undefined) {
            if (typeof map === 'string') {
                map = PIXI.Cache.get(map);
            }

            if (typeof map === 'object') {
                if (Array.isArray(map)) {
                    map.forEach((s) => {
                        GameObjects.Create(s, this);
                    });
                }
                else {
                    GameObjects.Create(map, this);
                }
            }
        }
    }
    init(): void { }
    async preload(): Promise<any> { }
    create(): void { }
    update(_deltaTime: number): void { };
    resize(): void { }

    destroy(options?: PIXI.IDestroyOptions | boolean): void {
        const plugins = Scene._plugins.slice(0);

        plugins.reverse();
        plugins.forEach((plugin) => {
            plugin.destroy.call(this);
        });

        super.destroy(options);
    }
}

PIXI.extensions.handleByList('scene' as any, Scene._plugins);