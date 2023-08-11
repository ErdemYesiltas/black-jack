import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from '../../engine/scene';
import { ObjectPool } from '../../engine/data';
import { RandomNumber } from '../../engine/utils';

export class IWallet {
    total: number;
    deposit: (value: number, skipAnim?: boolean) => void;
    withdraw: (value: number, skipAnim?: boolean) => boolean;
}
export class Wallet extends PIXI.Container implements IWallet {
    scene: Scene;
    protected _total = 0;
    protected _totalText: PIXI.Text;
    protected _valueTween: TWEEN.Tween<any>;
    protected _coinTweens: TWEEN.Tween<any>[] = [];
    protected _coinAnimPool: ObjectPool<PIXI.AnimatedSprite>;

    constructor(scene: Scene, money?: number) {
        super();
        // needed for tween animation
        this.scene = scene;
        this.name = 'WALLET VIEW';

        // background
        const back = new PIXI.Graphics();
        back.name = 'WALLET BACKGROUND';
        back.beginFill('#1e1e1e', .5)./*lineStyle({ width: 2, color: '#fe6665', alpha: 0.5 }).*/drawRoundedRect(0, 0, 200, 30, 7).endFill();
        this.addChild(back);

        // win coin animation pool
        this._coinAnimPool = new ObjectPool(this.createCoinAnim, this.resetCoinAnim, 10);

        // coin animation
        const coinAnim = this._coinAnimPool.get();
        coinAnim.data.visible = true;
        coinAnim.data.animationSpeed = 0.25;
        coinAnim.data.loop = true;
        coinAnim.data.scale.set(0.25);
        coinAnim.data.play();
        coinAnim.data.position.set(5, 7);
        this.addChild(coinAnim.data);

        // total text
        this._totalText = new PIXI.Text('', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 16
        });
        //this._totalText.anchor.set(0, 0.5);
        this._totalText.position.set(40, 5);
        this.addChild(this._totalText);

        // deposit money
        this.deposit(money || 0, true);
    }
    protected createCoinAnim(): PIXI.AnimatedSprite {
        const coinTextures = [
            PIXI.Texture.from('coins/00000'),
            PIXI.Texture.from('coins/00001'),
            PIXI.Texture.from('coins/00002'),
            PIXI.Texture.from('coins/00003'),
            PIXI.Texture.from('coins/00004'),
            PIXI.Texture.from('coins/00005'),
            PIXI.Texture.from('coins/00006'),
        ];

        return new PIXI.AnimatedSprite(coinTextures);
    }
    protected resetCoinAnim(coinAnim: PIXI.AnimatedSprite): PIXI.AnimatedSprite {
        coinAnim.animationSpeed = 1;
        coinAnim.loop = false;
        coinAnim.scale.set(1);
        coinAnim.stop();
        coinAnim.position.set(0, 0);
        coinAnim.visible = false;

        return coinAnim;
    }
    // para yatırma
    deposit(value: number, skipAnim = false): void {
        this.playAnim(this.total + value, skipAnim);
        if (!skipAnim) {
            this.playCoinAnim(value);
        }
        this._total += value;
        this.save();
    }
    // para çekme
    withdraw(value: number, skipAnim = false): boolean {
        if (value > this.total) return false;
        this.playAnim(this.total - value, skipAnim);
        this._total -= value;
        this.save();
        return false;
    }
    save(): void {
        this.scene.game.data.set('balance', this.total);
        this.scene.game.data.writeLocal();
    }
    protected playAnim(value: number, skipAnim = false): void {
        if (this._valueTween && this._valueTween.isPlaying) {
            this._valueTween.end();
            this.scene.tween.remove(this._valueTween);
        }

        const counter = { value: this.total };
        let count = Math.abs(Math.round((value - this.total) / 100));
        count = Math.min(count, 9);

        this._valueTween = this.scene.tween.add({
            target: counter,
            to: { value },
            duration: skipAnim ? 10 : count * 300,
            onUpdate: (obj) => {
                this._totalText.text = `${Math.round(obj.value).toString()} €`;
            },
            start: true
        });
    }
    protected playCoinAnim(value: number): void {
        let coinCount = Math.round(value / 100);
        coinCount = Math.min(coinCount, 9);

        for (let i = 0; i < coinCount; i++) {
            const randomX = RandomNumber(230, 330);
            const randomY = RandomNumber(320, 420);
            const anim = this._coinAnimPool.get();
            anim.data.position.set(randomX, randomY);
            this.scene.tween.add({
                target: anim.data,
                to: { x: 0, y: 0 },
                duration: 500,
                delay: i * 100,
                onStart: () => {
                    anim.data.visible = true;
                    anim.data.animationSpeed = 0.5;
                    anim.data.loop = true;
                    anim.data.scale.set(0.5);
                    anim.data.play();
                    this.addChild(anim.data);
                },
                onComplete: () => {
                    this.removeChild(anim.data);
                    this._coinAnimPool.release(anim);
                }
            });
        }
    }
    // getters and setters
    get total(): number {
        return this._total;
    }
}