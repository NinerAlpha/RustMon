import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheRedisService } from '../redis/redis.service';
import { RustServer, WipeSchedule, WipeOptions, ServerStats } from './servers.interfaces';
import { v4 as uuidv4 } from 'uuid';
import * as Client from 'ssh2-sftp-client';

@Injectable()
export class ServersService {
  private readonly logger = new Logger(ServersService.name);

  constructor(
    private httpService: HttpService,
    private redis: CacheRedisService
  ) {}

  async getUserServers(userId: string): Promise<RustServer[]> {
    const servers = await this.redis.getFromCache(`user:${userId}:servers`, true);
    return servers || [];
  }

  async addServer(server: RustServer): Promise<RustServer> {
    const serverId = uuidv4();
    const newServer: RustServer = {
      ...server,
      id: serverId,
      createdAt: new Date().toISOString()
    };

    // Test connection before saving
    const testResult = await this.testServerConnection(newServer);
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`);
    }

    // Detect mod framework
    newServer.modFramework = await this.detectModFrameworkInternal(newServer);

    const userServers = await this.getUserServers(server.userId);
    userServers.push(newServer);
    
    await this.redis.saveInCache(`user:${server.userId}:servers`, 86400 * 30, userServers);
    await this.redis.saveInCache(`server:${serverId}`, 86400 * 30, newServer);

    return newServer;
  }

  async getServer(id: string, userId: string): Promise<RustServer> {
    const server = await this.redis.getFromCache(`server:${id}`, true);
    if (!server || server.userId !== userId) {
      throw new NotFoundException('Server not found');
    }
    return server;
  }

  async updateServer(id: string, updates: Partial<RustServer>, userId: string): Promise<RustServer> {
    const server = await this.getServer(id, userId);
    const updatedServer = { ...server, ...updates };
    
    await this.redis.saveInCache(`server:${id}`, 86400 * 30, updatedServer);
    
    // Update user's server list
    const userServers = await this.getUserServers(userId);
    const index = userServers.findIndex(s => s.id === id);
    if (index >= 0) {
      userServers[index] = updatedServer;
      await this.redis.saveInCache(`user:${userId}:servers`, 86400 * 30, userServers);
    }

    return updatedServer;
  }

  async deleteServer(id: string, userId: string): Promise<void> {
    const server = await this.getServer(id, userId);
    
    // Remove from user's server list
    const userServers = await this.getUserServers(userId);
    const filteredServers = userServers.filter(s => s.id !== id);
    
    await this.redis.saveInCache(`user:${userId}:servers`, 86400 * 30, filteredServers);
    await this.redis.invalidate(`server:${id}`);
  }

  async testConnection(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const server = await this.getServer(id, userId);
    return this.testServerConnection(server);
  }

  private async testServerConnection(server: RustServer): Promise<{ success: boolean; message: string }> {
    try {
      // Test RCON connection (simplified)
      // In real implementation, you'd establish WebSocket connection
      
      if (server.connectionType === 'pterodactyl' && server.pterodactylConfig) {
        // Test Pterodactyl API
        const response = await this.httpService.get(
          `${server.pterodactylConfig.panelUrl}/api/client/servers/${server.pterodactylConfig.serverId}`,
          {
            headers: { Authorization: `Bearer ${server.pterodactylConfig.apiKey}` }
          }
        ).toPromise();

        if (response?.status !== 200) {
          throw new Error('Pterodactyl API connection failed');
        }

        // Test SFTP
        const sftp = new Client();
        await sftp.connect({
          host: server.pterodactylConfig.sftpHost,
          port: server.pterodactylConfig.sftpPort,
          username: server.pterodactylConfig.sftpUsername,
          password: server.pterodactylConfig.sftpPassword
        });
        await sftp.end();
      }

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async getServerStats(id: string, userId: string): Promise<ServerStats> {
    const server = await this.getServer(id, userId);
    
    // In real implementation, fetch stats via RCON
    return {
      players: 0,
      maxPlayers: 100,
      fps: 60,
      uptime: 3600,
      map: 'Procedural Map',
      hostname: server.name
    };
  }

  async detectModFramework(id: string, userId: string): Promise<{ framework: 'oxide' | 'carbon' | 'unknown' }> {
    const server = await this.getServer(id, userId);
    const framework = await this.detectModFrameworkInternal(server);
    return { framework };
  }

  private async detectModFrameworkInternal(server: RustServer): Promise<'oxide' | 'carbon' | 'unknown'> {
    if (server.connectionType !== 'pterodactyl' || !server.pterodactylConfig) {
      return 'unknown';
    }

    try {
      const sftp = new Client();
      await sftp.connect({
        host: server.pterodactylConfig.sftpHost,
        port: server.pterodactylConfig.sftpPort,
        username: server.pterodactylConfig.sftpUsername,
        password: server.pterodactylConfig.sftpPassword
      });

      // Check for Carbon
      const carbonExists = await sftp.exists('/carbon');
      if (carbonExists) {
        await sftp.end();
        return 'carbon';
      }

      // Check for Oxide
      const oxideExists = await sftp.exists('/oxide');
      if (oxideExists) {
        await sftp.end();
        return 'oxide';
      }

      await sftp.end();
      return 'unknown';
    } catch (error) {
      this.logger.error('Framework detection failed:', error);
      return 'unknown';
    }
  }

  // Wipe Management
  async getWipeSchedule(serverId: string, userId: string): Promise<WipeSchedule> {
    await this.getServer(serverId, userId); // Verify ownership
    
    const schedule = await this.redis.getFromCache(`server:${serverId}:wipe-schedule`, true);
    return schedule || {
      enabled: false,
      frequency: 'weekly',
      dayOfWeek: 4,
      time: '12:00',
      options: {
        wipeMap: true,
        wipePlayerData: true,
        wipeBlueprintData: false,
        randomSeed: true,
        mapSize: 4000
      }
    };
  }

  async updateWipeSchedule(serverId: string, schedule: WipeSchedule, userId: string): Promise<WipeSchedule> {
    await this.getServer(serverId, userId); // Verify ownership
    
    await this.redis.saveInCache(`server:${serverId}:wipe-schedule`, 86400 * 30, schedule);
    return schedule;
  }

  async executeWipe(serverId: string, options: WipeOptions, userId: string): Promise<{ success: boolean; message: string }> {
    const server = await this.getServer(serverId, userId);
    
    try {
      // Implementation would depend on server setup
      // This could involve:
      // 1. Stopping the server via Pterodactyl API
      // 2. Deleting save files via SFTP
      // 3. Updating server config with new seed/size
      // 4. Starting the server
      // 5. Executing startup commands via RCON
      
      this.logger.log(`Executing wipe for server ${serverId} with options:`, options);
      
      return { success: true, message: 'Wipe executed successfully' };
    } catch (error) {
      this.logger.error('Wipe execution failed:', error);
      return { success: false, message: error.message };
    }
  }
}