
import * as PIXI from 'pixi.js';
import { DataManagerEvents } from './DataManagerEvents';
import { Clone } from '../utils';

export interface DataManager extends GlobalMixins.DataManager { }
export class DataManager extends PIXI.utils.EventEmitter<DataManagerEvents> {
    static count = 0;
    data: Record<string, any>;
    protected _size: number;
    protected _key = '';

    constructor(entriesOrStorage?: string | Record<string, any>, key?: string) {
        super();
        this.data = {};
        this._size = 0;
        this._key = key ?? `Storage-${DataManager.count}`;
        DataManager.count++;

        if (entriesOrStorage === undefined) { entriesOrStorage = this._key; }
        if (typeof entriesOrStorage === 'string') { this.readLocal(entriesOrStorage); }
        if (typeof entriesOrStorage === 'object' && !Array.isArray(entriesOrStorage)) {
            for (const key in entriesOrStorage) {
                this.set(key, entriesOrStorage[key]);
            }
        }
    }
    query(search: RegExp): Record<string, any> {
        const results: Record<string, any> = {};

        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key) && key.match(search)) {
                results[key] = this.data[key];
            }
        }

        return results;
    }
    set(key: string | Record<string, any>, value?: any): this {
        if (typeof key === 'object') {
            const keys = Object.keys(key);

            keys.forEach((k) => {
                this.set(k, key[k]);
            }
                , this);
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
                this.emit(
                    'setdata',
                    keys[keys.length - 1],
                    Clone(prev[keys[keys.length - 1]])
                );
            }
            else {
                const oldValue = prev[keys[keys.length - 1]];

                prev[keys[keys.length - 1]] = value;
                this.emit(
                    'changedata',
                    keys[keys.length - 1],
                    Clone(prev[keys[keys.length - 1]]),
                    oldValue
                );
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
    get(key: string, defaultVal: any = null): any {
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
    getAll(): Record<string, any> {
        const results: Record<string, any> = {};

        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                results[key] = this.data[key];
            }
        }

        return results;
    }
    has(key: string): boolean {
        return (Object.prototype.hasOwnProperty.call(this.data, key));
    }
    delete(key: string, localStorage = false): this {
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
    clear(localStorage = false): this {
        Object.keys(this.data).forEach((prop) => { delete this.data[prop]; }, this);
        if (localStorage) {
            this.clearLocal();
        }

        this._size = 0;

        return this;
    }
    keys(): string[] {
        return Object.keys(this.data);
    }
    values(): any[] {
        const results = [];

        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                results.push(this.data[key]);
            }
        }

        return results;
    }
    dump(): void {
        console.group(`${this._key} Size: ${this._size}`);
        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                console.log(key, this.data[key]);
            }
        }
        console.groupEnd();
    }
    each(callback: (...args: any[]) => boolean): this {
        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                if (callback(key, this.data[key]) === false) {
                    break;
                }
            }
        }

        return this;
    }
    contains(value: any): boolean {
        for (const key in this.data) {
            if (Object.prototype.hasOwnProperty.call(this.data, key)) {
                if (this.data[key] === value) {
                    return true;
                }
            }
        }

        return false;
    }
    merge(map: DataManager, override = false): this {
        if (override === undefined) { override = false; }

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
    hasLocalRecord(key?: string): boolean {
        if (window.localStorage !== null) {
            key = key !== undefined ? key : this._key;

            return window.localStorage.getItem(key) !== null;
        }

        return false;
    }
    readLocal(key?: string): this {
        if (window.localStorage !== null) {
            key = key !== undefined ? key : this._key;

            let localEntries = window.localStorage.getItem(key);

            if (localEntries === undefined || localEntries === null) { localEntries = '{}'; }

            const entries: Record<string, any> = JSON.parse(localEntries);

            if (typeof entries === 'object') {
                if (Array.isArray(entries)) {
                    const len = (entries as any[]).length;

                    for (let i = 0; i < len; i++) {
                        const entry = entries[i];

                        if (entry) {
                            this.set(entry[0], entry[1]);
                        }
                    }
                }
                else {
                    Object.keys(entries).forEach((k: string) => { this.set(k, entries[k]); }, this);
                }
            }
        }
        else {
            console.warn('Local storage not supported');
        }

        return this;
    }
    writeLocal(): this {
        if (window.localStorage !== null) {
            window.localStorage.setItem(this._key, JSON.stringify(this.data));
        }
        else {
            console.warn('Local storage not supported');
        }

        return this;
    }
    clearLocal(): this {
        if (window.localStorage !== null) {
            window.localStorage.removeItem(this._key);
        }
        else {
            console.warn('Local storage not supported');
        }

        return this;
    }
    destroy(): void {
        this.clear();
        this.removeAllListeners();
    }
    get size(): number {
        return this._size;
    }
    get key(): string {
        return this._key;
    }
}