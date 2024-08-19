### 1.1.0 VSCode-Discord-RPC
This is an extension for vscode to display custom discord rpc.

### [Versioning](https://semver.org/#semantic-versioning-200)

## Features
- Working on, Shows in the RPC what are you currently working on
- Language icon display, displays the language icon in the RPC
- Time elapsed, self explanatory
- Problems, Problems in file currently worked on

## Requirements
- Discord installed
- [discord-rpc](https://www.npmjs.com/package/discord-rpc#discordjs-rpc-extension) package

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
- Timeout error, happens when you try to connect to discord too many times

## Release Notes
Settings added (most of them) and we need more features in this extension. Probably some new bugs with this update.

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
