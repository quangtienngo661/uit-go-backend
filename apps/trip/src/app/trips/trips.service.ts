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
// import { RmqService } from '../rmqService/rmq.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Rating) private readonly ratingRepo: Repository<Rating>,
    @Inject('DRIVER_SERVICE_RMQ') private readonly driverRmqClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE_RMQ') private readonly notifRmqClient: ClientProxy,

    // private readonly rmqService: RmqService,
  ) { }

  async createTrip(request: tripPackage.CreateTripRequest): Promise<tripPackage.CreateTripResponse> {
    const { passengerId, pickup, dropoff, vehicleType } = request;

    const distance = haversine(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);

    // TODO: handle price calculation
    const estimatedPrice = 10000; // mock
    const finalPrice = 10000;

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
      distanceKm: distance,
      estimatedPrice, finalPrice,
      createdAt: new Date(Date.now()),
      ratings: []
    });

    await this.tripRepo.save(newTrip);

    // TODO: handle rabbitMQ execution
    this.driverRmqClient.emit(
      'trip.created',
      newTrip,
    )

    this.notifRmqClient.emit(
      'trip.created',
      { userEmail: mock_emails.userEmail }
    )

    // Temporarily inject microservice to get drivers list

    // await this.tripQueue.add(
    //   'find-driver', 
    //   { tripId: newTrip.id }, 
    //   {
    //     attempts: 1, 
    //     ttl: 120000
    //   }
    // )

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

    // TODO: get email by userId
    this.notifRmqClient.emit('trip.cancelled', { email: mock_emails.driverEmail })

    trip.tripStatus = TripStatus.CANCELLED;
    trip.cancelledAt = new Date(Date.now())
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

    trip.driverId = driverId;
    trip.tripStatus = TripStatus.ACCEPTED;
    trip.acceptedAt = new Date(Date.now())
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

    // TODO: get email by userId, change driver state to online
    this.notifRmqClient.emit('trip.completed', { email: mock_emails.userEmail })

    trip.tripStatus = TripStatus.COMPLETED;
    trip.completedAt = new Date(Date.now())
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

    // TODO: get email by userId
    this.notifRmqClient.emit('trip.started', { email: mock_emails.userEmail })
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
    console.log(typeof remainingDrivers)
    if (remainingDrivers.length === 0) {
      // TODO: get email by userId
      this.notifRmqClient.emit('trip.cancelled', { driverEmail: 'example@gm.com' })
      this.cancelTrip({ tripId: invitedTrip.id })
      return;
    }

    const nextDriver = remainingDrivers[0]; // use for getting email later
    invitedTrip.potentialDrivers = remainingDrivers.splice(1);
    await this.tripRepo.save(invitedTrip);
    // TODO: get email by userId
    this.notifRmqClient.emit('trip.created', { driverEmail: mock_emails.driverEmail });
  }

  // async handleDriverAccepted(data: any, context: RmqContext) {
  //   const channel = context.getChannelRef();
  //   const originalMsg = context.getMessage();
  //   channel.ack(originalMsg);

  //   // if (data.tripStatus !== TripStatus.SEARCHING) {
  //   //   this.rmqService.sendDelayedTrip(data)
  //   // }

  //   const { tripId } = data;
  //   const trip = await this.tripRepo.findOne({
  //   where: { id: tripId },
  //   relations: ['ratings'], // load quan hệ ratings
  // });
  //   if (!trip) {
  //     throw new NotFoundException('Trip not found');
  //   }

  //   trip.acceptedAt = new Date(Date.now());
  //   trip.tripStatus = TripStatus.IN_PROGRESS;

  //   // this.rmqClient.emit('notify')
  // }

  // async handleTripTimeout(data: any, context: RmqContext) {
  //   const { tripId } = data;
  //   const trip = await this.tripRepo.findOne({ where: { id: tripId } });

  //   if (trip.tripStatus === TripStatus.SEARCHING) {
  //     trip.tripStatus = TripStatus.CANCELLED;
  //     await this.tripRepo.save(trip);
  //     console.log(`⏰ Trip ${tripId} timed out after 15s`);
  //   } else {
  //     console.log(`✅ Trip ${tripId} already accepted, ignore timeout`);
  //   }

  //   const channel = context.getChannelRef();
  //   const msg = context.getMessage();
  //   channel.ack(msg);
  // }
}
