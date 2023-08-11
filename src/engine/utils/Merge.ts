import { Clone } from './Clone';

export function Merge(obj1: { [key: string]: any }, obj2: { [key: string]: any }): { [key: string]: any }
{
    const clone = Clone(obj1);

    for (const key in obj2)
    {
        if (!Object.prototype.hasOwnProperty.call(clone, key))
        {
            clone[key] = obj2[key];
        }
    }

    return clone;
}
