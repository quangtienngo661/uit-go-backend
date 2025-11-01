import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { driverPackage } from '@uit-go-backend/shared';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: driverPackage.DRIVER_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: '0.0.0.0:3004',
          package: driverPackage.DRIVER_PACKAGE_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/driver.proto')
        }
      }, 
      {
        name: 'DRIVER_SERVICE_RMQ', 
        transport: Transport.RMQ, 
        options: {
          urls: ['amqp://guest:guest@localhost:5672'], 
          queue: 'driver_queue', 
          queueOptions: {
            durable: true
          }
        }
      }
    ]), 
  ],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule { }
