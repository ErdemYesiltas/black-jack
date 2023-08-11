import { Group } from './Group';
import { Tween } from './Tween';

export interface TweenConfig {
    target: any;
    to?: Record<string, any>;
    duration?: number;
    delay?: number;
    repeat?: number;
    repeatDelay?: number;
    yoyo?: boolean;
    group?: Group | false;
    easing?: (amount: number) => number;
    interpolation?: (v: number[], k: number) => number;
    chain?: Tween[] | TweenConfig[];
    onStart?: (object: Record<string, any>) => void;
    onEveryStart?: (object: Record<string, any>) => void;
    onUpdate?: (object: Record<string, any>, elapsed: number) => void;
    onRepeat?: (object: Record<string, any>) => void;
    onComplete?: (object: Record<string, any>) => void;
    onStop?: (object: Record<string, any>) => void;
    start?: boolean;
}