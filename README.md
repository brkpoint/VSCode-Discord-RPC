### 1.1.5 VSCode-Discord-RPC
This is an extension for vscode to display custom discord rpc.

### [Versioning](https://semver.org/#semantic-versioning-200)

## Features
- Working on, Shows in the RPC what are you currently working on
- Language icon display, displays the language icon in the RPC
- Time elapsed, self explanatory
- Problems, Problems in file currently worked on
- Automatic restart when discord disconnects

## Requirements
- Discord installed
- [Activity enabled in discord](#activity-setting-in-discord)
- [discord-rpc](https://www.npmjs.com/package/discord-rpc#discordjs-rpc-extension) package

### Activity setting in discord
#### Enabling the activity:
First go to settings, then scroll down to category `ACTIVITY SETTINGS`. After that click on `Activity Privacy` and enable `Share detected activities with others`.

## Extension Settings
String to format | Description
--- | ---
`$(fileName)` | file's name
`$(fileType)` | file's type
`$(workspace)` | workspace's name
`$(problems)` | problems in file
`$(line)` | current cursor line position
`$(col)` | cursor column position

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
None.

## Release Notes
Timeout spam (in vscode error boxes) fixed and auto-reconnect added.

### 1.1.6
Timeout stuff fixed and working

### 1.1.5
Fixed discord reloading bug. 

### 1.1.4
Some code things.

### 1.1.3
More bug fixes for the rpc, added 'commands.ts' module for command seperation and easier command creation

### 1.1.2
Bug fixes and error handling.

### 1.1.1
Code fixes and some small refactorings.

### 1.1.0
Settings for the extension, some code refactoring and some other things added.

### 1.0.1
Fixed bug.

### 1.0.0
'rpc.mjs' file as a helper module for discord-rpc. Also fixed the versioning

### 0.1.0
`vscode-discord-rpc.stopRPC` command, small bug fixes.

### 0.0.3
Updated 'CHANGELOG.md' file

### 0.0.2
Alpha release of VSCode-Discord-RPC
