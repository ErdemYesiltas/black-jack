import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Scene } from '../../engine/scene';
import { BetPanel, Deck, SpriteButton, Wallet } from '../components';

export class GameScene extends Scene {
    protected _dScoreText: PIXI.Text;
    protected _pScoreText: PIXI.Text;
    protected _resultText: PIXI.Text;
    protected _blackBack: PIXI.Graphics;
    protected _popup: PIXI.Graphics;
    protected _homeButton: SpriteButton;
    protected _dealButton: SpriteButton;
    protected _hitButton: SpriteButton;
    protected _standButton: SpriteButton;
    protected _wallet: Wallet;
    protected _betP: BetPanel;
    protected _deck: Deck;
    protected _sessionID: number = 0;
    protected _pScores: number[] = [0];
    protected _dScores: number[] = [0];

    init(): void {
        this._sessionID = this.game.data.get('sessionID', -1);
        this.on('wokeup', this.onWokeUp, this);
    }
    create(): void {
        // get game config
        const config = PIXI.Cache.get('blackjack');

        // dealer score
        const dText = new PIXI.Graphics();
        dText.name = 'DEALER SCORE';
        dText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
        dText.position.set(620, 200);
        this.addChild(dText);

        this._dScoreText = new PIXI.Text('0', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 12,
            align: 'center'
        });
        this._dScoreText.anchor.set(0.5);
        this._dScoreText.position.set(25, 9);
        dText.addChild(this._dScoreText);

        // player score
        const pText = new PIXI.Graphics();
        pText.name = 'PLAYER SCORE';
        pText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
        pText.position.set(620, 380);
        this.addChild(pText);

