import * as vscode from "vscode";

import { getSettings } from "./settings";

//@ts-ignore
import * as RPC from "./rpc.mjs";

function getCommands(config: any, statusBarItem: vscode.StatusBarItem) {
    // Commands list for vscode
    const commands = [
		{
			name: "startRPC",
			execute: () => {
				config.extension.settings.rpc = getSettings();

				statusBarItem.text = "$(sync~spin) RPC Connecting...";
				statusBarItem.show();

				RPC.init({ clientId: config.application.id, intervalTime: config.extension.settings.rpc.updateTimeInterval * 1000 });
			}
		},
		{
			name: "stopRPC",
			execute: () => {
				RPC.stop();
			}
		},
		{
			name: "reloadRPC",
			execute: () => {
				config.extension.settings.rpc = getSettings();

				statusBarItem.text = "$(sync~spin) RPC Connecting...";
				statusBarItem.show();
				
				RPC.reload({ intervalTime: config.extension.settings.rpc.updateTimeInterval * 1000 });
			}
		},
		{
			name: "barItem",
			execute: () => {
				let commandName = RPC.getRPC() ? "reloadRPC" : "startRPC";

				const command = commands.find(command => command.name === commandName);
				command?.execute();
			}
		},
	];

    return commands;
}

export { getCommands };
