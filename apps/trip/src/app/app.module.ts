import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, tripConfigValidation } from './config/configuration';
import { tripDbAsyncConfig } from './config/ormConfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsModule } from './trips/trips.module';
import { PricingsModule } from './pricings/pricings.module';

@Module({
   imports: [
    ConfigModule.forRoot({
      envFilePath: '../../../.env', 
      isGlobal: true, 
      cache: true,
      load: [configuration], 
      validationSchema: tripConfigValidation
    }),
    TripsModule,
    TypeOrmModule.forRootAsync(tripDbAsyncConfig),
    PricingsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
