import { Body, Controller, Get, Inject, OnModuleInit, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role, success, tripPackage } from '@uit-go-backend/shared';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SupabaseGuard } from '../../guards/auth/supabase.guard';
import { RolesGuard } from '../../guards/auth/roles.guard';
import { Roles } from '../../decorators/roles.decorator';

@Controller('trips')
@UseGuards(SupabaseGuard, RolesGuard)
export class TripController implements OnModuleInit {
  private tripServiceClient: tripPackage.TripServiceClient;

  constructor(
    @Inject(tripPackage.TRIP_SERVICE_NAME) private readonly tripClient: ClientGrpc
  ) { }

  onModuleInit() {
    console.log('Trip module initialized');
    this.tripServiceClient = this.tripClient.getService<tripPackage.TripServiceClient>(tripPackage.TRIP_SERVICE_NAME);
  }

  // ? Create Trip
  @Post()
  @Roles(Role.PASSENGER)
  async createTrip(@Body() body: tripPackage.CreateTripRequest) {
    const result = await firstValueFrom(this.tripServiceClient.createTrip(body));
    return success(result, 201, 'Trip created successfully');
  }

  // ? Get Trip by ID
  @Get(':tripId')
  @Roles(Role.PASSENGER, Role.DRIVER)
  async getTrip(@Param('tripId') tripId: string) {
    const result = await firstValueFrom(this.tripServiceClient.getTrip({ tripId }));
    return success(result, 200, 'Trip retrieved successfully');
  }

  // ? Cancel Trip
  @Patch(':tripId/cancel')
  @Roles(Role.PASSENGER, Role.DRIVER)
  async cancelTrip(@Param('tripId') tripId: string) {
    const result = await firstValueFrom(this.tripServiceClient.cancelTrip({ tripId }));
    return success(result, 200, 'Trip cancelled successfully');
  }

  // ? Assign Driver
  @Post(':tripId/assign-driver')
  @Roles(Role.DRIVER)
  async assignDriver(
    @Param('tripId') tripId: string,
    @Body() body: { driverId: string },
  ) {
    const result = this.tripServiceClient.assignDriver({
      tripId,
      driverId: body.driverId,
    });
    return success(result, 200, 'Driver assigned successfully');
  }

  // ? Start Trip
  @Patch(':tripId/start')
  @Roles(Role.DRIVER)
  async startTrip(@Param('tripId') tripId: string) {
    const result = await firstValueFrom(this.tripServiceClient.startTrip({ tripId }));
    return success(result, 200, 'Trip started successfully');
  }

  // ? Complete Trip
  @Patch(':tripId/complete')
  @Roles(Role.DRIVER)
  async completeTrip(@Param('tripId') tripId: string) {
    const result = await firstValueFrom(this.tripServiceClient.completeTrip({ tripId }));
    return success(result, 200, 'Trip completed successfully');
  }

  // ? Rate Trip
  @Post(':tripId/rating')
  @Roles(Role.PASSENGER, Role.DRIVER)
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
    const result = await firstValueFrom(this.tripServiceClient.rateTrip({
      tripId,
      ratedBy: body.ratedBy,
      ratedUser: body.ratedUser,
      raterRole: body.raterRole,
      rating: body.rating,
      comment: body.comment ?? '',
    }));
    return success(result, 200, 'Trip rated successfully');
  }

  // ? Trip History (by user)
  @Get('user/:userId')
  @Roles(Role.PASSENGER)
  async tripHistory(@Param('userId') userId: string) {
    const result = await firstValueFrom(this.tripServiceClient.tripHistory({ userId }));
    return success(result, 200, 'Trip history retrieved successfully');
  }
}
