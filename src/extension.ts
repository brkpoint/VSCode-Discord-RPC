// VSCode API
import * as vscode from "vscode";

// Settings stuff
import { getSettings, getInfo, parse } from "./modules/settings";

// RPC
// @ts-ignore
import * as RPC from "./modules/rpc.mjs";

// Config
// @ts-ignore
import config from "./config.json" assert { type: `json` };

interface LooseObject {
    [key: string]: any
}

// The extension has started
export function activate({ subscriptions }: vscode.ExtensionContext): void {
	console.log("VSCode RPC enabled");

	// Config setup
	config.extension.startTimestamp = new Date();
	config.extension.settings.rpc = getSettings();

	RPC.init({ clientId: config.application.id, intervalTime: config.extension.settings.rpc.updateTimeInterval * 1000 });
	
	// Adding a command "reloadRPC"
	const reloadCommand = "vscode-discord-rpc.reloadRPC";
	subscriptions.push(vscode.commands.registerCommand(reloadCommand, () => {
		config.extension.settings.rpc = getSettings();

		RPC.reload({ intervalTime: config.extension.settings.rpc.updateTimeInterval * 1000 });
	}));

	const stopCommand = "vscode-discord-rpc.stopRPC";
	subscriptions.push(vscode.commands.registerCommand(stopCommand, () => RPC.stop()));

	// On file open event
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => RPC.update()));
	
	// Adding a statusBarItem to status bar with the command "reloadRPC" and loading text
	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);

	statusBarItem.text = "$(sync~spin) RPC Connecting...";
	statusBarItem.command = reloadCommand;

	subscriptions.push(statusBarItem);
	statusBarItem.show();

	registerRpcEvents(statusBarItem);
}

// The extension has stopped
export function deactivate(): void {
	RPC.stop();
	
	console.log("Bye!");
}

// Helper function
function getActivity(editor: vscode.TextEditor | undefined, config: any): Object {
	const rpcSettings = config.extension.settings.rpc;

	const info = getInfo(editor, config);

	// Activity object to send
	let activity: LooseObject = {
		largeImageKey: "vscode",
		instance: false,
	};

	// If user enabled timestamp
	if (rpcSettings.showTime) {
		activity.startTimestamp = config.extension.startTimestamp;
	}

	// If the user is not editing code
	if (!editor) {
		activity.details = parse(rpcSettings.idle.details, info, config) ?? "Idle...";
		activity.largeImageText = parse(rpcSettings.idle.iconText, info, config) ?? "Idling...";

		// If the 'state' field is not empty, parse it and display it
		if (rpcSettings.idle.state) {
			activity.state = parse(rpcSettings.idle.state, info, config);
		}

		return activity;
	}

	activity.details = parse(rpcSettings.editing.details, info, config) ?? info.workspaceName;
	activity.largeImageText = parse(rpcSettings.editing.iconText, info, config) ?? "Editing...";

	if (rpcSettings.editing.state) {
		activity.state = parse(rpcSettings.editing.state, info, config);
	}

	// If 'showLanguageIcons' is enabled display the icon
	if (rpcSettings.editing.showLanguageIcons) {
		activity.largeImageKey = info.iconId;
	}

	return activity;
}

function registerRpcEvents(statusBarItem: vscode.StatusBarItem): void {
	RPC.on(RPC.Events.Ready, (rpc: any) => {
		console.log(`${rpc.user.username} connected!`);

		console.log(getActivity(vscode.window.activeTextEditor, config));

		statusBarItem.text = "$(pass-filled) RPC Connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Reload, (rpc: any) => {
		statusBarItem.text = "$(sync~spin) RPC Connecting...";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Update, (rpc: any) => {
		console.log("Updated RPC");

		rpc.setActivity(getActivity(vscode.window.activeTextEditor, config));
	});

	RPC.on(RPC.Events.Stop, (rpc: any) => {
		console.log("Stopped RPC");

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Error, (error: any) => {
		console.error(error);

		// If connection timeout show the message to the user
		if (error.message === "RPC_CONNECTION_TIMEOUT") {
			vscode.window.showErrorMessage("RPC connection timeout");
		}

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});
}
