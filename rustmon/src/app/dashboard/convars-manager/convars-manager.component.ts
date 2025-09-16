import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ConVar, PterodactylService } from 'src/app/api/pterodactyl.service';

interface ConVarExtended extends ConVar {
  editing?: boolean;
  newValue?: string;
  modified?: boolean;
}

@Component({
  selector: 'app-convars-manager',
  templateUrl: './convars-manager.component.html',
  styleUrls: ['./convars-manager.component.scss']
})
export class ConVarsManagerComponent implements OnInit {

  @Output() close = new EventEmitter<void>();

  convars: ConVarExtended[] = [];
  filteredConVars: ConVarExtended[] = [];
  categories: string[] = [];
  searchTerm = '';
  selectedCategory = '';
  loading = false;

  constructor(
    private pterodactylService: PterodactylService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadConVars();
  }

  loadConVars() {
    this.loading = true;
    this.pterodactylService.getConVars().subscribe(
      convars => {
        this.convars = convars.map(cv => ({ ...cv, editing: false, modified: false }));
        this.categories = [...new Set(convars.map(cv => cv.category))].sort();
        this.filterConVars();
        this.loading = false;
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error Loading ConVars',
          detail: error.error?.message || 'Failed to load ConVars'
        });
        this.loading = false;
      }
    );
  }

  refreshConVars() {
    this.loadConVars();
  }

  filterConVars() {
    this.filteredConVars = this.convars.filter(convar => {
      const matchesSearch = !this.searchTerm || 
        convar.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (convar.description && convar.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesCategory = !this.selectedCategory || convar.category === this.selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }

  editConVar(convar: ConVarExtended) {
    convar.editing = true;
    convar.newValue = convar.value;
  }

  cancelEdit(convar: ConVarExtended) {
    convar.editing = false;
    convar.newValue = undefined;
  }

  saveConVar(convar: ConVarExtended) {
    if (convar.newValue === undefined || convar.newValue === convar.value) {
      this.cancelEdit(convar);
      return;
    }

    // Validate the value based on type
    if (convar.type === 'number' && isNaN(Number(convar.newValue))) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Value',
        detail: 'Please enter a valid number'
      });
      return;
    }

    if (convar.type === 'boolean' && !['true', 'false', '1', '0'].includes(convar.newValue.toLowerCase())) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Value',
        detail: 'Please enter true/false or 1/0 for boolean values'
      });
      return;
    }

    this.pterodactylService.updateConVar(convar.name, convar.newValue).subscribe(
      result => {
        convar.value = convar.newValue!;
        convar.editing = false;
        convar.modified = true;
        convar.newValue = undefined;
        
        this.messageService.add({
          severity: 'success',
          summary: 'ConVar Updated',
          detail: `${convar.name} has been updated successfully`
        });
      },
      error => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: error.error?.message || 'Failed to update ConVar'
        });
      }
    );
  }
}