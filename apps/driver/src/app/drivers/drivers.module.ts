import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DriversListener } from '../listeners/drivers.listener';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Driver]),
    ClientsModule.registerAsync([
      {
        name: 'TRIP_SERVICE_RMQ',
        useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'trip.q',
            queueOptions: {
              durable: true
            }
          }
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE_RMQ',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'notif.q',
            queueOptions: {
              durable: true
            }
          }
        }),
        inject: [ConfigService],
      }
    ])
  ],
  controllers: [DriversController, DriversListener],
  providers: [DriversService],
})
export class DriversModule {}
