import { CreateUserDto } from "./create-user.dto";
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNotEmpty()
  id: string;
}
