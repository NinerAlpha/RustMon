import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService, User } from '../auth/auth.service';
import { ServerService, RustServer } from '../api/server.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {

  user: User | null = null;
  servers: RustServer[] = [];
  loading = false;
  showAddServer = false;

  newServer: Partial<RustServer> = {
    name: '',
    ip: '',
    rconPort: 28016,
    rconPassword: '',
    connectionType: 'rcon'
  };

  constructor(
    private authService: AuthService,
    private serverService: ServerService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
    this.loadServers();
  }

  loadServers() {
    this.loading = true;
    this.serverService.getUserServers().subscribe(
      servers => {
        this.servers = servers;
        this.loading = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load servers'
        });
        this.loading = false;
      }
    );
  }

  addServer() {
    if (!this.newServer.name || !this.newServer.ip) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    this.serverService.addServer(this.newServer as RustServer).subscribe(
      server => {
        this.servers.push(server);
        this.showAddServer = false;
        this.resetNewServer();
        this.messageService.add({
          severity: 'success',
          summary: 'Server Added',
          detail: `${server.name} has been added successfully`
        });
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to add server'
        });
      }
    );
  }

  connectToServer(server: RustServer) {
    this.router.navigate(['/server', server.id]);
  }

  deleteServer(server: RustServer) {
    this.serverService.deleteServer(server.id).subscribe(
      () => {
        this.servers = this.servers.filter(s => s.id !== server.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Server Deleted',
          detail: `${server.name} has been removed`
        });
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete server'
        });
      }
    );
  }

  testConnection(server: RustServer) {
    this.serverService.testConnection(server.id).subscribe(
      result => {
        this.messageService.add({
          severity: result.success ? 'success' : 'error',
          summary: 'Connection Test',
          detail: result.message
        });
      }
    );
  }

  resetNewServer() {
    this.newServer = {
      name: '',
      ip: '',
      rconPort: 28016,
      rconPassword: '',
      connectionType: 'rcon'
    };
  }

  logout() {
    this.authService.logout();
  }

  getServerStatusClass(server: RustServer): string {
    if (!server.lastSeen) return 'unknown';
    
    const lastSeen = new Date(server.lastSeen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'online';
    if (diffMinutes < 30) return 'warning';
    return 'offline';
  }
}