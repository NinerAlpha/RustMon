import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PterodactylService {

  constructor(private http: HttpClient) { }

  // Connection management
  public testConnection(config: PterodactylConfig): Observable<any> {
    return this.http.post(`${environment.uDataApi}/pterodactyl/test`, config);
  }

  public saveConnection(config: PterodactylConfig): Observable<any> {
    return this.http.post(`${environment.uDataApi}/pterodactyl/config`, config);
  }

  public getConnection(): Observable<PterodactylConfig> {
    return this.http.get<PterodactylConfig>(`${environment.uDataApi}/pterodactyl/config`);
  }

  // Plugin management
  public getInstalledPlugins(): Observable<PluginInfo[]> {
    return this.http.get<PluginInfo[]>(`${environment.uDataApi}/pterodactyl/plugins`);
  }

  public uploadPlugin(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('plugin', file);
    return this.http.post(`${environment.uDataApi}/pterodactyl/plugins/upload`, formData);
  }

  public deletePlugin(filename: string): Observable<any> {
    return this.http.delete(`${environment.uDataApi}/pterodactyl/plugins/${filename}`);
  }

  public updatePlugin(pluginId: string): Observable<any> {
    return this.http.post(`${environment.uDataApi}/pterodactyl/plugins/${pluginId}/update`, {});
  }

  // ConVars management
  public getConVars(): Observable<ConVar[]> {
    return this.http.get<ConVar[]>(`${environment.uDataApi}/pterodactyl/convars`);
  }

  public updateConVar(name: string, value: string): Observable<any> {
    return this.http.put(`${environment.uDataApi}/pterodactyl/convars/${name}`, { value });
  }

  public getConVarDescriptions(): Observable<ConVarDescription[]> {
    return this.http.get<ConVarDescription[]>(`${environment.uDataApi}/pterodactyl/convars/descriptions`);
  }
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