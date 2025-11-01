import { commonPackage, DriverStatus } from "@uit-go-backend/shared";
import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class UpdateDriverLocationDto {
    @IsNumber()
    @IsLongitude()
    lng: number;

    @IsNumber()
    @IsLatitude()
    lat?: number;
}
