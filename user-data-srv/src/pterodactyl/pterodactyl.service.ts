import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheRedisService } from '../redis/redis.service';
import { PterodactylConfig, PluginInfo, ConVar, ConVarDescription } from './pterodactyl.interfaces';
import * as Client from 'ssh2-sftp-client';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PterodactylService {
  private readonly logger = new Logger(PterodactylService.name);
  private readonly CONFIG_KEY = 'pterodactyl_config';

  constructor(
    private httpService: HttpService,
    private redis: CacheRedisService
  ) {}

  async testConnection(config: PterodactylConfig): Promise<{ success: boolean; message?: string }> {
    try {
      // Test Pterodactyl API connection
      const response = await firstValueFrom(
        this.httpService.get(`${config.panelUrl}/api/client/servers/${config.serverId}`, {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
      );

      if (response.status !== 200) {
        throw new Error('Failed to connect to Pterodactyl API');
      }

      // Test SFTP connection
      const sftp = new Client();
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword
      });

      // Test if we can access the oxide directory
      const exists = await sftp.exists('/oxide');
      if (!exists) {
        await sftp.end();
        throw new Error('Oxide directory not found on server');
      }

      await sftp.end();
      return { success: true };
    } catch (error) {
      this.logger.error('Connection test failed:', error);
      return { 
        success: false, 
        message: error.message || 'Connection test failed' 
      };
    }
  }

  async saveConfig(config: PterodactylConfig): Promise<void> {
    // Encrypt sensitive data before storing
    const encryptedConfig = {
      ...config,
      apiKey: this.encryptSensitiveData(config.apiKey),
      sftpPassword: this.encryptSensitiveData(config.sftpPassword)
    };

    await this.redis.saveInCache(this.CONFIG_KEY, 86400, encryptedConfig); // 24 hours
  }

  async getConfig(): Promise<PterodactylConfig> {
    const config = await this.redis.getFromCache(this.CONFIG_KEY, true);
    if (!config) {
      throw new BadRequestException('Pterodactyl configuration not found');
    }

    // Decrypt sensitive data
    return {
      ...config,
      apiKey: this.decryptSensitiveData(config.apiKey),
      sftpPassword: this.decryptSensitiveData(config.sftpPassword)
    };
  }

  async getInstalledPlugins(): Promise<PluginInfo[]> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword
      });

      const pluginsDir = '/oxide/plugins';
      const files = await sftp.list(pluginsDir);
      const plugins: PluginInfo[] = [];

      for (const file of files) {
        if (file.name.endsWith('.cs')) {
          const pluginContent = await sftp.get(`${pluginsDir}/${file.name}`, undefined, 'utf8') as string;
          const pluginInfo = this.parsePluginInfo(file.name, pluginContent);
          
          // Check for updates from uMod
          const updateInfo = await this.checkPluginUpdate(pluginInfo.name);
          if (updateInfo) {
            pluginInfo.hasUpdate = updateInfo.hasUpdate;
            pluginInfo.latestVersion = updateInfo.latestVersion;
            pluginInfo.umodUrl = updateInfo.umodUrl;
          }

          plugins.push(pluginInfo);
        }
      }

      await sftp.end();
      return plugins;
    } catch (error) {
      this.logger.error('Failed to get installed plugins:', error);
      throw new InternalServerErrorException('Failed to retrieve plugins');
    }
  }

  async uploadPlugin(file: Express.Multer.File): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword
      });

      const pluginsDir = '/oxide/plugins';
      const filePath = `${pluginsDir}/${file.originalname}`;
      
      await sftp.put(file.buffer, filePath);
      await sftp.end();

      return { 
        success: true, 
        message: `Plugin ${file.originalname} uploaded successfully` 
      };
    } catch (error) {
      this.logger.error('Failed to upload plugin:', error);
      throw new InternalServerErrorException('Failed to upload plugin');
    }
  }

  async deletePlugin(filename: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    const sftp = new Client();

    try {
      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword
      });

      const pluginsDir = '/oxide/plugins';
      const filePath = `${pluginsDir}/${filename}`;
      
      await sftp.delete(filePath);
      await sftp.end();

      return { 
        success: true, 
        message: `Plugin ${filename} deleted successfully` 
      };
    } catch (error) {
      this.logger.error('Failed to delete plugin:', error);
      throw new InternalServerErrorException('Failed to delete plugin');
    }
  }

  async updatePlugin(pluginId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Download latest version from uMod
      const pluginSlug = this.convertToSlug(pluginId);
      const downloadUrl = `https://umod.org/plugins/${pluginSlug}.cs`;
      
      const response = await firstValueFrom(
        this.httpService.get(downloadUrl, { responseType: 'arraybuffer' })
      );

      if (response.status !== 200) {
        throw new Error('Failed to download plugin from uMod');
      }

      // Upload to server
      const config = await this.getConfig();
      const sftp = new Client();

      await sftp.connect({
        host: config.sftpHost,
        port: config.sftpPort,
        username: config.sftpUsername,
        password: config.sftpPassword
      });

      const pluginsDir = '/oxide/plugins';
      const filePath = `${pluginsDir}/${pluginId}.cs`;
      
      await sftp.put(Buffer.from(response.data), filePath);
      await sftp.end();

      return { 
        success: true, 
        message: `Plugin ${pluginId} updated successfully` 
      };
    } catch (error) {
      this.logger.error('Failed to update plugin:', error);
      throw new InternalServerErrorException('Failed to update plugin');
    }
  }

  async getConVars(): Promise<ConVar[]> {
    // This would typically be retrieved via RCON
    // For now, return a mock implementation
    const convars: ConVar[] = [
      {
        name: 'server.hostname',
        value: 'My Rust Server',
        type: 'string',
        category: 'Server',
        description: 'The name of the server as it appears in the server browser'
      },
      {
        name: 'server.maxplayers',
        value: '100',
        type: 'number',
        category: 'Server',
        description: 'Maximum number of players allowed on the server'
      },
      {
        name: 'server.pve',
        value: 'false',
        type: 'boolean',
        category: 'Gameplay',
        description: 'Enable PvE mode (players cannot damage each other)'
      }
    ];

    return convars;
  }

  async updateConVar(name: string, value: string): Promise<{ success: boolean; message: string }> {
    // This would typically send an RCON command
    // For now, return a mock implementation
    this.logger.log(`Updating ConVar ${name} to ${value}`);
    
    return { 
      success: true, 
      message: `ConVar ${name} updated successfully` 
    };
  }

  async getConVarDescriptions(): Promise<ConVarDescription[]> {
    // This would typically be loaded from a static file or database
    const descriptions: ConVarDescription[] = [
      {
        name: 'server.hostname',
        description: 'The name of the server as it appears in the server browser',
        defaultValue: 'Rust Server',
        category: 'Server'
      },
      {
        name: 'server.maxplayers',
        description: 'Maximum number of players allowed on the server',
        defaultValue: '100',
        category: 'Server'
      }
    ];

    return descriptions;
  }

  private parsePluginInfo(filename: string, content: string): PluginInfo {
    const nameMatch = content.match(/class\s+(\w+)\s*:/);
    const versionMatch = content.match(/\[PluginInformation\([^,]*,\s*"([^"]+)"/);
    const authorMatch = content.match(/\[PluginInformation\([^,]*,[^,]*,\s*"([^"]+)"/);
    const descriptionMatch = content.match(/\/\/\s*(.+)/);

    return {
      filename,
      name: nameMatch ? nameMatch[1] : path.basename(filename, '.cs'),
      version: versionMatch ? versionMatch[1] : '1.0.0',
      author: authorMatch ? authorMatch[1] : 'Unknown',
      description: descriptionMatch ? descriptionMatch[1] : 'No description available',
      enabled: true, // This would need to be checked via RCON
      hasUpdate: false
    };
  }

  private async checkPluginUpdate(pluginName: string): Promise<{ hasUpdate: boolean; latestVersion?: string; umodUrl?: string }> {
    try {
      const pluginSlug = this.convertToSlug(pluginName);
      const response = await firstValueFrom(
        this.httpService.get(`https://umod.org/plugins/${pluginSlug}.json`)
      );

      if (response.status === 200 && response.data) {
        return {
          hasUpdate: true, // This would compare versions
          latestVersion: response.data.latest_release_version,
          umodUrl: `https://umod.org/plugins/${pluginSlug}`
        };
      }
    } catch (error) {
      // Plugin not found on uMod or other error
    }

    return { hasUpdate: false };
  }

  private convertToSlug(pluginName: string): string {
    return pluginName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private encryptSensitiveData(data: string): string {
    // Simple base64 encoding for demo - use proper encryption in production
    return Buffer.from(data).toString('base64');
  }

  private decryptSensitiveData(data: string): string {
    // Simple base64 decoding for demo - use proper decryption in production
    return Buffer.from(data, 'base64').toString('utf8');
  }
}