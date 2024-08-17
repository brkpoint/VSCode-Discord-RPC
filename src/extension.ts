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
	"bin",
];
// Start of the RPC
const startTimestamp = new Date();

let rpc: any;

// Interval for updating RPC
let refreshIntervalId: any;

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

// The extension has started
export function activate({ subscriptions }: vscode.ExtensionContext) {
	console.log("VSCode RPC enabled");
	
	// Adding a command "reloadRPC" ("vscode-discord-rpc." is the extension name)
	const reloadCommand = "vscode-discord-rpc.reloadRPC";
	subscriptions.push(vscode.commands.registerCommand(reloadCommand, () => {
		initRPC();
	}));

	const stopCommand = "vscode-discord-rpc.stopRPC";
	subscriptions.push(vscode.commands.registerCommand(stopCommand, () => {
		// If there isnt any intervals we dont stop it
		if (!refreshIntervalId) {
			return;
		}

		stopRPC();
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

// The extension has stopped
export function deactivate() {
	stopRPC();
	
	console.log("Bye!");
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
		refreshIntervalId =  setInterval(() => {
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

function stopRPC(): void {
	console.log("Stopping RPC...");
	
	// Destroying the rpc
	rpc.destroy();
	rpc = null;

	// Removing the interval from running
	clearInterval(refreshIntervalId);
	refreshIntervalId = null;

	console.log("RPC Stopped");
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

	// If the user is not editing the code
	if (!editor) {
		// Idle activity
		rpc.setActivity({
			details: "Ilde...",
			startTimestamp,
			largeImageKey: "vscode",
			instance: false,
		});

		return;
	}

	// Only the file name and extension
	const fileName = editor.document.fileName.split("/").at(-1);

	// Problems in current file
	const diagnostics = vscode.languages.getDiagnostics(editor.document.uri).length;

	// Correct spelling
	const diagnosticsEnd = diagnostics === 1 ? "" : "s";

	// Column and line of the file
	const line = editor.selection.active.line + 1;
	const col = editor.selection.active.character + 1;

	// Icon ID for RPC
	let iconId = editor.document.languageId;

	// For some reason some files are marked as plain-text so we check file's extension
	if (iconId === "plaintext") {
		iconId = fileName?.split('.').at(-1) ?? "";
	}

	// If we dont have the icon
	if (!icons.includes(iconId)) {
		iconId = "default";
	}

	rpc.setActivity({
		details: `Working on ${vscode.workspace.name}`,
		state: `${fileName}:${line}:${col} - ${diagnostics} problem${diagnosticsEnd}`,
		startTimestamp,
		largeImageKey: iconId,
		instance: false,
	});
}
