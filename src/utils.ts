/**
 * @description JS like object that holds keys and values.
 */
export interface LooseObject {
    [index: string]: any;
}

/**
 *
 * @param {LooseObject} obj Object to add to.
 * @param {string[]} allKeys Hierachy of keys.
 * @param {any} add Object that is going to be added to the last key.
 * @description Add an object to value from 'allKeys'.
 */
export function addToObject(obj: LooseObject, allKeys: string[], add: any) {
    if (!add) {
        return;
    }

    const keys = [...allKeys];
    keys.pop();

    let crObj = obj;
    for (const key of keys) {
        if (!crObj[key]) {
            crObj[key] = {};
        }

        crObj = crObj[key];
    }

    const key = allKeys[allKeys.length - 1];
    crObj[key] = add;
}
