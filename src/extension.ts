// VSCode API
import * as vscode from "vscode";

// RPC
// @ts-ignore
import * as RPC from "./modules/rpc.mjs";

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

// config
// @ts-ignore
import config from "./config.json" assert { type: `json` };

const startTimestamp = new Date();

let statusBarItem: vscode.StatusBarItem;

// The extension has started
export function activate({ subscriptions }: vscode.ExtensionContext) {
	console.log("VSCode RPC enabled");

	RPC.init({ clientId: config.application.id });
	
	// Adding a command "reloadRPC" ("vscode-discord-rpc." is the extension name)
	const reloadCommand = "vscode-discord-rpc.reloadRPC";
	subscriptions.push(vscode.commands.registerCommand(reloadCommand, () => RPC.reload()));

	const stopCommand = "vscode-discord-rpc.stopRPC";
	subscriptions.push(vscode.commands.registerCommand(stopCommand, () => RPC.stop()));

	// On file open event
	subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => RPC.update()));
	
	// Make the statusBarItem have a "loading" animation with the text below
	statusBarItem.text = "$(sync~spin) RPC Connecting...";

	// Adding a statusBarItem to status bar with the command "reloadRPC"
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.command = reloadCommand;

	// Adding the statusBarItem to vscode
	subscriptions.push(statusBarItem);

	statusBarItem.show();

	RPC.on(RPC.Events.Ready, (rpc: any) => {
		console.log(`${rpc.user.username} connected!`);

		statusBarItem.text = "$(pass-filled) RPC Connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Update, (rpc: any) => {
		console.log("Updated RPC");

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
		const fileExtension = fileName?.split('.').at(-1) ?? "";

		// Problems in current file
		const problems = vscode.languages.getDiagnostics(editor.document.uri).length;

		// Column and line of the file
		const line = editor.selection.active.line + 1;
		const col = editor.selection.active.character + 1;

		// Icon ID for RPC
		let iconId = editor.document.languageId;

		// Correct spelling
		const problemsSpelling = problems === 1 ? "" : "s";

		// For some reason some files are marked as plain-text so we check file's extension
		if (iconId === "plaintext") {
			iconId = fileExtension;
		}

		// If we dont have the icon
		if (!config.application.icons.includes(iconId)) {
			iconId = "default";
		}

		rpc.setActivity({
			details: `${vscode.workspace.name}`,
			state: `${fileName}:${line}:${col} - ${problems} problem${problemsSpelling}`,
			startTimestamp,
			largeImageKey: iconId,
			instance: false,
		});
	});

	RPC.on(RPC.Events.Stop, (rpc: any) => {
		console.log("Stopped RPC");

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});

	RPC.on(RPC.Events.Error, (error: any) => {
		console.error(error);

		statusBarItem.text = "$(error) RPC Not connected";
		statusBarItem.show();
	});
}

// The extension has stopped
export function deactivate() {
	RPC.stop();
	
	console.log("Bye!");
}
