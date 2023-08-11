/* eslint-disable @typescript-eslint/no-use-before-define */
import * as PIXI from 'pixi.js';
import { BuildConfig } from './BuildConfig';
import { GameObjectConfig } from './GameObjectConfig';
import { ISkeletonData, Spine } from 'pixi-spine';
import { Clone, GetValue, Pad } from '../utils';

function AddTo<T extends PIXI.Container = PIXI.Container>(
    gObject: T,
    parent?: PIXI.Container,
    index?: number
): void {
    // add this to parent if exist
    if (typeof parent !== 'undefined' && typeof parent.addChild === 'function') {
        if (typeof index === 'number') {
            parent.addChildAt(gObject, index);
        }
        else {
            parent.addChild(gObject);
        }
    }
}
function Build<T extends PIXI.Container = PIXI.Container>(
    gObject: T,
    config?: GameObjectConfig,
    parent?: PIXI.Container,
    index?: number
): T {
    config = BuildConfig(config);

    gObject.accessible = config.accessible;
    gObject.accessibleChildren = config.accessibleChildren;
    gObject.accessibleHint = config.accessibleHint;
    gObject.accessiblePointerEvents = config.accessiblePointerEvents;
    gObject.accessibleTitle = config.accessibleTitle;
    gObject.accessibleType = config.accessibleType;
    gObject.alpha = config.alpha;
    gObject.eventMode = config.eventMode;

    if (typeof config.angle === 'number') {
        gObject.angle = config.angle;
    }
    gObject.cursor = config.cursor;

    if (config.filterArea !== undefined) {
        const fx = GetValue(config.filterArea, 'x', 0);
        const fy = GetValue(config.filterArea, 'y', 0);
        const fw = GetValue(config.filterArea, 'width', 0);
        const fh = GetValue(config.filterArea, 'height', 0);

        gObject.filterArea = new PIXI.Rectangle(fx, fy, fw, fh);
    }

    if (config.hitArea !== undefined) {
        config.hitArea.type = GetValue(config.hitArea, 'type', 'rectangle');
        config.hitArea.x = GetValue(config.hitArea, 'x', 0);
        config.hitArea.y = GetValue(config.hitArea, 'y', 0);

        switch (config.hitArea.type) {
            case 'circle':
                config.hitArea.radius = GetValue(config.hitArea, 'radius', 0);
                gObject.hitArea = new PIXI.Circle(config.hitArea.x, config.hitArea.y, config.hitArea.radius);
                break;

            case 'ellipse':
                config.hitArea.halfWidth = GetValue(config.hitArea, 'halfWidth', 0);
                config.hitArea.halfHeight = GetValue(config.hitArea, 'halfHeight', 0);
                gObject.hitArea = new PIXI.Ellipse(
                    config.hitArea.x, config.hitArea.y,
                    config.hitArea.halfWidth,
                    config.hitArea.halfHeight
                );
                break;

            case 'polygon':
                config.hitArea.points = GetValue(config.hitArea, 'points', []);
                gObject.hitArea = new PIXI.Polygon(...config.hitArea.points);
                break;

            case 'rectangle':
                config.hitArea.width = GetValue(config.hitArea, 'width', 0);
                config.hitArea.height = GetValue(config.hitArea, 'height', 0);
                gObject.hitArea = new PIXI.Rectangle(
                    config.hitArea.x,
                    config.hitArea.y,
                    config.hitArea.width,
                    config.hitArea.height
                );
                break;

            case 'roundedrectangle':
                config.hitArea.width = GetValue(config.hitArea, 'width', 0);
                config.hitArea.height = GetValue(config.hitArea, 'height', 0);
                config.hitArea.radius = GetValue(config.hitArea, 'radius', 0);
                gObject.hitArea = new PIXI.RoundedRectangle(
                    config.hitArea.x,
                    config.hitArea.y,
                    config.hitArea.width,
                    config.hitArea.height,
                    config.hitArea.radius
                );
                break;
        }
    }

    if (typeof config.height === 'number') {
        gObject.height = config.height;
    }

    gObject.interactiveChildren = config.interactiveChildren;
    (gObject as any).identity = config.identity;
    //config.localName = config.localName.toString().replace('/^[^a-zA-Z_$]|[^\\w$]/', '_')
    if (config.localName !== '' && typeof parent !== 'undefined') {
        (parent as any)[config.localName] = gObject;
    }
    gObject.name = config.name;
    gObject.pivot.set(config.pivotX, config.pivotY);
    gObject.renderable = config.renderable;

    if (typeof config.rotation === 'number') {
        gObject.rotation = config.rotation;
    }
    gObject.scale.set(config.scaleX, config.scaleY);
    gObject.skew.set(config.skewX, config.skewY);
    gObject.visible = config.visible;
    if (typeof config.width === 'number') {
        gObject.width = config.width;
    }
    gObject.x = config.x;
    gObject.y = config.y;

    // add sub children
    if (config.children.length > 0) {
        for (let c = 0; c < config.children.length; c++) {
            const child = config.children[c];

            if ((GameObjects as any)[child.identity]) {
                try {
                    (GameObjects as any)[child.identity](child, child.addToParent ? gObject : null);
                }
                catch (e) {
                    console.error('Cannot create game object', e);
                }
            }
            else {
                console.error('Object type not registered to display object map');
            }
        }
    }

    // other things
    if (typeof (gObject as any).anchor !== 'undefined' && (gObject as any).anchor instanceof PIXI.ObservablePoint) {
        ((gObject as any).anchor as PIXI.ObservablePoint).set(config.anchorX, config.anchorY);
    }

    if (typeof (gObject as any).blendMode !== 'undefined' && typeof config.blendMode === 'number') {
        (gObject as any).blendMode = config.blendMode;
    }
    if (typeof (gObject as any).roundPixels !== 'undefined' && typeof config.roundPixels === 'boolean') {
        (gObject as any).roundPixels = config.roundPixels;
    }
    if (typeof (gObject as any).tint !== 'undefined' && (typeof config.tint === 'string' || typeof config.tint === 'number')) {
        if (typeof config.tint === 'string') {
            (gObject as any).tint = new PIXI.Color(String(config.tint)).toNumber();
        }

        (gObject as any).tint = Number(config.tint);
    }

    (gObject as any).config = Clone(config);

    AddTo(gObject, parent, index);

    return gObject;
}
function Create(
    config?: GameObjectConfig,
    parent?: PIXI.Container,
    index?: number
): PIXI.Container {
    config = BuildConfig(config);
    let displayObject = null;

    switch (config.identity) {
        case 'animatedsprite':
            displayObject = CreateAnimatedSprite(config, parent, index);
            break;
        case 'bitmaptext':
            displayObject = CreateBitmapText(config, parent, index);
            break;
        case 'container':
            displayObject = CreateContainer(config, parent, index);
            break;
        case 'graphics':
            displayObject = CreateGraphics(config, parent, index);
            break;
        case 'particlecontainer':
            displayObject = CreateParticleContainer(config, parent, index);
            break;
        case 'spine':
            displayObject = CreateSpine(config, parent, index);
            break;
        case 'sprite':
            displayObject = CreateSprite(config, parent, index);
            break;
        case 'mesh':
            displayObject = CreateMesh(config, parent, index);
            break;
        case 'ninesliceplane':
            displayObject = CreateNineSlicePlane(config, parent, index);
            break;
        case 'text':
            displayObject = CreateText(config, parent, index);
            break;
        case 'tilingsprite':
            displayObject = CreateTilingSprite(config, parent, index);
            break;
        default:
            if (typeof (GameObjects as any)[config.identity] === 'function') {

                displayObject = (GameObjects as any)[config.identity](config, parent, index);
            }
            break;
    }

    return displayObject;
}
function CreateAnimatedSprite(
    config?: GameObjectConfig & {
        textures?: PIXI.Texture[] | string[] | PIXI.FrameObject[] | (PIXI.Texture | string)[] | {
            start?: number;
            stop?: number;
            prefix?: string;
            suffix?: string;
            pad?: number;
        };
        autoUpdate?: boolean;
        speed?: number;
        loop?: boolean;
        autoPlay?: boolean;
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.AnimatedSprite {
    config = BuildConfig(config);
    config.identity = 'animatedsprite';
    config.speed = config.speed ?? 1;
    config.loop = config.loop ?? false;
    config.autoPlay = config.autoPlay ?? false;

    const textures: PIXI.Texture[] | PIXI.FrameObject[] = [];

    if (typeof config.textures !== 'undefined') {
        if (typeof config.textures === 'object' && !Array.isArray(config.textures)) {
            config.textures = Pad(config.textures);
        }

        if (Array.isArray(config.textures)) {
            config.textures.forEach((t) => {
                if (typeof t === 'string') {
                    t = PIXI.Texture.from(t);
                }

                textures.push(t as any);
            });
        }
    }

    const animatedSprite = new PIXI.AnimatedSprite(textures, config.autoUpdate);

    animatedSprite.animationSpeed = config.speed;
    animatedSprite.loop = config.loop;
    if (config.autoPlay === true) {
        animatedSprite.play();
    }

    return Build(animatedSprite, config, parent, index);
}
function CreateBitmapText(
    config?: GameObjectConfig & { text?: string; style?: Partial<PIXI.IBitmapTextStyle>; resolution?: number; },
    parent?: PIXI.Container,
    index?: number
): PIXI.BitmapText {
    config = BuildConfig(config);
    config.identity = 'bitmaptext';
    config.text = config.text ?? '';

    const bitmapText = new PIXI.BitmapText(config.text, config.style);

    bitmapText.resolution = config.resolution ?? PIXI.settings.RESOLUTION;

    return Build(bitmapText, config, parent, index);
}
function CreateContainer(
    config?: GameObjectConfig,
    parent?: PIXI.Container,
    index?: number
): PIXI.Container {
    return Build(new PIXI.Container(), config, parent, index);
}
function CreateGraphics(
    config?: GameObjectConfig & {
        geometry?: PIXI.GraphicsGeometry;
        shape?: {
            type?: 'line' | 'linetexture' | 'circle' | 'ellipse' | 'polygon' | 'rectangle' | 'roundedrectangle';
            lineStyle?: PIXI.ILineStyleOptions;
            fillStyle?: PIXI.IFillStyleOptions;
            lineTextureStyle?: PIXI.ILineStyleOptions;
            // common properties
            x?: number;
            y?: number;
            // line properties
            x2?: number;
            y2?: number;
            // circle or rounded rectangle
            radius?: number;
            // rectangle
            width?: number;
            height?: number;
            // polygon
            points?: PIXI.IPointData[] | number[];
        };
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.Graphics {
    config = BuildConfig(config);
    config.identity = 'graphics';

    const graphics = new PIXI.Graphics(config.geometry);

    if (config.shape !== undefined) {
        config.shape.type = GetValue(config.shape, 'type', 'rectangle');
        config.shape.x = GetValue(config.shape, 'x', 0);
        config.shape.y = GetValue(config.shape, 'y', 0);
        config.shape.fillStyle = GetValue(config.shape, 'fillStyle', {});
        if (typeof config.shape.fillStyle.texture === 'string') {
            config.shape.fillStyle.texture = PIXI.Texture.from(config.shape.fillStyle.texture);
        }
        graphics.clear();
        switch (config.shape.type) {
            case 'line':
                config.shape.x2 = GetValue(config.shape, 'x2', 1);
                config.shape.y2 = GetValue(config.shape, 'y2', 0);
                config.shape.lineStyle = GetValue(config.shape, 'lineStyle', {});
                graphics
                    .lineStyle(config.shape.lineStyle)
                    .moveTo(config.shape.x, config.shape.y)
                    .lineTo(config.shape.x2, config.shape.y2);
                break;

            case 'linetexture':
                config.shape.x2 = GetValue(config.shape, 'x2', 1);
                config.shape.y2 = GetValue(config.shape, 'y2', 0);
                config.shape.lineTextureStyle = GetValue(config.shape, 'lineTextureStyle', {});
                if (typeof config.shape.lineTextureStyle.texture === 'string') {
                    config.shape.lineTextureStyle.texture = PIXI.Texture.from(config.shape.lineTextureStyle.texture);
                }
                graphics
                    .lineTextureStyle(config.shape.lineTextureStyle)
                    .moveTo(config.shape.x, config.shape.y)
                    .lineTo(config.shape.x2, config.shape.y2);
                break;

            case 'circle':
                config.shape.radius = GetValue(config.shape, 'radius', 0);
                graphics
                    .beginTextureFill(config.shape.fillStyle)
                    .beginFill(config.shape.fillStyle.color, config.shape.fillStyle.alpha)
                    .drawCircle(config.shape.x, config.shape.y, config.shape.radius)
                    .endFill();
                break;

            case 'ellipse':
                config.shape.width = GetValue(config.shape, 'width', 1);
                config.shape.height = GetValue(config.shape, 'height', 1);
                graphics
                    .beginTextureFill(config.shape.fillStyle)
                    .beginFill(config.shape.fillStyle.color, config.shape.fillStyle.alpha)
                    .drawEllipse(config.shape.x, config.shape.y, config.shape.width, config.shape.height)
                    .endFill();
                break;

            case 'polygon':
                config.shape.points = GetValue(config.shape, 'points', []);
                graphics
                    .beginTextureFill(config.shape.fillStyle)
                    .beginFill(config.shape.fillStyle.color, config.shape.fillStyle.alpha)
                    .drawPolygon(...config.shape.points)
                    .endFill();
                break;

            case 'rectangle':
                config.shape.width = GetValue(config.shape, 'width', 1);
                config.shape.height = GetValue(config.shape, 'height', 1);
                graphics
                    .beginTextureFill(config.shape.fillStyle)
                    .beginFill(config.shape.fillStyle.color, config.shape.fillStyle.alpha)
                    .drawRect(config.shape.x, config.shape.y, config.shape.width, config.shape.height)
                    .endFill();
                break;

            case 'roundedrectangle':
                config.shape.width = GetValue(config.shape, 'width', 0);
                config.shape.height = GetValue(config.shape, 'height', 0);
                config.shape.radius = GetValue(config.shape, 'radius', 0);
                graphics
                    .beginTextureFill(config.shape.fillStyle)
                    .beginFill(config.shape.fillStyle.color, config.shape.fillStyle.alpha)
                    .drawRoundedRect(
                        config.shape.x,
                        config.shape.y,
                        config.shape.width,
                        config.shape.height,
                        config.shape.radius
                    )
                    .endFill();
                break;
        }
    }

    return Build(graphics, config, parent, index);
}
function CreateParticleContainer(
    config?: GameObjectConfig & {
        maxSize?: number;
        properties?: PIXI.IParticleProperties;
        batchSize?: number;
        autoResize?: boolean;
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.ParticleContainer {
    config = BuildConfig(config);
    config.identity = 'particlecontainer';

    const particleContainer = new PIXI.ParticleContainer(
        config.maxSize,
        config.properties,
        config.batchSize,
        config.autoResize
    );

    return Build(particleContainer, config, parent, index);
}
function CreateSpine(
    config?: GameObjectConfig & { spineData?: ISkeletonData; },
    parent?: PIXI.Container,
    index?: number
): Spine {
    config = BuildConfig(config);
    config.identity = 'spine';

    if (typeof config.spineData === 'undefined') {
        console.error('spineData needed for spine creation');

        return null;
    }

    if (typeof config.spineData === 'string') {
        const spine = PIXI.Cache.get(config.spineData);
        if (spine) {
            config.spineData = spine.spineData;
        }
    }

    const spine = new Spine(config.spineData);

    return Build(spine, config, parent, index);
}
function CreateSprite(
    config?: GameObjectConfig & {
        texture?: PIXI.Texture | string; options?: PIXI.IBaseTextureOptions;
    } | PIXI.Texture | string,
    parent?: PIXI.Container,
    index?: number
): PIXI.Sprite {
    if (config === undefined || config === null) { config = {}; }

    if (typeof config === 'string' || config instanceof PIXI.Texture) {
        config = { texture: config };
    }

    config = BuildConfig(config);
    config.identity = 'sprite';
    let texture: PIXI.Texture;

    if (typeof config.texture === 'string') {
        texture = PIXI.Texture.from(config.texture, config.options);
    }
    else if (texture instanceof PIXI.Texture) {
        texture = config.texture;
    }
    else {
        texture = PIXI.Texture.EMPTY;
    }

    const sprite = new PIXI.Sprite(texture);

    return Build(sprite, config, parent, index);
}
function CreateMesh<T extends PIXI.Shader = PIXI.MeshMaterial>(
    config: GameObjectConfig & { geometry?: PIXI.Geometry; shader?: T; state?: PIXI.State; drawMode?: PIXI.DRAW_MODES; },
    parent?: PIXI.Container,
    index?: number
): PIXI.Mesh<T> {
    config = BuildConfig(config);
    config.identity = 'mesh';

    if (typeof config.geometry === 'undefined') {
        console.error('geometry needed for mesh creation');

        return null;
    }

    if (typeof config.shader === 'undefined') {
        console.error('shader needed for mesh creation');

        return null;
    }

    const mesh = new PIXI.Mesh<T>(config.geometry, config.shader, config.state, config.drawMode);

    return Build(mesh, config, parent, index);
}
function CreateNineSlicePlane(
    config?: GameObjectConfig & {
        texture?: PIXI.Texture | string;
        options?: PIXI.IBaseTextureOptions;
        leftWidth?: number;
        topHeight?: number;
        rightWidth?: number;
        bottomHeight?: number;
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.NineSlicePlane {
    config = BuildConfig(config);
    config.identity = 'ninesliceplane';
    config.leftWidth = config.leftWidth ?? 10;
    config.topHeight = config.topHeight ?? 10;
    config.rightWidth = config.rightWidth ?? 10;
    config.bottomHeight = config.bottomHeight ?? 10;

    let texture: PIXI.Texture;

    if (typeof config.texture === 'string') {
        texture = PIXI.Texture.from(config.texture, config.options);
    }
    else if (texture instanceof PIXI.Texture) {
        texture = config.texture;
    }
    else {
        texture = PIXI.Texture.EMPTY;
    }

    // eslint-disable-next-line max-len
    const sprite = new PIXI.NineSlicePlane(texture, config.leftWidth, config.topHeight, config.rightWidth, config.bottomHeight);

    return Build(sprite, config, parent, index);
}
function CreateText(
    config?: GameObjectConfig & {
        text?: string;
        style?: (Partial<PIXI.ITextStyle> | PIXI.TextStyle) & { fixedWidth?: number; };
        canvas?: HTMLCanvasElement;
        resolution?: number;
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.Text {
    config = BuildConfig(config);
    config.identity = 'text';
    config.text = config.text ?? '';

    const text = new PIXI.Text(config.text, config.style, config.canvas);

    text.resolution = config.resolution ?? PIXI.settings.RESOLUTION;

    return Build(text, config, parent, index);
}
function CreateTilingSprite(
    config?: GameObjectConfig & {
        texture?: PIXI.Texture | string;
        options?: PIXI.IBaseTextureOptions;
        tilingwidth?: number;
        tilingheight?: number;
    },
    parent?: PIXI.Container,
    index?: number
): PIXI.TilingSprite {
    config = BuildConfig(config);
    config.identity = 'tilingsprite';
    config.tilingwidth = config.tilingwidth ?? 100;
    config.tilingheight = config.tilingheight ?? 100;

    let texture: PIXI.Texture;

    if (typeof config.texture === 'string') {
        texture = PIXI.Texture.from(config.texture, config.options);
    }
    else if (texture instanceof PIXI.Texture) {
        texture = config.texture;
    }
    else {
        texture = PIXI.Texture.EMPTY;
    }

    const tilingSprite = new PIXI.TilingSprite(texture, config.tilingwidth, config.tilingheight);

    return Build(tilingSprite, config, parent, index);
}
export const GameObjects = {
    // common methods
    AddTo,
    Build,
    BuildConfig,
    Create,

    AnimatedSprite: CreateAnimatedSprite,
    animatedsprite: CreateAnimatedSprite,

    BitmapText: CreateBitmapText,
    bitmaptext: CreateBitmapText,

    Container: CreateContainer,
    container: CreateContainer,

    Graphics: CreateGraphics,
    graphics: CreateGraphics,

    Mesh: CreateMesh,
    mesh: CreateMesh,

    NineSlicePlane: CreateNineSlicePlane,
    ninesliceplane: CreateNineSlicePlane,

    ParticleContainer: CreateParticleContainer,
    particlecontainer: CreateParticleContainer,

    Spine: CreateSpine,
    spine: CreateSpine,

    Sprite: CreateSprite,
    sprite: CreateSprite,

    Text: CreateText,
    text: CreateText,

    TilingSprite: CreateTilingSprite,
    tilingsprite: CreateTilingSprite,

    GameObjectConfig
};
