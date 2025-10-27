import { PartialType } from '@nestjs/mapped-types'
import { CreateDriverProfileDto } from './create-driver-profile.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateDriverProfileDto extends PartialType(CreateDriverProfileDto) {
  @IsNotEmpty()
  id: string;
}
