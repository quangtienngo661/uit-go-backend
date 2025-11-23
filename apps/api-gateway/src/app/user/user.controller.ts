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
import { Role, success } from '@uit-go-backend/shared';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // either gonna add admin later or most of this route cooked

  @Get()
  test(){
    console.log('test endpoint hit');
    return success(null, 200, 'Test endpoint hit successfully');
  }

  @Post('passengers')
  async createPassenger(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.createPassenger(createUserDto);
    return success(result, 201, 'Passenger created successfully');
  }

  @Post('drivers')
  async createDriverProfile(@Body() createDriverProfileDto: CreateDriverProfileDto) {
    const result = await this.userService.createDriverProfile(createDriverProfileDto);
    return success(result, 201, 'Driver profile created successfully');
  }

  @Get('passengers')
  async findAllPassengers() {
    const result = await this.userService.findAllPassengers();
    return success(result, 200, 'Passengers retrieved successfully');
  }

  @Get('drivers')
  async findAllDriverProfiles() {
    const result = await this.userService.findAllDriverProfiles();
    return success(result, 200, 'Driver profiles retrieved successfully');
  }

  @Get('passengers/:id')
  async findOnePassenger(@Param('id') id: string) {
    const result = await this.userService.findOnePassenger(id);
    return success(result, 200, 'Passenger retrieved successfully');
  }

  @Get('drivers/:id')
  async findOneDriver(@Param('id') id: string) {
    const result = await this.userService.findOneDriverProfile(id);
    return success(result, 200, 'Driver profile retrieved successfully');
  }

  @Patch('passengers/:id')
  async updatePassenger(@Param('id') id: string,@Body() updateUserDto: UpdateUserDto) {
    const result = await this.userService.updatePassenger(id, updateUserDto);
    return success(result, 200, 'Passenger updated successfully');
  }

  @Patch('drivers/:id')
  async updateDriver(@Param('id') id: string,@Body() updateDriverProfileDto: UpdateDriverProfileDto) {
    const result = await this.userService.updateDriverProfile(id, updateDriverProfileDto);
    return success(result, 200, 'Driver profile updated successfully');
  }

  @Delete('passengers/:id')
  async removePassenger(@Param('id') id: string) {
    const result = await this.userService.removePassenger(id);
    return success(result, 200, 'Passenger deleted successfully');
  }

  @Delete('drivers/:id')
  async removeDriver(@Param('id') id: string) {
    const result = await this.userService.removeDriverProfile(id);
    return success(result, 200, 'Driver profile deleted successfully');
  }

  // actually public ones
  @Get('current-profile')
  @UseGuards(SupabaseGuard)
  async getCurrentProfile(@CurrentUser() user: any) {
    let result;
    if(user?.role === Role.PASSENGER){
      result = await this.userService.findOnePassenger(user.id);
    } else {
      result = await this.userService.findOneDriverProfile(user.id);
    }
    return success(result, 200, 'Profile retrieved successfully');
  }

  @Patch('current-profile')
  @UseGuards(SupabaseGuard)
  async updateCurrentProfile(@CurrentUser() user: any, @Body() body: any) {
    let result;
    if(user?.role === Role.PASSENGER){
      result = await this.userService.updatePassenger(user.id, body);
    } else {
      result = await this.userService.updateDriverProfileByUserId(user.id, body);
    }
    return success(result, 200, 'Profile updated successfully');
  }
}
