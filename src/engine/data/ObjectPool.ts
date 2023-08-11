import { ObjectPoolMember } from './ObjectPoolMember';
export interface ObjectPool<T> extends GlobalMixins.ObjectPool { }

export class ObjectPool<T>
{
    readonly poolArray: ObjectPoolMember<T>[] = [];
    constructorFunction: () => T = null;
    resetFunction: (obj: T) => T = null;

    constructor(constructorFunction: () => T, resetFunction = (obj: T) => obj, initialSize = 100) {
        this.constructorFunction = constructorFunction;
        this.resetFunction = resetFunction;
        this.increase(initialSize);
    }
    increase(size = 1): void {
        if (size <= 0) { size = 1; }
        for (let i = 0; i < size; i++) this.create();
    }
    decrease(size = 1): void {
        if (size <= 0) { size = 1; }

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
    create(): ObjectPoolMember<T> {
        const data = this.resetFunction(this.constructorFunction());
        const newObjectPoolMember = new ObjectPoolMember(data);

        this.poolArray.push(newObjectPoolMember);

        return newObjectPoolMember;
    }
    get(): ObjectPoolMember<T> {
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
    release(element: ObjectPoolMember<T>): void {
        element.free = true;
        this.resetFunction(element.data);
    }
    get size(): number {
        return this.poolArray.length;
    }
    get inUseSize(): number {
        return this.size - this.freeSize;
    }
    get freeSize(): number {
        let count = 0;

        for (let i = 0; i < this.poolArray.length; i++) {
            if (this.poolArray[i].free) {
                count++;
            }
        }

        return count;
    }
}
