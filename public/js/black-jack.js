var App = (function (exports, PIXI, TWEEN, pixiSpine) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var PIXI__namespace = /*#__PURE__*/_interopNamespaceDefault(PIXI);
    var TWEEN__namespace = /*#__PURE__*/_interopNamespaceDefault(TWEEN);

    function Clone(obj) {
        const clone = {};
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                clone[key] = obj[key].slice(0);
            }
            else {
                clone[key] = obj[key];
            }
        }
        return clone;
    }

    function GetValue(source, key, defaultValue) {
        if (!source || typeof source === 'number') {
            return defaultValue;
        }
        else if (Object.prototype.hasOwnProperty.call(source, key)) {
            return source[key.toString()];
        }
        else if (key.toString().indexOf('.') !== -1) {
            const keys = key.toString().split('.');
            let parent = source;
            let value = defaultValue;
            for (let i = 0; i < keys.length; i++) {
                if (Object.prototype.hasOwnProperty.call(parent, keys[i])) {
                    value = parent[keys[i]];
                    parent = parent[keys[i]];
                }
                else {
                    value = defaultValue;
                    break;
                }
            }
            return value;
        }
        return defaultValue;
    }

    function Merge(obj1, obj2) {
        const clone = Clone(obj1);
        for (const key in obj2) {
            if (!Object.prototype.hasOwnProperty.call(clone, key)) {
                clone[key] = obj2[key];
            }
        }
        return clone;
    }

    function Pad(config) {
        const inLineStrings = [];
        if (config === undefined || config === null) {
            config = {};
        }
        config.prefix = GetValue(config, 'prefix', '');
        config.suffix = GetValue(config, 'suffix', '');
        config.pad = GetValue(config, 'pad', 5);
        config.start = GetValue(config, 'start', 0);
        config.stop = GetValue(config, 'stop', 0);
        if (config.start <= config.stop) {
            for (let i = config.start; i <= config.stop; i++) {
                let inLine = config.prefix;
                const padDiff = (config.pad - String(i).length);
                if (padDiff > 0) {
                    for (let dIndex = 0; dIndex < padDiff; dIndex++) {
                        inLine = inLine.concat('0');
                    }
                }
                inLine += String(i);
                inLine += config.suffix;
                inLineStrings.push(inLine);
            }
        }
        else {
            for (let i = config.start; i >= config.stop; i--) {
                let inLine = config.prefix;
                const padDiff = (config.pad - String(i).length);
                if (padDiff > 0) {
                    for (let dIndex = 0; dIndex < padDiff; dIndex++) {
                        inLine = inLine.concat('0');
                    }
                }
                inLine += String(i);
                inLine += config.suffix;
                inLineStrings.push(inLine);
            }
        }
        return inLineStrings;
    }

    function RandomNumber(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function StringToClass(c) {
        let path = c.split(".");
        let cl = null;
        if (path.length > 0) {
            cl = globalThis[path[0]];
            for (var i = 1; i < path.length; i++) {
                cl = cl[path[i]];
            }
        }
        return cl;
    }

    var index$8 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Clone: Clone,
        GetValue: GetValue,
        Merge: Merge,
        Pad: Pad,
        RandomNumber: RandomNumber,
        StringToClass: StringToClass
    });

    class DataManager extends PIXI__namespace.utils.EventEmitter {
        constructor(entriesOrStorage, key) {
            super();
            this._key = '';
            this.data = {};
            this._size = 0;
            this._key = key ?? `Storage-${DataManager.count}`;
            DataManager.count++;
            if (entriesOrStorage === undefined) {
                entriesOrStorage = this._key;
            }
            if (typeof entriesOrStorage === 'string') {
                this.readLocal(entriesOrStorage);
            }
            if (typeof entriesOrStorage === 'object' && !Array.isArray(entriesOrStorage)) {
                for (const key in entriesOrStorage) {
                    this.set(key, entriesOrStorage[key]);
                }
            }
        }
        query(search) {
            const results = {};
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key) && key.match(search)) {
                    results[key] = this.data[key];
                }
            }
            return results;
        }
        set(key, value) {
            if (typeof key === 'object') {
                const keys = Object.keys(key);
                keys.forEach((k) => {
                    this.set(k, key[k]);
                }, this);
            }
            else if (key.indexOf('.') !== -1) {
                const keys = key.split('.');
                let parent = this.data;
                let prev = this.data;
                let fetchSource = this.data;
                for (let j = 0; j < keys.length; j++) {
                    if (fetchSource[keys[j]] === undefined) {
                        if (j === 0) {
                            this._size++;
                        }
                        fetchSource[keys[j]] = {};
                    }
                    fetchSource = fetchSource[keys[j]];
                }
                for (let i = 0; i < keys.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(parent, keys[i])) {
                        prev = parent;
                        parent = parent[keys[i]];
                    }
                    else {
                        break;
                    }
                }
                if (typeof prev[keys[keys.length - 1]] === 'undefined') {
                    prev[keys[keys.length - 1]] = value;
                    this.emit('setdata', keys[keys.length - 1], Clone(prev[keys[keys.length - 1]]));
                }
                else {
                    const oldValue = prev[keys[keys.length - 1]];
                    prev[keys[keys.length - 1]] = value;
                    this.emit('changedata', keys[keys.length - 1], Clone(prev[keys[keys.length - 1]]), oldValue);
                }
            }
            else {
                const hasEntry = this.has(key);
                if (!hasEntry) {
                    this._size++;
                }
                const oldValue = this.data[key];
                this.data[key] = value;
                if (!hasEntry) {
                    this.emit('setdata', key, Clone(this.data[key]));
                }
                else {
                    this.emit('changedata', key, Clone(this.data[key]), oldValue);
                }
            }
            return this;
        }
        get(key, defaultVal = null) {
            if (key.indexOf('.') !== -1) {
                const keys = key.split('.');
                let parent = this.data;
                let value = defaultVal;
                for (let i = 0; i < keys.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(parent, keys[i])) {
                        value = parent[keys[i]];
                        parent = parent[keys[i]];
                    }
                    else {
                        value = defaultVal;
                        break;
                    }
                }
                return typeof value === 'object' && !Array.isArray(value) ? Clone(value) : value;
            }
            else if (this.has(key)) {
                return typeof this.data[key] === 'object'
                    && !Array.isArray(this.data[key]) ? Clone(this.data[key]) : this.data[key];
            }
            return defaultVal;
        }
        getAll() {
            const results = {};
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                    results[key] = this.data[key];
                }
            }
            return results;
        }
        has(key) {
            return (Object.prototype.hasOwnProperty.call(this.data, key));
        }
        delete(key, localStorage = false) {
            if (this.has(key)) {
                const data = this.data[key];
                delete this.data[key];
                this._size--;
                this.emit('removedata', key, data);
                if (localStorage) {
                    this.writeLocal();
                }
            }
            return this;
        }
        clear(localStorage = false) {
            Object.keys(this.data).forEach((prop) => { delete this.data[prop]; }, this);
            if (localStorage) {
                this.clearLocal();
            }
            this._size = 0;
            return this;
        }
        keys() {
            return Object.keys(this.data);
        }
        values() {
            const results = [];
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                    results.push(this.data[key]);
                }
            }
            return results;
        }
        dump() {
            console.group(`${this._key} Size: ${this._size}`);
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                    console.log(key, this.data[key]);
                }
            }
            console.groupEnd();
        }
        each(callback) {
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                    if (callback(key, this.data[key]) === false) {
                        break;
                    }
                }
            }
            return this;
        }
        contains(value) {
            for (const key in this.data) {
                if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                    if (this.data[key] === value) {
                        return true;
                    }
                }
            }
            return false;
        }
        merge(map, override = false) {
            if (override === undefined) {
                override = false;
            }
            const local = this.data;
            const source = map.data;
            for (const key in source) {
                if (Object.prototype.hasOwnProperty.call(local, key) && override) {
                    local[key] = source[key];
                }
                else {
                    this.set(key, source[key]);
                }
            }
            return this;
        }
        hasLocalRecord(key) {
            if (window.localStorage !== null) {
                key = key !== undefined ? key : this._key;
                return window.localStorage.getItem(key) !== null;
            }
            return false;
        }
        readLocal(key) {
            if (window.localStorage !== null) {
                key = key !== undefined ? key : this._key;
                let localEntries = window.localStorage.getItem(key);
                if (localEntries === undefined || localEntries === null) {
                    localEntries = '{}';
                }
                const entries = JSON.parse(localEntries);
                if (typeof entries === 'object') {
                    if (Array.isArray(entries)) {
                        const len = entries.length;
                        for (let i = 0; i < len; i++) {
                            const entry = entries[i];
                            if (entry) {
                                this.set(entry[0], entry[1]);
                            }
                        }
                    }
                    else {
                        Object.keys(entries).forEach((k) => { this.set(k, entries[k]); }, this);
                    }
                }
            }
            else {
                console.warn('Local storage not supported');
            }
            return this;
        }
        writeLocal() {
            if (window.localStorage !== null) {
                window.localStorage.setItem(this._key, JSON.stringify(this.data));
            }
            else {
                console.warn('Local storage not supported');
            }
            return this;
        }
        clearLocal() {
            if (window.localStorage !== null) {
                window.localStorage.removeItem(this._key);
            }
            else {
                console.warn('Local storage not supported');
            }
            return this;
        }
        destroy() {
            this.clear();
            this.removeAllListeners();
        }
        get size() {
            return this._size;
        }
        get key() {
            return this._key;
        }
    }
    DataManager.count = 0;

    class ObjectPoolMember {
        constructor(data) {
            this.data = null;
            this.free = false;
            this.data = data;
        }
    }

    class ObjectPool {
        constructor(constructorFunction, resetFunction = (obj) => obj, initialSize = 100) {
            this.poolArray = [];
            this.constructorFunction = null;
            this.resetFunction = null;
            this.constructorFunction = constructorFunction;
            this.resetFunction = resetFunction;
            this.increase(initialSize);
        }
        increase(size = 1) {
            if (size <= 0) {
                size = 1;
            }
            for (let i = 0; i < size; i++)
                this.create();
        }
        decrease(size = 1) {
            if (size <= 0) {
                size = 1;
            }
            for (let i = 0; i < this.poolArray.length; i++) {
                if (this.poolArray[i] && this.poolArray[i].free) {
                    this.poolArray.splice(i, 1);
                    i--;
                    size--;
                    if (size === 0) {
                        break;
                    }
                }
            }
        }
        create() {
            const data = this.resetFunction(this.constructorFunction());
            const newObjectPoolMember = new ObjectPoolMember(data);
            this.poolArray.push(newObjectPoolMember);
            return newObjectPoolMember;
        }
        get() {
            for (let i = 0; i < this.poolArray.length; i++) {
                if (this.poolArray[i].free) {
                    this.poolArray[i].free = false;
                    return this.poolArray[i];
                }
            }
            const newOne = this.create();
            newOne.free = false;
            return newOne;
        }
        release(element) {
            element.free = true;
            this.resetFunction(element.data);
        }
        get size() {
            return this.poolArray.length;
        }
        get inUseSize() {
            return this.size - this.freeSize;
        }
        get freeSize() {
            let count = 0;
            for (let i = 0; i < this.poolArray.length; i++) {
                if (this.poolArray[i].free) {
                    count++;
                }
            }
            return count;
        }
    }

    var index$7 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        DataManager: DataManager,
        ObjectPool: ObjectPool,
        ObjectPoolMember: ObjectPoolMember
    });

    let SceneDataPlugin$1 = class SceneDataPlugin {
        static init(options) {
            // Set default
            options = Object.assign({
                data: {}
            }, options);
            Object.defineProperty(this, 'data', {
                set(data) {
                    this._data = data;
                },
                get() {
                    return this._data;
                },
            });
            this._data = null;
            this.data = new DataManager(options.data, 'Game-Storage');
        }
        static destroy() {
            if (this._data) {
                this._data.destroy();
            }
        }
    };
    /** @ignore */
    SceneDataPlugin$1.extension = PIXI__namespace.ExtensionType.Application;
    PIXI__namespace.extensions.add(SceneDataPlugin$1);

    var ALIGN;
    (function (ALIGN) {
        ALIGN[ALIGN["LEFT_TOP"] = 0] = "LEFT_TOP";
        ALIGN[ALIGN["LEFT_CENTER"] = 1] = "LEFT_CENTER";
        ALIGN[ALIGN["LEFT_BOTTOM"] = 2] = "LEFT_BOTTOM";
        ALIGN[ALIGN["CENTER_TOP"] = 3] = "CENTER_TOP";
        ALIGN[ALIGN["CENTER"] = 4] = "CENTER";
        ALIGN[ALIGN["CENTER_BOTTOM"] = 5] = "CENTER_BOTTOM";
        ALIGN[ALIGN["RIGHT_TOP"] = 6] = "RIGHT_TOP";
        ALIGN[ALIGN["RIGHT_CENTER"] = 7] = "RIGHT_CENTER";
        ALIGN[ALIGN["RIGHT_BOTTOM"] = 8] = "RIGHT_BOTTOM";
    })(ALIGN || (ALIGN = {}));
    var ORIENTATION;
    (function (ORIENTATION) {
        ORIENTATION["LANDSCAPE"] = "landscape-primary";
        ORIENTATION["PORTRAIT"] = "portrait-primary";
    })(ORIENTATION || (ORIENTATION = {}));

    class ScalePlugin {
        static init(options) {
            Object.defineProperty(this, 'safeWidth', {
                set(safeWidth) {
                    this._safeWidth = safeWidth;
                    this.resize();
                },
                get() {
                    return this._safeWidth;
                }
            });
            Object.defineProperty(this, 'safeHeight', {
                set(safeHeight) {
                    this._safeHeight = safeHeight;
                    this.resize();
                },
                get() {
                    return this._safeHeight;
                }
            });
            Object.defineProperty(this, 'align', {
                set(align) {
                    this._align = align;
                    this.checkAlign();
                },
                get() {
                    return this._align;
                }
            });
            Object.defineProperty(this, 'orientation', {
                get() {
                    return this.screen.width >= this.screen.height ? ORIENTATION.LANDSCAPE : ORIENTATION.PORTRAIT;
                }
            });
            Object.defineProperty(this, 'left', {
                get() {
                    return this._left;
                }
            });
            Object.defineProperty(this, 'right', {
                get() {
                    return this._right;
                }
            });
            Object.defineProperty(this, 'top', {
                get() {
                    return this._top;
                }
            });
            Object.defineProperty(this, 'bottom', {
                get() {
                    return this._bottom;
                }
            });
            this.resize = () => {
                const app = this;
                if (!app.resizeTo) {
                    app.resizeTo = globalThis.document.body;
                }
                // clear queue resize
                app.cancelResize();
                let width;
                let height;
                let parentWidth;
                let parentHeight;
                if (app.resizeTo === globalThis.window) {
                    parentWidth = globalThis.innerWidth;
                    parentHeight = globalThis.innerHeight;
                }
                else {
                    const { clientWidth, clientHeight } = app.resizeTo;
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
            this.checkAlign = () => {
                const app = this;
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
        static destroy() {
            this.resize = null;
        }
    }
    /** @ignore */
    ScalePlugin.extension = PIXI__namespace.ExtensionType.Application;
    PIXI__namespace.extensions.add(ScalePlugin);

    class SceneManager extends PIXI__namespace.utils.EventEmitter {
        constructor(game, scenes) {
            super();
            this.game = game;
            this._sceneArr = [];
            this._scenes = {};
            this._current = null;
            this.game.stage.name = 'ROOT';
            if (scenes !== undefined) {
                if (!Array.isArray(scenes)) {
                    scenes = [scenes];
                }
                scenes.forEach(scene => {
                    this.add(scene);
                });
            }
            this.game.renderer.on('resize', this.onResize, this);
            this.game.renderer.on('prerender', this.onPrerender, this);
        }
        // event listeners
        onResize() {
            this._sceneArr.forEach((scene) => {
                if (scene.isBooted && scene.resize) {
                    scene.resize();
                }
            });
        }
        onPrerender() {
            const dt = this.game.ticker.deltaTime;
            this._sceneArr.forEach((scene) => {
                if (scene.isBooted && scene.isActive) {
                    scene.emit('preupdate', dt);
                    scene.update && scene.update(dt);
                    scene.emit('postupdate', dt);
                }
            });
        }
        has(key) {
            return Object.keys(this._scenes).indexOf(key) > -1;
        }
        get(key) {
            return this.has(key) ? this._scenes[key].instance : null;
        }
        getConf(key) {
            return this.has(key) ? this._scenes[key].conf : null;
        }
        add(scene) {
            if (this.has(scene.key)) {
                this.remove(scene.key);
            }
            if (typeof scene.className === 'string') {
                scene.className = StringToClass(scene.className);
            }
            const instance = new scene.className(this, scene);
            this._scenes[scene.key] = { conf: scene, instance };
            this._sceneArr.push(instance);
            if (typeof instance.init === 'function') {
                instance.init();
                instance.emit('init');
                this.emit('sceneinit', instance.key);
            }
            if (scene.active === true) {
                this.start(scene.key);
            }
            return this;
        }
        start(key) {
            const scene = this.get(key);
            if (scene !== null && !scene.isBooted) {
                if (this._scenes[scene.key].conf.bundle) {
                    const bundles = this.getConf(scene.key)?.bundle || [];
                    const bundleNames = [];
                    bundles.forEach((bundle) => {
                        PIXI__namespace.Assets.addBundle(bundle.name, bundle.assets);
                        bundleNames.push(bundle.name);
                    });
                    PIXI__namespace.Assets.loadBundle(bundleNames).then(() => {
                        if (scene.preload) {
                            scene.preload().then(() => {
                                this.createScene(scene.key);
                            });
                        }
                        else {
                            this.createScene(scene.key);
                        }
                    });
                    return this;
                }
                if (scene.preload) {
                    scene.preload().then(() => {
                        this.createScene(scene.key);
                    });
                    return this;
                }
                this.createScene(scene.key);
            }
            return this;
        }
        switch(from, to) {
            const sceneA = this.get(from);
            const sceneB = this.get(to);
            if (sceneA && sceneB && sceneA !== sceneB) {
                this.sleep(from);
                if (sceneB.isSleeping) {
                    this.wakeup(to);
                }
                else {
                    this.start(to);
                }
            }
            return this;
        }
        createScene(key) {
            const scene = this.get(key);
            if (scene !== null) {
                scene.buildMap(this.getConf(scene.key).map);
                if (scene.create) {
                    scene.create();
                    scene.emit('created');
                    this.emit('scenecreated', scene.key);
                }
                if (scene.resize) {
                    scene.resize();
                    scene.emit('resize', this.game.screen.width, this.game.screen.height, this.game.orientation);
                    this.emit('sceneresize', scene.key, this.game.screen.width, this.game.screen.height, this.game.orientation);
                }
                scene.isBooted = true;
                this._current = scene;
                this.addToStage(scene);
            }
        }
        remove(key) {
            const scene = this.get(key);
            if (scene !== null) {
                if (scene.isBooted) {
                    this.stop(key);
                }
                if (this.has(key)) {
                    this.removeFromStage(scene);
                    delete this._scenes[key];
                    this._sceneArr.splice(this._sceneArr.indexOf(scene), 1);
                    scene.emit('deleted');
                    this.emit('scenedeleted', key);
                }
            }
            return this;
        }
        stop(key, options) {
            const scene = this.get(key);
            if (scene !== null) {
                this.pause(key);
                this.sleep(key);
                if (this._current === scene) {
                    this._current = null;
                }
                scene.isBooted && scene.destroy(options);
                scene.isBooted = false;
                scene.emit('stopped');
                this.emit('scenestopped', key);
            }
            return this.remove(key);
        }
        pause(key) {
            const scene = this.get(key);
            if (scene !== null && scene.isBooted && scene.isActive) {
                scene.isActive = false;
                scene.emit('paused');
                this.emit('scenepaused', key);
            }
            return this;
        }
        resume(key) {
            const scene = this.get(key);
            if (scene !== null && scene.isBooted && !scene.isActive) {
                scene.isActive = true;
                scene.emit('resume');
                this.emit('sceneresume', key);
            }
            return this;
        }
        sleep(key) {
            const scene = this.get(key);
            if (scene !== null && scene.isBooted && !scene.isSleeping) {
                scene.isSleeping = true;
                scene.renderable = false;
                scene.emit('slept');
                this.emit('sceneslept', key);
            }
            return this;
        }
        wakeup(key) {
            const scene = this.get(key);
            if (scene !== null && scene.isBooted && scene.isSleeping) {
                scene.isSleeping = false;
                scene.renderable = true;
                scene.emit('wokeup');
                this.emit('scenewokeup', key);
            }
            return this;
        }
        bringToTop(key) {
            if (this.has(key)) {
                const scene = this.get(key);
                const index = this._sceneArr.indexOf(scene);
                if (index !== -1 && index < this._sceneArr.length) {
                    this._sceneArr.splice(index, 1);
                    this._sceneArr.push(scene);
                    this.reOrderScenes();
                }
            }
            return this;
        }
        sendToBack(key) {
            if (this.has(key)) {
                const scene = this.get(key);
                const index = this._sceneArr.indexOf(scene);
                if (index !== -1 && index > 0) {
                    this._sceneArr.splice(index, 1);
                    this._sceneArr.unshift(scene);
                    this.reOrderScenes();
                }
            }
            return this;
        }
        destroy() {
            const scenes = this._sceneArr;
            scenes.forEach((scene) => {
                this.remove(scene.key);
            });
        }
        reOrderScenes() {
            for (let i = 0; i < this._sceneArr.length; i++) {
                this._sceneArr[i].zIndex = i;
            }
            this.game.stage.sortChildren();
        }
        addToStage(scene) {
            this.game.stage.addChild(scene);
            this.reOrderScenes();
        }
        removeFromStage(scene) {
            this.game.stage.removeChild(scene);
            this.reOrderScenes();
        }
        // getters and setters
        get current() {
            return this._current;
        }
    }

    class SceneManagerPlugin {
        static init(options) {
            // Set default
            options = Object.assign({
                scenes: []
            }, options);
            Object.defineProperty(this, 'scene', {
                set(scene) {
                    this._scene = scene;
                },
                get() {
                    return this._scene;
                },
            });
            this._scene = null;
            this.scene = new SceneManager(this, options.scenes);
        }
        static destroy() {
            if (this._scene) {
                this._scene.destroy();
            }
        }
    }
    /** @ignore */
    SceneManagerPlugin.extension = PIXI__namespace.ExtensionType.Application;
    PIXI__namespace.extensions.add(SceneManagerPlugin);

    var index$6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        ScalePlugin: ScalePlugin,
        SceneDataPlugin: SceneDataPlugin$1,
        SceneManagerPlugin: SceneManagerPlugin
    });

    class SceneDataPlugin {
        static init(options) {
            // Set default
            options = Object.assign({
                data: {}
            }, options);
            Object.defineProperty(this, 'data', {
                set(data) {
                    this._data = data;
                },
                get() {
                    return this._data;
                },
            });
            this._data = null;
            this.data = new DataManager(options.data, `${options.key}-Storage`);
        }
        static destroy() {
            if (this._data) {
                this._data.destroy();
            }
        }
    }
    /** @ignore */
    SceneDataPlugin.extension = 'scene';
    PIXI__namespace.extensions.add(SceneDataPlugin);

    class Tween extends TWEEN__namespace.Tween {
        update(time, autoStart) {
            return super.update(time, autoStart);
        }
        chain(...tweens) {
            const chainTweens = [];
            if (Array.isArray(tweens)) {
                tweens.forEach((value) => {
                    if (!(value instanceof Tween)) {
                        const t = Tween.build(value);
                        if (t instanceof Tween) {
                            chainTweens.push(t);
                        }
                    }
                    else {
                        chainTweens.push(value);
                    }
                });
            }
            return super.chain(...chainTweens);
        }
        static build(config, tweenManager = false) {
            if (typeof config === 'undefined') {
                config = { target: null };
            }
            if (config.target === undefined) {
                config.target = null;
            }
            if (config.duration === undefined) {
                config.duration = 1000;
            }
            if (config.delay === undefined) {
                config.delay = 0;
            }
            if (config.repeat === undefined) {
                config.repeat = 0;
            }
            if (config.repeatDelay === undefined) {
                config.repeatDelay = 0;
            }
            if (config.yoyo === undefined) {
                config.yoyo = false;
            }
            if (config.group === undefined) {
                config.group = null;
            }
            if (config.easing === undefined) {
                config.easing = TWEEN__namespace.Easing.Linear.None;
            }
            if (config.interpolation === undefined) {
                config.interpolation = null;
            }
            if (config.chain === undefined) {
                config.chain = [];
            }
            if (config.onStart === undefined) {
                config.onStart = null;
            }
            if (config.onEveryStart === undefined) {
                config.onEveryStart = null;
            }
            if (config.onUpdate === undefined) {
                config.onUpdate = null;
            }
            if (config.onRepeat === undefined) {
                config.onRepeat = null;
            }
            if (config.onComplete === undefined) {
                config.onComplete = null;
            }
            if (config.onStop === undefined) {
                config.onStop = null;
            }
            if (config.start === undefined) {
                config.start = true;
            }
            if (config.target) {
                const tween = new Tween(config.target, config.group ?? tweenManager);
                // add 'to' values
                if (typeof config.to === 'object' && !Array.isArray(config.to)) {
                    tween.to(config.to);
                }
                // add duration
                if (typeof config.duration === 'number') {
                    tween.duration(config.duration);
                }
                // add delay
                if (typeof config.delay === 'number') {
                    tween.delay(config.delay);
                }
                // add repeat
                if (typeof config.repeat === 'number') {
                    tween.repeat(config.repeat);
                }
                // add repeat delay
                if (typeof config.repeatDelay === 'number') {
                    tween.repeatDelay(config.repeatDelay);
                }
                // add yoyo
                if (typeof config.yoyo === 'boolean') {
                    tween.yoyo(config.yoyo);
                }
                // add group
                if (config.group instanceof Group) {
                    tween.group(config.group);
                }
                if (typeof config.easing === 'function') {
                    tween.easing(config.easing);
                }
                // add interpolation
                if (typeof config.interpolation === 'function') {
                    tween.interpolation(config.interpolation);
                }
                // add chain tweens
                if (!Array.isArray(config.chain)) {
                    config.chain = [config.chain];
                }
                tween.chain(...config.chain);
                // add onStart function
                if (typeof config.onStart === 'function') {
                    tween.onStart(config.onStart);
                }
                // add onEveryStart function
                if (typeof config.onEveryStart === 'function') {
                    tween.onEveryStart(config.onEveryStart);
                }
                // add onUpdate function
                if (typeof config.onUpdate === 'function') {
                    tween.onUpdate(config.onUpdate);
                }
                // add onRepeat function
                if (typeof config.onRepeat === 'function') {
                    tween.onRepeat(config.onRepeat);
                }
                // add onComplete function
                if (typeof config.onComplete === 'function') {
                    tween.onComplete(config.onComplete);
                }
                // add onStop function
                if (typeof config.onStop === 'function') {
                    tween.onStop(config.onStop);
                }
                // add start
                if (config.start === true) {
                    tween.start();
                }
                return tween;
            }
            return null;
        }
    }

    class Group extends TWEEN__namespace.Group {
        constructor(scene) {
            super();
            this._isPaused = false;
            this._pauseStart = 0;
            this._scene = scene;
            this._scene.on('preupdate', this.update.bind(this));
        }
        update() {
            if (this._scene.isActive && !this._isPaused) {
                return super.update();
            }
            return true;
        }
        destroy() {
            this.removeAll();
            this._scene.off('preupdate', this.update.bind(this));
        }
        build(tween) {
            return Tween.build(tween, this);
        }
        add(tween) {
            if (!(tween instanceof Tween)) {
                tween = this.build(tween);
            }
            if (tween instanceof Tween) {
                super.add(tween);
            }
            return tween;
        }
        pause(time = performance.now()) {
            if (this._isPaused) {
                return this;
            }
            this._isPaused = true;
            this._pauseStart = time;
            return this;
        }
        resume(time = performance.now()) {
            if (!this._isPaused) {
                return this;
            }
            this._isPaused = false;
            const diff = time - this._pauseStart;
            const allTweens = this._tweens;
            const tweenKeys = Object.keys(allTweens);
            const len = tweenKeys.length;
            for (let i = 0; i < len; i++) {
                allTweens[tweenKeys[i]]._startTime += diff;
            }
            this._pauseStart = 0;
            return this;
        }
    }

    var index$5 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Group: Group,
        Tween: Tween
    });

    class SceneTweenPlugin {
        static init(_options) {
            Object.defineProperty(this, 'tween', {
                set(tween) {
                    this._tween = tween;
                },
                get() {
                    return this._tween;
                },
            });
            this._tween = null;
            this.tween = new Group(this);
        }
        static destroy() {
            if (this._tween) {
                this._tween.destroy();
            }
        }
    }
    /** @ignore */
    SceneTweenPlugin.extension = 'scene';
    PIXI__namespace.extensions.add(SceneTweenPlugin);

    function BuildConfig(config) {
        if (config === undefined || config === null) {
            config = {};
        }
        config = Merge(config, {
            accessible: false,
            accessibleChildren: true,
            accessibleHint: undefined,
            accessiblePointerEvents: 'auto',
            accessibleTitle: undefined,
            accessibleType: 'button',
            addToParent: true,
            alpha: 1,
            anchorX: 0,
            anchorY: 0,
            blendMode: 0,
            buttonMode: false,
            children: [],
            cursor: undefined,
            filterArea: undefined,
            hitArea: undefined,
            height: undefined,
            identity: 'container',
            interactiveChildren: true,
            eventMode: 'none',
            localName: '',
            name: '',
            pivotX: 0,
            pivotY: 0,
            renderable: true,
            roundPixels: false,
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            tint: 0xFFFFFF,
            visible: true,
            width: undefined,
            x: 0,
            y: 0
        });
        if (typeof config.children === 'object' && Array.isArray(config.children)) {
            for (let i = 0; i < config.children.length; i++) {
                config.children[i] = BuildConfig(config.children[i]);
            }
        }
        // type specific configs
        return config;
    }

    class GameObjectConfig {
    }

    /* eslint-disable @typescript-eslint/no-use-before-define */
    function AddTo(gObject, parent, index) {
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
    function Build(gObject, config, parent, index) {
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
            gObject.filterArea = new PIXI__namespace.Rectangle(fx, fy, fw, fh);
        }
        if (config.hitArea !== undefined) {
            config.hitArea.type = GetValue(config.hitArea, 'type', 'rectangle');
            config.hitArea.x = GetValue(config.hitArea, 'x', 0);
            config.hitArea.y = GetValue(config.hitArea, 'y', 0);
            switch (config.hitArea.type) {
                case 'circle':
                    config.hitArea.radius = GetValue(config.hitArea, 'radius', 0);
                    gObject.hitArea = new PIXI__namespace.Circle(config.hitArea.x, config.hitArea.y, config.hitArea.radius);
                    break;
                case 'ellipse':
                    config.hitArea.halfWidth = GetValue(config.hitArea, 'halfWidth', 0);
                    config.hitArea.halfHeight = GetValue(config.hitArea, 'halfHeight', 0);
                    gObject.hitArea = new PIXI__namespace.Ellipse(config.hitArea.x, config.hitArea.y, config.hitArea.halfWidth, config.hitArea.halfHeight);
                    break;
                case 'polygon':
                    config.hitArea.points = GetValue(config.hitArea, 'points', []);
                    gObject.hitArea = new PIXI__namespace.Polygon(...config.hitArea.points);
                    break;
                case 'rectangle':
                    config.hitArea.width = GetValue(config.hitArea, 'width', 0);
                    config.hitArea.height = GetValue(config.hitArea, 'height', 0);
                    gObject.hitArea = new PIXI__namespace.Rectangle(config.hitArea.x, config.hitArea.y, config.hitArea.width, config.hitArea.height);
                    break;
                case 'roundedrectangle':
                    config.hitArea.width = GetValue(config.hitArea, 'width', 0);
                    config.hitArea.height = GetValue(config.hitArea, 'height', 0);
                    config.hitArea.radius = GetValue(config.hitArea, 'radius', 0);
                    gObject.hitArea = new PIXI__namespace.RoundedRectangle(config.hitArea.x, config.hitArea.y, config.hitArea.width, config.hitArea.height, config.hitArea.radius);
                    break;
            }
        }
        if (typeof config.height === 'number') {
            gObject.height = config.height;
        }
        gObject.interactiveChildren = config.interactiveChildren;
        gObject.identity = config.identity;
        //config.localName = config.localName.toString().replace('/^[^a-zA-Z_$]|[^\\w$]/', '_')
        if (config.localName !== '' && typeof parent !== 'undefined') {
            parent[config.localName] = gObject;
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
                if (GameObjects[child.identity]) {
                    try {
                        GameObjects[child.identity](child, child.addToParent ? gObject : null);
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
        if (typeof gObject.anchor !== 'undefined' && gObject.anchor instanceof PIXI__namespace.ObservablePoint) {
            gObject.anchor.set(config.anchorX, config.anchorY);
        }
        if (typeof gObject.blendMode !== 'undefined' && typeof config.blendMode === 'number') {
            gObject.blendMode = config.blendMode;
        }
        if (typeof gObject.roundPixels !== 'undefined' && typeof config.roundPixels === 'boolean') {
            gObject.roundPixels = config.roundPixels;
        }
        if (typeof gObject.tint !== 'undefined' && (typeof config.tint === 'string' || typeof config.tint === 'number')) {
            if (typeof config.tint === 'string') {
                gObject.tint = new PIXI__namespace.Color(String(config.tint)).toNumber();
            }
            gObject.tint = Number(config.tint);
        }
        gObject.config = Clone(config);
        AddTo(gObject, parent, index);
        return gObject;
    }
    function Create(config, parent, index) {
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
                if (typeof GameObjects[config.identity] === 'function') {
                    displayObject = GameObjects[config.identity](config, parent, index);
                }
                break;
        }
        return displayObject;
    }
    function CreateAnimatedSprite(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'animatedsprite';
        config.speed = config.speed ?? 1;
        config.loop = config.loop ?? false;
        config.autoPlay = config.autoPlay ?? false;
        const textures = [];
        if (typeof config.textures !== 'undefined') {
            if (typeof config.textures === 'object' && !Array.isArray(config.textures)) {
                config.textures = Pad(config.textures);
            }
            if (Array.isArray(config.textures)) {
                config.textures.forEach((t) => {
                    if (typeof t === 'string') {
                        t = PIXI__namespace.Texture.from(t);
                    }
                    textures.push(t);
                });
            }
        }
        const animatedSprite = new PIXI__namespace.AnimatedSprite(textures, config.autoUpdate);
        animatedSprite.animationSpeed = config.speed;
        animatedSprite.loop = config.loop;
        if (config.autoPlay === true) {
            animatedSprite.play();
        }
        return Build(animatedSprite, config, parent, index);
    }
    function CreateBitmapText(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'bitmaptext';
        config.text = config.text ?? '';
        const bitmapText = new PIXI__namespace.BitmapText(config.text, config.style);
        bitmapText.resolution = config.resolution ?? PIXI__namespace.settings.RESOLUTION;
        return Build(bitmapText, config, parent, index);
    }
    function CreateContainer(config, parent, index) {
        return Build(new PIXI__namespace.Container(), config, parent, index);
    }
    function CreateGraphics(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'graphics';
        const graphics = new PIXI__namespace.Graphics(config.geometry);
        if (config.shape !== undefined) {
            config.shape.type = GetValue(config.shape, 'type', 'rectangle');
            config.shape.x = GetValue(config.shape, 'x', 0);
            config.shape.y = GetValue(config.shape, 'y', 0);
            config.shape.fillStyle = GetValue(config.shape, 'fillStyle', {});
            if (typeof config.shape.fillStyle.texture === 'string') {
                config.shape.fillStyle.texture = PIXI__namespace.Texture.from(config.shape.fillStyle.texture);
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
                        config.shape.lineTextureStyle.texture = PIXI__namespace.Texture.from(config.shape.lineTextureStyle.texture);
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
                        .drawRoundedRect(config.shape.x, config.shape.y, config.shape.width, config.shape.height, config.shape.radius)
                        .endFill();
                    break;
            }
        }
        return Build(graphics, config, parent, index);
    }
    function CreateParticleContainer(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'particlecontainer';
        const particleContainer = new PIXI__namespace.ParticleContainer(config.maxSize, config.properties, config.batchSize, config.autoResize);
        return Build(particleContainer, config, parent, index);
    }
    function CreateSpine(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'spine';
        if (typeof config.spineData === 'undefined') {
            console.error('spineData needed for spine creation');
            return null;
        }
        if (typeof config.spineData === 'string') {
            const spine = PIXI__namespace.Cache.get(config.spineData);
            if (spine) {
                config.spineData = spine.spineData;
            }
        }
        const spine = new pixiSpine.Spine(config.spineData);
        return Build(spine, config, parent, index);
    }
    function CreateSprite(config, parent, index) {
        if (config === undefined || config === null) {
            config = {};
        }
        if (typeof config === 'string' || config instanceof PIXI__namespace.Texture) {
            config = { texture: config };
        }
        config = BuildConfig(config);
        config.identity = 'sprite';
        let texture;
        if (typeof config.texture === 'string') {
            texture = PIXI__namespace.Texture.from(config.texture, config.options);
        }
        else if (texture instanceof PIXI__namespace.Texture) {
            texture = config.texture;
        }
        else {
            texture = PIXI__namespace.Texture.EMPTY;
        }
        const sprite = new PIXI__namespace.Sprite(texture);
        return Build(sprite, config, parent, index);
    }
    function CreateMesh(config, parent, index) {
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
        const mesh = new PIXI__namespace.Mesh(config.geometry, config.shader, config.state, config.drawMode);
        return Build(mesh, config, parent, index);
    }
    function CreateNineSlicePlane(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'ninesliceplane';
        config.leftWidth = config.leftWidth ?? 10;
        config.topHeight = config.topHeight ?? 10;
        config.rightWidth = config.rightWidth ?? 10;
        config.bottomHeight = config.bottomHeight ?? 10;
        let texture;
        if (typeof config.texture === 'string') {
            texture = PIXI__namespace.Texture.from(config.texture, config.options);
        }
        else if (texture instanceof PIXI__namespace.Texture) {
            texture = config.texture;
        }
        else {
            texture = PIXI__namespace.Texture.EMPTY;
        }
        // eslint-disable-next-line max-len
        const sprite = new PIXI__namespace.NineSlicePlane(texture, config.leftWidth, config.topHeight, config.rightWidth, config.bottomHeight);
        return Build(sprite, config, parent, index);
    }
    function CreateText(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'text';
        config.text = config.text ?? '';
        const text = new PIXI__namespace.Text(config.text, config.style, config.canvas);
        text.resolution = config.resolution ?? PIXI__namespace.settings.RESOLUTION;
        return Build(text, config, parent, index);
    }
    function CreateTilingSprite(config, parent, index) {
        config = BuildConfig(config);
        config.identity = 'tilingsprite';
        config.tilingwidth = config.tilingwidth ?? 100;
        config.tilingheight = config.tilingheight ?? 100;
        let texture;
        if (typeof config.texture === 'string') {
            texture = PIXI__namespace.Texture.from(config.texture, config.options);
        }
        else if (texture instanceof PIXI__namespace.Texture) {
            texture = config.texture;
        }
        else {
            texture = PIXI__namespace.Texture.EMPTY;
        }
        const tilingSprite = new PIXI__namespace.TilingSprite(texture, config.tilingwidth, config.tilingheight);
        return Build(tilingSprite, config, parent, index);
    }
    const GameObjects = {
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

    class Scene extends PIXI__namespace.Container {
        constructor(manager, config) {
            super();
            this.manager = manager;
            this.isBooted = false;
            this.isActive = true;
            this.isSleeping = false;
            this.key = config.key;
            this.game = manager.game;
            this.name = config.key.toUpperCase();
            // install plugins here
            Scene._plugins.forEach((plugin) => {
                plugin.init.call(this, config);
            });
        }
        buildMap(map) {
            if (map !== undefined) {
                if (typeof map === 'string') {
                    map = PIXI__namespace.Cache.get(map);
                }
                if (typeof map === 'object') {
                    if (Array.isArray(map)) {
                        map.forEach((s) => {
                            GameObjects.Create(s, this);
                        });
                    }
                    else {
                        GameObjects.Create(map, this);
                    }
                }
            }
        }
        init() { }
        async preload() { }
        create() { }
        update(_deltaTime) { }
        ;
        resize() { }
        destroy(options) {
            const plugins = Scene._plugins.slice(0);
            plugins.reverse();
            plugins.forEach((plugin) => {
                plugin.destroy.call(this);
            });
            super.destroy(options);
        }
    }
    /** Collection of installed plugins. */
    Scene._plugins = [];
    PIXI__namespace.extensions.handleByList('scene', Scene._plugins);

    var index$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Scene: Scene,
        SceneDataPlugin: SceneDataPlugin,
        SceneManager: SceneManager,
        SceneTweenPlugin: SceneTweenPlugin
    });

    var index$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get ALIGN () { return ALIGN; },
        App: index$6,
        BuildConfig: BuildConfig,
        Data: index$7,
        GameObjectConfig: GameObjectConfig,
        GameObjects: GameObjects,
        get ORIENTATION () { return ORIENTATION; },
        Scene: index$4,
        Tweens: index$5,
        Utils: index$8
    });

    class SpriteButton extends PIXI__namespace.Sprite {
        constructor(options) {
            super(PIXI__namespace.Texture.from(options.texture));
            this._isDisabled = false;
            this._up = options.up;
            this._enter = options.enter;
            this._leave = options.up;
            this._down = options.down;
            this._disable = options.disable;
            this._type = options.type;
            // set event listeners
            this.on('pointerenter', this.onPointerEvent, this);
            this.on('pointerleave', this.onPointerEvent, this);
            this.on('pointerdown', this.onPointerEvent, this);
            this.on('pointerup', this.onPointerEvent, this);
            this.cursor = 'pointer';
            if (options.isEnabled === false) {
                this.disabled();
            }
            else {
                this.enabled();
            }
        }
        static Create(config, parent, index) {
            config = BuildConfig(config);
            config.identity = 'spritebutton';
            const sprite = new SpriteButton(config);
            config.eventMode = sprite.eventMode;
            return GameObjects.Build(sprite, config, parent, index);
        }
        // event listeners
        onPointerEvent(e) {
            const eventType = e.type.replace('pointer', '');
            this.setState(eventType);
        }
        setState(eventType) {
            const textureOrTint = this[`_${eventType}`];
            if (this._type === 'tint') {
                this.tint = textureOrTint;
            }
            else {
                this.texture = PIXI__namespace.Texture.from(textureOrTint);
            }
        }
        disabled() {
            this.eventMode = 'none';
            this._isDisabled = true;
            this.setState('disable');
        }
        enabled() {
            this.eventMode = 'dynamic';
            this._isDisabled = false;
            this.setState('up');
        }
        // getters and setters
        get isDisabled() {
            return this._isDisabled;
        }
    }
    GameObjects['spritebutton'] = SpriteButton.Create;
    GameObjects['SpriteButton'] = SpriteButton.Create;

    class BetPanel extends PIXI__namespace.Container {
        // Record<texture:string,value:number>
        constructor(scene, chips) {
            super();
            this._bet = 0;
            this._usedChips = [];
            this._mainChips = {};
            this._chips = {};
            // needed for tween animation
            this.scene = scene;
            this.name = 'BET PANEL VIEW';
            // text background
            const back = new PIXI__namespace.Graphics();
            back.name = 'BET TEXT BACKGROUND';
            back.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 100, 30, 7).endFill();
            back.position.set(185, -205);
            this.addChild(back);
            this._betText = new PIXI__namespace.Text('', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 16,
                align: 'center'
            });
            this._betText.anchor.set(0.5);
            this._betText.position.set(50, 15);
            back.addChild(this._betText);
            this._chipPool = new ObjectPool(this.createChip, this.resetChip, 5);
            const gap = 90;
            let counter = 0;
            // create main chips
            for (const texture in chips) {
                if (Object.prototype.hasOwnProperty.call(chips, texture)) {
                    const value = chips[texture];
                    const chip = this._chipPool.get();
                    chip.data.texture = PIXI__namespace.Texture.from(texture);
                    chip.data.scale.set(0.5);
                    chip.data.x = gap * counter;
                    chip.data.y = -45;
                    chip.data.onclick = chip.data.ontap = this.increase.bind(this, value);
                    this.addChild(chip.data);
                    this._chips[value.toString()] = { texture, value, x: chip.data.x, y: 0 };
                    this._mainChips[value.toString()] = chip.data;
                    counter++;
                }
            }
            // sync bet
            this.bet = this.scene.game.data.get('bet', 0);
            // sync chips
            const dbChips = this.scene.game.data.get('chips', []);
            if (Array.isArray(dbChips)) {
                dbChips.forEach((c) => {
                    this.playIncreaseChipAnim(c, true);
                });
            }
            this.scene.game.data.on('changedata', this.onBalanceChange, this);
            this.checkChips();
            this.checkBalance();
        }
        clear() {
            const len = this._usedChips.length - 1;
            for (let i = len; i >= 0; i--) {
                if ((len - i) <= 5) {
                    this.playDecreaseAnim(i, false, 100 * (len - i));
                }
                else {
                    this.playDecreaseAnim(i, true, 0);
                }
            }
            this.scene.game.data.set('chips', []);
            this.bet = 0;
            this.checkChips();
        }
        onBalanceChange(key) {
            if (key === 'balance') {
                this.checkChips();
                this.checkBalance();
            }
        }
        checkChips() {
            const balance = this.scene.game.data.get('balance', 0) - this.bet;
            for (const chipValue in this._mainChips) {
                if (Object.prototype.hasOwnProperty.call(this._mainChips, chipValue)) {
                    const chip = this._mainChips[chipValue];
                    if (parseInt(chipValue) > balance) {
                        chip.disabled();
                        chip.alpha = 0.5;
                    }
                    else {
                        chip.enabled();
                        chip.alpha = 1;
                    }
                }
            }
        }
        checkBalance() {
            const balance = this.scene.game.data.get('balance', 0);
            if (balance < this.bet) {
                this.clear();
            }
        }
        increase(chip) {
            const keys = Object.keys(this._chips);
            const balance = this.scene.game.data.get('balance', 0);
            if (keys.indexOf(chip.toString()) > -1) {
                if (balance >= this._bet + chip) {
                    this.bet += chip;
                    this.checkChips();
                    const dbChips = this.scene.game.data.get('chips', []);
                    dbChips.push(chip);
                    this.scene.game.data.set('chips', dbChips).writeLocal();
                    this.playIncreaseChipAnim(chip);
                }
            }
        }
        playIncreaseChipAnim(chip, skipAnim = false) {
            // get chip values
            const chipValue = this._chips[chip.toString()];
            // get new chip from pool
            const chipMember = this._chipPool.get();
            this._usedChips.push(chipMember);
            chipMember.data.onclick = chipMember.data.ontap = this.decrease.bind(this, chip, this._usedChips.length - 1);
            chipMember.data.texture = PIXI__namespace.Texture.from(chipValue.texture);
            chipMember.data.scale.set(0.5);
            chipMember.data.x = chipValue.x;
            chipMember.data.y = chipValue.y;
            this.addChild(chipMember.data);
            this.scene.tween.add({
                target: chipMember.data,
                to: { x: 180, y: -165 },
                duration: skipAnim ? 10 : 300,
                easing: TWEEN__namespace.Easing.generatePow(3).Out,
                onStart: (target) => {
                    target.eventMode = 'none';
                },
                onComplete: (target) => {
                    target.enabled();
                }
            });
        }
        decrease(chip, usedIndex) {
            const keys = Object.keys(this._chips);
            if (keys.indexOf(chip.toString()) > -1) {
                if (this._bet >= chip) {
                    this.bet -= chip;
                    this.checkChips();
                    const dbChips = this.scene.game.data.get('chips', []);
                    dbChips.splice(dbChips.lastIndexOf(chip), 1);
                    this.scene.game.data.set('chips', dbChips).writeLocal();
                    this.playDecreaseAnim(usedIndex);
                }
            }
        }
        playDecreaseAnim(usedIndex, skipAnim = false, delay = 0) {
            // get new chip from pool
            const chipMember = this._usedChips[usedIndex];
            if (chipMember) {
                this._usedChips.splice(usedIndex, 1);
                this.scene.tween.add({
                    target: chipMember.data,
                    to: { y: 150 },
                    delay,
                    duration: skipAnim ? 10 : 300,
                    easing: TWEEN__namespace.Easing.generatePow(3).In,
                    onStart: (target) => {
                        target.eventMode = 'none';
                    },
                    onComplete: () => {
                        this.removeChild(chipMember.data);
                        this._chipPool.release(chipMember);
                    }
                });
            }
        }
        createChip() {
            const chip = SpriteButton.Create({
                texture: 'EMPTY',
                up: '#ffffff',
                enter: '#dddddd',
                down: '#aaaaaa',
                disable: '#555555',
                type: 'tint'
            }, this);
            return chip;
        }
        resetChip(chip) {
            chip.texture = null;
            chip.onclick = null;
            chip.ontap = null;
            chip.enabled();
            return chip;
        }
        destroy() {
            this.scene.game.data.off('changedata', this.onBalanceChange, this);
        }
        // getters and setters
        get bet() {
            return this._bet;
        }
        set bet(value) {
            this._bet = value;
            this.scene.game.data.set('bet', value);
            this.scene.game.data.writeLocal();
            this._betText.text = `${this._bet.toString()} €`;
        }
    }

    class Card extends PIXI__namespace.Container {
        constructor(options) {
            super();
            this.value = [0];
            this.subType = null;
            this.type = null;
            this.owner = null;
            this._backSide = null;
            this._frontSide = null;
            this._isVisible = false;
            this.reset();
            this.create(options);
        }
        create(options) {
            this.value = options.value;
            this.subType = options.subType;
            this.type = options.type;
            this.owner = options.owner;
            // create card back side
            if (this._backSide === null) {
                this._backSide = new PIXI__namespace.Sprite(PIXI__namespace.Texture.from(options.back));
                this.addChild(this._backSide);
            }
            else {
                this._backSide.texture = PIXI__namespace.Texture.from(options.back);
            }
            // create card front side
            if (this._frontSide === null) {
                this._frontSide = new PIXI__namespace.Sprite(PIXI__namespace.Texture.from(options.front));
                this.addChild(this._frontSide);
            }
            else {
                this._frontSide.texture = PIXI__namespace.Texture.from(options.front);
            }
        }
        reset() {
            this.position.set(0);
            this.scale.set(1);
            this.pivot.set(0, 0);
            this.alpha = 1;
            this.angle = 0;
            this.value = 0;
            this.subType = null;
            this.type = null;
            this.owner = null;
        }
        open() {
            this._isVisible = true;
            this._backSide.visible = !this._isVisible;
            this._frontSide.visible = this._isVisible;
        }
        close() {
            this._isVisible = false;
            this._backSide.visible = !this._isVisible;
            this._frontSide.visible = this._isVisible;
        }
        destroy(options) {
            this.reset();
            super.destroy(options);
        }
        // getter and setter
        get isVisible() {
            return this._isVisible;
        }
    }

    class Deck extends PIXI__namespace.Container {
        constructor(scene, options) {
            super();
            this._cardValues = {
                'a': [1, 11],
                '2': 2,
                '3': 3,
                '4': 4,
                '5': 5,
                '6': 6,
                '7': 7,
                '8': 8,
                '9': 9,
                '10': 10,
                'j': 10,
                'q': 10,
                'k': 10
            };
            this._cards = [];
            this._copies = [];
            this._usedCards = [];
            // needed for tween animation
            this.scene = scene;
            this.name = 'DECK VIEW';
            // dealer card container
            this._dealerCards = new PIXI__namespace.Container();
            this._dealerCards.name = 'DEALER CARDS';
            this._dealerCards.position.set(88, -30);
            this._dealerCards.scale.set(0.5);
            this.addChild(this._dealerCards);
            // player card container
            this._playerCards = new PIXI__namespace.Container();
            this._playerCards.name = 'PLAYER CARDS';
            this._playerCards.position.set(88, 140);
            this._playerCards.scale.set(0.75);
            this.addChild(this._playerCards);
            this._options = options;
            this._cardPool = new ObjectPool(this.newCard, this.resetCard, 8);
            // fill cards
            const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
            const cardSubtypes = Object.keys(this._cardValues);
            const cardTextures = options.textures;
            const defaultBack = options.back;
            // empty array
            this._cards.length = 0;
            cardTypes.forEach((type) => {
                cardSubtypes.forEach((subType) => {
                    let cardTexture = cardTextures[type][subType];
                    if (typeof cardTexture === 'string') {
                        cardTexture = { back: defaultBack, front: cardTexture };
                    }
                    this._cards.push({ back: defaultBack, ...cardTexture, type: type, subType, value: this._cardValues[subType], owner: null });
                });
            });
            this.shuffle();
        }
        shuffle() {
            this._copies = [...this._cards];
        }
        hit(count = 1, type) {
            const cards = [];
            count = Math.min(count, this._copies.length);
            for (let i = 0; i < count; i++) {
                const randomIndex = RandomNumber(0, this._copies.length - 1);
                const cardOptions = this._copies[randomIndex];
                const card = this._cardPool.get();
                card.data.create(cardOptions);
                card.data.alpha = 0;
                card.data.position.set(type === 'dealer' ? 380 : 235, type === 'dealer' ? -80 : -260);
                card.data.angle = -30;
                card.data.pivot.set(100);
                card.data.owner = type;
                cards.push(card);
                type === 'dealer' && this._dealerCards.children.length == 1 ? card.data.close() : card.data.open();
                type === 'dealer' ? this._dealerCards.addChild(card.data) : this._playerCards.addChild(card.data);
                const dbCards = this.scene.game.data.get(`${type}.cards`, []);
                dbCards.push({ type: card.data.type, subType: card.data.subType, value: card.data.value });
                this.scene.game.data.set(`${type}.cards`, dbCards).writeLocal();
                // remove card from deck
                this._copies.splice(randomIndex, 1);
                // card animation
                const gap = type === 'dealer' ? 40 : 30;
                const limitX = type === 'dealer' ? -320 : -180;
                const alpha = 1;
                const angle = -360;
                this.scene.tween.add({
                    target: card.data,
                    to: { x: 0, y: 0, angle, alpha },
                    delay: 100 * i,
                    duration: 300,
                    onComplete: (obj) => {
                        const container = obj.owner === 'dealer' ? this._dealerCards : this._playerCards;
                        const children = [...container.children];
                        children.splice(children.indexOf(obj), 1);
                        children.forEach((c) => {
                            if (c.x >= limitX)
                                c.x -= gap;
                        });
                    }
                });
            }
            this._usedCards.push(...cards);
            return cards;
        }
        relase() {
            // move dealer container
            this.scene.tween.add({
                target: this._dealerCards,
                to: { x: -300 },
                duration: 1000,
                easing: TWEEN__namespace.Easing.Back.InOut,
                onComplete: () => {
                    this.scene.game.data.set('dealer.cards', []).writeLocal();
                }
            });
            // move player container
            this.scene.tween.add({
                target: this._playerCards,
                to: { x: -300 },
                duration: 1000,
                delay: 100,
                easing: TWEEN__namespace.Easing.Back.InOut,
                onComplete: () => {
                    this.scene.game.data.set('player.cards', []).writeLocal();
                    this._usedCards.forEach((card) => {
                        this._cardPool.release(card);
                    });
                    this._usedCards.length = 0;
                    this._dealerCards.removeChildren();
                    this._dealerCards.position.set(88, -30);
                    this._playerCards.removeChildren();
                    this._playerCards.position.set(88, 140);
                }
            });
        }
        newCard() {
            return new Card({ back: 'EMPTY', front: 'EMPTY', type: null, subType: null, value: [0], owner: null });
        }
        resetCard(card) {
            card.reset();
            return card;
        }
        // getter and setter
        get remains() {
            return this._copies.length;
        }
    }

    class IWallet {
    }
    class Wallet extends PIXI__namespace.Container {
        constructor(scene, money) {
            super();
            this._total = 0;
            this._coinTweens = [];
            // needed for tween animation
            this.scene = scene;
            this.name = 'WALLET VIEW';
            // background
            const back = new PIXI__namespace.Graphics();
            back.name = 'WALLET BACKGROUND';
            back.beginFill('#1e1e1e', .5). /*lineStyle({ width: 2, color: '#fe6665', alpha: 0.5 }).*/drawRoundedRect(0, 0, 200, 30, 7).endFill();
            this.addChild(back);
            // win coin animation pool
            this._coinAnimPool = new ObjectPool(this.createCoinAnim, this.resetCoinAnim, 10);
            // coin animation
            const coinAnim = this._coinAnimPool.get();
            coinAnim.data.visible = true;
            coinAnim.data.animationSpeed = 0.25;
            coinAnim.data.loop = true;
            coinAnim.data.scale.set(0.25);
            coinAnim.data.play();
            coinAnim.data.position.set(5, 5);
            this.addChild(coinAnim.data);
            // total text
            this._totalText = new PIXI__namespace.Text('', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 16
            });
            //this._totalText.anchor.set(0, 0.5);
            this._totalText.position.set(40, 5);
            this.addChild(this._totalText);
            // deposit money
            this.deposit(money || 0, true);
        }
        createCoinAnim() {
            const coinTextures = [
                PIXI__namespace.Texture.from('coins/00000'),
                PIXI__namespace.Texture.from('coins/00001'),
                PIXI__namespace.Texture.from('coins/00002'),
                PIXI__namespace.Texture.from('coins/00003'),
                PIXI__namespace.Texture.from('coins/00004'),
                PIXI__namespace.Texture.from('coins/00005'),
                PIXI__namespace.Texture.from('coins/00006'),
            ];
            return new PIXI__namespace.AnimatedSprite(coinTextures);
        }
        resetCoinAnim(coinAnim) {
            coinAnim.animationSpeed = 1;
            coinAnim.loop = false;
            coinAnim.scale.set(1);
            coinAnim.stop();
            coinAnim.position.set(0, 0);
            coinAnim.visible = false;
            return coinAnim;
        }
        // para yatırma
        deposit(value, skipAnim = false) {
            this.playAnim(this.total + value, skipAnim);
            if (!skipAnim) {
                this.playCoinAnim(value);
            }
            this._total += value;
            this.save();
        }
        // para çekme
        withdraw(value, skipAnim = false) {
            if (value > this.total)
                return false;
            this.playAnim(this.total - value, skipAnim);
            this._total -= value;
            this.save();
            return false;
        }
        save() {
            this.scene.game.data.set('balance', this.total);
            this.scene.game.data.writeLocal();
        }
        playAnim(value, skipAnim = false) {
            if (this._valueTween && this._valueTween.isPlaying) {
                this._valueTween.end();
                this.scene.tween.remove(this._valueTween);
            }
            const counter = { value: this.total };
            let count = Math.abs(Math.round((value - this.total) / 100));
            count = Math.min(count, 9);
            this._valueTween = this.scene.tween.add({
                target: counter,
                to: { value },
                duration: skipAnim ? 10 : count * 300,
                onUpdate: (obj) => {
                    this._totalText.text = `${Math.round(obj.value).toString()} €`;
                },
                start: true
            });
        }
        playCoinAnim(value) {
            let coinCount = Math.round(value / 100);
            coinCount = Math.min(coinCount, 9);
            for (let i = 0; i < coinCount; i++) {
                const randomX = RandomNumber(150, 250);
                const randomY = RandomNumber(320, 420);
                const anim = this._coinAnimPool.get();
                anim.data.position.set(randomX, randomY);
                anim.data.scale.set(0.75);
                this.scene.tween.add({
                    target: anim.data,
                    to: { x: 0, y: 0 },
                    duration: 500,
                    delay: i * 100,
                    onStart: () => {
                        anim.data.visible = true;
                        anim.data.animationSpeed = 0.5;
                        anim.data.loop = true;
                        anim.data.play();
                        this.addChild(anim.data);
                    },
                    onComplete: () => {
                        this.removeChild(anim.data);
                        this._coinAnimPool.release(anim);
                    }
                });
            }
        }
        // getters and setters
        get total() {
            return this._total;
        }
    }

    var index$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BetPanel: BetPanel,
        Card: Card,
        Deck: Deck,
        IWallet: IWallet,
        SpriteButton: SpriteButton,
        Wallet: Wallet
    });

    class BackgroundScene extends Scene {
        create() {
            this.game.scene.sendToBack(this.key);
            // safe area
            const safeArea = new PIXI__namespace.Graphics();
            safeArea.name = 'SAFE AREA';
            safeArea.position.set(45, 60);
            safeArea.beginFill('#000000', .3).lineStyle({ width: 5 }).drawRect(0, 0, 450, 600).endFill();
            //this.addChild(safeArea);
        }
    }

    class GameScene extends Scene {
        create() {
            // get game config
            const config = PIXI__namespace.Cache.get('blackjack');
            // create wallet
            const wallet = new Wallet(this, this.game.data.get('balance', 1000));
            wallet.position.set(45, 60);
            this.addChild(wallet);
            // create bet panel
            const betPanel = new BetPanel(this, config.chips);
            betPanel.position.set(35, 580);
            this.addChild(betPanel);
            this._deck = new Deck(this, config.deck);
            this._deck.position.set(180, 165);
            this.addChild(this._deck);
            this._hitButton.onclick = this._hitButton.ontap = () => {
                this._deck.hit(1, 'player');
            };
            this._standButton.onclick = this._standButton.ontap = () => {
                this._deck.hit(1, 'dealer');
            };
            this._dealButton.onclick = this._dealButton.ontap = () => {
                this._deck.relase();
            };
            this._betClearButton.onclick = this._betClearButton.ontap = () => {
                betPanel.clear();
            };
        }
    }

    class LoadingScene extends Scene {
        create() {
            const prefix = PIXI__namespace.isMobile.phone ? 'low' : 'high';
            PIXI__namespace.Assets.addBundle('initial-assets', [
                {
                    name: 'Bungee Regular',
                    srcs: 'fonts/bungee-regular.ttf'
                },
                {
                    name: 'spritesheet',
                    srcs: `sprites/${prefix}/sprites.json`
                }
            ]);
            PIXI__namespace.Assets.loadBundle('initial-assets', this.onProgress.bind(this)).then(this.onAssetLoadComplete.bind(this));
        }
        onProgress(progress) {
            const config = this._loadingBar.config;
            this._loadingBar
                .lineStyle(config.shape.lineStyle)
                .moveTo(0, 0)
                .lineTo(config.shape.width * progress, 0);
        }
        onAssetLoadComplete() {
            // start inital scenes
            this.game.scene.start('BackgroundScene');
            this.game.scene.start('MenuScene');
            //this.game.scene.start('GameScene');
            // stop and remove this scene
            this.game.scene.stop('LoadingScene');
        }
    }

    class MenuScene extends Scene {
        init() {
            if (!this.game.data.hasLocalRecord()) {
                // initial values
                this.game.data.set('balance', 1000);
                this.game.data.set('bet', 0);
                this.game.data.set('chips', []);
                this.game.data.set('dealer.cards', []);
                this.game.data.set('player.cards', []);
                this.game.data.set('options.music', true);
                this.game.data.set('options.sound', true);
                this.game.data.set('statistic.win', 0);
                this.game.data.set('statistic.lost', 0);
                this.game.data.set('statistic.draw', 0);
                this.game.data.set('statistic.history', []);
                this.game.data.set('statistic.total.win', 0);
                this.game.data.set('statistic.total.lost', 0);
                this.game.data.set('statistic.total.bet', 0);
                this.game.data.writeLocal();
            }
            this.game.data.readLocal();
        }
        create() {
            this._startButton.onclick = this._startButton.ontap = this.onStartClick.bind(this);
        }
        // event listeners
        onSleep() {
            this._startButton.disabled();
        }
        onWokeUp() {
            this._startButton.enabled();
        }
        onStartClick() {
            this.game.scene.sleep(this.key);
            this.game.scene.start('GameScene');
        }
    }

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BackgroundScene: BackgroundScene,
        GameScene: GameScene,
        LoadingScene: LoadingScene,
        MenuScene: MenuScene
    });

    function Init(options) {
        const game = new PIXI__namespace.Application(options);
        const parent = globalThis.document.getElementById('game') || globalThis.document.body;
        parent.appendChild(game.view);
        if (options.debug === true) {
            globalThis.__PIXI_APP__ = game;
            globalThis.game = game;
        }
    }

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Components: index$2,
        Init: Init,
        Scenes: index$1
    });

    window.onload = () => {
        PIXI__namespace.Assets.load({ src: 'misc/game.json', loadParser: 'loadJson' }).then((file) => {
            Init(file);
        });
    };

    exports.Engine = index$3;
    exports.Game = index;

    return exports;

})({}, PIXI, TWEEN, PIXI.spine);
//# sourceMappingURL=black-jack.js.map
