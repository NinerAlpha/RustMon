import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ServerService, WipeSchedule, WipeOptions } from 'src/app/api/server.service';

@Component({
  selector: 'app-wipe-manager',
  templateUrl: './wipe-manager.component.html',
  styleUrls: ['./wipe-manager.component.scss']
})
export class WipeManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Input() serverId!: string;

  schedule: WipeSchedule = {
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 4, // Thursday
    time: '12:00',
    options: {
      wipeMap: true,
      wipePlayerData: true,
      wipeBlueprintData: false,
      randomSeed: true,
      mapSize: 4000
    }
  };

  frequencies = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'bi-weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
  ];

  daysOfWeek = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  mapSizes = [
    { label: '1000x1000', value: 1000 },
    { label: '2000x2000', value: 2000 },
    { label: '3000x3000', value: 3000 },
    { label: '4000x4000', value: 4000 },
    { label: '5000x5000', value: 5000 },
    { label: 'Custom', value: 0 }
  ];

  customMapSize = 4000;
  loading = false;

  constructor(
    private serverService: ServerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadWipeSchedule();
  }

  loadWipeSchedule() {
    this.loading = true;
    this.serverService.getWipeSchedule(this.serverId).subscribe(
      schedule => {
        this.schedule = schedule;
        this.loading = false;
      },
      error => {
        this.loading = false;
        // Use defaults if no schedule exists
      }
    );
  }

  saveSchedule() {
    if (this.schedule.options.mapSize === 0) {
      this.schedule.options.mapSize = this.customMapSize;
    }

    this.serverService.updateWipeSchedule(this.serverId, this.schedule).subscribe(
      result => {
        this.messageService.add({
          severity: 'success',
          summary: 'Schedule Saved',
          detail: 'Wipe schedule has been updated successfully'
        });
        this.close.emit();
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Save Failed',
          detail: error.error?.message || 'Failed to save wipe schedule'
        });
      }
    );
  }

  executeWipeNow() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to execute a wipe now? This action cannot be undone.',
      header: 'Confirm Immediate Wipe',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.serverService.executeWipe(this.serverId, this.schedule.options).subscribe(
          result => {
            this.messageService.add({
              severity: 'success',
              summary: 'Wipe Executed',
              detail: 'Server wipe has been initiated successfully'
            });
          },
          error => {
            this.messageService.add({
              severity: 'error',
              summary: 'Wipe Failed',
              detail: error.error?.message || 'Failed to execute wipe'
            });
          }
        );
      }
    });
  }

  addStartupCommand() {
    const command = prompt('Enter startup command:');
    if (command) {
      if (!this.schedule.options.startupCommands) {
        this.schedule.options.startupCommands = [];
      }
      this.schedule.options.startupCommands.push(command);
    }
  }

  removeStartupCommand(index: number) {
    if (this.schedule.options.startupCommands) {
      this.schedule.options.startupCommands.splice(index, 1);
    }
  }

  getNextWipeDate(): string {
    if (!this.schedule.enabled) return 'Disabled';
    
    const now = new Date();
    const nextWipe = new Date();
    
    switch (this.schedule.frequency) {
      case 'weekly':
        const daysUntilWipe = (this.schedule.dayOfWeek! - now.getDay() + 7) % 7;
        nextWipe.setDate(now.getDate() + (daysUntilWipe === 0 ? 7 : daysUntilWipe));
        break;
      case 'bi-weekly':
        // Calculate next bi-weekly occurrence
        nextWipe.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        nextWipe.setMonth(now.getMonth() + 1);
        nextWipe.setDate(this.schedule.dayOfMonth || 1);
        break;
    }
    
    const [hours, minutes] = this.schedule.time.split(':');
    nextWipe.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return nextWipe.toLocaleString();
  }
}