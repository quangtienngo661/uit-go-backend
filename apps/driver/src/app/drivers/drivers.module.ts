import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DriversListener } from '../listeners/drivers.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver]), 
    ClientsModule.register([
      {
        name: 'TRIP_SERVICE_RMQ', 
        transport: Transport.RMQ, 
        options: {
          urls: ['amqp://guest:guest@localhost:5672'], 
          queue: 'trip.q', 
          queueOptions: {
            durable: true
          }
        }
      }, {
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
    ])
  ],
  controllers: [DriversController, DriversListener],
  providers: [DriversService],
})
export class DriversModule {}
