import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from '../scene';
import { TweenConfig } from './TweenConfig';
import { Tween } from './Tween';

export class Group extends TWEEN.Group {
    protected _scene: Scene;
    protected _isPaused = false;
    protected _pauseStart = 0;

    constructor(scene: Scene) {
        super();
        this._scene = scene;
        this._scene.on('preupdate', this.update.bind(this));
    }

    update(): boolean {
        if (this._scene.isActive && !this._isPaused) {
            return super.update();
        }

        return true;
    }

    destroy(): void {
        this.removeAll();
        this._scene.off('preupdate', this.update.bind(this));
    }

    build(tween: TweenConfig): Tween | null {
        return Tween.build(tween, this);
    }

    add(tween: Tween | TweenConfig): Tween {
        if (!(tween instanceof Tween)) {
            tween = this.build(tween);
        }
        if (tween instanceof Tween) {
            super.add(tween);
        }

        return tween;
    }

    pause(time: number = performance.now()): this {
        if (this._isPaused) {
            return this;
        }

        this._isPaused = true;

        this._pauseStart = time;

        return this;
    }
    resume(time: number = performance.now()): this {
        if (!this._isPaused) {
            return this;
        }

        this._isPaused = false;
        const diff = time - this._pauseStart;
        const allTweens = (this as any)._tweens;

        const tweenKeys = Object.keys(allTweens);
        const len = tweenKeys.length;

        for (let i = 0; i < len; i++) {
            allTweens[tweenKeys[i]]._startTime += diff;
        }

        this._pauseStart = 0;

        return this;
    }
}