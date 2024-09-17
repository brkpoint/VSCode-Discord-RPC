# Change Log

## [1.1.6] - 2024-09-17
### Added
- automatic timeout reconnect (if internet is avaiable and after discord is open)
### Fixed
- timeout spam

## [1.1.5] - 2024-08-22
### Added
- `setActivity` function to 'rpc.mjs'
- Error `RPC_CONNECTION_TIMEOUT` to discord's activity promise timeout
### Fixed
- Discord reloading bug.

## [1.1.4] - 2024-08-20
### Updated
- 'rpc.mjs'

## [1.1.3] - 2024-08-20
### Updated
- `statusBarItem.command` so its dynamic (reloads when RPC is on, starts it when it isnt)
### Fixed
- Commands bug for reloading

## [1.1.2] - 2024-08-20
### Updated
- Error handling in 'rpc.mjs'
### Fixed
- Some minor bugs in 'extension.ts'

## [1.1.1] - 2024-08-19
### Added
- `extension.settings.parses` to 'config.json' file.
### Updated
- `vscode-discord-rpc.updateTimeInterval` default seconds from `15` to `12`
- Renamed 'settings.mjs' to 'settings.ts' and refactored some code

## [1.1.0] - 2024-08-18/19
### Added
- Settings for extension
- New module 'settings.mjs'
- Custom RPC fields and icon customizaton
- Hot reload for settings
### Fixed
- Error handling

## [1.0.1] - 2024-08-17
### Fixed
- Fixed bug.

## [1.0.0] - 2024-08-17
### Added
- 'rpc.mjs' module
- rewrote some of the code
- More console logs
### Fixed
- versioning
- dates in 'CHANGELOG.md'
### Removed
- "Working on ..." text from RPC

## [0.1.0] - 2024-08-17
### Added
- Command to stop RPC (`vscode-discord-rpc.stopRPC`)
- File problems in RPC
- Added repo to 'package.json'
- More `console.logs`
### Updated
- 'README.md' file
- File icon finding
### Removed
- Test module (isnt needed)

## [0.0.3] - 2024-08-17
### Added
- Changelog in 'CHANGLELOG.md' file
### Removed
- Template text from the 'CHANGELOG.md'

## [0.0.2] - 2024-08-17
### Added
- Icon for extension

## [0.0.1] - 2024-08-17
### Added
- The basic rpc
- `statusBarItem` for displaying information about rpc connection
- 'README.md' file
