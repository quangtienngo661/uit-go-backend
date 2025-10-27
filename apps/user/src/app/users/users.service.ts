import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { Role } from '@uit-go-backend/shared';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>
  ) {}

  // passenger related
  async create(createUserDto: CreateUserDto): Promise<User> {
    createUserDto.role = Role.PASSENGER;
    const user = this.userRepository.create({
      ...createUserDto,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['driverProfile'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async getCurrentProfile(userId: string): Promise<User> {
    return this.findOne(userId);
  }

  // driver profile related
  async createDriverProfile(
    createDriverProfileDto: CreateDriverProfileDto
  ): Promise<DriverProfile> {
    const user = await this.userRepository.findOne({
      where: { id: createDriverProfileDto.userId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createDriverProfileDto.userId} not found`
      );
    }
    user.role = Role.DRIVER;
    await this.userRepository.save(user);

    const driverProfile = this.driverProfileRepository.create({
      ...createDriverProfileDto,
      user,
    });
    return this.driverProfileRepository.save(driverProfile);
  }

  async findAllDriverProfiles(): Promise<DriverProfile[]> {
    return this.driverProfileRepository.find({ relations: ['user'] });
  }

  async findDriverProfile(id: string): Promise<DriverProfile> {
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!driverProfile) {
      throw new NotFoundException(`Driver profile with ID ${id} not found`);
    }
    return driverProfile;
  }

  async updateDriverProfile(
    id: string,
    updateDriverProfileDto: UpdateDriverProfileDto
  ): Promise<DriverProfile> {
    const driverProfile = await this.findDriverProfile(id);
    Object.assign(driverProfile, updateDriverProfileDto);
    return this.driverProfileRepository.save(driverProfile);
  }

  async removeDriverProfile(id: string): Promise<void> {
    const driverProfile = await this.findDriverProfile(id);
    await this.driverProfileRepository.softRemove(driverProfile);
  }
}

