import * as vscode from 'vscode';

import { LooseObject } from './utils';
import {
    getWorkspaceName,
    getFileName,
    getFileExtension,
    getDetectedLanguageId,
    getProblems,
    getCurrentLine,
    getCurrentCol,
} from './extension.workspace';

// Config class //
// Config handler and vscode's settings handler.
// Parser for strings:
// | ----------------------------------------------- |
// | String to format | Description                  |
// | ---------------- | ---------------------------- |
// | `$(fileName)`    | file's name                  |
// | `$(fileType)`    | file's type                  |
// | `$(workspace)`   | workspace's name             |
// | `$(problems)`    | problems in file             |
// | `$(line)`        | current cursor line position |
// | `$(col)`         | cursor column position       |
// | ----------------------------------------------- |

function getInfo(): LooseObject {
    let ret: LooseObject = {
        workspaceName: getWorkspaceName(),
        fileName: getFileName(),
        fileExtension: getFileExtension(),
        fileType: getDetectedLanguageId(),
        problems: undefined,
        line: getCurrentLine(),
        col: getCurrentCol(),
    };

    const diagnostics = getProblems();
    if (diagnostics) {
        ret.problems = `${diagnostics.length} problem${
            diagnostics.length === 1 ? '' : 's'
        }`;
    }

    return ret;
}

// Not accesible Config in Config class.
class ConfigClass {
    // Extension settings
    extension: LooseObject = {
        name: 'vscode-discord-rpc',
        settings: {},
    };

    // Logger settings
    logger = {
        debug: process.env.NODE_ENV !== 'production',
        disabledMessages: 1, // print except
    };

    // String to parse
    parses = [
        {
            string: '$(fileName)',
            into: 'fileName',
        },
        {
            string: '$(fileType)',
            into: 'fileType',
        },
        {
            string: '$(workspace)',
            into: 'workspaceName',
        },
        {
            string: '$(problems)',
            into: 'problems',
        },
        {
            string: '$(line)',
            into: 'line',
        },
        {
            string: '$(col)',
            into: 'col',
        },
    ];

    // RPC settings
    rpc = {
        applicationId: '1273940066603106328', // application ID (holds all image keys for 'largeImage' value)
        // Avaiable icons
        icons: {
            javascript: ['javascript'],
            typescript: ['typescript'],
            json: ['json'],
            ignore: ['ignore'],
            markdown: ['markdown'],
            html: ['html'],
            css: ['css'],
            c: ['c'],
            cpp: ['cpp'],
            csharp: ['csharp'],
            rust: ['rust'],
            swift: ['swift'],
            lua: ['lua'],
            python: ['python'],
            java: ['java'],
            asm: ['asm-intel-x86-generic'],
            bin: ['bin'],
        },
    };
}

/**
 * @description Config file with extension settings.
 */
export class Config {
    private static config: ConfigClass = new ConfigClass();

    // Loades extension settings into config
    static load() {
        if (!vscode.workspace) {
            return;
        }

        this.config.extension.settings = vscode.workspace.getConfiguration(
            this.config.extension.name,
        );
    }

    static get(): ConfigClass {
        return this.config;
    }

    /**
     * | String to format | Description                  |
     * | ---------------- | ---------------------------- |
     * | `$(fileName)`    | file's name                  |
     * | `$(fileType)`    | file's type                  |
     * | `$(workspace)`   | workspace's name             |
     * | `$(problems)`    | problems in file             |
     * | `$(line)`        | current cursor line position |
     * | `$(col)`         | cursor column position       |
     * @param {string | undefined} unparsed Uparsed string, parsed:
     * @returns {string | undefined} Parsed string.
     */
    static parse(unparsed: string | undefined): string | undefined {
        if (!unparsed) {
            return;
        }

        const workspaceInfo = getInfo();

        for (const parse of this.config.parses) {
            unparsed = unparsed.replace(
                parse.string,
                workspaceInfo[parse.into] ?? 'N/A',
            );
        }

        return unparsed;
    }
}
