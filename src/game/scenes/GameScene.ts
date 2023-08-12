import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';
import { BetPanel, Deck, SpriteButton, Wallet } from '../components';

export class GameScene extends Scene {
    protected _dealerScore: PIXI.Text;
    protected _playerScore: PIXI.Text;
    protected _homeButton: SpriteButton;
    protected _dealButton: SpriteButton;
    protected _hitButton: SpriteButton;
    protected _standButton: SpriteButton;
    protected _wallet: Wallet;
    protected _betPanel: BetPanel;
    protected _deck: Deck;
    protected _sessionID: number = 0;

    init(): void {
        this._sessionID = this.game.data.get('sessionID', -1);
        this.on('wokeup', this.onWokeUp, this);
    }
    create(): void {
        // get game config
        const config = PIXI.Cache.get('blackjack');

        // dealer score
        const dealerText = new PIXI.Graphics();
        dealerText.name = 'DEALER SCORE';
        dealerText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
        dealerText.position.set(620, 200);
        this.addChild(dealerText);

        this._dealerScore = new PIXI.Text('0', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 12,
            align: 'center'
        });
        this._dealerScore.anchor.set(0.5);
        this._dealerScore.position.set(25, 9);
        dealerText.addChild(this._dealerScore);

        // player score
        const playerText = new PIXI.Graphics();
        playerText.name = 'PLAYER SCORE';
        playerText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
        playerText.position.set(620, 380);
        this.addChild(playerText);

        this._playerScore = new PIXI.Text('0', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 12,
            align: 'center'
        });
        this._playerScore.anchor.set(0.5);
        this._playerScore.position.set(25, 9);
        playerText.addChild(this._playerScore);

        // set home button function
        this._homeButton.onclick = this._homeButton.ontap = this.onHomeClick.bind(this);

        // create wallet
        this._wallet = new Wallet(this);
        this._wallet.position.set(425, 70);
        this.addChild(this._wallet);

        // create bet panel
        this._betPanel = new BetPanel(this, config.chips);
        this._betPanel.position.set(425, 600);
        this.addChild(this._betPanel);

        this._deck = new Deck(this, config.deck);
        this._deck.position.set(550, 170);
        this.addChild(this._deck);

        this._dealButton.onclick = this._dealButton.ontap = this.onDeal.bind(this);
        this._hitButton.onclick = this._hitButton.ontap = this.onHit.bind(this);
        this._standButton.onclick = this._standButton.ontap = this.onStand.bind(this);
        // sync game
        this.setStates(this.game.data.get('state', 'deal'));
    }
    protected checkCardValues(): void {
        // reset dealer and player values
        let dealer = 0;
        let player = 0;
        let dealerAce = 0;
        let playerAce = 0;

        // get all cards
        const dealerCards = this.game.data.get('dealer', []);
        const playerCards = this.game.data.get('player', []);
        const cards = dealerCards.concat(playerCards);
        const aceOpt = this.game.data.get('ace', 'both');
        const ace = aceOpt === '1' ? 1 : 11;

        // calculate card values
        cards.forEach((card: any) => {
            if (card.isVisible === false) return;
            if (['k', 'q', 'j'].indexOf(card.subType) > -1) {
                card.owner === 'player' ? player += 10 : dealer += 10;
            } else if (card.subType === 'a') {
                card.owner === 'player' ? player += ace : dealer += ace;
                card.owner === 'player' ? playerAce += 1 : dealerAce += 1;
            } else {
                card.owner === 'player' ? player += parseInt(card.subType) : dealer += parseInt(card.subType);
            }
        });

        let playerTotal = [player];
        let dealerTotal = [dealer];

        if (aceOpt === 'both') {
            for (let i = 0; i < playerAce; i++) {
                playerTotal.push(player - (10 * (i + 1)));

            }
            for (let j = 0; j < dealerAce; j++) {
                dealerTotal.push(dealer - (10 * (j + 1)));
            }
        }

        // filter values
        const playerFiltered = playerTotal.filter(p => p <= 21);
        const dealerFiltered = dealerTotal.filter(d => d <= 21);

        // update texts
        this._playerScore.text = playerFiltered.length > 0 ? playerFiltered.toString().replace(',', '/') : Math.min(...playerTotal).toString();
        this._dealerScore.text = dealerFiltered.length > 0 ? dealerFiltered.toString().replace(',', '/') : Math.min(...dealerTotal).toString();
    }
    // on click deal button
    protected onDeal(): void {
        if (this._wallet.total > 0) {
            if (this._betPanel.bet > 0 && this._wallet.withdraw(this._betPanel.bet)) {
                this._wallet.isLocked = true;
                this._betPanel.isLocked = true;
                // initial cards
                this._deck.initial(() => {
                    this.setStates('hit');
                    this.checkCardValues();
                }, this);
            } else {
                this.setStates('deal');
            }
        } else {
            this.setStates('noMoney');
        }
    }
    // on click hit button
    protected onHit(): void {
        this._deck.hit(1, 'player', true, this.checkCardValues, this);
    }
    // on click stand button
    protected onStand(): void {
        this.setStates('stand');
    }
    // syn game states
    protected setStates(state: 'deal' | 'hit' | 'stand' | 'finished' | 'noMoney'): void {
        this.game.data.set('state', state).writeLocal();
        switch (state) {
            case 'deal':
                if (this._wallet.total > 0) {
                    this._hitButton.disabled();
                    this._standButton.disabled();
                    this._dealButton.enabled();
                    this._wallet.isLocked = false;
                    this._betPanel.isLocked = false;
                    this._deck.isLocked = false;
                } else {
                    this.setStates('noMoney');
                }
                break;
            case 'hit':
                this._hitButton.enabled();
                this._standButton.enabled();
                this._dealButton.disabled();
                this._wallet.isLocked = true;
                this._betPanel.isLocked = true;
                this._deck.isLocked = false;
                this.checkCardValues();
                break;
            case 'stand':
            case 'finished':
            case 'noMoney':
                this._hitButton.disabled();
                this._standButton.disabled();
                this._dealButton.disabled();
                this._wallet.isLocked = true;
                this._betPanel.isLocked = true;
                this._deck.isLocked = true;
                break;
        }
    }
    // home button click
    protected onHomeClick(): void {
        this.game.scene.sleep(this.key);
        this.game.scene.start('MenuScene');
    }
    /*protected showResult(result: 'win' | 'lost' | 'draw' | 'blackjack'): void {

    }*/
    // scene events
    protected onWokeUp(): void {
        const sessionID = this.game.data.get('sessionID', -1);
        if (this._sessionID !== sessionID) {
            this._sessionID = sessionID;

            this._playerScore.text = '0';
            this._dealerScore.text = '0';

            this._wallet.reset();
            this._wallet.sync();

            this._betPanel.reset();
            this._betPanel.sync();

            this._deck.reset();
            this._deck.sync();

            this.setStates(this.game.data.get('state', 'deal'));
        }
    }
}