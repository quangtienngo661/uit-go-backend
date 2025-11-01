import { Controller, OnModuleInit } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TripsService } from './trips.service';
import { tripPackage } from '@uit-go-backend/shared';

@Controller()
@tripPackage.TripServiceControllerMethods()
export class TripsController implements tripPackage.TripServiceController {
  constructor(private readonly tripsService: TripsService) { }

  async createTrip(request: tripPackage.CreateTripRequest): Promise<tripPackage.CreateTripResponse> {
    return await this.tripsService.createTrip(request);
  }

  async getTrip(request: tripPackage.GetTripRequest): Promise<tripPackage.GetTripResponse> {
    return await this.tripsService.getTrip(request);
  }

  async cancelTrip(request: tripPackage.CancelTripRequest): Promise<tripPackage.CancelTripResponse> {
    return await this.tripsService.cancelTrip(request);
  }

  async assignDriver(request: tripPackage.AssignDriverRequest): Promise<tripPackage.AssignDriverResponse> {
    return await this.tripsService.assignDriver(request);
  }

  async startTrip(request: tripPackage.StartTripRequest): Promise<tripPackage.StartTripResponse> {
    return await this.tripsService.startTrip(request);
  }

  async rejectTrip(request: tripPackage.RejectTripRequest): Promise<tripPackage.RejectTripResponse> {
    return await this.tripsService.rejectTrip(request);
  }

  async completeTrip(request: tripPackage.CompleteTripRequest): Promise<tripPackage.CompleteTripResponse> {
    return await this.tripsService.completeTrip(request);
  }

  async rateTrip(request: tripPackage.RateTripRequest): Promise<tripPackage.RateTripResponse> {
    return await this.tripsService.rateTrip(request);
  }

  async tripHistory(request: tripPackage.TripHistoryRequest): Promise<tripPackage.TripHistoryResponse> {
    return await this.tripsService.tripHistory(request);
  }
}
