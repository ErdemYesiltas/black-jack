export function GetValue<T = any>(source: Record<string, any>, key: keyof Partial<T>, defaultValue?: unknown): any
{
    if (!source || typeof source === 'number')
    {
        return defaultValue;
    }
    else if (Object.prototype.hasOwnProperty.call(source, key))
    {
        return source[key.toString()];
    }
    else if (key.toString().indexOf('.') !== -1)
    {
        const keys = key.toString().split('.');
        let parent = source;
        let value = defaultValue;

        for (let i = 0; i < keys.length; i++)
        {
            if (Object.prototype.hasOwnProperty.call(parent, keys[i]))
            {
                value = parent[keys[i]];
                parent = parent[keys[i]];
            }
            else
            {
                value = defaultValue;
                break;
            }
        }

        return value;
    }

    return defaultValue;
}
