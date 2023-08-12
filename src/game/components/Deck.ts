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
    protected _playerCards: PIXI.Container;
    protected _dealerCards: PIXI.Container;
    protected _options: DeckOptions;
    protected _cardPool: ObjectPool<Card>;
    protected _cardValues: Record<CardValues, number | number[]> = {
        'a': [1, 11],
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        '10': 10,
        'j': 10,
        'q': 10,
        'k': 10
    };
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
        const cardSubtypes = Object.keys(this._cardValues);
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

                this._cards.push({ back: defaultBack, ...cardTexture, type: type, subType, value: this._cardValues[subType as CardValues], owner: null });
            });
        });
        this.shuffle();
    }
    shuffle(): void {
        this._copies = [...this._cards];
    }
    hit(count = 1, type: 'dealer' | 'player'): ObjectPoolMember<Card>[] {
        const cards = [];
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
            type === 'dealer' && this._dealerCards.children.length == 1 ? card.data.close() : card.data.open();
            type === 'dealer' ? this._dealerCards.addChild(card.data) : this._playerCards.addChild(card.data);

            const dbCards = this.scene.game.data.get(`${type}.cards`, []);
            dbCards.push({ type: card.data.type, subType: card.data.subType, value: card.data.value });
            this.scene.game.data.set(`${type}.cards`, dbCards).writeLocal();

            // remove card from deck
            this._copies.splice(randomIndex, 1);
            // card animation
            const gap = type === 'dealer' ? 40 : 30;
            const limitX = type === 'dealer' ? -320 : -180;
            const alpha = 1;
            const angle = -360;

            this.scene.tween.add({
                target: card.data,
                to: { x: 0, y: 0, angle, alpha },
                delay: 100 * i,
                duration: 300,
                onComplete: (obj: any) => {
                    const container = obj.owner === 'dealer' ? this._dealerCards : this._playerCards;
                    const children = [...container.children];
                    children.splice(children.indexOf(obj), 1);

                    children.forEach((c) => {
                        if (c.x >= limitX) c.x -= gap;
                    });
                }
            });
        }

        this._usedCards.push(...cards);

        return cards;
    }
    relase(): void {
        // move dealer container
        this.scene.tween.add({
            target: this._dealerCards,
            to: { x: -200, alpha: 0 },
            duration: 1000,
            easing: TWEEN.Easing.Back.In,
            onComplete: () => {
                this.scene.game.data.set('dealer.cards', []).writeLocal();
            }
        });

        // move player container
        this.scene.tween.add({
            target: this._playerCards,
            to: { x: -200, alpha: 0 },
            duration: 1000,
            delay: 100,
            easing: TWEEN.Easing.Back.In,
            onComplete: () => {
                this.scene.game.data.set('player.cards', []).writeLocal();

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
    protected newCard(): Card {
        return new Card({ back: 'EMPTY', front: 'EMPTY', type: null, subType: null, value: [0], owner: null });
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