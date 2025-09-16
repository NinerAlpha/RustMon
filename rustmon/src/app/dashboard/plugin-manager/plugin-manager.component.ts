import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PluginInfo, PterodactylService } from 'src/app/api/pterodactyl.service';
import { RustService } from 'src/app/rustRCON/rust.service';

@Component({
  selector: 'app-plugin-manager',
  templateUrl: './plugin-manager.component.html',
  styleUrls: ['./plugin-manager.component.scss']
})
export class PluginManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  plugins: PluginInfo[] = [];
  loading = false;

  constructor(
    private pterodactylService: PterodactylService,
    private rustService: RustService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadPlugins();
  }

  loadPlugins() {
    this.loading = true;
    this.pterodactylService.getInstalledPlugins().subscribe(
      plugins => {
        this.plugins = plugins;
        this.loading = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error Loading Plugins',
          detail: error.error?.message || 'Failed to load plugins'
        });
        this.loading = false;
      }
    );
  }

  refreshPlugins() {
    this.loadPlugins();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.cs')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Invalid File',
          detail: 'Please select a .cs plugin file'
        });
        return;
      }

      this.pterodactylService.uploadPlugin(file).subscribe(
        result => {
          this.messageService.add({
            severity: 'success',
            summary: 'Plugin Uploaded',
            detail: `${file.name} has been uploaded successfully`
          });
          this.loadPlugins();
          // Clear the file input
          event.target.value = '';
        },
        error => {
          this.messageService.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: error.error?.message || 'Failed to upload plugin'
          });
        }
      );
    }
  }

  updatePlugin(plugin: PluginInfo) {
    this.confirmationService.confirm({
      message: `Update ${plugin.name} from v${plugin.version} to v${plugin.latestVersion}?`,
      header: 'Confirm Plugin Update',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.pterodactylService.updatePlugin(plugin.name).subscribe(
          result => {
            this.messageService.add({
              severity: 'success',
              summary: 'Plugin Updated',
              detail: `${plugin.name} has been updated to v${plugin.latestVersion}`
            });
            this.loadPlugins();
            // Reload the plugin via RCON
            this.rustService.oreload(plugin.name);
          },
          error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Update Failed',
              detail: error.error?.message || 'Failed to update plugin'
            });
          }
        );
      }
    });
  }

  togglePlugin(plugin: PluginInfo) {
    const action = plugin.enabled ? 'unload' : 'load';
    const actionText = plugin.enabled ? 'disable' : 'enable';
    
    this.confirmationService.confirm({
      message: `Are you sure you want to ${actionText} ${plugin.name}?`,
      header: `Confirm Plugin ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (plugin.enabled) {
          this.rustService.ounload(plugin.name);
        } else {
          this.rustService.oload(plugin.name);
        }
        
        this.messageService.add({
          severity: 'success',
          summary: `Plugin ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}d`,
          detail: `${plugin.name} has been ${actionText}d`
        });
        
        // Refresh plugin list after a short delay
        setTimeout(() => {
          this.loadPlugins();
        }, 1000);
      }
    });
  }

  deletePlugin(plugin: PluginInfo) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${plugin.name}? This action cannot be undone.`,
      header: 'Confirm Plugin Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // First unload the plugin if it's enabled
        if (plugin.enabled) {
          this.rustService.ounload(plugin.name);
        }
        
        // Then delete the file
        this.pterodactylService.deletePlugin(plugin.filename).subscribe(
          result => {
            this.messageService.add({
              severity: 'success',
              summary: 'Plugin Deleted',
              detail: `${plugin.name} has been deleted successfully`
            });
            this.loadPlugins();
          },
          error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: error.error?.message || 'Failed to delete plugin'
            });
          }
        );
      }
    });
  }
}