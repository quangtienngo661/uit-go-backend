import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';

@Controller()
export class UsersController {

  constructor(private readonly usersService: UsersService) {}

  // passenger related
  @MessagePattern({ cmd: 'createPassenger' })
  createPassenger(@Payload() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @MessagePattern({ cmd: 'findAllPassengers' })
  findAllPassengers() {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'findOnePassenger' })
  findOne(@Payload() id: string) {
    return this.usersService.findOne(id);
  }

  @MessagePattern({ cmd: 'updatePassenger' })
  updatePassenger(@Payload() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto.id, updateUserDto);
  }

  @MessagePattern({ cmd: 'remove' })
  remove(@Payload() id: string) {
    return this.usersService.remove(id);
  }

  @MessagePattern({ cmd: 'getCurrentProfile' })
  getCurrentProfile(@Payload() userId: string) {
    return this.usersService.getCurrentProfile(userId);
  }

  // driver profile related
  @MessagePattern({ cmd: 'createDriverProfile' })
  createDriverProfile(
    @Payload() createDriverProfileDto: CreateDriverProfileDto
  ) {
    return this.usersService.createDriverProfile(createDriverProfileDto);
  }

  @MessagePattern({ cmd: 'findAllDriverProfiles' })
  findAllDriverProfiles() {
    return this.usersService.findAllDriverProfiles();
  }

  @MessagePattern({ cmd: 'findDriverProfile' })
  findDriverProfile(@Payload() id: string) {
    return this.usersService.findDriverProfile(id);
  }

  @MessagePattern({ cmd: 'updateDriverProfile' })
  updateDriverProfile(
    @Payload() updateDriverProfileDto: UpdateDriverProfileDto
  ) {
    return this.usersService.updateDriverProfile(
      updateDriverProfileDto.id,
      updateDriverProfileDto
    );
  }

  @MessagePattern({ cmd: 'removeDriverProfile' })
  removeDriverProfile(@Payload() id: string) {
    return this.usersService.removeDriverProfile(id);
  }

  @MessagePattern({ cmd: 'findDriverByEmail' })
  findDriverByEmail(email: string) {
    return this.usersService.findDriverByEmail(email);
  }

  @MessagePattern({ cmd: 'findPassengerByEmail' })
  findPassengerByEmail(email: string) {
    return this.usersService.findPassengerByEmail(email);
  }

  @MessagePattern({ cmd: 'findDriverByPassengerId'})
  findDriverByPassengerId(passengerId: string) {
    return this.usersService.findDriverByPassengerId(passengerId);
  }

  @MessagePattern({cmd: 'markVerified'})
  markVerified(@Payload() email: string) {
    return this.usersService.markVerified(email);
  }

  @MessagePattern({cmd: 'findUserByEmail'})
  findUserByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }



  // @MessagePattern({cmd: 'createUserFromSupabase'})
  // createUserFromSupabase(@Payload() payload: {createUserDto: CreateUserDto, supabaseId: string, email: string, isVerified: boolean}) {
  //   return this.usersService.createUserFromSupabase(payload);
  // }
}
