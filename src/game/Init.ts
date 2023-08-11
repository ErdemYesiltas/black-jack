import * as PIXI from 'pixi.js';

export default function Init(options?: PIXI.IApplicationOptions): void {
    const game = new PIXI.Application(options);
    const parent = globalThis.document.getElementById('game') || globalThis.document.body;

    parent.appendChild(game.view as HTMLCanvasElement);

    if (options.debug === true) {
        (globalThis as any).__PIXI_APP__ = game;
        (globalThis as any).game = game;
    }
}