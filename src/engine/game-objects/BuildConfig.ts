import { GameObjectConfig } from './GameObjectConfig';
import { Merge } from '../utils';

export function BuildConfig(config?: GameObjectConfig): GameObjectConfig {
    if (config === undefined || config === null) { config = {}; }

    config = Merge(config, {
        accessible: false,
        accessibleChildren: true,
        accessibleHint: undefined,
        accessiblePointerEvents: 'auto',
        accessibleTitle: undefined,
        accessibleType: 'button',
        addToParent: true,
        alpha: 1,
        anchorX: 0,
        anchorY: 0,
        blendMode: 0,
        buttonMode: false,
        children: [],
        cursor: undefined,
        filterArea: undefined,
        hitArea: undefined,
        height: undefined,
        identity: 'container',
        interactiveChildren: true,
        eventMode: 'none',
        localName: '',
        name: '',
        pivotX: 0,
        pivotY: 0,
        renderable: true,
        roundPixels: false,
        scaleX: 1,
        scaleY: 1,
        skewX: 0,
        skewY: 0,
        tint: 0xFFFFFF,
        visible: true,
        width: undefined,
        x: 0,
        y: 0
    });

    if (typeof config.children === 'object' && Array.isArray(config.children)) {
        for (let i = 0; i < config.children.length; i++) {
            config.children[i] = BuildConfig(config.children[i]);
        }
    }

    // type specific configs
    return config;
}
