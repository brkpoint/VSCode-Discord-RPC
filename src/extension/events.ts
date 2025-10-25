import { Disposable, window } from 'vscode';
import { ElementsHandler } from '@/extension/elements';

/*-------------*/
/* EVENTS ENUM */
/*-------------*/
// All avaiable events.

export enum Events {
    WINDOW_CHANGED = 'windowChangeEvent',
}

/*----------------------*/
/* EVENTS HANDLER CLASS */
/*----------------------*/
// Events handling class.

export class EventsHandler {
    private elements: ElementsHandler;

    /**
     * @param {string} name Name to pair with the event.
     * @param {Disposable} disp Event disposable to register.
     */
    private initEvent(name: string, disp: Disposable) {
        this.elements.add(name, disp);
    }

    /**
     * @param {ElementsHandler} elements
     * @param {Function} callback
     */
    constructor(elements: ElementsHandler, callback: Function) {
        this.elements = elements;

        this.initEvent(
            Events.WINDOW_CHANGED,
            window.onDidChangeActiveTextEditor(() => callback()),
        );
    }
}
