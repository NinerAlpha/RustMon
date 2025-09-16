import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PterodactylController } from './pterodactyl.controller';
import { PterodactylService } from './pterodactyl.service';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  imports: [HttpModule],
  controllers: [PterodactylController],
  providers: [PterodactylService, CacheRedisService],
  exports: [PterodactylService]
})
export class PterodactylModule {}