import { Body, Controller, Get, Inject, OnModuleInit, Param, Patch, Post, Query } from '@nestjs/common';
import { DriverService } from './driver.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ClientGrpc } from '@nestjs/microservices';
import { driverPackage, createDriverStatusWrapper, DriverStatus } from '@uit-go-backend/shared';
import { firstValueFrom } from 'rxjs';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';

@Controller('drivers')
export class DriverController implements OnModuleInit {
  private driverServiceClient: driverPackage.DriverServiceClient

  constructor(
    @Inject(driverPackage.DRIVER_SERVICE_NAME) private readonly driverClient: ClientGrpc
  ) { }

  onModuleInit() {
    console.log('Driver module initialized');
    this.driverServiceClient = this.driverClient.getService<driverPackage.DriverServiceClient>(driverPackage.DRIVER_SERVICE_NAME);
  }

  @Patch(':driverId/location')
  updateDriverLocation(@Param('driverId') driverId: string, @Body() updateDriverLocationDto: UpdateDriverLocationDto) {
    return this.driverServiceClient.updateLocation(
      {
        driverId,
        lng: updateDriverLocationDto.lng,
        lat: updateDriverLocationDto.lat,
      }
    )
  }

  @Patch(':driverId/status')
  updateDriverStatus(@Param('driverId') driverId: string, @Body() updateDriverDto: UpdateDriverDto) {
    // Convert proto enum to entity enum and create wrapper
    const entityStatus = this.protoStatusToEntity(updateDriverDto.status);
    
    return firstValueFrom(
      this.driverServiceClient.updateStatus(
        {
          driverId: driverId,
          status: createDriverStatusWrapper(entityStatus)
        }
      )
    )
  }

  // Helper to convert proto status to entity status
  private protoStatusToEntity(protoStatus: any): DriverStatus {
    switch (protoStatus) {
      case 1: return DriverStatus.OFFLINE;
      case 2: return DriverStatus.ONLINE;
      case 3: return DriverStatus.BUSY;
      default: return DriverStatus.OFFLINE;
    }
  }

  @Get('search')
  findNearbyDrivers(@Query() query) { // lat, lng, radius
    return this.driverServiceClient.findNearbyDrivers(query);
  }

  @Get(':driverId')
  getDriverProfile(@Param('driverId') driverId: string) {
    return firstValueFrom(this.driverServiceClient.getDriverProfile({ driverId }))
  }

  @Post(':driverId/accept-trip')
  acceptTrip(
    @Param('driverId') driverId: string,
    @Body() body: { tripId: string }
  ) {
    const request = {
      tripId: body.tripId, driverId
    }

    // console.log(request.tripId)S
    return this.driverServiceClient.acceptTrip(request);

    // return request
  }

  @Post(':driverId/reject-trip')
  rejectTrip(
    @Param('driverId') driverId: string,
    @Body() body: { tripId: string }
  ) {
    return this.driverServiceClient.rejectTrip({ 
      driverId, 
      tripId: body.tripId 
    });
  }
}
