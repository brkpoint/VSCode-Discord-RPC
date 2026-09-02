import * as vscode from "vscode";
import * as path from "path";
import { ExtensionData } from "./data";

export namespace WorkspaceData {
	/**
	 * @description Checks if the icon is avaiable in applications image libary, and if it is it returns it.
	 * @returns {string} Icon ID avaiable in applications image libary.
	 */
	export function getIconId(): string {
		let iconId = getDetectedLanguageId();
		const fileExtension = getFileExtension();

		if (!iconId || !fileExtension) {
			return "vscode";
		}

		if (iconId === "plaintext" || iconId === "platformio-debug.asm") {
			return ExtensionData.getIconForLang(fileExtension);
		}

		return ExtensionData.getIconForLang(iconId);
	}

	/**
	 * @description Gets current workspace name if any arent open it returns none.
	 * @returns {string} Workspace name.
	 */
	export function getWorkspaceName(): string {
		const folders = vscode.workspace.workspaceFolders;
		const name = folders?.[0] ? path.basename(folders[0].uri.fsPath) : "none";

		return name;
	}

	/**
	 * @description Gets the current file name and if none are open it returns "none".
	 * @returns {string} Current active file name.
	 */
	export function getFileName(): string {
		const editor = vscode.window.activeTextEditor;
		const fileName = editor?.document.fileName.split("/").at(-1);

		if (!editor || !fileName) {
			return "none";
		}

		return fileName;
	}

	/**
	 * @description Gets current file's extension and if none then returns "none".
	 * @returns {string} Current files's extension.
	 */
	export function getFileExtension(): string {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return "none";
		}

		const fileName = getFileName();
		const fileExtension = fileName?.split(".").at(-1) ?? "";

		return fileExtension;
	}

	/**
	 * @description Gets current language ID from workspace if no workspace is open or vscode doesnt know what language is it, it returns "none".
	 * @returns {string} Detected language ID.
	 */
	export function getDetectedLanguageId(): string {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return "none";
		}

		const fileType = editor.document.languageId;

		return fileType;
	}

	/**
	 * @description Gets all known problems in the current file and returns the list containing all of them, if workspace or a file isnt opened it will return [].
	 * @returns {vscode.Diagnostic[]} Problems list.
	 */
	export function getProblems(
		severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error,
	): vscode.Diagnostic[] {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return [];
		}

		const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
		const filteredDiagnostics = diagnostics.filter(
			(e) => e.severity === severity,
		);

		return filteredDiagnostics;
	}

	/**
	 * @description Counts all problems in the current file.
	 * @returns {number} Problems count.
	 */
	export function getProblemsCount(): number {
		const problems = getProblems();

		if (problems.length === 0) {
			return 0;
		}

		const count = problems.length;

		return count;
	}

	/**
	 * @description Gets the current line in editor and returns it, if no workspace is avaiable it will return 0.
	 * @returns {number} Number of current line.
	 */
	export function getCurrentLine(): number {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return 0;
		}

		const line = editor.selection.active.line + 1;

		return line;
	}

	/**
	 * @description Gets the current column in editor and returns it, if no workspace is avaiable it will return 0.
	 * @returns {number} Column of current line.
	 */
	export function getCurrentColumn(): number {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return 0;
		}

		const col = editor.selection.active.character + 1;

		return col;
	}

	/**
	 * @description Checks if user is editing any files.
	 * @returns {boolean} Is the user idle.
	 */
	export function isIdle(): boolean {
		const editor = vscode.window.activeTextEditor;

		return !editor;
	}
}
