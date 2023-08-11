import { GameObjectConfig } from '../game-objects';
import { Constructable } from '../utils';
import { Scene } from './Scene';
import * as PIXI from 'pixi.js';

export interface SceneConfig extends GlobalMixins.SceneConfig {
    key: string;
    className: string | Constructable<Scene>;
    active?: boolean;
    data?: string | Record<string, unknown>;
    bundle?: PIXI.ResolverBundle[];
    map?: string | GameObjectConfig | GameObjectConfig[];
}