import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from '../../engine/scene';
import { SpriteButton } from './SpriteButton';
import { ObjectPool, ObjectPoolMember } from 'src/engine/data';

export class BetPanel extends PIXI.Container {
    scene: Scene;
    isLocked = false;
    protected _bet = 0;
    protected _betText: PIXI.Text;
    protected _reserved = 0;
    protected _reservedText: PIXI.Text;
    protected _chipPool: ObjectPool<SpriteButton>;
    protected _usedChips: ObjectPoolMember<SpriteButton>[] = [];
    protected _mainChips: Record<string, SpriteButton> = {};
    protected _chips: Record<string, { texture: string, value: number, x: number, y: number }> = {};

    // Record<texture:string,value:number>
    constructor(scene: Scene, chips: Record<string, number>) {
        super();
        // needed for tween animation
        this.scene = scene;
        this.name = 'BET PANEL VIEW';

        // text background
        const back = new PIXI.Graphics();
        back.name = 'BET TEXT BACKGROUND';
        back.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 100, 30, 7).endFill();
        back.position.set(165, -80);
        this.addChild(back);

        this._betText = new PIXI.Text('', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 16
        });
        this._betText.anchor.set(0.5);
        this._betText.position.set(50, 15);
        back.addChild(this._betText);

        this._reservedText = new PIXI.Text('', {
            fontFamily: 'Bungee Regular',
            fill: '#31cac6',
            fontSize: 16
        });
        this._reservedText.anchor.set(0.5);
        this._reservedText.position.set(80, 15);
        back.addChild(this._reservedText);

        const clearBtn = new SpriteButton({
            texture: 'buttons/clean',
            up: '#ffffff',
            enter: '#dddddd',
            down: '#aaaaaa',
            disable: '#555555',
            type: 'tint'
        });
        clearBtn.name = 'BET CLEAR BUTTON';
        clearBtn.position.set(135, -140);
        clearBtn.scale.set(0.5);
        clearBtn.anchor.set(0.5);
        this.addChild(clearBtn);
        clearBtn.onclick = clearBtn.ontap = () => {
            if (this.isLocked === false) {
                this.scene.game.sound.get('button').play();
                this.clear();
            }
        };

        this._chipPool = new ObjectPool(this.createChip, this.resetChip, 5);
        const gap = 90;
        let counter = 0;

        // create main chips
        for (const texture in chips) {
            if (Object.prototype.hasOwnProperty.call(chips, texture)) {
                const value = chips[texture];

                const chip = this._chipPool.get();
                chip.data.texture = PIXI.Texture.from(texture);
                chip.data.scale.set(0.5);
                chip.data.x = gap * counter;
                chip.data.y = -45;
                chip.data.onclick = chip.data.ontap = this.increase.bind(this, value);
                this.addChild(chip.data);

                this._chips[value.toString()] = { texture, value, x: chip.data.x, y: 0 };
                this._mainChips[value.toString()] = chip.data;
                counter++;
            }
        }

        this.sync();
        this.scene.game.data.on('changedata', this.onBalanceChange, this);
    }
    sync(): void {
        // sync bet
        this.bet = this.scene.game.data.get('bet', 0);
        this.reserved = this.scene.game.data.get('reserved', 0);

        // sync chips
        const dbChips = this.scene.game.data.get('chips', []);
        if (Array.isArray(dbChips)) {
            dbChips.forEach((c) => {
                this.playIncreaseChipAnim(c, true);
            });
        }

        this.checkChips();
    }
    reset(): void {
        this.isLocked = false;
        this.clear(true);
    }
    clear(hard = false): void {
        if (this.isLocked === false) {
            const len = this._usedChips.length - 1;
            for (let i = len; i >= 0; i--) {
                if (hard) {
                    this.playDecreaseAnim(i, true, 0);
                } else if ((len - i) <= 5) {
                    this.playDecreaseAnim(i, false, 100 * (len - i));
                } else {
                    this.playDecreaseAnim(i, true, 0);
                }
            }
            this.scene.game.data.set('chips', []);
            this.bet = 0;
            this.checkChips();
        }
    }
    reserve(): void {
        if (this.isLocked === false) {
            this.reserved = this.bet;
            this.clear();
        }
    }
    protected onBalanceChange(key: string): void {
        if (key === 'balance') {
            this.checkChips();
        }
    }
    protected checkChips(): void {
        const balance = this.scene.game.data.get('balance', 0) - this.bet;

        for (const chipValue in this._mainChips) {
            if (Object.prototype.hasOwnProperty.call(this._mainChips, chipValue)) {
                const chip = this._mainChips[chipValue];
                if (parseInt(chipValue) > balance) {
                    chip.disabled();
                } else {
                    chip.enabled();
                }
            }
        }
    }
    protected increase(chip: number): void {
        if (this.isLocked === false) {
            const keys = Object.keys(this._chips);
            const balance = this.scene.game.data.get('balance', 0);

            if (keys.indexOf(chip.toString()) > -1) {
                if (balance >= this._bet + chip) {
                    this.bet += chip;
                    this.checkChips();
                    const dbChips = this.scene.game.data.get('chips', []);
                    dbChips.push(chip);
                    this.scene.game.data.set('chips', dbChips).save();

                    this.playIncreaseChipAnim(chip);
                }
            }
        }
    }
    protected playIncreaseChipAnim(chip: number, skipAnim = false): void {
        // get chip values
        const chipValue = this._chips[chip.toString()];
        // get new chip from pool
        const chipMember = this._chipPool.get();
        this._usedChips.push(chipMember);
        chipMember.data.onclick = chipMember.data.ontap = this.decrease.bind(this, chip, this._usedChips.length - 1);
        chipMember.data.texture = PIXI.Texture.from(chipValue.texture);
        chipMember.data.scale.set(0.5);
        chipMember.data.x = chipValue.x;
        chipMember.data.y = chipValue.y;
        this.addChild(chipMember.data);

        this.scene.tween.add({
            target: chipMember.data,
            to: { x: 180, y: -175 },
            duration: skipAnim ? 10 : 300,
            easing: TWEEN.Easing.generatePow(3).Out,
            onStart: (target: any) => {
                this.scene.game.sound.get('chip').play();
                (target as SpriteButton).eventMode = 'none'
            },
            onComplete: (target: any) => {
                (target as SpriteButton).enabled();
            }
        });
    }
    protected decrease(chip: number, usedIndex: number): void {
        if (this.isLocked === false) {
            const keys = Object.keys(this._chips);

            if (keys.indexOf(chip.toString()) > -1) {
                if (this._bet >= chip) {
                    this.bet -= chip;
                    this.checkChips();

                    const dbChips: number[] = this.scene.game.data.get('chips', []);
                    dbChips.splice(dbChips.lastIndexOf(chip), 1);
                    this.scene.game.data.set('chips', dbChips).save();

                    this.playDecreaseAnim(usedIndex);
                }
            }
        }
    }
    protected playDecreaseAnim(usedIndex: number, skipAnim = false, delay = 0): void {
        // get new chip from pool
        const chipMember = this._usedChips[usedIndex];

        if (chipMember) {
            this._usedChips.splice(usedIndex, 1);
            this.scene.tween.add({
                target: chipMember.data,
                to: { y: 150 },
                delay,
                duration: skipAnim ? 10 : 300,
                easing: TWEEN.Easing.generatePow(3).In,
                onStart: (target: any) => {
                    this.scene.game.sound.get('chip').play();
                    (target as SpriteButton).eventMode = 'none'
                },
                onComplete: () => {
                    this.removeChild(chipMember.data);
                    this._chipPool.release(chipMember);
                }
            });
        }
    }
    protected createChip(): SpriteButton {
        const chip = SpriteButton.Create({
            texture: 'EMPTY',
            up: '#ffffff',
            enter: '#dddddd',
            down: '#aaaaaa',
            disable: '#555555',
            type: 'tint'
        }, this);

        return chip;
    }
    protected resetChip(chip: SpriteButton): SpriteButton {
        chip.texture = null;
        chip.onclick = null;
        chip.ontap = null;
        chip.enabled();

        return chip;
    }
    destroy(): void {
        this.scene.game.data.off('changedata', this.onBalanceChange, this);
    }
    // getters and setters
    get bet(): number {
        return this._bet;
    }
    set bet(value: number) {
        this._bet = value;
        this.scene.game.data.set('bet', value);
        this.scene.game.data.save();
        this._betText.text = `${this._bet.toString()} €`;
    }
    get reserved(): number {
        return this._reserved;
    }
    set reserved(value: number) {
        this._reserved = value;
        this.scene.game.data.set('reserved', value);
        this.scene.game.data;
        this._reservedText.text = `${this._reserved.toString()} €`;
        this._reservedText.visible = value > 0;
        this._betText.x = value > 0 ? 20 : 50;
    }
}