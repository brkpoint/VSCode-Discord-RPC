import { commands, window } from 'vscode';

import { Cacher } from './extension.caching';
import { Config } from './extension.config';
import { ElementsHandler } from './extension.elements';
import { Logger } from './extension.logger';
import { RPCHandle } from './rpc';

/*
-----------------------
|    COMMAND CLASS    |
-----------------------

Command constructor.

*/

export class Command {
    private name: string;
    private id: string;
    private callback: (...args: any[]) => Promise<any>;

    /**
     * @param {string} name Name of the command.
     * @param {Function} callback Function is called when the command is issued.
     */
    constructor(name: string, callback: (...args: any[]) => Promise<any>) {
        this.name = name;
        this.id = `${Config.get().extension.name}.${name}`;
        this.callback = callback;
    }

    /**
     * @returns {string} Name of the command.
     */
    getName(): string {
        return this.name;
    }

    /**
     * @returns {string} ID of the command.
     */
    getId(): string {
        return this.id;
    }

    /**
     * @returns {Function} Function to call when command is issued.
     */
    getCallback(): (...args: any[]) => any {
        return this.callback;
    }
}

/*
-----------------------
|    COMMANDS ENUM    |
-----------------------

All avaiable commands.

*/

export enum Commands {
    START_CONNECTION = 'startRP',
    STOP_CONNECTION = 'stopRP',
    RELOAD_CONNECTION = 'reloadRP',
    CLEAR_ALL_CACHE = 'clearAllCache',
    REPORT_ISSUE = 'reportIssue',
    STATUS_ITEM = 'statusItem',
}

/*
--------------------------------
|    COMMANDS HANDLER CLASS    |
--------------------------------

Handles all commands.

*/

export class CommandsHandler {
    private elements: ElementsHandler;
    private rpcHandle: RPCHandle;
    private cacher: Cacher;

    private connectRpc: Function;

    /**
     * @param {any[]} args Arguments from command caller.
     * @description Starts rpc, if it is connected, it wont connect.
     */
    private async handleStartConnectionCommand(...args: any[]) {
        if (this.rpcHandle.isConnected()) {
            return;
        }

        this.elements.get('statusItem').text = '$(sync~spin) RPC Connecting...';

        await this.connectRpc();
    }

    /**
     * @param {any[]} args Arguments from command caller.
     * @description Stops rpc connection, if it isnt connected it wont do anything.
     */
    private async handleStopConnectionCommand(...args: any[]) {
        if (!this.rpcHandle.isConnected()) {
            return;
        }

        this.rpcHandle.disconnect();
    }

    /**
     * @param {any[]} args Arguments from command caller.
     * @description Reloads rpc if it is connected.
     */
    private async handleReloadConnectionCommand(...args: any[]) {
        this.elements.get('statusItem').text = '$(sync~spin) Reloading...';

        Config.load();

        await new Promise((f) => setTimeout(f, 1500));

        this.rpcHandle.reload(
            Config.get().extension.settings.updateTimeInterval * 1000,
        );

        Logger.log('Reloaded RPC.');
    }

    /**
     * @param {any[]} args Arguments from command caller.
     * @description Clears extensions cache.
     */
    private async handleClearAllCacheCommand(...args: any[]) {
        this.cacher.clearAllCache();
    }

    /**
     * @param {any[]} args Arguments from command caller.
     * @description Opens the issue reporter with logs.
     */
    private async handleIssueReportCommand(...args: any[]) {
        const reporter = await commands.executeCommand(
            'workbench.action.openIssueReporter',
            {
                extensionId: Config.get().extension.id,
                issueBody: 'Describe the issue here...',
                data: Logger.getLogsAsString(),
            },
        );

        if (reporter) {
            window.showInformationMessage('Thank you for reporting the issue.');
        }
    }

    /**
     * @param {any[]} args Arguments from command caller.
     * @description If there is a connection between rpc and extension it will reload the rpc, if there isnt it will start rpc.
     */
    private async handleStatusItemCommand(...args: any[]) {
        if (!this.rpcHandle.isConnected()) {
            await this.handleStartConnectionCommand();
            return;
        }

        await this.handleReloadConnectionCommand();
    }

    /**
     *
     * @param {command} command Command to initialize.
     * @description Command initialization helper, registers the command and adds it to the 'elements' list.
     */
    private initCommand(command: Command) {
        const vsCommand = commands.registerCommand(
            command.getId(),
            command.getCallback(),
        );

        this.elements.add(command.getName(), vsCommand);
    }

    /**
     * @param {ElementsHandler} elements
     * @param {RPCHandle} rpcHandle
     * @param {Cacher} cacher
     * @param {Function} connectRpc
     */
    constructor(
        elements: ElementsHandler,
        rpcHandle: RPCHandle,
        cacher: Cacher,
        connectRpc: Function,
    ) {
        this.elements = elements;
        this.rpcHandle = rpcHandle;
        this.cacher = cacher;
        this.connectRpc = connectRpc;

        /* START RPC */
        this.initCommand(
            new Command(Commands.START_CONNECTION, (...args: any[]) =>
                this.handleStartConnectionCommand(...args),
            ),
        );
        /* STOP RPC */
        this.initCommand(
            new Command(Commands.STOP_CONNECTION, (...args: any[]) =>
                this.handleStopConnectionCommand(...args),
            ),
        );
        /* RELOAD RPC */
        this.initCommand(
            new Command(Commands.RELOAD_CONNECTION, (...args: any[]) =>
                this.handleReloadConnectionCommand(...args),
            ),
        );
        /* CLEAR ALL CACHE */
        this.initCommand(
            new Command(Commands.CLEAR_ALL_CACHE, (...args: any[]) =>
                this.handleClearAllCacheCommand(...args),
            ),
        );
        /* REPORT ISSUE */
        this.initCommand(
            new Command(Commands.REPORT_ISSUE, (...args: any[]) =>
                this.handleIssueReportCommand(...args),
            ),
        );
        /* STATUS ITEM */
        this.initCommand(
            new Command(Commands.STATUS_ITEM, (...args: any[]) =>
                this.handleStatusItemCommand(...args),
            ),
        );
    }
}
