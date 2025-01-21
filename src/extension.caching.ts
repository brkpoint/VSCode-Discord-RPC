import * as vscode from 'vscode';

import { Logger } from './extension.logger';
import { Config } from './extension.config';

// Cacher Class //
// Simple cache handler.

export class Cacher {
    private cachedKeys: string[] = [];
    private cachedKeysName: string = 'keys';
    private extensionContext: vscode.ExtensionContext;

    /**
     * @param globalCache VSCode's globalState caching.
     */
    constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;

        const keys = this.getCache<string[]>(this.cachedKeysName);
        if (keys) {
            this.cachedKeys = keys;
        }
    }

    /**
     * @param {string} key
     * @description Pushes the key to cached keys and caches the cached keys, I know its a little bit of a mess.
     */
    private updateCachedKeys(key: string) {
        if (this.cachedKeys.includes(key)) {
            Logger.warn(`'${key}' already in list 'cachedKeys'.`);
            return;
        }

        this.cachedKeys.push(key);
        this.cache(this.cachedKeysName, this.cachedKeys);
    }

    /**
     * @param {string} key The key that data will be written under.
     * @param {any} data The data that will be cached.
     * @description Sets cache in vscode with a key and a data attribute.
     */
    private cache(key: string, data: any) {
        const extensionName = Config.get().extension.name;

        this.extensionContext.globalState.update(
            `${extensionName}:${key}_cache`,
            data,
        );
    }

    /**
     * @param {string} key The key that data will be written under.
     * @param {any} data The data that will be cached.
     * @description Sets cache in vscode with a key and a data attribute, also updated cached keys.
     */
    setCache(key: string, data: any) {
        this.cache(key, data);
        this.updateCachedKeys(key);
    }

    /**
     * @param {string} key The key that data will be retrived.
     * @description Gets cache corresponding to the key.
     * @returns {any} Data retrived from cache.
     */
    getCache<T>(key: string): T | undefined {
        const extensionName = Config.get().extension.name;
        const data = this.extensionContext.globalState.get<T>(
            `${extensionName}:${key}_cache`,
        );
        return data;
    }

    /**
     * @param {string} key The key that data under it will deleted.
     * @description Removes cache corresponding to the key.
     */
    clearCache(key: string) {
        this.extensionContext.globalState.update(key, null);
    }

    /**
     * @description Removes all cache.
     */
    clearAllCache() {
        for (const key of this.cachedKeys) {
            this.clearCache(key);
        }

        this.clearCache(this.cachedKeysName);
        this.cachedKeys = [];
    }
}
