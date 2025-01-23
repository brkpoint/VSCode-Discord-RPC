import * as vscode from 'vscode';

import { RPCData, RPCHandle } from './rpc';
import { Logger } from './extension.logger';
import { Config } from './extension.config';
import { getIconId } from './extension.workspace';
import { Cacher } from './extension.caching';
import { ExtensionElements } from './extension.elements';
import {
    handleStatusItemCommand,
    handleStartRpcCommand,
    handleStopRpcCommand,
    handleClearAllCacheCommand,
    handleReloadRpcCommand,
    handleIssueReportCommand,
} from './extension.commands';

let startTimestamp: number = Date.now(); // Start of the vscode session.

let cacher: Cacher; // Used to cache items.
let elements: ExtensionElements; // Elements that are working with vscode.

let handle: RPCHandle;
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
-------------------
|    RPC EVENTS   |
-------------------

Handlers for RPC connection that controll what happens with 'barItem', logs and vscode popup errors.

*/

/**
 * @description When called it will update RPC with avaiable data.
 */
async function handleRpcUpdates() {
    rpcDataUpdate();
    handle.update(rpcData);
}

/**
 * @description When the client connects to discord, function will update 'statusItem' and log user connection.
 */
function handleRpcConnect() {
    const username = handle.getUsername();
    if (!username) {
        return;
    }

    const displayName = handle.getDisplayName();
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
function handleRpcDisconnect() {
    Logger.info(`Connection disconnected.`);

    elements.get('statusItem').text = '$(error) RPC disconnected';
}

/*
--------------------------------
|    CACHE HELPER FUNCTIONS    |
--------------------------------
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
    let connected: boolean = await handle.connect(false);

    if (!connected) {
        connectionFailed();
        return;
    }

    handleRpcUpdates();
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
    const extensionName = Config.get().extension.name;

    const startRpc = `${extensionName}.startRPC`;
    elements.add(
        startRpc,
        vscode.commands.registerCommand(startRpc, () => {
            handleStartRpcCommand(elements, handle, connectRpc);
        }),
    );

    const stopRpc = `${extensionName}.stopRPC`;
    elements.add(
        stopRpc,
        vscode.commands.registerCommand(stopRpc, () => {
            handleStopRpcCommand(elements, handle);
        }),
    );

    const reloadRpc = `${extensionName}.reloadRPC`;
    elements.add(
        reloadRpc,
        vscode.commands.registerCommand(reloadRpc, () => {
            handleReloadRpcCommand(elements, handle);
        }),
    );

    const clearCache = `${extensionName}.clearAllCache`;
    elements.add(
        clearCache,
        vscode.commands.registerCommand(clearCache, () => {
            handleClearAllCacheCommand(elements, handle, cacher);
        }),
    );

    const reportIssue = `${extensionName}.reportIssue`;
    elements.add(
        reportIssue,
        vscode.commands.registerCommand(reportIssue, () => {
            handleIssueReportCommand(elements, handle);
        }),
    );

    const statusItem = `${extensionName}.statusItem`;
    elements.add(
        statusItem,
        vscode.commands.registerCommand(statusItem, () => {
            handleStatusItemCommand(elements, handle, connectRpc);
        }),
    );
}

/**
 * @description Initializes all extension events.
 */
function initEvents() {
    elements.add(
        'windowChangeEvent',
        vscode.window.onDidChangeActiveTextEditor(() => handleRpcUpdates()),
    );
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
    Logger.info('Initializing commands.');
    initCommands();

    Logger.info('Initializing events.');
    initEvents();

    Logger.info('Initializing items.');
    initItems();

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
    elements = new ExtensionElements(context.subscriptions);

    initVSCElements();

    Logger.log('Initializing RPC...');
    handle = new RPCHandle(
        Config.get().rpc.applicationId,
        handleRpcConnect,
        handleRpcDisconnect,
        handleRpcUpdates,
        Config.get().extension.settings.updateTimeInterval * 1000,
        true,
        setCache,
        getCache,
    );
    await connectRpc();
}

/**
 * @description VSCode's extension exit point. Stops RPC connection.
 */
export function deactivate(): void {
    if (handle.isConnected()) {
        handle.disconnect();
        Logger.log('RPC disconnected.');
    }

    Logger.log('Stopping the extension.');
}
