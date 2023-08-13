import { Scene } from '../../engine/scene';
import { SpriteButton } from '../components';
import { Howl } from 'howler';

export class BackgroundScene extends Scene {
    protected _muteButton: SpriteButton;
    protected _music: Howl;
    create(): void {
        const music = this.game.data.get('music', false);

        this._music = this.game.sound.get('main-music');
        this._music.volume(0.5);
        this._music.loop(true);

        if (music === true) {
            this.game.sound.get('main-music').play();
        }

        this._muteButton.onclick = this._muteButton.ontap = this.onMuteClick.bind(this);
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