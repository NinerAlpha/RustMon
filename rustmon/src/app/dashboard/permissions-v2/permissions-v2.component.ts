import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { REType, RustEvent } from 'src/app/rustRCON/RustEvent';
import { RustService } from 'src/app/rustRCON/rust.service';

@Component({
  selector: 'app-permissions-v2',
  templateUrl: './permissions-v2.component.html',
  styleUrls: ['./permissions-v2.component.scss']
})
export class PermissionsV2Component implements OnInit {

  @Output() close: EventEmitter<void> = new EventEmitter();

  tab = 0; // 0: Groups, 1: Users
  groups: string[] = [];
  selectedGroup?: string;
  groupMembers: { steamID: string, nick: string }[] = [];
  
  // Plugin-based permissions
  pluginPermissions: PluginPermissions[] = [];
  groupPermissions: string[] = [];
  
  // User permissions
  selectedUser?: string;
  userPermissions: string[] = [];
  searchUser = '';

  loading = false;

  constructor(
    private rustSrv: RustService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.rustSrv.getEvtRust().subscribe((d: RustEvent) => {
      if (d.type === REType.GROUPS) {
        this.parseGroups(d.raw);
      }
      if (d.type === REType.PERMS) {
        this.parsePermissions(d.raw);
      }
      if (d.type === REType.GROUP_DETAILS) {
        this.parseGroupDetails(d.raw);
      }
    });
    
    this.loadGroups();
    this.loadPermissions();
  }

  loadGroups() {
    this.rustSrv.sendCommand('o.show groups', REType.GROUPS);
  }

  loadPermissions() {
    this.rustSrv.sendCommand('o.show perms', REType.PERMS);
  }

  parseGroups(raw: string) {
    const parts = raw.split('\n');
    parts.shift();
    this.groups = parts.map(v => v.split(',').map(d => d.trim()))
      .reduce((acc, val) => acc.concat(val.filter(q => q)), [])
      .filter(g => g);
  }

  parsePermissions(raw: string) {
    if (!raw.length) return;
    
    const allPerms = raw.split('\n')[1].split(',')
      .map(d => d.trim())
      .filter(p => p)
      .sort();
    
    // Group permissions by plugin
    const pluginMap = new Map<string, string[]>();
    
    allPerms.forEach(perm => {
      const parts = perm.split('.');
      const pluginName = parts[0] || 'core';
      
      if (!pluginMap.has(pluginName)) {
        pluginMap.set(pluginName, []);
      }
      pluginMap.get(pluginName)!.push(perm);
    });
    
    this.pluginPermissions = Array.from(pluginMap.entries())
      .map(([plugin, perms]) => ({ plugin, permissions: perms }))
      .sort((a, b) => a.plugin.localeCompare(b.plugin));
  }

