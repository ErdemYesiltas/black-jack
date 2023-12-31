import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { RandomNumber } from '../../engine/utils';
import { ObjectPool, ObjectPoolMember } from '../../engine/data';
import { Card, CardOptions, CardTextureList, CardTypes, CardValues } from './Card';
import { Scene } from '../../engine/scene';

export interface DeckOptions {
    textures: CardTextureList;
    back: string;
}
export class Deck extends PIXI.Container {
    scene: Scene;
    isLocked = false;
    pCards: Card[] = [];
    dCards: Card[] = [];
    copies: CardOptions[] = [];
    protected _pCardsC: PIXI.Container;
    protected _dCardsC: PIXI.Container;
    protected _options: DeckOptions;
    protected _cardPool: ObjectPool<Card>;
    protected _cards: CardOptions[] = [];
    protected _usedCards: ObjectPoolMember<Card>[] = [];
    protected _cardBelow: PIXI.Sprite;
    protected _cardAbove: PIXI.Sprite;

    constructor(scene: Scene, options: DeckOptions) {
        super();
        // needed for tween animation
        this.scene = scene;
        this.name = 'DECK VIEW';

        // dealer card container
        this._dCardsC = new PIXI.Container();
        this._dCardsC.name = 'DEALER CARDS';
        this._dCardsC.position.set(88, -20);
        this._dCardsC.scale.set(0.5);
        this.addChild(this._dCardsC);

        // player card container
        this._pCardsC = new PIXI.Container();
        this._pCardsC.name = 'PLAYER CARDS';
        this._pCardsC.position.set(88, 140);
        this._pCardsC.scale.set(0.75);
        this.addChild(this._pCardsC);

        this._options = options;
        this._cardPool = new ObjectPool(this.newCard, this.resetCard, 8);

        // fill cards
        const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
        const cardSubtypes = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
        const cardTextures = options.textures;
        const defaultBack = options.back;

        // empty array
        this._cards.length = 0;
        cardTypes.forEach((type: any) => {
            cardSubtypes.forEach((subType: any) => {
                let cardTexture = cardTextures[type as CardTypes][subType as CardValues];
                if (typeof cardTexture === 'string') {
                    cardTexture = { back: defaultBack, front: cardTexture };
                }

                this._cards.push({ back: defaultBack, ...cardTexture, type, subType, owner: null });
            });
        });

        // shuffle card below
        this._cardBelow = new PIXI.Sprite(PIXI.Texture.from(defaultBack));
        this._cardBelow.anchor.set(0.5);
        this._cardBelow.position.set(100, 60);
        this._cardBelow.zIndex = 10;
        this._cardBelow.visible = false;
        this.addChild(this._cardBelow);

        // shuffle card above
        this._cardAbove = new PIXI.Sprite(PIXI.Texture.from(defaultBack));
        this._cardAbove.anchor.set(0.5);
        this._cardAbove.position.set(100, 60);
        this._cardAbove.zIndex = 20;
        this._cardAbove.visible = false;
        this.addChild(this._cardAbove);

        this.sync();
    }
    sync(): void {
        // sync variables
        const dbDCards = this.scene.game.data.get('dealer', []);
        const dbPCards = this.scene.game.data.get('player', []);

        if (dbDCards.length > 0 || dbPCards.length > 0) {
            this.copies = this.scene.game.data.get('deck', []);
            const cards = dbDCards.concat(dbPCards);
            const pLen = dbPCards.length - 1;
            const dLen = dbDCards.length - 1;
            let pConter = 0;
            let dCounter = 0;

            cards.forEach((c: any) => {
                const isVisible = c.isVisible;
                const owner = c.owner;
                const cIndex = c.cIndex;
                const options = this._cards[cIndex];

                const card = this._cardPool.get();

                card.data.create(options);
                card.data.pivot.set(100);
                card.data.owner = owner;
                isVisible ? card.data.open() : card.data.close();
                this._usedCards.push(card)

                if (owner === 'dealer') {
                    this._dCardsC.addChild(card.data);
                    this.dCards.push(card.data);
                    card.data.x = (dLen - dCounter++) * -40
                    if (card.data.x < -320) card.data.x = -320;
                } else {
                    this._pCardsC.addChild(card.data);
                    this.pCards.push(card.data);
                    card.data.x = (pLen - pConter++) * -45
                    if (card.data.x < -180) card.data.x = -180;
                }
            });
        } else {
            this.shuffle();
        }
    }
    reset(): void {
        this.isLocked = false;
        this.relase(true);
    }
    shuffle(playAnim = false, callback: () => void = null, context: any = null): void {
        this.copies = [...this._cards];
        this.scene.game.data.set('deck', [...this.copies]).save();

        if (playAnim) {
            this.playShuffleAnim(callback, context);
        } else if (callback) {
            callback.call(context);
        }
    }
    protected playShuffleAnim(callback: () => void = null, context: any = null): void {
        // card above
        this.scene.tween.add({
            target: this._cardAbove,
            to: { x: 170 },
            duration: 300,
            yoyo: true,
            repeat: 9,
            easing: TWEEN.Easing.generatePow(2).Out,
            onStart: () => {
                this._cardAbove.visible = true;
            },
            onRepeat: () => {
                this._cardAbove.zIndex = this._cardAbove.zIndex === 20 ? 10 : 20;
                this.sortableChildren = true;
            },
            onComplete: () => {
                this.scene.tween.add({
                    target: this._cardAbove,
                    to: { angle: -30 },
                    duration: 300,
                    delay: 150,
                    onComplete: () => {
                        this.scene.tween.add({
                            target: this._cardAbove,
                            to: { x: 295, y: -80, alpha: 0, scale: { x: 0.5, y: 0.5 } },
                            duration: 1000,
                            delay: 250,
                            easing: TWEEN.Easing.generatePow(2).Out,
                            onComplete: () => {
                                this._cardAbove.position.set(100, 60);
                                this._cardAbove.angle = 0;
                                this._cardAbove.alpha = 1;
                                this._cardAbove.scale.set(1);
                                this._cardAbove.zIndex = 20;
                                this._cardAbove.visible = false;
                            }
                        });
                    }
                });
            }
        });

        // card below
        this.scene.tween.add({
            target: this._cardBelow,
            to: { x: 30 },
            duration: 300,
            yoyo: true,
            repeat: 9,
            easing: TWEEN.Easing.generatePow(2).Out,
            onStart: () => {
                this._cardBelow.visible = true;
            },
            onRepeat: () => {
                this._cardBelow.zIndex = this._cardBelow.zIndex === 20 ? 10 : 20;
                this.sortableChildren = true;
            },
            onComplete: () => {
                this.scene.tween.add({
                    target: this._cardBelow,
                    to: { angle: -30 },
                    duration: 300,
                    delay: 300,
                    onComplete: () => {
                        this.scene.tween.add({
                            target: this._cardBelow,
                            to: { x: 295, y: -80, alpha: 0, scale: { x: 0.5, y: 0.5 } },
                            duration: 1000,
                            delay: 250,
                            easing: TWEEN.Easing.generatePow(2).Out,
                            onComplete: () => {
                                this._cardBelow.position.set(100, 60);
                                this._cardBelow.angle = 0;
                                this._cardBelow.alpha = 1;
                                this._cardBelow.scale.set(1);
                                this._cardBelow.zIndex = 10;
                                this._cardBelow.visible = false;
                                this.sortableChildren = true;
                                if (callback) {
                                    callback.call(context);
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    initial(callback: () => void = null, context: any = null): void {
        if (this.isLocked === false) {
            this.hit(1, 'dealer', true);
            this.hit(1, 'dealer', false, 500);
            this.hit(1, 'player', true, 750);
            this.hit(1, 'player', true, 1000, callback, context);
        }
    }
    hit(
        count = 1,
        type: 'dealer' | 'player',
        isOpened = true,
        delay = 250,
        callback: () => void = null,
        context: any = null
    ): ObjectPoolMember<Card>[] {
        if (this.isLocked === false) {
            const cards = [];
            const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
            const cardSubtypes = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
            count = Math.min(count, this.copies.length);

            for (let i = 0; i < count; i++) {
                let randomIndex = RandomNumber(0, this.copies.length - 1);
                const cardOptions = this.copies[randomIndex];
                const card = this._cardPool.get();

                card.data.create(cardOptions);
                card.data.alpha = 0;
                card.data.position.set(type === 'dealer' ? 380 : 235, type === 'dealer' ? -80 : -260);
                card.data.angle = -30;
                card.data.pivot.set(100);
                card.data.owner = type;
                cards.push(card);
                isOpened ? card.data.open() : card.data.close();
                type === 'dealer' ? this._dCardsC.addChild(card.data) : this._pCardsC.addChild(card.data);
                type === 'dealer' ? this.dCards.push(card.data) : this.pCards.push(card.data);

                const dbCards = this.scene.game.data.get(`${type}`, []);
                dbCards.push({
                    owner: type,
                    type: card.data.type,
                    subType: card.data.subType,
                    isVisible: card.data.isVisible,
                    cIndex: cardSubtypes.indexOf(card.data.subType) + (cardTypes.indexOf(card.data.type) * 13)
                });
                this.scene.game.data.set(`${type}`, dbCards).save();

                // remove card from deck
                this.copies.splice(randomIndex, 1);
                this.scene.game.data.set('deck', [...this.copies]).save();
                // card animation
                const gap = type === 'dealer' ? 40 : 45;
                const limitX = type === 'dealer' ? -320 : -180;
                const alpha = 1;
                const angle = -360;

                this.scene.tween.add({
                    target: card.data,
                    to: { x: 0, y: 0, angle, alpha },
                    delay: delay * (i + 1),
                    duration: 300,
                    onStart: () => {
                        this.scene.game.sound.get('card-pick').play();
                    },
                    onComplete: (obj: any) => {
                        const container = obj.owner === 'dealer' ? this._dCardsC : this._pCardsC;
                        const children = [...container.children];
                        children.splice(children.indexOf(obj), 1);

                        children.forEach((c) => {
                            if (c.x >= limitX) c.x -= gap;
                        });

                        if (callback) {
                            callback.call(context);
                        }
                    }
                });
            }

            this._usedCards.push(...cards);

            return cards;
        }
        return null;
    }
    relase(skipAnim = false): void {
        if (this.isLocked === false) {
            // move dealer container
            this.scene.tween.add({
                target: this._dCardsC,
                to: { x: -200, alpha: 0 },
                duration: skipAnim ? 10 : 1000,
                easing: TWEEN.Easing.Back.In,
                onComplete: () => {
                    this.scene.game.data.set('dealer', []).save();
                }
            });

            // move player container
            this.scene.tween.add({
                target: this._pCardsC,
                to: { x: -200, alpha: 0 },
                duration: skipAnim ? 10 : 1000,
                delay: skipAnim ? 0 : 100,
                easing: TWEEN.Easing.Back.In,
                onComplete: () => {
                    this.scene.game.data.set('player', []).save();

                    this._usedCards.forEach((card) => {
                        this._cardPool.release(card);
                    });

                    this._usedCards.length = 0;
                    this._dCardsC.removeChildren();
                    this._dCardsC.position.set(88, -20);
                    this._dCardsC.alpha = 1;
                    this._pCardsC.removeChildren();
                    this._pCardsC.position.set(88, 140);
                    this._pCardsC.alpha = 1;
                }
            });

            // reset variables
            this.pCards.length = 0;
            this.dCards.length = 0;
        }
    }
    protected newCard(): Card {
        return new Card({ back: 'EMPTY', front: 'EMPTY', type: null, subType: null, owner: null });
    }
    protected resetCard(card: Card): Card {
        card.reset();

        return card;
    }
    // getter and setter
    get remains(): number {
        return this.copies.length;
    }
}