// VSCode API
import * as vscode from "vscode";

// Discord RPC api
const { Client, register } = require("discord-rpc");

// Application id
const applicationID = "1273940066603106328";
// Avaiable icons for the app
const icons = [
	"javascript",
	"typescript",
	"json",
	"ignore",
	"markdown",
	"html",
	"css",
	"c",
	"cpp",
	"csharp",
	"rust",
	"swift",
	"lua",
	"python",
	"java",
	"asm-intel-x86-generic",
];
// Start of the RPC
const startTimestamp = new Date();

let rpc: any;

/* -- RPC activity object --
{
	details: "",
	state: "",
	startTimestamp,
	largeImageKey: "",
	largeImageText: "",
	smallImageKey: "",
	smallImageTest: "",
	instance: false,
}
*/

let statusBarItem: vscode.StatusBarItem;

// Activation
export function activate({ subscriptions }: vscode.ExtensionContext) {
	console.log("VSCode RPC enabled");
	
	// Adding a command "reloadRPC" ("vscode-rpc." is the extension name)
	const reloadCommand = "vscode-rpc.reloadRPC";
	subscriptions.push(vscode.commands.registerCommand(reloadCommand, () => {
		initRPC();
	}));
	
	// Adding a statusBarItem to status bar with the command "reloadRPC"
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.command = reloadCommand;
	// Make the statusBarItem have a "loading" animation with the text below
	statusBarItem.text = "$(sync~spin) RPC Connecting...";
	// Showing statusBarItem
	statusBarItem.show();
	
	// Adding the statusBarItem to vscode
	subscriptions.push(statusBarItem);

	// On file open event
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
		updateRPC();
	}));
	
	initRPC();
}

// Deactivation
export function deactivate() {

}

// Initializing and seting up RPC
function initRPC(): void {
	register(applicationID);
	console.log("Registered app ID");

	rpc = new Client({ transport: 'ipc' });
	
	rpc.on("ready", () => {
		console.log(`User: ${rpc.user.username} detected`);

		// Seting the activity
		updateRPC();

		// Updating the activity once per 15 seconds
		setInterval(() => {
			updateRPC();
			statusBarItem.text = "$(pass-filled) RPC Connected";
		}, 15000);
	});

	rpc.login({ clientId: applicationID }).catch((error: any) => {
		// Error logging
		console.error("Error trying to connect to discord");
		console.error(error);

		statusBarItem.text = "$(error) RPC Not connected";
		return;
	});

	statusBarItem.text = "$(pass-filled) RPC Connected";
}

function updateRPC(): void {
	console.log("Updating the RPC");

	// If something failed
	if (!rpc) {
		console.error("Error trying to connect to discord");
		statusBarItem.text = "$(error) RPC Not connected";
		return;
	}

	const editor = vscode.window.activeTextEditor;

	// If the user is editing the code
	if (editor) {
		const workspaceName = vscode.workspace.name;

		const fileName = editor.document.fileName.split("/").at(-1);
		// Column and line of the file
		const line = editor.selection.active.line + 1;
		const col = editor.selection.active.character + 1;

		let iconId = editor.document.languageId;

		// If we dont have the icon of the file
		if (!icons.includes(iconId)) {
			iconId = "default";
		}

		// For some reason ".bin" files are marked as plain text files so we check for bin files
		if (iconId === "plaintext") {
			iconId = fileName?.split('.').at(-1) === "bin" ? "bin" : "default";
		}

		rpc.setActivity({
			details: `Working on ${workspaceName}`,
			state: `${fileName}:${line}:${col}`,
			startTimestamp,
			largeImageKey: iconId,
			instance: false,
		});
		return;
	}

	// Idle activity
	rpc.setActivity({
		details: "Ilde...",
		startTimestamp,
		largeImageKey: "vscode",
		instance: false,
	});
}
