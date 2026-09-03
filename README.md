<div class="main" align="center">
    <div>
        <h1>3.0.0 VSC-PRESENCE</h1>
    </div>
    <br>
    <img alt="vsc-presence-icon" src="./icon.png" width=128>
    <br><br>
    <img alt="Visual Studio Marketplace Rating" src="https://img.shields.io/visual-studio-marketplace/stars/brkpoint.vsc-presence">
    <br><br>
    <div class="main link">
        <a href="https://marketplace.visualstudio.com/items?itemName=brkpoint.vsc-presence" target="_blank">
            <img alt="Visual Studio Marketplace icon" src="https://gdm-catalog-fmapi-prod.imgix.net/ProductLogo/1b6d695a-be0d-4aaf-920f-675585b5bb9c.png?auto=format&ixlib=react-9.0.3" style="margin-right: 10px;" width=28>
        </a>
        <img alt="Visual Studio Marketplace Version" src="https://img.shields.io/visual-studio-marketplace/v/brkpoint.vsc-presence">
        <img alt="Visual Studio Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/brkpoint.vsc-presence">
        <img alt="Visual Studio Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/brkpoint.vsc-presence">
    </div>
    <div class="main link">
        <a href="https://github.com/brkpoint/VSCode-Discord-RPC" target="_blank">
            <img alt="Github icon" src="https://img.icons8.com/?size=96&id=fmFqQmR0UdsR&format=png" width=40>
        </a>
        <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub Created At" src="https://img.shields.io/github/created-at/brkpoint/VSCode-Discord-RPC">
        <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/brkpoint/VSCode-Discord-RPC">
    </div>
</div>

## About the extension

Connects to Discord and sets a custom RP.
(before known as "Simple RP")

IF ANY ISSUES/BUGS ACCURE, PLEASE REPORT THEM ([issues](https://github.com/brkpoint/VSCode-Discord-RPC/issues)).

### [Versioning](https://semver.org/#semantic-versioning-200)

## Features

- Working on, Shows in the RP what are you currently working on
- Language icon display, displays the language icon in the RP
- Time elapsed
- Problems count
- Issues reporter

## Requirements

- Discord installed
- [Activity enabled in discord](#activity-setting-in-discord)

### Activity setting in discord

First go to settings, then scroll down to category `ACTIVITY SETTINGS`. After that click on `Activity Privacy` and enable `Share detected activities with others`.
If the setting is disabled the presence wont show up on your discord profile.

## Placeholders

You can use those place holders everywhere in the extension settings.

| String to format | Description                   |
| ---------------- | ----------------------------- |
| `$(workspace)`   | workspace's name              |
| `$(problems)`    | problems in file              |
| `$(fileName)`    | file's name                   |
| `$(fileType)`    | file's type                   |
| `$(line)`        | current cursor line position  |
| `$(column)`      | cursor column position        |
| `$(displayName)` | user's display name (discord) |
| `$(username)`    | user's username (discord)     |

## Known Issues

None at the moment.

## Release Notes

Rewritten all of the previous code. I know it was garbage.

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
