import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { ClientsModule } from '@nestjs/microservices'

@Module({
  imports: [
    ClientsModule.register([
      // {

      // }
    ])
  ],
  controllers: [TripController],
  providers: [TripService],
})
export class TripModule { }

