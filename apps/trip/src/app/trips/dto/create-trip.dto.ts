import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { VehicleType } from "@uit-go-backend/shared";

export class CreateTripDto {
  // Passenger
  @IsUUID()
  @IsNotEmpty()
  passengerId: string;

  // Pickup Location
  @IsNumber()
  @IsNotEmpty()
  @IsLatitude()
  pickupLat: number;

  @IsNumber()
  @IsNotEmpty()
  @IsLongitude()
  pickupLng: number;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  // Dropoff Location
  @IsNumber()
  @IsNotEmpty()
  @IsLatitude()
  dropoffLat: number;

  @IsNumber()
  @IsNotEmpty()
  @IsLongitude()
  dropoffLng: number;

  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  // Vehicle Type
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  // Optional fields
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedPrice?: number;
}
