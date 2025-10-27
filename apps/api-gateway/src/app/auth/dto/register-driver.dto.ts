import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsEnum } from 'class-validator';
import { VehicleType } from '@uit-go-backend/shared';

export class RegisterDriverDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Phone number must be between 10 and 15 digits',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @IsNotEmpty()
  vehicleColor: string;
}
