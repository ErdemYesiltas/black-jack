import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';

export class LoadingScene extends Scene {
    protected _loadingBar: PIXI.Graphics;

    create(): void {
        const prefix = PIXI.isMobile.phone ? 'low' : 'high';
        PIXI.Assets.addBundle('initial-assets', [
            {
                name: 'Bungee Regular',
                srcs: 'fonts/bungee-regular.ttf'
            },
            {
                name: 'spritesheet',
                srcs: `sprites/${prefix}/sprites.json`
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
    onAssetLoadComplete(): void {
        // start inital scenes
        this.game.scene.start('BackgroundScene');
        //this.game.scene.start('MenuScene');
        this.game.scene.start('GameScene');
        // stop and remove this scene
        this.game.scene.stop('LoadingScene');
    }
}