import { PartialType } from '@nestjs/mapped-types';
import { CreateTripDto } from './create-trip.dto';
import { IsEnum, IsOptional, IsNumber, IsUUID, Min } from 'class-validator';
import { TripStatus } from '@uit-go-backend/shared';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsEnum(TripStatus)
  @IsOptional()
  tripStatus?: TripStatus;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  distanceKm?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  finalPrice?: number;
}
