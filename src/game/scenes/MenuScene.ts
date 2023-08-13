import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';
import { SpriteButton } from '../components';

export class MenuScene extends Scene {
    protected _startButton: SpriteButton;
    protected _resetButton: SpriteButton;

    init(): void {
        if (!this.game.data.hasLocalRecord()) {
            this.resetSession();
        }

        this.game.data.load();
        this.on('wokeup', this.onWokeUp, this);
    }
    create(): void {
        this._startButton.onclick = this._startButton.ontap = this.onStartClick.bind(this);
        this._resetButton.onclick = this._resetButton.ontap = this.onResetClick.bind(this);
        this.checkButtons();
    }
    protected resetSession(): void {
        // initial values
        this.game.data.set('sessionID', PIXI.utils.uid());
        this.game.data.set('started', false);
        this.game.data.set('state', 'deal');
        this.game.data.set('balance', 10);
        this.game.data.set('reserved', 0);
        this.game.data.set('bet', 0);
        this.game.data.set('chips', []);
        this.game.data.set('deck', []);
        this.game.data.set('revealed', false);
        this.game.data.set('dealer', []);
        this.game.data.set('player', []);
        this.game.data.set('options.music', true);
        this.game.data.set('options.sound', true);
        this.game.data.set('statistic.win', 0);
        this.game.data.set('statistic.lost', 0);
        this.game.data.set('statistic.draw', 0);
        this.game.data.set('statistic.history', []);
        this.game.data.set('statistic.total.win', 0);
        this.game.data.set('statistic.total.lost', 0);
        this.game.data.save();
    }
    protected checkButtons(): void {
        const isStarted = this.game.data.get('started', false);
        ((this._startButton as any)['_label'] as PIXI.Text).text = isStarted ? 'RESUME' : 'START';
        this._resetButton.visible = isStarted;
    }
    // event listeners
    protected onSleep(): void {
        this._startButton.disabled();
    }
    protected onWokeUp(): void {
        if (!this.game.data.hasLocalRecord()) {
            this.resetSession();
        }
        this._startButton.enabled();
        this.checkButtons();
    }
    protected onStartClick(): void {
        this.game.data.set('started', true).save();
        this.game.scene.sleep(this.key);
        this.game.scene.start('GameScene');
    }
    protected onResetClick(): void {
        this.resetSession();
        this.checkButtons();
    }
}