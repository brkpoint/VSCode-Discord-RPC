// VSCode API
import * as vscode from "vscode";

// Settings stuff
// @ts-ignore
import { getSettings, getInfo, parse } from "./modules/settings.mjs";

// RPC
// @ts-ignore
import * as RPC from "./modules/rpc.mjs";

// Config
// @ts-ignore
import config from "./config.json" assert { type: `json` };

let settings: any;

interface LooseObject {
    [key: string]: any
}

// The extension has started
export function activate({ subscriptions }: vscode.ExtensionContext): void {
	console.log("VSCode RPC enabled");
	config.extension.startTimestamp = new Date();

	settings = getSettings();

	RPC.init({ clientId: config.application.id, intervalTime: settings.updateTimeInterval * 1000 });
	
	// Adding a command "reloadRPC" ("vscode-discord-rpc." is the extension name)
	const reloadCommand = "vscode-discord-rpc.reloadRPC";
	subscriptions.push(vscode.commands.registerCommand(reloadCommand, () => {
		settings = getSettings();

		RPC.reload({ intervalTime: settings.updateTimeInterval * 1000 });
	}));

	const stopCommand = "vscode-discord-rpc.stopRPC";
	subscriptions.push(vscode.commands.registerCommand(stopCommand, () => RPC.stop()));

	// On file open event
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => RPC.update()));
	
	// Adding a statusBarItem to status bar with the command "reloadRPC" and loading text
	let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.text = "$(sync~spin) RPC Connecting...";
	statusBarItem.command = reloadCommand;

	// Adding the statusBarItem to vscode
	subscriptions.push(statusBarItem);

	statusBarItem.show();

	RPC.on(RPC.Events.Ready, (rpc: any) => {
		console.log(`${rpc.user.username} connected!`);

		statusBarItem.text = "$(pass-filled) RPC Connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Reload, (rpc: any) => {
		statusBarItem.text = "$(sync~spin) RPC Connecting...";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Update, (rpc: any) => {
		console.log("Updated RPC");

		const editor = vscode.window.activeTextEditor;

		rpc.setActivity(getActivity(editor, config));
	});

	RPC.on(RPC.Events.Stop, (rpc: any) => {
		console.log("Stopped RPC");

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Error, (error: any) => {
		console.error(error);

		if (error.message === "RPC_CONNECTION_TIMEOUT") {
			vscode.window.showErrorMessage("RPC connection timeout");
		}

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});
}

// The extension has stopped
export function deactivate(): void {
	RPC.stop();
	
	console.log("Bye!");
}

// Helper function
function getActivity(editor: vscode.TextEditor | undefined, config: any): Object {
	const info = getInfo(editor, config);

	let activity: LooseObject = {
		largeImageKey: "vscode",
		instance: false,
	};

	if (settings.showTime) {
		activity.startTimestamp = config.extension.startTimestamp;
	}

	// If the user is not editing code
	if (!editor) {
		activity.details = parse(settings.idle.details, info) ?? "Idle...";
		activity.largeImageText = parse(settings.idle.iconText, info) ?? "Idling...";

		if (settings.idle.state) {
			activity.state = parse(settings.idle.state, info);
		}

		return activity;
	}

	activity.details = parse(settings.editing.details, info) ?? info.workspaceName;
	activity.largeImageText = parse(settings.editing.iconText, info) ?? "Editing...";

	if (settings.editing.state) {
		activity.state = parse(settings.editing.state, info);
	}

	if (settings.editing.showLanguageIcons) {
		activity.largeImageKey = info.iconId;
	}

	return activity;
}
