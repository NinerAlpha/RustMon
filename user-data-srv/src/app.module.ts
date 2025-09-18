import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ValveApiService } from './valve/valve-api.service';
import { IPGeocodeService } from './ipGeocode/ipgeocode.service';
import { HttpModule } from '@nestjs/axios';
import { CacheRedisService } from './redis/redis.service';
import { RustMapService } from './rustmap/rustmap.service';
import { UmodService } from './umod/umod.service';
import { environment } from './environment';
import { ApmModule } from '@student-coin/elastic-apm-nest';
import { PterodactylModule } from './pterodactyl/pterodactyl.module';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from './auth/auth.module';
import { ServersModule } from './servers/servers.module';

const imports: any = environment.APM.enabled ? [
  ApmModule.forRootAsync({
    useFactory: async () => {
      return {
        httpUserMapFunction: (req: any) => {
          return {
            id: req?.user?.id,
            username: req?.user?.username,
            email: req?.user?.email,
          };
        },
      };
    },
  })
] : [];

@Module({
  imports: [
    HttpModule,
    PterodactylModule,
    AuthModule,
    ServersModule,
    MulterModule.register({
      dest: './uploads',
    })
  ].concat(imports),
  controllers: [AppController],
  providers: [ValveApiService, IPGeocodeService, CacheRedisService, RustMapService, UmodService],
})
export class AppModule {}
