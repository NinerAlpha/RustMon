import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ServersService } from './servers.service';
import { AuthGuard } from '../auth/auth.guard';
import { RustServer, WipeSchedule, WipeOptions } from './servers.interfaces';

@Controller('servers')
@UseGuards(AuthGuard)
export class ServersController {

  constructor(private serversService: ServersService) {}

  @Get()
  async getUserServers(@Req() req: any) {
    return this.serversService.getUserServers(req.user.id);
  }

  @Post()
  async addServer(@Body() server: RustServer, @Req() req: any) {
    return this.serversService.addServer({ ...server, userId: req.user.id });
  }

  @Get(':id')
  async getServer(@Param('id') id: string, @Req() req: any) {
    return this.serversService.getServer(id, req.user.id);
  }

  @Put(':id')
  async updateServer(@Param('id') id: string, @Body() server: Partial<RustServer>, @Req() req: any) {
    return this.serversService.updateServer(id, server, req.user.id);
  }

  @Delete(':id')
  async deleteServer(@Param('id') id: string, @Req() req: any) {
    return this.serversService.deleteServer(id, req.user.id);
  }

  @Post(':id/test')
  async testConnection(@Param('id') id: string, @Req() req: any) {
    return this.serversService.testConnection(id, req.user.id);
  }

  @Get(':id/stats')
  async getServerStats(@Param('id') id: string, @Req() req: any) {
    return this.serversService.getServerStats(id, req.user.id);
  }

  @Get(':id/wipe-schedule')
  async getWipeSchedule(@Param('id') id: string, @Req() req: any) {
    return this.serversService.getWipeSchedule(id, req.user.id);
  }

  @Put(':id/wipe-schedule')
  async updateWipeSchedule(@Param('id') id: string, @Body() schedule: WipeSchedule, @Req() req: any) {
    return this.serversService.updateWipeSchedule(id, schedule, req.user.id);
  }

  @Post(':id/wipe')
  async executeWipe(@Param('id') id: string, @Body() options: WipeOptions, @Req() req: any) {
    return this.serversService.executeWipe(id, options, req.user.id);
  }

  @Get(':id/framework')
  async detectFramework(@Param('id') id: string, @Req() req: any) {
    return this.serversService.detectModFramework(id, req.user.id);
  }
}