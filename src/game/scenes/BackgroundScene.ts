import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';
import { SpriteButton } from '../components';
import { Howl } from 'howler';
import screenfull from 'screenfull';

export class BackgroundScene extends Scene {
    protected _muteButton: SpriteButton;
    protected _music: Howl;
    init(): void {
        // full screen
        if (PIXI.utils.isMobile.phone && screenfull.isEnabled) {
            screenfull.request();
        }
    }
    create(): void {
        const music = this.game.data.get('music', false);

        this._music = this.game.sound.get('main-music');
        this._music.volume(0.5);
        this._music.loop(true);

        if (music === true) {
            this.game.sound.get('main-music').play();
        }
    }
    // settings click
    protected onMuteClick(): void {
        const music = this.game.data.get('music', false);
        if (music === true) {
            this._music.pause();
        } else {
            this._music.play();
        }
        this.game.data.set('music', !music).save();
    }
}