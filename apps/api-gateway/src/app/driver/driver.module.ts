import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'DRIVER_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'driver-service:3004',
          package: 'driverPackage',
          protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/driver.proto')
        }
      }
    ])
  ],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule { }
