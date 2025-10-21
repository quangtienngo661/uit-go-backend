import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverDto } from './create-driver.dto';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { DriverStatus } from '@uit-go-backend/shared';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @IsNumber()
  @IsOptional()
  @IsLatitude()
  currentLat?: number;

  @IsNumber()
  @IsOptional()
  @IsLongitude()
  currentLng?: number;

  @IsUUID()
  @IsOptional()
  currentTripId?: string;
}
