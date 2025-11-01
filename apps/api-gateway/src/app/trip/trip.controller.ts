import { Body, Controller, Get, Inject, OnModuleInit, Param, Patch, Post } from '@nestjs/common';
import { tripPackage } from '@uit-go-backend/shared';
import { ClientGrpc } from '@nestjs/microservices';

@Controller('trips')
export class TripController implements OnModuleInit {
  private tripServiceClient: tripPackage.TripServiceClient;

  constructor(
    @Inject(tripPackage.TRIP_SERVICE_NAME) private readonly tripClient: ClientGrpc
  ) { }

  onModuleInit() {
    console.log('Trip module initialized');
    this.tripServiceClient = this.tripClient.getService<tripPackage.TripServiceClient>(tripPackage.TRIP_SERVICE_NAME);
  }

  // ✅ Create Trip
  @Post()
  async createTrip(@Body() body: tripPackage.CreateTripRequest) {
    return this.tripServiceClient.createTrip(body);
  }

  // ✅ Get Trip by ID
  @Get(':tripId')
  async getTrip(@Param('tripId') tripId: string) {
    return this.tripServiceClient.getTrip({ tripId });
  }

  // ✅ Cancel Trip
  @Patch(':tripId/cancel')
  async cancelTrip(@Param('tripId') tripId: string) {
    return this.tripServiceClient.cancelTrip({ tripId });
  }

  // ✅ Assign Driver
  @Post(':tripId/assign-driver')
  async assignDriver(
    @Param('tripId') tripId: string,
    @Body() body: { driverId: string },
  ) {
    return this.tripServiceClient.assignDriver({
      tripId,
      driverId: body.driverId,
    });
  }

  // ✅ Start Trip
  @Patch(':tripId/start')
  async startTrip(@Param('tripId') tripId: string) {
    return this.tripServiceClient.startTrip({ tripId });
  }

  // ✅ Complete Trip
  @Patch(':tripId/complete')
  async completeTrip(@Param('tripId') tripId: string) {
    return this.tripServiceClient.completeTrip({ tripId });
  }

  // ✅ Rate Trip
  @Post(':tripId/rating')
  async rateTrip(
    @Param('tripId') tripId: string,
    @Body() body: {
      ratedBy: string;
      ratedUser: string;
      raterRole: tripPackage.RaterRole;
      rating: number;
      comment?: string;
    },
  ) {
    return this.tripServiceClient.rateTrip({
      tripId,
      ratedBy: body.ratedBy,
      ratedUser: body.ratedUser,
      raterRole: body.raterRole,
      rating: body.rating,
      comment: body.comment ?? '',
    });
  }

  // ✅ Trip History (by user)
  @Get('user/:userId')
  async tripHistory(@Param('userId') userId: string) {
    return this.tripServiceClient.tripHistory({ userId });
  }
}
