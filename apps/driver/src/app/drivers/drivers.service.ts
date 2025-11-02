import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { driverPackage, DriverStatus, protoToEntityDriverStatus, entityToProtoDriverStatus, mock_emails } from '@uit-go-backend/shared';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { REDIS_CLIENT } from '@uit-go-backend/shared';
import Redis from 'ioredis';
import { ClientProxy } from '@nestjs/microservices';
// import { CreateDriverDto } from './dto/create-driver.dto';
// import { UpdateDriverDto } from './dto/update-driver.dto';

const DRIVER_GEO_KEY = 'online_driver_locations';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @Inject(REDIS_CLIENT) private redisClient: Redis,
    @Inject('TRIP_SERVICE_RMQ') private readonly tripRmqClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE_RMQ') private readonly notifRmqClient: ClientProxy,

  ) { }

  async updateStatus(request: driverPackage.UpdateStatusRequest): Promise<driverPackage.UpdateStatusResponse> {
    const { driverId, status } = request;
    const convertedStatus = protoToEntityDriverStatus(status);

    let driver = await this.driverRepo.findOneBy({ id: driverId });

    if (!driver) {
      driver = this.driverRepo.create({ id: driverId, status: convertedStatus });
    } else {
      driver.status = convertedStatus;
    }

    const savedDriver = await this.driverRepo.save(driver);

    return {
      id: savedDriver.id,
      data: {
        id: savedDriver.id,
        status,
        currentLat: savedDriver.currentLat,
        currentLng: savedDriver.currentLng,
        currentTripId: savedDriver.currentTripId,
      },
    };
  }

  async updateLocation(request: driverPackage.UpdateLocationRequest): Promise<driverPackage.UpdateLocationResponse> {
    const { driverId, lng, lat } = request;

    const driver = await this.driverRepo.findOneBy({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver not found!')
    }

    if (driver.status === DriverStatus.ONLINE || driver.status === DriverStatus.BUSY) {
      console.log(driver)
      const result = await this.redisClient.geoadd(DRIVER_GEO_KEY, lng, lat, driverId);
      console.log(result)
    }
    return {}
  };

  async findNearbyDrivers(request: driverPackage.FindNearbyDriversRequest): Promise<driverPackage.FindNearbyDriversResponse> {
    const { lng, lat, radius } = request;

    const geoResults = await this.redisClient.geosearch(
      DRIVER_GEO_KEY,
      "FROMLONLAT",
      lng, lat,
      "BYRADIUS",
      radius, 'km',
      'WITHDIST',
      'WITHCOORD',
      'COUNT', 10
    )

    const nearbyDriversProto = geoResults.map(data => {
      const result = {
        driverId: data[0],
        distance: parseFloat(data[1]),
        coord: {
          lng: parseFloat(data[2][0]),
          lat: parseFloat(data[2][1])
        } as driverPackage.Coordinate
      } as driverPackage.DriverWithLocation;

      return result;
    })
    const response: driverPackage.FindNearbyDriversResponse = {
      drivers: nearbyDriversProto
    }

    return response;
  };

  async getDriverProfile(request: driverPackage.GetDriverProfileRequest): Promise<driverPackage.GetDriverProfileResponse> {
    const { driverId } = request;

    const driver = await this.driverRepo.findOneBy({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver not found')
    }

    const response = {
      data: {
        id: driver.id,
        status: entityToProtoDriverStatus(driver.status),
        currentLat: driver.currentLat,
        currentLng: driver.currentLng,
        currentTripId: driver.currentTripId
      }
    }

    return response;
  };

  async acceptTrip(request: driverPackage.AcceptTripRequest): Promise<driverPackage.AcceptTripResponse> {
    const { driverId, tripId } = request;

    const driver = await this.driverRepo.findOneBy({ id: driverId });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.status = DriverStatus.BUSY;
    await this.driverRepo.save(driver);
    this.tripRmqClient.emit('driver.accepted', { tripId, driverId })
    // TODO: get email by userId
    // this.notifRmqClient.emit('driver.accepted', { email: mock_emails.userEmail })

    // Send message to Trip Driver that the trip is accepted

    const response = {
      data: {
        id: driver.id,
        status: entityToProtoDriverStatus(driver.status),
        currentLat: driver.currentLat,
        currentLng: driver.currentLng,
        currentTripId: driver.currentTripId
      }
    }

    return response;
  };

  // RMQ Handler
  async handleTripCreated(data: any) {
    const request = {
      lng: data.pickupLng,
      lat: data.pickupLat,
      radius: 5
    }

    const nearbyDrivers = await this.findNearbyDrivers(request);
    data.potentialDrivers = [...nearbyDrivers.drivers];

    this.tripRmqClient.emit('invite.driver', data)

    // console.log(data)
    // send invite to driver respectively if a driver rejects

  }

  // Note: add publish trip.cancelled for trip.q
}
