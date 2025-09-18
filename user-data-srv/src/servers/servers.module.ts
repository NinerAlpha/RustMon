import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  imports: [HttpModule],
  controllers: [ServersController],
  providers: [ServersService, CacheRedisService],
  exports: [ServersService]
})
export class ServersModule {}