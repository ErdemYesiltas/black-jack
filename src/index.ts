import * as PIXI from 'pixi.js';
import * as Engine from './engine';
import * as Game from './game';

export { Engine, Game };

window.onload = () => {
    window.screen.orientation.lock('portrait-primary');
    PIXI.Assets.load({ src: 'misc/game.json', loadParser: 'loadJson' }).then((file: PIXI.IApplicationOptions) => {
        Game.Init(file);
    });
}