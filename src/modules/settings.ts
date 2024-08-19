import * as vscode from "vscode";

function getSettings() {
    if (!vscode.workspace) {
        console.error("No workspace detected!");
        return;
    }

    // Return extension setting
    return vscode.workspace.getConfiguration("vscode-discord-rpc");
}

function getInfo(editor: any, config: any) {
    const workspaceName = vscode.workspace.name;

    if (!editor) {
        return { workspaceName };
    }

    // Only the file name and extension
    const fileName = editor.document.fileName.split("/").at(-1);
    const fileExtension = fileName?.split('.').at(-1) ?? "";
    const fileType = editor.document.languageId;

    // Problems in current file
    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri).length;
    const problems = `${diagnostics} problem${diagnostics === 1 ? "" : "s"}`;

    // Column and line of the file
    const line = editor.selection.active.line + 1;
    const col = editor.selection.active.character + 1;

    // Icon ID for RPC
    let iconId = fileType;

    // For some reason some files are marked as plain-text so we check file's extension
    if (iconId === "plaintext") {
        iconId = fileExtension;
    }

    // If we dont have the icon
    if (!config.application.icons.includes(iconId)) {
        iconId = "default";
    }

    return { fileName, fileExtension, fileType, workspaceName, problems, line, col, iconId };
}

// Parsing activity string into string with variables
function parse(string: string, info: any, config: any): string {
    // Format the string
    for (const parse of config.extension.settings.parses) {
        string = string.replace(parse.string, info[parse.into] ?? "N/A");
    }

    return string;
}

export { getSettings, getInfo, parse };
