import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mock_emails, REDIS_CLIENT, roleFromDB, roleToDB, tripPackage, TripStatus, tripStatusFromDB, vehicleTypeFromDB, vehicleTypeToDB } from '@uit-go-backend/shared';
import { Trip } from './entities/trip.entity';
import { Repository, Timestamp } from 'typeorm';
import { tripResponse, tripsResponse } from '../helpers/response';
import { Rating } from './entities/rating.entity';
import Redis from 'ioredis';
import { haversine } from '../helpers/haversine';
import { ClientGrpc, ClientProxy, RmqContext } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RoutingService } from '../routing/routing.service';
// import { RmqService } from '../rmqService/rmq.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Rating) private readonly ratingRepo: Repository<Rating>,
    @Inject('DRIVER_SERVICE_RMQ') private readonly driverRmqClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE_RMQ') private readonly notifRmqClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly routingService: RoutingService
    // private readonly rmqService: RmqService,
  ) { }

  async createTrip(request: tripPackage.CreateTripRequest): Promise<tripPackage.CreateTripResponse> {
    const { passengerId, pickup, dropoff, vehicleType } = request;

    // Get route from OSRM (with fallback to Haversine)
    const routeData = await this.routingService.getRoute(
      pickup.lat,
      pickup.lng,
      dropoff.lat,
      dropoff.lng,
      'car' // default profile, can be mapped from vehicleType later
    );

    // Calculate price based on distance (10000 VND/km base rate)
    const pricePerKm = 10000;
    const estimatedPrice = Math.round(routeData.distanceKm * pricePerKm);
    const finalPrice = estimatedPrice;

    const newTrip = this.tripRepo.create({
      passengerId: passengerId,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupAddress: pickup.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffAddress: dropoff.address,
      vehicleType: vehicleTypeToDB(vehicleType.typeId),
      tripStatus: TripStatus.SEARCHING,
      distanceKm: routeData.distanceKm,
      estimatedDuration: routeData.durationSeconds,
      routeGeometry: routeData.geometry ? JSON.stringify(routeData.geometry) : null,
      estimatedPrice,
      finalPrice,
      createdAt: new Date((new Date()).getTime() + 7 * 60 * 60 * 1000),
      ratings: []
    });

    await this.tripRepo.save(newTrip);

    this.driverRmqClient.emit(
      'trip.created',
      newTrip,
    );

    const passenger = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, newTrip.passengerId)
    )

    if (!passenger) {
      throw new NotFoundException('Passenger not found');
    }

    this.notifRmqClient.emit(
      'trip.created',
      { userEmail: passenger.email }
    );

    return tripResponse(newTrip);
  }

  async getTrip(request: tripPackage.GetTripRequest): Promise<tripPackage.GetTripResponse> {
    const { tripId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return tripResponse(trip);
  }

  async cancelTrip(request: tripPackage.CancelTripRequest,): Promise<tripPackage.CancelTripResponse> {
    const { tripId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const driver = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, trip.driverId)
    )
    
    if (!driver.email) 
      this.notifRmqClient.emit('trip.cancelled', { driverEmail: driver.email })

    trip.tripStatus = TripStatus.CANCELLED;
    trip.cancelledAt = new Date((new Date()).getTime() + 7 * 60 * 60 * 1000);
    const cancelledTrip = await this.tripRepo.save(trip);
    console.log(cancelledTrip.ratings);

    return tripResponse(cancelledTrip);
  }

  async assignDriver(request: tripPackage.AssignDriverRequest,): Promise<tripPackage.AssignDriverResponse> {
    const { tripId, driverId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const passenger = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, trip.passengerId)
    )

    this.notifRmqClient.emit('driver.accepted', { userEmail: passenger.email });

    trip.driverId = driverId;
    trip.tripStatus = TripStatus.ACCEPTED;
    trip.acceptedAt = new Date((new Date()).getTime() + 7 * 60 * 60 * 1000);
    const assignedTrip = await this.tripRepo.save(trip);

    return tripResponse(assignedTrip);
  }

  async completeTrip(request: tripPackage.CompleteTripRequest): Promise<tripPackage.CompleteTripResponse> {
    const { tripId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const passenger = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, trip.passengerId)
    )

    this.notifRmqClient.emit('trip.completed', { userEmail: passenger.email })
    this.driverRmqClient.emit('trip.completed', { driverId: trip.driverId })

    trip.tripStatus = TripStatus.COMPLETED;
    trip.completedAt = new Date((new Date()).getTime() + 7 * 60 * 60 * 1000);
    const completedTrip = await this.tripRepo.save(trip);

    return tripResponse(completedTrip);
  }

  async startTrip(request: tripPackage.CompleteTripRequest): Promise<tripPackage.CompleteTripResponse> {
    const { tripId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    trip.tripStatus = TripStatus.IN_PROGRESS;

    const passenger = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, trip.passengerId)
    )

    if (!passenger.email) {
      throw new NotFoundException('Passenger email not found');
    }

    this.notifRmqClient.emit('trip.started', { userEmail: passenger.email });
    this.driverRmqClient.emit('trip.started', { userEmail: trip.driverId });

    const startedTrip = await this.tripRepo.save(trip);

    return tripResponse(startedTrip);
  }

  async rejectTrip(request: tripPackage.RejectTripRequest): Promise<tripPackage.RejectTripResponse> {
    const { tripId } = request;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['ratings'], // load quan hệ ratings
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.tripStatus !== TripStatus.SEARCHING) {
      throw new Error('Trip is not in searching status');
    }

    // Re-invite trip
    this.inviteDriver(trip);

    return {}
  }

  async rateTrip(request: tripPackage.RateTripRequest): Promise<tripPackage.RateTripResponse> {
    const rateTripRequest = { ...request };

    const trip = await this.tripRepo.findOneBy({ id: rateTripRequest.tripId });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const newTripRating = this.ratingRepo.create({
      trip,
      ratedBy: rateTripRequest.ratedBy,
      ratedUser: rateTripRequest.ratedUser,
      raterRole: roleToDB(rateTripRequest.raterRole.roleId),
      rating: rateTripRequest.rating,
      comment: rateTripRequest.comment
    });

    const response = {
      success: true,
      tripRating: {
        id: newTripRating.id,
        tripId: newTripRating.trip.id,
        score: newTripRating.rating,  // 1-5 stars
        comment: newTripRating.comment,
        raterRole: {
          roleId: roleFromDB(newTripRating.raterRole),
          raterRole: newTripRating.raterRole
        }, // enum
        createdAt: newTripRating.createdAt.toString()
      }
    }

    return response
  }

  async tripHistory(request: tripPackage.TripHistoryRequest): Promise<tripPackage.TripHistoryResponse> {
    const { userId } = request;
    let trips = await this.tripRepo.findBy({ passengerId: userId });
    if (trips.length === 0) {
      trips = await this.tripRepo.findBy({ driverId: userId })
    }
    return tripsResponse(userId, trips);
  }

  async inviteDriver(invitedTrip: any) {
    const remainingDrivers = [...invitedTrip.potentialDrivers];

    if (remainingDrivers.length === 0) {
      this.cancelTrip({ tripId: invitedTrip.id })
      return;
    }

    const nextDriver = remainingDrivers[0]; // use for getting email later
    console.log(nextDriver)
    const driver = await firstValueFrom(
      this.userClient.send({ cmd: 'getCurrentProfile' }, nextDriver.driverId)
    )

    if (!driver) {
    }

    invitedTrip.potentialDrivers = remainingDrivers.splice(1);
    await this.tripRepo.save(invitedTrip);

    this.notifRmqClient.emit('trip.created', { driverEmail: driver.email });
  }
}
