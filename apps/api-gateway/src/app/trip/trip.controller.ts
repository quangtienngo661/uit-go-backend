import { Controller } from '@nestjs/common';
import { TripService } from './trip.service';

@Controller()
export class TripController {
  constructor(private readonly tripService: TripService) {}
}