  parseGroupDetails(raw: string) {
    if (!raw.length) return;
    
    const parts = raw.split('Group \'');
    this.groupMembers = [];
    this.groupPermissions = [];
    
    if (parts.length < 3) return;
    
    // Parse members
    const linesMembers = parts[1].split('\n');
    linesMembers.shift();
    
    if (linesMembers[0] !== 'No players currently in group') {
      const members = linesMembers[0].split(',').filter(v => v.length).map(v => {
        const match = /([0-9]+)\s\((.+)/gm.exec(v);
        if (match) {
          return {
            steamID: match[1],
            nick: match[2].substring(0, match[2].length - 1)
          };
        }
        return null;
      }).filter(m => m);
      
      this.groupMembers = members;
    }
    
    // Parse permissions
    const linesPerms = parts[2].split('\n');
    linesPerms.shift();
    
    if (linesPerms[0] !== 'No permissions currently granted') {
      this.groupPermissions = linesPerms[0].split(',')
        .map(v => v.trim())
        .filter(v => v.length);
    }
    
    this.loading = false;
  }

  selectGroup(group: string) {
    this.selectedGroup = group;
    this.loading = true;
    this.rustSrv.sendCommand(`o.show group ${group}`, REType.GROUP_DETAILS);
  }

  hasPermission(permission: string): boolean {
    return this.groupPermissions.includes(permission);
  }

  togglePermission(permission: string) {
    if (!this.selectedGroup) return;
    
    if (this.hasPermission(permission)) {
      this.removePermission(permission);
    } else {
      this.addPermission(permission);
    }
  }

  addPermission(permission: string) {
    if (!this.selectedGroup) return;
    
    this.rustSrv.sendCommand(`o.grant group ${this.selectedGroup} ${permission}`);
    this.groupPermissions.push(permission);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Permission Added',
      detail: `Added ${permission} to ${this.selectedGroup}`
    });
  }

  removePermission(permission: string) {
    if (!this.selectedGroup) return;
    
    this.confirmationService.confirm({
      message: `Remove ${permission} from ${this.selectedGroup}?`,
      accept: () => {
        this.rustSrv.sendCommand(`o.revoke group ${this.selectedGroup} ${permission}`);
        this.groupPermissions = this.groupPermissions.filter(p => p !== permission);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Permission Removed',
          detail: `Removed ${permission} from ${this.selectedGroup}`
        });
      }
    });
  }

  addUserToGroup() {
    if (!this.selectedGroup) return;
    
    const steamID = prompt('Enter the SteamID64:');
    if (steamID) {
      this.rustSrv.sendCommand(`o.usergroup add ${steamID} ${this.selectedGroup}`);
      this.selectGroup(this.selectedGroup);
      
      this.messageService.add({
        severity: 'success',
        summary: 'User Added',
        detail: `Added user to ${this.selectedGroup}`
      });
    }
  }

  removeUserFromGroup(member: { steamID: string, nick: string }) {
    if (!this.selectedGroup) return;
    
    this.confirmationService.confirm({
      message: `Remove ${member.nick} from ${this.selectedGroup}?`,
      accept: () => {
        this.rustSrv.sendCommand(`o.usergroup remove ${member.steamID} ${this.selectedGroup}`);
        this.groupMembers = this.groupMembers.filter(m => m.steamID !== member.steamID);
        
        this.messageService.add({
          severity: 'success',
          summary: 'User Removed',
          detail: `Removed ${member.nick} from ${this.selectedGroup}`
        });
      }
    });
  }

  createGroup() {
    const groupName = prompt('Enter new group name:')?.replace(/\s/g, '_');
    if (groupName) {
      this.rustSrv.sendCommand(`o.group add ${groupName}`);
      this.loadGroups();
      
      this.messageService.add({
        severity: 'success',
        summary: 'Group Created',
        detail: `Created group: ${groupName}`
      });
    }
  }

  deleteGroup(group: string) {
    if (group === 'default' || group === 'admin') {
      this.messageService.add({
        severity: 'error',
        summary: 'Cannot Delete',
        detail: 'Cannot delete default or admin groups'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: `Delete group ${group}? This will remove all members and permissions.`,
      accept: () => {
        this.rustSrv.sendCommand(`o.group remove ${group}`);
        this.groups = this.groups.filter(g => g !== group);
        if (this.selectedGroup === group) {
          this.selectedGroup = undefined;
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Group Deleted',
          detail: `Deleted group: ${group}`
        });
      }
    });
  }

  // User permissions methods
  searchUserPermissions() {
    if (!this.searchUser) return;
    
    this.selectedUser = this.searchUser;
    this.rustSrv.sendCommand(`o.show user ${this.searchUser}`, REType.GROUP_DETAILS);
  }

  toggleUserPermission(permission: string) {
    if (!this.selectedUser) return;
    
    if (this.userPermissions.includes(permission)) {
      this.removeUserPermission(permission);
    } else {
      this.addUserPermission(permission);
    }
  }

  addUserPermission(permission: string) {
    if (!this.selectedUser) return;
    
    this.rustSrv.sendCommand(`o.grant user ${this.selectedUser} ${permission}`);
    this.userPermissions.push(permission);
    
    this.messageService.add({
      severity: 'success',
      summary: 'Permission Added',
      detail: `Added ${permission} to user`
    });
  }

  removeUserPermission(permission: string) {
    if (!this.selectedUser) return;
    
    this.confirmationService.confirm({
      message: `Remove ${permission} from user?`,
      accept: () => {
        this.rustSrv.sendCommand(`o.revoke user ${this.selectedUser} ${permission}`);
        this.userPermissions = this.userPermissions.filter(p => p !== permission);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Permission Removed',
          detail: `Removed ${permission} from user`
        });
      }
    });
  }

  hasUserPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }
}

interface PluginPermissions {
  plugin: string;
  permissions: string[];
}