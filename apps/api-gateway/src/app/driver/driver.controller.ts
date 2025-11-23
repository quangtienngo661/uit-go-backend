import { Body, Controller, Get, Inject, OnModuleInit, Param, Patch, Post, Query } from '@nestjs/common';
import { DriverService } from './driver.service';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ClientGrpc } from '@nestjs/microservices';
import { driverPackage, createDriverStatusWrapper, DriverStatus, success } from '@uit-go-backend/shared';
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
  async updateDriverLocation(@Param('driverId') driverId: string, @Body() updateDriverLocationDto: UpdateDriverLocationDto) {
    const result = await firstValueFrom(
      this.driverServiceClient.updateLocation(
        {
          driverId,
          lng: updateDriverLocationDto.lng,
          lat: updateDriverLocationDto.lat,
        }
      )
    );
    return success(result, 200, 'Driver location updated successfully');
  }

  @Patch(':driverId/status')
  async updateDriverStatus(@Param('driverId') driverId: string, @Body() updateDriverDto: UpdateDriverDto) {
    // Convert proto enum to entity enum and create wrapper
    const entityStatus = this.protoStatusToEntity(updateDriverDto.status);
    
    const result = await firstValueFrom(
      this.driverServiceClient.updateStatus(
        {
          driverId: driverId,
          status: createDriverStatusWrapper(entityStatus)
        }
      )
    );
    return success(result, 200, 'Driver status updated successfully');
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
  async findNearbyDrivers(@Query() query) { // lat, lng, radius
    const result = await firstValueFrom(this.driverServiceClient.findNearbyDrivers(query));
    return success(result, 200, 'Nearby drivers retrieved successfully');
  }

  @Get(':driverId')
  async getDriverProfile(@Param('driverId') driverId: string) {
    const result = await firstValueFrom(this.driverServiceClient.getDriverProfile({ driverId }));
    return success(result, 200, 'Driver profile retrieved successfully');
  }

  @Post(':driverId/accept-trip')
  async acceptTrip(
    @Param('driverId') driverId: string,
    @Body() body: { tripId: string }
  ) {
    const request = {
      tripId: body.tripId, driverId
    };

    const result = await firstValueFrom(this.driverServiceClient.acceptTrip(request));
    return success(result, 200, 'Trip accepted successfully');
  }

  @Post(':driverId/reject-trip')
  async rejectTrip(
    @Param('driverId') driverId: string,
    @Body() body: { tripId: string }
  ) {
    const result = await firstValueFrom(
      this.driverServiceClient.rejectTrip({ 
        driverId, 
        tripId: body.tripId 
      })
    );
    return success(result, 200, 'Trip rejected successfully');
  }
}
