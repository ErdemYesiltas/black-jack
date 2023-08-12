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
    protected _playerCards: PIXI.Container;
    protected _dealerCards: PIXI.Container;
    protected _options: DeckOptions;
    protected _cardPool: ObjectPool<Card>;
    protected _cards: CardOptions[] = [];
    protected _copies: CardOptions[] = [];
    protected _usedCards: ObjectPoolMember<Card>[] = [];

    constructor(scene: Scene, options: DeckOptions) {
        super();
        // needed for tween animation
        this.scene = scene;
        this.name = 'DECK VIEW';

        // dealer card container
        this._dealerCards = new PIXI.Container();
        this._dealerCards.name = 'DEALER CARDS';
        this._dealerCards.position.set(88, -20);
        this._dealerCards.scale.set(0.5);
        this.addChild(this._dealerCards);

        // player card container
        this._playerCards = new PIXI.Container();
        this._playerCards.name = 'PLAYER CARDS';
        this._playerCards.position.set(88, 140);
        this._playerCards.scale.set(0.75);
        this.addChild(this._playerCards);

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

        this.sync();
    }
    sync(): void {
        // sync variables
        const dbDealerCards = this.scene.game.data.get('dealer', []);
        const dbPlayerCards = this.scene.game.data.get('player', []);

        if (dbDealerCards.length > 0 || dbPlayerCards.length > 0) {
            this._copies = this.scene.game.data.get('deck', []);
            const cards = dbDealerCards.concat(dbPlayerCards);
            const playerLen = dbPlayerCards.length - 1;
            const dealerLen = dbDealerCards.length - 1;
            let playerCounter = 0;
            let dealerCounter = 0;

            cards.forEach((c: any) => {
                const isVisible = c.isVisible;
                const owner = c.owner;
                const deckIndex = c.deckIndex;
                const options = this._cards[deckIndex];

                const card = this._cardPool.get();

                card.data.create(options);
                card.data.pivot.set(100);
                card.data.owner = owner;
                isVisible ? card.data.open() : card.data.close();
                this._usedCards.push(card)

                if (owner === 'dealer') {
                    this._dealerCards.addChild(card.data);
                    card.data.x = (dealerLen - dealerCounter++) * -40
                    if (card.data.x < -320) card.data.x = -320;
                } else {
                    this._playerCards.addChild(card.data);
                    card.data.x = (playerLen - playerCounter++) * -45
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
    shuffle(): void {
        this._copies = [...this._cards];
        this.scene.game.data.set('deck', [...this._copies]).writeLocal();
    }
    initial(callback: () => void = null, context: any = null): void {
        if (this.isLocked === false) {
            this.hit(1, 'dealer');
            this.hit(1, 'dealer', false);
            this.hit(2, 'player', true, callback, context);
        }
    }
    hit(
        count = 1,
        type: 'dealer' | 'player',
        isOpened = true,
        callback: () => void = null,
        context: any = null
    ): ObjectPoolMember<Card>[] {
        if (this.isLocked === false) {
            const cards = [];
            const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
            const cardSubtypes = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
            count = Math.min(count, this._copies.length);

            for (let i = 0; i < count; i++) {
                const randomIndex = RandomNumber(0, this._copies.length - 1);
                const cardOptions = this._copies[randomIndex];
                const card = this._cardPool.get();

                card.data.create(cardOptions);
                card.data.alpha = 0;
                card.data.position.set(type === 'dealer' ? 380 : 235, type === 'dealer' ? -80 : -260);
                card.data.angle = -30;
                card.data.pivot.set(100);
                card.data.owner = type;
                cards.push(card);
                isOpened ? card.data.open() : card.data.close();
                type === 'dealer' ? this._dealerCards.addChild(card.data) : this._playerCards.addChild(card.data);

                const dbCards = this.scene.game.data.get(`${type}`, []);
                dbCards.push({
                    owner: type,
                    type: card.data.type,
                    subType: card.data.subType,
                    isVisible: card.data.isVisible,
                    deckIndex: cardSubtypes.indexOf(card.data.subType) + (cardTypes.indexOf(card.data.type) * 13)
                });
                this.scene.game.data.set(`${type}.cards`, dbCards).writeLocal();

                // remove card from deck
                this._copies.splice(randomIndex, 1);
                this.scene.game.data.set('deck', [...this._copies]).writeLocal();
                // card animation
                const gap = type === 'dealer' ? 40 : 45;
                const limitX = type === 'dealer' ? -320 : -180;
                const alpha = 1;
                const angle = -360;

                this.scene.tween.add({
                    target: card.data,
                    to: { x: 0, y: 0, angle, alpha },
                    delay: 100 * (i + 1),
                    duration: 300,
                    onComplete: (obj: any) => {
                        const container = obj.owner === 'dealer' ? this._dealerCards : this._playerCards;
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
                target: this._dealerCards,
                to: { x: -200, alpha: 0 },
                duration: skipAnim ? 10 : 1000,
                easing: TWEEN.Easing.Back.In,
                onComplete: () => {
                    this.scene.game.data.set('dealer', []).writeLocal();
                }
            });

            // move player container
            this.scene.tween.add({
                target: this._playerCards,
                to: { x: -200, alpha: 0 },
                duration: skipAnim ? 10 : 1000,
                delay: skipAnim ? 0 : 100,
                easing: TWEEN.Easing.Back.In,
                onComplete: () => {
                    this.scene.game.data.set('player', []).writeLocal();

                    this._usedCards.forEach((card) => {
                        this._cardPool.release(card);
                    });

                    this._usedCards.length = 0;
                    this._dealerCards.removeChildren();
                    this._dealerCards.position.set(88, -20);
                    this._dealerCards.alpha = 1;
                    this._playerCards.removeChildren();
                    this._playerCards.position.set(88, 140);
                    this._playerCards.alpha = 1;
                }
            });
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
        return this._copies.length;
    }
}