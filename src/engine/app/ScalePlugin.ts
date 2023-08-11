import * as PIXI from 'pixi.js';
import { ALIGN, ORIENTATION } from '../const';

export class ScalePlugin {
    /** @ignore */
    static extension: PIXI.ExtensionMetadata = PIXI.ExtensionType.Application;

    static resize: () => void;
    static checkAlign: () => void;
    static checkOrientation: () => void;
    static safeWidth: number;
    static safeHeight: number;
    static align: ALIGN;
    static orientation: ORIENTATION;
    protected static _initialWidth: number;
    protected static _initialHeight: number;
    protected static _safeWidth: number;
    protected static _safeHeight: number;
    protected static _align: ALIGN;
    protected static _left: number;
    protected static _right: number;
    protected static _top: number;
    protected static _bottom: number;

    static init(options: PIXI.IApplicationOptions): void {
        Object.defineProperty(this, 'safeWidth',
            {
                set(safeWidth: number) {
                    this._safeWidth = safeWidth;
                    this.resize();
                },
                get() {
                    return this._safeWidth;
                }
            }
        );

        Object.defineProperty(this, 'safeHeight',
            {
                set(safeHeight: number) {
                    this._safeHeight = safeHeight;
                    this.resize();
                },
                get() {
                    return this._safeHeight;
                }
            }
        );

        Object.defineProperty(this, 'align',
            {
                set(align: ALIGN) {
                    this._align = align;
                    this.checkAlign();
                },
                get() {
                    return this._align;
                }
            }
        );

        Object.defineProperty(this, 'orientation',
            {
                get(): ORIENTATION {
                    return this.screen.width >= this.screen.height ? ORIENTATION.LANDSCAPE : ORIENTATION.PORTRAIT;
                }
            }
        );

        Object.defineProperty(this, 'left',
            {
                get() {
                    return this._left;
                }
            }
        );

        Object.defineProperty(this, 'right',
            {
                get() {
                    return this._right;
                }
            }
        );

        Object.defineProperty(this, 'top',
            {
                get() {
                    return this._top;
                }
            }
        );

        Object.defineProperty(this, 'bottom',
            {
                get() {
                    return this._bottom;
                }
            }
        );

        this.resize = (): void => {
            const app: any = this;

            if (!app.resizeTo) {
                app.resizeTo = globalThis.document.body;
            }

            // clear queue resize
            app.cancelResize();

            let width: number;
            let height: number;
            let parentWidth: number;
            let parentHeight: number;

            if (app.resizeTo === globalThis.window) {
                parentWidth = globalThis.innerWidth;
                parentHeight = globalThis.innerHeight;
            }
            else {
                const { clientWidth, clientHeight } = app.resizeTo as HTMLElement;

                parentWidth = clientWidth;
                parentHeight = clientHeight;
            }

            // Determine game size
            if (this._initialHeight / this._initialWidth > parentHeight / parentWidth) {
                if (this._safeHeight / this._initialWidth > parentHeight / parentWidth) {
                    // A
                    height = parentHeight * this._initialHeight / this._safeHeight;
                    width = height * this._initialWidth / this._initialHeight;
                }
                else {
                    // B
                    width = parentWidth;
                    height = width * this._initialHeight / this._initialWidth;
                }
            }
            else if (this._initialHeight / this._safeWidth > parentHeight / parentWidth) {
                // C
                height = parentHeight;
                width = height * this._initialWidth / this._initialHeight;
            }
            else {
                // D
                width = parentWidth * this._initialWidth / this._safeWidth;
                height = width * this._initialHeight / this._initialWidth;
            }

            width = Math.round(width);
            height = Math.round(height);
            app.renderer.resize(width, height);
            app.render();

            this.checkAlign();

            const scaleX = Math.round((width / this._initialWidth) * 1000) / 1000;
            const scaleY = Math.round((height / this._initialHeight) * 1000) / 1000;
            app.stage.scale.set(scaleX, scaleY);

        };

        this.checkAlign = (): void => {
            const app: any = this;

            let left = 0;
            let right = 0;
            let top = 0;
            let bottom = 0;
            const parent = app.view.parentElement ? app.view.parentElement : globalThis.document.body;
            const width = app.screen.width / app.renderer.resolution;
            const height = app.screen.height / app.renderer.resolution;
            const pWidth = parent.clientWidth;
            const pHeight = parent.clientHeight;

            switch (this._align) {
                case ALIGN.LEFT_TOP:
                    left = 0;
                    right = Math.round(pWidth - width);
                    top = 0;
                    bottom = Math.round(pHeight - height);
                    break;
                case ALIGN.LEFT_CENTER:
                    left = 0;
                    right = Math.round(pWidth - width);
                    top = Math.round((pHeight - height) / 2);
                    bottom = top;
                    break;
                case ALIGN.LEFT_BOTTOM:
                    left = 0;
                    right = Math.round(pWidth - width);
                    top = Math.round(pHeight - height);
                    bottom = 0;
                    break;
                case ALIGN.CENTER_TOP:
                    left = Math.round((pWidth - width) / 2);
                    right = left;
                    top = 0;
                    bottom = Math.round(pHeight - height);
                    break;
                case ALIGN.CENTER:
                    left = Math.round((pWidth - width) / 2);
                    right = left;
                    top = Math.round((pHeight - height) / 2);
                    bottom = top;
                    break;
                case ALIGN.CENTER_BOTTOM:
                    left = Math.round((pWidth - width) / 2);
                    right = left;
                    top = Math.round(pHeight - height);
                    bottom = 0;
                    break;
                case ALIGN.RIGHT_TOP:
                    left = Math.round(pWidth - width);
                    right = 0;
                    top = 0;
                    bottom = Math.round(pHeight - height);
                    break;
                case ALIGN.RIGHT_CENTER:
                    left = Math.round(pWidth - width);
                    right = 0;
                    top = Math.round((pHeight - height) / 2);
                    bottom = top;
                    break;
                case ALIGN.RIGHT_BOTTOM:
                    left = Math.round(pWidth - width);
                    right = 0;
                    top = Math.round(pHeight - height);
                    bottom = 0;
                    break;
            }

            parent.style.position = 'absolute';
            this._left = left;
            this._top = top;
            this._right = right;
            this._bottom = bottom;
            parent.style.left = `${left}px`;
            parent.style.top = `${top}px`;
        };

        this._initialWidth = options.width || 800;
        this._initialHeight = options.height || 600;
        this._safeWidth = options.safeWidth || this._initialWidth;
        this._safeHeight = options.safeHeight || this._initialHeight;
        this._align = options.align || ALIGN.LEFT_TOP;

        // delay first resize
        setTimeout(this.resize, 100);
        //this.resize();
    }
    static destroy(): void {
        this.resize = null;
    }
}

PIXI.extensions.add(ScalePlugin);
