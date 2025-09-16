export interface PterodactylConfig {
  apiKey: string;
  panelUrl: string;
  serverId: string;
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPassword: string;
}

export interface PluginInfo {
  filename: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  hasUpdate: boolean;
  latestVersion?: string;
  umodUrl?: string;
}

export interface ConVar {
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  category: string;
  description?: string;
}

export interface ConVarDescription {
  name: string;
  description: string;
  defaultValue: string;
  category: string;
}