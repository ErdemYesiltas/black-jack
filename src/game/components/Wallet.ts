import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from '../../engine/scene';
import { ObjectPool } from '../../engine/data';
import { RandomNumber } from '../../engine/utils';

export class Wallet extends PIXI.Container {
    scene: Scene;
    isLocked = false;
    protected _total = 0;
    protected _totalText: PIXI.Text;
    protected _amountText: PIXI.Text;
    protected _valueTween: TWEEN.Tween<any>;
    protected _amountTween: TWEEN.Tween<any>;
    protected _coinAnimPool: ObjectPool<PIXI.AnimatedSprite>;

    constructor(scene: Scene) {
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
        coinAnim.data.position.set(5, 5);
        this.addChild(coinAnim.data);

        // total text
        this._totalText = new PIXI.Text(`${this._total} €`, {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 16
        });
        //this._totalText.anchor.set(0, 0.5);
        this._totalText.position.set(40, 5);
        this.addChild(this._totalText);

        // total text
        this._amountText = new PIXI.Text('', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 16,
            align: 'right'
        });
        this._amountText.position.set(150, 5);
        this.addChild(this._amountText);

        this.sync();
    }
    sync(): void {
        this.isLocked = false;
        // sync money
        this._total = this.scene.game.data.get('balance', 1000);
        this._totalText.text = `${this._total} €`;
    }
    reset(): void {
        this.resetTweens();

        this._total = 0;
        this._totalText.text = `${this._total} €`;
    }
    protected resetTweens(): void {
        if (this._valueTween && this._valueTween.isPlaying) {
            this._valueTween.end();
            this.scene.tween.remove(this._valueTween);
        }

        if (this._amountTween && this._amountTween.isPlaying) {
            this._amountTween.end();
            this.scene.tween.remove(this._amountTween);
        }

        this._amountText.text = '';
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
    deposit(value: number, skipAnim = false): void {
        if (this.isLocked === false) {
            this.playAnim(this.total + value, skipAnim);
            if (!skipAnim) {
                this.playCoinAnim(value);
            }
            this._total += value;
            this.scene.game.data.set('balance', this._total).save();
        }
    }
    withdraw(value: number, skipAnim = false): boolean {
        if (this.isLocked || value > this.total) return false;
        this.playAnim(this.total - value, skipAnim);
        this._total -= value;
        this.scene.game.data.set('balance', this._total).save();
        return true;
    }
    protected playAnim(totalValue: number, skipAnim = false): void {
        this.resetTweens();

        const counter = { value: this.total };
        const amount = totalValue - this.total;
        let count = Math.abs(Math.round(amount / 10));
        count = Math.min(count, 10);

        this._amountText.style.fill = amount > 0 ? '#ffd700' : '#c00707';
        this._amountText.text = amount.toString();

        this._valueTween = this.scene.tween.add({
            target: counter,
            to: { value: totalValue },
            duration: skipAnim ? 10 : count * 300,
            delay: 250,
            onUpdate: (obj: any) => {
                this._totalText.text = `${Math.round(obj.value).toString()} €`;
            }
        });

        this._amountTween = this.scene.tween.add({
            target: { value: amount },
            to: { value: 0 },
            duration: skipAnim ? 10 : count * 300,
            delay: 250,
            onUpdate: (obj: any) => {
                this._amountText.text = `${Math.round(obj.value).toString()}`;
            },
            onComplete: () => {
                this._amountText.text = '';
            }
        });
    }
    protected playCoinAnim(value: number): void {
        const coinCount = Math.min(value, 20);

        for (let i = 0; i < coinCount; i++) {
            const randomX = RandomNumber(150, 250);
            const randomY = RandomNumber(320, 420);
            const anim = this._coinAnimPool.get();
            anim.data.position.set(randomX, randomY);
            anim.data.scale.set(0.75);
            this.scene.tween.add({
                target: anim.data,
                to: { x: 0, y: 0 },
                duration: 500,
                delay: i * 100,
                onStart: () => {
                    anim.data.visible = true;
                    anim.data.animationSpeed = 0.5;
                    anim.data.loop = true;
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