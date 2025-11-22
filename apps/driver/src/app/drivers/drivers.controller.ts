import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DriversService } from './drivers.service';
import { driverPackage } from '@uit-go-backend/shared';

@Controller()
@driverPackage.DriverServiceControllerMethods()
export class DriversController implements driverPackage.DriverServiceController {
  constructor(private readonly driversService: DriversService) { }

  async updateStatus(request: driverPackage.UpdateStatusRequest): Promise<driverPackage.UpdateStatusResponse> {
    return this.driversService.updateStatus(request)
  };

  async updateLocation(request: driverPackage.UpdateLocationRequest): Promise<driverPackage.UpdateLocationResponse> {
    return this.driversService.updateLocation(request)
  };

  async findNearbyDrivers(request: driverPackage.FindNearbyDriversRequest): Promise<driverPackage.FindNearbyDriversResponse> {
    return this.driversService.findNearbyDrivers(request)
  };

  async getDriverProfile(request: driverPackage.GetDriverProfileRequest): Promise<driverPackage.GetDriverProfileResponse> {
    return this.driversService.getDriverProfile(request)
  };

  async acceptTrip(request: driverPackage.AcceptTripRequest): Promise<driverPackage.AcceptTripResponse> {
    return this.driversService.acceptTrip(request)
  };

  async rejectTrip(request: driverPackage.RejectTripRequest): Promise<driverPackage.RejectTripResponse> {
    return this.driversService.rejectTrip(request.driverId, request.tripId);
  }

  // @MessagePattern('createDriver')
  // create(@Payload() createDriverDto: CreateDriverDto) {
  //   return this.driversService.create(createDriverDto);
  // }

  // @MessagePattern('findAllDrivers')
  // findAll() {
  //   return this.driversService.findAll();
  // }

  // @MessagePattern('findOneDriver')
  // findOne(@Payload() id: number) {
  //   return this.driversService.findOne(id);
  // }

  // @MessagePattern('updateDriver')
  // update(@Payload() updateDriverDto: UpdateDriverDto) {
  //   // return this.driversService.update(updateDriverDto.id, updateDriverDto);
  // }

  // @MessagePattern('removeDriver')
  // remove(@Payload() id: number) {
  //   return this.driversService.remove(id);
  // }
}
