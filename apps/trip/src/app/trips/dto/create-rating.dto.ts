import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Role } from '@uit-go-backend/shared';

export class CreateRatingDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsUUID()
  @IsNotEmpty()
  ratedBy: string;

  @IsUUID()
  @IsNotEmpty()
  ratedUser: string;

  @IsEnum(Role)
  @IsNotEmpty()
  raterRole: Role;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
