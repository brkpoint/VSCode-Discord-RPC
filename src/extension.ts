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

    private handle: RPCHandle;

    /**
     * @description Creates a `StatusBarItem` in VSC.
     */
    private _createStatusBarItem() {
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

        this.handle.update(activity);
    }

    /**
     * @param {vscode.ExtensionContext} context VSC's context.
     */
    constructor(context: vscode.ExtensionContext) {
        this.statusBarItem = this._createStatusBarItem();

        this.handle = new RPCHandle(
            ExtensionData.getDiscordApplicationId(),
            this._connectionHandler.bind(this),
            this._disconnectionHandler.bind(this),
            this._updateHandler.bind(this),
        );

        context.subscriptions.push(this.statusBarItem);
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
    reloadConnection() {
        this.handle.reload();
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

    const connectCmd = vscode.commands.registerCommand(
        `${ExtensionData.extensionName}.connect`,
        () => extension?.connectToDiscord(),
    );

    const disconnectCmd = vscode.commands.registerCommand(
        `${ExtensionData.extensionName}.disconnect`,
        () => extension?.disconnectFromDiscord(),
    );

    const reloadCmd = vscode.commands.registerCommand(
        `${ExtensionData.extensionName}.reload`,
        () => extension?.reloadConnection(),
    );

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

    extension.connectToDiscord();
}

export function deactivate() {
    if (!extension) {
        return; // Very wierd
    }

    extension.disconnectFromDiscord();
}
