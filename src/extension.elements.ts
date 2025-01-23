import { Logger } from './extension.logger';

/*
--------------------------
|   SUBSCRIPTION CLASS   |
--------------------------

Basically a version of vscode's subscription in subscriptions list.

*/

export class Subscription {
    /**
     * @description Deletes subscriber from subcriptions.
     * @returns {any} Current disposed subcribent.
     */
    dispose(): any {}
}

/*
----------------------
|   ELEMENTS CLASS   |
----------------------

VSCode's elements handler and updater for keeping this under controll.

*/

export class ExtensionElements {
    private subscriptions: Subscription[]; // All of the subscriptions.
    private elements: Map<string, any> = new Map<string, any>(); // Map of registered events.

    /**
     * @param {Subscription[]} subscriptions VSCode's default subscriptions param.
     * @returns {ExtensionElements} instance of ExtensionElements class.
     */
    constructor(subscriptions: Subscription[]) {
        this.subscriptions = subscriptions;
    }

    /**
     * @param {string} name Name of the element in the Map.
     * @param {any} element Element to register.
     * @description Registers current element and adds to 'subscriptions' list.
     */
    add(name: string, element: any) {
        if (this.elements.has(name)) {
            Logger.warn(`'${name}' already exists in elements.`);
            return;
        }

        this.elements.set(name, element);
        this.subscriptions.push(this.elements.get(name));
    }

    /**
     * @param {string} name Name of the element registered in Map.
     * @returns {any} Element from name.
     */
    get(name: string): any {
        if (!this.elements.has(name)) {
            Logger.warn(`'${name}' doesnt exist in elements.`);
            return;
        }

        return this.elements.get(name);
    }

    /**
     * @param {string} name Name of the element registered in Map.
     * @param {any} elemnt Element to swap.
     * @description Swaps a element from name to the given one.
     */
    set(name: string, element: any) {
        if (!this.elements.has(name)) {
            Logger.warn(`'${name}' doesnt exist in elements`);
            return;
        }

        this.elements.set(name, element);
    }
}
