import { Scene } from '../../engine/scene';
import { SpriteButton } from '../components';

export class MenuScene extends Scene {
    protected _startButton: SpriteButton;

    init(): void {
        if (!this.game.data.hasLocalRecord()) {
            // initial values
            this.game.data.set('balance', 1000);
            this.game.data.set('bet', 0);
            this.game.data.set('chips', []);
            this.game.data.set('dealer.cards', {});
            this.game.data.set('player.cards', {});
            this.game.data.set('options.music', true);
            this.game.data.set('options.sound', true);
            this.game.data.set('statistic.win', 0);
            this.game.data.set('statistic.lost', 0);
            this.game.data.set('statistic.draw', 0);
            this.game.data.set('statistic.history', []);
            this.game.data.set('statistic.total.win', 0);
            this.game.data.set('statistic.total.lost', 0);
            this.game.data.set('statistic.total.bet', 0);

            this.game.data.writeLocal();
        }

        this.game.data.readLocal();
    }
    create(): void {
        this._startButton.onclick = this.onStartClick.bind(this);
    }
    // event listeners
    protected onSleep(): void {
        this._startButton.disabled();
    }
    protected onWokeUp(): void {
        this._startButton.enabled();
    }
    protected onStartClick(): void {
        this.game.scene.sleep(this.key);
        this.game.scene.start('GameScene');
    }
}