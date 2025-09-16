import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PterodactylConfig, PterodactylService } from 'src/app/api/pterodactyl.service';

@Component({
  selector: 'app-pterodactyl-config',
  templateUrl: './pterodactyl-config.component.html',
  styleUrls: ['./pterodactyl-config.component.scss']
})
export class PterodactylConfigComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  config: PterodactylConfig = {
    apiKey: '',
    panelUrl: '',
    serverId: '',
    sftpHost: '',
    sftpPort: 2022,
    sftpUsername: '',
    sftpPassword: ''
  };

  testing = false;
  testResult: { success: boolean; error?: string } | null = null;

  constructor(
    private pterodactylService: PterodactylService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig() {
    this.pterodactylService.getConnection().subscribe(
      config => {
        this.config = config;
      },
      error => {
        // Config doesn't exist yet, use defaults
      }
    );
  }

  testConnection() {
    this.testing = true;
    this.testResult = null;
    
    this.pterodactylService.testConnection(this.config).subscribe(
      result => {
        this.testing = false;
        this.testResult = { success: true };
        this.messageService.add({
          severity: 'success',
          summary: 'Connection Test',
          detail: 'Successfully connected to Pterodactyl panel and SFTP server'
        });
      },
      error => {
        this.testing = false;
        this.testResult = { 
          success: false, 
          error: error.error?.message || 'Connection failed' 
        };
        this.messageService.add({
          severity: 'error',
          summary: 'Connection Test Failed',
          detail: this.testResult.error
        });
      }
    );
  }

  save() {
    this.pterodactylService.saveConnection(this.config).subscribe(
      () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Configuration Saved',
          detail: 'Pterodactyl configuration has been saved successfully'
        });
        this.close.emit();
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: error.error?.message || 'Failed to save configuration'
        });
      }
    );
  }
}