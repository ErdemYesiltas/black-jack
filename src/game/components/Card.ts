import * as PIXI from 'pixi.js';

export type CardTypes = 'clubs' | 'spades' | 'diamonds' | 'hearts';
export type CardValues = 'a' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'j' | 'q' | 'k';
export type CardTextureList = Record<CardTypes, Record<CardValues, string | { back: string, front: string }>>;
export interface CardOptions {
    back: string;
    front: string;
    value: number | number[];
    subType: CardValues;
    type: CardTypes;
}
export class Card extends PIXI.Container {
    value: number | number[] = [0];
    subType: CardValues = null;
    type: CardTypes = null;

    protected _backSide: PIXI.Sprite = null;
    protected _frontSide: PIXI.Sprite = null;
    protected _isVisible = false;

    constructor(options: CardOptions) {
        super();
        this.reset();
        this.create(options);
    }
    create(options: CardOptions): void {
        this.value = options.value;
        this.subType = options.subType;
        this.type = options.type;

        // create card back side
        if (this._backSide === null) {
            this._backSide = new PIXI.Sprite(PIXI.Texture.from(options.back));
            this.addChild(this._backSide);
        } else {
            this._backSide.texture = PIXI.Texture.from(options.back);
        }

        // create card front side
        if (this._frontSide === null) {
            this._frontSide = new PIXI.Sprite(PIXI.Texture.from(options.front));
            this.addChild(this._frontSide);
        } else {
            this._frontSide.texture = PIXI.Texture.from(options.front);
        }
    }
    reset(): void {
        this.position.set(0);
        this.scale.set(1);
        this.pivot.set(0, 0);
        this.alpha = 1;
        this.angle = 0;

        this.value = 0;
        this.subType = null;
        this.type = null;
    }
    open(): void {
        this._isVisible = true;
        this._backSide.visible = !this._isVisible;
        this._frontSide.visible = this._isVisible;
    }
    close(): void {
        this._isVisible = false;
        this._backSide.visible = !this._isVisible;
        this._frontSide.visible = this._isVisible;
    }
    destroy(options?: boolean | PIXI.IDestroyOptions): void {
        this.reset();
        super.destroy(options);
    }
    // getter and setter
    get isVisible(): boolean {
        return this._isVisible;
    }
}