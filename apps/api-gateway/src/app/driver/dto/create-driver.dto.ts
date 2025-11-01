import { commonPackage, DriverStatus } from "@uit-go-backend/shared";
import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class CreateDriverDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(commonPackage.DriverStatus)
  @IsOptional()
  status?: commonPackage.DriverStatus;

  @IsNumber()
  @IsOptional()
  @IsLatitude()
  currentLat?: number;

  @IsNumber()
  @IsOptional()
  @IsLongitude()
  currentLng?: number;
}
