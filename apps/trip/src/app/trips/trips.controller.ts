import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Controller()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @MessagePattern('createTrip')
  create(@Payload() createTripDto: CreateTripDto) {
    return this.tripsService.create(createTripDto);
  }

  @MessagePattern('findAllTrips')
  findAll() {
    return this.tripsService.findAll();
  }

  @MessagePattern('findOneTrip')
  findOne(@Payload() id: number) {
    return this.tripsService.findOne(id);
  }

  @MessagePattern('updateTrip')
  update(@Payload() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(updateTripDto.id, updateTripDto);
  }

  @MessagePattern('removeTrip')
  remove(@Payload() id: number) {
    return this.tripsService.remove(id);
  }
}
