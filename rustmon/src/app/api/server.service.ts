import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PterodactylConfig } from './pterodactyl.service';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  constructor(private http: HttpClient) { }

  getUserServers(): Observable<RustServer[]> {
    return this.http.get<RustServer[]>(`${environment.uDataApi}/servers`);
  }

  addServer(server: RustServer): Observable<RustServer> {
    return this.http.post<RustServer>(`${environment.uDataApi}/servers`, server);
  }

  updateServer(id: string, server: Partial<RustServer>): Observable<RustServer> {
    return this.http.put<RustServer>(`${environment.uDataApi}/servers/${id}`, server);
  }

  deleteServer(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.uDataApi}/servers/${id}`);
  }

  getServer(id: string): Observable<RustServer> {
    return this.http.get<RustServer>(`${environment.uDataApi}/servers/${id}`);
  }

  testConnection(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.uDataApi}/servers/${id}/test`, {});
  }

  getServerStats(id: string): Observable<ServerStats> {
    return this.http.get<ServerStats>(`${environment.uDataApi}/servers/${id}/stats`);
  }

  // Wipe Management
  getWipeSchedule(serverId: string): Observable<WipeSchedule> {
    return this.http.get<WipeSchedule>(`${environment.uDataApi}/servers/${serverId}/wipe-schedule`);
  }

  updateWipeSchedule(serverId: string, schedule: WipeSchedule): Observable<WipeSchedule> {
    return this.http.put<WipeSchedule>(`${environment.uDataApi}/servers/${serverId}/wipe-schedule`, schedule);
  }

  executeWipe(serverId: string, options: WipeOptions): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.uDataApi}/servers/${serverId}/wipe`, options);
  }
}

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
  modFramework?: 'oxide' | 'carbon';
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