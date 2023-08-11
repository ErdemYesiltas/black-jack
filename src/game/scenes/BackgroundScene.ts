import * as PIXI from 'pixi.js';
import { Scene } from '../../engine/scene';

export class BackgroundScene extends Scene {
    create(): void {
        this.game.scene.sendToBack(this.key);
        // safe area
        const safeArea = new PIXI.Graphics();
        safeArea.name = 'SAFE AREA';
        safeArea.position.set(240, 60);

        safeArea.beginFill('#000000', .3).lineStyle({ width: 5 }).drawRect(0, 0, 800, 600).endFill();

        this.addChild(safeArea);
    }
}