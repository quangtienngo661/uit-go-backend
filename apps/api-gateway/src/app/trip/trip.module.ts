import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path';

@Module({
  imports: [
     ClientsModule.register([
       {
         name: 'DRIVER_SERVICE',
         transport: Transport.GRPC,
         options: {
           url: '0.0.0.0:3003',
           package: 'tripPackage',
           protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/trip.proto')
         }
       }
     ])
   ],
  controllers: [TripController],
  providers: [TripService],
})
export class TripModule { }

