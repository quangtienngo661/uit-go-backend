import { IsDecimal, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { VerificationStatus, VehicleType } from "@uit-go-backend/shared";

export class CreateDriverProfileDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsEnum(VehicleType)
    @IsNotEmpty()
    vehicleType: VehicleType;

    @IsString()
    @IsNotEmpty()
    licensePlate: string;

    @IsOptional()
    @IsEnum(VerificationStatus)
    verificationStatus?: VerificationStatus;

    @IsOptional()
    @IsDecimal({ decimal_digits: '2' })
    @Min(0)
    @Max(5)
    rating?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    totalTrips?: number;
}
