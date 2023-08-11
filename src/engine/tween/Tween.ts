import * as TWEEN from '@tweenjs/tween.js';
import { TweenConfig } from './TweenConfig';
import { Group } from './Group';

export class Tween extends TWEEN.Tween<any>
{
    update(time?: number, autoStart?: boolean): boolean {
        return super.update(time, autoStart);
    }
    chain(...tweens: Tween[] | TweenConfig[]): this {
        const chainTweens: Tween[] = [];

        if (Array.isArray(tweens)) {
            tweens.forEach((value: Tween | TweenConfig) => {
                if (!(value instanceof Tween)) {
                    const t = Tween.build(value);

                    if (t instanceof Tween) {
                        chainTweens.push(t);
                    }
                }
                else {
                    chainTweens.push(value);
                }
            });
        }

        return super.chain(...chainTweens);
    }

    static build(config: TweenConfig, tweenManager: Group | false = false): Tween | null {
        if (typeof config === 'undefined') { config = { target: null }; }
        if (config.target === undefined) { config.target = null; }
        if (config.duration === undefined) { config.duration = 1000; }
        if (config.delay === undefined) { config.delay = 0; }
        if (config.repeat === undefined) { config.repeat = 0; }
        if (config.repeatDelay === undefined) { config.repeatDelay = 0; }
        if (config.yoyo === undefined) { config.yoyo = false; }
        if (config.group === undefined) { config.group = null; }
        if (config.easing === undefined) { config.easing = TWEEN.Easing.Linear.None; }
        if (config.interpolation === undefined) { config.interpolation = null; }
        if (config.chain === undefined) { config.chain = []; }
        if (config.onStart === undefined) { config.onStart = null; }
        if (config.onEveryStart === undefined) { config.onEveryStart = null; }
        if (config.onUpdate === undefined) { config.onUpdate = null; }
        if (config.onRepeat === undefined) { config.onRepeat = null; }
        if (config.onComplete === undefined) { config.onComplete = null; }
        if (config.onStop === undefined) { config.onStop = null; }
        if (config.start === undefined) { config.start = true; }

        if (config.target) {
            const tween = new Tween(config.target, config.group ?? tweenManager);

            // add 'to' values
            if (typeof config.to === 'object' && !Array.isArray(config.to)) {
                tween.to(config.to);
            }

            // add duration
            if (typeof config.duration === 'number') {
                tween.duration(config.duration);
            }

            // add delay
            if (typeof config.delay === 'number') {
                tween.delay(config.delay);
            }

            // add repeat
            if (typeof config.repeat === 'number') {
                tween.repeat(config.repeat);
            }

            // add repeat delay
            if (typeof config.repeatDelay === 'number') {
                tween.repeatDelay(config.repeatDelay);
            }

            // add yoyo
            if (typeof config.yoyo === 'boolean') {
                tween.yoyo(config.yoyo);
            }

            // add group
            if (config.group instanceof Group) {
                tween.group(config.group);
            }

            if (typeof config.easing === 'function') {
                tween.easing(config.easing);
            }

            // add interpolation
            if (typeof config.interpolation === 'function') {
                tween.interpolation(config.interpolation);
            }

            // add chain tweens
            if (!Array.isArray(config.chain)) {
                config.chain = [config.chain];
            }
            tween.chain(...config.chain);

            // add onStart function
            if (typeof config.onStart === 'function') {
                tween.onStart(config.onStart);
            }

            // add onEveryStart function
            if (typeof config.onEveryStart === 'function') {
                tween.onEveryStart(config.onEveryStart);
            }

            // add onUpdate function
            if (typeof config.onUpdate === 'function') {
                tween.onUpdate(config.onUpdate);
            }

            // add onRepeat function
            if (typeof config.onRepeat === 'function') {
                tween.onRepeat(config.onRepeat);
            }

            // add onComplete function
            if (typeof config.onComplete === 'function') {
                tween.onComplete(config.onComplete);
            }

            // add onStop function
            if (typeof config.onStop === 'function') {
                tween.onStop(config.onStop);
            }

            // add start
            if (config.start === true) {
                tween.start();
            }

            return tween;
        }

        return null;
    }
}