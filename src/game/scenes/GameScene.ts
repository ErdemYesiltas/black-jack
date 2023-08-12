import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';
import { BetPanel, Deck, SpriteButton, Wallet } from '../components';

export class GameScene extends Scene {
    protected _dealButton: SpriteButton;
    protected _hitButton: SpriteButton;
    protected _standButton: SpriteButton;
    protected _betClearButton: SpriteButton;
    protected _deck: Deck;

    create(): void {
        // get game config
        const config = PIXI.Cache.get('blackjack');

        // create wallet
        const wallet = new Wallet(this, this.game.data.get('balance', 1000));
        wallet.position.set(45, 60);
        this.addChild(wallet);

        // create bet panel
        const betPanel = new BetPanel(this, config.chips);
        betPanel.position.set(35, 580);
        this.addChild(betPanel);

        this._deck = new Deck(this, config.deck);
        this._deck.position.set(180, 165);
        this.addChild(this._deck);

        this._hitButton.onclick = this._hitButton.ontap = () => {
            this._deck.hit(1, 'player');
        };
        this._standButton.onclick = this._standButton.ontap = () => {
            this._deck.hit(1, 'dealer');
        };
        this._dealButton.onclick = this._dealButton.ontap = () => {
            this._deck.relase();
        };
        this._betClearButton.onclick = this._betClearButton.ontap = () => {
            betPanel.clear();
        };
    }
}