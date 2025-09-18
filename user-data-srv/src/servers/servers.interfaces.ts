export interface RustServer {
  id: string;
  name: string;
  ip: string;
  rconPort: number;
  rconPassword: string;
  connectionType: 'rcon' | 'pterodactyl';
  pterodactylConfig?: PterodactylConfig;
  userId: string;
  createdAt: string;
  lastSeen?: string;
  stats?: ServerStats;
  modFramework?: 'oxide' | 'carbon' | 'unknown';
}

export interface PterodactylConfig {
  apiKey: string;
  panelUrl: string;
  serverId: string;
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPassword: string;
}

export interface ServerStats {
  players: number;
  maxPlayers: number;
  fps: number;
  uptime: number;
  map: string;
  hostname: string;
}

export interface WipeSchedule {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'bi-weekly' | 'custom';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  options: WipeOptions;
  nextWipe?: string;
}

export interface WipeOptions {
  wipeMap: boolean;
  wipePlayerData: boolean;
  wipeBlueprintData: boolean;
  customMapUrl?: string;
  randomSeed: boolean;
  customSeed?: number;
  mapSize?: number;
  startupCommands?: string[];
}