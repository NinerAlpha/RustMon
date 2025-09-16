import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PterodactylService } from './pterodactyl.service';
import { PterodactylConfig } from './pterodactyl.interfaces';

@Controller('pterodactyl')
export class PterodactylController {

  constructor(private pterodactylService: PterodactylService) {}

  @Post('test')
  async testConnection(@Body() config: PterodactylConfig) {
    return this.pterodactylService.testConnection(config);
  }

  @Post('config')
  async saveConfig(@Body() config: PterodactylConfig) {
    return this.pterodactylService.saveConfig(config);
  }

  @Get('config')
  async getConfig() {
    return this.pterodactylService.getConfig();
  }

  @Get('plugins')
  async getPlugins() {
    return this.pterodactylService.getInstalledPlugins();
  }

  @Post('plugins/upload')
  @UseInterceptors(FileInterceptor('plugin'))
  async uploadPlugin(@UploadedFile() file: Express.Multer.File) {
    return this.pterodactylService.uploadPlugin(file);
  }

  @Delete('plugins/:filename')
  async deletePlugin(@Param('filename') filename: string) {
    return this.pterodactylService.deletePlugin(filename);
  }

  @Post('plugins/:pluginId/update')
  async updatePlugin(@Param('pluginId') pluginId: string) {
    return this.pterodactylService.updatePlugin(pluginId);
  }

  @Get('convars')
  async getConVars() {
    return this.pterodactylService.getConVars();
  }

  @Put('convars/:name')
  async updateConVar(@Param('name') name: string, @Body() body: { value: string }) {
    return this.pterodactylService.updateConVar(name, body.value);
  }

  @Get('convars/descriptions')
  async getConVarDescriptions() {
    return this.pterodactylService.getConVarDescriptions();
  }
}