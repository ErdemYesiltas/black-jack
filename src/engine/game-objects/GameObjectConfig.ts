import * as PIXI from 'pixi.js';

export interface GameObjectConfig {
    accessible?: boolean;
    accessibleChildren?: boolean;
    accessibleHint?: string;
    accessiblePointerEvents?: PIXI.PointerEvents;
    accessibleTitle?: string;
    accessibleType?: string;
    addToParent?: boolean;
    alpha?: number;
    anchorX?: number;
    anchorY?: number;
    angle?: number;
    blendMode?: number;
    children?: GameObjectConfig[];
    cursor?: string;
    filterArea?: { x?: number; y?: number; width?: number; height?: number; };
    hitArea?: {
        type?: 'circle' | 'ellipse' | 'polygon' | 'rectangle' | 'roundedrectangle';
        // common properties
        x?: number;
        y?: number;
        // circle or rounded rectangle
        radius?: number;
        // ellipse
        halfWidth?: number;
        halfHeight?: number;
        // rectangle
        width?: number;
        height?: number;
        // polygon
        points?: PIXI.IPointData[] | number[];
    };
    height?: number;
    identity?: string;
    interactiveChildren?: boolean;
    eventMode?: PIXI.EventMode;
    localName?: string;
    name?: string;
    pivotX?: number;
    pivotY?: number;
    renderable?: boolean;
    rotation?: number;
    roundPixels?: boolean;
    scaleX?: number;
    scaleY?: number;
    skewX?: number;
    skewY?: number;
    tint?: number;
    visible?: boolean;
    width?: number;
    x?: number;
    y?: number;
    [key: string]: any;
}
export class GameObjectConfig { }
