import * as vscode from 'vscode';

import { Config } from './extension.config';

// Helper function for finding the corresponding icon for language.
function getIconToLanguageId(id: string | undefined): string | undefined {
    if (!id) {
        return;
    }

    for (let [icon, languageIds] of Object.entries(Config.get().rpc.icons)) {
        if (!languageIds.includes(id)) {
            continue;
        }

        return icon;
    }

    return;
}

/**
 * @description Checks if the icon is avaiable in applications image libary, and if it is it returns it.
 * @returns {string | undefined} Icon ID avaiable in applications image libary (or a default value if it cant find it).
 */
export function getIconId(): string | undefined {
    const fileExtension = getFileExtension();
    let iconId = getDetectedLanguageId();

    if (iconId === 'plaintext') {
        iconId = fileExtension;
    }

    return getIconToLanguageId(iconId);
}

/**
 * @description Gets current workspace name if any arent open it returns undefined.
 * @returns {string | undefined} Workspace name.
 */
export function getWorkspaceName(): string | undefined {
    return vscode.workspace.name;
}

/**
 * @description Gets the current file name and if none are open it returns undefined.
 * @returns {string | undefined} Current active file name.
 */
export function getFileName(): string | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const fileName = editor.document.fileName.split('/').at(-1);

    return fileName;
}

/**
 * @description Gets current file's extension and if none then returns undefined.
 * @returns {string | undefined} Current files's extension.
 */
export function getFileExtension(): string | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const fileName = getFileName();
    const fileExtension = fileName?.split('.').at(-1) ?? '';

    return fileExtension;
}

/**
 * @description Gets current language ID from workspace if no workspace is open or vscode doesnt know what language is it, it returns undefined.
 * @returns {string | undefined} Detected language ID.
 */
export function getDetectedLanguageId(): string | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const fileType = editor.document.languageId;

    return fileType;
}

/**
 * @description Gets all known problems in the current file and returns the list containing all of them, if workspace or a file isnt opened it will return undefined.
 * @returns {vscode.Diagnostic[] | undefined} Problems list.
 */
export function getProblems(): vscode.Diagnostic[] | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);

    return diagnostics;
}

/**
 * @description Gets the current line in editor and returns it, if no workspace is avaiable it will return undefined.
 * @returns {number | undefined} Number of current line.
 */
export function getCurrentLine(): number | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const line = editor.selection.active.line + 1;

    return line;
}

/**
 * @description Gets the current column in editor and returns it, if no workspace is avaiable it will return undefined.
 * @returns {number | undefined} Column of current line.
 */
export function getCurrentCol(): number | undefined {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const col = editor.selection.active.character + 1;

    return col;
}
