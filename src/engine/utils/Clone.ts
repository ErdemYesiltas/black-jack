export function Clone(obj: { [key: string]: any }): { [key: string]: any } {
    const clone: { [key: string]: any } = {};

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