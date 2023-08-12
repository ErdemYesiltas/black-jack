import * as PIXI from 'pixi.js';
import { BuildConfig, GameObjectConfig, GameObjects } from '../../engine';

export interface SpriteButtonOptions extends GameObjectConfig {
    texture: string,
    up: string,
    enter: string,
    down: string,
    disable: string,
    isEnabled?: boolean,
    type: 'texture' | 'tint'
}
export class SpriteButton extends PIXI.Sprite {
    protected _up: string;
    protected _enter: string;
    protected _leave: string;
    protected _down: string;
    protected _disable: string;
    protected _type: 'texture' | 'tint';
    protected _isDisabled = false;

    constructor(options: SpriteButtonOptions) {
        super(PIXI.Texture.from(options.texture));

        this._up = options.up;
        this._enter = options.enter;
        this._leave = options.up;
        this._down = options.down;
        this._disable = options.disable;
        this._type = options.type;

        // set event listeners
        this.on('pointerenter', this.onPointerEvent, this);
        this.on('pointerleave', this.onPointerEvent, this);
        this.on('pointerdown', this.onPointerEvent, this);
        this.on('pointerup', this.onPointerEvent, this);

        this.cursor = 'pointer';
        if (options.isEnabled === false) {
            this.disabled();
        } else {
            this.enabled();
        }
    }
    static Create(config: SpriteButtonOptions, parent?: PIXI.Container, index?: number): SpriteButton {
        config = BuildConfig(config) as any;
        config.identity = 'spritebutton';
        const sprite = new SpriteButton(config);
        config.eventMode = sprite.eventMode;

        return GameObjects.Build(sprite, config, parent, index);
    }
    // event listeners
    protected onPointerEvent(e: PIXI.FederatedPointerEvent): void {
        const eventType = e.type.replace('pointer', '');
        this.setState(eventType as any);
    }
    protected setState(eventType: 'enter' | 'leave' | 'down' | 'up' | 'disable'): void {
        const textureOrTint = (this as any)[`_${eventType}`];

        if (this._type === 'tint') {
            this.tint = textureOrTint;
        } else {
            this.texture = PIXI.Texture.from(textureOrTint);
        }
    }
    disabled(): void {
        this.eventMode = 'none';
        this._isDisabled = true;
        this.alpha = 0.5;
        this.setState('disable');
    }
    enabled(): void {
        this.eventMode = 'dynamic';
        this._isDisabled = false;
        this.alpha = 1;
        this.setState('up');
    }
    // getters and setters
    get isDisabled(): boolean {
        return this._isDisabled;
    }
}
(GameObjects as any)['spritebutton'] = SpriteButton.Create;
(GameObjects as any)['SpriteButton'] = SpriteButton.Create;