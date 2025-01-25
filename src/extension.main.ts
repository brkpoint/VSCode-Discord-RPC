import * as vscode from 'vscode';

import { RPCData, RPCHandle } from './rpc';
import { Logger } from './extension.logger';
import { Config } from './extension.config';
import { getIconId } from './extension.workspace';
import { Cacher } from './extension.caching';
import { ElementsHandler } from './extension.elements';
import { CommandsHandler } from './extension.commands';
import { EventsHandler } from './extension.events';

let startTimestamp: number = Date.now(); // Start of the vscode session.

let cacher: Cacher; // Used to cache items.
let elements: ElementsHandler; // Elements that are working with vscode.
let eventsHandler: EventsHandler;
let commandsHandler: CommandsHandler;

let rpcHandle: RPCHandle;
let rpcData: RPCData = new RPCData('Visual Studio Code');

/*
-------------------
|    RPC UPDATE   |
-------------------

Update RPC with the current vscode's data.

*/

/**
 * @param {any} settings User's settings for RPC.
 * @description Updates 'rpcData' with the current data avaiable (on events it will update).
 */
function presence(settings: any) {
    const details = Config.parse(settings.details);
    if (details) {
        rpcData.setTitle(details);
    }

    const state = Config.parse(settings.state);
    if (state) {
        rpcData.setDescription(state);
    }

    const iconText = Config.parse(settings.iconText);
    if (iconText) {
        rpcData.setLargeImageText(iconText);
    }

    if (settings.showLanguageIcons) {
        const icon = getIconId() ?? 'vscode';

        rpcData.setLargeImage(icon);
    }
}

/**
 * @description Updates 'rpcData' with full presence.
 */
function rpcDataUpdate() {
    rpcData = new RPCData('Visual Studio Code').setLargeImage('vscode');

    const extSettings = Config.get().extension.settings;
    let settings = extSettings.idle;

    if (extSettings.showTime) {
        rpcData.setTimestampStart(startTimestamp);
    }

    if (vscode.window.activeTextEditor) {
        settings = extSettings.editing;
    }

    presence(settings);
}

/*
--------------------
|    RPC EVENTS    |
--------------------

Handlers for RPC connection that controll what happens with 'barItem', logs and vscode popup errors.

*/

/**
 * @description When called it will update RPC with avaiable data.
 */
async function handleRpUpdates() {
    rpcDataUpdate();
    rpcHandle.update(rpcData);
}

/**
 * @description When the client connects to discord, function will update 'statusItem' and log user connection.
 */
function handleRpConnect() {
    const username = rpcHandle.getUsername();
    if (!username) {
        return;
    }

    const displayName = rpcHandle.getDisplayName();
    if (!displayName) {
        return;
    }

    Logger.log(`Connected to discord with user: ${username}.`);

    elements.get(
        'statusItem',
    ).text = `$(pass-filled) ${displayName} connected.`;
}

/**
 * @description When client disconnects, function will update 'statusItem' and log user disconnection.
 */
function handleRpDisconnect() {
    Logger.info(`Connection disconnected.`);

    elements.get('statusItem').text = '$(error) RPC disconnected';
}

/*
--------------------------------
|    CACHE HELPER FUNCTIONS    |
--------------------------------

Helper functions for caching.

*/

/**
 * @param {string} key Key for data in cache.
 * @param {any} data
 * @description Sets the key with data in cache.
 */
function setCache(key: string, data: any) {
    cacher.setCache(key, data);
}

/**
 * @param {string} key
 * @description Find data with the key in cache.
 * @returns {T | undefined} Cache found.
 */
function getCache<T>(key: string): T | undefined {
    return cacher.getCache<T>(key);
}

/*
----------------
|   RPC INIT   |
----------------

Initialization of 'RPCHandler' and if the connection fails it handles it.

*/

/**
 * @description When RPC connection fails, this function will be called.
 */
function connectionFailed() {
    Logger.warn('Failed to connect to discord.');

    elements.get('statusItem').text = '$(error) RPC not connected';
    vscode.window.showErrorMessage('RPC could not connect.');
}

/**
 * @description Tries to connect to discord.
 */
async function connectRpc() {
    let connected: boolean = await rpcHandle.connect(false);

    if (!connected) {
        connectionFailed();
        return;
    }

    handleRpUpdates();
}

/*
---------------------------
|   INIT VSCODE ELEMENTS  |
---------------------------

Initializes all needed commands, events and elements.

Initialized commands:
 - startRPC   (starts RPC from vscode command line)
 - stopRPC    (stops RPC if it is connected)
 - reloadRPC  (restarts the rpc interval with new (or old) milliseconds)
 - statusItem (handles the behaviour of the 'statusItem' element)

Initialized events:
 - windowChangeEvent (if the user switches to a diffrent file the event will be called)

Initialized elements:
 - statusItem (item in the bar at the bottom of the editor)

*/

/**
 * @description Initializes all extension commands.
 */
function initCommands() {
    commandsHandler = new CommandsHandler(
        elements,
        rpcHandle,
        cacher,
        connectRpc,
    );
}

/**
 * @description Initializes all extension events.
 */
function initEvents() {
    eventsHandler = new EventsHandler(elements, handleRpUpdates);
}

/**
 * @description Creates 'statusItem' with default text.
 * @returns {vscode.StatusBarItem} 'statusItem'.
 */
function initRpcStatusItem(): vscode.StatusBarItem {
    let statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0,
    );

    statusBarItem.text = '$(sync~spin) RPC Connecting...';
    statusBarItem.command = `${Config.get().extension.name}.statusItem`;

    statusBarItem.show();

    return statusBarItem;
}

/**
 * @description Initialize all items.
 */
function initItems() {
    const statusItem = initRpcStatusItem();
    elements.add('statusItem', statusItem);
}

/**
 * @description Initalize all elements and log.
 */
function initVSCElements() {
    Logger.info('Initializing items.');
    initItems();

    Logger.info('Initializing events.');
    initEvents();

    Logger.info('Initializing commands.');
    initCommands();

    Logger.log('Elements initalized.');
}

/*
------------------------------
|   VSCODE ENTRY AND EXIT    |
------------------------------

Default vscode's extension entry point and exit point.

*/

/**
 * @param {vscode.ExtensionContext} context
 * @description VSCode's extension entry point. Initializes elements, configs and starts RPC connection.
 */
export async function activate(
    context: vscode.ExtensionContext,
): Promise<void> {
    Logger.log('Extension activated.');

    Logger.info('Loading config...');
    Config.load();

    Logger.info('Setting up extension...');
    cacher = new Cacher(context);
    elements = new ElementsHandler(context.subscriptions);
    rpcHandle = new RPCHandle(
        Config.get().rpc.applicationId,
        handleRpConnect,
        handleRpDisconnect,
        handleRpUpdates,
        Config.get().extension.settings.updateTimeInterval * 1000,
        true,
        setCache,
        getCache,
    );

    initVSCElements();

    Logger.log('Initializing RPC...');
    await connectRpc();
}

/**
 * @description VSCode's extension exit point. Stops RPC connection.
 */
export function deactivate(): void {
    if (rpcHandle.isConnected()) {
        rpcHandle.disconnect();
        Logger.log('RPC disconnected.');
    }

    Logger.log('Stopping the extension.');
}
