import * as PIXI from 'pixi.js';
import { SceneManagerEvents } from './SceneManagerEvents';
import { Scene } from './Scene';
import { SceneConfig } from './SceneConfig';
import { Constructable, StringToClass } from '../utils';

export interface SceneManager extends GlobalMixins.SceneManager { }
export class SceneManager extends PIXI.utils.EventEmitter<SceneManagerEvents>
{
    protected _sceneArr: Scene[] = [];
    protected _scenes: Record<string, { conf: SceneConfig, instance: Scene }> = {};
    protected _current: Scene = null;

    constructor(readonly game: PIXI.Application<PIXI.ICanvas>, scenes?: SceneConfig[]) {
        super();
        this.game.stage.name = 'ROOT';

        if (scenes !== undefined) {
            if (!Array.isArray(scenes)) {
                scenes = [scenes as any];
            }

            scenes.forEach(scene => {
                this.add(scene);
            });
        }

        this.game.renderer.on('resize', this.onResize, this);
        this.game.renderer.on('prerender', this.onPrerender, this);
    }
    // event listeners
    protected onResize(): void {
        this._sceneArr.forEach((scene) => {
            if (scene.isBooted && scene.resize) {
                scene.resize();
            }
        });
    }
    protected onPrerender(): void {
        const dt = this.game.ticker.deltaTime;

        this._sceneArr.forEach((scene) => {
            if (scene.isBooted && scene.isActive) {
                scene.emit('preupdate', dt);
                scene.update && scene.update(dt);
                scene.emit('postupdate', dt);
            }
        });
    }
    has(key: string): boolean {
        return Object.keys(this._scenes).indexOf(key) > -1;
    }
    get(key: string): Scene | null {
        return this.has(key) ? this._scenes[key].instance : null;
    }
    getConf(key: string): SceneConfig | null {
        return this.has(key) ? this._scenes[key].conf : null;
    }
    add(scene: SceneConfig): this {
        if (this.has(scene.key)) {
            this.remove(scene.key);
        }

        if (typeof scene.className === 'string') {
            scene.className = StringToClass(scene.className);
        }
        const instance = new (scene.className as Constructable<Scene>)(this, scene);
        this._scenes[scene.key] = { conf: scene, instance };
        this._sceneArr.push(instance);

        if (typeof instance.init === 'function') {
            instance.init();
            instance.emit('init');
            this.emit('sceneinit', instance.key);
        }

        if (scene.active === true) {
            this.start(scene.key);
        }

        return this;
    }
    start(key: string): this {
        const scene = this.get(key);

        if (scene !== null) {
            if (!scene.isBooted) {
                if (this._scenes[scene.key].conf.bundle) {
                    const bundles = this.getConf(scene.key)?.bundle || [];
                    const bundleNames: string[] = [];

                    bundles.forEach((bundle) => {
                        PIXI.Assets.addBundle(bundle.name, bundle.assets);
                        bundleNames.push(bundle.name);
                    });

                    PIXI.Assets.loadBundle(bundleNames).then(() => {
                        if (scene.preload) {
                            scene.preload().then(() => {
                                this.createScene(scene.key);
                            });
                        }
                        else {
                            this.createScene(scene.key);
                        }
                    });

                    return this;
                }

                if (scene.preload) {
                    scene.preload().then(() => {
                        this.createScene(scene.key);
                    });

                    return this;
                }

                this.createScene(scene.key);
            } else {
                if (scene.isSleeping) {
                    this.wakeup(key);
                }

                if (!scene.isActive) {
                    this.resume(key);
                }
            }
        }
        return this;
    }
    switch(from: string, to: string): this {
        const sceneA = this.get(from);
        const sceneB = this.get(to);

        if (sceneA && sceneB && sceneA !== sceneB) {
            this.sleep(from);

            if (sceneB.isSleeping) {
                this.wakeup(to);
            }
            else {
                this.start(to);
            }
        }

        return this;
    }
    protected createScene(key: string): void {
        const scene = this.get(key);

        if (scene !== null) {
            scene.buildMap(this.getConf(scene.key).map);
            if (scene.create) {
                scene.create();
                scene.emit('created');
                this.emit('scenecreated', scene.key);
            }
            if (scene.resize) {
                scene.resize();
                scene.emit('resize', this.game.screen.width, this.game.screen.height, this.game.orientation);
                this.emit('sceneresize', scene.key, this.game.screen.width, this.game.screen.height, this.game.orientation);
            }
            scene.isBooted = true;
            this._current = scene;

            this.addToStage(scene);
        }
    }
    remove(key: string): this {
        const scene = this.get(key);

        if (scene !== null) {
            if (scene.isBooted) {
                this.stop(key);
            }

            if (this.has(key)) {
                this.removeFromStage(scene);
                delete this._scenes[key];
                this._sceneArr.splice(this._sceneArr.indexOf(scene), 1);
                scene.emit('deleted');
                this.emit('scenedeleted', key);
            }
        }

        return this;
    }
    stop(key: string, options?: PIXI.IDestroyOptions | boolean): this {
        const scene = this.get(key);

        if (scene !== null) {
            this.pause(key);
            this.sleep(key);
            if (this._current === scene) { this._current = null; }
            scene.isBooted && scene.destroy(options);
            scene.isBooted = false;
            scene.emit('stopped');
            this.emit('scenestopped', key);
        }

        return this.remove(key);
    }
    pause(key: string): this {
        const scene = this.get(key);

        if (scene !== null && scene.isBooted && scene.isActive) {
            scene.isActive = false;
            scene.emit('paused');
            this.emit('scenepaused', key);
        }

        return this;
    }
    resume(key: string): this {
        const scene = this.get(key);

        if (scene !== null && scene.isBooted && !scene.isActive) {
            scene.isActive = true;
            scene.emit('resume');
            this.emit('sceneresume', key);
        }

        return this;
    }
    sleep(key: string): this {
        const scene = this.get(key);

        if (scene !== null && scene.isBooted && !scene.isSleeping) {
            scene.isSleeping = true;
            scene.renderable = false;
            scene.emit('slept');
            this.emit('sceneslept', key);
        }

        return this;
    }
    wakeup(key: string): this {
        const scene = this.get(key);

        if (scene !== null && scene.isBooted && scene.isSleeping) {
            scene.isSleeping = false;
            scene.renderable = true;
            scene.emit('wokeup');
            this.emit('scenewokeup', key);
        }

        return this;
    }
    bringToTop(key: string): this {
        if (this.has(key)) {
            const scene = this.get(key);
            const index = this._sceneArr.indexOf(scene);

            if (index !== -1 && index < this._sceneArr.length) {
                this._sceneArr.splice(index, 1);
                this._sceneArr.push(scene);
                this.reOrderScenes();
            }
        }

        return this;
    }
    sendToBack(key: string): this {
        if (this.has(key)) {
            const scene = this.get(key);
            const index = this._sceneArr.indexOf(scene);

            if (index !== -1 && index > 0) {
                this._sceneArr.splice(index, 1);
                this._sceneArr.unshift(scene);
                this.reOrderScenes();
            }
        }

        return this;
    }
    destroy(): void {
        const scenes = this._sceneArr;

        scenes.forEach((scene) => {
            this.remove(scene.key);
        });
    }
    protected reOrderScenes(): void {
        for (let i = 0; i < this._sceneArr.length; i++) {
            this._sceneArr[i].zIndex = i;
        }
        this.game.stage.sortChildren();
    }
    protected addToStage(scene: Scene): void {
        this.game.stage.addChild(scene);
        this.reOrderScenes();
    }
    protected removeFromStage(scene: Scene): void {
        this.game.stage.removeChild(scene);
        this.reOrderScenes();
    }

    // getters and setters
    get current(): Scene {
        return this._current;
    }
}