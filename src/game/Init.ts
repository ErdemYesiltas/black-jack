import * as PIXI from 'pixi.js';

export default function Init(options?: PIXI.IApplicationOptions): void {
    const game = new PIXI.Application(options);
    const parent = globalThis.document.getElementById('game') || globalThis.document.body;

    parent.appendChild(game.view as HTMLCanvasElement);
    (globalThis as any).__PIXI_APP__ = game;
    (globalThis as any).game = game;

    globalThis.document.body.addEventListener('click', () => {

        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.webkitRequestFullscreen) { /* Safari */
            document.body.webkitRequestFullscreen();
        } else if (document.body.msRequestFullscreen) { /* IE11 */
            document.body.msRequestFullscreen();
        }
    });
    globalThis.addEventListener('blur', () => {
        game.sound.mute(true);
    });

    globalThis.addEventListener('focus', () => {
        game.sound.mute(false);
    });
    if (PIXI.utils.isMobile.phone) {
        globalThis.screen.orientation.lock('portrait-primary');
    }
}