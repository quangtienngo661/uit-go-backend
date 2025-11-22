import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { driverPackage, DriverStatus, protoToEntityDriverStatus, createDriverStatusWrapper, mock_emails } from '@uit-go-backend/shared';
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
    const convertedStatus = protoToEntityDriverStatus(status.statusId);

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
        status: createDriverStatusWrapper(savedDriver.status),
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
      const result = await this.redisClient.geoadd(DRIVER_GEO_KEY, lng, lat, driverId);
      // add a new driver location with geo key and driverId, use geopos to get location later
    }
    return {
      "msg": "Location updated in redis successfully"
    }
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

    const nearbyDriversProto = geoResults.map(async data => {
      const existingDriver = await this.driverRepo.findOneBy({ id: data[0] });
      if (!existingDriver) {
        // Remove non-existing driver from Redis
        await this.redisClient.zrem(DRIVER_GEO_KEY, data[0]);
        return null;
      }
      
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

    const filteredDrivers = (await Promise.all(nearbyDriversProto)).filter(driver => driver !== null);
    const response: driverPackage.FindNearbyDriversResponse = {
      drivers: filteredDrivers
    }

    return response;
  };

  async getDriverProfile(request: driverPackage.GetDriverProfileRequest): Promise<driverPackage.GetDriverProfileResponse> {
    const { driverId } = request;

    const driver = await this.driverRepo.findOneBy({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver not found')
    }

    // TODO: use geopos to get driver current location as when a driver is online or busy, 
    // the location is stored in redis continually until goes offline
    const geoPos = await this.redisClient.geopos(DRIVER_GEO_KEY, driverId);

    const response = {
      data: {
        id: driver.id,
        status: createDriverStatusWrapper(driver.status),
        currentLat: geoPos[0] ? parseFloat(geoPos[0][1]) : driver.currentLat,
        currentLng: geoPos[0] ? parseFloat(geoPos[0][0]) : driver.currentLng,
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

    if (driver.status !== DriverStatus.ONLINE) {
      throw new Error('Driver is not available to accept the trip');
    }

    const geoPos = await this.redisClient.geopos(DRIVER_GEO_KEY, driverId);

    driver.status = DriverStatus.BUSY;
    driver.currentTripId = tripId;
    await this.driverRepo.save(driver);
    this.tripRmqClient.emit('driver.accepted', { tripId, driverId })

    const response = {
      data: {
        id: driver.id,
        status: createDriverStatusWrapper(driver.status),
        currentLat: geoPos[0] ? parseFloat(geoPos[0][1]) : driver.currentLat,
        currentLng: geoPos[0] ? parseFloat(geoPos[0][0]) : driver.currentLng,
        currentTripId: driver.currentTripId
      }
    }

    return response;
  };

  async rejectTrip(driverId: string, tripId: string) {
    const driver = await this.driverRepo.findOneBy({ id: driverId });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.status !== DriverStatus.ONLINE) {
      throw new Error('Driver is not available to reject the trip');
    }

    // Emit RabbitMQ message to trip service
    this.tripRmqClient.emit('driver.rejected', { tripId, driverId });

    return {
      success: true,
      message: 'Trip rejected successfully'
    };
  }

  // ====== RMQ Handler ======
  async handleTripCreated(data: any) {
    const request = {
      lng: data.pickupLng,
      lat: data.pickupLat,
      radius: 5
    }

    const nearbyDrivers = await this.findNearbyDrivers(request);
    data.potentialDrivers = [...nearbyDrivers.drivers];

    this.tripRmqClient.emit('invite.driver', data)
  }

  async handleTripCancelled(data: any) {
    const { driverId } = data;
    const driver = await this.driverRepo.findOneBy({ id: driverId });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    driver.status = DriverStatus.ONLINE;
    await this.driverRepo.save(driver);
  }

  async handleTripCompleted(data: any) {
    const { driverId } = data;
    const driver = await this.driverRepo.findOneBy({ id: driverId });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    
    driver.status = DriverStatus.ONLINE;
    driver.currentTripId = null;
    await this.driverRepo.save(driver);
  }
}
