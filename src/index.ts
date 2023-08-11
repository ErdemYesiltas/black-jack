import * as PIXI from 'pixi.js';
import * as Engine from './engine';
import * as Game from './game';

export { Engine, Game };

window.onload = () => {
    PIXI.Assets.load({ src: 'misc/game.json', loadParser: 'loadJson' }).then((file: PIXI.IApplicationOptions) => {
        Game.Init(file);
    });
}