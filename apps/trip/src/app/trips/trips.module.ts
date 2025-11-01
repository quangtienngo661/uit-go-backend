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
// import { RmqService } from '../rmqService/rmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, Rating]),
    ClientsModule.register([
      {
        name: 'DRIVER_SERVICE_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'driver.q',
          queueOptions: {
            durable: true,
            // deadLetterExchange: 'trip-dlx',
            // messageTtl: 15000, // 15s
          }
        }
      },
      {
        name: 'NOTIFICATION_SERVICE_RMQ',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'notif.q',
          queueOptions: {
            durable: true
          }
        }
      }
    ]),
  ],
  controllers: [TripsController, TripsListener],
  providers: [TripsService],
})
export class TripsModule { }
