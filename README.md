# RustMon 2.0.0 - Pterodactyl Integration

Advanced Rust server administration panel with deep Pterodactyl Panel integration. See our 👉🏼 [Live Instance](https://rustmon.tercerpiso.net)

### Current features

- Multiple servers login record.
- Simple full control (Chat, Players and Console) on single screen
- **NEW**: Advanced Plugin Management with uMod.org integration
  - One-click plugin updates via SFTP
  - Plugin upload/delete directly from web UI
  - Version mismatch detection and notifications
- Permissions groups and export/import to apply on multiple servers
- **NEW**: ConVars Management
  - Edit server configuration variables through web UI
  - Real-time value updates via RCON
  - Categorized display with descriptions
- **NEW**: Pterodactyl Panel Integration
  - SFTP/FTP connection to server containers
  - Direct file system access for advanced management
  - Secure credential storage
- All configurations on a simple panel
- Reboot with time warning
- Players tools like autokick when high ping

### New in v2.0.0

- **Pterodactyl Panel Integration**: Connect directly to your Pterodactyl-hosted Rust servers
- **Advanced Plugin Manager**: Upload, update, enable/disable plugins with uMod.org integration
- **ConVars Manager**: Edit server configuration variables through a user-friendly interface
- **Enhanced Security**: Encrypted storage of sensitive credentials
- **File System Access**: Direct access to oxide/plugins and oxide/config directories

### Roadmap

- More player tools (auto respond commands, auto kick more options, Skip queue)
- Discord login screen
- Player permissions
- Discord bot to send server information, bypass messages between chat and discord channel, assign groups to discord users
- Commands memory with up arrow (rewrite last command sended) on console
- RustMon Blacklist (a blacklist of players shared between rustmon clients)

## Pterodactyl Setup

To use the new Pterodactyl integration features:

1. **Get your Pterodactyl API Key**:
   - Log into your Pterodactyl panel
   - Go to Account Settings → API Credentials
   - Create a new API key with appropriate permissions

2. **Get SFTP Details**:
   - In your server panel, go to Settings → SFTP Details
   - Note the server address, port, username, and password

3. **Configure RustMon**:
   - Click the gear icon in the top-right of RustMon
   - Select "Pterodactyl Configuration"
   - Enter your panel URL, API key, server ID, and SFTP details
   - Test the connection before saving

4. **Required Permissions**:
   - Your Pterodactyl user needs file management permissions
   - SFTP access must be enabled for your server
   - The server should have uMod/Oxide installed

**Note**: The Pterodactyl integration requires the backend service to have network access to your Pterodactyl panel and SFTP server.

## Screenshots:

### Login

![Login](https://i.imgur.com/C6AolI6.png)

### Dashboard

![dashboard](https://i.imgur.com/LBMmO1U.png)

### Server configurations

![config server](https://i.imgur.com/4eBmGje.png)

![config map](https://i.imgur.com/sH392gF.png)

### Player details and search

![player details](https://i.imgur.com/8oUQXug.png)

### Player tools

![player tools](https://i.imgur.com/nptYGlO.png)

### Plugin manager

![plugin manager](https://i.imgur.com/8qNMET3.png)

### Permissions manager
![permissions manager](https://i.imgur.com/bo3G41h.png)

### NEW: Advanced Plugin Manager
![plugin manager](https://i.imgur.com/newplugin.png)

### NEW: ConVars Manager
![convars manager](https://i.imgur.com/newconvars.png)

### NEW: Pterodactyl Configuration
![pterodactyl config](https://i.imgur.com/newptero.png)

## Architecture

RustMon now consists of three main components:

## Run and build

Install dependencies:

`npm i`

Run local dev mode:

`ng serve`

Build redist package:

`ng build --prod`

or if you don't have angular installed

`npm run buildprod`

## Environment Variables

The backend service now supports additional environment variables for Pterodactyl integration. See `user-data-srv/src/environment.ts` for the complete list.

# run with docker in server:

## Dashboard:

```
docker run -p 80:80 -itd alexander171294/rustmon:latest
```

Or see live instance in:

[rustmon.tercerpiso.net](https://rustmon.tercerpiso.net)

## Backend Service:

Api for get steam-profile, api-geolocalization, rustmap info:

First, in order to use your custom served api, you need to edit environment.prod.ts and change `http://rustmon-udata.tercerpiso.tech/` for your endpoint and rebuild docker image, or run ng build again with your changes.

Second, you need to start a redis service (it is used for cache user data).

Third, you need to run our docker image of rustmon-service with your api key and environments and expose in your endpoint:

```
docker run -p 80:3000 -e STEAM_API="YOUR-STEAM-API-KEY" -e CACHE_HOST="YOUR-REDIS-HOST" -e CACHE_AUTH="YOUR-REDIS-PASSWORD" -e CACHE_PORT="YOUR-REDIS-PORT" -itd alexander171294/rustmon-service:latest
```

### How to get my steam api key?

[See steam api key documentation](https://steamcommunity.com/dev/apikey)

TODO:
```
- Enhanced Discord integration with Pterodactyl webhooks
- finish tools
- event logs
- Remember and autoban