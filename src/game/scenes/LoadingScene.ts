import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';

export class LoadingScene extends Scene {
    protected _loadingBar: PIXI.Graphics;

    create(): void {
        PIXI.Assets.addBundle('initial-assets', [
            {
                name: 'Bungee Regular',
                srcs: 'fonts/bungee-regular.ttf'
            },
            {
                name: 'spritesheet',
                srcs: 'sprites/sprites.json'
            }
        ]);

        PIXI.Assets.loadBundle('initial-assets', this.onProgress.bind(this)).then(this.onAssetLoadComplete.bind(this));
    }
    onProgress(progress: number): void {
        const config = (this._loadingBar as any).config;
        this._loadingBar
            .lineStyle(config.shape.lineStyle)
            .moveTo(0, 0)
            .lineTo(config.shape.width * progress, 0);
    }
    registerSounds(): void {
        this.game.sound.add('blackjack', { src: ['sounds/blackjack.ogg', 'sounds/blackjack.webm'] });
        this.game.sound.add('button', { src: ['sounds/button.ogg', 'sounds/button.webm'] });
        this.game.sound.add('card-pick', { src: ['sounds/card-pick.ogg', 'sounds/card-pick.webm'] });
        this.game.sound.add('chip', { src: ['sounds/chip.ogg', 'sounds/chip.webm'] });
        this.game.sound.add('coin', { src: ['sounds/coin.ogg', 'sounds/coin.webm'] });
        this.game.sound.add('main-music', { src: ['sounds/main-music.ogg', 'sounds/main-music.webm'] });
        this.game.sound.add('win', { src: ['sounds/win.ogg', 'sounds/win.webm'] });
        this.game.sound.add('lose', { src: ['sounds/lose.ogg', 'sounds/lose.webm'] });
    }
    onAssetLoadComplete(): void {

        this.registerSounds();
        // start inital scenes
        this.game.scene.start('BackgroundScene');
        this.game.scene.start('MenuScene');
        //this.game.scene.start('GameScene');
        // stop and remove this scene
        this.game.scene.stop('LoadingScene');
    }
}