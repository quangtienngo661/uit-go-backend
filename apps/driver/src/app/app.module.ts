import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DriversModule } from './drivers/drivers.module';
import { ConfigModule } from '@nestjs/config';
import { configuration, driverConfigValidation } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { driverDbAsyncConfig } from './config/ormConfig';
import { LocationsModule } from './locations/locations.module';
import { RedisModule } from '@uit-go-backend/shared';

@Module({
  imports: [
    DriversModule,
    ConfigModule.forRoot({
      envFilePath: '../../../.env',
      load: [configuration],
      isGlobal: true,
      validationSchema: driverConfigValidation,
      cache: true,
    }),
    TypeOrmModule.forRootAsync(driverDbAsyncConfig),
    LocationsModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
