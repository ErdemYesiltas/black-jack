import * as PIXI from 'pixi.js';
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

                this._cards.push({ back: defaultBack, ...cardTexture, type: type, subType, value: this._cardValues[subType as CardValues] });
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
            card.data.position.set(330, -40);
            card.data.scale.set(0.75);
            card.data.pivot.set(60, 87);
            card.data.angle = 0;
            card.data.close();

            cards.push(card);
            this._copies.splice(randomIndex, 1);
            this.addChild(card.data);
            // card animation
            const x = 60;
            const y = type === 'dealer' ? -30 : 150;
            const alpha = 1;
            const angle = -360;

            this.scene.tween.add({
                target: card.data,
                to: { x, y, angle, alpha },
                delay: 100 * i,
                duration: 300,
                onStart: () => {
                    card.data.open();
                }
            });
        }

        this._usedCards.push(...cards);

        return cards;
    }
    relase(cards?: ObjectPoolMember<Card>[]): void {
        if (cards === undefined) { cards = this._usedCards; }
        cards.forEach((card, i) => {

            this.scene.tween.add({
                target: card.data,
                to: { x: -300, alpha: 0 },
                duration: 300,
                delay: 100 * i,
                onComplete: () => {
                    if (card.data.parent) {
                        card.data.parent.removeChild(card.data);
                    }
                    const index = this._usedCards.indexOf(card);
                    if (index > -1) {
                        this._usedCards.splice(index, 1);
                    }
                    if (card.data.parent) {
                        card.data.parent.removeChild(card.data);
                    }
                    this._cardPool.release(card);
                }
            });
        });
    }
    protected newCard(): Card {
        return new Card({ back: 'EMPTY', front: 'EMPTY', type: null, subType: null, value: [0] });
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