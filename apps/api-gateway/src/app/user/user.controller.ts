import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { SupabaseGuard } from '../../guards/auth/supabase.guard';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { Role } from '@uit-go-backend/shared';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // either gonna add admin later or most of this route cooked

  @Get()
  test(){
    console.log('test endpoint hit');
  }

  @Post('passengers')
  createPassenger(@Body() createUserDto: CreateUserDto) {
    return this.userService.createPassenger(createUserDto);
  }

  @Post('drivers')
  createDriverProfile(@Body() createDriverProfileDto: CreateDriverProfileDto) {
    return this.userService.createDriverProfile(createDriverProfileDto);
  }

  @Get('passengers')
  findAllPassengers() {
    return this.userService.findAllPassengers();
  }

  @Get('drivers')
  findAllDriverProfiles() {
    return this.userService.findAllDriverProfiles();
  }

  @Get('passengers/:id')
  findOnePassenger(@Param('id') id: string) {
    return this.userService.findOnePassenger(id);
  }

  @Get('drivers/:id')
  findOneDriver(@Param('id') id: string) {
    return this.userService.findOneDriverProfile(id);
  }

  @Patch('passengers/:id')
  updatePassenger(@Param('id') id: string,@Body() updateUserDto: UpdateUserDto) {
    return this.userService.updatePassenger(id, updateUserDto);
  }

  @Patch('drivers/:id')
  updateDriver(@Param('id') id: string,@Body() updateDriverProfileDto: UpdateDriverProfileDto) {
    return this.userService.updateDriverProfile(id, updateDriverProfileDto);
  }

  @Delete('passengers/:id')
  removePassenger(@Param('id') id: string) {
    return this.userService.removePassenger(id);
  }

  @Delete('drivers/:id')
  removeDriver(@Param('id') id: string) {
    return this.userService.removeDriverProfile(id);
  }

  // actually public ones
  @Get('current-profile')
  @UseGuards(SupabaseGuard)
  getCurrentProfile(@CurrentUser() user: any) {
    if(user?.role === Role.PASSENGER){
      return this.userService.findOnePassenger(user.id);
    }
    return this.userService.findOneDriverProfile(user.id);
  }

  @Patch('current-profile')
  @UseGuards(SupabaseGuard)
  updateCurrentProfile(@CurrentUser() user: any, @Body() body: any) {
    if(user?.role === Role.PASSENGER){
      return this.userService.updatePassenger(user.id, body);
    }
    return this.userService.updateDriverProfileByUserId(user.id, body);
  }
}
