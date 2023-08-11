export interface ObjectPoolMember<T> extends GlobalMixins.ObjectPoolMember { }
export class ObjectPoolMember<T>
{
    data: T = null;
    free = false;
    constructor(data: T) {
        this.data = data;
    }
}