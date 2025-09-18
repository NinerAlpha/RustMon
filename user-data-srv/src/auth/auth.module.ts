import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CacheRedisService } from '../redis/redis.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [AuthService, CacheRedisService],
  exports: [AuthService]
})
export class AuthModule {}