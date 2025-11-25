import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path';
import { tripPackage } from '@uit-go-backend/shared';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: tripPackage.TRIP_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: 'trip-service:3003',
          package: tripPackage.TRIP_PACKAGE_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/trip.proto')
        }
      }
    ]), 
  ],
  controllers: [TripController],
  providers: [TripService],
})
export class TripModule { }

