import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { Rating } from './entities/rating.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { tripPackage } from '@uit-go-backend/shared';
import { join } from 'path';
import { TripsListener } from '../rmqService/trips.listener';
import { RoutingService } from '../routing/routing.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { RmqService } from '../rmqService/rmq.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Trip, Rating]),
    ClientsModule.registerAsync([
      {
        name: 'DRIVER_SERVICE_RMQ',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: 'driver.q',
            queueOptions: {
              durable: true,
              // deadLetterExchange: 'trip-dlx',
              // messageTtl: 15000, // 15s
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
      },
      {
        name: 'USER_SERVICE',
        useFactory: () => ({
          transport: Transport.TCP,
          options: {
            // host: process.env.USER_SERVICE_HOST || 'user-service',
            host: 'user-service',
            port: parseInt(process.env.USER_SERVICE_PORT || '3002'),
          }
        })
      }
    ]),
  ],
  controllers: [TripsController, TripsListener],
  providers: [TripsService, RoutingService],
})
export class TripsModule { }
