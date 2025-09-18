import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserDataService } from 'src/app/api/user-data.service';
import { RustEvent } from 'src/app/rustRCON/RustEvent';
import { RustService } from 'src/app/rustRCON/rust.service';

@Component({
  selector: 'app-umod',
  templateUrl: './umod.component.html',
  styleUrls: ['./umod.component.scss']
})
export class UmodComponent implements OnInit {

  @Output() close = new EventEmitter<void>();
  @Input() visible: boolean = false;
  @Input() version: string = '0.0.1';
  @Input() modFramework: 'oxide' | 'carbon' = 'oxide';
  @Output() pluginUpdates = new EventEmitter<void>();

  constructor(
    private rustSrv: RustService,
    private readonly userDS: UserDataService
  ) { }

  public plugins: {id: string, name: string, author: string, file: string, size: string, time: string, version: string, loaded: boolean, updates?: boolean, latest_release_version?: string}[] = [];
  public pluginsCols = [
    { field: 'id', header: 'Name', width: '250px' },
    { field: 'author', header: 'Author', width: '250px'},
    { field: 'size', header: 'Size', width: '100px' },
    { field: 'time', header: 'Load Time', width: '100px' },
    { field: 'actions', header: 'Actions', width: '300px' },
  ];

  ngOnInit(): void {
    this.rustSrv.oplugins();
    this.rustSrv.getEvtRust().subscribe((d: RustEvent) => {
      if(d.type == 1005) {
        const lines = d.raw.split('\n');
        if(lines.length < 2) return;
        this.plugins = lines.splice(1).map((p: string) => {
          const result = /([0-9]+)\s(\"([^\"]+)\"\s\(([0-9]+\.[0-9]+\.[0-9]+)\)\sby\s([^\(]+)(\([^\)]+\))\s-\s)?([^\s]+)(\s-\sUnloaded)?/gm.exec(p)
          const id = result[7].replace('.cs', '').trim();
          const timeSize = result[6]?.replace('(', '').replace(')', '').split('/');
          const d = {
            name: result[3] ? result[3] : result[7],
            file: `${id}.cs`,
            size: timeSize ? timeSize[1] : undefined,
            time: timeSize ? timeSize[0] : undefined,
            version: result[4],
            author: result[5],
            id: id,
            loaded: !result[8],
            loading: false,
            slug: id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
          };
          return d;
        });
        this.calcStats(this.plugins);
        this.userDS.getPluginUpdates(this.plugins).subscribe((r: any) => {
          let updates = false;
          r.forEach((update: any) => {
            const plugin = this.plugins.find(p => p.id == update.id);
            if(!update.meta.slug) return;
            if(plugin.author.trim() != update.meta.author) {
              console.log(`El plugin ${plugin.name} tiene un nuevo autor: ${plugin.author} -> ${update.meta.author} https://umod.org/plugins/${update.meta.slug}`)
            }
            if(this.vStd(plugin.version.trim()) != this.vStd(update.meta.latest_release_version.trim())) {
              plugin.updates = true;
              plugin.latest_release_version = update.meta.latest_release_version;
              updates = true;
            } else {
              plugin.updates = false;
              plugin.latest_release_version = update.meta.latest_release_version;
            }
          });
          if(updates) {
            this.pluginUpdates.emit();
          }
        });
      }
      if(d.type == 1006) {
        console.log('Plugin loaded', d.raw);
        this.rustSrv.oplugins();
      }
      if(d.type == 1007) {
        console.log('Plugin unloaded', d.raw);
        this.rustSrv.oplugins();
      }
      if(d.type == 1008) {
        console.log('Plugin reloaded', d.raw);
        this.rustSrv.oplugins();
      }
    });
  }

  getStringFromInputEvent(evt: any): string {
    return evt.target.value;
  }

  vStd(version: string): string {
    const parts = version.split('.');
    if(parts.length == 2) parts.push('0');
    if(parts.length == 1) parts.push('0', '0');
    if(parts.length > 3) parts.splice(3, parts.length - 3)
    return parts.map(v => v.padStart(3, '0')).join('');
  }

  stats = {
    loaded: 0,
    size: '0kb',
    time: '0s',
    unloaded: 0
  }
  calcStats(plugins: any[]) {
    const loaded = plugins.filter(p => p.loaded).length;
    const unloaded = plugins.filter(p => !p.loaded).length;
    const size = this.convertBytesToMBKB(plugins.map(p => {
      // p.size string with: 30 MB, 256 KB, 0 B
      if(!p.size) return 0;
      return this.convertMBKBtoBytes(p.size);
    }).reduce((a, b) => a + b, 0));
    const time = plugins.map(p => {
      // p.time string with: 0.70s, 0.09s
      if(!p.time) return 0;
      return parseFloat(p.time.replace('s', ''));
    }).reduce((a, b) => a + b, 0).toFixed(2)+'s';
    this.stats = {
      loaded: loaded,
      size: size,
      time: time,
      unloaded: unloaded
    }
    console.log('Plugins loaded:', loaded, 'Plugins unloaded:', unloaded, 'Total size: ', size, 'Total time: ', time);
  }

  convertMBKBtoBytes(size: string): number {
    if(size.includes('MB')) {
      return parseInt(size.replace('MB', '')) * 1024 * 1024;
    } else if(size.includes('KB')) {
      return parseInt(size.replace('KB', '')) * 1024;
    } else {
      return parseInt(size.replace('B', ''));
    }
  }

  convertBytesToMBKB(size: number): string {
    if(size > 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else if(size > 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${size} B`;
    }
  }

  reload(name: string) {
    this.rustSrv.oreload(name);
  }
  unload(name: string) {
    this.rustSrv.ounload(name);
  }
  load(name: string) {
    this.rustSrv.oload(name);
  }

  updatePlugin(plugin: any) {
    // Implementation for updating plugin via SFTP
    console.log('Updating plugin:', plugin.id, 'to version:', plugin.latest_release_version);
    
    // This would call the backend service to:
    // 1. Download latest version from uMod
    // 2. Upload to correct directory (oxide/plugins or carbon/plugins)
    // 3. Reload the plugin
  }

}