        this._pScoreText = new PIXI.Text('0', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 12,
            align: 'center'
        });
        this._pScoreText.anchor.set(0.5);
        this._pScoreText.position.set(25, 9);
        pText.addChild(this._pScoreText);

        // set home button function
        this._homeButton.onclick = this._homeButton.ontap = this.onHomeClick.bind(this);

        // create bet panel
        this._betP = new BetPanel(this, config.chips);
        this._betP.position.set(425, 600);
        this.addChild(this._betP);

        this._deck = new Deck(this, config.deck);
        this._deck.position.set(550, 170);
        this.addChild(this._deck);

        this._dealButton.onclick = this._dealButton.ontap = this.onDeal.bind(this);
        this._hitButton.onclick = this._hitButton.ontap = this.onHit.bind(this);
        this._standButton.onclick = this._standButton.ontap = this.onStand.bind(this);

        // black background
        this._blackBack = new PIXI.Graphics();
        this._blackBack.visible = false;
        this._blackBack.alpha = 0;
        this._blackBack.name = 'BLACK BACKGROUND';
        this._blackBack.beginFill('#000000', .7).lineStyle({ width: 5 }).drawRect(0, 0, 1280, 720).endFill();
        this._blackBack.eventMode = 'dynamic';

        this.addChild(this._blackBack);

        // create wallet
        this._wallet = new Wallet(this);
        this._wallet.position.set(425, 70);
        this.addChild(this._wallet);

        // result text
        this._resultText = new PIXI.Text('PUSH', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 100,
            align: 'center',
            wordWrap: true,
            breakWords: true,
            wordWrapWidth: 400
        });
        this._resultText.name = 'RESULT TEXT';
        this._resultText.visible = false;
        this._resultText.alpha = 0;
        this._resultText.scale.set(0);
        this._resultText.anchor.set(0.5);
        this._resultText.position.set(640, 360);
        this.addChild(this._resultText);

        // popup
        this._popup = new PIXI.Graphics();
        this._popup.visible = false;
        this._popup.alpha = 0;
        this._popup.name = 'POPUP BACKGROUND';
        this._popup.beginFill('#000000', 1).lineStyle({ width: 5 }).drawRoundedRect(0, 0, 300, 200, 10).endFill();
        this._popup.position.set(490, 140);
        this.addChild(this._popup);

        // popup text
        const popupText = new PIXI.Text('Not enough money!', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 24,
            align: 'center',
            wordWrap: true,
            breakWords: true,
            wordWrapWidth: 250
        });
        popupText.position.set(70, 50);
        this._popup.addChild(popupText);

        // popup deposit button
        const depositBtn = new SpriteButton({
            texture: 'buttons/start',
            up: '#ffffff',
            enter: '#dddddd',
            down: '#aaaaaa',
            disable: '#555555',
            type: 'tint'
        });
        depositBtn.anchor.set(0.5);
        depositBtn.scale.set(0.35);
        depositBtn.position.set(60, 165);
        const deposit1000 = new PIXI.Text('+1000 €', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 40,
            align: 'center'
        });
        deposit1000.position.set(-88, -22);
        depositBtn.onclick = depositBtn.ontap = () => {
            this.game.sound.get('button').play();
            this._wallet.deposit(1000);
            this.setState('deal');
            this.closePopup();
        };
        depositBtn.addChild(deposit1000);
        this._popup.addChild(depositBtn);

        // popup reset button
        const resetBtn = new SpriteButton({
            texture: 'buttons/stand',
            up: '#ffffff',
            enter: '#dddddd',
            down: '#aaaaaa',
            disable: '#555555',
            type: 'tint'
        });
        resetBtn.anchor.set(0.5);
        resetBtn.scale.set(0.35);
        resetBtn.position.set(150, 165);
        const resetText = new PIXI.Text('RESET', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 40,
            align: 'center'
        });
        resetText.position.set(-88, -22);
        resetBtn.onclick = resetBtn.ontap = () => {
            this.game.sound.get('button').play();
            this.closePopup();
            this.game.data.clear(true);
            this.game.scene.start('MenuScene');
            this.game.scene.sleep(this.key);
        };
        resetBtn.addChild(resetText);
        this._popup.addChild(resetBtn);

        // popup cancel button
        const cancelBtn = new SpriteButton({
            texture: 'buttons/hit',
            up: '#ffffff',
            enter: '#dddddd',
            down: '#aaaaaa',
            disable: '#555555',
            type: 'tint'
        });
        cancelBtn.anchor.set(0.5);
        cancelBtn.scale.set(0.35);
        cancelBtn.position.set(240, 165);
        const cancelText = new PIXI.Text('CANCEL', {
            fontFamily: 'Bungee Regular',
            fill: '#ffffff',
            fontSize: 40,
            align: 'center'
        });
        cancelText.position.set(-88, -22);
        cancelBtn.onclick = cancelBtn.ontap = () => {
            this.game.sound.get('button').play();
            this.closePopup();
        };
        cancelBtn.addChild(cancelText);
        this._popup.addChild(cancelBtn);

        // sync game
        this.setState(this.game.data.get('state', 'deal'));
    }
    protected showPopup(): void {
        this._blackBack.visible = true;
        this._blackBack.alpha = 1;
        this._popup.visible = true;
        this._popup.alpha = 1;
    }
    protected closePopup(): void {
        this._blackBack.visible = false;
        this._blackBack.alpha = 0;
        this._popup.visible = false;
        this._popup.alpha = 0;
    }
    protected calculateScore(cards: any[]): number[] {
        // reset dealer values
        let score = 0;
        let aces = 0;

        // calculate card values
        cards.forEach((card: any) => {
            if (card.isVisible === false) return;
            if (['k', 'q', 'j'].indexOf(card.subType) > -1) {
                score += 10;
            } else if (card.subType === 'a') {
                score += 11;
                aces++;
            } else {
                score += parseInt(card.subType);
            }
        });

        let tScore = [score];

        // check ace values
        for (let j = 0; j < aces; j++) {
            tScore.push(score - (10 * (j + 1)));
        }

        // filter values
        const lower21 = tScore.filter(s => s <= 21);
        // update scores
        return lower21.length > 0 ? [...lower21] : [Math.min(...tScore)];
    }
    protected checkCards(): void {
        const state = this.game.data.get('state', 'deal');

        if (state === 'hit') {
            // update scores
            this._pScores = this.calculateScore(this.game.data.get('player', []));
            // update texts
            this._pScoreText.text = this._pScores.toString().replace(',', '/');
            this.checkResult();
        }

        if (state === 'stand' || state === 'hit') {
            // update scores
            this._dScores = this.calculateScore(this.game.data.get('dealer', []));
            // update texts
            this._dScoreText.text = this._dScores.toString().replace(',', '/');
            this.checkResult();
        }
    }
    protected checkResult(): void {
        const state = this.game.data.get('state', 'deal');
        if (state === 'hit') {
            for (let i = 0; i < this._pScores.length; i++) {
                if (this._pScores[i] >= 21) {
                    this._pScores = [this._pScores[i]];
                    this.checkAdditionBet();
                    break;
                }
            }
        } else if (state === 'stand') {
            let isOver = false;

            for (let i = 0; i < this._dScores.length; i++) {
                if (
                    this._dScores[i] > 21
                    || (this._dScores[i] >= this._pScores[0] && this._dScores[i] <= 21)
                    || (this._pScores[0] >= 21 && this._dScores[i] <= 21)
                ) {
                    this._dScores = [this._dScores[i]];
                    this.setState('finished');
                    isOver = true;
                    break;
                }
            }
            if (!isOver) this.playForDealer();
        }
    }
    protected checkAdditionBet(): void {
        if (this._betP.bet > 0 && !this._wallet.withdraw(this._betP.bet)) {
            this.showPopup();
            return;
        }
        this.setState('stand');
    }
    protected playForDealer(): void {
        const isRevealed = this.game.data.get('revealed', false);
        if (!isRevealed) {
            this.game.data.set('revealed', true);
            this._deck.dCards[1].open();
            // update database
            const dCards = this.game.data.get('dealer', []);
            dCards[1].isVisible = true;
            this.game.data.set('dealer', dCards);
            this.checkCards();
        } else {
            //setTimeout(() => {
            this._deck.hit(1, 'dealer', true, this.checkCards, this);
            //}, 500);
        }
    }
    protected decideNextMove(): void {
        const state = this.game.data.get('state', 'deal');

        if (state === 'finished') {
            const pScore = this._pScores[0];
            const dScore = this._dScores[0];
            let result: 'win' | 'push' | 'lose' | 'bust' | 'blackjack' = 'push';

            if (pScore > dScore) {
                result = pScore < 21 ? 'win' : (pScore > 21 ? 'bust' : 'blackjack');
            } else if (pScore < dScore) {
                result = dScore <= 21 ? 'lose' : 'win';
            }

            this.playResult(result);

        } else if (state === 'noMoney') {
            this.showPopup();
        }
    }
    protected playInitialCards(): void {
        this._deck.initial(() => {
            this.setState('hit');
            this.checkCards();
        }, this);
    }
    protected playResult(result: 'win' | 'push' | 'lose' | 'bust' | 'blackjack'): void {
        // result text
        this.tween.add({
            target: this._resultText,
            to: { scale: { x: 1, y: 1 }, alpha: 1 },
            duration: 1000,
            delay: 500,
            easing: TWEEN.Easing.Back.Out,
            onStart: () => {
                if (result === 'win' || result === 'blackjack' || result === 'push') {
                    this.game.sound.get('win').play();
                    if (result === 'blackjack') this.game.sound.get('blackjack').play();
                    const multiplier = (result === 'win' ? 2 : result === 'blackjack' ? 3 : 1);
                    const totalBet = this._betP.bet + this._betP.reserved;
                    this._wallet.deposit(totalBet * multiplier);
                } else {
                    this.game.sound.get('lose').play();
                }

                this._betP.isLocked = false;
                this._deck.isLocked = false;
                this._betP.reserved = 0;
                this._betP.clear(false, 'up');
                this._deck.relase();

                this._resultText.text = result.toUpperCase();
                this._resultText.visible = true;

                this._blackBack.visible = true;
                this._blackBack.alpha = 1;
            },
            onComplete: () => {
                this.tween.add({
                    target: this._resultText,
                    to: { scale: { x: 0, y: 0 }, alpha: 0 },
                    duration: 1000,
                    delay: 1500,
                    easing: TWEEN.Easing.Back.In,
                    onComplete: () => {
                        this._resultText.visible = false;
                        this._blackBack.visible = false;
                        this._blackBack.alpha = 0;
                        this.setState('deal');
                    }
                });
            }
        });
    }
    // on click deal button
    protected onDeal(): void {
        this.game.sound.get('button').play();
        if (this._wallet.total > 0 && this._wallet.total >= this._betP.bet) {
            if (this._betP.bet > 0 && this._wallet.withdraw(this._betP.bet)) {

                // clear inital bet
                this._betP.isLocked = false;
                this._betP.reserve();

                this._dealButton.disabled();

                if (this._deck.copies.length <= 26) {
                    this._deck.shuffle(true, this.playInitialCards, this);
                } else {
                    this.playInitialCards();
                }
            } else {
                this.setState('deal');
            }
        } else {
            this.setState('noMoney');
        }
    }
    // on click hit button
    protected onHit(): void {
        this.game.sound.get('button').play();
        this._deck.hit(1, 'player', true, this.checkCards, this);
    }
    // on click stand button
    protected onStand(): void {
        this.game.sound.get('button').play();
        const pScore = this._pScores.filter(p => p <= 21);
        this._pScores = [Math.max(...pScore)];
        this.checkAdditionBet();
    }
    // syn game states
    protected setState(state: 'deal' | 'hit' | 'stand' | 'finished' | 'noMoney'): void {
        this.game.data.set('state', state).save();
        switch (state) {
            case 'deal':
                if (this._wallet.total > 0) {
                    this._hitButton.disabled();
                    this._standButton.disabled();
                    this._dealButton.enabled();
                    this._betP.isLocked = false;
                    this._deck.isLocked = false;

                    // reset components
                    this._betP.clear();
                    this._deck.relase();

                    // reset texts
                    this._pScoreText.text = '0';
                    this._dScoreText.text = '0';

                    // reset scores
                    this._pScores = [0];
                    this._dScores = [0];

                    this.game.data.set('revealed', false);
                } else {
                    this.setState('noMoney');
                }
                break;
            case 'hit':
                this._hitButton.enabled();
                this._standButton.enabled();
                this._dealButton.disabled();
                //this._betP.isLocked = true;
                this._deck.isLocked = false;
                this.checkCards();
                break;
            case 'stand':
                this._hitButton.disabled();
                this._standButton.disabled();
                this._dealButton.disabled();
                this._betP.isLocked = true;

                this.playForDealer();
                break;
            case 'finished':
                this._hitButton.disabled();
                this._standButton.disabled();
                this._dealButton.disabled();
                this._betP.isLocked = true;
                this._deck.isLocked = true;

                // update texts
                this._pScoreText.text = this._pScores[0].toString();
                this._dScoreText.text = this._dScores[0].toString();

                this.decideNextMove();
                break;
            case 'noMoney':
                this._hitButton.disabled();
                this._standButton.disabled();
                this._dealButton.disabled();
                this._betP.isLocked = true;
                this._deck.isLocked = true;
                this.decideNextMove();
                break;
        }
    }
    // home button click
    protected onHomeClick(): void {
        this.game.sound.get('button').play();
        this.game.scene.sleep(this.key);
        this.game.scene.start('MenuScene');
    }
    // scene events
    protected onWokeUp(): void {
        const sessionID = this.game.data.get('sessionID', -1);
        const state = this.game.data.get('state', 'deal');
        if (this._sessionID !== sessionID) {
            this._sessionID = sessionID;

            this._pScoreText.text = '0';
            this._dScoreText.text = '0';

            this._wallet.reset();
            this._wallet.sync();

            this._betP.reset();
            this._betP.sync();

            this._deck.reset();
            this._deck.sync();
            this.setState(state);
        } else if (state === 'noMoney') {
            this.showPopup();
        }
    }
}