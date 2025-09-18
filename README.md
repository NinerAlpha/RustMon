# RustMon 3.0.0 - Multi-User SaaS Platform

Advanced multi-user Rust server management platform with deep Pterodactyl Panel integration and modern authentication. See our 👉🏼 [Live Instance](https://rustmon.tercerpiso.net)

### Current features

- **Multi-User Platform**: Support for multiple users with secure authentication
- **OAuth Integration**: Login with Discord, Steam, or Google
- **Server Management**: Add and manage multiple Rust servers per user
- **Modern UI**: Completely redesigned interface with modern design principles
- **NEW**: Advanced Plugin Management with uMod.org integration
  - One-click plugin updates via SFTP
  - Plugin upload/delete directly from web UI
  - Version mismatch detection and notifications
  - Support for both Oxide and Carbon frameworks
- **Enhanced Permissions Management**
  - Plugin-based permission organization
  - Visual permission toggles
  - Per-user and per-group permissions
  - Import/export functionality
- **NEW**: ConVars Management
  - Edit server configuration variables through web UI
  - Real-time value updates via RCON
  - Categorized display with descriptions
- **Enhanced Pterodactyl Panel Integration**
  - SFTP/FTP connection to server containers
  - Direct file system access for advanced management
  - Secure credential storage
- **Automated Wipe Management**
  - Schedule weekly, monthly, or bi-weekly wipes
  - Custom map support and random seed generation
  - Configurable wipe options (map, player data, blueprints)
  - Startup command execution
- Real-time chat, player management, and console access
- Player tools including auto-kick functionality

### New in v3.0.0

- **Multi-User SaaS Platform**: Complete transformation to support multiple users
- **Modern Authentication**: OAuth integration with Discord, Steam, and Google
- **User Dashboard**: Centralized server management for each user
- **Enhanced Plugin Manager**: Support for both Oxide and Carbon frameworks
- **Advanced Permissions UI**: Plugin-based permission organization with visual toggles
- **Automated Wipe System**: Comprehensive wipe scheduling and management
- **Modern UI Design**: Complete redesign with improved UX and visual appeal
- **Enhanced Security**: JWT-based authentication and encrypted credential storage

### Roadmap

- **Discord Bot Integration**: Server notifications and chat bridging
- **Advanced Player Tools**: Auto-respond commands, enhanced auto-kick options
- **Shared Blacklist**: Community-driven player blacklist system
- **Mobile App**: Native mobile application for server monitoring
- **Analytics Dashboard**: Server performance analytics and insights
- **Team Management**: Multi-admin support with role-based permissions
- **API Access**: RESTful API for third-party integrations

## Getting Started

### 1. Authentication Setup

Set up OAuth applications for authentication providers:

**Discord Application:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Add redirect URI: `http://your-domain.com/auth/discord/callback`
4. Note the Client ID and Client Secret

**Steam Authentication:**
1. Get your Steam API key from [Steam Dev Portal](https://steamcommunity.com/dev/apikey)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://your-domain.com/auth/google/callback`

### 2. Environment Variables

Update your environment variables:

```bash
# Authentication
JWT_SECRET=your-super-secret-jwt-key
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
STEAM_API_KEY=your-steam-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:4200
API_URL=http://localhost:3000
```

### 3. Adding Your First Server

1. **Login**: Use Discord, Steam, or Google to authenticate
2. **Add Server**: Click "Add Server" in your dashboard
3. **Choose Connection Type**:
   - **RCON Only**: Basic connection for chat/console access
   - **Pterodactyl Panel**: Full integration with advanced features
4. **Configure**: Enter your server details and test the connection
5. **Manage**: Access your server's management interface

### 4. Pterodactyl Integration

For advanced features, configure Pterodactyl integration:

1. **API Key**: Get from your Pterodactyl panel (Account → API Credentials)
2. **SFTP Details**: Found in your server's Settings → SFTP Details
3. **Permissions**: Ensure file management and SFTP access are enabled
4. **Framework**: RustMon automatically detects Oxide or Carbon

## Screenshots:

### New Landing Page
![Landing](https://i.imgur.com/newlanding.png)

### User Dashboard
![User Dashboard](https://i.imgur.com/newdashboard.png)

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

### NEW: Enhanced Permissions Manager
![permissions v2](https://i.imgur.com/newperms.png)

### NEW: Wipe Manager
![wipe manager](https://i.imgur.com/newwipe.png)

## Architecture

RustMon 3.0 is a complete SaaS platform consisting of:

### Frontend (Angular)
- **Landing Page**: Marketing page with OAuth login options
- **User Dashboard**: Server management interface for authenticated users
- **Server Management**: Individual server control panels
- **Modern UI**: Responsive design with improved UX

### Backend (NestJS)
- **Authentication Service**: OAuth integration with multiple providers
- **Server Management**: CRUD operations for user servers
- **Pterodactyl Integration**: SFTP and API integration
- **Plugin Management**: uMod.org integration with framework detection
- **Wipe Automation**: Scheduled and manual wipe execution

### Database Layer
- **Redis Cache**: Session management and temporary data storage
- **User Data**: Encrypted storage of sensitive credentials
- **Server Configurations**: Per-user server settings and schedules

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