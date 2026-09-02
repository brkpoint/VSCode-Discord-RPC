import * as vscode from 'vscode';
import { WorkspaceData } from './workspace';

/**
 * EXTENSION DATA
 *
 * Extension's data parser/giver/setter.
 */
export namespace ExtensionData {
    // Extension specific
    export const extensionName = 'vscode-discord-rpc';
    export const extensionId = `brkpointdotorg.${extensionName}`;

    const config = vscode.workspace.getConfiguration(
        ExtensionData.extensionName,
    );

    // Activity
    const _activityName = config.get<string>(
        'activityName',
        'Visual Studio Code',
    );
    const _activityStealthMode = config.get<boolean>(
        'activityStealthMode',
        false,
    );
    const _activityIdleTitleText = config.get<string>(
        'activityIdleTitleText',
        'Idle...',
    );
    const _statusBarItemDefaultText = config.get<string>(
        'statusBarItemDefaultText',
        '$(sync~spin) Connecting',
    );
    const _activityIdleDescriptionText = config.get<string>(
        'activityIdleDescriptionText',
        '',
    );
    const _activityTitleText = config.get<string>(
        'activityTitleText',
        '$(workspace)',
    );
    const _activityDescriptionText = config.get<string>(
        'activityDescriptionText',
        '$(fileName) $(line):$(column) - $(problems) problems',
    );
    const _allowActivityTimestamp = config.get<boolean>(
        'allowActivityTimestamp',
        true,
    );
    // StatusBarItem
    const _statusBarItemConnectedText = config.get<string>(
        'statusBarItemConnectedText',
        '$(pass-filled) $(displayName)',
    );
    const _statusBarItemDisconnectedText = config.get<string>(
        'statusBarItemDisconnectedText',
        '$(error) Disconnected',
    );
    const _discordApplicationId = config.get<string>(
        'discordApplicationId',
        '1273940066603106328',
    );
    // Discord
    let _displayName: string = 'none';
    let _username: string = 'none';
    // Icons
    const _langToIcon = new Map<string, string>([
        ['javascript', 'javascript'],
        ['typescriptreact', 'tsx'],
        ['typescript', 'typescript'],
        ['javascriptreact', 'jsx'],
        ['vue', 'vue'],
        ['scss', 'scss'],
        ['json', 'json'],
        ['ignore', 'ignore'],
        ['markdown', 'markdown'],
        ['html', 'html'],
        ['css', 'css'],
        ['c', 'c'],
        ['cpp', 'cpp'],
        ['csharp', 'csharp'],
        ['rust', 'rust'],
        ['swift', 'swift'],
        ['lua', 'lua'],
        ['python', 'python'],
        ['java', 'java'],
        ['asm', 'asm'],
        ['s', 'asm'],
        ['bin', 'bin'],
    ]);

    /**
     * GETTERS
     */

    export function getActivityName(): string {
        return _resolveTemplate(_activityName);
    }

    export function isInActivityStealthMode(): boolean {
        return _activityStealthMode;
    }

    export function getActivityIdleTitleText(): string {
        return _resolveTemplate(_activityIdleTitleText);
    }

    export function getActivityIdleDescriptionText(): string {
        return _resolveTemplate(_activityIdleDescriptionText);
    }

    export function getActivityTitleText(): string {
        return _resolveTemplate(_activityTitleText);
    }

    export function getActivityDescriptionText(): string {
        return _resolveTemplate(_activityDescriptionText);
    }

    export function isAllowingActivityTimestamp(): boolean {
        return _allowActivityTimestamp;
    }

    export function getStatusBarItemDefaultText(): string {
        return _resolveTemplate(_statusBarItemDefaultText);
    }

    export function getStatusBarItemConnectedText(): string {
        return _resolveTemplate(_statusBarItemConnectedText);
    }

    export function getStatusBarItemDisconnectedText(): string {
        return _resolveTemplate(_statusBarItemDisconnectedText);
    }

    export function getDiscordApplicationId(): string {
        return _discordApplicationId;
    }

    export function getDisplayName(): string {
        return _displayName;
    }

    export function getUsername(): string {
        return _username;
    }

    export function getIconForLang(lang: string): string {
        return _langToIcon.get(lang) ?? 'vscode';
    }

    /**
     * SETTERS
     */

    export function setDisplayName(name: string | undefined) {
        if (!name) {
            return;
        }

        _displayName = name;
    }

    export function setUsername(name: string | undefined) {
        if (!name) {
            return;
        }

        _username = name;
    }

    /**
     * HELPERS
     *
     * Just the parse function.
     */

    type TemplateKey =
        | 'workspace'
        | 'problems'
        | 'fileName'
        | 'fileType'
        | 'language'
        | 'line'
        | 'column'
        | 'displayName'
        | 'username';

    type TemplateVars = Record<TemplateKey, () => string>;

    const _vars: TemplateVars = {
        workspace: () => WorkspaceData.getWorkspaceName(),
        problems: () => WorkspaceData.getProblemsCount().toString(),
        fileName: () => WorkspaceData.getFileName(),
        fileType: () => WorkspaceData.getFileExtension(),
        language: () => WorkspaceData.getDetectedLanguageId(),
        line: () => WorkspaceData.getCurrentLine().toString(),
        column: () => WorkspaceData.getCurrentColumn().toString(),
        displayName: () => _displayName,
        username: () => _username,
    };

    function _resolveTemplate(template: string): string {
        return template.replace(
            /\$\(([^)]+)\)/g,
            (match: string, key: TemplateKey) => {
                const resolver = _vars[key];
                return resolver ? resolver() : match;
            },
        );
    }
}
