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
                this.load(entriesOrStorage);
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
                    this.save();
                }
            }
            return this;
        }
        clear(localStorage = false) {
            Object.keys(this.data).forEach((prop) => { delete this.data[prop]; }, this);
            if (localStorage) {
                this.unload();
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
        load(key) {
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
        save() {
            if (window.localStorage !== null) {
                window.localStorage.setItem(this._key, JSON.stringify(this.data));
            }
            else {
                console.warn('Local storage not supported');
            }
            return this;
        }
        unload() {
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var howler = {};

    /*!
     *  howler.js v2.2.3
     *  howlerjs.com
     *
     *  (c) 2013-2020, James Simpson of GoldFire Studios
     *  goldfirestudios.com
     *
     *  MIT License
     */

    (function (exports) {
    	(function() {

    	  /** Global Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Create the global controller. All contained methods and properties apply
    	   * to all sounds that are currently playing or will be in the future.
    	   */
    	  var HowlerGlobal = function() {
    	    this.init();
    	  };
    	  HowlerGlobal.prototype = {
    	    /**
    	     * Initialize the global Howler object.
    	     * @return {Howler}
    	     */
    	    init: function() {
    	      var self = this || Howler;

    	      // Create a global ID counter.
    	      self._counter = 1000;

    	      // Pool of unlocked HTML5 Audio objects.
    	      self._html5AudioPool = [];
    	      self.html5PoolSize = 10;

    	      // Internal properties.
    	      self._codecs = {};
    	      self._howls = [];
    	      self._muted = false;
    	      self._volume = 1;
    	      self._canPlayEvent = 'canplaythrough';
    	      self._navigator = (typeof window !== 'undefined' && window.navigator) ? window.navigator : null;

    	      // Public properties.
    	      self.masterGain = null;
    	      self.noAudio = false;
    	      self.usingWebAudio = true;
    	      self.autoSuspend = true;
    	      self.ctx = null;

    	      // Set to false to disable the auto audio unlocker.
    	      self.autoUnlock = true;

    	      // Setup the various state values for global tracking.
    	      self._setup();

    	      return self;
    	    },

    	    /**
    	     * Get/set the global volume for all sounds.
    	     * @param  {Float} vol Volume from 0.0 to 1.0.
    	     * @return {Howler/Float}     Returns self or current volume.
    	     */
    	    volume: function(vol) {
    	      var self = this || Howler;
    	      vol = parseFloat(vol);

    	      // If we don't have an AudioContext created yet, run the setup.
    	      if (!self.ctx) {
    	        setupAudioContext();
    	      }

    	      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
    	        self._volume = vol;

    	        // Don't update any of the nodes if we are muted.
    	        if (self._muted) {
    	          return self;
    	        }

    	        // When using Web Audio, we just need to adjust the master gain.
    	        if (self.usingWebAudio) {
    	          self.masterGain.gain.setValueAtTime(vol, Howler.ctx.currentTime);
    	        }

    	        // Loop through and change volume for all HTML5 audio nodes.
    	        for (var i=0; i<self._howls.length; i++) {
    	          if (!self._howls[i]._webAudio) {
    	            // Get all of the sounds in this Howl group.
    	            var ids = self._howls[i]._getSoundIds();

    	            // Loop through all sounds and change the volumes.
    	            for (var j=0; j<ids.length; j++) {
    	              var sound = self._howls[i]._soundById(ids[j]);

    	              if (sound && sound._node) {
    	                sound._node.volume = sound._volume * vol;
    	              }
    	            }
    	          }
    	        }

    	        return self;
    	      }

    	      return self._volume;
    	    },

    	    /**
    	     * Handle muting and unmuting globally.
    	     * @param  {Boolean} muted Is muted or not.
    	     */
    	    mute: function(muted) {
    	      var self = this || Howler;

    	      // If we don't have an AudioContext created yet, run the setup.
    	      if (!self.ctx) {
    	        setupAudioContext();
    	      }

    	      self._muted = muted;

    	      // With Web Audio, we just need to mute the master gain.
    	      if (self.usingWebAudio) {
    	        self.masterGain.gain.setValueAtTime(muted ? 0 : self._volume, Howler.ctx.currentTime);
    	      }

    	      // Loop through and mute all HTML5 Audio nodes.
    	      for (var i=0; i<self._howls.length; i++) {
    	        if (!self._howls[i]._webAudio) {
    	          // Get all of the sounds in this Howl group.
    	          var ids = self._howls[i]._getSoundIds();

    	          // Loop through all sounds and mark the audio node as muted.
    	          for (var j=0; j<ids.length; j++) {
    	            var sound = self._howls[i]._soundById(ids[j]);

    	            if (sound && sound._node) {
    	              sound._node.muted = (muted) ? true : sound._muted;
    	            }
    	          }
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Handle stopping all sounds globally.
    	     */
    	    stop: function() {
    	      var self = this || Howler;

    	      // Loop through all Howls and stop them.
    	      for (var i=0; i<self._howls.length; i++) {
    	        self._howls[i].stop();
    	      }

    	      return self;
    	    },

    	    /**
    	     * Unload and destroy all currently loaded Howl objects.
    	     * @return {Howler}
    	     */
    	    unload: function() {
    	      var self = this || Howler;

    	      for (var i=self._howls.length-1; i>=0; i--) {
    	        self._howls[i].unload();
    	      }

    	      // Create a new AudioContext to make sure it is fully reset.
    	      if (self.usingWebAudio && self.ctx && typeof self.ctx.close !== 'undefined') {
    	        self.ctx.close();
    	        self.ctx = null;
    	        setupAudioContext();
    	      }

    	      return self;
    	    },

    	    /**
    	     * Check for codec support of specific extension.
    	     * @param  {String} ext Audio file extention.
    	     * @return {Boolean}
    	     */
    	    codecs: function(ext) {
    	      return (this || Howler)._codecs[ext.replace(/^x-/, '')];
    	    },

    	    /**
    	     * Setup various state values for global tracking.
    	     * @return {Howler}
    	     */
    	    _setup: function() {
    	      var self = this || Howler;

    	      // Keeps track of the suspend/resume state of the AudioContext.
    	      self.state = self.ctx ? self.ctx.state || 'suspended' : 'suspended';

    	      // Automatically begin the 30-second suspend process
    	      self._autoSuspend();

    	      // Check if audio is available.
    	      if (!self.usingWebAudio) {
    	        // No audio is available on this system if noAudio is set to true.
    	        if (typeof Audio !== 'undefined') {
    	          try {
    	            var test = new Audio();

    	            // Check if the canplaythrough event is available.
    	            if (typeof test.oncanplaythrough === 'undefined') {
    	              self._canPlayEvent = 'canplay';
    	            }
    	          } catch(e) {
    	            self.noAudio = true;
    	          }
    	        } else {
    	          self.noAudio = true;
    	        }
    	      }

    	      // Test to make sure audio isn't disabled in Internet Explorer.
    	      try {
    	        var test = new Audio();
    	        if (test.muted) {
    	          self.noAudio = true;
    	        }
    	      } catch (e) {}

    	      // Check for supported codecs.
    	      if (!self.noAudio) {
    	        self._setupCodecs();
    	      }

    	      return self;
    	    },

    	    /**
    	     * Check for browser support for various codecs and cache the results.
    	     * @return {Howler}
    	     */
    	    _setupCodecs: function() {
    	      var self = this || Howler;
    	      var audioTest = null;

    	      // Must wrap in a try/catch because IE11 in server mode throws an error.
    	      try {
    	        audioTest = (typeof Audio !== 'undefined') ? new Audio() : null;
    	      } catch (err) {
    	        return self;
    	      }

    	      if (!audioTest || typeof audioTest.canPlayType !== 'function') {
    	        return self;
    	      }

    	      var mpegTest = audioTest.canPlayType('audio/mpeg;').replace(/^no$/, '');

    	      // Opera version <33 has mixed MP3 support, so we need to check for and block it.
    	      var ua = self._navigator ? self._navigator.userAgent : '';
    	      var checkOpera = ua.match(/OPR\/([0-6].)/g);
    	      var isOldOpera = (checkOpera && parseInt(checkOpera[0].split('/')[1], 10) < 33);
    	      var checkSafari = ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1;
    	      var safariVersion = ua.match(/Version\/(.*?) /);
    	      var isOldSafari = (checkSafari && safariVersion && parseInt(safariVersion[1], 10) < 15);

    	      self._codecs = {
    	        mp3: !!(!isOldOpera && (mpegTest || audioTest.canPlayType('audio/mp3;').replace(/^no$/, ''))),
    	        mpeg: !!mpegTest,
    	        opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
    	        ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
    	        oga: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
    	        wav: !!(audioTest.canPlayType('audio/wav; codecs="1"') || audioTest.canPlayType('audio/wav')).replace(/^no$/, ''),
    	        aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
    	        caf: !!audioTest.canPlayType('audio/x-caf;').replace(/^no$/, ''),
    	        m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
    	        m4b: !!(audioTest.canPlayType('audio/x-m4b;') || audioTest.canPlayType('audio/m4b;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
    	        mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
    	        weba: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')),
    	        webm: !!(!isOldSafari && audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')),
    	        dolby: !!audioTest.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ''),
    	        flac: !!(audioTest.canPlayType('audio/x-flac;') || audioTest.canPlayType('audio/flac;')).replace(/^no$/, '')
    	      };

    	      return self;
    	    },

    	    /**
    	     * Some browsers/devices will only allow audio to be played after a user interaction.
    	     * Attempt to automatically unlock audio on the first user interaction.
    	     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
    	     * @return {Howler}
    	     */
    	    _unlockAudio: function() {
    	      var self = this || Howler;

    	      // Only run this if Web Audio is supported and it hasn't already been unlocked.
    	      if (self._audioUnlocked || !self.ctx) {
    	        return;
    	      }

    	      self._audioUnlocked = false;
    	      self.autoUnlock = false;

    	      // Some mobile devices/platforms have distortion issues when opening/closing tabs and/or web views.
    	      // Bugs in the browser (especially Mobile Safari) can cause the sampleRate to change from 44100 to 48000.
    	      // By calling Howler.unload(), we create a new AudioContext with the correct sampleRate.
    	      if (!self._mobileUnloaded && self.ctx.sampleRate !== 44100) {
    	        self._mobileUnloaded = true;
    	        self.unload();
    	      }

    	      // Scratch buffer for enabling iOS to dispose of web audio buffers correctly, as per:
    	      // http://stackoverflow.com/questions/24119684
    	      self._scratchBuffer = self.ctx.createBuffer(1, 1, 22050);

    	      // Call this method on touch start to create and play a buffer,
    	      // then check if the audio actually played to determine if
    	      // audio has now been unlocked on iOS, Android, etc.
    	      var unlock = function(e) {
    	        // Create a pool of unlocked HTML5 Audio objects that can
    	        // be used for playing sounds without user interaction. HTML5
    	        // Audio objects must be individually unlocked, as opposed
    	        // to the WebAudio API which only needs a single activation.
    	        // This must occur before WebAudio setup or the source.onended
    	        // event will not fire.
    	        while (self._html5AudioPool.length < self.html5PoolSize) {
    	          try {
    	            var audioNode = new Audio();

    	            // Mark this Audio object as unlocked to ensure it can get returned
    	            // to the unlocked pool when released.
    	            audioNode._unlocked = true;

    	            // Add the audio node to the pool.
    	            self._releaseHtml5Audio(audioNode);
    	          } catch (e) {
    	            self.noAudio = true;
    	            break;
    	          }
    	        }

    	        // Loop through any assigned audio nodes and unlock them.
    	        for (var i=0; i<self._howls.length; i++) {
    	          if (!self._howls[i]._webAudio) {
    	            // Get all of the sounds in this Howl group.
    	            var ids = self._howls[i]._getSoundIds();

    	            // Loop through all sounds and unlock the audio nodes.
    	            for (var j=0; j<ids.length; j++) {
    	              var sound = self._howls[i]._soundById(ids[j]);

    	              if (sound && sound._node && !sound._node._unlocked) {
    	                sound._node._unlocked = true;
    	                sound._node.load();
    	              }
    	            }
    	          }
    	        }

    	        // Fix Android can not play in suspend state.
    	        self._autoResume();

    	        // Create an empty buffer.
    	        var source = self.ctx.createBufferSource();
    	        source.buffer = self._scratchBuffer;
    	        source.connect(self.ctx.destination);

    	        // Play the empty buffer.
    	        if (typeof source.start === 'undefined') {
    	          source.noteOn(0);
    	        } else {
    	          source.start(0);
    	        }

    	        // Calling resume() on a stack initiated by user gesture is what actually unlocks the audio on Android Chrome >= 55.
    	        if (typeof self.ctx.resume === 'function') {
    	          self.ctx.resume();
    	        }

    	        // Setup a timeout to check that we are unlocked on the next event loop.
    	        source.onended = function() {
    	          source.disconnect(0);

    	          // Update the unlocked state and prevent this check from happening again.
    	          self._audioUnlocked = true;

    	          // Remove the touch start listener.
    	          document.removeEventListener('touchstart', unlock, true);
    	          document.removeEventListener('touchend', unlock, true);
    	          document.removeEventListener('click', unlock, true);
    	          document.removeEventListener('keydown', unlock, true);

    	          // Let all sounds know that audio has been unlocked.
    	          for (var i=0; i<self._howls.length; i++) {
    	            self._howls[i]._emit('unlock');
    	          }
    	        };
    	      };

    	      // Setup a touch start listener to attempt an unlock in.
    	      document.addEventListener('touchstart', unlock, true);
    	      document.addEventListener('touchend', unlock, true);
    	      document.addEventListener('click', unlock, true);
    	      document.addEventListener('keydown', unlock, true);

    	      return self;
    	    },

    	    /**
    	     * Get an unlocked HTML5 Audio object from the pool. If none are left,
    	     * return a new Audio object and throw a warning.
    	     * @return {Audio} HTML5 Audio object.
    	     */
    	    _obtainHtml5Audio: function() {
    	      var self = this || Howler;

    	      // Return the next object from the pool if one exists.
    	      if (self._html5AudioPool.length) {
    	        return self._html5AudioPool.pop();
    	      }

    	      //.Check if the audio is locked and throw a warning.
    	      var testPlay = new Audio().play();
    	      if (testPlay && typeof Promise !== 'undefined' && (testPlay instanceof Promise || typeof testPlay.then === 'function')) {
    	        testPlay.catch(function() {
    	          console.warn('HTML5 Audio pool exhausted, returning potentially locked audio object.');
    	        });
    	      }

    	      return new Audio();
    	    },

    	    /**
    	     * Return an activated HTML5 Audio object to the pool.
    	     * @return {Howler}
    	     */
    	    _releaseHtml5Audio: function(audio) {
    	      var self = this || Howler;

    	      // Don't add audio to the pool if we don't know if it has been unlocked.
    	      if (audio._unlocked) {
    	        self._html5AudioPool.push(audio);
    	      }

    	      return self;
    	    },

    	    /**
    	     * Automatically suspend the Web Audio AudioContext after no sound has played for 30 seconds.
    	     * This saves processing/energy and fixes various browser-specific bugs with audio getting stuck.
    	     * @return {Howler}
    	     */
    	    _autoSuspend: function() {
    	      var self = this;

    	      if (!self.autoSuspend || !self.ctx || typeof self.ctx.suspend === 'undefined' || !Howler.usingWebAudio) {
    	        return;
    	      }

    	      // Check if any sounds are playing.
    	      for (var i=0; i<self._howls.length; i++) {
    	        if (self._howls[i]._webAudio) {
    	          for (var j=0; j<self._howls[i]._sounds.length; j++) {
    	            if (!self._howls[i]._sounds[j]._paused) {
    	              return self;
    	            }
    	          }
    	        }
    	      }

    	      if (self._suspendTimer) {
    	        clearTimeout(self._suspendTimer);
    	      }

    	      // If no sound has played after 30 seconds, suspend the context.
    	      self._suspendTimer = setTimeout(function() {
    	        if (!self.autoSuspend) {
    	          return;
    	        }

    	        self._suspendTimer = null;
    	        self.state = 'suspending';

    	        // Handle updating the state of the audio context after suspending.
    	        var handleSuspension = function() {
    	          self.state = 'suspended';

    	          if (self._resumeAfterSuspend) {
    	            delete self._resumeAfterSuspend;
    	            self._autoResume();
    	          }
    	        };

    	        // Either the state gets suspended or it is interrupted.
    	        // Either way, we need to update the state to suspended.
    	        self.ctx.suspend().then(handleSuspension, handleSuspension);
    	      }, 30000);

    	      return self;
    	    },

    	    /**
    	     * Automatically resume the Web Audio AudioContext when a new sound is played.
    	     * @return {Howler}
    	     */
    	    _autoResume: function() {
    	      var self = this;

    	      if (!self.ctx || typeof self.ctx.resume === 'undefined' || !Howler.usingWebAudio) {
    	        return;
    	      }

    	      if (self.state === 'running' && self.ctx.state !== 'interrupted' && self._suspendTimer) {
    	        clearTimeout(self._suspendTimer);
    	        self._suspendTimer = null;
    	      } else if (self.state === 'suspended' || self.state === 'running' && self.ctx.state === 'interrupted') {
    	        self.ctx.resume().then(function() {
    	          self.state = 'running';

    	          // Emit to all Howls that the audio has resumed.
    	          for (var i=0; i<self._howls.length; i++) {
    	            self._howls[i]._emit('resume');
    	          }
    	        });

    	        if (self._suspendTimer) {
    	          clearTimeout(self._suspendTimer);
    	          self._suspendTimer = null;
    	        }
    	      } else if (self.state === 'suspending') {
    	        self._resumeAfterSuspend = true;
    	      }

    	      return self;
    	    }
    	  };

    	  // Setup the global audio controller.
    	  var Howler = new HowlerGlobal();

    	  /** Group Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Create an audio group controller.
    	   * @param {Object} o Passed in properties for this group.
    	   */
    	  var Howl = function(o) {
    	    var self = this;

    	    // Throw an error if no source is provided.
    	    if (!o.src || o.src.length === 0) {
    	      console.error('An array of source files must be passed with any new Howl.');
    	      return;
    	    }

    	    self.init(o);
    	  };
    	  Howl.prototype = {
    	    /**
    	     * Initialize a new Howl group object.
    	     * @param  {Object} o Passed in properties for this group.
    	     * @return {Howl}
    	     */
    	    init: function(o) {
    	      var self = this;

    	      // If we don't have an AudioContext created yet, run the setup.
    	      if (!Howler.ctx) {
    	        setupAudioContext();
    	      }

    	      // Setup user-defined default properties.
    	      self._autoplay = o.autoplay || false;
    	      self._format = (typeof o.format !== 'string') ? o.format : [o.format];
    	      self._html5 = o.html5 || false;
    	      self._muted = o.mute || false;
    	      self._loop = o.loop || false;
    	      self._pool = o.pool || 5;
    	      self._preload = (typeof o.preload === 'boolean' || o.preload === 'metadata') ? o.preload : true;
    	      self._rate = o.rate || 1;
    	      self._sprite = o.sprite || {};
    	      self._src = (typeof o.src !== 'string') ? o.src : [o.src];
    	      self._volume = o.volume !== undefined ? o.volume : 1;
    	      self._xhr = {
    	        method: o.xhr && o.xhr.method ? o.xhr.method : 'GET',
    	        headers: o.xhr && o.xhr.headers ? o.xhr.headers : null,
    	        withCredentials: o.xhr && o.xhr.withCredentials ? o.xhr.withCredentials : false,
    	      };

    	      // Setup all other default properties.
    	      self._duration = 0;
    	      self._state = 'unloaded';
    	      self._sounds = [];
    	      self._endTimers = {};
    	      self._queue = [];
    	      self._playLock = false;

    	      // Setup event listeners.
    	      self._onend = o.onend ? [{fn: o.onend}] : [];
    	      self._onfade = o.onfade ? [{fn: o.onfade}] : [];
    	      self._onload = o.onload ? [{fn: o.onload}] : [];
    	      self._onloaderror = o.onloaderror ? [{fn: o.onloaderror}] : [];
    	      self._onplayerror = o.onplayerror ? [{fn: o.onplayerror}] : [];
    	      self._onpause = o.onpause ? [{fn: o.onpause}] : [];
    	      self._onplay = o.onplay ? [{fn: o.onplay}] : [];
    	      self._onstop = o.onstop ? [{fn: o.onstop}] : [];
    	      self._onmute = o.onmute ? [{fn: o.onmute}] : [];
    	      self._onvolume = o.onvolume ? [{fn: o.onvolume}] : [];
    	      self._onrate = o.onrate ? [{fn: o.onrate}] : [];
    	      self._onseek = o.onseek ? [{fn: o.onseek}] : [];
    	      self._onunlock = o.onunlock ? [{fn: o.onunlock}] : [];
    	      self._onresume = [];

    	      // Web Audio or HTML5 Audio?
    	      self._webAudio = Howler.usingWebAudio && !self._html5;

    	      // Automatically try to enable audio.
    	      if (typeof Howler.ctx !== 'undefined' && Howler.ctx && Howler.autoUnlock) {
    	        Howler._unlockAudio();
    	      }

    	      // Keep track of this Howl group in the global controller.
    	      Howler._howls.push(self);

    	      // If they selected autoplay, add a play event to the load queue.
    	      if (self._autoplay) {
    	        self._queue.push({
    	          event: 'play',
    	          action: function() {
    	            self.play();
    	          }
    	        });
    	      }

    	      // Load the source file unless otherwise specified.
    	      if (self._preload && self._preload !== 'none') {
    	        self.load();
    	      }

    	      return self;
    	    },

    	    /**
    	     * Load the audio file.
    	     * @return {Howler}
    	     */
    	    load: function() {
    	      var self = this;
    	      var url = null;

    	      // If no audio is available, quit immediately.
    	      if (Howler.noAudio) {
    	        self._emit('loaderror', null, 'No audio support.');
    	        return;
    	      }

    	      // Make sure our source is in an array.
    	      if (typeof self._src === 'string') {
    	        self._src = [self._src];
    	      }

    	      // Loop through the sources and pick the first one that is compatible.
    	      for (var i=0; i<self._src.length; i++) {
    	        var ext, str;

    	        if (self._format && self._format[i]) {
    	          // If an extension was specified, use that instead.
    	          ext = self._format[i];
    	        } else {
    	          // Make sure the source is a string.
    	          str = self._src[i];
    	          if (typeof str !== 'string') {
    	            self._emit('loaderror', null, 'Non-string found in selected audio sources - ignoring.');
    	            continue;
    	          }

    	          // Extract the file extension from the URL or base64 data URI.
    	          ext = /^data:audio\/([^;,]+);/i.exec(str);
    	          if (!ext) {
    	            ext = /\.([^.]+)$/.exec(str.split('?', 1)[0]);
    	          }

    	          if (ext) {
    	            ext = ext[1].toLowerCase();
    	          }
    	        }

    	        // Log a warning if no extension was found.
    	        if (!ext) {
    	          console.warn('No file extension was found. Consider using the "format" property or specify an extension.');
    	        }

    	        // Check if this extension is available.
    	        if (ext && Howler.codecs(ext)) {
    	          url = self._src[i];
    	          break;
    	        }
    	      }

    	      if (!url) {
    	        self._emit('loaderror', null, 'No codec support for selected audio sources.');
    	        return;
    	      }

    	      self._src = url;
    	      self._state = 'loading';

    	      // If the hosting page is HTTPS and the source isn't,
    	      // drop down to HTML5 Audio to avoid Mixed Content errors.
    	      if (window.location.protocol === 'https:' && url.slice(0, 5) === 'http:') {
    	        self._html5 = true;
    	        self._webAudio = false;
    	      }

    	      // Create a new sound object and add it to the pool.
    	      new Sound(self);

    	      // Load and decode the audio data for playback.
    	      if (self._webAudio) {
    	        loadBuffer(self);
    	      }

    	      return self;
    	    },

    	    /**
    	     * Play a sound or resume previous playback.
    	     * @param  {String/Number} sprite   Sprite name for sprite playback or sound id to continue previous.
    	     * @param  {Boolean} internal Internal Use: true prevents event firing.
    	     * @return {Number}          Sound ID.
    	     */
    	    play: function(sprite, internal) {
    	      var self = this;
    	      var id = null;

    	      // Determine if a sprite, sound id or nothing was passed
    	      if (typeof sprite === 'number') {
    	        id = sprite;
    	        sprite = null;
    	      } else if (typeof sprite === 'string' && self._state === 'loaded' && !self._sprite[sprite]) {
    	        // If the passed sprite doesn't exist, do nothing.
    	        return null;
    	      } else if (typeof sprite === 'undefined') {
    	        // Use the default sound sprite (plays the full audio length).
    	        sprite = '__default';

    	        // Check if there is a single paused sound that isn't ended.
    	        // If there is, play that sound. If not, continue as usual.
    	        if (!self._playLock) {
    	          var num = 0;
    	          for (var i=0; i<self._sounds.length; i++) {
    	            if (self._sounds[i]._paused && !self._sounds[i]._ended) {
    	              num++;
    	              id = self._sounds[i]._id;
    	            }
    	          }

    	          if (num === 1) {
    	            sprite = null;
    	          } else {
    	            id = null;
    	          }
    	        }
    	      }

    	      // Get the selected node, or get one from the pool.
    	      var sound = id ? self._soundById(id) : self._inactiveSound();

    	      // If the sound doesn't exist, do nothing.
    	      if (!sound) {
    	        return null;
    	      }

    	      // Select the sprite definition.
    	      if (id && !sprite) {
    	        sprite = sound._sprite || '__default';
    	      }

    	      // If the sound hasn't loaded, we must wait to get the audio's duration.
    	      // We also need to wait to make sure we don't run into race conditions with
    	      // the order of function calls.
    	      if (self._state !== 'loaded') {
    	        // Set the sprite value on this sound.
    	        sound._sprite = sprite;

    	        // Mark this sound as not ended in case another sound is played before this one loads.
    	        sound._ended = false;

    	        // Add the sound to the queue to be played on load.
    	        var soundId = sound._id;
    	        self._queue.push({
    	          event: 'play',
    	          action: function() {
    	            self.play(soundId);
    	          }
    	        });

    	        return soundId;
    	      }

    	      // Don't play the sound if an id was passed and it is already playing.
    	      if (id && !sound._paused) {
    	        // Trigger the play event, in order to keep iterating through queue.
    	        if (!internal) {
    	          self._loadQueue('play');
    	        }

    	        return sound._id;
    	      }

    	      // Make sure the AudioContext isn't suspended, and resume it if it is.
    	      if (self._webAudio) {
    	        Howler._autoResume();
    	      }

    	      // Determine how long to play for and where to start playing.
    	      var seek = Math.max(0, sound._seek > 0 ? sound._seek : self._sprite[sprite][0] / 1000);
    	      var duration = Math.max(0, ((self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000) - seek);
    	      var timeout = (duration * 1000) / Math.abs(sound._rate);
    	      var start = self._sprite[sprite][0] / 1000;
    	      var stop = (self._sprite[sprite][0] + self._sprite[sprite][1]) / 1000;
    	      sound._sprite = sprite;

    	      // Mark the sound as ended instantly so that this async playback
    	      // doesn't get grabbed by another call to play while this one waits to start.
    	      sound._ended = false;

    	      // Update the parameters of the sound.
    	      var setParams = function() {
    	        sound._paused = false;
    	        sound._seek = seek;
    	        sound._start = start;
    	        sound._stop = stop;
    	        sound._loop = !!(sound._loop || self._sprite[sprite][2]);
    	      };

    	      // End the sound instantly if seek is at the end.
    	      if (seek >= stop) {
    	        self._ended(sound);
    	        return;
    	      }

    	      // Begin the actual playback.
    	      var node = sound._node;
    	      if (self._webAudio) {
    	        // Fire this when the sound is ready to play to begin Web Audio playback.
    	        var playWebAudio = function() {
    	          self._playLock = false;
    	          setParams();
    	          self._refreshBuffer(sound);

    	          // Setup the playback params.
    	          var vol = (sound._muted || self._muted) ? 0 : sound._volume;
    	          node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
    	          sound._playStart = Howler.ctx.currentTime;

    	          // Play the sound using the supported method.
    	          if (typeof node.bufferSource.start === 'undefined') {
    	            sound._loop ? node.bufferSource.noteGrainOn(0, seek, 86400) : node.bufferSource.noteGrainOn(0, seek, duration);
    	          } else {
    	            sound._loop ? node.bufferSource.start(0, seek, 86400) : node.bufferSource.start(0, seek, duration);
    	          }

    	          // Start a new timer if none is present.
    	          if (timeout !== Infinity) {
    	            self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
    	          }

    	          if (!internal) {
    	            setTimeout(function() {
    	              self._emit('play', sound._id);
    	              self._loadQueue();
    	            }, 0);
    	          }
    	        };

    	        if (Howler.state === 'running' && Howler.ctx.state !== 'interrupted') {
    	          playWebAudio();
    	        } else {
    	          self._playLock = true;

    	          // Wait for the audio context to resume before playing.
    	          self.once('resume', playWebAudio);

    	          // Cancel the end timer.
    	          self._clearTimer(sound._id);
    	        }
    	      } else {
    	        // Fire this when the sound is ready to play to begin HTML5 Audio playback.
    	        var playHtml5 = function() {
    	          node.currentTime = seek;
    	          node.muted = sound._muted || self._muted || Howler._muted || node.muted;
    	          node.volume = sound._volume * Howler.volume();
    	          node.playbackRate = sound._rate;

    	          // Some browsers will throw an error if this is called without user interaction.
    	          try {
    	            var play = node.play();

    	            // Support older browsers that don't support promises, and thus don't have this issue.
    	            if (play && typeof Promise !== 'undefined' && (play instanceof Promise || typeof play.then === 'function')) {
    	              // Implements a lock to prevent DOMException: The play() request was interrupted by a call to pause().
    	              self._playLock = true;

    	              // Set param values immediately.
    	              setParams();

    	              // Releases the lock and executes queued actions.
    	              play
    	                .then(function() {
    	                  self._playLock = false;
    	                  node._unlocked = true;
    	                  if (!internal) {
    	                    self._emit('play', sound._id);
    	                  } else {
    	                    self._loadQueue();
    	                  }
    	                })
    	                .catch(function() {
    	                  self._playLock = false;
    	                  self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
    	                    'on mobile devices and Chrome where playback was not within a user interaction.');

    	                  // Reset the ended and paused values.
    	                  sound._ended = true;
    	                  sound._paused = true;
    	                });
    	            } else if (!internal) {
    	              self._playLock = false;
    	              setParams();
    	              self._emit('play', sound._id);
    	            }

    	            // Setting rate before playing won't work in IE, so we set it again here.
    	            node.playbackRate = sound._rate;

    	            // If the node is still paused, then we can assume there was a playback issue.
    	            if (node.paused) {
    	              self._emit('playerror', sound._id, 'Playback was unable to start. This is most commonly an issue ' +
    	                'on mobile devices and Chrome where playback was not within a user interaction.');
    	              return;
    	            }

    	            // Setup the end timer on sprites or listen for the ended event.
    	            if (sprite !== '__default' || sound._loop) {
    	              self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
    	            } else {
    	              self._endTimers[sound._id] = function() {
    	                // Fire ended on this audio node.
    	                self._ended(sound);

    	                // Clear this listener.
    	                node.removeEventListener('ended', self._endTimers[sound._id], false);
    	              };
    	              node.addEventListener('ended', self._endTimers[sound._id], false);
    	            }
    	          } catch (err) {
    	            self._emit('playerror', sound._id, err);
    	          }
    	        };

    	        // If this is streaming audio, make sure the src is set and load again.
    	        if (node.src === 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA') {
    	          node.src = self._src;
    	          node.load();
    	        }

    	        // Play immediately if ready, or wait for the 'canplaythrough'e vent.
    	        var loadedNoReadyState = (window && window.ejecta) || (!node.readyState && Howler._navigator.isCocoonJS);
    	        if (node.readyState >= 3 || loadedNoReadyState) {
    	          playHtml5();
    	        } else {
    	          self._playLock = true;
    	          self._state = 'loading';

    	          var listener = function() {
    	            self._state = 'loaded';
    	            
    	            // Begin playback.
    	            playHtml5();

    	            // Clear this listener.
    	            node.removeEventListener(Howler._canPlayEvent, listener, false);
    	          };
    	          node.addEventListener(Howler._canPlayEvent, listener, false);

    	          // Cancel the end timer.
    	          self._clearTimer(sound._id);
    	        }
    	      }

    	      return sound._id;
    	    },

    	    /**
    	     * Pause playback and save current position.
    	     * @param  {Number} id The sound ID (empty to pause all in group).
    	     * @return {Howl}
    	     */
    	    pause: function(id) {
    	      var self = this;

    	      // If the sound hasn't loaded or a play() promise is pending, add it to the load queue to pause when capable.
    	      if (self._state !== 'loaded' || self._playLock) {
    	        self._queue.push({
    	          event: 'pause',
    	          action: function() {
    	            self.pause(id);
    	          }
    	        });

    	        return self;
    	      }

    	      // If no id is passed, get all ID's to be paused.
    	      var ids = self._getSoundIds(id);

    	      for (var i=0; i<ids.length; i++) {
    	        // Clear the end timer.
    	        self._clearTimer(ids[i]);

    	        // Get the sound.
    	        var sound = self._soundById(ids[i]);

    	        if (sound && !sound._paused) {
    	          // Reset the seek position.
    	          sound._seek = self.seek(ids[i]);
    	          sound._rateSeek = 0;
    	          sound._paused = true;

    	          // Stop currently running fades.
    	          self._stopFade(ids[i]);

    	          if (sound._node) {
    	            if (self._webAudio) {
    	              // Make sure the sound has been created.
    	              if (!sound._node.bufferSource) {
    	                continue;
    	              }

    	              if (typeof sound._node.bufferSource.stop === 'undefined') {
    	                sound._node.bufferSource.noteOff(0);
    	              } else {
    	                sound._node.bufferSource.stop(0);
    	              }

    	              // Clean up the buffer source.
    	              self._cleanBuffer(sound._node);
    	            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
    	              sound._node.pause();
    	            }
    	          }
    	        }

    	        // Fire the pause event, unless `true` is passed as the 2nd argument.
    	        if (!arguments[1]) {
    	          self._emit('pause', sound ? sound._id : null);
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Stop playback and reset to start.
    	     * @param  {Number} id The sound ID (empty to stop all in group).
    	     * @param  {Boolean} internal Internal Use: true prevents event firing.
    	     * @return {Howl}
    	     */
    	    stop: function(id, internal) {
    	      var self = this;

    	      // If the sound hasn't loaded, add it to the load queue to stop when capable.
    	      if (self._state !== 'loaded' || self._playLock) {
    	        self._queue.push({
    	          event: 'stop',
    	          action: function() {
    	            self.stop(id);
    	          }
    	        });

    	        return self;
    	      }

    	      // If no id is passed, get all ID's to be stopped.
    	      var ids = self._getSoundIds(id);

    	      for (var i=0; i<ids.length; i++) {
    	        // Clear the end timer.
    	        self._clearTimer(ids[i]);

    	        // Get the sound.
    	        var sound = self._soundById(ids[i]);

    	        if (sound) {
    	          // Reset the seek position.
    	          sound._seek = sound._start || 0;
    	          sound._rateSeek = 0;
    	          sound._paused = true;
    	          sound._ended = true;

    	          // Stop currently running fades.
    	          self._stopFade(ids[i]);

    	          if (sound._node) {
    	            if (self._webAudio) {
    	              // Make sure the sound's AudioBufferSourceNode has been created.
    	              if (sound._node.bufferSource) {
    	                if (typeof sound._node.bufferSource.stop === 'undefined') {
    	                  sound._node.bufferSource.noteOff(0);
    	                } else {
    	                  sound._node.bufferSource.stop(0);
    	                }

    	                // Clean up the buffer source.
    	                self._cleanBuffer(sound._node);
    	              }
    	            } else if (!isNaN(sound._node.duration) || sound._node.duration === Infinity) {
    	              sound._node.currentTime = sound._start || 0;
    	              sound._node.pause();

    	              // If this is a live stream, stop download once the audio is stopped.
    	              if (sound._node.duration === Infinity) {
    	                self._clearSound(sound._node);
    	              }
    	            }
    	          }

    	          if (!internal) {
    	            self._emit('stop', sound._id);
    	          }
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Mute/unmute a single sound or all sounds in this Howl group.
    	     * @param  {Boolean} muted Set to true to mute and false to unmute.
    	     * @param  {Number} id    The sound ID to update (omit to mute/unmute all).
    	     * @return {Howl}
    	     */
    	    mute: function(muted, id) {
    	      var self = this;

    	      // If the sound hasn't loaded, add it to the load queue to mute when capable.
    	      if (self._state !== 'loaded'|| self._playLock) {
    	        self._queue.push({
    	          event: 'mute',
    	          action: function() {
    	            self.mute(muted, id);
    	          }
    	        });

    	        return self;
    	      }

    	      // If applying mute/unmute to all sounds, update the group's value.
    	      if (typeof id === 'undefined') {
    	        if (typeof muted === 'boolean') {
    	          self._muted = muted;
    	        } else {
    	          return self._muted;
    	        }
    	      }

    	      // If no id is passed, get all ID's to be muted.
    	      var ids = self._getSoundIds(id);

    	      for (var i=0; i<ids.length; i++) {
    	        // Get the sound.
    	        var sound = self._soundById(ids[i]);

    	        if (sound) {
    	          sound._muted = muted;

    	          // Cancel active fade and set the volume to the end value.
    	          if (sound._interval) {
    	            self._stopFade(sound._id);
    	          }

    	          if (self._webAudio && sound._node) {
    	            sound._node.gain.setValueAtTime(muted ? 0 : sound._volume, Howler.ctx.currentTime);
    	          } else if (sound._node) {
    	            sound._node.muted = Howler._muted ? true : muted;
    	          }

    	          self._emit('mute', sound._id);
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Get/set the volume of this sound or of the Howl group. This method can optionally take 0, 1 or 2 arguments.
    	     *   volume() -> Returns the group's volume value.
    	     *   volume(id) -> Returns the sound id's current volume.
    	     *   volume(vol) -> Sets the volume of all sounds in this Howl group.
    	     *   volume(vol, id) -> Sets the volume of passed sound id.
    	     * @return {Howl/Number} Returns self or current volume.
    	     */
    	    volume: function() {
    	      var self = this;
    	      var args = arguments;
    	      var vol, id;

    	      // Determine the values based on arguments.
    	      if (args.length === 0) {
    	        // Return the value of the groups' volume.
    	        return self._volume;
    	      } else if (args.length === 1 || args.length === 2 && typeof args[1] === 'undefined') {
    	        // First check if this is an ID, and if not, assume it is a new volume.
    	        var ids = self._getSoundIds();
    	        var index = ids.indexOf(args[0]);
    	        if (index >= 0) {
    	          id = parseInt(args[0], 10);
    	        } else {
    	          vol = parseFloat(args[0]);
    	        }
    	      } else if (args.length >= 2) {
    	        vol = parseFloat(args[0]);
    	        id = parseInt(args[1], 10);
    	      }

    	      // Update the volume or return the current volume.
    	      var sound;
    	      if (typeof vol !== 'undefined' && vol >= 0 && vol <= 1) {
    	        // If the sound hasn't loaded, add it to the load queue to change volume when capable.
    	        if (self._state !== 'loaded'|| self._playLock) {
    	          self._queue.push({
    	            event: 'volume',
    	            action: function() {
    	              self.volume.apply(self, args);
    	            }
    	          });

    	          return self;
    	        }

    	        // Set the group volume.
    	        if (typeof id === 'undefined') {
    	          self._volume = vol;
    	        }

    	        // Update one or all volumes.
    	        id = self._getSoundIds(id);
    	        for (var i=0; i<id.length; i++) {
    	          // Get the sound.
    	          sound = self._soundById(id[i]);

    	          if (sound) {
    	            sound._volume = vol;

    	            // Stop currently running fades.
    	            if (!args[2]) {
    	              self._stopFade(id[i]);
    	            }

    	            if (self._webAudio && sound._node && !sound._muted) {
    	              sound._node.gain.setValueAtTime(vol, Howler.ctx.currentTime);
    	            } else if (sound._node && !sound._muted) {
    	              sound._node.volume = vol * Howler.volume();
    	            }

    	            self._emit('volume', sound._id);
    	          }
    	        }
    	      } else {
    	        sound = id ? self._soundById(id) : self._sounds[0];
    	        return sound ? sound._volume : 0;
    	      }

    	      return self;
    	    },

    	    /**
    	     * Fade a currently playing sound between two volumes (if no id is passed, all sounds will fade).
    	     * @param  {Number} from The value to fade from (0.0 to 1.0).
    	     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
    	     * @param  {Number} len  Time in milliseconds to fade.
    	     * @param  {Number} id   The sound id (omit to fade all sounds).
    	     * @return {Howl}
    	     */
    	    fade: function(from, to, len, id) {
    	      var self = this;

    	      // If the sound hasn't loaded, add it to the load queue to fade when capable.
    	      if (self._state !== 'loaded' || self._playLock) {
    	        self._queue.push({
    	          event: 'fade',
    	          action: function() {
    	            self.fade(from, to, len, id);
    	          }
    	        });

    	        return self;
    	      }

    	      // Make sure the to/from/len values are numbers.
    	      from = Math.min(Math.max(0, parseFloat(from)), 1);
    	      to = Math.min(Math.max(0, parseFloat(to)), 1);
    	      len = parseFloat(len);

    	      // Set the volume to the start position.
    	      self.volume(from, id);

    	      // Fade the volume of one or all sounds.
    	      var ids = self._getSoundIds(id);
    	      for (var i=0; i<ids.length; i++) {
    	        // Get the sound.
    	        var sound = self._soundById(ids[i]);

    	        // Create a linear fade or fall back to timeouts with HTML5 Audio.
    	        if (sound) {
    	          // Stop the previous fade if no sprite is being used (otherwise, volume handles this).
    	          if (!id) {
    	            self._stopFade(ids[i]);
    	          }

    	          // If we are using Web Audio, let the native methods do the actual fade.
    	          if (self._webAudio && !sound._muted) {
    	            var currentTime = Howler.ctx.currentTime;
    	            var end = currentTime + (len / 1000);
    	            sound._volume = from;
    	            sound._node.gain.setValueAtTime(from, currentTime);
    	            sound._node.gain.linearRampToValueAtTime(to, end);
    	          }

    	          self._startFadeInterval(sound, from, to, len, ids[i], typeof id === 'undefined');
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Starts the internal interval to fade a sound.
    	     * @param  {Object} sound Reference to sound to fade.
    	     * @param  {Number} from The value to fade from (0.0 to 1.0).
    	     * @param  {Number} to   The volume to fade to (0.0 to 1.0).
    	     * @param  {Number} len  Time in milliseconds to fade.
    	     * @param  {Number} id   The sound id to fade.
    	     * @param  {Boolean} isGroup   If true, set the volume on the group.
    	     */
    	    _startFadeInterval: function(sound, from, to, len, id, isGroup) {
    	      var self = this;
    	      var vol = from;
    	      var diff = to - from;
    	      var steps = Math.abs(diff / 0.01);
    	      var stepLen = Math.max(4, (steps > 0) ? len / steps : len);
    	      var lastTick = Date.now();

    	      // Store the value being faded to.
    	      sound._fadeTo = to;

    	      // Update the volume value on each interval tick.
    	      sound._interval = setInterval(function() {
    	        // Update the volume based on the time since the last tick.
    	        var tick = (Date.now() - lastTick) / len;
    	        lastTick = Date.now();
    	        vol += diff * tick;

    	        // Round to within 2 decimal points.
    	        vol = Math.round(vol * 100) / 100;

    	        // Make sure the volume is in the right bounds.
    	        if (diff < 0) {
    	          vol = Math.max(to, vol);
    	        } else {
    	          vol = Math.min(to, vol);
    	        }

    	        // Change the volume.
    	        if (self._webAudio) {
    	          sound._volume = vol;
    	        } else {
    	          self.volume(vol, sound._id, true);
    	        }

    	        // Set the group's volume.
    	        if (isGroup) {
    	          self._volume = vol;
    	        }

    	        // When the fade is complete, stop it and fire event.
    	        if ((to < from && vol <= to) || (to > from && vol >= to)) {
    	          clearInterval(sound._interval);
    	          sound._interval = null;
    	          sound._fadeTo = null;
    	          self.volume(to, sound._id);
    	          self._emit('fade', sound._id);
    	        }
    	      }, stepLen);
    	    },

    	    /**
    	     * Internal method that stops the currently playing fade when
    	     * a new fade starts, volume is changed or the sound is stopped.
    	     * @param  {Number} id The sound id.
    	     * @return {Howl}
    	     */
    	    _stopFade: function(id) {
    	      var self = this;
    	      var sound = self._soundById(id);

    	      if (sound && sound._interval) {
    	        if (self._webAudio) {
    	          sound._node.gain.cancelScheduledValues(Howler.ctx.currentTime);
    	        }

    	        clearInterval(sound._interval);
    	        sound._interval = null;
    	        self.volume(sound._fadeTo, id);
    	        sound._fadeTo = null;
    	        self._emit('fade', id);
    	      }

    	      return self;
    	    },

    	    /**
    	     * Get/set the loop parameter on a sound. This method can optionally take 0, 1 or 2 arguments.
    	     *   loop() -> Returns the group's loop value.
    	     *   loop(id) -> Returns the sound id's loop value.
    	     *   loop(loop) -> Sets the loop value for all sounds in this Howl group.
    	     *   loop(loop, id) -> Sets the loop value of passed sound id.
    	     * @return {Howl/Boolean} Returns self or current loop value.
    	     */
    	    loop: function() {
    	      var self = this;
    	      var args = arguments;
    	      var loop, id, sound;

    	      // Determine the values for loop and id.
    	      if (args.length === 0) {
    	        // Return the grou's loop value.
    	        return self._loop;
    	      } else if (args.length === 1) {
    	        if (typeof args[0] === 'boolean') {
    	          loop = args[0];
    	          self._loop = loop;
    	        } else {
    	          // Return this sound's loop value.
    	          sound = self._soundById(parseInt(args[0], 10));
    	          return sound ? sound._loop : false;
    	        }
    	      } else if (args.length === 2) {
    	        loop = args[0];
    	        id = parseInt(args[1], 10);
    	      }

    	      // If no id is passed, get all ID's to be looped.
    	      var ids = self._getSoundIds(id);
    	      for (var i=0; i<ids.length; i++) {
    	        sound = self._soundById(ids[i]);

    	        if (sound) {
    	          sound._loop = loop;
    	          if (self._webAudio && sound._node && sound._node.bufferSource) {
    	            sound._node.bufferSource.loop = loop;
    	            if (loop) {
    	              sound._node.bufferSource.loopStart = sound._start || 0;
    	              sound._node.bufferSource.loopEnd = sound._stop;

    	              // If playing, restart playback to ensure looping updates.
    	              if (self.playing(ids[i])) {
    	                self.pause(ids[i], true);
    	                self.play(ids[i], true);
    	              }
    	            }
    	          }
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Get/set the playback rate of a sound. This method can optionally take 0, 1 or 2 arguments.
    	     *   rate() -> Returns the first sound node's current playback rate.
    	     *   rate(id) -> Returns the sound id's current playback rate.
    	     *   rate(rate) -> Sets the playback rate of all sounds in this Howl group.
    	     *   rate(rate, id) -> Sets the playback rate of passed sound id.
    	     * @return {Howl/Number} Returns self or the current playback rate.
    	     */
    	    rate: function() {
    	      var self = this;
    	      var args = arguments;
    	      var rate, id;

    	      // Determine the values based on arguments.
    	      if (args.length === 0) {
    	        // We will simply return the current rate of the first node.
    	        id = self._sounds[0]._id;
    	      } else if (args.length === 1) {
    	        // First check if this is an ID, and if not, assume it is a new rate value.
    	        var ids = self._getSoundIds();
    	        var index = ids.indexOf(args[0]);
    	        if (index >= 0) {
    	          id = parseInt(args[0], 10);
    	        } else {
    	          rate = parseFloat(args[0]);
    	        }
    	      } else if (args.length === 2) {
    	        rate = parseFloat(args[0]);
    	        id = parseInt(args[1], 10);
    	      }

    	      // Update the playback rate or return the current value.
    	      var sound;
    	      if (typeof rate === 'number') {
    	        // If the sound hasn't loaded, add it to the load queue to change playback rate when capable.
    	        if (self._state !== 'loaded' || self._playLock) {
    	          self._queue.push({
    	            event: 'rate',
    	            action: function() {
    	              self.rate.apply(self, args);
    	            }
    	          });

    	          return self;
    	        }

    	        // Set the group rate.
    	        if (typeof id === 'undefined') {
    	          self._rate = rate;
    	        }

    	        // Update one or all volumes.
    	        id = self._getSoundIds(id);
    	        for (var i=0; i<id.length; i++) {
    	          // Get the sound.
    	          sound = self._soundById(id[i]);

    	          if (sound) {
    	            // Keep track of our position when the rate changed and update the playback
    	            // start position so we can properly adjust the seek position for time elapsed.
    	            if (self.playing(id[i])) {
    	              sound._rateSeek = self.seek(id[i]);
    	              sound._playStart = self._webAudio ? Howler.ctx.currentTime : sound._playStart;
    	            }
    	            sound._rate = rate;

    	            // Change the playback rate.
    	            if (self._webAudio && sound._node && sound._node.bufferSource) {
    	              sound._node.bufferSource.playbackRate.setValueAtTime(rate, Howler.ctx.currentTime);
    	            } else if (sound._node) {
    	              sound._node.playbackRate = rate;
    	            }

    	            // Reset the timers.
    	            var seek = self.seek(id[i]);
    	            var duration = ((self._sprite[sound._sprite][0] + self._sprite[sound._sprite][1]) / 1000) - seek;
    	            var timeout = (duration * 1000) / Math.abs(sound._rate);

    	            // Start a new end timer if sound is already playing.
    	            if (self._endTimers[id[i]] || !sound._paused) {
    	              self._clearTimer(id[i]);
    	              self._endTimers[id[i]] = setTimeout(self._ended.bind(self, sound), timeout);
    	            }

    	            self._emit('rate', sound._id);
    	          }
    	        }
    	      } else {
    	        sound = self._soundById(id);
    	        return sound ? sound._rate : self._rate;
    	      }

    	      return self;
    	    },

    	    /**
    	     * Get/set the seek position of a sound. This method can optionally take 0, 1 or 2 arguments.
    	     *   seek() -> Returns the first sound node's current seek position.
    	     *   seek(id) -> Returns the sound id's current seek position.
    	     *   seek(seek) -> Sets the seek position of the first sound node.
    	     *   seek(seek, id) -> Sets the seek position of passed sound id.
    	     * @return {Howl/Number} Returns self or the current seek position.
    	     */
    	    seek: function() {
    	      var self = this;
    	      var args = arguments;
    	      var seek, id;

    	      // Determine the values based on arguments.
    	      if (args.length === 0) {
    	        // We will simply return the current position of the first node.
    	        if (self._sounds.length) {
    	          id = self._sounds[0]._id;
    	        }
    	      } else if (args.length === 1) {
    	        // First check if this is an ID, and if not, assume it is a new seek position.
    	        var ids = self._getSoundIds();
    	        var index = ids.indexOf(args[0]);
    	        if (index >= 0) {
    	          id = parseInt(args[0], 10);
    	        } else if (self._sounds.length) {
    	          id = self._sounds[0]._id;
    	          seek = parseFloat(args[0]);
    	        }
    	      } else if (args.length === 2) {
    	        seek = parseFloat(args[0]);
    	        id = parseInt(args[1], 10);
    	      }

    	      // If there is no ID, bail out.
    	      if (typeof id === 'undefined') {
    	        return 0;
    	      }

    	      // If the sound hasn't loaded, add it to the load queue to seek when capable.
    	      if (typeof seek === 'number' && (self._state !== 'loaded' || self._playLock)) {
    	        self._queue.push({
    	          event: 'seek',
    	          action: function() {
    	            self.seek.apply(self, args);
    	          }
    	        });

    	        return self;
    	      }

    	      // Get the sound.
    	      var sound = self._soundById(id);

    	      if (sound) {
    	        if (typeof seek === 'number' && seek >= 0) {
    	          // Pause the sound and update position for restarting playback.
    	          var playing = self.playing(id);
    	          if (playing) {
    	            self.pause(id, true);
    	          }

    	          // Move the position of the track and cancel timer.
    	          sound._seek = seek;
    	          sound._ended = false;
    	          self._clearTimer(id);

    	          // Update the seek position for HTML5 Audio.
    	          if (!self._webAudio && sound._node && !isNaN(sound._node.duration)) {
    	            sound._node.currentTime = seek;
    	          }

    	          // Seek and emit when ready.
    	          var seekAndEmit = function() {
    	            // Restart the playback if the sound was playing.
    	            if (playing) {
    	              self.play(id, true);
    	            }

    	            self._emit('seek', id);
    	          };

    	          // Wait for the play lock to be unset before emitting (HTML5 Audio).
    	          if (playing && !self._webAudio) {
    	            var emitSeek = function() {
    	              if (!self._playLock) {
    	                seekAndEmit();
    	              } else {
    	                setTimeout(emitSeek, 0);
    	              }
    	            };
    	            setTimeout(emitSeek, 0);
    	          } else {
    	            seekAndEmit();
    	          }
    	        } else {
    	          if (self._webAudio) {
    	            var realTime = self.playing(id) ? Howler.ctx.currentTime - sound._playStart : 0;
    	            var rateSeek = sound._rateSeek ? sound._rateSeek - sound._seek : 0;
    	            return sound._seek + (rateSeek + realTime * Math.abs(sound._rate));
    	          } else {
    	            return sound._node.currentTime;
    	          }
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Check if a specific sound is currently playing or not (if id is provided), or check if at least one of the sounds in the group is playing or not.
    	     * @param  {Number}  id The sound id to check. If none is passed, the whole sound group is checked.
    	     * @return {Boolean} True if playing and false if not.
    	     */
    	    playing: function(id) {
    	      var self = this;

    	      // Check the passed sound ID (if any).
    	      if (typeof id === 'number') {
    	        var sound = self._soundById(id);
    	        return sound ? !sound._paused : false;
    	      }

    	      // Otherwise, loop through all sounds and check if any are playing.
    	      for (var i=0; i<self._sounds.length; i++) {
    	        if (!self._sounds[i]._paused) {
    	          return true;
    	        }
    	      }

    	      return false;
    	    },

    	    /**
    	     * Get the duration of this sound. Passing a sound id will return the sprite duration.
    	     * @param  {Number} id The sound id to check. If none is passed, return full source duration.
    	     * @return {Number} Audio duration in seconds.
    	     */
    	    duration: function(id) {
    	      var self = this;
    	      var duration = self._duration;

    	      // If we pass an ID, get the sound and return the sprite length.
    	      var sound = self._soundById(id);
    	      if (sound) {
    	        duration = self._sprite[sound._sprite][1] / 1000;
    	      }

    	      return duration;
    	    },

    	    /**
    	     * Returns the current loaded state of this Howl.
    	     * @return {String} 'unloaded', 'loading', 'loaded'
    	     */
    	    state: function() {
    	      return this._state;
    	    },

    	    /**
    	     * Unload and destroy the current Howl object.
    	     * This will immediately stop all sound instances attached to this group.
    	     */
    	    unload: function() {
    	      var self = this;

    	      // Stop playing any active sounds.
    	      var sounds = self._sounds;
    	      for (var i=0; i<sounds.length; i++) {
    	        // Stop the sound if it is currently playing.
    	        if (!sounds[i]._paused) {
    	          self.stop(sounds[i]._id);
    	        }

    	        // Remove the source or disconnect.
    	        if (!self._webAudio) {
    	          // Set the source to 0-second silence to stop any downloading (except in IE).
    	          self._clearSound(sounds[i]._node);

    	          // Remove any event listeners.
    	          sounds[i]._node.removeEventListener('error', sounds[i]._errorFn, false);
    	          sounds[i]._node.removeEventListener(Howler._canPlayEvent, sounds[i]._loadFn, false);
    	          sounds[i]._node.removeEventListener('ended', sounds[i]._endFn, false);

    	          // Release the Audio object back to the pool.
    	          Howler._releaseHtml5Audio(sounds[i]._node);
    	        }

    	        // Empty out all of the nodes.
    	        delete sounds[i]._node;

    	        // Make sure all timers are cleared out.
    	        self._clearTimer(sounds[i]._id);
    	      }

    	      // Remove the references in the global Howler object.
    	      var index = Howler._howls.indexOf(self);
    	      if (index >= 0) {
    	        Howler._howls.splice(index, 1);
    	      }

    	      // Delete this sound from the cache (if no other Howl is using it).
    	      var remCache = true;
    	      for (i=0; i<Howler._howls.length; i++) {
    	        if (Howler._howls[i]._src === self._src || self._src.indexOf(Howler._howls[i]._src) >= 0) {
    	          remCache = false;
    	          break;
    	        }
    	      }

    	      if (cache && remCache) {
    	        delete cache[self._src];
    	      }

    	      // Clear global errors.
    	      Howler.noAudio = false;

    	      // Clear out `self`.
    	      self._state = 'unloaded';
    	      self._sounds = [];
    	      self = null;

    	      return null;
    	    },

    	    /**
    	     * Listen to a custom event.
    	     * @param  {String}   event Event name.
    	     * @param  {Function} fn    Listener to call.
    	     * @param  {Number}   id    (optional) Only listen to events for this sound.
    	     * @param  {Number}   once  (INTERNAL) Marks event to fire only once.
    	     * @return {Howl}
    	     */
    	    on: function(event, fn, id, once) {
    	      var self = this;
    	      var events = self['_on' + event];

    	      if (typeof fn === 'function') {
    	        events.push(once ? {id: id, fn: fn, once: once} : {id: id, fn: fn});
    	      }

    	      return self;
    	    },

    	    /**
    	     * Remove a custom event. Call without parameters to remove all events.
    	     * @param  {String}   event Event name.
    	     * @param  {Function} fn    Listener to remove. Leave empty to remove all.
    	     * @param  {Number}   id    (optional) Only remove events for this sound.
    	     * @return {Howl}
    	     */
    	    off: function(event, fn, id) {
    	      var self = this;
    	      var events = self['_on' + event];
    	      var i = 0;

    	      // Allow passing just an event and ID.
    	      if (typeof fn === 'number') {
    	        id = fn;
    	        fn = null;
    	      }

    	      if (fn || id) {
    	        // Loop through event store and remove the passed function.
    	        for (i=0; i<events.length; i++) {
    	          var isId = (id === events[i].id);
    	          if (fn === events[i].fn && isId || !fn && isId) {
    	            events.splice(i, 1);
    	            break;
    	          }
    	        }
    	      } else if (event) {
    	        // Clear out all events of this type.
    	        self['_on' + event] = [];
    	      } else {
    	        // Clear out all events of every type.
    	        var keys = Object.keys(self);
    	        for (i=0; i<keys.length; i++) {
    	          if ((keys[i].indexOf('_on') === 0) && Array.isArray(self[keys[i]])) {
    	            self[keys[i]] = [];
    	          }
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Listen to a custom event and remove it once fired.
    	     * @param  {String}   event Event name.
    	     * @param  {Function} fn    Listener to call.
    	     * @param  {Number}   id    (optional) Only listen to events for this sound.
    	     * @return {Howl}
    	     */
    	    once: function(event, fn, id) {
    	      var self = this;

    	      // Setup the event listener.
    	      self.on(event, fn, id, 1);

    	      return self;
    	    },

    	    /**
    	     * Emit all events of a specific type and pass the sound id.
    	     * @param  {String} event Event name.
    	     * @param  {Number} id    Sound ID.
    	     * @param  {Number} msg   Message to go with event.
    	     * @return {Howl}
    	     */
    	    _emit: function(event, id, msg) {
    	      var self = this;
    	      var events = self['_on' + event];

    	      // Loop through event store and fire all functions.
    	      for (var i=events.length-1; i>=0; i--) {
    	        // Only fire the listener if the correct ID is used.
    	        if (!events[i].id || events[i].id === id || event === 'load') {
    	          setTimeout(function(fn) {
    	            fn.call(this, id, msg);
    	          }.bind(self, events[i].fn), 0);

    	          // If this event was setup with `once`, remove it.
    	          if (events[i].once) {
    	            self.off(event, events[i].fn, events[i].id);
    	          }
    	        }
    	      }

    	      // Pass the event type into load queue so that it can continue stepping.
    	      self._loadQueue(event);

    	      return self;
    	    },

    	    /**
    	     * Queue of actions initiated before the sound has loaded.
    	     * These will be called in sequence, with the next only firing
    	     * after the previous has finished executing (even if async like play).
    	     * @return {Howl}
    	     */
    	    _loadQueue: function(event) {
    	      var self = this;

    	      if (self._queue.length > 0) {
    	        var task = self._queue[0];

    	        // Remove this task if a matching event was passed.
    	        if (task.event === event) {
    	          self._queue.shift();
    	          self._loadQueue();
    	        }

    	        // Run the task if no event type is passed.
    	        if (!event) {
    	          task.action();
    	        }
    	      }

    	      return self;
    	    },

    	    /**
    	     * Fired when playback ends at the end of the duration.
    	     * @param  {Sound} sound The sound object to work with.
    	     * @return {Howl}
    	     */
    	    _ended: function(sound) {
    	      var self = this;
    	      var sprite = sound._sprite;

    	      // If we are using IE and there was network latency we may be clipping
    	      // audio before it completes playing. Lets check the node to make sure it
    	      // believes it has completed, before ending the playback.
    	      if (!self._webAudio && sound._node && !sound._node.paused && !sound._node.ended && sound._node.currentTime < sound._stop) {
    	        setTimeout(self._ended.bind(self, sound), 100);
    	        return self;
    	      }

    	      // Should this sound loop?
    	      var loop = !!(sound._loop || self._sprite[sprite][2]);

    	      // Fire the ended event.
    	      self._emit('end', sound._id);

    	      // Restart the playback for HTML5 Audio loop.
    	      if (!self._webAudio && loop) {
    	        self.stop(sound._id, true).play(sound._id);
    	      }

    	      // Restart this timer if on a Web Audio loop.
    	      if (self._webAudio && loop) {
    	        self._emit('play', sound._id);
    	        sound._seek = sound._start || 0;
    	        sound._rateSeek = 0;
    	        sound._playStart = Howler.ctx.currentTime;

    	        var timeout = ((sound._stop - sound._start) * 1000) / Math.abs(sound._rate);
    	        self._endTimers[sound._id] = setTimeout(self._ended.bind(self, sound), timeout);
    	      }

    	      // Mark the node as paused.
    	      if (self._webAudio && !loop) {
    	        sound._paused = true;
    	        sound._ended = true;
    	        sound._seek = sound._start || 0;
    	        sound._rateSeek = 0;
    	        self._clearTimer(sound._id);

    	        // Clean up the buffer source.
    	        self._cleanBuffer(sound._node);

    	        // Attempt to auto-suspend AudioContext if no sounds are still playing.
    	        Howler._autoSuspend();
    	      }

    	      // When using a sprite, end the track.
    	      if (!self._webAudio && !loop) {
    	        self.stop(sound._id, true);
    	      }

    	      return self;
    	    },

    	    /**
    	     * Clear the end timer for a sound playback.
    	     * @param  {Number} id The sound ID.
    	     * @return {Howl}
    	     */
    	    _clearTimer: function(id) {
    	      var self = this;

    	      if (self._endTimers[id]) {
    	        // Clear the timeout or remove the ended listener.
    	        if (typeof self._endTimers[id] !== 'function') {
    	          clearTimeout(self._endTimers[id]);
    	        } else {
    	          var sound = self._soundById(id);
    	          if (sound && sound._node) {
    	            sound._node.removeEventListener('ended', self._endTimers[id], false);
    	          }
    	        }

    	        delete self._endTimers[id];
    	      }

    	      return self;
    	    },

    	    /**
    	     * Return the sound identified by this ID, or return null.
    	     * @param  {Number} id Sound ID
    	     * @return {Object}    Sound object or null.
    	     */
    	    _soundById: function(id) {
    	      var self = this;

    	      // Loop through all sounds and find the one with this ID.
    	      for (var i=0; i<self._sounds.length; i++) {
    	        if (id === self._sounds[i]._id) {
    	          return self._sounds[i];
    	        }
    	      }

    	      return null;
    	    },

    	    /**
    	     * Return an inactive sound from the pool or create a new one.
    	     * @return {Sound} Sound playback object.
    	     */
    	    _inactiveSound: function() {
    	      var self = this;

    	      self._drain();

    	      // Find the first inactive node to recycle.
    	      for (var i=0; i<self._sounds.length; i++) {
    	        if (self._sounds[i]._ended) {
    	          return self._sounds[i].reset();
    	        }
    	      }

    	      // If no inactive node was found, create a new one.
    	      return new Sound(self);
    	    },

    	    /**
    	     * Drain excess inactive sounds from the pool.
    	     */
    	    _drain: function() {
    	      var self = this;
    	      var limit = self._pool;
    	      var cnt = 0;
    	      var i = 0;

    	      // If there are less sounds than the max pool size, we are done.
    	      if (self._sounds.length < limit) {
    	        return;
    	      }

    	      // Count the number of inactive sounds.
    	      for (i=0; i<self._sounds.length; i++) {
    	        if (self._sounds[i]._ended) {
    	          cnt++;
    	        }
    	      }

    	      // Remove excess inactive sounds, going in reverse order.
    	      for (i=self._sounds.length - 1; i>=0; i--) {
    	        if (cnt <= limit) {
    	          return;
    	        }

    	        if (self._sounds[i]._ended) {
    	          // Disconnect the audio source when using Web Audio.
    	          if (self._webAudio && self._sounds[i]._node) {
    	            self._sounds[i]._node.disconnect(0);
    	          }

    	          // Remove sounds until we have the pool size.
    	          self._sounds.splice(i, 1);
    	          cnt--;
    	        }
    	      }
    	    },

    	    /**
    	     * Get all ID's from the sounds pool.
    	     * @param  {Number} id Only return one ID if one is passed.
    	     * @return {Array}    Array of IDs.
    	     */
    	    _getSoundIds: function(id) {
    	      var self = this;

    	      if (typeof id === 'undefined') {
    	        var ids = [];
    	        for (var i=0; i<self._sounds.length; i++) {
    	          ids.push(self._sounds[i]._id);
    	        }

    	        return ids;
    	      } else {
    	        return [id];
    	      }
    	    },

    	    /**
    	     * Load the sound back into the buffer source.
    	     * @param  {Sound} sound The sound object to work with.
    	     * @return {Howl}
    	     */
    	    _refreshBuffer: function(sound) {
    	      var self = this;

    	      // Setup the buffer source for playback.
    	      sound._node.bufferSource = Howler.ctx.createBufferSource();
    	      sound._node.bufferSource.buffer = cache[self._src];

    	      // Connect to the correct node.
    	      if (sound._panner) {
    	        sound._node.bufferSource.connect(sound._panner);
    	      } else {
    	        sound._node.bufferSource.connect(sound._node);
    	      }

    	      // Setup looping and playback rate.
    	      sound._node.bufferSource.loop = sound._loop;
    	      if (sound._loop) {
    	        sound._node.bufferSource.loopStart = sound._start || 0;
    	        sound._node.bufferSource.loopEnd = sound._stop || 0;
    	      }
    	      sound._node.bufferSource.playbackRate.setValueAtTime(sound._rate, Howler.ctx.currentTime);

    	      return self;
    	    },

    	    /**
    	     * Prevent memory leaks by cleaning up the buffer source after playback.
    	     * @param  {Object} node Sound's audio node containing the buffer source.
    	     * @return {Howl}
    	     */
    	    _cleanBuffer: function(node) {
    	      var self = this;
    	      var isIOS = Howler._navigator && Howler._navigator.vendor.indexOf('Apple') >= 0;

    	      if (Howler._scratchBuffer && node.bufferSource) {
    	        node.bufferSource.onended = null;
    	        node.bufferSource.disconnect(0);
    	        if (isIOS) {
    	          try { node.bufferSource.buffer = Howler._scratchBuffer; } catch(e) {}
    	        }
    	      }
    	      node.bufferSource = null;

    	      return self;
    	    },

    	    /**
    	     * Set the source to a 0-second silence to stop any downloading (except in IE).
    	     * @param  {Object} node Audio node to clear.
    	     */
    	    _clearSound: function(node) {
    	      var checkIE = /MSIE |Trident\//.test(Howler._navigator && Howler._navigator.userAgent);
    	      if (!checkIE) {
    	        node.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    	      }
    	    }
    	  };

    	  /** Single Sound Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Setup the sound object, which each node attached to a Howl group is contained in.
    	   * @param {Object} howl The Howl parent group.
    	   */
    	  var Sound = function(howl) {
    	    this._parent = howl;
    	    this.init();
    	  };
    	  Sound.prototype = {
    	    /**
    	     * Initialize a new Sound object.
    	     * @return {Sound}
    	     */
    	    init: function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Setup the default parameters.
    	      self._muted = parent._muted;
    	      self._loop = parent._loop;
    	      self._volume = parent._volume;
    	      self._rate = parent._rate;
    	      self._seek = 0;
    	      self._paused = true;
    	      self._ended = true;
    	      self._sprite = '__default';

    	      // Generate a unique ID for this sound.
    	      self._id = ++Howler._counter;

    	      // Add itself to the parent's pool.
    	      parent._sounds.push(self);

    	      // Create the new node.
    	      self.create();

    	      return self;
    	    },

    	    /**
    	     * Create and setup a new sound object, whether HTML5 Audio or Web Audio.
    	     * @return {Sound}
    	     */
    	    create: function() {
    	      var self = this;
    	      var parent = self._parent;
    	      var volume = (Howler._muted || self._muted || self._parent._muted) ? 0 : self._volume;

    	      if (parent._webAudio) {
    	        // Create the gain node for controlling volume (the source will connect to this).
    	        self._node = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
    	        self._node.gain.setValueAtTime(volume, Howler.ctx.currentTime);
    	        self._node.paused = true;
    	        self._node.connect(Howler.masterGain);
    	      } else if (!Howler.noAudio) {
    	        // Get an unlocked Audio object from the pool.
    	        self._node = Howler._obtainHtml5Audio();

    	        // Listen for errors (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror).
    	        self._errorFn = self._errorListener.bind(self);
    	        self._node.addEventListener('error', self._errorFn, false);

    	        // Listen for 'canplaythrough' event to let us know the sound is ready.
    	        self._loadFn = self._loadListener.bind(self);
    	        self._node.addEventListener(Howler._canPlayEvent, self._loadFn, false);

    	        // Listen for the 'ended' event on the sound to account for edge-case where
    	        // a finite sound has a duration of Infinity.
    	        self._endFn = self._endListener.bind(self);
    	        self._node.addEventListener('ended', self._endFn, false);

    	        // Setup the new audio node.
    	        self._node.src = parent._src;
    	        self._node.preload = parent._preload === true ? 'auto' : parent._preload;
    	        self._node.volume = volume * Howler.volume();

    	        // Begin loading the source.
    	        self._node.load();
    	      }

    	      return self;
    	    },

    	    /**
    	     * Reset the parameters of this sound to the original state (for recycle).
    	     * @return {Sound}
    	     */
    	    reset: function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Reset all of the parameters of this sound.
    	      self._muted = parent._muted;
    	      self._loop = parent._loop;
    	      self._volume = parent._volume;
    	      self._rate = parent._rate;
    	      self._seek = 0;
    	      self._rateSeek = 0;
    	      self._paused = true;
    	      self._ended = true;
    	      self._sprite = '__default';

    	      // Generate a new ID so that it isn't confused with the previous sound.
    	      self._id = ++Howler._counter;

    	      return self;
    	    },

    	    /**
    	     * HTML5 Audio error listener callback.
    	     */
    	    _errorListener: function() {
    	      var self = this;

    	      // Fire an error event and pass back the code.
    	      self._parent._emit('loaderror', self._id, self._node.error ? self._node.error.code : 0);

    	      // Clear the event listener.
    	      self._node.removeEventListener('error', self._errorFn, false);
    	    },

    	    /**
    	     * HTML5 Audio canplaythrough listener callback.
    	     */
    	    _loadListener: function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Round up the duration to account for the lower precision in HTML5 Audio.
    	      parent._duration = Math.ceil(self._node.duration * 10) / 10;

    	      // Setup a sprite if none is defined.
    	      if (Object.keys(parent._sprite).length === 0) {
    	        parent._sprite = {__default: [0, parent._duration * 1000]};
    	      }

    	      if (parent._state !== 'loaded') {
    	        parent._state = 'loaded';
    	        parent._emit('load');
    	        parent._loadQueue();
    	      }

    	      // Clear the event listener.
    	      self._node.removeEventListener(Howler._canPlayEvent, self._loadFn, false);
    	    },

    	    /**
    	     * HTML5 Audio ended listener callback.
    	     */
    	    _endListener: function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Only handle the `ended`` event if the duration is Infinity.
    	      if (parent._duration === Infinity) {
    	        // Update the parent duration to match the real audio duration.
    	        // Round up the duration to account for the lower precision in HTML5 Audio.
    	        parent._duration = Math.ceil(self._node.duration * 10) / 10;

    	        // Update the sprite that corresponds to the real duration.
    	        if (parent._sprite.__default[1] === Infinity) {
    	          parent._sprite.__default[1] = parent._duration * 1000;
    	        }

    	        // Run the regular ended method.
    	        parent._ended(self);
    	      }

    	      // Clear the event listener since the duration is now correct.
    	      self._node.removeEventListener('ended', self._endFn, false);
    	    }
    	  };

    	  /** Helper Methods **/
    	  /***************************************************************************/

    	  var cache = {};

    	  /**
    	   * Buffer a sound from URL, Data URI or cache and decode to audio source (Web Audio API).
    	   * @param  {Howl} self
    	   */
    	  var loadBuffer = function(self) {
    	    var url = self._src;

    	    // Check if the buffer has already been cached and use it instead.
    	    if (cache[url]) {
    	      // Set the duration from the cache.
    	      self._duration = cache[url].duration;

    	      // Load the sound into this Howl.
    	      loadSound(self);

    	      return;
    	    }

    	    if (/^data:[^;]+;base64,/.test(url)) {
    	      // Decode the base64 data URI without XHR, since some browsers don't support it.
    	      var data = atob(url.split(',')[1]);
    	      var dataView = new Uint8Array(data.length);
    	      for (var i=0; i<data.length; ++i) {
    	        dataView[i] = data.charCodeAt(i);
    	      }

    	      decodeAudioData(dataView.buffer, self);
    	    } else {
    	      // Load the buffer from the URL.
    	      var xhr = new XMLHttpRequest();
    	      xhr.open(self._xhr.method, url, true);
    	      xhr.withCredentials = self._xhr.withCredentials;
    	      xhr.responseType = 'arraybuffer';

    	      // Apply any custom headers to the request.
    	      if (self._xhr.headers) {
    	        Object.keys(self._xhr.headers).forEach(function(key) {
    	          xhr.setRequestHeader(key, self._xhr.headers[key]);
    	        });
    	      }

    	      xhr.onload = function() {
    	        // Make sure we get a successful response back.
    	        var code = (xhr.status + '')[0];
    	        if (code !== '0' && code !== '2' && code !== '3') {
    	          self._emit('loaderror', null, 'Failed loading audio file with status: ' + xhr.status + '.');
    	          return;
    	        }

    	        decodeAudioData(xhr.response, self);
    	      };
    	      xhr.onerror = function() {
    	        // If there is an error, switch to HTML5 Audio.
    	        if (self._webAudio) {
    	          self._html5 = true;
    	          self._webAudio = false;
    	          self._sounds = [];
    	          delete cache[url];
    	          self.load();
    	        }
    	      };
    	      safeXhrSend(xhr);
    	    }
    	  };

    	  /**
    	   * Send the XHR request wrapped in a try/catch.
    	   * @param  {Object} xhr XHR to send.
    	   */
    	  var safeXhrSend = function(xhr) {
    	    try {
    	      xhr.send();
    	    } catch (e) {
    	      xhr.onerror();
    	    }
    	  };

    	  /**
    	   * Decode audio data from an array buffer.
    	   * @param  {ArrayBuffer} arraybuffer The audio data.
    	   * @param  {Howl}        self
    	   */
    	  var decodeAudioData = function(arraybuffer, self) {
    	    // Fire a load error if something broke.
    	    var error = function() {
    	      self._emit('loaderror', null, 'Decoding audio data failed.');
    	    };

    	    // Load the sound on success.
    	    var success = function(buffer) {
    	      if (buffer && self._sounds.length > 0) {
    	        cache[self._src] = buffer;
    	        loadSound(self, buffer);
    	      } else {
    	        error();
    	      }
    	    };

    	    // Decode the buffer into an audio source.
    	    if (typeof Promise !== 'undefined' && Howler.ctx.decodeAudioData.length === 1) {
    	      Howler.ctx.decodeAudioData(arraybuffer).then(success).catch(error);
    	    } else {
    	      Howler.ctx.decodeAudioData(arraybuffer, success, error);
    	    }
    	  };

    	  /**
    	   * Sound is now loaded, so finish setting everything up and fire the loaded event.
    	   * @param  {Howl} self
    	   * @param  {Object} buffer The decoded buffer sound source.
    	   */
    	  var loadSound = function(self, buffer) {
    	    // Set the duration.
    	    if (buffer && !self._duration) {
    	      self._duration = buffer.duration;
    	    }

    	    // Setup a sprite if none is defined.
    	    if (Object.keys(self._sprite).length === 0) {
    	      self._sprite = {__default: [0, self._duration * 1000]};
    	    }

    	    // Fire the loaded event.
    	    if (self._state !== 'loaded') {
    	      self._state = 'loaded';
    	      self._emit('load');
    	      self._loadQueue();
    	    }
    	  };

    	  /**
    	   * Setup the audio context when available, or switch to HTML5 Audio mode.
    	   */
    	  var setupAudioContext = function() {
    	    // If we have already detected that Web Audio isn't supported, don't run this step again.
    	    if (!Howler.usingWebAudio) {
    	      return;
    	    }

    	    // Check if we are using Web Audio and setup the AudioContext if we are.
    	    try {
    	      if (typeof AudioContext !== 'undefined') {
    	        Howler.ctx = new AudioContext();
    	      } else if (typeof webkitAudioContext !== 'undefined') {
    	        Howler.ctx = new webkitAudioContext();
    	      } else {
    	        Howler.usingWebAudio = false;
    	      }
    	    } catch(e) {
    	      Howler.usingWebAudio = false;
    	    }

    	    // If the audio context creation still failed, set using web audio to false.
    	    if (!Howler.ctx) {
    	      Howler.usingWebAudio = false;
    	    }

    	    // Check if a webview is being used on iOS8 or earlier (rather than the browser).
    	    // If it is, disable Web Audio as it causes crashing.
    	    var iOS = (/iP(hone|od|ad)/.test(Howler._navigator && Howler._navigator.platform));
    	    var appVersion = Howler._navigator && Howler._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
    	    var version = appVersion ? parseInt(appVersion[1], 10) : null;
    	    if (iOS && version && version < 9) {
    	      var safari = /safari/.test(Howler._navigator && Howler._navigator.userAgent.toLowerCase());
    	      if (Howler._navigator && !safari) {
    	        Howler.usingWebAudio = false;
    	      }
    	    }

    	    // Create and expose the master GainNode when using Web Audio (useful for plugins or advanced usage).
    	    if (Howler.usingWebAudio) {
    	      Howler.masterGain = (typeof Howler.ctx.createGain === 'undefined') ? Howler.ctx.createGainNode() : Howler.ctx.createGain();
    	      Howler.masterGain.gain.setValueAtTime(Howler._muted ? 0 : Howler._volume, Howler.ctx.currentTime);
    	      Howler.masterGain.connect(Howler.ctx.destination);
    	    }

    	    // Re-run the setup on Howler.
    	    Howler._setup();
    	  };

    	  // Add support for CommonJS libraries such as browserify.
    	  {
    	    exports.Howler = Howler;
    	    exports.Howl = Howl;
    	  }

    	  // Add to global in Node.js (for testing, etc).
    	  if (typeof commonjsGlobal !== 'undefined') {
    	    commonjsGlobal.HowlerGlobal = HowlerGlobal;
    	    commonjsGlobal.Howler = Howler;
    	    commonjsGlobal.Howl = Howl;
    	    commonjsGlobal.Sound = Sound;
    	  } else if (typeof window !== 'undefined') {  // Define globally in case AMD is not available or unused.
    	    window.HowlerGlobal = HowlerGlobal;
    	    window.Howler = Howler;
    	    window.Howl = Howl;
    	    window.Sound = Sound;
    	  }
    	})();


    	/*!
    	 *  Spatial Plugin - Adds support for stereo and 3D audio where Web Audio is supported.
    	 *  
    	 *  howler.js v2.2.3
    	 *  howlerjs.com
    	 *
    	 *  (c) 2013-2020, James Simpson of GoldFire Studios
    	 *  goldfirestudios.com
    	 *
    	 *  MIT License
    	 */

    	(function() {

    	  // Setup default properties.
    	  HowlerGlobal.prototype._pos = [0, 0, 0];
    	  HowlerGlobal.prototype._orientation = [0, 0, -1, 0, 1, 0];

    	  /** Global Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Helper method to update the stereo panning position of all current Howls.
    	   * Future Howls will not use this value unless explicitly set.
    	   * @param  {Number} pan A value of -1.0 is all the way left and 1.0 is all the way right.
    	   * @return {Howler/Number}     Self or current stereo panning value.
    	   */
    	  HowlerGlobal.prototype.stereo = function(pan) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self.ctx || !self.ctx.listener) {
    	      return self;
    	    }

    	    // Loop through all Howls and update their stereo panning.
    	    for (var i=self._howls.length-1; i>=0; i--) {
    	      self._howls[i].stereo(pan);
    	    }

    	    return self;
    	  };

    	  /**
    	   * Get/set the position of the listener in 3D cartesian space. Sounds using
    	   * 3D position will be relative to the listener's position.
    	   * @param  {Number} x The x-position of the listener.
    	   * @param  {Number} y The y-position of the listener.
    	   * @param  {Number} z The z-position of the listener.
    	   * @return {Howler/Array}   Self or current listener position.
    	   */
    	  HowlerGlobal.prototype.pos = function(x, y, z) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self.ctx || !self.ctx.listener) {
    	      return self;
    	    }

    	    // Set the defaults for optional 'y' & 'z'.
    	    y = (typeof y !== 'number') ? self._pos[1] : y;
    	    z = (typeof z !== 'number') ? self._pos[2] : z;

    	    if (typeof x === 'number') {
    	      self._pos = [x, y, z];

    	      if (typeof self.ctx.listener.positionX !== 'undefined') {
    	        self.ctx.listener.positionX.setTargetAtTime(self._pos[0], Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.positionY.setTargetAtTime(self._pos[1], Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.positionZ.setTargetAtTime(self._pos[2], Howler.ctx.currentTime, 0.1);
    	      } else {
    	        self.ctx.listener.setPosition(self._pos[0], self._pos[1], self._pos[2]);
    	      }
    	    } else {
    	      return self._pos;
    	    }

    	    return self;
    	  };

    	  /**
    	   * Get/set the direction the listener is pointing in the 3D cartesian space.
    	   * A front and up vector must be provided. The front is the direction the
    	   * face of the listener is pointing, and up is the direction the top of the
    	   * listener is pointing. Thus, these values are expected to be at right angles
    	   * from each other.
    	   * @param  {Number} x   The x-orientation of the listener.
    	   * @param  {Number} y   The y-orientation of the listener.
    	   * @param  {Number} z   The z-orientation of the listener.
    	   * @param  {Number} xUp The x-orientation of the top of the listener.
    	   * @param  {Number} yUp The y-orientation of the top of the listener.
    	   * @param  {Number} zUp The z-orientation of the top of the listener.
    	   * @return {Howler/Array}     Returns self or the current orientation vectors.
    	   */
    	  HowlerGlobal.prototype.orientation = function(x, y, z, xUp, yUp, zUp) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self.ctx || !self.ctx.listener) {
    	      return self;
    	    }

    	    // Set the defaults for optional 'y' & 'z'.
    	    var or = self._orientation;
    	    y = (typeof y !== 'number') ? or[1] : y;
    	    z = (typeof z !== 'number') ? or[2] : z;
    	    xUp = (typeof xUp !== 'number') ? or[3] : xUp;
    	    yUp = (typeof yUp !== 'number') ? or[4] : yUp;
    	    zUp = (typeof zUp !== 'number') ? or[5] : zUp;

    	    if (typeof x === 'number') {
    	      self._orientation = [x, y, z, xUp, yUp, zUp];

    	      if (typeof self.ctx.listener.forwardX !== 'undefined') {
    	        self.ctx.listener.forwardX.setTargetAtTime(x, Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.forwardY.setTargetAtTime(y, Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.forwardZ.setTargetAtTime(z, Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.upX.setTargetAtTime(xUp, Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.upY.setTargetAtTime(yUp, Howler.ctx.currentTime, 0.1);
    	        self.ctx.listener.upZ.setTargetAtTime(zUp, Howler.ctx.currentTime, 0.1);
    	      } else {
    	        self.ctx.listener.setOrientation(x, y, z, xUp, yUp, zUp);
    	      }
    	    } else {
    	      return or;
    	    }

    	    return self;
    	  };

    	  /** Group Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Add new properties to the core init.
    	   * @param  {Function} _super Core init method.
    	   * @return {Howl}
    	   */
    	  Howl.prototype.init = (function(_super) {
    	    return function(o) {
    	      var self = this;

    	      // Setup user-defined default properties.
    	      self._orientation = o.orientation || [1, 0, 0];
    	      self._stereo = o.stereo || null;
    	      self._pos = o.pos || null;
    	      self._pannerAttr = {
    	        coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : 360,
    	        coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : 360,
    	        coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : 0,
    	        distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : 'inverse',
    	        maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : 10000,
    	        panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : 'HRTF',
    	        refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : 1,
    	        rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : 1
    	      };

    	      // Setup event listeners.
    	      self._onstereo = o.onstereo ? [{fn: o.onstereo}] : [];
    	      self._onpos = o.onpos ? [{fn: o.onpos}] : [];
    	      self._onorientation = o.onorientation ? [{fn: o.onorientation}] : [];

    	      // Complete initilization with howler.js core's init function.
    	      return _super.call(this, o);
    	    };
    	  })(Howl.prototype.init);

    	  /**
    	   * Get/set the stereo panning of the audio source for this sound or all in the group.
    	   * @param  {Number} pan  A value of -1.0 is all the way left and 1.0 is all the way right.
    	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
    	   * @return {Howl/Number}    Returns self or the current stereo panning value.
    	   */
    	  Howl.prototype.stereo = function(pan, id) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self._webAudio) {
    	      return self;
    	    }

    	    // If the sound hasn't loaded, add it to the load queue to change stereo pan when capable.
    	    if (self._state !== 'loaded') {
    	      self._queue.push({
    	        event: 'stereo',
    	        action: function() {
    	          self.stereo(pan, id);
    	        }
    	      });

    	      return self;
    	    }

    	    // Check for PannerStereoNode support and fallback to PannerNode if it doesn't exist.
    	    var pannerType = (typeof Howler.ctx.createStereoPanner === 'undefined') ? 'spatial' : 'stereo';

    	    // Setup the group's stereo panning if no ID is passed.
    	    if (typeof id === 'undefined') {
    	      // Return the group's stereo panning if no parameters are passed.
    	      if (typeof pan === 'number') {
    	        self._stereo = pan;
    	        self._pos = [pan, 0, 0];
    	      } else {
    	        return self._stereo;
    	      }
    	    }

    	    // Change the streo panning of one or all sounds in group.
    	    var ids = self._getSoundIds(id);
    	    for (var i=0; i<ids.length; i++) {
    	      // Get the sound.
    	      var sound = self._soundById(ids[i]);

    	      if (sound) {
    	        if (typeof pan === 'number') {
    	          sound._stereo = pan;
    	          sound._pos = [pan, 0, 0];

    	          if (sound._node) {
    	            // If we are falling back, make sure the panningModel is equalpower.
    	            sound._pannerAttr.panningModel = 'equalpower';

    	            // Check if there is a panner setup and create a new one if not.
    	            if (!sound._panner || !sound._panner.pan) {
    	              setupPanner(sound, pannerType);
    	            }

    	            if (pannerType === 'spatial') {
    	              if (typeof sound._panner.positionX !== 'undefined') {
    	                sound._panner.positionX.setValueAtTime(pan, Howler.ctx.currentTime);
    	                sound._panner.positionY.setValueAtTime(0, Howler.ctx.currentTime);
    	                sound._panner.positionZ.setValueAtTime(0, Howler.ctx.currentTime);
    	              } else {
    	                sound._panner.setPosition(pan, 0, 0);
    	              }
    	            } else {
    	              sound._panner.pan.setValueAtTime(pan, Howler.ctx.currentTime);
    	            }
    	          }

    	          self._emit('stereo', sound._id);
    	        } else {
    	          return sound._stereo;
    	        }
    	      }
    	    }

    	    return self;
    	  };

    	  /**
    	   * Get/set the 3D spatial position of the audio source for this sound or group relative to the global listener.
    	   * @param  {Number} x  The x-position of the audio source.
    	   * @param  {Number} y  The y-position of the audio source.
    	   * @param  {Number} z  The z-position of the audio source.
    	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
    	   * @return {Howl/Array}    Returns self or the current 3D spatial position: [x, y, z].
    	   */
    	  Howl.prototype.pos = function(x, y, z, id) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self._webAudio) {
    	      return self;
    	    }

    	    // If the sound hasn't loaded, add it to the load queue to change position when capable.
    	    if (self._state !== 'loaded') {
    	      self._queue.push({
    	        event: 'pos',
    	        action: function() {
    	          self.pos(x, y, z, id);
    	        }
    	      });

    	      return self;
    	    }

    	    // Set the defaults for optional 'y' & 'z'.
    	    y = (typeof y !== 'number') ? 0 : y;
    	    z = (typeof z !== 'number') ? -0.5 : z;

    	    // Setup the group's spatial position if no ID is passed.
    	    if (typeof id === 'undefined') {
    	      // Return the group's spatial position if no parameters are passed.
    	      if (typeof x === 'number') {
    	        self._pos = [x, y, z];
    	      } else {
    	        return self._pos;
    	      }
    	    }

    	    // Change the spatial position of one or all sounds in group.
    	    var ids = self._getSoundIds(id);
    	    for (var i=0; i<ids.length; i++) {
    	      // Get the sound.
    	      var sound = self._soundById(ids[i]);

    	      if (sound) {
    	        if (typeof x === 'number') {
    	          sound._pos = [x, y, z];

    	          if (sound._node) {
    	            // Check if there is a panner setup and create a new one if not.
    	            if (!sound._panner || sound._panner.pan) {
    	              setupPanner(sound, 'spatial');
    	            }

    	            if (typeof sound._panner.positionX !== 'undefined') {
    	              sound._panner.positionX.setValueAtTime(x, Howler.ctx.currentTime);
    	              sound._panner.positionY.setValueAtTime(y, Howler.ctx.currentTime);
    	              sound._panner.positionZ.setValueAtTime(z, Howler.ctx.currentTime);
    	            } else {
    	              sound._panner.setPosition(x, y, z);
    	            }
    	          }

    	          self._emit('pos', sound._id);
    	        } else {
    	          return sound._pos;
    	        }
    	      }
    	    }

    	    return self;
    	  };

    	  /**
    	   * Get/set the direction the audio source is pointing in the 3D cartesian coordinate
    	   * space. Depending on how direction the sound is, based on the `cone` attributes,
    	   * a sound pointing away from the listener can be quiet or silent.
    	   * @param  {Number} x  The x-orientation of the source.
    	   * @param  {Number} y  The y-orientation of the source.
    	   * @param  {Number} z  The z-orientation of the source.
    	   * @param  {Number} id (optional) The sound ID. If none is passed, all in group will be updated.
    	   * @return {Howl/Array}    Returns self or the current 3D spatial orientation: [x, y, z].
    	   */
    	  Howl.prototype.orientation = function(x, y, z, id) {
    	    var self = this;

    	    // Stop right here if not using Web Audio.
    	    if (!self._webAudio) {
    	      return self;
    	    }

    	    // If the sound hasn't loaded, add it to the load queue to change orientation when capable.
    	    if (self._state !== 'loaded') {
    	      self._queue.push({
    	        event: 'orientation',
    	        action: function() {
    	          self.orientation(x, y, z, id);
    	        }
    	      });

    	      return self;
    	    }

    	    // Set the defaults for optional 'y' & 'z'.
    	    y = (typeof y !== 'number') ? self._orientation[1] : y;
    	    z = (typeof z !== 'number') ? self._orientation[2] : z;

    	    // Setup the group's spatial orientation if no ID is passed.
    	    if (typeof id === 'undefined') {
    	      // Return the group's spatial orientation if no parameters are passed.
    	      if (typeof x === 'number') {
    	        self._orientation = [x, y, z];
    	      } else {
    	        return self._orientation;
    	      }
    	    }

    	    // Change the spatial orientation of one or all sounds in group.
    	    var ids = self._getSoundIds(id);
    	    for (var i=0; i<ids.length; i++) {
    	      // Get the sound.
    	      var sound = self._soundById(ids[i]);

    	      if (sound) {
    	        if (typeof x === 'number') {
    	          sound._orientation = [x, y, z];

    	          if (sound._node) {
    	            // Check if there is a panner setup and create a new one if not.
    	            if (!sound._panner) {
    	              // Make sure we have a position to setup the node with.
    	              if (!sound._pos) {
    	                sound._pos = self._pos || [0, 0, -0.5];
    	              }

    	              setupPanner(sound, 'spatial');
    	            }

    	            if (typeof sound._panner.orientationX !== 'undefined') {
    	              sound._panner.orientationX.setValueAtTime(x, Howler.ctx.currentTime);
    	              sound._panner.orientationY.setValueAtTime(y, Howler.ctx.currentTime);
    	              sound._panner.orientationZ.setValueAtTime(z, Howler.ctx.currentTime);
    	            } else {
    	              sound._panner.setOrientation(x, y, z);
    	            }
    	          }

    	          self._emit('orientation', sound._id);
    	        } else {
    	          return sound._orientation;
    	        }
    	      }
    	    }

    	    return self;
    	  };

    	  /**
    	   * Get/set the panner node's attributes for a sound or group of sounds.
    	   * This method can optionall take 0, 1 or 2 arguments.
    	   *   pannerAttr() -> Returns the group's values.
    	   *   pannerAttr(id) -> Returns the sound id's values.
    	   *   pannerAttr(o) -> Set's the values of all sounds in this Howl group.
    	   *   pannerAttr(o, id) -> Set's the values of passed sound id.
    	   *
    	   *   Attributes:
    	   *     coneInnerAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
    	   *                      inside of which there will be no volume reduction.
    	   *     coneOuterAngle - (360 by default) A parameter for directional audio sources, this is an angle, in degrees,
    	   *                      outside of which the volume will be reduced to a constant value of `coneOuterGain`.
    	   *     coneOuterGain - (0 by default) A parameter for directional audio sources, this is the gain outside of the
    	   *                     `coneOuterAngle`. It is a linear value in the range `[0, 1]`.
    	   *     distanceModel - ('inverse' by default) Determines algorithm used to reduce volume as audio moves away from
    	   *                     listener. Can be `linear`, `inverse` or `exponential.
    	   *     maxDistance - (10000 by default) The maximum distance between source and listener, after which the volume
    	   *                   will not be reduced any further.
    	   *     refDistance - (1 by default) A reference distance for reducing volume as source moves further from the listener.
    	   *                   This is simply a variable of the distance model and has a different effect depending on which model
    	   *                   is used and the scale of your coordinates. Generally, volume will be equal to 1 at this distance.
    	   *     rolloffFactor - (1 by default) How quickly the volume reduces as source moves from listener. This is simply a
    	   *                     variable of the distance model and can be in the range of `[0, 1]` with `linear` and `[0, ∞]`
    	   *                     with `inverse` and `exponential`.
    	   *     panningModel - ('HRTF' by default) Determines which spatialization algorithm is used to position audio.
    	   *                     Can be `HRTF` or `equalpower`.
    	   *
    	   * @return {Howl/Object} Returns self or current panner attributes.
    	   */
    	  Howl.prototype.pannerAttr = function() {
    	    var self = this;
    	    var args = arguments;
    	    var o, id, sound;

    	    // Stop right here if not using Web Audio.
    	    if (!self._webAudio) {
    	      return self;
    	    }

    	    // Determine the values based on arguments.
    	    if (args.length === 0) {
    	      // Return the group's panner attribute values.
    	      return self._pannerAttr;
    	    } else if (args.length === 1) {
    	      if (typeof args[0] === 'object') {
    	        o = args[0];

    	        // Set the grou's panner attribute values.
    	        if (typeof id === 'undefined') {
    	          if (!o.pannerAttr) {
    	            o.pannerAttr = {
    	              coneInnerAngle: o.coneInnerAngle,
    	              coneOuterAngle: o.coneOuterAngle,
    	              coneOuterGain: o.coneOuterGain,
    	              distanceModel: o.distanceModel,
    	              maxDistance: o.maxDistance,
    	              refDistance: o.refDistance,
    	              rolloffFactor: o.rolloffFactor,
    	              panningModel: o.panningModel
    	            };
    	          }

    	          self._pannerAttr = {
    	            coneInnerAngle: typeof o.pannerAttr.coneInnerAngle !== 'undefined' ? o.pannerAttr.coneInnerAngle : self._coneInnerAngle,
    	            coneOuterAngle: typeof o.pannerAttr.coneOuterAngle !== 'undefined' ? o.pannerAttr.coneOuterAngle : self._coneOuterAngle,
    	            coneOuterGain: typeof o.pannerAttr.coneOuterGain !== 'undefined' ? o.pannerAttr.coneOuterGain : self._coneOuterGain,
    	            distanceModel: typeof o.pannerAttr.distanceModel !== 'undefined' ? o.pannerAttr.distanceModel : self._distanceModel,
    	            maxDistance: typeof o.pannerAttr.maxDistance !== 'undefined' ? o.pannerAttr.maxDistance : self._maxDistance,
    	            refDistance: typeof o.pannerAttr.refDistance !== 'undefined' ? o.pannerAttr.refDistance : self._refDistance,
    	            rolloffFactor: typeof o.pannerAttr.rolloffFactor !== 'undefined' ? o.pannerAttr.rolloffFactor : self._rolloffFactor,
    	            panningModel: typeof o.pannerAttr.panningModel !== 'undefined' ? o.pannerAttr.panningModel : self._panningModel
    	          };
    	        }
    	      } else {
    	        // Return this sound's panner attribute values.
    	        sound = self._soundById(parseInt(args[0], 10));
    	        return sound ? sound._pannerAttr : self._pannerAttr;
    	      }
    	    } else if (args.length === 2) {
    	      o = args[0];
    	      id = parseInt(args[1], 10);
    	    }

    	    // Update the values of the specified sounds.
    	    var ids = self._getSoundIds(id);
    	    for (var i=0; i<ids.length; i++) {
    	      sound = self._soundById(ids[i]);

    	      if (sound) {
    	        // Merge the new values into the sound.
    	        var pa = sound._pannerAttr;
    	        pa = {
    	          coneInnerAngle: typeof o.coneInnerAngle !== 'undefined' ? o.coneInnerAngle : pa.coneInnerAngle,
    	          coneOuterAngle: typeof o.coneOuterAngle !== 'undefined' ? o.coneOuterAngle : pa.coneOuterAngle,
    	          coneOuterGain: typeof o.coneOuterGain !== 'undefined' ? o.coneOuterGain : pa.coneOuterGain,
    	          distanceModel: typeof o.distanceModel !== 'undefined' ? o.distanceModel : pa.distanceModel,
    	          maxDistance: typeof o.maxDistance !== 'undefined' ? o.maxDistance : pa.maxDistance,
    	          refDistance: typeof o.refDistance !== 'undefined' ? o.refDistance : pa.refDistance,
    	          rolloffFactor: typeof o.rolloffFactor !== 'undefined' ? o.rolloffFactor : pa.rolloffFactor,
    	          panningModel: typeof o.panningModel !== 'undefined' ? o.panningModel : pa.panningModel
    	        };

    	        // Update the panner values or create a new panner if none exists.
    	        var panner = sound._panner;
    	        if (panner) {
    	          panner.coneInnerAngle = pa.coneInnerAngle;
    	          panner.coneOuterAngle = pa.coneOuterAngle;
    	          panner.coneOuterGain = pa.coneOuterGain;
    	          panner.distanceModel = pa.distanceModel;
    	          panner.maxDistance = pa.maxDistance;
    	          panner.refDistance = pa.refDistance;
    	          panner.rolloffFactor = pa.rolloffFactor;
    	          panner.panningModel = pa.panningModel;
    	        } else {
    	          // Make sure we have a position to setup the node with.
    	          if (!sound._pos) {
    	            sound._pos = self._pos || [0, 0, -0.5];
    	          }

    	          // Create a new panner node.
    	          setupPanner(sound, 'spatial');
    	        }
    	      }
    	    }

    	    return self;
    	  };

    	  /** Single Sound Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Add new properties to the core Sound init.
    	   * @param  {Function} _super Core Sound init method.
    	   * @return {Sound}
    	   */
    	  Sound.prototype.init = (function(_super) {
    	    return function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Setup user-defined default properties.
    	      self._orientation = parent._orientation;
    	      self._stereo = parent._stereo;
    	      self._pos = parent._pos;
    	      self._pannerAttr = parent._pannerAttr;

    	      // Complete initilization with howler.js core Sound's init function.
    	      _super.call(this);

    	      // If a stereo or position was specified, set it up.
    	      if (self._stereo) {
    	        parent.stereo(self._stereo);
    	      } else if (self._pos) {
    	        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
    	      }
    	    };
    	  })(Sound.prototype.init);

    	  /**
    	   * Override the Sound.reset method to clean up properties from the spatial plugin.
    	   * @param  {Function} _super Sound reset method.
    	   * @return {Sound}
    	   */
    	  Sound.prototype.reset = (function(_super) {
    	    return function() {
    	      var self = this;
    	      var parent = self._parent;

    	      // Reset all spatial plugin properties on this sound.
    	      self._orientation = parent._orientation;
    	      self._stereo = parent._stereo;
    	      self._pos = parent._pos;
    	      self._pannerAttr = parent._pannerAttr;

    	      // If a stereo or position was specified, set it up.
    	      if (self._stereo) {
    	        parent.stereo(self._stereo);
    	      } else if (self._pos) {
    	        parent.pos(self._pos[0], self._pos[1], self._pos[2], self._id);
    	      } else if (self._panner) {
    	        // Disconnect the panner.
    	        self._panner.disconnect(0);
    	        self._panner = undefined;
    	        parent._refreshBuffer(self);
    	      }

    	      // Complete resetting of the sound.
    	      return _super.call(this);
    	    };
    	  })(Sound.prototype.reset);

    	  /** Helper Methods **/
    	  /***************************************************************************/

    	  /**
    	   * Create a new panner node and save it on the sound.
    	   * @param  {Sound} sound Specific sound to setup panning on.
    	   * @param {String} type Type of panner to create: 'stereo' or 'spatial'.
    	   */
    	  var setupPanner = function(sound, type) {
    	    type = type || 'spatial';

    	    // Create the new panner node.
    	    if (type === 'spatial') {
    	      sound._panner = Howler.ctx.createPanner();
    	      sound._panner.coneInnerAngle = sound._pannerAttr.coneInnerAngle;
    	      sound._panner.coneOuterAngle = sound._pannerAttr.coneOuterAngle;
    	      sound._panner.coneOuterGain = sound._pannerAttr.coneOuterGain;
    	      sound._panner.distanceModel = sound._pannerAttr.distanceModel;
    	      sound._panner.maxDistance = sound._pannerAttr.maxDistance;
    	      sound._panner.refDistance = sound._pannerAttr.refDistance;
    	      sound._panner.rolloffFactor = sound._pannerAttr.rolloffFactor;
    	      sound._panner.panningModel = sound._pannerAttr.panningModel;

    	      if (typeof sound._panner.positionX !== 'undefined') {
    	        sound._panner.positionX.setValueAtTime(sound._pos[0], Howler.ctx.currentTime);
    	        sound._panner.positionY.setValueAtTime(sound._pos[1], Howler.ctx.currentTime);
    	        sound._panner.positionZ.setValueAtTime(sound._pos[2], Howler.ctx.currentTime);
    	      } else {
    	        sound._panner.setPosition(sound._pos[0], sound._pos[1], sound._pos[2]);
    	      }

    	      if (typeof sound._panner.orientationX !== 'undefined') {
    	        sound._panner.orientationX.setValueAtTime(sound._orientation[0], Howler.ctx.currentTime);
    	        sound._panner.orientationY.setValueAtTime(sound._orientation[1], Howler.ctx.currentTime);
    	        sound._panner.orientationZ.setValueAtTime(sound._orientation[2], Howler.ctx.currentTime);
    	      } else {
    	        sound._panner.setOrientation(sound._orientation[0], sound._orientation[1], sound._orientation[2]);
    	      }
    	    } else {
    	      sound._panner = Howler.ctx.createStereoPanner();
    	      sound._panner.pan.setValueAtTime(sound._stereo, Howler.ctx.currentTime);
    	    }

    	    sound._panner.connect(sound._node);

    	    // Update the connections.
    	    if (!sound._paused) {
    	      sound._parent.pause(sound._id, true).play(sound._id, true);
    	    }
    	  };
    	})(); 
    } (howler));

    class HowlerPlugin {
        static init(options) {
            // Set default
            options = Object.assign({
                sounds: []
            }, options);
            Object.defineProperty(this, 'sound', {
                set(sound) {
                    this._sound = sound;
                },
                get() {
                    return this._sound;
                },
            });
            // extend howler
            howler.Howler.sounds = {};
            howler.Howler.add = function (name, option) {
                const sound = new howler.Howl(option);
                this.sounds[name] = sound;
                return sound;
            };
            howler.Howler.get = function (name) {
                return this.sounds[name];
            };
            howler.Howler.has = function (name) {
                return this.sounds[name] !== undefined;
            };
            howler.Howler.destroy = function () {
                this.unload();
            };
            this._sound = null;
            this.sound = howler.Howler;
            if (options.sounds) {
                const keys = Object.keys(options.sounds);
                keys.forEach((s) => {
                    howler.Howler.add(s, options.sounds[s]);
                });
            }
        }
        static destroy() {
            if (this._sound) {
                this._sound.destroy();
            }
        }
    }
    /** @ignore */
    HowlerPlugin.extension = PIXI__namespace.ExtensionType.Application;
    PIXI__namespace.extensions.add(HowlerPlugin);

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
            if (scene !== null) {
                if (!scene.isBooted) {
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
                else {
                    if (scene.isSleeping) {
                        this.wakeup(key);
                    }
                    if (!scene.isActive) {
                        this.resume(key);
                    }
                }
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
        HowlerPlugin: HowlerPlugin,
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
            this.alpha = 0.5;
            this.setState('disable');
        }
        enabled() {
            this.eventMode = 'dynamic';
            this._isDisabled = false;
            this.alpha = 1;
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
            this.isLocked = false;
            this._bet = 0;
            this._reserved = 0;
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
            back.position.set(165, -80);
            this.addChild(back);
            this._betText = new PIXI__namespace.Text('', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 16
            });
            this._betText.anchor.set(0.5);
            this._betText.position.set(50, 15);
            back.addChild(this._betText);
            this._reservedText = new PIXI__namespace.Text('', {
                fontFamily: 'Bungee Regular',
                fill: '#31cac6',
                fontSize: 16
            });
            this._reservedText.anchor.set(0.5);
            this._reservedText.position.set(80, 15);
            back.addChild(this._reservedText);
            const clearBtn = new SpriteButton({
                texture: 'buttons/clean',
                up: '#ffffff',
                enter: '#dddddd',
                down: '#aaaaaa',
                disable: '#555555',
                type: 'tint'
            });
            clearBtn.name = 'BET CLEAR BUTTON';
            clearBtn.position.set(135, -140);
            clearBtn.scale.set(0.5);
            clearBtn.anchor.set(0.5);
            this.addChild(clearBtn);
            clearBtn.onclick = clearBtn.ontap = () => {
                if (this.isLocked === false) {
                    this.scene.game.sound.get('button').play();
                    this.clear();
                }
            };
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
            this.sync();
            this.scene.game.data.on('changedata', this.onBalanceChange, this);
        }
        sync() {
            // sync bet
            this.bet = this.scene.game.data.get('bet', 0);
            this.reserved = this.scene.game.data.get('reserved', 0);
            // sync chips
            const dbChips = this.scene.game.data.get('chips', []);
            if (Array.isArray(dbChips)) {
                dbChips.forEach((c) => {
                    this.playIncreaseChipAnim(c, true);
                });
            }
            this.checkChips();
        }
        reset() {
            this.isLocked = false;
            this.clear(true);
        }
        clear(hard = false, direction = 'down') {
            if (this.isLocked === false) {
                const len = this._usedChips.length - 1;
                for (let i = len; i >= 0; i--) {
                    if (hard) {
                        this.playDecreaseAnim(i, true, 0, direction);
                    }
                    else if ((len - i) <= 5) {
                        this.playDecreaseAnim(i, false, 100 * (len - i), direction);
                    }
                    else {
                        this.playDecreaseAnim(i, true, 0, direction);
                    }
                }
                this.scene.game.data.set('chips', []);
                this.bet = 0;
                this.checkChips();
            }
        }
        reserve() {
            if (this.isLocked === false) {
                this.reserved = this.bet;
                this.clear(false, 'up');
            }
        }
        onBalanceChange(key) {
            if (key === 'balance') {
                this.checkChips();
            }
        }
        checkChips() {
            const balance = this.scene.game.data.get('balance', 0) - this.bet;
            for (const chipValue in this._mainChips) {
                if (Object.prototype.hasOwnProperty.call(this._mainChips, chipValue)) {
                    const chip = this._mainChips[chipValue];
                    if (parseInt(chipValue) > balance) {
                        chip.disabled();
                    }
                    else {
                        chip.enabled();
                    }
                }
            }
        }
        increase(chip) {
            if (this.isLocked === false) {
                const keys = Object.keys(this._chips);
                const balance = this.scene.game.data.get('balance', 0);
                if (keys.indexOf(chip.toString()) > -1) {
                    if (balance >= this._bet + chip) {
                        this.bet += chip;
                        this.checkChips();
                        const dbChips = this.scene.game.data.get('chips', []);
                        dbChips.push(chip);
                        this.scene.game.data.set('chips', dbChips).save();
                        this.playIncreaseChipAnim(chip);
                    }
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
                to: { x: 180, y: -175 },
                duration: skipAnim ? 10 : 300,
                easing: TWEEN__namespace.Easing.generatePow(3).Out,
                onStart: (target) => {
                    this.scene.game.sound.get('chip').play();
                    target.eventMode = 'none';
                },
                onComplete: (target) => {
                    target.enabled();
                }
            });
        }
        decrease(chip, usedIndex) {
            if (this.isLocked === false) {
                const keys = Object.keys(this._chips);
                if (keys.indexOf(chip.toString()) > -1) {
                    if (this._bet >= chip) {
                        this.bet -= chip;
                        this.checkChips();
                        const dbChips = this.scene.game.data.get('chips', []);
                        dbChips.splice(dbChips.lastIndexOf(chip), 1);
                        this.scene.game.data.set('chips', dbChips).save();
                        this.playDecreaseAnim(usedIndex);
                    }
                }
            }
        }
        playDecreaseAnim(usedIndex, skipAnim = false, delay = 0, direction = 'down') {
            // get new chip from pool
            const chipMember = this._usedChips[usedIndex];
            if (chipMember) {
                this._usedChips.splice(usedIndex, 1);
                this.scene.tween.add({
                    target: chipMember.data,
                    to: { y: direction === 'down' ? 150 : -300 },
                    delay,
                    duration: skipAnim ? 10 : 300,
                    easing: TWEEN__namespace.Easing.generatePow(3).In,
                    onStart: (target) => {
                        this.scene.game.sound.get('chip').play();
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
            this.scene.game.data.save();
            this._betText.text = `${this._bet.toString()} €`;
        }
        get reserved() {
            return this._reserved;
        }
        set reserved(value) {
            this._reserved = value;
            this.scene.game.data.set('reserved', value);
            this.scene.game.data;
            this._reservedText.text = `${this._reserved.toString()} €`;
            this._reservedText.visible = value > 0;
            this._betText.x = value > 0 ? 20 : 50;
        }
    }

    class Card extends PIXI__namespace.Container {
        constructor(options) {
            super();
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
            this.isLocked = false;
            this.pCards = [];
            this.dCards = [];
            this.copies = [];
            this._cards = [];
            this._usedCards = [];
            // needed for tween animation
            this.scene = scene;
            this.name = 'DECK VIEW';
            // dealer card container
            this._dCardsC = new PIXI__namespace.Container();
            this._dCardsC.name = 'DEALER CARDS';
            this._dCardsC.position.set(88, -20);
            this._dCardsC.scale.set(0.5);
            this.addChild(this._dCardsC);
            // player card container
            this._pCardsC = new PIXI__namespace.Container();
            this._pCardsC.name = 'PLAYER CARDS';
            this._pCardsC.position.set(88, 140);
            this._pCardsC.scale.set(0.75);
            this.addChild(this._pCardsC);
            this._options = options;
            this._cardPool = new ObjectPool(this.newCard, this.resetCard, 8);
            // fill cards
            const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
            const cardSubtypes = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
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
                    this._cards.push({ back: defaultBack, ...cardTexture, type, subType, owner: null });
                });
            });
            // shuffle card below
            this._cardBelow = new PIXI__namespace.Sprite(PIXI__namespace.Texture.from(defaultBack));
            this._cardBelow.anchor.set(0.5);
            this._cardBelow.position.set(100, 60);
            this._cardBelow.zIndex = 10;
            this._cardBelow.visible = false;
            this.addChild(this._cardBelow);
            // shuffle card above
            this._cardAbove = new PIXI__namespace.Sprite(PIXI__namespace.Texture.from(defaultBack));
            this._cardAbove.anchor.set(0.5);
            this._cardAbove.position.set(100, 60);
            this._cardAbove.zIndex = 20;
            this._cardAbove.visible = false;
            this.addChild(this._cardAbove);
            this.sync();
        }
        sync() {
            // sync variables
            const dbDCards = this.scene.game.data.get('dealer', []);
            const dbPCards = this.scene.game.data.get('player', []);
            if (dbDCards.length > 0 || dbPCards.length > 0) {
                this.copies = this.scene.game.data.get('deck', []);
                const cards = dbDCards.concat(dbPCards);
                const pLen = dbPCards.length - 1;
                const dLen = dbDCards.length - 1;
                let pConter = 0;
                let dCounter = 0;
                cards.forEach((c) => {
                    const isVisible = c.isVisible;
                    const owner = c.owner;
                    const cIndex = c.cIndex;
                    const options = this._cards[cIndex];
                    const card = this._cardPool.get();
                    card.data.create(options);
                    card.data.pivot.set(100);
                    card.data.owner = owner;
                    isVisible ? card.data.open() : card.data.close();
                    this._usedCards.push(card);
                    if (owner === 'dealer') {
                        this._dCardsC.addChild(card.data);
                        this.dCards.push(card.data);
                        card.data.x = (dLen - dCounter++) * -40;
                        if (card.data.x < -320)
                            card.data.x = -320;
                    }
                    else {
                        this._pCardsC.addChild(card.data);
                        this.pCards.push(card.data);
                        card.data.x = (pLen - pConter++) * -45;
                        if (card.data.x < -180)
                            card.data.x = -180;
                    }
                });
            }
            else {
                this.shuffle();
            }
        }
        reset() {
            this.isLocked = false;
            this.relase(true);
        }
        shuffle(playAnim = false, callback = null, context = null) {
            this.copies = [...this._cards];
            this.scene.game.data.set('deck', [...this.copies]).save();
            if (playAnim) {
                this.playShuffleAnim(callback, context);
            }
            else if (callback) {
                callback.call(context);
            }
        }
        playShuffleAnim(callback = null, context = null) {
            // card above
            this.scene.tween.add({
                target: this._cardAbove,
                to: { x: 170 },
                duration: 300,
                yoyo: true,
                repeat: 9,
                easing: TWEEN__namespace.Easing.generatePow(2).Out,
                onStart: () => {
                    this._cardAbove.visible = true;
                },
                onRepeat: () => {
                    this._cardAbove.zIndex = this._cardAbove.zIndex === 20 ? 10 : 20;
                    this.sortableChildren = true;
                },
                onComplete: () => {
                    this.scene.tween.add({
                        target: this._cardAbove,
                        to: { angle: -30 },
                        duration: 300,
                        delay: 150,
                        onComplete: () => {
                            this.scene.tween.add({
                                target: this._cardAbove,
                                to: { x: 295, y: -80, alpha: 0, scale: { x: 0.5, y: 0.5 } },
                                duration: 1000,
                                delay: 250,
                                easing: TWEEN__namespace.Easing.generatePow(2).Out,
                                onComplete: () => {
                                    this._cardAbove.position.set(100, 60);
                                    this._cardAbove.angle = 0;
                                    this._cardAbove.alpha = 1;
                                    this._cardAbove.scale.set(1);
                                    this._cardAbove.zIndex = 20;
                                    this._cardAbove.visible = false;
                                }
                            });
                        }
                    });
                }
            });
            // card below
            this.scene.tween.add({
                target: this._cardBelow,
                to: { x: 30 },
                duration: 300,
                yoyo: true,
                repeat: 9,
                easing: TWEEN__namespace.Easing.generatePow(2).Out,
                onStart: () => {
                    this._cardBelow.visible = true;
                },
                onRepeat: () => {
                    this._cardBelow.zIndex = this._cardBelow.zIndex === 20 ? 10 : 20;
                    this.sortableChildren = true;
                },
                onComplete: () => {
                    this.scene.tween.add({
                        target: this._cardBelow,
                        to: { angle: -30 },
                        duration: 300,
                        delay: 300,
                        onComplete: () => {
                            this.scene.tween.add({
                                target: this._cardBelow,
                                to: { x: 295, y: -80, alpha: 0, scale: { x: 0.5, y: 0.5 } },
                                duration: 1000,
                                delay: 250,
                                easing: TWEEN__namespace.Easing.generatePow(2).Out,
                                onComplete: () => {
                                    this._cardBelow.position.set(100, 60);
                                    this._cardBelow.angle = 0;
                                    this._cardBelow.alpha = 1;
                                    this._cardBelow.scale.set(1);
                                    this._cardBelow.zIndex = 10;
                                    this._cardBelow.visible = false;
                                    this.sortableChildren = true;
                                    if (callback) {
                                        callback.call(context);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
        initial(callback = null, context = null) {
            if (this.isLocked === false) {
                this.hit(1, 'dealer', true, () => {
                    this.hit(1, 'player', true, () => {
                        this.hit(1, 'dealer', false, () => {
                            this.hit(1, 'player', true, callback, context);
                        }, this);
                    }, this);
                }, this);
            }
        }
        hit(count = 1, type, isOpened = true, callback = null, context = null) {
            if (this.isLocked === false) {
                const cards = [];
                const cardTypes = ['clubs', 'spades', 'diamonds', 'hearts'];
                const cardSubtypes = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'];
                count = Math.min(count, this.copies.length);
                for (let i = 0; i < count; i++) {
                    let randomIndex = RandomNumber(0, this.copies.length - 1);
                    const cardOptions = this.copies[randomIndex];
                    const card = this._cardPool.get();
                    card.data.create(cardOptions);
                    card.data.alpha = 0;
                    card.data.position.set(type === 'dealer' ? 380 : 235, type === 'dealer' ? -80 : -260);
                    card.data.angle = -30;
                    card.data.pivot.set(100);
                    card.data.owner = type;
                    cards.push(card);
                    isOpened ? card.data.open() : card.data.close();
                    type === 'dealer' ? this._dCardsC.addChild(card.data) : this._pCardsC.addChild(card.data);
                    type === 'dealer' ? this.dCards.push(card.data) : this.pCards.push(card.data);
                    const dbCards = this.scene.game.data.get(`${type}`, []);
                    dbCards.push({
                        owner: type,
                        type: card.data.type,
                        subType: card.data.subType,
                        isVisible: card.data.isVisible,
                        cIndex: cardSubtypes.indexOf(card.data.subType) + (cardTypes.indexOf(card.data.type) * 13)
                    });
                    this.scene.game.data.set(`${type}`, dbCards).save();
                    // remove card from deck
                    this.copies.splice(randomIndex, 1);
                    this.scene.game.data.set('deck', [...this.copies]).save();
                    // card animation
                    const gap = type === 'dealer' ? 40 : 45;
                    const limitX = type === 'dealer' ? -320 : -180;
                    const alpha = 1;
                    const angle = -360;
                    this.scene.tween.add({
                        target: card.data,
                        to: { x: 0, y: 0, angle, alpha },
                        delay: 250 * (i + 1),
                        duration: 300,
                        onStart: () => {
                            this.scene.game.sound.get('card-pick').play();
                        },
                        onComplete: (obj) => {
                            const container = obj.owner === 'dealer' ? this._dCardsC : this._pCardsC;
                            const children = [...container.children];
                            children.splice(children.indexOf(obj), 1);
                            children.forEach((c) => {
                                if (c.x >= limitX)
                                    c.x -= gap;
                            });
                            if (callback) {
                                callback.call(context);
                            }
                        }
                    });
                }
                this._usedCards.push(...cards);
                return cards;
            }
            return null;
        }
        relase(skipAnim = false) {
            if (this.isLocked === false) {
                // move dealer container
                this.scene.tween.add({
                    target: this._dCardsC,
                    to: { x: -200, alpha: 0 },
                    duration: skipAnim ? 10 : 1000,
                    easing: TWEEN__namespace.Easing.Back.In,
                    onComplete: () => {
                        this.scene.game.data.set('dealer', []).save();
                    }
                });
                // move player container
                this.scene.tween.add({
                    target: this._pCardsC,
                    to: { x: -200, alpha: 0 },
                    duration: skipAnim ? 10 : 1000,
                    delay: skipAnim ? 0 : 100,
                    easing: TWEEN__namespace.Easing.Back.In,
                    onComplete: () => {
                        this.scene.game.data.set('player', []).save();
                        this._usedCards.forEach((card) => {
                            this._cardPool.release(card);
                        });
                        this._usedCards.length = 0;
                        this._dCardsC.removeChildren();
                        this._dCardsC.position.set(88, -20);
                        this._dCardsC.alpha = 1;
                        this._pCardsC.removeChildren();
                        this._pCardsC.position.set(88, 140);
                        this._pCardsC.alpha = 1;
                    }
                });
                // reset variables
                this.pCards.length = 0;
                this.dCards.length = 0;
            }
        }
        newCard() {
            return new Card({ back: 'EMPTY', front: 'EMPTY', type: null, subType: null, owner: null });
        }
        resetCard(card) {
            card.reset();
            return card;
        }
        // getter and setter
        get remains() {
            return this.copies.length;
        }
    }

    class Wallet extends PIXI__namespace.Container {
        constructor(scene) {
            super();
            this.isLocked = false;
            this._total = 0;
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
            this._totalText = new PIXI__namespace.Text(`${this._total} €`, {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 16
            });
            //this._totalText.anchor.set(0, 0.5);
            this._totalText.position.set(40, 5);
            this.addChild(this._totalText);
            // total text
            this._amountText = new PIXI__namespace.Text('', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 16,
                align: 'right'
            });
            this._amountText.position.set(150, 5);
            this.addChild(this._amountText);
            this.sync();
        }
        sync() {
            this.isLocked = false;
            // sync money
            this._total = this.scene.game.data.get('balance', 1000);
            this._totalText.text = `${this._total} €`;
        }
        reset() {
            this.resetTweens();
            this._total = 0;
            this._totalText.text = `${this._total} €`;
        }
        resetTweens() {
            if (this._valueTween && this._valueTween.isPlaying) {
                this._valueTween.end();
                this.scene.tween.remove(this._valueTween);
            }
            if (this._amountTween && this._amountTween.isPlaying) {
                this._amountTween.end();
                this.scene.tween.remove(this._amountTween);
            }
            this._amountText.text = '';
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
        deposit(value, skipAnim = false) {
            if (this.isLocked === false) {
                this.playAnim(this.total + value, skipAnim);
                if (!skipAnim) {
                    this.playCoinAnim(value);
                }
                this._total += value;
                this.scene.game.data.set('balance', this._total).save();
            }
        }
        withdraw(value, skipAnim = false) {
            if (this.isLocked || value > this.total)
                return false;
            this.playAnim(this.total - value, skipAnim);
            this._total -= value;
            this.scene.game.data.set('balance', this._total).save();
            return true;
        }
        playAnim(totalValue, skipAnim = false) {
            this.resetTweens();
            const counter = { value: this.total };
            const amount = totalValue - this.total;
            let count = Math.abs(Math.round(amount / 10));
            count = Math.min(count, 10);
            this._amountText.style.fill = amount > 0 ? '#ffd700' : '#c00707';
            this._amountText.text = amount.toString();
            this._valueTween = this.scene.tween.add({
                target: counter,
                to: { value: totalValue },
                duration: skipAnim ? 10 : count * 300,
                delay: 250,
                onUpdate: (obj) => {
                    this._totalText.text = `${Math.round(obj.value).toString()} €`;
                }
            });
            this._amountTween = this.scene.tween.add({
                target: { value: amount },
                to: { value: 0 },
                duration: skipAnim ? 10 : count * 300,
                delay: 250,
                onUpdate: (obj) => {
                    this._amountText.text = `${Math.round(obj.value).toString()}`;
                },
                onComplete: () => {
                    this._amountText.text = '';
                }
            });
        }
        playCoinAnim(value) {
            const coinCount = Math.min(value, 20);
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
                        this.scene.game.sound.get('coin').play();
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
        SpriteButton: SpriteButton,
        Wallet: Wallet
    });

    class BackgroundScene extends Scene {
        create() {
            const music = this.game.data.get('music', false);
            this._music = this.game.sound.get('main-music');
            this._music.volume(0.5);
            this._music.loop(true);
            if (music === true) {
                this.game.sound.get('main-music').play();
                this._musicButton.texture = PIXI__namespace.Texture.from('buttons/music_on');
            }
            this._musicButton.onclick = this._musicButton.ontap = this.onMuteClick.bind(this);
        }
        // settings click
        onMuteClick() {
            const music = this.game.data.get('music', false);
            if (music === true) {
                this._music.pause();
                this._musicButton.texture = PIXI__namespace.Texture.from('buttons/music_off');
            }
            else {
                this._music.play();
                this._musicButton.texture = PIXI__namespace.Texture.from('buttons/music_on');
            }
            this.game.data.set('music', !music).save();
        }
    }

    class GameScene extends Scene {
        constructor() {
            super(...arguments);
            this._sessionID = 0;
            this._pScores = [0];
            this._dScores = [0];
        }
        init() {
            this._sessionID = this.game.data.get('sessionID', -1);
            this.on('wokeup', this.onWokeUp, this);
        }
        create() {
            // get game config
            const config = PIXI__namespace.Cache.get('blackjack');
            // dealer score
            const dText = new PIXI__namespace.Graphics();
            dText.name = 'DEALER SCORE';
            dText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
            dText.position.set(620, 200);
            this.addChild(dText);
            this._dScoreText = new PIXI__namespace.Text('0', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 12,
                align: 'center'
            });
            this._dScoreText.anchor.set(0.5);
            this._dScoreText.position.set(25, 9);
            dText.addChild(this._dScoreText);
            // player score
            const pText = new PIXI__namespace.Graphics();
            pText.name = 'PLAYER SCORE';
            pText.beginFill('#1e1e1e', .5).drawRoundedRect(0, 0, 50, 20, 4).endFill();
            pText.position.set(620, 380);
            this.addChild(pText);
            this._pScoreText = new PIXI__namespace.Text('0', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 12,
                align: 'center'
            });
            this._pScoreText.anchor.set(0.5);
            this._pScoreText.position.set(25, 9);
            pText.addChild(this._pScoreText);
            // set home button function
            this._homeButton.onclick = this._homeButton.ontap = this.onHomeClick.bind(this);
            // create bet panel
            this._betP = new BetPanel(this, config.chips);
            this._betP.position.set(425, 600);
            this.addChild(this._betP);
            this._deck = new Deck(this, config.deck);
            this._deck.position.set(550, 170);
            this.addChild(this._deck);
            this._dealButton.onclick = this._dealButton.ontap = this.onDeal.bind(this);
            this._hitButton.onclick = this._hitButton.ontap = this.onHit.bind(this);
            this._standButton.onclick = this._standButton.ontap = this.onStand.bind(this);
            // black background
            this._blackBack = new PIXI__namespace.Graphics();
            this._blackBack.visible = false;
            this._blackBack.alpha = 0;
            this._blackBack.name = 'BLACK BACKGROUND';
            this._blackBack.beginFill('#000000', .7).lineStyle({ width: 5 }).drawRect(0, 0, 1280, 720).endFill();
            this._blackBack.eventMode = 'dynamic';
            this.addChild(this._blackBack);
            // create wallet
            this._wallet = new Wallet(this);
            this._wallet.position.set(425, 70);
            this.addChild(this._wallet);
            // result text
            this._resultText = new PIXI__namespace.Text('PUSH', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 100,
                align: 'center',
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: 400
            });
            this._resultText.name = 'RESULT TEXT';
            this._resultText.visible = false;
            this._resultText.alpha = 0;
            this._resultText.scale.set(0);
            this._resultText.anchor.set(0.5);
            this._resultText.position.set(640, 360);
            this.addChild(this._resultText);
            // popup
            this._popup = new PIXI__namespace.Graphics();
            this._popup.visible = false;
            this._popup.alpha = 0;
            this._popup.name = 'POPUP BACKGROUND';
            this._popup.beginFill('#000000', 1).lineStyle({ width: 5 }).drawRoundedRect(0, 0, 300, 200, 10).endFill();
            this._popup.position.set(490, 140);
            this.addChild(this._popup);
            // popup text
            const popupText = new PIXI__namespace.Text('Not enough money!', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 24,
                align: 'center',
                wordWrap: true,
                breakWords: true,
                wordWrapWidth: 250
            });
            popupText.position.set(70, 50);
            this._popup.addChild(popupText);
            // popup deposit button
            const depositBtn = new SpriteButton({
                texture: 'buttons/start',
                up: '#ffffff',
                enter: '#dddddd',
                down: '#aaaaaa',
                disable: '#555555',
                type: 'tint'
            });
            depositBtn.anchor.set(0.5);
            depositBtn.scale.set(0.35);
            depositBtn.position.set(60, 165);
            const deposit1000 = new PIXI__namespace.Text('+1000 €', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 40,
                align: 'center'
            });
            deposit1000.position.set(-88, -22);
            depositBtn.onclick = depositBtn.ontap = () => {
                this.game.sound.get('button').play();
                this._wallet.deposit(1000);
                this.setState('deal');
                this.closePopup();
            };
            depositBtn.addChild(deposit1000);
            this._popup.addChild(depositBtn);
            // popup reset button
            const resetBtn = new SpriteButton({
                texture: 'buttons/stand',
                up: '#ffffff',
                enter: '#dddddd',
                down: '#aaaaaa',
                disable: '#555555',
                type: 'tint'
            });
            resetBtn.anchor.set(0.5);
            resetBtn.scale.set(0.35);
            resetBtn.position.set(150, 165);
            const resetText = new PIXI__namespace.Text('RESET', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 40,
                align: 'center'
            });
            resetText.position.set(-88, -22);
            resetBtn.onclick = resetBtn.ontap = () => {
                this.game.sound.get('button').play();
                this.closePopup();
                this.game.data.clear(true);
                this.game.scene.start('MenuScene');
                this.game.scene.sleep(this.key);
            };
            resetBtn.addChild(resetText);
            this._popup.addChild(resetBtn);
            // popup cancel button
            const cancelBtn = new SpriteButton({
                texture: 'buttons/hit',
                up: '#ffffff',
                enter: '#dddddd',
                down: '#aaaaaa',
                disable: '#555555',
                type: 'tint'
            });
            cancelBtn.anchor.set(0.5);
            cancelBtn.scale.set(0.35);
            cancelBtn.position.set(240, 165);
            const cancelText = new PIXI__namespace.Text('CANCEL', {
                fontFamily: 'Bungee Regular',
                fill: '#ffffff',
                fontSize: 40,
                align: 'center'
            });
            cancelText.position.set(-88, -22);
            cancelBtn.onclick = cancelBtn.ontap = () => {
                this.game.sound.get('button').play();
                this.closePopup();
            };
            cancelBtn.addChild(cancelText);
            this._popup.addChild(cancelBtn);
            // sync game
            this.setState(this.game.data.get('state', 'deal'));
        }
        showPopup() {
            this._blackBack.visible = true;
            this._blackBack.alpha = 1;
            this._popup.visible = true;
            this._popup.alpha = 1;
        }
        closePopup() {
            this._blackBack.visible = false;
            this._blackBack.alpha = 0;
            this._popup.visible = false;
            this._popup.alpha = 0;
        }
        calculateScore(cards) {
            // reset dealer values
            let score = 0;
            let aces = 0;
            // calculate card values
            cards.forEach((card) => {
                if (card.isVisible === false)
                    return;
                if (['k', 'q', 'j'].indexOf(card.subType) > -1) {
                    score += 10;
                }
                else if (card.subType === 'a') {
                    score += 11;
                    aces++;
                }
                else {
                    score += parseInt(card.subType);
                }
            });
            let tScore = [score];
            // check ace values
            for (let j = 0; j < aces; j++) {
                tScore.push(score - (10 * (j + 1)));
            }
            // filter values
            const lower21 = tScore.filter(s => s <= 21);
            // update scores
            return lower21.length > 0 ? [...lower21] : [Math.min(...tScore)];
        }
        checkCards() {
            const state = this.game.data.get('state', 'deal');
            if (state === 'hit') {
                // update scores
                this._pScores = this.calculateScore(this.game.data.get('player', []));
                // update texts
                this._pScoreText.text = this._pScores.toString().replace(',', '/');
                this.checkResult();
            }
            if (state === 'stand' || state === 'hit') {
                // update scores
                this._dScores = this.calculateScore(this.game.data.get('dealer', []));
                // update texts
                this._dScoreText.text = this._dScores.toString().replace(',', '/');
                this.checkResult();
            }
        }
        checkResult() {
            const state = this.game.data.get('state', 'deal');
            if (state === 'hit') {
                for (let i = 0; i < this._pScores.length; i++) {
                    if (this._pScores[i] >= 21) {
                        this._pScores = [this._pScores[i]];
                        this.checkAdditionBet();
                        break;
                    }
                }
            }
            else if (state === 'stand') {
                let isOver = false;
                for (let i = 0; i < this._dScores.length; i++) {
                    if (this._dScores[i] > 21
                        || (this._dScores[i] >= this._pScores[0] && this._dScores[i] <= 21)
                        || (this._pScores[0] >= 21 && this._dScores[i] <= 21)) {
                        this._dScores = [this._dScores[i]];
                        this.setState('finished');
                        isOver = true;
                        break;
                    }
                }
                if (!isOver)
                    this.playForDealer();
            }
        }
        checkAdditionBet() {
            if (this._betP.bet > 0 && !this._wallet.withdraw(this._betP.bet)) {
                this.showPopup();
                return;
            }
            this.setState('stand');
        }
        playForDealer() {
            const isRevealed = this.game.data.get('revealed', false);
            if (!isRevealed) {
                this.game.data.set('revealed', true);
                this._deck.dCards[1].open();
                // update database
                const dCards = this.game.data.get('dealer', []);
                dCards[1].isVisible = true;
                this.game.data.set('dealer', dCards);
                this.checkCards();
            }
            else {
                //setTimeout(() => {
                this._deck.hit(1, 'dealer', true, this.checkCards, this);
                //}, 500);
            }
        }
        decideNextMove() {
            const state = this.game.data.get('state', 'deal');
            if (state === 'finished') {
                const pScore = this._pScores[0];
                const dScore = this._dScores[0];
                let result = 'push';
                if (pScore > dScore) {
                    result = pScore < 21 ? 'win' : (pScore > 21 ? 'bust' : 'blackjack');
                }
                else if (pScore < dScore) {
                    result = dScore <= 21 ? 'lose' : 'win';
                }
                this.playResult(result);
            }
            else if (state === 'noMoney') {
                this.showPopup();
            }
        }
        playInitialCards() {
            this._deck.initial(() => {
                this.setState('hit');
                this.checkCards();
            }, this);
        }
        playResult(result) {
            // result text
            this.tween.add({
                target: this._resultText,
                to: { scale: { x: 1, y: 1 }, alpha: 1 },
                duration: 1000,
                delay: 500,
                easing: TWEEN__namespace.Easing.Back.Out,
                onStart: () => {
                    if (result === 'win' || result === 'blackjack' || result === 'push') {
                        this.game.sound.get('win').play();
                        if (result === 'blackjack')
                            this.game.sound.get('blackjack').play();
                        const multiplier = (result === 'win' ? 2 : result === 'blackjack' ? 3 : 1);
                        const totalBet = this._betP.bet + this._betP.reserved;
                        this._wallet.deposit(totalBet * multiplier);
                    }
                    else {
                        this.game.sound.get('lose').play();
                    }
                    this._betP.isLocked = false;
                    this._deck.isLocked = false;
                    this._betP.reserved = 0;
                    this._betP.clear(false, 'up');
                    this._deck.relase();
                    this._resultText.text = result.toUpperCase();
                    this._resultText.visible = true;
                    this._blackBack.visible = true;
                    this._blackBack.alpha = 1;
                },
                onComplete: () => {
                    this.tween.add({
                        target: this._resultText,
                        to: { scale: { x: 0, y: 0 }, alpha: 0 },
                        duration: 1000,
                        delay: 1500,
                        easing: TWEEN__namespace.Easing.Back.In,
                        onComplete: () => {
                            this._resultText.visible = false;
                            this._blackBack.visible = false;
                            this._blackBack.alpha = 0;
                            this.setState('deal');
                        }
                    });
                }
            });
        }
        // on click deal button
        onDeal() {
            this.game.sound.get('button').play();
            if (this._wallet.total > 0 && this._wallet.total >= this._betP.bet) {
                if (this._betP.bet > 0 && this._wallet.withdraw(this._betP.bet)) {
                    // clear inital bet
                    this._betP.isLocked = false;
                    this._betP.reserve();
                    this._dealButton.disabled();
                    if (this._deck.copies.length <= 26) {
                        this._deck.shuffle(true, this.playInitialCards, this);
                    }
                    else {
                        this.playInitialCards();
                    }
                }
                else {
                    this.setState('deal');
                }
            }
            else {
                this.setState('noMoney');
            }
        }
        // on click hit button
        onHit() {
            this.game.sound.get('button').play();
            this._deck.hit(1, 'player', true, this.checkCards, this);
        }
        // on click stand button
        onStand() {
            this.game.sound.get('button').play();
            const pScore = this._pScores.filter(p => p <= 21);
            this._pScores = [Math.max(...pScore)];
            this.checkAdditionBet();
        }
        // syn game states
        setState(state) {
            this.game.data.set('state', state).save();
            switch (state) {
                case 'deal':
                    if (this._wallet.total > 0) {
                        this._hitButton.disabled();
                        this._standButton.disabled();
                        this._dealButton.enabled();
                        this._betP.isLocked = false;
                        this._deck.isLocked = false;
                        // reset components
                        this._betP.clear();
                        this._deck.relase();
                        // reset texts
                        this._pScoreText.text = '0';
                        this._dScoreText.text = '0';
                        // reset scores
                        this._pScores = [0];
                        this._dScores = [0];
                        this.game.data.set('revealed', false);
                    }
                    else {
                        this.setState('noMoney');
                    }
                    break;
                case 'hit':
                    this._hitButton.enabled();
                    this._standButton.enabled();
                    this._dealButton.disabled();
                    //this._betP.isLocked = true;
                    this._deck.isLocked = false;
                    this.checkCards();
                    break;
                case 'stand':
                    this._hitButton.disabled();
                    this._standButton.disabled();
                    this._dealButton.disabled();
                    this._betP.isLocked = true;
                    this.playForDealer();
                    break;
                case 'finished':
                    this._hitButton.disabled();
                    this._standButton.disabled();
                    this._dealButton.disabled();
                    this._betP.isLocked = true;
                    this._deck.isLocked = true;
                    // update texts
                    this._pScoreText.text = this._pScores[0].toString();
                    this._dScoreText.text = this._dScores[0].toString();
                    this.decideNextMove();
                    break;
                case 'noMoney':
                    this._hitButton.disabled();
                    this._standButton.disabled();
                    this._dealButton.disabled();
                    this._betP.isLocked = true;
                    this._deck.isLocked = true;
                    this.decideNextMove();
                    break;
            }
        }
        // home button click
        onHomeClick() {
            this.game.sound.get('button').play();
            this.game.scene.sleep(this.key);
            this.game.scene.start('MenuScene');
        }
        // scene events
        onWokeUp() {
            const sessionID = this.game.data.get('sessionID', -1);
            const state = this.game.data.get('state', 'deal');
            if (this._sessionID !== sessionID) {
                this._sessionID = sessionID;
                this._pScoreText.text = '0';
                this._dScoreText.text = '0';
                this._wallet.reset();
                this._wallet.sync();
                this._betP.reset();
                this._betP.sync();
                this._deck.reset();
                this._deck.sync();
                this.setState(state);
            }
            else if (state === 'noMoney') {
                this.showPopup();
            }
        }
    }

    class LoadingScene extends Scene {
        create() {
            PIXI__namespace.Assets.addBundle('initial-assets', [
                {
                    name: 'Bungee Regular',
                    srcs: 'fonts/bungee-regular.ttf'
                },
                {
                    name: 'spritesheet',
                    srcs: 'sprites/sprites.json'
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
        registerSounds() {
            this.game.sound.add('blackjack', { src: ['sounds/blackjack.ogg', 'sounds/blackjack.webm'] });
            this.game.sound.add('button', { src: ['sounds/button.ogg', 'sounds/button.webm'] });
            this.game.sound.add('card-pick', { src: ['sounds/card-pick.ogg', 'sounds/card-pick.webm'] });
            this.game.sound.add('chip', { src: ['sounds/chip.ogg', 'sounds/chip.webm'] });
            this.game.sound.add('coin', { src: ['sounds/coin.ogg', 'sounds/coin.webm'] });
            this.game.sound.add('main-music', { src: ['sounds/main-music.ogg', 'sounds/main-music.webm'] });
            this.game.sound.add('win', { src: ['sounds/win.ogg', 'sounds/win.webm'] });
            this.game.sound.add('lose', { src: ['sounds/lose.ogg', 'sounds/lose.webm'] });
        }
        onAssetLoadComplete() {
            this.registerSounds();
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
                this.resetSession();
            }
            this.game.data.load();
            this.on('wokeup', this.onWokeUp, this);
        }
        create() {
            this._startButton.onclick = this._startButton.ontap = this.onStartClick.bind(this);
            this._resetButton.onclick = this._resetButton.ontap = this.onResetClick.bind(this);
            this.checkButtons();
        }
        resetSession() {
            const music = this.game.data.get('music', true);
            // initial values
            this.game.data.set('sessionID', PIXI__namespace.utils.uid());
            this.game.data.set('started', false);
            this.game.data.set('state', 'deal');
            this.game.data.set('balance', 1000);
            this.game.data.set('reserved', 0);
            this.game.data.set('bet', 0);
            this.game.data.set('chips', []);
            this.game.data.set('deck', []);
            this.game.data.set('revealed', false);
            this.game.data.set('dealer', []);
            this.game.data.set('player', []);
            this.game.data.set('music', music);
            this.game.data.set('statistic.win', 0);
            this.game.data.set('statistic.lost', 0);
            this.game.data.set('statistic.draw', 0);
            this.game.data.set('statistic.history', []);
            this.game.data.set('statistic.total.win', 0);
            this.game.data.set('statistic.total.lost', 0);
            this.game.data.save();
        }
        checkButtons() {
            const isStarted = this.game.data.get('started', false);
            this._startButton['_label'].text = isStarted ? 'RESUME' : 'START';
            this._resetButton.visible = isStarted;
        }
        // event listeners
        onSleep() {
            this._startButton.disabled();
        }
        onWokeUp() {
            if (!this.game.data.hasLocalRecord()) {
                this.resetSession();
            }
            this._startButton.enabled();
            this.checkButtons();
        }
        onStartClick() {
            this.game.sound.get('button').play();
            this.game.data.set('started', true).save();
            this.game.scene.sleep(this.key);
            this.game.scene.start('GameScene');
        }
        onResetClick() {
            this.game.sound.get('button').play();
            this.resetSession();
            this.checkButtons();
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
        globalThis.__PIXI_APP__ = game;
        globalThis.game = game;
        globalThis.document.body.addEventListener('click', () => {
            if (document.body.requestFullscreen) {
                document.body.requestFullscreen();
            }
            else if (document.body.webkitRequestFullscreen) { /* Safari */
                document.body.webkitRequestFullscreen();
            }
            else if (document.body.msRequestFullscreen) { /* IE11 */
                document.body.msRequestFullscreen();
            }
            if (PIXI__namespace.utils.isMobile.phone) {
                globalThis.screen.orientation.lock('portrait-primary');
            }
        });
        if (PIXI__namespace.utils.isMobile.phone) {
            globalThis.screen.orientation.lock('portrait-primary');
        }
        globalThis.addEventListener('blur', () => {
            game.sound.mute(true);
        });
        globalThis.addEventListener('focus', () => {
            game.sound.mute(false);
        });
        if (!globalThis.document.hasFocus()) {
            game.sound.mute(true);
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
