<div class="main">
    <div>
        <h1>2.2.0 VSCode-Discord-RPC</h1>
    </div>
    <img alt="VSCRPC-icon" src="./icon.png" width=128>
    <br>
    <img alt="Visual Studio Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/stars/brkpointdotorg.vscode-discord-rpc">
    <br><br>
    <div class="main link">
        <a href="https://marketplace.visualstudio.com/items?itemName=brkpointdotorg.vscode-discord-rpc" target="about:blank">
            <img alt="Visual Studio Marketplace icon" src="https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/1b6d695a-be0d-4aaf-920f-675585b5bb9c.png?auto=format&ixlib=react-9.0.3" style="margin-right: 10px;" width=42>
        </a>
        <img alt="Visual Studio Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/brkpointdotorg.vscode-discord-rpc">
        <img alt="Visual Studio Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/brkpointdotorg.vscode-discord-rpc">
        <img alt="Visual Studio Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/brkpointdotorg.vscode-discord-rpc">
    </div>
    <div class="main link">
        <a href="https://github.com/brkpoint/VSCode-Discord-RPC" target="about:blank">
            <img alt="Github icon" src="https://img.icons8.com/?size=96&id=fmFqQmR0UdsR&format=png" width=64>
        </a>
        <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub Created At" src="https://img.shields.io/github/created-at/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/brkpoint/VSCode-Discord-RPC">
    </div>
</div>

## About the extension

Connects to discord and displays custom RPC.

IF ANY ISSUES/BUGS ACCURE, PLEASE REPORT THEM.

### [Versioning](https://semver.org/#semantic-versioning-200)

## Features

-   Caching discords IPC pipe path for faster loading
-   Working on, Shows in the RPC what are you currently working on
-   Language icon display, displays the language icon in the RPC
-   Time elapsed, self explanatory
-   Problems, Problems in file currently worked on
-   Automatic restart when discord disconnects
-   Issues reporter

## Requirements

-   Discord installed
-   [Activity enabled in discord](#activity-setting-in-discord)
-   [WebSocket](https://www.npmjs.com/package/ws)
-   [glob](https://www.npmjs.com/package/glob)

### Activity setting in discord

First go to settings, then scroll down to category `ACTIVITY SETTINGS`. After that click on `Activity Privacy` and enable `Share detected activities with others`.
If the setting is disabled the presence wont show up on your discord profile.

## Extension Settings

| String to format | Description                  |
| ---------------- | ---------------------------- |
| `$(fileName)`    | file's name                  |
| `$(fileType)`    | file's type                  |
| `$(workspace)`   | workspace's name             |
| `$(problems)`    | problems in file             |
| `$(line)`        | current cursor line position |
| `$(col)`         | cursor column position       |

### Show Time

Show elapsed time in custom RPC

### Update Time Interval

Time interval for updates in seconds (default: 15).

### Editing > Show Language Icon

`vscode-discord-rpc.showTime`

Shows a icon for the language of a file currently worked on.

### Editing > Details

`vscode-discord-rpc.editing.details`

Discord's RPC details field (first field).

### Editing > State

`vscode-discord-rpc.editing.state`

Discord's RPC state field (second field).

### Editing > Icon Text

`vscode-discord-rpc.editing.iconText`

Text of an icon when hovered over in RPC.

### Idle > Details

`vscode-discord-rpc.idle.details`

Same as `vscode-discord-rpc.editing.details` but when not editing a file (`$(workspace)` only avaiable).

### Idle > State

`vscode-discord-rpc.idle.state`

Same as `vscode-discord-rpc.editing.state`

### Idle > Icon Text

`vscode-discord-rpc.idle.iconText`

Same as `vscode-discord-rpc.editing.iconText`

## Known Issues

None at the moment.

## Release Notes

More size reduction, added commands and events handlers.

<style>
    .main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .link {
        flex-direction: row;
        justify-content: center;
    }

    .link img {
        margin: 2px;
    }

    .link a {
        text-decoration: none;
    }

    .link a:focus {
        outline: none;
    }
</style>
