import * as vscode from 'vscode';
import { RPCHandle } from './discord';
import { Presence } from './presence';
import { ExtensionData } from './data';

/**
 * EXTENSION
 *
 * Wraper around everything, easier to share values with (less cluttered imo).
 */
class Extension {
    private startTimestamp: number = Date.now();

    private statusBarItem: vscode.StatusBarItem;
    private connectCmd: vscode.Disposable;
    private disconnectCmd: vscode.Disposable;
    private barItemCmd: vscode.Disposable;
    private reloadCmd: vscode.Disposable;
    private reportIssueCmd: vscode.Disposable;

    private handle: RPCHandle;

    /**
     * @description Creates a `StatusBarItem` in VSC.
     * @returns {vscode.StatusBarItem} Status bar item.
     */
    private _createStatusBarItem(): vscode.StatusBarItem {
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            0,
        );

        statusBarItem.text = ExtensionData.getStatusBarItemDefaultText();

        statusBarItem.tooltip = 'Discord is connecting...';
        statusBarItem.command = `${ExtensionData.extensionName}.barItem`;

        statusBarItem.show();

        return statusBarItem;
    }

    /**
     * @description Handles setting `StatusBarItem`, `ExtensionData._username` and `ExtensionData._displayName`, when connecting to Discord.
     */
    private _connectionHandler() {
        const displayName = this.handle.getDisplayName();
        const username = this.handle.getUsername();

        ExtensionData.setDisplayName(displayName);
        ExtensionData.setUsername(username);

        this.statusBarItem.text = ExtensionData.getStatusBarItemConnectedText();

        this.statusBarItem.tooltip = 'Discord connected.';
    }

    /**
     * @description Handles setting `StatusBarItem`, when disconnecting from Discord.
     */
    private _disconnectionHandler() {
        this.statusBarItem.text =
            ExtensionData.getStatusBarItemDisconnectedText();

        this.statusBarItem.tooltip = 'Discord disconnected.';
    }

    /**
     * @description Handles updating Discord's Rich Presence.
     */
    private async _updateHandler() {
        const activity = Presence.createActivityFromData(this.startTimestamp);

        console.log(activity.getAsObject());

        this.handle.update(activity);
    }

    /**
     * @returns {vscode.Disposable} Connect command.
     */
    private _registerConnectCmd(): vscode.Disposable {
        const connectCmd = vscode.commands.registerCommand(
            `${ExtensionData.extensionName}.connect`,
            () => this.connectToDiscord(),
        );

        return connectCmd;
    }

    /**
     * @returns {vscode.Disposable} Disconnect command.
     */
    private _registerDisconnectCmd(): vscode.Disposable {
        const disconnectCmd = vscode.commands.registerCommand(
            `${ExtensionData.extensionName}.disconnect`,
            () => this.disconnectFromDiscord(),
        );

        return disconnectCmd;
    }

    /**
     * @returns {vscode.Disposable} Status bar item command.
     */
    private _registerBarItemCmd(): vscode.Disposable {
        const barItemCmd = vscode.commands.registerCommand(
            `${ExtensionData.extensionName}.barItem`,
            () => {
                if (this.isConnectedToDiscord()) {
                    this.reloadConnection();
                    return;
                }

                extension?.connectToDiscord();
            },
        );

        return barItemCmd;
    }

    /**
     * @returns {vscode.Disposable} Reload command.
     */
    private _registerReloadCmd(): vscode.Disposable {
        const reloadCmd = vscode.commands.registerCommand(
            `${ExtensionData.extensionName}.reload`,
            () => this.reloadConnection(),
        );

        return reloadCmd;
    }

    /**
     * @returns {vscode.Disposable} Report an issue command.
     */
    private _registerReportIssueCmd(): vscode.Disposable {
        const reportIssueCmd = vscode.commands.registerCommand(
            `${ExtensionData.extensionName}.reportIssue`,
            async () => {
                const reporter = await vscode.commands.executeCommand(
                    'workbench.action.openIssueReporter',
                    {
                        extensionId: ExtensionData.extensionId,
                        issueBody: 'Describe the issue here...',
                    },
                );

                if (reporter) {
                    vscode.window.showInformationMessage(
                        'Thank you for reporting the issue.',
                    );
                }
            },
        );

        return reportIssueCmd;
    }

    /**
     * @param {vscode.ExtensionContext} context VSC's context.
     */
    constructor(context: vscode.ExtensionContext) {
        this.statusBarItem = this._createStatusBarItem();
        this.connectCmd = this._registerConnectCmd();
        this.disconnectCmd = this._registerDisconnectCmd();
        this.barItemCmd = this._registerBarItemCmd();
        this.reloadCmd = this._registerReloadCmd();
        this.reportIssueCmd = this._registerReportIssueCmd();

        this.handle = new RPCHandle(
            ExtensionData.getDiscordApplicationId(),
            this._connectionHandler.bind(this),
            this._disconnectionHandler.bind(this),
            this._updateHandler.bind(this),
        );

        context.subscriptions.push(
            this.statusBarItem,
            this.connectCmd,
            this.disconnectCmd,
            this.barItemCmd,
            this.reloadCmd,
            this.reportIssueCmd,
        );
    }

    /**
     * @description Connects to Discord using IPC.
     */
    async connectToDiscord() {
        let connected = await this.handle.connect(false);

        if (!connected) {
            this._disconnectionHandler();
            vscode.window.showErrorMessage('Could not connect to discord.');
        }

        this._updateHandler();
    }

    /**
     * @description Disconnects from Discord.
     */
    disconnectFromDiscord() {
        this.handle.disconnect();
    }

    /**
     * @description Reloads RPC.
     */
    async reloadConnection() {
        this.statusBarItem.text = ExtensionData.getStatusBarItemDefaultText();

        this.statusBarItem.tooltip = 'Reloading connection...';

        await new Promise((resolve) => setTimeout(resolve, 1500)); // Small delay 1.5 sec

        this.handle.reload();
    }

    /**
     * @returns {boolean} Is VSCode connected to Discord.
     */
    isConnectedToDiscord(): boolean {
        return this.handle.isConnected();
    }
}

let extension: Extension | undefined = undefined;

/**
 * ACTIVATION / DEACTIVATION
 *
 * VSCode extension's start and stop.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log(`Hello, world from ${ExtensionData.extensionId}`);

    extension = new Extension(context);
    extension?.connectToDiscord();
}

export function deactivate() {
    if (!extension) {
        return; // Very wierd
    }

    extension.disconnectFromDiscord();
}
